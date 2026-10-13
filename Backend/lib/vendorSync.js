import User from "../models/User.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";

const defaultCategoryImages = {
  hotels: "/images/categories/hotels.jpg",
  venues: "/images/categories/venues.jpg",
  "transport-car-bus-auto": "/images/categories/transport.jpg",
  "home-setup-pandal-tent-dj": "/images/categories/home-setup.jpg",
  "planning-decor": "/images/categories/planning-decor.jpg",
  "photographer-videographer": "/images/categories/photography.jpg",
  "makeup-grooming": "/images/categories/makeup-grooming.jpg",
  "mehndi-services": "/images/categories/mehndi.jpg",
  "music-dance": "/images/categories/music-dance.jpg",
  "pandit-priest": "/images/categories/pandit-priest.jpg",
  "food-catering": "/images/categories/food-catering.jpg",
  "invites-gifts": "/images/categories/invites-gifts.jpg",
  "virtual-planning": "/images/categories/virtual-planning.jpg",
  "orchestra-live-band": "/images/categories/orchestra.jpg",
};

/**
 * Automatically syncs an approved vendor's onboarding services & facilities
 * into active Item listings so customer-side category browsing displays them immediately.
 */
export async function syncVendorServicesToItems(vendorId) {
  const vendor = await User.findById(vendorId)
    .populate("vendorProfile.categories")
    .populate("vendorProfile.servicesList.category");

  if (!vendor || vendor.role !== "vendor") return [];

  const vp = vendor.vendorProfile || {};
  const isApproved = Boolean(vp.approved);

  // If vendor is NOT approved, mark any previously synced items inactive
  if (!isApproved) {
    await Item.updateMany({ vendor: vendor._id }, { $set: { active: false } });
    return [];
  }

  const allCategories = await Category.find({}).lean();
  const categoryMap = new Map();
  allCategories.forEach((c) => {
    categoryMap.set(String(c._id), c);
    categoryMap.set(c.slug, c);
    categoryMap.set(c.name.toLowerCase().trim(), c);
  });

  const servicesToSync = [];
  const processedCatIds = new Set();

  if (Array.isArray(vp.servicesList) && vp.servicesList.length > 0) {
    for (const s of vp.servicesList) {
      let cat = null;
      if (s.category?._id) cat = categoryMap.get(String(s.category._id));
      else if (s.category) cat = categoryMap.get(String(s.category));
      else if (s.categoryName) cat = categoryMap.get(s.categoryName.toLowerCase().trim());

      if (cat && !processedCatIds.has(String(cat._id))) {
        processedCatIds.add(String(cat._id));
        servicesToSync.push({
          category: cat,
          startingPrice: Number(s.startingPrice) || Number(vp.startingPrice) || 15000,
          location: (s.serviceLocation || s.location || vp.serviceLocation || vp.city || "Jamshedpur").trim(),
          description: (s.description || vp.serviceDescription || vp.about || "").trim(),
          serviceName: (s.serviceName || "").trim(),
        });
      }
    }
  }

  // Also check if any category in vp.categories wasn't in servicesList
  if (Array.isArray(vp.categories)) {
    for (const cRef of vp.categories) {
      const catId = String(cRef._id || cRef);
      const cat = categoryMap.get(catId);
      if (cat && !processedCatIds.has(String(cat._id))) {
        processedCatIds.add(String(cat._id));
        servicesToSync.push({
          category: cat,
          startingPrice: Number(vp.startingPrice) || 15000,
          location: (vp.serviceLocation || vp.city || "Jamshedpur").trim(),
          description: (vp.serviceDescription || vp.about || "").trim(),
          serviceName: "",
        });
      }
    }
  }

  const syncedItems = [];

  for (const s of servicesToSync) {
    const cat = s.category;
    const catIdStr = String(cat._id);
    const catSlug = cat.slug;
    const catName = cat.name;

    // Filter facilities for this specific category
    const catFacilities = (Array.isArray(vp.facilities) ? vp.facilities : [])
      .filter((f) => {
        const fCatId = String(f.category?._id || f.category || "");
        const fCatName = (f.categoryName || f.category?.name || "").toLowerCase().trim();
        if (!fCatId && !fCatName) return true;
        if (fCatId && fCatId === catIdStr) return true;
        if (fCatName && (fCatName === catName.toLowerCase() || catName.toLowerCase().includes(fCatName))) return true;
        return false;
      })
      .map((f) => ({
        group: f.group || "Popular Amenities",
        name: f.name,
        icon: f.icon || "",
        highlight: Boolean(f.highlight),
      }));

    const baseServiceName = s.serviceName && s.serviceName.toLowerCase() !== catName.toLowerCase()
      ? s.serviceName
      : `${vp.businessName || vendor.name} – ${catName}`;
    const itemTitle = baseServiceName;

    const defaultImage = defaultCategoryImages[catSlug] || "/images/categories/venues.jpg";

    // Find existing item for this vendor & category
    let item = await Item.findOne({ vendor: vendor._id, category: cat._id });

    if (item) {
      item.title = itemTitle;
      item.price = s.startingPrice > 0 ? s.startingPrice : item.price;
      item.city = s.location || item.city || vp.city;
      item.about = s.description || item.about || `${catName} services by ${vp.businessName || vendor.name}`;
      if (catFacilities.length > 0) item.facilities = catFacilities;
      if (!item.images || item.images.length === 0) item.images = [defaultImage];
      item.active = true;
      await item.save();
      syncedItems.push(item);
    } else {
      item = await Item.create({
        title: itemTitle,
        category: cat._id,
        vendor: vendor._id,
        price: s.startingPrice > 0 ? s.startingPrice : 15000,
        city: s.location || vp.city || "Jamshedpur",
        about: s.description || `${catName} services by ${vp.businessName || vendor.name}`,
        description: s.description || "",
        facilities: catFacilities,
        images: [defaultImage],
        contactPhone: vendor.phone || "",
        contactEmail: vendor.email || "",
        active: true,
      });
      syncedItems.push(item);
    }
  }

  return syncedItems;
}
