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
 * Locate or auto-create Home Setup category
 */
export async function getHomeSetupCategory() {
  let cat = await Category.findOne({ slug: "home-setup-pandal-tent-dj" });
  if (!cat) {
    cat = await Category.findOne({ name: /home setup/i });
  }
  if (!cat) {
    cat = await Category.create({
      name: "Home Setup – Pandal / Tent / DJ / Full Ghar Setup",
      slug: "home-setup-pandal-tent-dj",
      description: "Complete home wedding & event setups: Waterproof Tent, Royal Shamiana, Furniture, Stage Mandap, DJ Sound, Lighting, Generator & Facilities.",
      image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_home_setup.png",
      order: 2,
      active: true,
    });
  }
  return cat;
}

/**
 * List all Home Setup listings (for admin or vendor)
 */
export async function getAdminHomeSetups(req, res) {
  try {
    await dbConnect();
    const cat = await getHomeSetupCategory();

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
    console.error("[getAdminHomeSetups Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch home setup listings" });
  }
}

function normalizeCategoryPhotos(categoryPhotosMap, categoryPhotos) {
  let cleanMap = {};
  if (categoryPhotosMap && typeof categoryPhotosMap === "object") {
    for (const [catName, imgs] of Object.entries(categoryPhotosMap)) {
      if (Array.isArray(imgs)) {
        cleanMap[catName] = imgs.map((s) => String(s).trim()).filter(Boolean);
      }
    }
  }

  if (Array.isArray(categoryPhotos)) {
    for (const entry of categoryPhotos) {
      if (entry && entry.categoryName) {
        const imgs = Array.isArray(entry.images) ? entry.images.map((s) => String(s).trim()).filter(Boolean) : [];
        cleanMap[entry.categoryName] = Array.from(new Set([...(cleanMap[entry.categoryName] || []), ...imgs]));
      }
    }
  }

  const ICON_MAP = {
    "Tent & Pandal": "⛺",
    "Furniture & Seating": "🪑",
    "Stage & Decoration": "🌸",
    "DJ & Sound System": "🔊",
    "Lighting & Special Effects": "💡",
    "Power & Generator": "⚡",
    "Additional Facilities": "🚪",
  };

  const structuredList = Object.entries(cleanMap).map(([catName, imgs]) => ({
    categoryName: catName,
    icon: ICON_MAP[catName] || "🎪",
    images: imgs,
  }));

  return { cleanMap, structuredList };
}

/**
 * Get single Home Setup listing detail
 */
export async function getAdminHomeSetupDetail(req, res) {
  try {
    await dbConnect();
    const item = await Item.findById(req.params.id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: "Home setup listing not found" });
    }
    res.json({ ok: true, data: { item } });
  } catch (error) {
    console.error("[getAdminHomeSetupDetail Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch home setup details" });
  }
}

/**
 * Create a new Home Setup listing
 */
export async function createAdminHomeSetup(req, res) {
  try {
    await dbConnect();
    const cat = await getHomeSetupCategory();

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
      categoryPhotosMap = {},
      categoryPhotos = [],
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
      return res.status(400).json({ ok: false, error: "Setup or Business Title is required" });
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
      const dummyEmail = `homesetup.${cleanPhone || Date.now().toString().slice(-4)}@flipsaura.local`;
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

    // Process images and category-specific photos
    const { cleanMap, structuredList } = normalizeCategoryPhotos(categoryPhotosMap, categoryPhotos);
    const allCatPhotos = Object.values(cleanMap).flat();

    const rawImages = Array.isArray(photos) && photos.length > 0 ? photos : (Array.isArray(images) ? images : []);
    const userImages = rawImages.map((img) => String(img).trim()).filter(Boolean);
    let cleanImages = Array.from(new Set([...userImages, ...allCatPhotos]));

    if (cleanImages.length === 0) {
      cleanImages.push("https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_home_setup.png");
    }

    const effectivePrice = Math.max(0, Number(rentalPrice || price) || 0);
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
      about: about?.trim() || `${finalTitle} provides comprehensive home wedding setups, pandal, tent, sound, stage & lighting services in ${city}, ${state}.`,
      description: description?.trim() || about?.trim() || `${finalTitle} specializes in flawless event setups for wedding ceremonies, sangeet, reception, and family functions at home.`,
      images: cleanImages,
      categoryPhotosMap: cleanMap,
      categoryPhotos: structuredList,
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
      message: "Home Setup & Event Services listing created successfully!",
      data: { item: populated },
    });
  } catch (error) {
    console.error("[createAdminHomeSetup Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to create home setup listing" });
  }
}

/**
 * Update an existing Home Setup listing
 */
export async function updateAdminHomeSetup(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Home setup listing not found" });
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
      categoryPhotosMap,
      categoryPhotos,
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

    if (rentalPrice !== undefined || price !== undefined) {
      const p = Math.max(0, Number(rentalPrice !== undefined ? rentalPrice : price) || 0);
      item.price = p;
      item.rentalPrice = p;
    }

    if (about !== undefined) item.about = about?.trim();
    if (description !== undefined) item.description = description?.trim();

    if (photos !== undefined) item.images = (Array.isArray(photos) ? photos : []).filter(Boolean);
    else if (images !== undefined) item.images = (Array.isArray(images) ? images : []).filter(Boolean);

    if (categoryPhotosMap !== undefined || categoryPhotos !== undefined) {
      const { cleanMap, structuredList } = normalizeCategoryPhotos(categoryPhotosMap, categoryPhotos);
      item.categoryPhotosMap = cleanMap;
      item.categoryPhotos = structuredList;
      item.markModified("categoryPhotosMap");
      item.markModified("categoryPhotos");

      const allCatImgs = Object.values(cleanMap).flat();
      if (allCatImgs.length > 0) {
        item.images = Array.from(new Set([...(item.images || []), ...allCatImgs]));
      }
    }

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
      message: "Home Setup & Event Services listing updated successfully!",
      data: { item: populated },
    });
  } catch (error) {
    console.error("[updateAdminHomeSetup Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update home setup listing" });
  }
}

/**
 * Delete a Home Setup listing
 */
export async function deleteAdminHomeSetup(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Home setup listing not found" });
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
      message: `Home Setup listing "${item.title}" deleted successfully`,
    });
  } catch (error) {
    console.error("[deleteAdminHomeSetup Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to delete home setup listing" });
  }
}

