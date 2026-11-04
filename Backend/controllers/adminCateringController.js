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
 * Locate or auto-create Food / Catering category
 */
export async function getCateringCategory() {
  let cat = await Category.findOne({ slug: "food-catering" });
  if (!cat) {
    cat = await Category.findOne({ name: /catering|food/i });
  }
  if (!cat) {
    cat = await Category.create({
      name: "Food / Catering",
      slug: "food-catering",
      description: "Wedding caterers, pure veg & multi-cuisine feasts, live food counters, chaat stalls, and professional banquet service.",
      image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226359/flipsaura/categories/category_food-catering.png",
      order: 4,
      active: true,
    });
  }
  return cat;
}

/**
 * List all Catering listings
 */
export async function getAdminCaterings(req, res) {
  try {
    await dbConnect();
    const cat = await getCateringCategory();

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
    console.error("[getAdminCaterings Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch catering listings" });
  }
}

/**
 * Get single Catering listing detail
 */
export async function getAdminCateringDetail(req, res) {
  try {
    await dbConnect();
    const item = await Item.findById(req.params.id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: "Catering listing not found" });
    }
    res.json({ ok: true, data: { item } });
  } catch (error) {
    console.error("[getAdminCateringDetail Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch details" });
  }
}

/**
 * Create a new Food / Catering listing
 */
export async function createAdminCatering(req, res) {
  try {
    await dbConnect();
    const cat = await getCateringCategory();

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
      pricePerPlateVeg,
      pricePerPlateNonVeg,
      guestCapacity,
      about,
      description,
      photos = [],
      images = [],
      mainCategories = [],
      subcategories = [],
      customSubcategoriesMap = {},
      active = true,
      featured = false,
      rating = 4.8,
      reviewsCount = 0,
    } = req.body;

    const finalTitle = (name || title || "").trim();
    if (!finalTitle) {
      return res.status(400).json({ ok: false, error: "Catering Company or Brand Name is required" });
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
      const dummyEmail = `catering.${cleanPhone || Date.now().toString().slice(-4)}@flipsaura.local`;
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
      cleanImages.push("https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226359/flipsaura/categories/category_food-catering.png");
    }

    const vegPlate = Math.max(0, Number(pricePerPlateVeg) || 0);
    const nonVegPlate = Math.max(0, Number(pricePerPlateNonVeg) || 0);
    const effectivePrice = Math.max(0, Number(price) || (vegPlate > 0 ? vegPlate : nonVegPlate));
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
      pricePerPlateVeg: vegPlate,
      pricePerPlateNonVeg: nonVegPlate,
      guestCapacity: Math.max(0, Number(guestCapacity) || 0),
      about: about?.trim() || `${finalTitle} is a premier catering and wedding feast provider in ${city}, ${state}.`,
      description: description?.trim() || about?.trim() || `${finalTitle} provides lavish multi-cuisine buffets, authentic traditional flavors, live cooking stations, and hygienic banquet food services.`,
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
      message: "Food & Catering listing created successfully!",
      data: { item: populated },
    });
  } catch (error) {
    console.error("[createAdminCatering Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to create catering listing" });
  }
}

/**
 * Update an existing Food / Catering listing
 */
export async function updateAdminCatering(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Catering listing not found" });
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
      pricePerPlateVeg,
      pricePerPlateNonVeg,
      guestCapacity,
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

    if (pricePerPlateVeg !== undefined) item.pricePerPlateVeg = Math.max(0, Number(pricePerPlateVeg) || 0);
    if (pricePerPlateNonVeg !== undefined) item.pricePerPlateNonVeg = Math.max(0, Number(pricePerPlateNonVeg) || 0);
    if (price !== undefined) {
      item.price = Math.max(0, Number(price) || 0);
    } else if (item.pricePerPlateVeg || item.pricePerPlateNonVeg) {
      item.price = item.pricePerPlateVeg || item.pricePerPlateNonVeg;
    }

    if (guestCapacity !== undefined) item.guestCapacity = Math.max(0, Number(guestCapacity) || 0);

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
      message: "Food & Catering listing updated successfully!",
      data: { item: populated },
    });
  } catch (error) {
    console.error("[updateAdminCatering Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update catering listing" });
  }
}

/**
 * Delete a Catering listing
 */
export async function deleteAdminCatering(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Catering listing not found" });
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
      message: `Catering listing "${item.title}" deleted successfully`,
    });
  } catch (error) {
    console.error("[deleteAdminCatering Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to delete listing" });
  }
}

