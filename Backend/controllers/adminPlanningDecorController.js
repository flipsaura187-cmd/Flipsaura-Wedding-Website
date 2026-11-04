import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";
import User from "../models/User.js";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Locate or auto-create Planning & Decor category
 */
export async function getPlanningDecorCategory() {
  let cat = await Category.findOne({ slug: "planning-decor" });
  if (!cat) {
    cat = await Category.findOne({ name: /planning/i });
  }
  if (!cat) {
    cat = await Category.create({
      name: "Planning & Decor",
      slug: "planning-decor",
      description: "Wedding planners, floral themes, royal stage backdrops, mandap concepts, and complete event styling.",
      image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_planning-decor.png",
      order: 3,
      active: true,
    });
  }
  return cat;
}

/**
 * List all Planning & Decor listings
 */
export async function getAdminPlanningDecors(req, res) {
  try {
    await dbConnect();
    const cat = await getPlanningDecorCategory();

    const query = { category: cat._id };
    if (req.query.city && req.query.city !== "all") {
      query.city = new RegExp(`^${req.query.city.trim()}$`, "i");
    }
    if (req.query.search && req.query.search.trim()) {
      const s = new RegExp(req.query.search.trim(), "i");
      query.$or = [{ title: s }, { city: s }, { contactPhone: s }, { about: s }];
    }

    const items = await Item.find(query)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, data: { items, count: items.length } });
  } catch (error) {
    console.error("[getAdminPlanningDecors Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch planning & decor listings" });
  }
}

/**
 * Get single Planning & Decor listing detail
 */
export async function getAdminPlanningDecorDetail(req, res) {
  try {
    await dbConnect();
    const item = await Item.findById(req.params.id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: "Planning & decor listing not found" });
    }
    res.json({ ok: true, data: { item } });
  } catch (error) {
    console.error("[getAdminPlanningDecorDetail Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch details" });
  }
}

/**
 * Create a new Planning & Decor listing
 */
export async function createAdminPlanningDecor(req, res) {
  try {
    await dbConnect();
    const cat = await getPlanningDecorCategory();

    const {
      name,
      title,
      ownerName,
      contactPerson,
      address,
      locality,
      city = "Daudnagar",
      state = "Bihar",
      pincode,
      contactPhone,
      contactEmail,
      price,
      rentalPrice,
      about,
      description,
      photos = [],
      images = [],
      mainCategories = [],
      subcategories = [],
      customSubcategoriesMap = {},
      decorPackages,
      active = true,
      featured = false,
      rating = 4.8,
      reviewsCount = 0,
    } = req.body;

    const finalTitle = (name || title || "").trim();
    if (!finalTitle) {
      return res.status(400).json({ ok: false, error: "Company or Decorator Name is required" });
    }

    const cleanPhone = (contactPhone || "").replace(/\D/g, "").slice(-10);

    // Resolve or auto-create vendor user
    let vendorUser = null;
    if (req.user && (req.user.role === "vendor" || req.user.role === "user")) {
      vendorUser = await User.findById(req.user.id);
    } else if (cleanPhone.length >= 10) {
      vendorUser = await User.findOne({ phone: new RegExp(cleanPhone + "$") });
    }

    if (vendorUser) {
      vendorUser.role = "vendor";
      if (!vendorUser.vendorProfile) vendorUser.vendorProfile = {};
      vendorUser.vendorProfile.approved = true;
      vendorUser.vendorProfile.verificationStatus = "approved";
      if (!vendorUser.vendorProfile.businessName) {
        vendorUser.vendorProfile.businessName = finalTitle;
      }
      vendorUser.markModified("vendorProfile");
      await vendorUser.save();
    } else {
      const dummyEmail = `decor.${cleanPhone || Date.now().toString().slice(-4)}@flipsaura.local`;
      const defaultHash = await User.hashPassword("Flipsaura@Vendor2026");
      vendorUser = await User.create({
        name: ownerName || contactPerson || finalTitle,
        email: contactEmail && contactEmail.trim() ? contactEmail.trim().toLowerCase() : dummyEmail,
        phone: cleanPhone,
        passwordHash: defaultHash,
        role: "vendor",
        isPhoneVerified: Boolean(cleanPhone),
        vendorProfile: {
          businessName: finalTitle,
          ownerName: ownerName || contactPerson || finalTitle,
          vendorType: "Business",
          city,
          state,
          approved: true,
          verificationStatus: "approved",
          categories: [cat._id],
        },
      });
    }

    // Process images
    const rawImages = Array.isArray(photos) && photos.length > 0 ? photos : (Array.isArray(images) ? images : []);
    const cleanImages = rawImages.map((img) => String(img).trim()).filter(Boolean);
    if (cleanImages.length === 0) {
      cleanImages.push("https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_planning-decor.png");
    }

    const effectivePrice = Math.max(0, Number(price || rentalPrice) || 0);
    const slug = `${slugify(finalTitle)}-${slugify(city)}-${Date.now().toString().slice(-4)}`;

    const newItem = await Item.create({
      title: finalTitle,
      slug,
      category: cat._id,
      vendor: vendorUser._id,
      address: address?.trim() || "",
      locality: locality?.trim() || "",
      city: city.trim(),
      state: state.trim() || "Bihar",
      pincode: pincode?.trim() || "",
      contactPhone: contactPhone?.trim() || vendorUser.phone || "",
      contactEmail: contactEmail?.trim() || vendorUser.email || "",
      price: effectivePrice,
      rentalPrice: effectivePrice,
      about: about?.trim() || `${finalTitle} is a premier wedding planning & decor styling agency based in ${city}, ${state}.`,
      description: description?.trim() || about?.trim() || `${finalTitle} crafts unforgettable wedding aesthetics, royal mandaps, thematic floral decor, and complete wedding planning coordination.`,
      images: cleanImages,
      mainCategories: Array.isArray(mainCategories) ? mainCategories : [],
      subcategories: Array.isArray(subcategories) ? subcategories : [],
      customSubcategoriesMap: typeof customSubcategoriesMap === "object" && customSubcategoriesMap !== null ? customSubcategoriesMap : {},
      rating: Math.min(5, Math.max(0, Number(rating) || 4.8)),
      reviewsCount: Math.max(0, Number(reviewsCount) || 0),
      active: active !== undefined ? Boolean(active) : true,
      featured: Boolean(featured),
      source: "vendor_portal",
    });

    const populated = await Item.findById(newItem._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    res.status(201).json({
      ok: true,
      message: "Planning & Decor listing created successfully!",
      data: { item: populated },
    });
  } catch (error) {
    console.error("[createAdminPlanningDecor Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to create planning & decor listing" });
  }
}

/**
 * Update an existing Planning & Decor listing
 */
export async function updateAdminPlanningDecor(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Planning & decor listing not found" });
    }

    if (req.user && req.user.role !== "admin") {
      const userPhone = (req.user.phone || "").replace(/\D/g, "").slice(-10);
      const itemPhone = (item.contactPhone || "").replace(/\D/g, "").slice(-10);
      const isOwner = String(item.vendor) === req.user.id || (userPhone.length >= 10 && itemPhone === userPhone);
      if (!isOwner) {
        return res.status(403).json({ ok: false, error: "Forbidden: You can only edit your own listings" });
      }
    }

    const {
      name,
      title,
      ownerName,
      contactPerson,
      address,
      locality,
      city,
      state,
      pincode,
      contactPhone,
      contactEmail,
      price,
      rentalPrice,
      about,
      description,
      photos,
      images,
      mainCategories,
      subcategories,
      customSubcategoriesMap,
      active,
      featured,
      rating,
      reviewsCount,
    } = req.body;

    const finalTitle = (name || title || item.title || "").trim();
    item.title = finalTitle;

    if (address !== undefined) item.address = address?.trim();
    if (locality !== undefined) item.locality = locality?.trim();
    if (city !== undefined) item.city = city?.trim();
    if (state !== undefined) item.state = state?.trim();
    if (pincode !== undefined) item.pincode = pincode?.trim();
    if (contactPhone !== undefined) item.contactPhone = contactPhone?.trim();
    if (contactEmail !== undefined) item.contactEmail = contactEmail?.trim();

    if (price !== undefined || rentalPrice !== undefined) {
      const p = Math.max(0, Number(price !== undefined ? price : rentalPrice) || 0);
      item.price = p;
      item.rentalPrice = p;
    }

    if (about !== undefined) item.about = about?.trim();
    if (description !== undefined) item.description = description?.trim();

    if (photos !== undefined) item.images = (Array.isArray(photos) ? photos : []).filter(Boolean);
    else if (images !== undefined) item.images = (Array.isArray(images) ? images : []).filter(Boolean);

    if (mainCategories !== undefined) {
      item.mainCategories = Array.isArray(mainCategories) ? mainCategories : [];
    }
    if (subcategories !== undefined) {
      item.subcategories = Array.isArray(subcategories) ? subcategories : [];
    }
    if (customSubcategoriesMap !== undefined) {
      item.customSubcategoriesMap = typeof customSubcategoriesMap === "object" && customSubcategoriesMap !== null ? customSubcategoriesMap : {};
      item.markModified("customSubcategoriesMap");
    }

    if (active !== undefined) item.active = Boolean(active);
    if (featured !== undefined) item.featured = Boolean(featured);
    if (rating !== undefined) item.rating = Math.min(5, Math.max(0, Number(rating) || 4.8));
    if (reviewsCount !== undefined) item.reviewsCount = Math.max(0, Number(reviewsCount) || 0);

    await item.save();

    const populated = await Item.findById(item._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    res.json({
      ok: true,
      message: "Planning & Decor listing updated successfully!",
      data: { item: populated },
    });
  } catch (error) {
    console.error("[updateAdminPlanningDecor Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update planning & decor listing" });
  }
}

/**
 * Delete a Planning & Decor listing
 */
export async function deleteAdminPlanningDecor(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Planning & decor listing not found" });
    }

    if (req.user && req.user.role !== "admin") {
      const userPhone = (req.user.phone || "").replace(/\D/g, "").slice(-10);
      const itemPhone = (item.contactPhone || "").replace(/\D/g, "").slice(-10);
      const isOwner = String(item.vendor) === req.user.id || (userPhone.length >= 10 && itemPhone === userPhone);
      if (!isOwner) {
        return res.status(403).json({ ok: false, error: "Forbidden: You can only delete your own listings" });
      }
    }

    await item.deleteOne();
    res.json({
      ok: true,
      message: `Planning & Decor listing "${item.title}" deleted successfully`,
    });
  } catch (error) {
    console.error("[deleteAdminPlanningDecor Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to delete listing" });
  }
}

