import jwt from "jsonwebtoken";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";

export const COOKIE_NAME = "fa_token";
const SECRET = process.env.JWT_SECRET || "dev-only-secret";
const EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export async function getCurrentUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.uid) return null;

  await dbConnect();
  const user = await User.findById(decoded.uid).lean();
  if (!user) return null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}

export function requireAuth(req, res, next) {
  getCurrentUser(req)
    .then((user) => {
      if (!user) return res.status(401).json({ ok: false, error: "Unauthorized" });
      req.user = user;
      next();
    })
    .catch(next);
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    next();
  };
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
