import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { getCurrentUser } from "../middleware/auth.js";

export async function getItems(req, res) {
  await dbConnect();

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit || "12", 10)));
  const skip = (page - 1) * limit;

  const q = { active: true };

  if (req.query.isVendor) {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "vendor") {
      return res.status(!user ? 401 : 403).json({ ok: false, error: !user ? "Unauthorized" : "Forbidden" });
    }
    q.vendor = user.id;
  }

  if (req.query.category) {
    const slug = req.query.category;
    const cat = await Category.findOne({
      $or: [{ slug }, ...(slug === "hotels-resorts" ? [{ slug: "hotels" }] : [])]
    }).lean();
    if (!cat) return res.json({ ok: true, data: { items: [], total: 0, page, totalPages: 0 } });
    q.category = cat._id;
  }

  if (req.query.q) q.$text = { $search: req.query.q };
  if (req.query.city) q.city = new RegExp(`^${req.query.city}$`, "i");

  const minPrice = parseInt(req.query.minPrice || "", 10);
  const maxPrice = parseInt(req.query.maxPrice || "", 10);
  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    q.price = {};
    if (!Number.isNaN(minPrice)) q.price.$gte = minPrice;
    if (!Number.isNaN(maxPrice)) q.price.$lte = maxPrice;
  }

  const sortMap = {
    newest: { createdAt: -1 },
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    rating: { rating: -1 },
  };

  const [items, total] = await Promise.all([
    Item.find(q).sort(sortMap[req.query.sort] || sortMap.newest).skip(skip).limit(limit).lean(),
    Item.countDocuments(q),
  ]);

  return res.json({ ok: true, data: { items, total, page, totalPages: Math.ceil(total / limit) } });
}

export async function createItem(req, res) {
  if (!["admin", "vendor"].includes(req.user.role)) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  await dbConnect();

  if (req.user.role === "vendor") {
    const dbUser = await User.findById(req.user.id).lean();
    const isApproved = Boolean(
      dbUser?.vendorProfile?.approved &&
      dbUser?.vendorProfile?.verificationStatus === "approved"
    );
    if (!isApproved) {
      return res.status(403).json({
        ok: false,
        error: "Vendor account is not approved yet. All vendor features are locked until admin verification and approval.",
      });
    }
  }

  const { title, category, price } = req.body;
  if (!title || !category || price == null) {
    return res.status(400).json({ ok: false, error: "title, category, price required" });
  }

  const item = await Item.create({
    ...req.body,
    vendor: req.user.role === "vendor" ? req.user.id : req.body.vendor,
  });

  return res.json({ ok: true, data: { item } });
}

export async function getItem(req, res) {
  await dbConnect();
  const item = await Item.findById(req.params.id)
    .populate("category")
    .populate({
      path: "vendor",
      select:
        "name email phone vendorProfile.businessName vendorProfile.ownerName vendorProfile.city vendorProfile.state vendorProfile.profilePhoto vendorProfile.facilities vendorProfile.categories vendorProfile.servicesList",
      populate: [
        {
          path: "vendorProfile.facilities.category",
          select: "name slug",
        },
        {
          path: "vendorProfile.servicesList.category",
          select: "name slug",
        },
      ],
    })
    .lean();

  if (!item) return res.status(404).json({ ok: false, error: "Not found" });

  const itemCatId = String(item.category?._id || item.category || "");
  const itemCatSlug = (item.category?.slug || "").toLowerCase().trim();
  const itemCatName = (item.category?.name || "").toLowerCase().trim();

  // Resolve dynamic facilities:
  // If item has explicit facilities configured, use them.
  // Otherwise, match vendor's facilities for this item's category!
  let resolvedFacilities = [];
  if (Array.isArray(item.facilities) && item.facilities.length > 0) {
    resolvedFacilities = item.facilities;
  } else if (item.vendor?.vendorProfile?.facilities?.length) {
    resolvedFacilities = item.vendor.vendorProfile.facilities.filter((f) => {
      const fCatId = String(f.category?._id || f.category || "");
      const fCatSlug = (f.category?.slug || "").toLowerCase().trim();
      const fCatName = (f.categoryName || f.category?.name || "").toLowerCase().trim();

      // If facility has no specific category or matches this category
      if (!fCatId && !fCatName && !fCatSlug) return true;
      if (itemCatId && fCatId === itemCatId) return true;
      if (itemCatSlug && fCatSlug === itemCatSlug) return true;
      if (itemCatName && fCatName && (itemCatName === fCatName || itemCatName.includes(fCatName) || fCatName.includes(itemCatName))) return true;
      return false;
    });
  }

  // Resolve category-specific service details (pricing model, experience, coverage, inclusions)
  let resolvedCategoryService = null;
  if (Array.isArray(item.vendor?.vendorProfile?.servicesList)) {
    resolvedCategoryService = item.vendor.vendorProfile.servicesList.find((s) => {
      const sCatId = String(s.category?._id || s.category || "");
      const sCatName = (s.categoryName || s.category?.name || "").toLowerCase().trim();
      const sCatSlug = (s.category?.slug || "").toLowerCase().trim();

      if (itemCatId && sCatId === itemCatId) return true;
      if (itemCatSlug && sCatSlug === itemCatSlug) return true;
      if (itemCatName && sCatName && (itemCatName === sCatName || itemCatName.includes(sCatName) || sCatName.includes(itemCatName))) return true;
      return false;
    }) || null;
  }

  return res.json({
    ok: true,
    data: {
      item: {
        ...item,
        resolvedFacilities,
        resolvedCategoryService,
      },
    },
  });
}

export async function updateItem(req, res) {
  if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

  await dbConnect();

  if (req.user.role === "vendor") {
    const dbUser = await User.findById(req.user.id).lean();
    const isApproved = Boolean(
      dbUser?.vendorProfile?.approved &&
      dbUser?.vendorProfile?.verificationStatus === "approved"
    );
    if (!isApproved) {
      return res.status(403).json({
        ok: false,
        error: "Vendor account is not approved yet. All vendor features are locked until admin verification and approval.",
      });
    }
  }

  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: "Not found" });

  if (req.user.role !== "admin" && String(item.vendor) !== req.user.id) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  Object.assign(item, req.body);
  await item.save();
  return res.json({ ok: true, data: { item } });
}

export async function deleteItem(req, res) {
  if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

  await dbConnect();

  if (req.user.role === "vendor") {
    const dbUser = await User.findById(req.user.id).lean();
    const isApproved = Boolean(
      dbUser?.vendorProfile?.approved &&
      dbUser?.vendorProfile?.verificationStatus === "approved"
    );
    if (!isApproved) {
      return res.status(403).json({
        ok: false,
        error: "Vendor account is not approved yet. All vendor features are locked until admin verification and approval.",
      });
    }
  }

  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: "Not found" });

  if (req.user.role !== "admin" && String(item.vendor) !== req.user.id) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  await item.deleteOne();
  return res.json({ ok: true, data: { deleted: true } });
}
