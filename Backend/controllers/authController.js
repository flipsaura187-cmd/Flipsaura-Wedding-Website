import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { dbConnect } from "../lib/db.js";
import { sendPasswordResetMail } from "../lib/mailer.js";
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
  phone: z.string().min(6).max(20).optional(),
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
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !(await user.verifyPassword(parsed.data.password))) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
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
    return res.status(400).json({
      ok: false,
      error: "Invalid input",
      issues: parsed.error.flatten(),
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

  await dbConnect();

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(409).json({ ok: false, error: "Email already in use" });
  }

  const passwordHash = await User.hashPassword(password);
  const normalizedRole = String(role || "user").toLowerCase();
  const user = await User.create({
    name: (ownerName || name).trim(),
    email: normalizedEmail,
    phone: phone?.trim(),
    passwordHash,
    role: normalizedRole,
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

  const token = signToken({ uid: String(user._id), role: user.role });
  setAuthCookie(res, token);

  res.status(201).json({
    ok: true,
    data: {
      user: publicUser(user),
      token,
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

  // Rate limiting / Cooldown for resending email (60 seconds)
  const now = Date.now();
  if (user.resetPasswordLastSent) {
    const diffMs = now - new Date(user.resetPasswordLastSent).getTime();
    if (diffMs < 60000) {
      const waitSec = Math.ceil((60000 - diffMs) / 1000);
      return res.status(429).json({
        ok: false,
        error: `Please wait ${waitSec} second${waitSec > 1 ? "s" : ""} before requesting another reset email.`,
        retryAfter: waitSec,
      });
    }
  }

  // Generate secure reset token and store hashed version in database
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(now + 3600000); // 1 hour
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
