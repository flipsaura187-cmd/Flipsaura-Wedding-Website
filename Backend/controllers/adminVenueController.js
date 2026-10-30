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

export const VENUE_PRIMARY_CATEGORIES = [
  "Banquet Halls",
  "Marriage Garden / Lawns",
  "Wedding Resorts",
  "Small Function / Party Halls",
];

/**
 * Admin: List all venues with filters, search, and category counts
 */
export async function getAdminVenues(req, res) {
  try {
    await dbConnect();

    // 1. Locate venue category
    let venueCat = await Category.findOne({ slug: "venues" }).lean();
    if (!venueCat) {
      venueCat = await Category.findOne({ name: /venue/i }).lean();
    }

    const { search, city, state, venueType, active } = req.query;

    const baseFilter = [];
    if (venueCat) {
      baseFilter.push({ category: venueCat._id });
    }
    // Also include any items that have explicit venueType configured
    baseFilter.push({ venueType: { $exists: true, $ne: "" } });

    const query = baseFilter.length > 0 ? { $or: baseFilter } : {};

    if (city && city.trim() && city !== "all") {
      query.city = new RegExp(`^${city.trim()}$`, "i");
    }

    if (state && state.trim() && state !== "all") {
      query.state = new RegExp(`^${state.trim()}$`, "i");
    }

    if (venueType && venueType.trim() && venueType !== "all") {
      query.venueType = new RegExp(`^${venueType.trim()}$`, "i");
    }

    if (active !== undefined && active !== "all") {
      query.active = active === "true" || active === true;
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { title: sRegex },
            { city: sRegex },
            { locality: sRegex },
            { state: sRegex },
            { contactPhone: sRegex },
            { contactEmail: sRegex },
            { about: sRegex },
            { venueType: sRegex },
          ],
        },
      ];
      delete query.$or;
    }

    const venues = await Item.find(query)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate category counts across all venues (independent of current type filter)
    const allVenuesMatch = baseFilter.length > 0 ? { $or: baseFilter } : {};
    const allVenues = await Item.find(allVenuesMatch).select("venueType city active").lean();

    let banquetHallsCount = 0;
    let marriageLawnsCount = 0;
    let weddingResortsCount = 0;
    let partyHallsCount = 0;
    const citiesSet = new Set();

    for (const v of allVenues) {
      if (v.city?.trim()) citiesSet.add(v.city.trim());
      const vt = (v.venueType || "").toLowerCase();
      if (vt.includes("banquet")) banquetHallsCount++;
      else if (vt.includes("lawn") || vt.includes("garden")) marriageLawnsCount++;
      else if (vt.includes("resort")) weddingResortsCount++;
      else if (vt.includes("party") || vt.includes("small") || vt.includes("function")) partyHallsCount++;
      else banquetHallsCount++; // default fallback
    }

    const formattedVenues = venues.map((v) => ({
      ...v,
      vendorName: v.vendor?.vendorProfile?.businessName || v.vendor?.name || "Direct / Admin",
      vendorContact: v.vendor?.phone || v.contactPhone || "—",
      vendorEmail: v.vendor?.email || v.contactEmail || "—",
      vendorAddress: v.vendor?.vendorProfile?.address || "—",
      guestCapacity: v.guestCapacity || v.capacity || 0,
      roomCount: v.roomCount || 0,
      rentalPrice: v.rentalPrice || v.price || 0,
      pricePerPlateVeg: v.pricePerPlateVeg || 0,
      pricePerPlateNonVeg: v.pricePerPlateNonVeg || 0,
      spaceTypes: Array.isArray(v.spaceTypes) ? v.spaceTypes : [],
      venueFeatures: Array.isArray(v.venueFeatures) ? v.venueFeatures : [],
    }));

    return res.json({
      ok: true,
      data: {
        venues: formattedVenues,
        totalVenues: formattedVenues.length,
        stats: {
          total: allVenues.length,
          banquetHalls: banquetHallsCount,
          marriageLawns: marriageLawnsCount,
          weddingResorts: weddingResortsCount,
          partyHalls: partyHallsCount,
          citiesCount: citiesSet.size,
          cities: Array.from(citiesSet).sort(),
        },
      },
    });
  } catch (error) {
    console.error("getAdminVenues error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to fetch venues" });
  }
}

/**
 * Admin: Get single venue detail
 */
export async function getAdminVenueDetail(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const venue = await Item.findById(id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    if (!venue) {
      return res.status(404).json({ ok: false, error: "Venue not found" });
    }

    return res.json({
      ok: true,
      data: {
        venue,
      },
    });
  } catch (error) {
    console.error("getAdminVenueDetail error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to fetch venue detail" });
  }
}

/**
 * Admin: Manually create a new venue & associated vendor
 */
export async function createAdminVenue(req, res) {
  try {
    await dbConnect();

    const {
      title,
      venueType = "Banquet Halls",
      vendorId,
      ownerName = "",
      contactPhone = "",
      contactEmail = "",
      address = "",
      locality = "",
      city = "",
      state = "Bihar",
      pincode = "",
      guestCapacity = 0,
      seatingCapacity = 0,
      floatingCapacity = 0,
      roomCount = 0,
      rentalPrice = 0,
      pricePerPlateVeg = 0,
      pricePerPlateNonVeg = 0,
      spaceTypes = [],
      venueFeatures = [],
      facilities = [],
      about = "",
      description = "",
      images = [],
      rating = 0,
      reviewsCount = 0,
      active = true,
      featured = false,
      sourceUrl = "",
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ ok: false, error: "Venue name/title is required" });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ ok: false, error: "City/Location is required" });
    }

    // 1. Locate or create Venue category
    let venueCat = await Category.findOne({ slug: "venues" });
    if (!venueCat) {
      venueCat = await Category.findOne({ name: /venue/i });
      if (!venueCat) {
        venueCat = await Category.create({
          name: "Venue/Resorts",
          slug: "venues",
          description: "Banquet halls, hotels, marriage lawns, resorts, and community halls for weddings and events.",
          image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_venues.png",
          order: 1,
          active: true,
        });
      }
    }

    // 2. Resolve or create vendor user
    let vendor = null;
    if (vendorId) {
      vendor = await User.findById(vendorId);
    }

    if (!vendor) {
      const safeEmail =
        contactEmail && contactEmail.trim()
          ? contactEmail.trim().toLowerCase()
          : `venue.${slugify(title)}.${Date.now().toString().slice(-4)}@flipsaura.local`;

      vendor = await User.findOne({ email: safeEmail });

      if (!vendor) {
        const defaultHash = await User.hashPassword("Flipsaura@Venue2026");
        vendor = await User.create({
          name: ownerName?.trim() || title.trim(),
          email: safeEmail,
          phone: contactPhone?.trim() || "",
          passwordHash: defaultHash,
          role: "vendor",
          vendorProfile: {
            businessName: title.trim(),
            ownerName: ownerName?.trim() || title.trim(),
            vendorType: "Business",
            address: address?.trim() || "",
            city: city?.trim() || "",
            state: state?.trim() || "",
            pincode: pincode?.trim() || "",
            about: about?.trim() || description?.trim() || "",
            serviceDescription: description?.trim() || about?.trim() || "",
            serviceLocation: city?.trim() || "",
            startingPrice: Number(rentalPrice) || Number(pricePerPlateVeg) || 0,
            categories: [venueCat._id],
            verificationStatus: "approved",
            approved: true,
            reviewedAt: new Date(),
            source: sourceUrl ? "manual_public_import" : "admin_manual",
            sourceUrl: sourceUrl?.trim() || "",
          },
        });
      } else {
        vendor.role = "vendor";
        if (!vendor.vendorProfile) vendor.vendorProfile = {};
        vendor.vendorProfile.businessName = title.trim();
        vendor.vendorProfile.approved = true;
        vendor.vendorProfile.verificationStatus = "approved";
        if (address) vendor.vendorProfile.address = address.trim();
        if (city) vendor.vendorProfile.city = city.trim();
        if (state) vendor.vendorProfile.state = state.trim();
        vendor.markModified("vendorProfile");
        await vendor.save();
      }
    }

    // Format facilities
    const formattedFacilities = (Array.isArray(facilities) ? facilities : [])
      .map((f) => {
        if (typeof f === "string") {
          return { group: "Popular Amenities", name: f.trim(), icon: "", highlight: true };
        }
        return {
          group: f.group || "Popular Amenities",
          name: f.name || String(f),
          icon: f.icon || "",
          highlight: Boolean(f.highlight),
        };
      })
      .filter((f) => Boolean(f.name));

    const cleanImages = (Array.isArray(images) ? images : [])
      .map((img) => String(img).trim())
      .filter(Boolean);

    if (cleanImages.length === 0) {
      cleanImages.push("/images/categories/venues.jpg");
    }

    const cleanSpaces = (Array.isArray(spaceTypes) ? spaceTypes : [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    const cleanFeatures = (Array.isArray(venueFeatures) ? venueFeatures : [])
      .map((f) => String(f).trim())
      .filter(Boolean);

    const numericRental = Math.max(0, Number(rentalPrice) || 0);
    const numericVegPlate = Math.max(0, Number(pricePerPlateVeg) || 0);
    const numericNonVegPlate = Math.max(0, Number(pricePerPlateNonVeg) || 0);
    const numericGuests = Math.max(0, Number(guestCapacity) || 0);
    const numericSeating = Math.max(0, Number(seatingCapacity) || 0);
    const numericFloating = Math.max(0, Number(floatingCapacity) || 0);
    const numericRooms = Math.max(0, Number(roomCount) || 0);

    const effectivePrice = numericRental > 0 ? numericRental : (numericVegPlate > 0 ? numericVegPlate : 0);

    const venueSlug = `${slugify(title)}-${slugify(city)}-${Date.now().toString().slice(-4)}`;

    const venue = await Item.create({
      title: title.trim(),
      slug: venueSlug,
      category: venueCat._id,
      vendor: vendor._id,
      venueType: venueType?.trim() || "Banquet Halls",
      locality: locality?.trim() || "",
      city: city.trim(),
      state: state.trim() || "Bihar",
      contactPhone: contactPhone?.trim() || vendor.phone || "",
      contactEmail: contactEmail?.trim() || vendor.email || "",
      price: effectivePrice,
      rentalPrice: numericRental,
      pricePerPlateVeg: numericVegPlate,
      pricePerPlateNonVeg: numericNonVegPlate,
      guestCapacity: numericGuests,
      capacity: numericGuests,
      seatingCapacity: numericSeating,
      floatingCapacity: numericFloating,
      roomCount: numericRooms,
      spaceTypes: cleanSpaces,
      venueFeatures: cleanFeatures,
      about: about.trim() || `${title} is a premier ${venueType} located in ${locality ? `${locality}, ` : ""}${city}.`,
      description: description.trim() || about.trim(),
      facilities: formattedFacilities,
      images: cleanImages,
      rating: Math.min(5, Math.max(0, Number(rating) || 0)),
      reviewsCount: Math.max(0, Number(reviewsCount) || 0),
      active: active !== undefined ? Boolean(active) : true,
      featured: Boolean(featured),
      source: sourceUrl ? "public_listing" : "admin_manual",
      sourceUrl: sourceUrl?.trim() || "",
    });

    const populatedVenue = await Item.findById(venue._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    return res.status(201).json({
      ok: true,
      message: "Venue created successfully.",
      data: {
        venue: populatedVenue,
      },
    });
  } catch (error) {
    console.error("createAdminVenue error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to create venue" });
  }
}

/**
 * Admin: Update venue details
 */
export async function updateAdminVenue(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const venue = await Item.findById(id);
    if (!venue) {
      return res.status(404).json({ ok: false, error: "Venue not found" });
    }

    const {
      title,
      venueType,
      ownerName,
      contactPhone,
      contactEmail,
      address,
      locality,
      city,
      state,
      pincode,
      guestCapacity,
      seatingCapacity,
      floatingCapacity,
      roomCount,
      rentalPrice,
      pricePerPlateVeg,
      pricePerPlateNonVeg,
      spaceTypes,
      venueFeatures,
      facilities,
      about,
      description,
      images,
      rating,
      reviewsCount,
      active,
      featured,
      sourceUrl,
    } = req.body;

    if (title !== undefined) venue.title = title.trim();
    if (venueType !== undefined) venue.venueType = venueType.trim();
    if (locality !== undefined) venue.locality = locality.trim();
    if (city !== undefined) venue.city = city.trim();
    if (state !== undefined) venue.state = state.trim();
    if (contactPhone !== undefined) venue.contactPhone = contactPhone.trim();
    if (contactEmail !== undefined) venue.contactEmail = contactEmail.trim();

    if (guestCapacity !== undefined) {
      venue.guestCapacity = Math.max(0, Number(guestCapacity) || 0);
      venue.capacity = venue.guestCapacity;
    }
    if (seatingCapacity !== undefined) {
      venue.seatingCapacity = Math.max(0, Number(seatingCapacity) || 0);
    }
    if (floatingCapacity !== undefined) {
      venue.floatingCapacity = Math.max(0, Number(floatingCapacity) || 0);
    }
    if (roomCount !== undefined) {
      venue.roomCount = Math.max(0, Number(roomCount) || 0);
    }

    if (rentalPrice !== undefined) {
      venue.rentalPrice = Math.max(0, Number(rentalPrice) || 0);
    }
    if (pricePerPlateVeg !== undefined) {
      venue.pricePerPlateVeg = Math.max(0, Number(pricePerPlateVeg) || 0);
    }
    if (pricePerPlateNonVeg !== undefined) {
      venue.pricePerPlateNonVeg = Math.max(0, Number(pricePerPlateNonVeg) || 0);
    }

    const rent = venue.rentalPrice || 0;
    const veg = venue.pricePerPlateVeg || 0;
    venue.price = rent > 0 ? rent : (veg > 0 ? veg : 0);

    if (spaceTypes !== undefined) {
      venue.spaceTypes = (Array.isArray(spaceTypes) ? spaceTypes : [])
        .map((s) => String(s).trim())
        .filter(Boolean);
    }

    if (venueFeatures !== undefined) {
      venue.venueFeatures = (Array.isArray(venueFeatures) ? venueFeatures : [])
        .map((f) => String(f).trim())
        .filter(Boolean);
    }

    if (about !== undefined) venue.about = about.trim();
    if (description !== undefined) venue.description = description.trim();
    if (sourceUrl !== undefined) venue.sourceUrl = sourceUrl.trim();
    if (rating !== undefined) venue.rating = Math.min(5, Math.max(1, Number(rating) || 4.8));
    if (reviewsCount !== undefined) venue.reviewsCount = Math.max(0, Number(reviewsCount) || 0);
    if (active !== undefined) venue.active = Boolean(active);
    if (featured !== undefined) venue.featured = Boolean(featured);

    if (facilities !== undefined) {
      venue.facilities = (Array.isArray(facilities) ? facilities : [])
        .map((f) => {
          if (typeof f === "string") {
            return { group: "Popular Amenities", name: f.trim(), icon: "", highlight: true };
          }
          return {
            group: f.group || "Popular Amenities",
            name: f.name || String(f),
            icon: f.icon || "",
            highlight: Boolean(f.highlight),
          };
        })
        .filter((f) => Boolean(f.name));
    }

    if (images !== undefined) {
      venue.images = (Array.isArray(images) ? images : [])
        .map((img) => String(img).trim())
        .filter(Boolean);
    }

    await venue.save();

    // Update associated vendor user profile if present
    if (venue.vendor) {
      const vendorUser = await User.findById(venue.vendor);
      if (vendorUser) {
        if (!vendorUser.vendorProfile) vendorUser.vendorProfile = {};
        if (title !== undefined) vendorUser.vendorProfile.businessName = title.trim();
        if (ownerName !== undefined) vendorUser.vendorProfile.ownerName = ownerName.trim();
        if (contactPhone !== undefined) vendorUser.phone = contactPhone.trim();
        if (address !== undefined) vendorUser.vendorProfile.address = address.trim();
        if (city !== undefined) vendorUser.vendorProfile.city = city.trim();
        if (state !== undefined) vendorUser.vendorProfile.state = state.trim();
        if (pincode !== undefined) vendorUser.vendorProfile.pincode = pincode.trim();
        if (about !== undefined) vendorUser.vendorProfile.about = about.trim();
        vendorUser.markModified("vendorProfile");
        await vendorUser.save();
      }
    }

    const updatedVenue = await Item.findById(venue._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    return res.json({
      ok: true,
      message: "Venue updated successfully.",
      data: {
        venue: updatedVenue,
      },
    });
  } catch (error) {
    console.error("updateAdminVenue error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to update venue" });
  }
}

/**
 * Admin: Delete a venue
 */
export async function deleteAdminVenue(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const venue = await Item.findById(id);
    if (!venue) {
      return res.status(404).json({ ok: false, error: "Venue not found" });
    }

    await venue.deleteOne();

    return res.json({
      ok: true,
      message: `Venue "${venue.title}" deleted successfully.`,
      data: {
        deletedVenueId: id,
      },
    });
  } catch (error) {
    console.error("deleteAdminVenue error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to delete venue" });
  }
}

