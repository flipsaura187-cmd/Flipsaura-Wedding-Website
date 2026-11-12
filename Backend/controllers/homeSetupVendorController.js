import { dbConnect } from "../lib/db.js";
import HomeSetupProfile from "../models/HomeSetupProfile.js";
import HomeSetupService from "../models/HomeSetupService.js";

// ── PROFILE / ONBOARDING ─────────────────────────────────────────────────────

// GET /api/vendor/home-setup-v2/profile
// Returns vendor's profile (or null if not onboarded)
export async function getMyHomeSetupProfile(req, res) {
  try {
    await dbConnect();
    const profile = await HomeSetupProfile.findOne({ vendor: req.user.id }).lean();
    res.json({ ok: true, data: { profile } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// POST /api/vendor/home-setup-v2/onboard
// Creates or updates vendor's home setup onboarding profile
export async function saveHomeSetupOnboarding(req, res) {
  try {
    await dbConnect();
    const { locations, selectedCategories, customCategories } = req.body;

    const profile = await HomeSetupProfile.findOneAndUpdate(
      { vendor: req.user.id },
      {
        vendor: req.user.id,
        locations: locations || [],
        selectedCategories: selectedCategories || [],
        customCategories: customCategories || [],
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true, data: { profile } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// PUT /api/vendor/home-setup-v2/profile
// Update locations / categories after onboarding
export async function updateHomeSetupProfile(req, res) {
  try {
    await dbConnect();
    const { locations, selectedCategories, customCategories } = req.body;
    const update = {};
    if (locations !== undefined) update.locations = locations;
    if (selectedCategories !== undefined) update.selectedCategories = selectedCategories;
    if (customCategories !== undefined) update.customCategories = customCategories;

    const profile = await HomeSetupProfile.findOneAndUpdate(
      { vendor: req.user.id },
      update,
      { new: true }
    );
    if (!profile) return res.status(404).json({ ok: false, error: "Profile not found" });
    res.json({ ok: true, data: { profile } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// ── SERVICES ─────────────────────────────────────────────────────────────────

// GET /api/vendor/home-setup-v2/my-services
// Get all services for logged-in vendor, optionally filter by category
export async function getMyServices(req, res) {
  try {
    await dbConnect();
    const q = { vendor: req.user.id };
    if (req.query.category) q.mainCategory = req.query.category;
    if (req.query.subcategory) q.subcategory = req.query.subcategory;
    if (req.query.status) q.status = req.query.status;

    const services = await HomeSetupService.find(q).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: { services, count: services.length } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// GET /api/vendor/home-setup-v2/stats
// Dashboard stats for vendor
export async function getVendorHomeSetupStats(req, res) {
  try {
    await dbConnect();
    const profile = await HomeSetupProfile.findOne({ vendor: req.user.id }).lean();
    const allServices = await HomeSetupService.find({ vendor: req.user.id }).lean();

    const stats = {
      totalCategories: profile ? (profile.selectedCategories.length + profile.customCategories.length) : 0,
      totalSubcategories: [...new Set(allServices.map(s => s.subcategory))].length,
      totalServices: allServices.length,
      publishedServices: allServices.filter(s => s.status === "published").length,
      draftServices: allServices.filter(s => s.status === "draft").length,
      unavailableServices: allServices.filter(s => !s.isAvailable).length,
    };

    res.json({ ok: true, data: { stats, profile } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// POST /api/vendor/home-setup-v2/services
// Create a new service
export async function createService(req, res) {
  try {
    await dbConnect();
    const profile = await HomeSetupProfile.findOne({ vendor: req.user.id });

    const serviceData = {
      ...req.body,
      vendor: req.user.id,
      profile: profile?._id,
      serviceLocations: req.body.serviceLocations || (profile?.locations?.map(l => l.city) || []),
    };

    const service = await HomeSetupService.create(serviceData);
    res.status(201).json({ ok: true, data: { service } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// PUT /api/vendor/home-setup-v2/services/:id
// Update a service
export async function updateService(req, res) {
  try {
    await dbConnect();
    const service = await HomeSetupService.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      req.body,
      { new: true }
    );
    if (!service) return res.status(404).json({ ok: false, error: "Service not found" });
    res.json({ ok: true, data: { service } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// DELETE /api/vendor/home-setup-v2/services/:id
// Delete a service
export async function deleteService(req, res) {
  try {
    await dbConnect();
    const service = await HomeSetupService.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
    if (!service) return res.status(404).json({ ok: false, error: "Service not found" });
    res.json({ ok: true, data: { message: "Deleted" } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// ── CUSTOMER-SIDE PUBLIC APIs ─────────────────────────────────────────────────

// GET /api/home-setup-v2/categories?city=Daudnagar
// Returns available categories in a city (for customers)
export async function getPublicCategories(req, res) {
  try {
    await dbConnect();
    const { city } = req.query;

    const q = { status: "published", isAvailable: true, active: true };
    if (city && city !== "all") {
      q.serviceLocations = { $regex: new RegExp(`^${city}$`, "i") };
    }

    const services = await HomeSetupService.find(q)
      .select("mainCategory subcategory startingPrice vendor serviceLocations")
      .populate("vendor", "name vendorProfile.businessName vendorProfile.approved vendorProfile.verificationStatus")
      .lean();

    // Filter: only approved vendors
    const approved = services.filter(s => {
      const v = s.vendor;
      return v?.vendorProfile?.approved && v?.vendorProfile?.verificationStatus === "approved";
    });

    // Group by category
    const categoryMap = {};
    approved.forEach(s => {
      if (!categoryMap[s.mainCategory]) {
        categoryMap[s.mainCategory] = { subcategories: new Set(), minPrice: Infinity, serviceCount: 0 };
      }
      categoryMap[s.mainCategory].subcategories.add(s.subcategory);
      if (s.startingPrice < categoryMap[s.mainCategory].minPrice) {
        categoryMap[s.mainCategory].minPrice = s.startingPrice;
      }
      categoryMap[s.mainCategory].serviceCount++;
    });

    const categories = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      subcategoryCount: data.subcategories.size,
      subcategories: Array.from(data.subcategories),
      minPrice: data.minPrice === Infinity ? 0 : data.minPrice,
      serviceCount: data.serviceCount,
    }));

    res.json({ ok: true, data: { categories, city: city || "all" } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// GET /api/home-setup-v2/services?city=Daudnagar&category=Tent%20%26%20Pandal&subcategory=Luxury%20Wedding%20Tent
// Returns published services for customers
export async function getPublicServices(req, res) {
  try {
    await dbConnect();
    const { city, category, subcategory } = req.query;

    const q = { status: "published", isAvailable: true, active: true };
    if (city && city !== "all") {
      q.serviceLocations = { $regex: new RegExp(`^${city}$`, "i") };
    }
    if (category) q.mainCategory = category;
    if (subcategory) q.subcategory = subcategory;

    const services = await HomeSetupService.find(q)
      .populate("vendor", "name phone vendorProfile")
      .sort({ startingPrice: 1 })
      .lean();

    // Filter approved vendors
    const result = services.filter(s => {
      const v = s.vendor;
      return v?.vendorProfile?.approved && v?.vendorProfile?.verificationStatus === "approved";
    }).map(s => ({
      ...s,
      vendor: {
        _id: s.vendor._id,
        name: s.vendor.vendorProfile?.businessName || s.vendor.name,
        phone: s.vendor.phone,
        city: s.vendor.vendorProfile?.city,
      }
    }));

    res.json({ ok: true, data: { services: result, count: result.length } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
