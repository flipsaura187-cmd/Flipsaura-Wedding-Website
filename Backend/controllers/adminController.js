import crypto from "node:crypto";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Item from "../models/Item.js";
import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import Blog from "../models/Blog.js";
import Review from "../models/Review.js";
import { calculateVendorCompletion } from "../lib/vendorVerification.js";
import { syncVendorServicesToItems } from "../lib/vendorSync.js";
import { autoLinkAdminServicesToVendor } from "./authController.js";
import { sendVendorLoginMail } from "../lib/mailer.js";

const KNOWN_VENDOR_LOGIN_EMAILS = [
  { match: (name) => name.includes("saraswati"), email: "hotelsaraswatiinn@gmail.com" },
  {
    match: (name) => name.includes("imperial") && name.includes("hotel") && !name.startsWith("test"),
    email: "reservation@hotelimperial.co.in",
  },
];

function vendorDisplayName(vendor) {
  return String(vendor?.vendorProfile?.businessName || vendor?.name || "").trim();
}

function resolveKnownVendorEmail(vendor) {
  const name = vendorDisplayName(vendor).toLowerCase();
  if (!name) return null;
  const hit = KNOWN_VENDOR_LOGIN_EMAILS.find((entry) => entry.match(name));
  return hit?.email || null;
}

function isPlaceholderEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  return !value || value.endsWith("@imported.flipsaura.local");
}

function generateVendorPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

export async function getAdminStats(req, res) {
  await dbConnect();

  const [users, items, bookings, categories, revenueAgg, vendorsCount, pendingVendorsCount] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments(),
    Booking.countDocuments(),
    Category.countDocuments(),
    Booking.aggregate([
      { $match: { status: { $in: ["paid", "confirmed", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    User.countDocuments({ role: "vendor" }),
    User.countDocuments({
      role: "vendor",
      "vendorProfile.verificationStatus": { $in: ["under_review", "pending_verification"] },
    }),
  ]);

  res.json({
    ok: true,
    data: {
      stats: {
        users,
        items,
        bookings,
        categories,
        revenue: revenueAgg[0]?.total || 0,
        vendors: vendorsCount,
        pendingVendors: pendingVendorsCount,
      },
    },
  });
}

export async function getUsers(req, res) {
  try {
    await dbConnect();
    const { search, role, phoneVerified } = req.query;

    const query = {};

    if (role && role !== "all") {
      if (role === "customer" || role === "user") {
        query.role = { $in: ["user", "customer"] };
      } else {
        query.role = role.toLowerCase().trim();
      }
    }

    if (phoneVerified !== undefined && phoneVerified !== "all") {
      query.isPhoneVerified = phoneVerified === "true" || phoneVerified === true;
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: sRegex },
        { email: sRegex },
        { phone: sRegex },
        { "vendorProfile.businessName": sRegex },
        { "vendorProfile.ownerName": sRegex },
        { "vendorProfile.city": sRegex },
      ];
    }

    const [users, totalUsers, customerCount, vendorCount, adminCount, verifiedCount] = await Promise.all([
      User.find(query, { passwordHash: 0, phoneOtp: 0, resetPasswordToken: 0 })
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(),
      User.countDocuments({ role: { $in: ["user", "customer"] } }),
      User.countDocuments({ role: "vendor" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isPhoneVerified: true }),
    ]);

    res.json({
      ok: true,
      data: {
        users,
        total: users.length,
        stats: {
          total: totalUsers,
          customers: customerCount,
          vendors: vendorCount,
          admins: adminCount,
          phoneVerified: verifiedCount,
        },
      },
    });
  } catch (error) {
    console.error("[getUsers Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch users directory" });
  }
}

export async function updateUser(req, res) {
  try {
    const { id, role, approved, isPhoneVerified, name, phone } = req.body;
    await dbConnect();

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    if (name && typeof name === "string") user.name = name.trim();
    if (phone && typeof phone === "string") user.phone = phone.trim();
    if (role && typeof role === "string") user.role = role.toLowerCase().trim();
    if (typeof isPhoneVerified === "boolean") user.isPhoneVerified = isPhoneVerified;

    if (typeof approved === "boolean" && user.role === "vendor") {
      if (!user.vendorProfile) user.vendorProfile = {};
      user.vendorProfile.approved = approved;
      user.vendorProfile.verificationStatus = approved ? "approved" : "under_review";
      user.vendorProfile.reviewedAt = new Date();
      if (approved) {
        user.vendorProfile.rejectionReason = "";
        if (Array.isArray(user.vendorProfile.documents)) {
          user.vendorProfile.documents.forEach((d) => {
            if (d.status !== "rejected") {
              d.status = "verified";
              d.verifiedAt = new Date();
            }
          });
        }
        if (user.vendorProfile.bankDetails) {
          if (user.vendorProfile.bankDetails.status !== "rejected") {
            user.vendorProfile.bankDetails.status = "verified";
            user.vendorProfile.bankDetails.verifiedAt = new Date();
          }
        }
      }
      user.markModified("vendorProfile");
    }

    await user.save();
    res.json({
      ok: true,
      message: "User updated successfully",
      data: {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified,
          approved: user.vendorProfile?.approved,
          verificationStatus: user.vendorProfile?.verificationStatus,
        },
      },
    });
  } catch (error) {
    console.error("[updateUser Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update user" });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await dbConnect();

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    // Protect primary platform administrator from accidental deletion
    const adminEmail = String(process.env.ADMIN_EMAIL || "flipsaura187@gmail.com").toLowerCase().trim();
    if (user.email.toLowerCase().trim() === adminEmail) {
      return res.status(403).json({ ok: false, error: "Primary system administrator cannot be deleted" });
    }

    await User.findByIdAndDelete(id);
    res.json({ ok: true, message: `User "${user.name || user.email}" removed successfully` });
  } catch (error) {
    console.error("[deleteUser Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to delete user" });
  }
}

export async function getAdminBlogs(req, res) {
  await dbConnect();
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json({ ok: true, data: blogs, blogs });
}

export async function getVendorStats(req, res) {
  await dbConnect();

  let user = await User.findById(req.user.id);
  if (user && user.phone) {
    await autoLinkAdminServicesToVendor(user);
    user = await User.findById(req.user.id).lean();
  } else if (user) {
    user = user.toObject();
  }

  const cleanPhone = (user?.phone || "").replace(/\D/g, "").slice(-10);
  const itemFilter = cleanPhone.length >= 10
    ? { $or: [{ vendor: req.user.id }, { contactPhone: new RegExp(cleanPhone + "$") }] }
    : { vendor: req.user.id };

  const completion = user ? calculateVendorCompletion(user) : null;

  const [items, bookings, revenueAgg] = await Promise.all([
    Item.countDocuments(itemFilter),
    Booking.countDocuments({ vendor: req.user.id }),
    Booking.aggregate([
      { $match: { vendor: req.user.id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const hasPhoneServices = cleanPhone.length >= 10 && items > 0;
  const isApproved = Boolean(
    (user?.vendorProfile?.approved && user?.vendorProfile?.verificationStatus === "approved") ||
    hasPhoneServices
  );

  res.json({
    ok: true,
    data: {
      stats: {
        items,
        bookings,
        revenue: revenueAgg[0]?.total || 0,
        isApproved,
        verificationStatus: isApproved ? "approved" : (user?.vendorProfile?.verificationStatus || "profile_incomplete"),
        completionPercentage: isApproved ? 100 : (completion?.percentage || 0),
        rejectionReason: user?.vendorProfile?.rejectionReason || "",
      },
    },
  });
}

/**
 * Admin: List all vendors with filtering, search, and verification metrics.
 */
export async function getAdminVendors(req, res) {
  await dbConnect();

  const { status, search, vendorType, city } = req.query;

  const query = { role: "vendor" };

  if (vendorType) {
    query["vendorProfile.vendorType"] = new RegExp(`^${vendorType}$`, "i");
  }

  if (city) {
    query["vendorProfile.city"] = new RegExp(`^${city}$`, "i");
  }

  if (status && status !== "all") {
    if (status === "approved") {
      query["vendorProfile.approved"] = true;
    } else if (status === "under_review") {
      query["vendorProfile.verificationStatus"] = { $in: ["under_review", "pending_verification"] };
    } else {
      query["vendorProfile.verificationStatus"] = status;
    }
  }

  if (search) {
    const sRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { name: sRegex },
      { email: sRegex },
      { phone: sRegex },
      { "vendorProfile.businessName": sRegex },
      { "vendorProfile.ownerName": sRegex },
      { "vendorProfile.city": sRegex },
    ];
  }

  const vendors = await User.find(query)
    .select("-passwordHash -vendorProfile.profilePhoto -vendorProfile.coverPhoto -vendorProfile.about")
    .populate("vendorProfile.categories", "name")
    .sort({ createdAt: -1 })
    .lean();

  const formattedVendors = vendors.map((v) => {
    const comp = calculateVendorCompletion(v);
    return {
      _id: v._id,
      name: v.name,
      email: v.email,
      phone: v.phone,
      businessName: v.vendorProfile?.businessName || v.name,
      ownerName: v.vendorProfile?.ownerName || v.name,
      vendorType: v.vendorProfile?.vendorType || "Individual",
      city: v.vendorProfile?.city || "—",
      state: v.vendorProfile?.state || "—",
      categories: (v.vendorProfile?.categories || []).map((c) => c.name || c),
      completionPercentage: comp.percentage,
      isProfileComplete: comp.isProfileComplete,
      kycStatus: comp.kycStatus,
      bankStatus: comp.bankStatus,
      verificationStatus: comp.verificationStatus,
      accountStatus: v.vendorProfile?.approved ? "Approved" : comp.verificationStatus,
      approved: Boolean(v.vendorProfile?.approved),
      documentsCount: (v.vendorProfile?.documents || []).length,
      createdAt: v.createdAt,
      submittedAt: v.vendorProfile?.submittedAt,
    };
  });

  // Calculate high-level summary counts for tab counters
  const [totalCount, underReviewCount, approvedCount, incompleteCount, rejectedCount] = await Promise.all([
    User.countDocuments({ role: "vendor" }),
    User.countDocuments({ role: "vendor", "vendorProfile.verificationStatus": { $in: ["under_review", "pending_verification"] } }),
    User.countDocuments({ role: "vendor", "vendorProfile.approved": true }),
    User.countDocuments({ role: "vendor", "vendorProfile.verificationStatus": "profile_incomplete" }),
    User.countDocuments({ role: "vendor", "vendorProfile.verificationStatus": "rejected" }),
  ]);

  res.json({
    ok: true,
    data: {
      vendors: formattedVendors,
      counts: {
        total: totalCount,
        underReview: underReviewCount,
        approved: approvedCount,
        incomplete: incompleteCount,
        rejected: rejectedCount,
      },
    },
  });
}

/**
 * Admin: Get complete verification profile for a specific vendor.
 */
export async function getAdminVendorDetail(req, res) {
  await dbConnect();

  const { id } = req.params;
  const vendor = await User.findById(id, { passwordHash: 0 })
    .populate("vendorProfile.categories")
    .populate("vendorProfile.servicesList.category")
    .populate("vendorProfile.portfolio.serviceCategory");

  if (!vendor || vendor.role !== "vendor") {
    return res.status(404).json({ ok: false, error: "Vendor not found" });
  }

  // Fetch vendor items/services
  const items = await Item.find({ vendor: vendor._id }).populate("category").lean();

  // Fetch vendor bookings
  const bookings = await Booking.find({ vendor: vendor._id }).populate("item").sort({ createdAt: -1 }).limit(10).lean();

  // Fetch reviews for vendor's items
  const itemIds = items.map((it) => it._id);
  const reviews = itemIds.length > 0 ? await Review.find({ item: { $in: itemIds } }).sort({ createdAt: -1 }).limit(10).lean() : [];

  const completion = calculateVendorCompletion(vendor);

  res.json({
    ok: true,
    data: {
      vendor,
      completion,
      items,
      bookings,
      reviews,
    },
  });
}

/**
 * Admin: Verify or reject an individual document for a vendor.
 */
export async function reviewAdminVendorDocument(req, res) {
  await dbConnect();

  const { id, docType } = req.params;
  const { action, rejectionReason } = req.body;

  if (!action || !["verify", "reject"].includes(action)) {
    return res.status(400).json({ ok: false, error: "Action must be 'verify' or 'reject'" });
  }

  if (action === "reject" && !rejectionReason?.trim()) {
    return res.status(400).json({
      ok: false,
      error: "A clear rejection reason is required when rejecting a document.",
    });
  }

  const vendor = await User.findById(id);
  if (!vendor || vendor.role !== "vendor") {
    return res.status(404).json({ ok: false, error: "Vendor not found" });
  }

  if (!Array.isArray(vendor.vendorProfile?.documents)) {
    return res.status(404).json({ ok: false, error: "No documents found for this vendor" });
  }

  const doc = vendor.vendorProfile.documents.find((d) => d.docType === docType);
  if (!doc) {
    return res.status(404).json({ ok: false, error: `Document ${docType} not found` });
  }

  if (action === "verify") {
    doc.status = "verified";
    doc.rejectionReason = "";
    doc.verifiedAt = new Date();
  } else {
    doc.status = "rejected";
    doc.rejectionReason = rejectionReason.trim();
    doc.verifiedAt = null;

    // If a document is rejected, the vendor verification status should indicate issues
    if (vendor.vendorProfile.verificationStatus === "approved") {
      vendor.vendorProfile.approved = false;
      vendor.vendorProfile.verificationStatus = "rejected";
      vendor.vendorProfile.rejectionReason = `Document rejected: ${doc.name} - ${rejectionReason.trim()}`;
    }
  }

  // If this was a cancelled cheque, sync bankDetails status
  if (docType === "cancelled_cheque" || docType === "bank_proof") {
    if (vendor.vendorProfile.bankDetails) {
      if (action === "verify") {
        vendor.vendorProfile.bankDetails.status = "verified";
        vendor.vendorProfile.bankDetails.rejectionReason = "";
      } else {
        vendor.vendorProfile.bankDetails.status = "rejected";
        vendor.vendorProfile.bankDetails.rejectionReason = rejectionReason.trim();
      }
    }
  }

  await vendor.save();

  const completion = calculateVendorCompletion(vendor);

  res.json({
    ok: true,
    message: `Document ${doc.name} ${action === "verify" ? "verified" : "rejected"} successfully.`,
    data: {
      document: doc,
      completion,
    },
  });
}

/**
 * Admin: Verify or reject Bank Details for a vendor.
 */
export async function reviewAdminVendorBank(req, res) {
  await dbConnect();

  const { id } = req.params;
  const { action, rejectionReason } = req.body;

  if (!action || !["verify", "reject"].includes(action)) {
    return res.status(400).json({ ok: false, error: "Action must be 'verify' or 'reject'" });
  }

  if (action === "reject" && !rejectionReason?.trim()) {
    return res.status(400).json({
      ok: false,
      error: "A clear rejection reason is required when rejecting bank details.",
    });
  }

  const vendor = await User.findById(id);
  if (!vendor || vendor.role !== "vendor") {
    return res.status(404).json({ ok: false, error: "Vendor not found" });
  }

  if (!vendor.vendorProfile?.bankDetails) {
    return res.status(404).json({ ok: false, error: "Bank details not found for this vendor" });
  }

  if (action === "verify") {
    vendor.vendorProfile.bankDetails.status = "verified";
    vendor.vendorProfile.bankDetails.rejectionReason = "";
    vendor.vendorProfile.bankDetails.verifiedAt = new Date();
  } else {
    vendor.vendorProfile.bankDetails.status = "rejected";
    vendor.vendorProfile.bankDetails.rejectionReason = rejectionReason.trim();
    vendor.vendorProfile.bankDetails.verifiedAt = null;

    if (vendor.vendorProfile.verificationStatus === "approved") {
      vendor.vendorProfile.approved = false;
      vendor.vendorProfile.verificationStatus = "rejected";
      vendor.vendorProfile.rejectionReason = `Bank details rejected: ${rejectionReason.trim()}`;
    }
  }

  await vendor.save();

  const completion = calculateVendorCompletion(vendor);

  res.json({
    ok: true,
    message: `Bank details ${action === "verify" ? "verified" : "rejected"} successfully.`,
    data: {
      bankDetails: vendor.vendorProfile.bankDetails,
      completion,
    },
  });
}

/**
 * Admin: Final vendor status update (Approve, Reject, Suspend, Block).
 */
export async function updateAdminVendorStatus(req, res) {
  await dbConnect();

  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  const validStatuses = ["approved", "rejected", "suspended", "blocked", "under_review"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      ok: false,
      error: `Status must be one of: ${validStatuses.join(", ")}`,
    });
  }

  if (status === "rejected" && !rejectionReason?.trim()) {
    return res.status(400).json({
      ok: false,
      error: "A rejection reason is required when rejecting a vendor.",
    });
  }

  const vendor = await User.findById(id);
  if (!vendor || vendor.role !== "vendor") {
    return res.status(404).json({ ok: false, error: "Vendor not found" });
  }

  if (!vendor.vendorProfile) {
    vendor.vendorProfile = {};
  }

  if (status === "approved") {
    vendor.vendorProfile.approved = true;
    vendor.vendorProfile.verificationStatus = "approved";
    vendor.vendorProfile.rejectionReason = "";
    vendor.vendorProfile.reviewedAt = new Date();

    // Automatically mark all uploaded documents and bank details as verified (unless rejected)
    if (Array.isArray(vendor.vendorProfile.documents)) {
      vendor.vendorProfile.documents.forEach((d) => {
        if (d.status !== "rejected") {
          d.status = "verified";
          d.verifiedAt = new Date();
        }
      });
    }
    if (vendor.vendorProfile.bankDetails) {
      if (vendor.vendorProfile.bankDetails.status !== "rejected") {
        vendor.vendorProfile.bankDetails.status = "verified";
        vendor.vendorProfile.bankDetails.verifiedAt = new Date();
      }
    }
  } else if (status === "rejected") {
    vendor.vendorProfile.approved = false;
    vendor.vendorProfile.verificationStatus = "rejected";
    vendor.vendorProfile.rejectionReason = rejectionReason.trim();
    vendor.vendorProfile.reviewedAt = new Date();
  } else if (status === "suspended") {
    vendor.vendorProfile.approved = false;
    vendor.vendorProfile.verificationStatus = "suspended";
    vendor.vendorProfile.reviewedAt = new Date();
  } else if (status === "blocked") {
    vendor.vendorProfile.approved = false;
    vendor.vendorProfile.verificationStatus = "blocked";
    vendor.vendorProfile.reviewedAt = new Date();
  } else if (status === "under_review") {
    vendor.vendorProfile.approved = false;
    vendor.vendorProfile.verificationStatus = "under_review";
  }

  vendor.markModified("vendorProfile");
  await vendor.save();

  // If approved, automatically sync their services to active Item listings
  if (status === "approved") {
    try {
      await syncVendorServicesToItems(vendor._id);
    } catch (e) {
      console.error("Auto-sync vendor services error:", e);
    }
  }

  const completion = calculateVendorCompletion(vendor);

  res.json({
    ok: true,
    message: `Vendor status updated to ${status.toUpperCase()} successfully.`,
    data: {
      vendor: {
        id: String(vendor._id),
        name: vendor.name,
        email: vendor.email,
        approved: vendor.vendorProfile.approved,
        verificationStatus: vendor.vendorProfile.verificationStatus,
        rejectionReason: vendor.vendorProfile.rejectionReason,
      },
      completion,
    },
  });
}

/**
 * Admin: generate a random password, email credentials, and unlock the vendor dashboard.
 */
export async function sendAdminVendorLogin(req, res) {
  await dbConnect();

  const { id } = req.params;
  const vendor = await User.findById(id);
  if (!vendor || String(vendor.role || "").toLowerCase() !== "vendor") {
    return res.status(404).json({ ok: false, error: "Vendor not found" });
  }

  const knownEmail = resolveKnownVendorEmail(vendor);
  if (knownEmail) {
    const existing = await User.findOne({
      email: knownEmail,
      _id: { $ne: vendor._id },
    }).select("_id");
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: `Cannot assign ${knownEmail} because another account already uses this email.`,
      });
    }
    vendor.email = knownEmail;
  }

  if (isPlaceholderEmail(vendor.email)) {
    return res.status(400).json({
      ok: false,
      error: "This vendor has no real email address. Add a valid email before sending login credentials.",
    });
  }

  const plainPassword = generateVendorPassword();
  vendor.passwordHash = await User.hashPassword(plainPassword);

  if (!vendor.vendorProfile) {
    vendor.vendorProfile = {};
  }
  vendor.vendorProfile.approved = true;
  vendor.vendorProfile.verificationStatus = "approved";
  vendor.vendorProfile.rejectionReason = "";
  vendor.vendorProfile.reviewedAt = new Date();
  vendor.markModified("vendorProfile");
  await vendor.save();

  try {
    await syncVendorServicesToItems(vendor._id);
  } catch (e) {
    console.error("Auto-sync vendor services error:", e);
  }

  const siteUrl = (
    process.env.FRONTEND_ORIGIN ||
    process.env.CLIENT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
  const loginUrl = `${siteUrl}/login`;
  const destination = String(vendor.email).trim().toLowerCase();

  try {
    const mailResult = await sendVendorLoginMail({
      to: destination,
      name: vendorDisplayName(vendor),
      email: destination,
      password: plainPassword,
      loginUrl,
    });
    if (mailResult?.skipped) {
      return res.status(500).json({
        ok: false,
        error: "SMTP is not configured, so the login email was not sent.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to send login email.",
    });
  }

  res.json({
    ok: true,
    message: `Login credentials sent to ${destination}.`,
    data: {
      vendor: {
        id: String(vendor._id),
        name: vendor.name,
        email: destination,
        approved: true,
        verificationStatus: "approved",
      },
    },
  });
}
