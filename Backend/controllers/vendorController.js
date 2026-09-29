import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import { calculateVendorCompletion } from "../lib/vendorVerification.js";

/**
 * Get the logged-in vendor's full profile, KYC documents, bank details, portfolio, and completion metrics.
 */
export async function getVendorProfile(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id)
    .populate("vendorProfile.categories")
    .populate("vendorProfile.servicesList.category")
    .populate("vendorProfile.portfolio.serviceCategory");

  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  const completion = calculateVendorCompletion(user);

  res.json({
    ok: true,
    data: {
      profile: user.vendorProfile || {},
      completion,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    },
  });
}

/**
 * Update vendor profile details (Business Info + Service Information).
 */
export async function updateVendorProfile(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  if (!user.vendorProfile) {
    user.vendorProfile = {};
  }

  const {
    businessName,
    ownerName,
    vendorType,
    address,
    city,
    state,
    pincode,
    profilePhoto,
    coverPhoto,
    about,
    serviceDescription,
    startingPrice,
    priceRange,
    serviceLocation,
    experience,
    additionalServices,
    categories,
    servicesList,
    phone,
  } = req.body;

  // Update profile fields
  if (businessName !== undefined) user.vendorProfile.businessName = businessName.trim();
  if (ownerName !== undefined) {
    user.vendorProfile.ownerName = ownerName.trim();
    if (!user.name || user.name === "User") user.name = ownerName.trim();
  }
  if (vendorType !== undefined) user.vendorProfile.vendorType = vendorType;
  if (address !== undefined) user.vendorProfile.address = address.trim();
  if (city !== undefined) user.vendorProfile.city = city.trim();
  if (state !== undefined) user.vendorProfile.state = state.trim();
  if (pincode !== undefined) user.vendorProfile.pincode = pincode.trim();
  if (profilePhoto !== undefined) user.vendorProfile.profilePhoto = profilePhoto;
  if (coverPhoto !== undefined) user.vendorProfile.coverPhoto = coverPhoto;
  if (about !== undefined) user.vendorProfile.about = about.trim();

  // Service details
  if (serviceDescription !== undefined) user.vendorProfile.serviceDescription = serviceDescription.trim();
  if (startingPrice !== undefined) user.vendorProfile.startingPrice = Number(startingPrice) || 0;
  if (priceRange !== undefined) user.vendorProfile.priceRange = priceRange.trim();
  if (serviceLocation !== undefined) user.vendorProfile.serviceLocation = serviceLocation.trim();
  if (experience !== undefined) user.vendorProfile.experience = String(experience).trim();
  if (Array.isArray(additionalServices)) user.vendorProfile.additionalServices = additionalServices;
  if (Array.isArray(categories)) user.vendorProfile.categories = categories;
  if (Array.isArray(servicesList)) user.vendorProfile.servicesList = servicesList;

  if (phone !== undefined) user.phone = phone.trim();

  // Check if previously registered or profile incomplete
  if (user.vendorProfile.verificationStatus === "registered") {
    user.vendorProfile.verificationStatus = "profile_incomplete";
  }

  await user.save();

  // Re-populate for response
  await user.populate("vendorProfile.categories");

  const completion = calculateVendorCompletion(user);

  res.json({
    ok: true,
    message: "Profile updated successfully",
    data: {
      profile: user.vendorProfile,
      completion,
    },
  });
}

/**
 * Upload or update a KYC document.
 */
export async function uploadOrUpdateDocument(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  if (!user.vendorProfile) {
    user.vendorProfile = {};
  }

  const { docType, name, frontUrl, backUrl, fileUrl, fileType } = req.body;

  if (!docType || (!frontUrl && !fileUrl)) {
    return res.status(400).json({
      ok: false,
      error: "Document type and at least one file/image URL are required",
    });
  }

  const validDocTypes = ["pan", "aadhaar", "bank_proof", "cancelled_cheque", "gst", "business_reg", "other"];
  if (!validDocTypes.includes(docType)) {
    return res.status(400).json({ ok: false, error: `Invalid document type: ${docType}` });
  }

  if (!Array.isArray(user.vendorProfile.documents)) {
    user.vendorProfile.documents = [];
  }

  const existingIdx = user.vendorProfile.documents.findIndex((d) => d.docType === docType);

  const docData = {
    docType,
    name: name || getDocumentDisplayName(docType),
    frontUrl: frontUrl || "",
    backUrl: backUrl || "",
    fileUrl: fileUrl || frontUrl || "",
    fileType: fileType || "image",
    status: "under_review", // Reset to under_review on upload/re-upload
    rejectionReason: "", // Clear previous rejection reason
    uploadedAt: new Date(),
    verifiedAt: null,
  };

  if (existingIdx >= 0) {
    user.vendorProfile.documents[existingIdx] = {
      ...user.vendorProfile.documents[existingIdx].toObject(),
      ...docData,
    };
  } else {
    user.vendorProfile.documents.push(docData);
  }

  // If this was a cancelled cheque or bank proof, keep bankDetails in sync
  if (docType === "cancelled_cheque" || docType === "bank_proof") {
    if (!user.vendorProfile.bankDetails) {
      user.vendorProfile.bankDetails = {};
    }
    user.vendorProfile.bankDetails.chequeUrl = fileUrl || frontUrl;
    if (user.vendorProfile.bankDetails.status === "rejected") {
      user.vendorProfile.bankDetails.status = "under_review";
      user.vendorProfile.bankDetails.rejectionReason = "";
    }
  }

  // Rule 9: If previously approved vendor updates critical documents, trigger re-verification
  if (user.vendorProfile.approved && user.vendorProfile.verificationStatus === "approved") {
    user.vendorProfile.verificationStatus = "under_review";
    user.vendorProfile.approved = false;
  }

  await user.save();

  const completion = calculateVendorCompletion(user);

  res.json({
    ok: true,
    message: `${getDocumentDisplayName(docType)} uploaded successfully.`,
    data: {
      documents: user.vendorProfile.documents,
      completion,
    },
  });
}

/**
 * Update Bank Account details.
 */
export async function updateBankDetails(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  if (!user.vendorProfile) {
    user.vendorProfile = {};
  }

  const { accountHolderName, bankName, accountNumber, ifscCode, chequeUrl } = req.body;

  if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
    return res.status(400).json({
      ok: false,
      error: "Account holder name, bank name, account number, and IFSC code are required.",
    });
  }

  user.vendorProfile.bankDetails = {
    accountHolderName: accountHolderName.trim(),
    bankName: bankName.trim(),
    accountNumber: accountNumber.trim(),
    ifscCode: ifscCode.trim().toUpperCase(),
    chequeUrl: chequeUrl || user.vendorProfile.bankDetails?.chequeUrl || "",
    status: "under_review", // Reset status on edit/re-upload
    rejectionReason: "",
    verifiedAt: null,
  };

  // If chequeUrl is supplied, also sync into documents
  if (chequeUrl) {
    if (!Array.isArray(user.vendorProfile.documents)) {
      user.vendorProfile.documents = [];
    }
    const idx = user.vendorProfile.documents.findIndex(
      (d) => d.docType === "cancelled_cheque" || d.docType === "bank_proof"
    );
    const chequeDoc = {
      docType: "cancelled_cheque",
      name: "Cancelled Cheque / Bank Proof",
      frontUrl: chequeUrl,
      fileUrl: chequeUrl,
      fileType: "image",
      status: "under_review",
      rejectionReason: "",
      uploadedAt: new Date(),
    };
    if (idx >= 0) {
      user.vendorProfile.documents[idx] = {
        ...user.vendorProfile.documents[idx].toObject(),
        ...chequeDoc,
      };
    } else {
      user.vendorProfile.documents.push(chequeDoc);
    }
  }

  // Rule 9: If approved vendor modifies critical bank details, trigger re-verification
  if (user.vendorProfile.approved && user.vendorProfile.verificationStatus === "approved") {
    user.vendorProfile.verificationStatus = "under_review";
    user.vendorProfile.approved = false;
  }

  await user.save();

  const completion = calculateVendorCompletion(user);

  res.json({
    ok: true,
    message: "Bank details updated successfully.",
    data: {
      bankDetails: user.vendorProfile.bankDetails,
      completion,
    },
  });
}

/**
 * Add an item to vendor's Portfolio.
 */
export async function addPortfolioItem(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  const { title, category, serviceCategory, description, images, videos } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ ok: false, error: "Portfolio title is required" });
  }

  if (!Array.isArray(user.vendorProfile.portfolio)) {
    user.vendorProfile.portfolio = [];
  }

  user.vendorProfile.portfolio.push({
    title: title.trim(),
    category: category ? category.trim() : "General",
    serviceCategory: serviceCategory || null,
    description: description ? description.trim() : "",
    images: Array.isArray(images) ? images.filter(Boolean) : [],
    videos: Array.isArray(videos) ? videos.filter(Boolean) : [],
    createdAt: new Date(),
  });

  await user.save();
  await user.populate("vendorProfile.portfolio.serviceCategory");

  const completion = calculateVendorCompletion(user);

  res.status(201).json({
    ok: true,
    message: "Portfolio item added successfully",
    data: {
      portfolio: user.vendorProfile.portfolio,
      completion,
    },
  });
}

/**
 * Update an existing Portfolio item.
 */
export async function updatePortfolioItem(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  const { id } = req.params;
  const item = user.vendorProfile?.portfolio?.id(id);
  if (!item) {
    return res.status(404).json({ ok: false, error: "Portfolio item not found" });
  }

  const { title, category, serviceCategory, description, images, videos } = req.body;
  if (title !== undefined) item.title = title.trim();
  if (category !== undefined) item.category = category.trim();
  if (serviceCategory !== undefined) item.serviceCategory = serviceCategory || null;
  if (description !== undefined) item.description = description.trim();
  if (Array.isArray(images)) item.images = images.filter(Boolean);
  if (Array.isArray(videos)) item.videos = videos.filter(Boolean);

  await user.save();

  res.json({
    ok: true,
    message: "Portfolio item updated successfully",
    data: { portfolio: user.vendorProfile.portfolio },
  });
}

/**
 * Delete a Portfolio item.
 */
export async function deletePortfolioItem(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  const { id } = req.params;
  if (!user.vendorProfile?.portfolio) {
    return res.status(404).json({ ok: false, error: "Portfolio item not found" });
  }

  user.vendorProfile.portfolio = user.vendorProfile.portfolio.filter(
    (p) => String(p._id) !== String(id)
  );

  await user.save();

  const completion = calculateVendorCompletion(user);

  res.json({
    ok: true,
    message: "Portfolio item deleted successfully",
    data: {
      portfolio: user.vendorProfile.portfolio,
      completion,
    },
  });
}

/**
 * Submit complete profile for Admin Verification.
 */
export async function submitForVerification(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  const completion = calculateVendorCompletion(user);

  // Validate complete profile before submission
  if (!completion.canSubmitForVerification) {
    return res.status(400).json({
      ok: false,
      error: "Your profile cannot be submitted yet.",
      missing: completion.missingFields,
      missingCategories: completion.missingCategories,
      completion,
    });
  }

  user.vendorProfile.verificationStatus = "under_review";
  user.vendorProfile.submittedAt = new Date();
  user.vendorProfile.rejectionReason = "";

  // Move any pending documents to under_review
  if (Array.isArray(user.vendorProfile.documents)) {
    user.vendorProfile.documents.forEach((doc) => {
      if (doc.status === "pending") {
        doc.status = "under_review";
      }
    });
  }

  // Move bank details to under_review if pending
  if (user.vendorProfile.bankDetails) {
    if (user.vendorProfile.bankDetails.status === "pending") {
      user.vendorProfile.bankDetails.status = "under_review";
    }
  }

  await user.save();

  const updatedCompletion = calculateVendorCompletion(user);

  res.json({
    ok: true,
    message: "Your profile and documents have been submitted for admin verification. Your account is now under review.",
    data: {
      verificationStatus: "under_review",
      completion: updatedCompletion,
    },
  });
}

/**
 * Quick status check for dashboard.
 */
export async function getVendorStatus(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id).lean();
  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  const completion = calculateVendorCompletion(user);

  res.json({
    ok: true,
    data: {
      isApproved: completion.isApproved,
      verificationStatus: completion.verificationStatus,
      percentage: completion.percentage,
      rejectionReason: completion.rejectionReason,
      canSubmit: completion.canSubmitForVerification,
      missingFields: completion.missingFields,
    },
  });
}

function getDocumentDisplayName(docType) {
  const map = {
    pan: "PAN Card",
    aadhaar: "Aadhaar Card",
    bank_proof: "Bank Proof",
    cancelled_cheque: "Cancelled Cheque",
    gst: "GST Certificate",
    business_reg: "Business Registration Certificate",
    other: "Verification Document",
  };
  return map[docType] || docType.toUpperCase();
}
