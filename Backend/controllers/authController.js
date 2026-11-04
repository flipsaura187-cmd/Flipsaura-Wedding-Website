import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import Item from "../models/Item.js";
import Room from "../models/Room.js";
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
import {
  redisGet,
  redisGetJSON,
  redisSet,
  redisSetJSON,
  redisDel,
  redisAcquireLock,
  redisReleaseLock,
  redisIncrWithTTL,
  invalidateUserAuthCache,
} from "../lib/redis.js";

const LoginSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, "Password is required"),
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


/**
 * Automatically link admin-created listings matching a vendor's phone number to their vendor user account.
 */
export async function autoLinkAdminServicesToVendor(user) {
  if (!user || !user.phone) return;
  const cleanPhone = String(user.phone).replace(/\D/g, "").slice(-10);
  if (cleanPhone.length < 10) return;

  try {
    const phoneRegex = new RegExp(cleanPhone + "$");

    // Find all items where contactPhone matches this user's phone
    const matchingItems = await Item.find({
      contactPhone: phoneRegex,
    });

    if (matchingItems.length > 0) {
      // 1. Link items to this vendor
      await Item.updateMany(
        { contactPhone: phoneRegex },
        { $set: { vendor: user._id } }
      );

      // 2. Link rooms connected to these hotels
      const itemIds = matchingItems.map((i) => i._id);
      await Room.updateMany(
        { hotel: { $in: itemIds } },
        { $set: { vendor: user._id } }
      );

      // 3. Promote user to vendor role and mark approved
      user.role = "vendor";
      if (!user.vendorProfile) user.vendorProfile = {};
      user.vendorProfile.approved = true;
      user.vendorProfile.verificationStatus = "approved";
      if (!user.vendorProfile.businessName && matchingItems[0].title) {
        user.vendorProfile.businessName = matchingItems[0].title;
      }
      user.markModified("vendorProfile");
      await user.save();

      console.log(`[Auto-Link] Successfully linked ${matchingItems.length} items to vendor ${cleanPhone} (${user._id})`);
    }
  } catch (err) {
    console.error("[autoLinkAdminServicesToVendor Error]:", err);
  }
}

export async function login(req, res) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues?.[0]?.message || "Invalid mobile number, email, or password.";
    return res.status(400).json({ ok: false, error: errorMsg });
  }

  const rawInput = (parsed.data?.identifier || parsed.data?.email || parsed.data?.phone || "").trim();
  if (!rawInput) {
    return res.status(400).json({ ok: false, error: "Please enter your mobile number or email address." });
  }

  const isEmail = rawInput.includes("@");
  const cleanPhone = rawInput.replace(/\D/g, "").slice(-10);

  const normalizedEmail = isEmail ? rawInput.toLowerCase() : "";
  const rateLimitId = isEmail ? normalizedEmail : cleanPhone;

  // 1. Rate-limiting check: Shield against brute-force attacks via Redis (5 attempts / 15 min)
  const attemptsKey = `auth:login:attempts:${rateLimitId}`;
  const failedAttempts = await redisGet(attemptsKey);
  if (failedAttempts && Number(failedAttempts) >= 5) {
    return res.status(429).json({
      ok: false,
      error: "Too many failed login attempts. For security, please wait 15 minutes before trying again.",
    });
  }

  await dbConnect();
  console.log(`[Login Attempt] Identifier: ${rawInput}`);

  let user = null;
  if (isEmail) {
    user = await User.findOne({ email: normalizedEmail });
  } else if (cleanPhone.length >= 10) {
    user = await User.findOne({ phone: new RegExp(cleanPhone + "$") });
  }

  if (!user) {
    if (isEmail) {
      await redisSet(`auth:user:notfound:${normalizedEmail}`, "1", 60);
    }
    console.warn(`[Login Failed] User not found for: ${rawInput}`);
    return res.status(401).json({ ok: false, error: "Invalid credentials. No account found with these details." });
  }

  // 3. Strict password verification on the database user document
  const isPasswordValid = await user.verifyPassword(parsed.data.password);
  if (!isPasswordValid) {
    await redisIncrWithTTL(attemptsKey, 900); // 15 min TTL
    console.warn(`[Login Failed] Invalid password for: ${rawInput}`);
    return res.status(401).json({ ok: false, error: "Invalid credentials. Incorrect password." });
  }

  // Password matched: clear failed attempts counter
  await redisDel(attemptsKey);
  console.log(`[Login Succeeded] User: ${user.email || user.phone}, Role: ${user.role}`);

  // Ensure user phone is verified on successful login
  if (!user.isPhoneVerified) {
    user.isPhoneVerified = true;
    await user.save();
  }

  // Automatically link any services/venues/hotels created by Admin with this phone number!
  await autoLinkAdminServicesToVendor(user);

  // Check if admin email
  const configuredAdminEmail = String(process.env.ADMIN_EMAIL || "flipsaura187@gmail.com").trim().toLowerCase();
  if (user.email && user.email.toLowerCase() === configuredAdminEmail && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }

  // 4. Cache non-sensitive user metadata and active session in Redis
  await redisSetJSON(`auth:session:${user._id}`, {
    id: String(user._id),
    role: user.role,
    isPhoneVerified: Boolean(user.isPhoneVerified),
    loginAt: Date.now(),
  }, 604800); // 7 days (matches JWT expiration)

  await redisSetJSON(`auth:user:meta:${normalizedEmail}`, {
    id: String(user._id),
    email: user.email,
    role: user.role,
    isPhoneVerified: Boolean(user.isPhoneVerified),
  }, 3600); // 1 hour

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

  const normalizedEmail = email.trim().toLowerCase();

  // Prevent concurrent duplicate signup requests (15s distributed lock)
  const signupLockKey = `auth:signup:lock:${normalizedEmail}`;
  const lockAcquired = await redisAcquireLock(signupLockKey, 15);
  if (!lockAcquired) {
    return res.status(429).json({
      ok: false,
      error: "A registration request is already being processed for this email. Please wait a moment.",
    });
  }

  try {
    await dbConnect();
    // Invalidate negative lookup cache
    await redisDel(`auth:user:notfound:${normalizedEmail}`);

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

  // Store temporary signup verification data in Redis (10 min TTL)
  await redisSetJSON(`auth:signup:otp:${normalizedEmail}`, {
    email: normalizedEmail,
    phone: user.phone,
    hashedOtp: user.phoneOtp,
    expiresAt: user.phoneOtpExpires.getTime(),
  }, 600);
  await redisSet(`auth:signup:otp:cooldown:${normalizedEmail}`, "1", 45);

  // Send WhatsApp OTP via FireClashPro
  const sendResult = await sendWhatsAppOtp(user.phone, otp);

  // Clear cookie: unverified user cannot log in
  clearAuthCookie(res);

  res.status(200).json({
    ok: true,
    requiresVerification: true,
    message: sendResult.success
      ? "Account created! A 6-digit OTP has been sent to your mobile number via SMS / WhatsApp."
      : (sendResult.error || "Account created! Please enter the OTP to verify your mobile number."),
    data: {
      email: user.email,
      phone: user.phone,
      maskedPhone: maskPhoneNumber(user.phone),
      devOtp: otp,
    },
  });
  } finally {
    await redisReleaseLock(signupLockKey);
  }
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
  let isValid = (
    user.phoneOtp === hashedInput ||
    user.phoneOtp === cleanOtp ||
    cleanOtp === "123456"
  );
  if (!isValid && user.phone) {
    try {
      const { verifyTwilioCode } = await import("../lib/twilio.js");
      const twilioCheck = await verifyTwilioCode(user.phone, cleanOtp);
      if (twilioCheck.approved) isValid = true;
    } catch (e) {
      console.warn("[Twilio Verify Check Warning]:", e.message);
    }
  }
  if (!isValid) {
    return res.status(400).json({
      ok: false,
      error: "Invalid OTP. Please check the code sent to your phone and try again.",
    });
  }

  // Mark user as phone verified and remove temporary OTP
  user.isPhoneVerified = true;
  user.phoneOtp = null;
  user.phoneOtpExpires = null;
  await user.save();

  // Delete temporary Redis verification data and invalidate cached auth info
  await redisDel(`auth:signup:otp:${normalizedEmail}`);
  await redisDel(`auth:signup:otp:cooldown:${normalizedEmail}`);
  await invalidateUserAuthCache(normalizedEmail, user._id);

  // Ensure user is not auto-logged in: they must explicitly log in with their password
  clearAuthCookie(res);

  res.json({
    ok: true,
    message: "Mobile number verified successfully! Please sign in with your password.",
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

  // Check fast cooldown in Redis first
  const redisCooldown = await redisGet(`auth:signup:otp:cooldown:${normalizedEmail}`);
  if (redisCooldown) {
    return res.status(429).json({
      ok: false,
      error: "Please wait 45 seconds before requesting another OTP.",
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

  // Update temporary OTP cache and reset cooldown in Redis
  await redisSetJSON(`auth:signup:otp:${normalizedEmail}`, {
    email: normalizedEmail,
    phone: user.phone,
    hashedOtp: user.phoneOtp,
    expiresAt: user.phoneOtpExpires.getTime(),
  }, 600);
  await redisSet(`auth:signup:otp:cooldown:${normalizedEmail}`, "1", 45);

  const sendResult = await sendWhatsAppOtp(user.phone, otp);

  res.json({
    ok: true,
    message: sendResult.success
      ? "A fresh verification OTP has been sent to your mobile number via SMS / WhatsApp."
      : (sendResult.error || "A fresh OTP has been generated."),
    data: {
      phone: user.phone,
      maskedPhone: maskPhoneNumber(user.phone),
      devOtp: otp,
    },
  });
}

export async function logout(req, res) {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");
    if (token) {
      const { verifyToken } = await import("../middleware/auth.js");
      const decoded = verifyToken(token);
      if (decoded?.uid) {
        await redisDel(`auth:session:${decoded.uid}`);
      }
    }
  } catch (err) {
    // Gracefully ignore token extraction issues on logout
  }
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

  // Invalidate cached user metadata, session, and reset failed login attempt counters
  const userEmail = (user.email || "").toLowerCase().trim();
  await invalidateUserAuthCache(userEmail, user._id);
  await redisDel(`auth:login:attempts:${userEmail}`);

  res.json({
    ok: true,
    message: "Password has been successfully updated! You can now log in.",
  });
}


/**
 * Send OTP for mobile number login (SMS / WhatsApp)
 */
export async function sendLoginOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ ok: false, error: "Mobile number is required" });
    }

    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    if (cleanPhone.length < 10) {
      return res.status(400).json({ ok: false, error: "Please enter a valid 10-digit mobile number" });
    }

    await dbConnect();
    const phoneRegex = new RegExp(cleanPhone + "$");

    let user = await User.findOne({ phone: phoneRegex });

    // If user doesn't exist, check if Admin has created any items with this phone number
    if (!user) {
      const existingItems = await Item.find({ contactPhone: phoneRegex });
      if (existingItems.length > 0) {
        // Auto-create vendor account for this phone
        const businessName = existingItems[0].title || "Wedding Vendor";
        const generatedEmail = `vendor.${cleanPhone}@flipsaura.local`;
        const tempHash = await User.hashPassword("Flipsaura@Vendor2026");

        user = await User.create({
          name: businessName,
          email: generatedEmail,
          phone: cleanPhone,
          passwordHash: tempHash,
          role: "vendor",
          isPhoneVerified: true,
          vendorProfile: {
            businessName,
            ownerName: businessName,
            vendorType: "Business",
            city: existingItems[0].city || "Daudnagar",
            approved: true,
            verificationStatus: "approved",
          },
        });
      } else {
        // Auto-create user account for phone login
        const generatedEmail = `user.${cleanPhone}@flipsaura.local`;
        const tempHash = await User.hashPassword("Flipsaura@User2026");

        user = await User.create({
          name: `User ${cleanPhone.slice(-4)}`,
          email: generatedEmail,
          phone: cleanPhone,
          passwordHash: tempHash,
          role: "user",
          isPhoneVerified: true,
        });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.phoneOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.phoneOtpLastSent = new Date();
    await user.save();

    // Cache temporary OTP in Redis (10 min TTL)
    await redisSetJSON(`auth:login:otp:${cleanPhone}`, {
      phone: user.phone,
      hashedOtp: user.phoneOtp,
      expiresAt: user.phoneOtpExpires.getTime(),
    }, 600);

    // Send WhatsApp / SMS OTP
    const sendResult = await sendWhatsAppOtp(user.phone, otp);

    res.json({
      ok: true,
      message: sendResult.success
        ? "A 6-digit verification code has been sent to your mobile number via SMS / WhatsApp."
        : "Verification code generated! (Testing code 123456 can also be used).",
      data: {
        phone: user.phone,
        maskedPhone: maskPhoneNumber(user.phone),
        devOtp: otp,
      },
    });
  } catch (error) {
    console.error("[sendLoginOtp Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to dispatch verification code" });
  }
}

/**
 * Verify OTP for mobile number login and issue session token
 */
export async function verifyLoginOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ ok: false, error: "Mobile number and 6-digit OTP are required" });
    }

    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    const cleanOtp = String(otp).trim();

    await dbConnect();
    const phoneRegex = new RegExp(cleanPhone + "$");
    const user = await User.findOne({ phone: phoneRegex });

    if (!user) {
      return res.status(404).json({ ok: false, error: "No account found with this mobile number" });
    }

    const hashedInput = crypto.createHash("sha256").update(cleanOtp).digest("hex");

    let isValid = (
      user.phoneOtp === hashedInput ||
      user.phoneOtp === cleanOtp ||
      cleanOtp === "123456"
    );

    if (!isValid && user.phone) {
      try {
        const { verifyTwilioCode } = await import("../lib/twilio.js");
        const twilioCheck = await verifyTwilioCode(user.phone, cleanOtp);
        if (twilioCheck.approved) isValid = true;
      } catch (e) {
        console.warn("[Twilio Verify Check Warning]:", e.message);
      }
    }

    if (!isValid) {
      return res.status(400).json({ ok: false, error: "Invalid OTP code. Please enter valid 6-digit code or testing code 123456." });
    }

    // Mark user verified
    user.isPhoneVerified = true;
    user.phoneOtp = null;
    user.phoneOtpExpires = null;
    await user.save();

    // Auto-link all admin created services for this phone number
    await autoLinkAdminServicesToVendor(user);

    // Create session & JWT token
    const token = signToken({ uid: String(user._id), role: user.role });
    setAuthCookie(res, token);

    // Cache active session in Redis
    await redisSetJSON(`auth:session:${user._id}`, {
      id: String(user._id),
      role: user.role,
      isPhoneVerified: true,
      loginAt: Date.now(),
    }, 604800);

    res.json({
      ok: true,
      message: "Logged in successfully!",
      data: {
        user: publicUser(user),
        token,
      },
    });
  } catch (error) {
    console.error("[verifyLoginOtp Error]:", error);
    res.status(500).json({ ok: false, error: "Login failed" });
  }
}
