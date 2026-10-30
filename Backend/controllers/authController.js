import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { dbConnect } from "../lib/db.js";
import { sendPasswordResetMail } from "../lib/mailer.js";
import {
  sendWhatsAppOtp,
  normalizePhoneNumber,
  maskPhoneNumber,
} from "../lib/whatsapp.js";
import {
  clearAuthCookie,
  getCurrentUser,
  setAuthCookie,
  signToken,
} from "../middleware/auth.js";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(10, "Valid 10-digit mobile number is required").max(20),
  password: z.string().min(6).max(120),
  role: z.enum(["user", "customer", "vendor", "admin", "USER", "CUSTOMER", "VENDOR", "ADMIN"]).default("user"),
  businessName: z.string().max(120).optional(),
  ownerName: z.string().max(80).optional(),
  vendorType: z.string().optional(),
  address: z.string().max(250).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  pincode: z.string().max(20).optional(),
  profilePhoto: z.string().optional(),
  coverPhoto: z.string().optional(),
  aadhar: z.string().max(16).optional(),
  pan: z.string().max(16).optional(),
});

function publicUser(user) {
  const isVendor = String(user.role || "").toLowerCase() === "vendor";
  const isApproved = Boolean(
    isVendor &&
      user.vendorProfile?.approved &&
      user.vendorProfile?.verificationStatus === "approved"
  );

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isPhoneVerified: Boolean(user.isPhoneVerified),
    isApproved,
    verificationStatus: user.vendorProfile?.verificationStatus || (user.vendorProfile?.approved ? "approved" : "profile_incomplete"),
    vendorProfile: isVendor
      ? {
          businessName: user.vendorProfile?.businessName || "",
          ownerName: user.vendorProfile?.ownerName || user.name || "",
          vendorType: user.vendorProfile?.vendorType || "Individual",
          city: user.vendorProfile?.city || "",
          approved: Boolean(user.vendorProfile?.approved),
          verificationStatus: user.vendorProfile?.verificationStatus || "profile_incomplete",
          profilePhoto: user.vendorProfile?.profilePhoto || "",
        }
      : undefined,
  };
}

export async function login(req, res) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid email or password format" });

  await dbConnect();
  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  console.log(`[Login Attempt] Email: ${normalizedEmail}`);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !(await user.verifyPassword(parsed.data.password))) {
    console.warn(`[Login Failed] Invalid credentials for: ${normalizedEmail}`);
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }
  console.log(`[Login Succeeded] User: ${normalizedEmail}, Role: ${user.role}, PhoneVerified: ${user.isPhoneVerified}`);

  // Check if mobile phone is verified (Admins bypass verification)
  const configuredAdminEmail = String(process.env.ADMIN_EMAIL || "flipsaura187@gmail.com").trim().toLowerCase();
  if (normalizedEmail === configuredAdminEmail && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }
  const isAdmin =
    String(user.role || "").toLowerCase() === "admin" ||
    user.email === String(process.env.ADMIN_EMAIL || "").toLowerCase();

  if (!isAdmin && user.isPhoneVerified === false) {
    // Generate and send a fresh WhatsApp OTP for unverified user attempting login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.phoneOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.phoneOtpLastSent = new Date();
    await user.save();

    const sendResult = await sendWhatsAppOtp(user.phone, otp);

    return res.status(403).json({
      ok: false,
      requiresVerification: true,
      error: "Your mobile number is not verified yet. We have sent a verification OTP to your WhatsApp.",
      data: {
        email: user.email,
        phone: user.phone,
        maskedPhone: maskPhoneNumber(user.phone),
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      },
    });
  }

  const token = signToken({ uid: String(user._id), role: user.role });
  setAuthCookie(res, token);

  res.json({
    ok: true,
    data: {
      user: publicUser(user),
      token,
    },
  });
}

export async function register(req, res) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.flatten();
    const firstError = Object.values(issues.fieldErrors)?.[0]?.[0] || "Invalid input";
    return res.status(400).json({
      ok: false,
      error: firstError,
      issues,
    });
  }

  const {
    name,
    email,
    phone,
    password,
    role,
    businessName,
    ownerName,
    vendorType,
    address,
    city,
    state,
    pincode,
    profilePhoto,
    coverPhoto,
    aadhar,
    pan,
  } = parsed.data;

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return res.status(400).json({
      ok: false,
      error: "Please provide a valid 10-digit mobile number.",
    });
  }

  await dbConnect();

  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    if (user.isPhoneVerified) {
      return res.status(409).json({
        ok: false,
        error: "This email is already registered and verified. Please sign in.",
      });
    }
    // If user exists but is not verified, update their info and re-send OTP
    user.name = (ownerName || name).trim();
    user.phone = phone.trim();
    user.passwordHash = await User.hashPassword(password);
    user.role = String(role || "user").toLowerCase();
    if (user.role === "vendor") {
      user.vendorProfile = {
        businessName: businessName?.trim() || "",
        ownerName: (ownerName || name).trim(),
        vendorType: vendorType || "Individual",
        address: address?.trim() || "",
        city: city?.trim() || "",
        state: state?.trim() || "",
        pincode: pincode?.trim() || "",
        profilePhoto: profilePhoto || "",
        coverPhoto: coverPhoto || "",
        aadhar: aadhar?.trim() || "",
        pan: pan?.trim() || "",
        approved: false,
        verificationStatus: "profile_incomplete",
      };
    }
  } else {
    // Check if phone number is already verified under another account
    const phoneInUse = await User.findOne({
      phone: phone.trim(),
      isPhoneVerified: true,
    });
    if (phoneInUse) {
      return res.status(409).json({
        ok: false,
        error: "This mobile number is already registered and verified with another account.",
      });
    }

    const passwordHash = await User.hashPassword(password);
    const normalizedRole = String(role || "user").toLowerCase();
    user = new User({
      name: (ownerName || name).trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: normalizedRole,
      isPhoneVerified: false,
      vendorProfile:
        normalizedRole === "vendor"
          ? {
              businessName: businessName?.trim() || "",
              ownerName: (ownerName || name).trim(),
              vendorType: vendorType || "Individual",
              address: address?.trim() || "",
              city: city?.trim() || "",
              state: state?.trim() || "",
              pincode: pincode?.trim() || "",
              profilePhoto: profilePhoto || "",
              coverPhoto: coverPhoto || "",
              aadhar: aadhar?.trim() || "",
              pan: pan?.trim() || "",
              approved: false,
              verificationStatus: "profile_incomplete",
            }
          : undefined,
    });
  }

  // Generate 6-digit WhatsApp OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.phoneOtp = crypto.createHash("sha256").update(otp).digest("hex");
  user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  user.phoneOtpLastSent = new Date();
  await user.save();

  // Send WhatsApp OTP via FireClashPro
  const sendResult = await sendWhatsAppOtp(user.phone, otp);

  // Clear cookie: unverified user cannot log in
  clearAuthCookie(res);

  res.status(200).json({
    ok: true,
    requiresVerification: true,
    message: sendResult.success
      ? "Account created! A 6-digit OTP has been sent to your WhatsApp number."
      : (sendResult.error || "Account created! Please enter the OTP to verify your WhatsApp number."),
    data: {
      email: user.email,
      phone: user.phone,
      maskedPhone: maskPhoneNumber(user.phone),
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    },
  });
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ ok: false, error: "Email and 6-digit OTP are required" });
  }

  await dbConnect();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({ ok: false, error: "No account found with this email" });
  }

  if (user.isPhoneVerified) {
    return res.json({
      ok: true,
      message: "Phone number is already verified. Please sign in with your password.",
      data: {
        email: user.email,
        phone: user.phone,
      },
    });
  }

  if (!user.phoneOtp || !user.phoneOtpExpires) {
    return res.status(400).json({
      ok: false,
      error: "No active OTP found. Please request a new OTP.",
    });
  }

  if (new Date() > new Date(user.phoneOtpExpires)) {
    return res.status(400).json({
      ok: false,
      error: "This OTP has expired. Please request a new one.",
    });
  }

  const cleanOtp = String(otp).trim();
  const hashedInput = crypto.createHash("sha256").update(cleanOtp).digest("hex");

  // Validate OTP
  if (user.phoneOtp !== hashedInput && user.phoneOtp !== cleanOtp) {
    return res.status(400).json({
      ok: false,
      error: "Invalid OTP. Please check the code sent to your WhatsApp and try again.",
    });
  }

  // Mark user as phone verified and remove temporary OTP
  user.isPhoneVerified = true;
  user.phoneOtp = null;
  user.phoneOtpExpires = null;
  await user.save();

  // Ensure user is not auto-logged in: they must explicitly log in with their password
  clearAuthCookie(res);

  res.json({
    ok: true,
    message: "WhatsApp number verified successfully! Please sign in with your password.",
    data: {
      email: user.email,
      phone: user.phone,
    },
  });
}

export async function resendOtp(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ ok: false, error: "Email is required to resend OTP" });
  }

  await dbConnect();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({ ok: false, error: "No account found with this email" });
  }

  if (user.isPhoneVerified) {
    return res.json({
      ok: true,
      alreadyVerified: true,
      message: "Mobile number is already verified.",
    });
  }

  const now = Date.now();
  if (user.phoneOtpLastSent && now - new Date(user.phoneOtpLastSent).getTime() < 45000) {
    const waitSec = Math.ceil((45000 - (now - new Date(user.phoneOtpLastSent).getTime())) / 1000);
    return res.status(429).json({
      ok: false,
      error: `Please wait ${waitSec} seconds before requesting a new OTP.`,
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.phoneOtp = crypto.createHash("sha256").update(otp).digest("hex");
  user.phoneOtpExpires = new Date(now + 10 * 60 * 1000);
  user.phoneOtpLastSent = new Date(now);
  await user.save();

  const sendResult = await sendWhatsAppOtp(user.phone, otp);

  res.json({
    ok: true,
    message: sendResult.success
      ? "A fresh verification OTP has been sent to your WhatsApp."
      : (sendResult.error || "A fresh OTP has been generated."),
    data: {
      phone: user.phone,
      maskedPhone: maskPhoneNumber(user.phone),
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    },
  });
}

export function logout(req, res) {
  clearAuthCookie(res);
  res.json({ ok: true, data: { loggedOut: true } });
}

export async function me(req, res) {
  const user = await getCurrentUser(req);
  res.json({ ok: true, data: { user } });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ ok: false, error: "Email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  await dbConnect();
  const user = await User.findOne({ email: normalizedEmail });

  // Prevent account enumeration: return consistent success message
  if (!user) {
    return res.json({
      ok: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  }

  const now = Date.now();

  // Generate secure reset token and store hashed version in database
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(now + 24 * 3600000); // 24 hours
  user.resetPasswordLastSent = new Date(now);
  await user.save();

  const clientUrl = (
    process.env.CLIENT_URL ||
    process.env.FRONTEND_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");

  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

  try {
    const sendResult = await sendPasswordResetMail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    if (sendResult?.skipped) {
      console.warn("[forgotPassword] SMTP not configured. Token generated:", rawToken);
      return res.status(500).json({
        ok: false,
        error: "Email service is temporarily unavailable. Please contact support.",
      });
    }

    res.json({
      ok: true,
      message: "A password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error("[forgotPassword] Failed to send email:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to send reset email. Please try again in a few moments.",
    });
  }
}

export async function resetPassword(req, res) {
  const token = req.body.token || req.params.token;
  const newPassword = req.body.newPassword || req.body.password;

  if (!token) {
    return res.status(400).json({ ok: false, error: "Reset token is required" });
  }

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({
      ok: false,
      error: "Password must be at least 6 characters long",
    });
  }

  await dbConnect();

  // Find user with matching unexpired hashed or raw token
  const rawTokenTrimmed = token.trim();
  const hashedToken = crypto.createHash("sha256").update(rawTokenTrimmed).digest("hex");

  const user = await User.findOne({
    $or: [
      { resetPasswordToken: hashedToken },
      { resetPasswordToken: rawTokenTrimmed },
    ],
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({
      ok: false,
      error: "Invalid or expired password reset link. Please request a new one.",
    });
  }

  // Update password and invalidate reset token
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({
    ok: true,
    message: "Password has been successfully updated! You can now log in.",
  });
}
