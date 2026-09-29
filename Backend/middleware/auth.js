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
  let token = req.cookies?.[COOKIE_NAME];
  if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7).trim();
  }
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.uid) return null;

  await dbConnect();
  const user = await User.findById(decoded.uid).lean();
  if (!user) return null;

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
  const normalizedAllowed = roles.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const userRole = String(req.user.role || "").toLowerCase();
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ ok: false, error: "Forbidden - Insufficient permissions" });
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
