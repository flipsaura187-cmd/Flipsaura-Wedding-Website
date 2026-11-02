import { dbConnect } from "../lib/db.js";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Facility from "../models/Facility.js";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SETUP_TYPES = ["Basic", "Standard", "Premium", "Luxury"];

export const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Engagement",
  "Birthday",
  "Anniversary",
  "Corporate Event",
  "Family Function",
  "Other",
];

/**
 * Public & Admin: Fetch all active categories, subcategories, facilities, and options
 */
export async function getCatalogueMetadata(req, res) {
  try {
    await dbConnect();

    const [categories, subcategories, facilities] = await Promise.all([
      Category.find({ active: { $ne: false } }).sort({ order: 1, name: 1 }).lean(),
      Subcategory.find({ active: { $ne: false } }).sort({ order: 1, name: 1 }).lean(),
      Facility.find({ active: { $ne: false } }).sort({ order: 1, name: 1 }).lean(),
    ]);

    return res.json({
      ok: true,
      data: {
        categories,
        subcategories,
        facilities,
        setupTypes: SETUP_TYPES,
        eventTypes: EVENT_TYPES,
      },
    });
  } catch (error) {
    console.error("getCatalogueMetadata error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to fetch catalogue metadata" });
  }
}

// ==========================================
// Admin Category CRUD
// ==========================================

export async function getAdminCategories(req, res) {
  try {
    await dbConnect();
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    return res.json({ ok: true, data: categories });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function createAdminCategory(req, res) {
  try {
    await dbConnect();
    const { name, description, icon, image, order, active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: "Category name is required" });
    }

    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ ok: false, error: "A category with this name already exists" });
    }

    const cat = await Category.create({
      name: name.trim(),
      slug,
      description: description?.trim() || "",
      icon: icon?.trim() || "",
      image: image?.trim() || "",
      order: Number(order) || 0,
      active: active !== undefined ? Boolean(active) : true,
    });

    return res.status(201).json({ ok: true, data: cat });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function updateAdminCategory(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { name, description, icon, image, order, active } = req.body;

    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ ok: false, error: "Category not found" });

    if (name !== undefined) {
      cat.name = name.trim();
      cat.slug = slugify(name);
    }
    if (description !== undefined) cat.description = description.trim();
    if (icon !== undefined) cat.icon = icon.trim();
    if (image !== undefined) cat.image = image.trim();
    if (order !== undefined) cat.order = Number(order) || 0;
    if (active !== undefined) cat.active = Boolean(active);

    await cat.save();
    return res.json({ ok: true, data: cat });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function deleteAdminCategory(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ ok: false, error: "Category not found" });

    // Soft delete / disable
    cat.active = false;
    await cat.save();
    return res.json({ ok: true, message: "Category deactivated successfully", data: cat });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

// ==========================================
// Admin Subcategory CRUD
// ==========================================

export async function getAdminSubcategories(req, res) {
  try {
    await dbConnect();
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.categorySlug) filter.categorySlug = req.query.categorySlug;

    const subcategories = await Subcategory.find(filter).sort({ order: 1, name: 1 }).lean();
    return res.json({ ok: true, data: subcategories });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function createAdminSubcategory(req, res) {
  try {
    await dbConnect();
    const { name, category, description, icon, order, active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: "Subcategory name is required" });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ ok: false, error: "Main category is required" });
    }

    const slug = slugify(name);
    const categorySlug = slugify(category);

    const existing = await Subcategory.findOne({ slug, categorySlug });
    if (existing) {
      return res.status(400).json({ ok: false, error: "This subcategory already exists under this category" });
    }

    const sub = await Subcategory.create({
      name: name.trim(),
      slug,
      category: category.trim(),
      categorySlug,
      description: description?.trim() || "",
      icon: icon?.trim() || "",
      order: Number(order) || 0,
      active: active !== undefined ? Boolean(active) : true,
    });

    return res.status(201).json({ ok: true, data: sub });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function updateAdminSubcategory(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { name, category, description, icon, order, active } = req.body;

    const sub = await Subcategory.findById(id);
    if (!sub) return res.status(404).json({ ok: false, error: "Subcategory not found" });

    if (name !== undefined) {
      sub.name = name.trim();
      sub.slug = slugify(name);
    }
    if (category !== undefined) {
      sub.category = category.trim();
      sub.categorySlug = slugify(category);
    }
    if (description !== undefined) sub.description = description.trim();
    if (icon !== undefined) sub.icon = icon.trim();
    if (order !== undefined) sub.order = Number(order) || 0;
    if (active !== undefined) sub.active = Boolean(active);

    await sub.save();
    return res.json({ ok: true, data: sub });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function deleteAdminSubcategory(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const sub = await Subcategory.findById(id);
    if (!sub) return res.status(404).json({ ok: false, error: "Subcategory not found" });

    sub.active = false;
    await sub.save();
    return res.json({ ok: true, message: "Subcategory deactivated successfully", data: sub });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

// ==========================================
// Admin Facility CRUD
// ==========================================

export async function getAdminFacilities(req, res) {
  try {
    await dbConnect();
    const filter = {};
    if (req.query.group) filter.group = req.query.group;

    const facilities = await Facility.find(filter).sort({ order: 1, name: 1 }).lean();
    return res.json({ ok: true, data: facilities });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function createAdminFacility(req, res) {
  try {
    await dbConnect();
    const { name, group, category, icon, order, active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: "Facility name is required" });
    }

    const slug = slugify(name);
    const facilityGroup = group?.trim() || "Popular Amenities";

    const existing = await Facility.findOne({ slug, group: facilityGroup });
    if (existing) {
      return res.status(400).json({ ok: false, error: "This facility already exists in this group" });
    }

    const fac = await Facility.create({
      name: name.trim(),
      slug,
      group: facilityGroup,
      category: category?.trim() || "",
      icon: icon?.trim() || "",
      order: Number(order) || 0,
      active: active !== undefined ? Boolean(active) : true,
    });

    return res.status(201).json({ ok: true, data: fac });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function updateAdminFacility(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { name, group, category, icon, order, active } = req.body;

    const fac = await Facility.findById(id);
    if (!fac) return res.status(404).json({ ok: false, error: "Facility not found" });

    if (name !== undefined) {
      fac.name = name.trim();
      fac.slug = slugify(name);
    }
    if (group !== undefined) fac.group = group.trim();
    if (category !== undefined) fac.category = category.trim();
    if (icon !== undefined) fac.icon = icon.trim();
    if (order !== undefined) fac.order = Number(order) || 0;
    if (active !== undefined) fac.active = Boolean(active);

    await fac.save();
    return res.json({ ok: true, data: fac });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

export async function deleteAdminFacility(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const fac = await Facility.findById(id);
    if (!fac) return res.status(404).json({ ok: false, error: "Facility not found" });

    fac.active = false;
    await fac.save();
    return res.json({ ok: true, message: "Facility deactivated successfully", data: fac });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

