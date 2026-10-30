import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Room from "../models/Room.js";
import { getCurrentUser } from "../middleware/auth.js";

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDistrictRegex(district) {
  const trimmed = district.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "aurangabad" || lower === "aurngabad") {
    return new RegExp("(aurangabad|aurngabad)", "i");
  }
  return new RegExp(escapeRegex(trimmed), "i");
}

export const CATEGORY_PRICING_UNITS = {
  hotels: { unit: "per room", label: "₹ / room", short: "room" },
  venues: { unit: "per day", label: "₹ / day", short: "day" },
  "home-setup-pandal-tent-dj": { unit: "per event", label: "₹ / event", short: "event" },
  "planning-decor": { unit: "per event", label: "₹ / event", short: "event" },
  "photographer-videographer": { unit: "per day", label: "₹ / day", short: "day" },
  "makeup-grooming": { unit: "per session", label: "₹ / session", short: "session" },
  "mehndi-services": { unit: "per person", label: "₹ / person", short: "person" },
  "music-dance": { unit: "per event", label: "₹ / event", short: "event" },
  "pandit-priest": { unit: "per ceremony", label: "₹ / ceremony", short: "ceremony" },
  "food-catering": { unit: "per plate", label: "₹ / plate", short: "plate" },
  "invites-gifts": { unit: "per piece", label: "₹ / piece", short: "piece" },
  "transport-car-bus-auto": { unit: "per day", label: "₹ / day", short: "day" },
  "virtual-planning": { unit: "per consultation", label: "₹ / consultation", short: "consultation" },
  "orchestra-live-band": { unit: "per event", label: "₹ / event", short: "event" },
};

export const INDIAN_STATES_DISTRICTS = {
  Bihar: [
    "Araria",
    "Arwal",
    "Aurangabad",
    "Banka",
    "Begusarai",
    "Bhagalpur",
    "Bhojpur",
    "Buxar",
    "Darbhanga",
    "Daudnagar",
    "Dehri on Sone",
    "East Champaran",
    "Gaya",
    "Gopalganj",
    "Jamui",
    "Jehanabad",
    "Kaimur",
    "Katihar",
    "Khagaria",
    "Kishanganj",
    "Lakhisarai",
    "Madhepura",
    "Madhubani",
    "Munger",
    "Muzaffarpur",
    "Nalanda",
    "Nawada",
    "Patna",
    "Purnia",
    "Rohtas",
    "Saharsa",
    "Samastipur",
    "Saran",
    "Sheikhpura",
    "Sheohar",
    "Sitamarhi",
    "Siwan",
    "Supaul",
    "Vaishali",
    "West Champaran",
  ],
  Jharkhand: [
    "Jamshedpur",
    "Ranchi",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Hazaribagh",
    "Giridih",
    "Ramgarh",
    "Dumka",
    "Chaibasa",
  ],
  Rajasthan: [
    "Jaipur",
    "Udaipur",
    "Jodhpur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Alwar",
    "Bhilwara",
    "Sikar",
    "Pali",
  ],
  "Uttar Pradesh": [
    "Varanasi",
    "Lucknow",
    "Noida",
    "Agra",
    "Kanpur",
    "Prayagraj",
    "Ghaziabad",
    "Gorakhpur",
    "Meerut",
    "Bareilly",
    "Aligarh",
    "Mathura",
    "Ayodhya",
  ],
  Delhi: [
    "Central Delhi",
    "New Delhi",
    "North Delhi",
    "South Delhi",
    "West Delhi",
    "East Delhi",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Siliguri",
    "Durgapur",
    "Asansol",
    "Darjeeling",
  ],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Chhatrapati Sambhajinagar",
  ],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  Punjab: ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Mohali"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
  Uttarakhand: ["Dehradun", "Haridwar", "Rishikesh", "Nainital"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu"],
  Goa: ["North Goa", "South Goa"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
};

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

  const andConditions = [];

  if (req.query.q?.trim()) {
    const rawQ = req.query.q.trim();
    const escapedQ = escapeRegex(rawQ);
    andConditions.push({
      $or: [
        { title: new RegExp(escapedQ, "i") },
        { city: new RegExp(escapedQ, "i") },
        { state: new RegExp(escapedQ, "i") },
        { about: new RegExp(escapedQ, "i") },
        { description: new RegExp(escapedQ, "i") },
      ],
    });
  }

  const stateQuery = (req.query.state || "").trim();
  if (stateQuery) {
    const escapedState = escapeRegex(stateQuery);
    andConditions.push({
      $or: [
        { state: new RegExp(escapedState, "i") },
        { city: new RegExp(escapedState, "i") },
      ],
    });
  }

  const districtQuery = (req.query.district || req.query.city || "").trim();
  if (districtQuery) {
    const districtRegex = buildDistrictRegex(districtQuery);
    andConditions.push({
      $or: [
        { city: districtRegex },
        { state: districtRegex },
        { locality: districtRegex },
      ],
    });
  }

  // Locality filter
  const localityQuery = (req.query.locality || "").trim();
  if (localityQuery) {
    andConditions.push({
      locality: new RegExp(escapeRegex(localityQuery), "i"),
    });
  }

  // Venue Type filter (e.g. Banquet Halls, Marriage Garden / Lawns, Wedding Resorts, Small Function / Party Halls)
  const venueTypeQuery = (req.query.venueType || "").trim();
  if (venueTypeQuery && venueTypeQuery !== "all") {
    const types = venueTypeQuery.split(",").map((t) => t.trim()).filter(Boolean);
    if (types.length > 0) {
      andConditions.push({
        $or: types.map((t) => ({ venueType: new RegExp(`^${escapeRegex(t)}$`, "i") })),
      });
    }
  }

  // Space Types filter (e.g. Indoor, Outdoor, Poolside, Terrace)
  const spaceQuery = (req.query.space || req.query.spaceTypes || "").trim();
  if (spaceQuery && spaceQuery !== "all") {
    const spaces = spaceQuery.split(",").map((s) => s.trim()).filter(Boolean);
    if (spaces.length > 0) {
      andConditions.push({
        spaceTypes: { $in: spaces.map((s) => new RegExp(escapeRegex(s), "i")) },
      });
    }
  }

  // Features filter (e.g. In-house Catering, Decoration, Parking, etc.)
  const featuresQuery = (req.query.features || req.query.venueFeatures || "").trim();
  if (featuresQuery && featuresQuery !== "all") {
    const featuresList = featuresQuery.split(",").map((f) => f.trim()).filter(Boolean);
    for (const feat of featuresList) {
      const fRegex = new RegExp(escapeRegex(feat), "i");
      andConditions.push({
        $or: [
          { venueFeatures: fRegex },
          { "facilities.name": fRegex },
        ],
      });
    }
  }

  // Guest Capacity / No. of Guests filter
  const minGuests = parseInt(req.query.minGuests || req.query.guests, 10);
  const maxGuests = parseInt(req.query.maxGuests, 10);
  if (!Number.isNaN(minGuests) && minGuests > 0) {
    andConditions.push({
      $or: [
        { guestCapacity: { $gte: minGuests } },
        { capacity: { $gte: minGuests } },
      ],
    });
  }
  if (!Number.isNaN(maxGuests) && maxGuests > 0) {
    andConditions.push({
      $or: [
        { guestCapacity: { $lte: maxGuests, $gt: 0 } },
        { capacity: { $lte: maxGuests, $gt: 0 } },
      ],
    });
  }

  // Room Count filter
  const minRooms = parseInt(req.query.minRooms || req.query.roomCount, 10);
  if (!Number.isNaN(minRooms) && minRooms > 0) {
    andConditions.push({
      roomCount: { $gte: minRooms },
    });
  }

  // Price per Plate filter (food budget)
  const maxPricePerPlate = parseInt(req.query.maxPricePerPlate || req.query.pricePerPlate, 10);
  const minPricePerPlate = parseInt(req.query.minPricePerPlate, 10);
  if (!Number.isNaN(maxPricePerPlate) && maxPricePerPlate > 0) {
    andConditions.push({
      $or: [
        { pricePerPlateVeg: { $gt: 0, $lte: maxPricePerPlate } },
        { pricePerPlateNonVeg: { $gt: 0, $lte: maxPricePerPlate } },
      ],
    });
  }
  if (!Number.isNaN(minPricePerPlate) && minPricePerPlate > 0) {
    andConditions.push({
      $or: [
        { pricePerPlateVeg: { $gte: minPricePerPlate } },
        { pricePerPlateNonVeg: { $gte: minPricePerPlate } },
      ],
    });
  }

  // Rental Cost filter
  const minRental = parseInt(req.query.minRental, 10);
  const maxRental = parseInt(req.query.maxRental || req.query.rentalCost, 10);
  if (!Number.isNaN(minRental) && minRental > 0) {
    andConditions.push({
      $or: [
        { rentalPrice: { $gte: minRental } },
        { price: { $gte: minRental } },
      ],
    });
  }
  if (!Number.isNaN(maxRental) && maxRental > 0) {
    andConditions.push({
      $or: [
        { rentalPrice: { $gt: 0, $lte: maxRental } },
        { price: { $gt: 0, $lte: maxRental } },
      ],
    });
  }

  // Rating filter
  const minRating = parseFloat(req.query.minRating || req.query.rating);
  if (!Number.isNaN(minRating) && minRating > 0) {
    andConditions.push({
      rating: { $gte: minRating },
    });
  }

  if (andConditions.length > 0) {
    q.$and = (q.$and || []).concat(andConditions);
  }

  let minPrice = req.query.minPrice !== undefined && req.query.minPrice !== ""
    ? parseInt(req.query.minPrice, 10)
    : NaN;
  let maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== ""
    ? parseInt(req.query.maxPrice, 10)
    : NaN;

  if (!Number.isNaN(minPrice)) minPrice = Math.max(0, minPrice);
  if (!Number.isNaN(maxPrice)) maxPrice = Math.max(0, maxPrice);

  // Return clean empty result if minPrice exceeds maxPrice
  if (!Number.isNaN(minPrice) && !Number.isNaN(maxPrice) && minPrice > maxPrice) {
    return res.json({
      ok: true,
      data: {
        items: [],
        total: 0,
        page,
        totalPages: 0,
        warning: "Minimum price cannot be greater than maximum price.",
      },
    });
  }

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

export async function getFilterOptions(req, res) {
  await dbConnect();

  let categoryDoc = null;
  const catQuery = {};
  const slug = (req.query.category || "").trim();

  if (slug) {
    categoryDoc = await Category.findOne({
      $or: [{ slug }, ...(slug === "hotels-resorts" ? [{ slug: "hotels" }] : [])],
    }).lean();
    if (categoryDoc) {
      catQuery.category = categoryDoc._id;
    }
  }

  const baseMatch = { active: true, ...catQuery };

  const [dbItems, priceStats] = await Promise.all([
    Item.find(baseMatch, "state city price").lean(),
    Item.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          minPrice: { $min: { $cond: [{ $gt: ["$price", 0] }, "$price", "$$REMOVE"] } },
          maxPrice: { $max: "$price" },
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Aggregate states and districts present in active items
  const stateCounts = {};
  const districtCountsByState = {};

  for (const it of dbItems) {
    let s = (it.state || "").trim();
    const c = (it.city || "").trim();

    if (!s && c) {
      for (const [st, dists] of Object.entries(INDIAN_STATES_DISTRICTS)) {
        if (
          c.toLowerCase().includes(st.toLowerCase()) ||
          dists.some(d => c.toLowerCase().includes(d.toLowerCase()))
        ) {
          s = st;
          break;
        }
      }
    }

    if (s) {
      stateCounts[s] = (stateCounts[s] || 0) + 1;
      if (!districtCountsByState[s]) districtCountsByState[s] = {};
    }

    if (s && c) {
      const knownDists = INDIAN_STATES_DISTRICTS[s] || [];
      let matchedDistrict = null;
      for (const d of knownDists) {
        if (
          c.toLowerCase().includes(d.toLowerCase()) ||
          (d === "Aurangabad" && c.toLowerCase().includes("aurngabad"))
        ) {
          matchedDistrict = d;
          districtCountsByState[s][d] = (districtCountsByState[s][d] || 0) + 1;
        }
      }
      if (!matchedDistrict) {
        const cleanCity = c.split(",")[0].trim();
        if (cleanCity) {
          districtCountsByState[s][cleanCity] = (districtCountsByState[s][cleanCity] || 0) + 1;
        }
      }
    }
  }

  const statesList = [];
  const handledStates = new Set();

  // First, add states that have active items in the database
  for (const [st, count] of Object.entries(stateCounts)) {
    handledStates.add(st);
    const knownDists = INDIAN_STATES_DISTRICTS[st] || [];
    const activeDistsMap = districtCountsByState[st] || {};

    const districts = Array.from(
      new Set([...Object.keys(activeDistsMap), ...knownDists])
    ).map(distName => ({
      name: distName,
      count: activeDistsMap[distName] || 0,
      hasItems: Boolean(activeDistsMap[distName]),
    })).sort((a, b) => {
      if (a.hasItems && !b.hasItems) return -1;
      if (!a.hasItems && b.hasItems) return 1;
      return a.name.localeCompare(b.name);
    });

    statesList.push({
      name: st,
      hasItems: count > 0,
      count,
      districts,
    });
  }

  // Then add remaining standard Indian states
  for (const [st, dists] of Object.entries(INDIAN_STATES_DISTRICTS)) {
    if (!handledStates.has(st)) {
      statesList.push({
        name: st,
        hasItems: false,
        count: 0,
        districts: dists.map(d => ({ name: d, count: 0, hasItems: false })),
      });
    }
  }

  const pricingUnit = CATEGORY_PRICING_UNITS[slug] || {
    unit: "per booking",
    label: "₹ / booking",
    short: "booking",
  };

  const minPriceBound = priceStats[0]?.minPrice ?? 0;
  const maxPriceBound = priceStats[0]?.maxPrice ?? 100000;

  let venueFilterMeta = null;
  if (slug === "venues") {
    const venueItems = await Item.find(
      baseMatch,
      "venueType spaceTypes venueFeatures locality guestCapacity roomCount pricePerPlateVeg pricePerPlateNonVeg rentalPrice"
    ).lean();

    const venueTypesMap = new Map();
    const spaceTypesMap = new Map();
    const featuresMap = new Map();
    const localitiesSet = new Set();
    let maxGuestCapacity = 0;
    let maxRooms = 0;
    let maxPlatePrice = 0;
    let maxRentalPrice = 0;

    for (const v of venueItems) {
      if (v.venueType) {
        venueTypesMap.set(v.venueType, (venueTypesMap.get(v.venueType) || 0) + 1);
      }
      if (v.locality) {
        localitiesSet.add(v.locality.trim());
      }
      if (Array.isArray(v.spaceTypes)) {
        for (const s of v.spaceTypes) {
          if (s) spaceTypesMap.set(s, (spaceTypesMap.get(s) || 0) + 1);
        }
      }
      if (Array.isArray(v.venueFeatures)) {
        for (const f of v.venueFeatures) {
          if (f) featuresMap.set(f, (featuresMap.get(f) || 0) + 1);
        }
      }
      if (v.guestCapacity > maxGuestCapacity) maxGuestCapacity = v.guestCapacity;
      if (v.roomCount > maxRooms) maxRooms = v.roomCount;
      if (v.pricePerPlateVeg > maxPlatePrice) maxPlatePrice = v.pricePerPlateVeg;
      if (v.pricePerPlateNonVeg > maxPlatePrice) maxPlatePrice = v.pricePerPlateNonVeg;
      if (v.rentalPrice > maxRentalPrice) maxRentalPrice = v.rentalPrice;
    }

    venueFilterMeta = {
      venueTypes: Array.from(venueTypesMap.entries()).map(([name, count]) => ({ name, count })),
      spaceTypes: Array.from(spaceTypesMap.entries()).map(([name, count]) => ({ name, count })),
      features: Array.from(featuresMap.entries()).map(([name, count]) => ({ name, count })),
      localities: Array.from(localitiesSet).sort(),
      maxGuestCapacity: Math.max(1000, maxGuestCapacity),
      maxRooms: Math.max(50, maxRooms),
      maxPlatePrice: Math.max(2000, maxPlatePrice),
      maxRentalPrice: Math.max(200000, maxRentalPrice),
    };
  }

  return res.json({
    ok: true,
    data: {
      category: categoryDoc
        ? { _id: categoryDoc._id, name: categoryDoc.name, slug: categoryDoc.slug }
        : null,
      pricingUnit,
      priceBounds: {
        min: minPriceBound,
        max: maxPriceBound,
      },
      states: statesList,
      venueFilterMeta,
    },
  });
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

  const itemData = { ...req.body };
  delete itemData.rooms;

  const item = await Item.create({
    ...itemData,
    vendor: req.user.role === "vendor" ? req.user.id : req.body.vendor,
  });

  if (Array.isArray(req.body.rooms) && req.body.rooms.length > 0) {
    const roomsToInsert = req.body.rooms
      .filter((r) => r && r.name && r.name.trim())
      .map((r) => ({
        hotel: item._id,
        vendor: item.vendor,
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
      }));

    if (roomsToInsert.length > 0) {
      await Room.insertMany(roomsToInsert);
    }
  }

  return res.json({ ok: true, data: { item } });
}

export async function getItem(req, res) {
  await dbConnect();
  const item = await Item.findById(req.params.id)
    .populate("category")
    .populate({
      path: "vendor",
      select:
        "name email phone vendorProfile.businessName vendorProfile.ownerName vendorProfile.city vendorProfile.state vendorProfile.profilePhoto vendorProfile.facilities vendorProfile.categories vendorProfile.servicesList vendorProfile.approved vendorProfile.verificationStatus vendorProfile.source",
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

  // Fetch active rooms for this hotel item
  const rooms = await Room.find({ hotel: item._id, active: true })
    .sort({ pricePerNight: 1, createdAt: -1 })
    .lean();

  return res.json({
    ok: true,
    data: {
      item: {
        ...item,
        rooms: rooms || [],
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

  const updateData = { ...req.body };
  delete updateData.rooms;

  Object.assign(item, updateData);
  await item.save();

  if (Array.isArray(req.body.rooms)) {
    for (const r of req.body.rooms) {
      if (!r || !r.name?.trim()) continue;
      const roomPayload = {
        hotel: item._id,
        vendor: item.vendor,
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

  await Room.deleteMany({ hotel: item._id });
  await item.deleteOne();
  return res.json({ ok: true, data: { deleted: true } });
}
