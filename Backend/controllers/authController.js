import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { dbConnect } from "../lib/db.js";
import { sendMail } from "../lib/mailer.js";
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
  role: z.enum(["user", "vendor"]).default("user"),
  businessName: z.string().max(120).optional(),
  aadhar: z.string().max(12).optional(),
  pan: z.string().max(10).optional(),
});

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}

export async function login(req, res) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid input" });

  await dbConnect();
  const user = await User.findOne({ email: parsed.data.email });
  if (!user || !(await user.verifyPassword(parsed.data.password))) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  setAuthCookie(res, signToken({ uid: String(user._id), role: user.role }));
  res.json({ ok: true, data: { user: publicUser(user) } });
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

  const { name, email, phone, password, role, businessName, aadhar, pan } = parsed.data;
  await dbConnect();

  if (await User.findOne({ email })) {
    return res.status(409).json({ ok: false, error: "Email already in use" });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role,
    vendorProfile:
      role === "vendor" ? { businessName, aadhar, pan, approved: false } : undefined,
  });
  res.status(201).json({
    ok: true,
    data: {
      user: publicUser(user),
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
  if (!email) return res.status(400).json({ error: "Email required" });

  await dbConnect();
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: "If an account exists, you'll receive a reset link." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Reset your FlipsAura password",
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 1 hour.</p>`,
  });

  res.json({ message: "Reset email sent (if account exists)." });
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Missing token or password" });
  }

  await dbConnect();
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: "Password updated successfully" });
}
