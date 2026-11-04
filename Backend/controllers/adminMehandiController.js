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
 * Locate or create the Mehndi Services category
 */
export async function getMehandiCategory() {
  let cat = await Category.findOne({ slug: "mehndi-services" });
  if (!cat) {
    cat = await Category.findOne({ slug: "mehandi-services" });
  }
  if (!cat) {
    cat = await Category.findOne({ name: /mehandi|mehndi/i });
  }
  if (!cat) {
    cat = await Category.create({
      name: "Mehndi Services",
      slug: "mehndi-services",
      description: "Professional mehndi artists and teams offering bridal mehndi, guest mehndi, Arabic, Rajasthani, and traditional designs.",
      order: 6,
      image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226360/flipsaura/categories/category_mehndi-services.png",
      active: true,
    });
  }
  return cat;
}

/**
 * Admin: List all Mehandi listings with search, filters & statistics
 */
export async function getAdminMehandis(req, res) {
  try {
    await dbConnect();
    const mehandiCat = await getMehandiCategory();

    const { search, city, state, active } = req.query;

    const query = {
      $or: [
        { category: mehandiCat._id },
        { "mehandiPackages.basic.price": { $exists: true } },
        { title: /mehndi|mehandi/i },
      ],
    };

    if (city && city.trim() && city !== "all") {
      query.city = new RegExp(`^${city.trim()}$`, "i");
    }

    if (state && state.trim() && state !== "all") {
      query.state = new RegExp(`^${state.trim()}$`, "i");
    }

    if (active !== undefined && active !== "all") {
      query.active = active === "true" || active === true;
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$and = [
        {
          $or: [
            { title: sRegex },
            { city: sRegex },
            { locality: sRegex },
            { address: sRegex },
            { contactPhone: sRegex },
            { contactPerson: sRegex },
            { contactEmail: sRegex },
            { about: sRegex },
            { description: sRegex },
          ],
        },
      ];
    }

    const items = await Item.find(query)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate statistics
    const allMatches = await Item.find({
      $or: [
        { category: mehandiCat._id },
        { "mehandiPackages.basic.price": { $exists: true } },
        { title: /mehndi|mehandi/i },
      ],
    })
      .select("city active mehandiPackages price")
      .lean();

    const citiesSet = new Set();
    let activeCount = 0;
    let totalWithPackages = 0;

    for (const item of allMatches) {
      if (item.city?.trim()) citiesSet.add(item.city.trim());
      if (item.active) activeCount++;
      if (
        item.mehandiPackages?.basic?.price > 0 ||
        item.mehandiPackages?.standard?.price > 0 ||
        item.mehandiPackages?.premium?.price > 0 ||
        item.mehandiPackages?.luxury?.price > 0
      ) {
        totalWithPackages++;
      }
    }

    res.json({
      ok: true,
      data: {
        items,
        total: items.length,
        cities: Array.from(citiesSet).sort(),
        stats: {
          total: allMatches.length,
          active: activeCount,
          withPackages: totalWithPackages,
          citiesCount: citiesSet.size,
        },
      },
    });
  } catch (error) {
    console.error("[getAdminMehandis Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch Mehandi listings" });
  }
}

/**
 * Admin: Get single Mehandi listing detail
 */
export async function getAdminMehandiDetail(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: "Mehandi listing not found" });
    }

    res.json({ ok: true, data: { item } });
  } catch (error) {
    console.error("[getAdminMehandiDetail Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch Mehandi details" });
  }
}

/**
 * Admin: Create a new Mehandi listing
 */
export async function createAdminMehandi(req, res) {
  try {
    await dbConnect();
    const mehandiCat = await getMehandiCategory();

    const {
      name,
      title,
      contactPerson,
      address,
      locality,
      city = "Daudnagar",
      state = "Bihar",
      pincode,
      contactPhone,
      contactEmail,
      about,
      description,
      photos = [],
      images = [],
      albums = [],
      videos = [],
      mainCategories = [],
      subcategories = [],
      customSubcategoriesMap = {},
      mehandiPackages,
      price,
      active = true,
      featured = false,
      rating = 4.8,
      reviewsCount = 0,
    } = req.body;

    const finalTitle = (name || title || "").trim();
    if (!finalTitle) {
      return res.status(400).json({ ok: false, error: "Mehandi artist or studio name is required" });
    }

    const cleanPhone = (contactPhone || "").replace(/\D/g, "").slice(-10);

    // Auto-link or auto-create vendor account
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
    } else if (cleanPhone.length >= 10) {
      const dummyEmail = `mehandi.${cleanPhone}@flipsaura.local`;
      vendorUser = await User.create({
        name: contactPerson || finalTitle,
        email: dummyEmail,
        phone: cleanPhone,
        passwordHash: await User.hashPassword("Flipsaura@Vendor2026"),
        role: "vendor",
        isPhoneVerified: true,
        vendorProfile: {
          businessName: finalTitle,
          ownerName: contactPerson || finalTitle,
          vendorType: "Business",
          city,
          state,
          approved: true,
          verificationStatus: "approved",
        },
      });
    }

    // Merge photos/images
    const allImages = Array.isArray(photos) && photos.length > 0 ? photos : images || [];

    // Calculate minimum starting price
    let startPrice = Number(price) || 0;
    if (mehandiPackages) {
      const packagePrices = [
        Number(mehandiPackages.basic?.price) || 0,
        Number(mehandiPackages.standard?.price) || 0,
        Number(mehandiPackages.premium?.price) || 0,
        Number(mehandiPackages.luxury?.price) || 0,
      ].filter((p) => p > 0);
      if (packagePrices.length > 0 && (!startPrice || startPrice === 0)) {
        startPrice = Math.min(...packagePrices);
      }
    }

    const baseSlug = slugify(finalTitle);
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const newItem = await Item.create({
      title: finalTitle,
      slug: uniqueSlug,
      category: mehandiCat._id,
      vendor: vendorUser ? vendorUser._id : req.user?.id,
      address: address?.trim(),
      locality: locality?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: pincode?.trim(),
      contactPerson: contactPerson?.trim(),
      contactPhone: cleanPhone || contactPhone?.trim(),
      contactEmail: contactEmail?.trim() || vendorUser?.email,
      about: about?.trim(),
      description: description?.trim() || about?.trim(),
      images: allImages,
      albums: Array.isArray(albums) ? albums : [],
      videos: Array.isArray(videos) ? videos : [],
      mainCategories: Array.isArray(mainCategories) ? mainCategories : [],
      subcategories: Array.isArray(subcategories) ? subcategories : [],
      customSubcategoriesMap: customSubcategoriesMap || {},
      mehandiPackages: mehandiPackages || {
        basic: { price: startPrice || 3500, title: "Basic Package", description: "Simple bridal or guest mehndi", deliverables: [] },
        standard: { price: 7500, title: "Standard Package", description: "Full bridal hands & feet coverage", deliverables: [] },
        premium: { price: 15000, title: "Premium Package", description: "Designer bridal & family coverage", deliverables: [] },
        luxury: { price: 25000, title: "Luxury Package", description: "Royal custom portrait bridal mehndi & full team", deliverables: [] },
      },
      price: startPrice,
      active: active !== false,
      featured: Boolean(featured),
      rating: Number(rating) || 4.8,
      reviewsCount: Number(reviewsCount) || 0,
      source: "admin",
    });

    const populatedItem = await Item.findById(newItem._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    res.status(201).json({
      ok: true,
      message: "Mehandi listing created successfully!",
      data: { item: populatedItem },
    });
  } catch (error) {
    console.error("[createAdminMehandi Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to create Mehandi listing" });
  }
}

/**
 * Admin: Update Mehandi listing
 */
export async function updateAdminMehandi(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Mehandi listing not found" });
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
      contactPerson,
      address,
      locality,
      city,
      state,
      pincode,
      contactPhone,
      contactEmail,
      about,
      description,
      photos,
      images,
      albums,
      videos,
      mainCategories,
      subcategories,
      customSubcategoriesMap,
      mehandiPackages,
      price,
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
    if (contactPerson !== undefined) item.contactPerson = contactPerson?.trim();
    if (contactPhone !== undefined) {
      item.contactPhone = contactPhone?.trim();
      const cleanPhone = item.contactPhone.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length >= 10) {
        const vendorUser = await User.findOne({ phone: new RegExp(cleanPhone + "$") });
        if (vendorUser) {
          item.vendor = vendorUser._id;
        }
      }
    }
    if (contactEmail !== undefined) item.contactEmail = contactEmail?.trim();
    if (about !== undefined) item.about = about?.trim();
    if (description !== undefined) item.description = description?.trim();

    if (photos !== undefined) item.images = photos;
    else if (images !== undefined) item.images = images;

    if (albums !== undefined) item.albums = albums;
    if (videos !== undefined) item.videos = videos;
    if (mainCategories !== undefined) item.mainCategories = mainCategories;
    if (subcategories !== undefined) item.subcategories = subcategories;
    if (customSubcategoriesMap !== undefined) item.customSubcategoriesMap = customSubcategoriesMap;

    if (mehandiPackages !== undefined) {
      item.mehandiPackages = mehandiPackages;
      const packagePrices = [
        Number(mehandiPackages.basic?.price) || 0,
        Number(mehandiPackages.standard?.price) || 0,
        Number(mehandiPackages.premium?.price) || 0,
        Number(mehandiPackages.luxury?.price) || 0,
      ].filter((p) => p > 0);
      if (packagePrices.length > 0) {
        item.price = Math.min(...packagePrices);
      }
    }
    if (price !== undefined && Number(price) > 0) {
      item.price = Number(price);
    }

    if (active !== undefined) item.active = Boolean(active);
    if (featured !== undefined) item.featured = Boolean(featured);
    if (rating !== undefined) item.rating = Number(rating);
    if (reviewsCount !== undefined) item.reviewsCount = Number(reviewsCount);

    await item.save();

    const populatedItem = await Item.findById(item._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    res.json({
      ok: true,
      message: "Mehandi listing updated successfully!",
      data: { item: populatedItem },
    });
  } catch (error) {
    console.error("[updateAdminMehandi Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update Mehandi listing" });
  }
}

/**
 * Admin: Delete Mehandi listing
 */
export async function deleteAdminMehandi(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Mehandi listing not found" });
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
      message: `Mehandi listing "${item.title}" deleted successfully`,
    });
  } catch (error) {
    console.error("[deleteAdminMehandi Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to delete Mehandi listing" });
  }
}

/**
 * Admin: Toggle Mehandi active status
 */
export async function toggleAdminMehandiStatus(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Mehandi listing not found" });
    }

    if (req.user && req.user.role !== "admin") {
      const userPhone = (req.user.phone || "").replace(/\D/g, "").slice(-10);
      const itemPhone = (item.contactPhone || "").replace(/\D/g, "").slice(-10);
      const isOwner = String(item.vendor) === req.user.id || (userPhone.length >= 10 && itemPhone === userPhone);
      if (!isOwner) {
        return res.status(403).json({ ok: false, error: "Forbidden: You can only edit your own listings" });
      }
    }

    item.active = !item.active;
    await item.save();

    res.json({
      ok: true,
      message: `Mehandi listing is now ${item.active ? "Active" : "Inactive"}`,
      data: { active: item.active },
    });
  } catch (error) {
    console.error("[toggleAdminMehandiStatus Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to toggle Mehandi status" });
  }
}

