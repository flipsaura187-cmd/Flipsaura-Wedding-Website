import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Item from "../models/Item.js";
import Room from "../models/Room.js";
import { calculateVendorCompletion } from "../lib/vendorVerification.js";
import { syncVendorServicesToItems } from "../lib/vendorSync.js";

/**
 * Get the logged-in vendor's full profile, KYC documents, bank details, portfolio, and completion metrics.
 */
export async function getVendorProfile(req, res) {
  await dbConnect();
  const user = await User.findById(req.user.id)
    .populate("vendorProfile.categories")
    .populate("vendorProfile.servicesList.category")
    .populate("vendorProfile.facilities.category")
    .populate("vendorProfile.portfolio.serviceCategory");

  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  const completion = calculateVendorCompletion(user);

  const hotelCategories = await Category.find({
    $or: [{ slug: "hotels" }, { name: /hotel/i }],
  }).select("_id").lean();
  const hotelCatIds = new Set(hotelCategories.map((c) => String(c._id)));

  const hasHotelService = Boolean(
    user.vendorProfile?.categories?.some((c) => hotelCatIds.has(String(c?._id || c))) ||
    user.vendorProfile?.servicesList?.some(
      (s) =>
        hotelCatIds.has(String(s.category?._id || s.category)) ||
        (s.categoryName || "").toLowerCase().includes("hotel")
    ) ||
    (await Item.exists({
      vendor: user._id,
      $or: [
        { category: { $in: Array.from(hotelCatIds) } },
        { title: /hotel|resort|lodge|inn\b/i },
      ],
    }))
  );

  res.json({
    ok: true,
    data: {
      profile: user.vendorProfile || {},
      completion,
      hasHotelService,
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
    facilities,
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
  if (Array.isArray(servicesList)) {
    user.vendorProfile.servicesList = servicesList
      .filter((s) => s && (s.category || s.categoryName))
      .map((s) => ({
        category: s.category || null,
        categoryName: s.categoryName ? s.categoryName.trim() : "",
        serviceName: s.serviceName ? s.serviceName.trim() : (s.categoryName || ""),
        description: (s.description || s.serviceDescription || "").trim(),
        startingPrice: Number(s.startingPrice) || 0,
        priceRange: (s.priceRange || "").trim(),
        location: (s.location || s.serviceLocation || "").trim(),
        serviceLocation: (s.serviceLocation || s.location || "").trim(),
        experience: String(s.experience || "").trim(),
        additionalServices: Array.isArray(s.additionalServices)
          ? s.additionalServices.map((x) => String(x).trim()).filter(Boolean)
          : typeof s.additionalServices === "string"
          ? s.additionalServices.split(",").map((x) => x.trim()).filter(Boolean)
          : [],
      }));

    // For backwards compatibility, sync primary category values to root
    if (user.vendorProfile.servicesList.length > 0) {
      const primaryS = user.vendorProfile.servicesList[0];
      if (!user.vendorProfile.startingPrice) user.vendorProfile.startingPrice = primaryS.startingPrice;
      if (!user.vendorProfile.priceRange) user.vendorProfile.priceRange = primaryS.priceRange;
      if (!user.vendorProfile.serviceLocation) user.vendorProfile.serviceLocation = primaryS.serviceLocation;
      if (!user.vendorProfile.serviceDescription) user.vendorProfile.serviceDescription = primaryS.description;
      if (!user.vendorProfile.experience) user.vendorProfile.experience = primaryS.experience;
    }
  }

  if (Array.isArray(facilities)) {
    user.vendorProfile.facilities = facilities
      .filter((f) => f && f.name && f.name.trim())
      .map((f) => ({
        category: f.category || null,
        categoryName: f.categoryName ? f.categoryName.trim() : "",
        group: f.group && f.group.trim() ? f.group.trim() : "Popular Amenities",
        name: f.name.trim(),
        icon: f.icon || "",
        highlight: Boolean(f.highlight),
      }));
  }

  if (phone !== undefined) user.phone = phone.trim();

  // If user was a regular customer, promote to vendor upon completing vendor profile
  if (user.role === "user") {
    user.role = "vendor";
  }

  // Check if previously registered or profile incomplete
  if (user.vendorProfile.verificationStatus === "registered") {
    user.vendorProfile.verificationStatus = "profile_incomplete";
  }

  await user.save();

  // Handle hotel rooms submitted from Services & Amenities
  if (Array.isArray(req.body.rooms)) {
    const hotelCategories = await Category.find({
      $or: [{ slug: "hotels" }, { name: /hotel/i }],
    }).select("_id").lean();
    const hotelCatIds = hotelCategories.map((c) => c._id);

    let hotelItem = await Item.findOne({
      vendor: user._id,
      category: { $in: hotelCatIds },
    });

    for (const r of req.body.rooms) {
      if (!r || !r.name?.trim()) continue;
      const roomPayload = {
        hotel: hotelItem?._id || r.hotel || undefined,
        vendor: user._id,
        name: r.name.trim(),
        roomType: r.roomType || "Deluxe Room",
        pricePerNight: Math.max(0, Number(r.pricePerNight) || 0),
        availableRooms: Math.max(0, Number(r.availableRooms) || 1),
        maxGuests: Math.max(1, Number(r.maxGuests) || 2),
        bedType: r.bedType || "Double Bed",
        numberOfBeds: Math.max(1, Number(r.numberOfBeds) || 1),
        facilities: Array.isArray(r.facilities) ? r.facilities : [],
        description: r.description || "",
        images: Array.isArray(r.images) ? r.images : [],
        active: r.active !== undefined ? Boolean(r.active) : true,
      };

      if (r._id) {
        await Room.findByIdAndUpdate(r._id, roomPayload);
      } else {
        await Room.create(roomPayload);
      }
    }
  }

  // If vendor is approved, immediately sync services & facilities to public Items
  if (user.vendorProfile?.approved) {
    try {
      await syncVendorServicesToItems(user._id);

      // Link newly synced hotel item to rooms that had no hotel link
      const hotelCategories = await Category.find({
        $or: [{ slug: "hotels" }, { name: /hotel/i }],
      }).select("_id").lean();
      const hotelCatIds = hotelCategories.map((c) => c._id);
      const syncedHotel = await Item.findOne({
        vendor: user._id,
        category: { $in: hotelCatIds },
      });
      if (syncedHotel) {
        await Room.updateMany(
          { vendor: user._id, $or: [{ hotel: null }, { hotel: { $exists: false } }] },
          { $set: { hotel: syncedHotel._id } }
        );
      }
    } catch (syncErr) {
      console.error("Auto-sync vendor items on update error:", syncErr);
    }
  }

  // Re-populate for response
  await user.populate("vendorProfile.categories");
  await user.populate("vendorProfile.servicesList.category");
  await user.populate("vendorProfile.facilities.category");

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

  // Check if vendor has hotel category in profile or has any hotel item
  const hotelCategories = await Category.find({
    $or: [{ slug: "hotels" }, { name: /hotel/i }],
  }).select("_id").lean();
  const hotelCatIds = new Set(hotelCategories.map((c) => String(c._id)));

  const hasHotelService = Boolean(
    user.vendorProfile?.categories?.some((c) => hotelCatIds.has(String(c?._id || c))) ||
    user.vendorProfile?.servicesList?.some(
      (s) =>
        hotelCatIds.has(String(s.category?._id || s.category)) ||
        (s.categoryName || "").toLowerCase().includes("hotel")
    ) ||
    (await Item.exists({
      vendor: user._id,
      $or: [
        { category: { $in: Array.from(hotelCatIds) } },
        { title: /hotel|resort|lodge|inn\b/i },
      ],
    }))
  );

  res.json({
    ok: true,
    data: {
      isApproved: completion.isApproved,
      verificationStatus: completion.verificationStatus,
      percentage: completion.percentage,
      rejectionReason: completion.rejectionReason,
      canSubmit: completion.canSubmitForVerification,
      missingFields: completion.missingFields,
      hasHotelService,
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
