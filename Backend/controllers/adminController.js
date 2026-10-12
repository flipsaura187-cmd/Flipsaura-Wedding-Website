import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Item from "../models/Item.js";
import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import Blog from "../models/Blog.js";
import Review from "../models/Review.js";
import { calculateVendorCompletion } from "../lib/vendorVerification.js";

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
  await dbConnect();
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  res.json({ ok: true, data: { users } });
}

export async function updateUser(req, res) {
  const { id, role, approved } = req.body;
  await dbConnect();

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ ok: false, error: "Not found" });

  if (role) user.role = role;
  if (typeof approved === "boolean" && user.role === "vendor") {
    if (!user.vendorProfile) user.vendorProfile = {};
    user.vendorProfile.approved = approved;
    user.vendorProfile.verificationStatus = approved ? "approved" : "under_review";
    user.vendorProfile.reviewedAt = new Date();
    if (approved) {
      user.vendorProfile.rejectionReason = "";
      if (Array.isArray(user.vendorProfile.documents)) {
        user.vendorProfile.documents.forEach((d) => {
          if (d.status === "under_review" || d.status === "pending") {
            d.status = "verified";
            d.verifiedAt = new Date();
          }
        });
      }
      if (user.vendorProfile.bankDetails) {
        if (
          user.vendorProfile.bankDetails.status === "under_review" ||
          user.vendorProfile.bankDetails.status === "pending"
        ) {
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
    data: {
      user: {
        id: String(user._id),
        role: user.role,
        approved: user.vendorProfile?.approved,
        verificationStatus: user.vendorProfile?.verificationStatus,
      },
    },
  });
}

export async function getAdminBlogs(req, res) {
  await dbConnect();
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json({ ok: true, data: blogs, blogs });
}

export async function getVendorStats(req, res) {
  await dbConnect();

  const user = await User.findById(req.user.id).lean();
  const completion = user ? calculateVendorCompletion(user) : null;

  const [items, bookings, revenueAgg] = await Promise.all([
    Item.countDocuments({ vendor: req.user.id }),
    Booking.countDocuments({ vendor: req.user.id }),
    Booking.aggregate([
      { $match: { vendor: req.user.id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    ok: true,
    data: {
      stats: {
        items,
        bookings,
        revenue: revenueAgg[0]?.total || 0,
        isApproved: Boolean(user?.vendorProfile?.approved && user?.vendorProfile?.verificationStatus === "approved"),
        verificationStatus: user?.vendorProfile?.verificationStatus || "profile_incomplete",
        completionPercentage: completion?.percentage || 0,
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
      query["vendorProfile.verificationStatus"] = "approved";
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

  const vendors = await User.find(query, { passwordHash: 0 })
    .populate("vendorProfile.categories")
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

    // Also mark any under_review documents and bank details as verified if not yet rejected
    if (Array.isArray(vendor.vendorProfile.documents)) {
      vendor.vendorProfile.documents.forEach((d) => {
        if (d.status === "under_review" || d.status === "pending") {
          d.status = "verified";
          d.verifiedAt = new Date();
        }
      });
    }
    if (vendor.vendorProfile.bankDetails) {
      if (vendor.vendorProfile.bankDetails.status === "under_review" || vendor.vendorProfile.bankDetails.status === "pending") {
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

  await vendor.save();

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
