import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Room from "../models/Room.js";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Admin: List all hotels with room metrics, vendor info, and search filters
 */
export async function getAdminHotels(req, res) {
  try {
    await dbConnect();

    // 1. Locate hotel category
    let hotelCat = await Category.findOne({ slug: "hotels" }).lean();
    if (!hotelCat) {
      hotelCat = await Category.findOne({ name: /hotel/i }).lean();
    }

    const { search, city, state, active } = req.query;

    // 2. Base hotel filter: strictly include genuine hotel items (hotels category or items with rooms).
    // Exclude Venue and Catering items that only happen to have "hotel" or "resort" in their business name.
    const roomsHotelIds = await Room.distinct("hotel");
    const hotelFilters = [];
    if (hotelCat) {
      hotelFilters.push({ category: hotelCat._id });
    }
    if (roomsHotelIds.length > 0) {
      hotelFilters.push({ _id: { $in: roomsHotelIds } });
    }

    const query = hotelFilters.length > 0 ? { $or: hotelFilters } : {};

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
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { title: sRegex },
            { city: sRegex },
            { state: sRegex },
            { contactPhone: sRegex },
            { contactEmail: sRegex },
            { about: sRegex },
          ],
        },
      ];
      delete query.$or;
    }

    const hotels = await Item.find(query)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .sort({ createdAt: -1 })
      .lean();

    const hotelIds = hotels.map((h) => h._id);

    // Fetch all rooms for these hotels
    const allRooms = await Room.find({ hotel: { $in: hotelIds } })
      .sort({ pricePerNight: 1, createdAt: -1 })
      .lean();

    // Group rooms by hotel
    const roomsByHotel = new Map();
    for (const rm of allRooms) {
      const hId = String(rm.hotel);
      if (!roomsByHotel.has(hId)) roomsByHotel.set(hId, []);
      roomsByHotel.get(hId).push(rm);
    }

    const formattedHotels = hotels.map((h) => {
      const rooms = roomsByHotel.get(String(h._id)) || [];
      const activeRooms = rooms.filter((r) => r.active);
      const lowestRoomPrice = activeRooms.length > 0 ? activeRooms[0].pricePerNight : h.price || 0;

      return {
        ...h,
        roomsCount: rooms.length,
        activeRoomsCount: activeRooms.length,
        minRoomPrice: lowestRoomPrice,
        rooms,
        vendorName: h.vendor?.vendorProfile?.businessName || h.vendor?.name || "Direct / Admin",
        vendorContact: h.vendor?.phone || h.contactPhone || "—",
        vendorEmail: h.vendor?.email || h.contactEmail || "—",
        vendorAddress: h.vendor?.vendorProfile?.address || "—",
      };
    });

    const totalRoomsCount = allRooms.length;
    const activeRoomsCount = allRooms.filter((r) => r.active).length;

    return res.json({
      ok: true,
      data: {
        hotels: formattedHotels,
        totalHotels: formattedHotels.length,
        totalRooms: totalRoomsCount,
        activeRooms: activeRoomsCount,
      },
    });
  } catch (error) {
    console.error("getAdminHotels error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to fetch hotels" });
  }
}

/**
 * Admin: Get single hotel detail with all rooms and vendor info
 */
export async function getAdminHotelDetail(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const hotel = await Item.findById(id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    if (!hotel) {
      return res.status(404).json({ ok: false, error: "Hotel not found" });
    }

    const rooms = await Room.find({ hotel: hotel._id })
      .sort({ pricePerNight: 1, createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      data: {
        hotel: {
          ...hotel,
          rooms,
          roomsCount: rooms.length,
        },
      },
    });
  } catch (error) {
    console.error("getAdminHotelDetail error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to fetch hotel detail" });
  }
}

/**
 * Admin: Manually create a new hotel vendor & property
 */
export async function createAdminHotel(req, res) {
  try {
    await dbConnect();

    const {
      title,
      vendorId,
      ownerName = "",
      contactPhone = "",
      contactEmail = "",
      address = "",
      city = "",
      state = "",
      pincode = "",
      price = 0,
      about = "",
      description = "",
      facilities = [],
      images = [],
      sourceUrl = "",
      rooms = [],
      active = true,
      featured = false,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ ok: false, error: "Hotel title/name is required" });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ ok: false, error: "City/Location is required" });
    }

    // 1. Locate or create hotel category
    let hotelCat = await Category.findOne({ slug: "hotels" });
    if (!hotelCat) {
      hotelCat = await Category.findOne({ name: /hotel/i });
      if (!hotelCat) {
        hotelCat = await Category.create({
          name: "Hotels",
          slug: "hotels",
          description: "Comfortable hotel rooms, wedding guest stays & luxury resorts.",
          image: "/images/categories/hotels.jpg",
          order: 1,
          active: true,
        });
      }
    }

    // 2. Resolve or create vendor account
    let vendor = null;
    if (vendorId) {
      vendor = await User.findById(vendorId);
    }

    if (!vendor) {
      // Auto-create or find vendor by email or phone
      const safeEmail =
        contactEmail && contactEmail.trim()
          ? contactEmail.trim().toLowerCase()
          : `hotel.${slugify(title)}.${Date.now().toString().slice(-4)}@flipsaura.local`;

      vendor = await User.findOne({ email: safeEmail });

      if (!vendor) {
        const defaultHash = await User.hashPassword("Flipsaura@Hotel2026");
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
            startingPrice: Number(price) || 0,
            categories: [hotelCat._id],
            verificationStatus: "approved",
            approved: true,
            reviewedAt: new Date(),
            source: sourceUrl ? "manual_public_import" : "admin_manual",
            sourceUrl: sourceUrl?.trim() || "",
          },
        });
      } else {
        // Ensure role is vendor & approved
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
      cleanImages.push("/images/categories/hotels.jpg");
    }

    // 3. Create Hotel Item
    const initialPrice = Number(price) || (rooms?.[0]?.pricePerNight ? Number(rooms[0].pricePerNight) : 0);

    const hotelSlug = `${slugify(title)}-${slugify(city)}-${Date.now().toString().slice(-4)}`;

    const hotel = await Item.create({
      title: title.trim(),
      slug: hotelSlug,
      category: hotelCat._id,
      vendor: vendor._id,
      city: city.trim(),
      state: state.trim(),
      contactPhone: contactPhone?.trim() || vendor.phone || "",
      contactEmail: contactEmail?.trim() || vendor.email || "",
      price: initialPrice,
      about: about.trim() || `${title} provides comfortable hotel accommodation and guest rooms in ${city}.`,
      description: description.trim() || about.trim(),
      facilities: formattedFacilities,
      images: cleanImages,
      active: active !== undefined ? Boolean(active) : true,
      featured: Boolean(featured),
      source: sourceUrl ? "public_listing" : "admin_manual",
      sourceUrl: sourceUrl?.trim() || "",
    });

    // 4. Create initial rooms if provided
    let createdRooms = [];
    if (Array.isArray(rooms) && rooms.length > 0) {
      const roomDocs = rooms
        .filter((r) => r && r.name && r.name.trim())
        .map((r) => ({
          hotel: hotel._id,
          vendor: vendor._id,
          name: r.name.trim(),
          roomType: r.roomType?.trim() || "Deluxe Room",
          pricePerNight: Math.max(0, Number(r.pricePerNight) || 0),
          availableRooms: Math.max(0, Number(r.availableRooms) || 1),
          maxGuests: Math.max(1, Number(r.maxGuests) || 2),
          bedType: r.bedType?.trim() || "1 King Bed",
          numberOfBeds: Math.max(1, Number(r.numberOfBeds) || 1),
          roomSize: r.roomSize?.trim() || "",
          cancellationPolicy: r.cancellationPolicy?.trim() || "Free Cancellation Till Check-in",
          facilities: Array.isArray(r.facilities) ? r.facilities.map((f) => String(f).trim()).filter(Boolean) : [],
          description: r.description?.trim() || "",
          images: Array.isArray(r.images) && r.images.length > 0 ? r.images : cleanImages,
          active: r.active !== undefined ? Boolean(r.active) : true,
        }));

      if (roomDocs.length > 0) {
        createdRooms = await Room.insertMany(roomDocs);

        // Update hotel lowest price
        const minRoomPrice = Math.min(...createdRooms.map((r) => r.pricePerNight).filter((p) => p > 0));
        if (minRoomPrice && minRoomPrice < hotel.price) {
          hotel.price = minRoomPrice;
          await hotel.save();
        }
      }
    }

    const populatedHotel = await Item.findById(hotel._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    return res.status(201).json({
      ok: true,
      message: "Hotel vendor & property created successfully.",
      data: {
        hotel: {
          ...populatedHotel,
          rooms: createdRooms,
          roomsCount: createdRooms.length,
        },
      },
    });
  } catch (error) {
    console.error("createAdminHotel error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to create hotel" });
  }
}

/**
 * Admin: Update hotel property and associated vendor details
 */
export async function updateAdminHotel(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const hotel = await Item.findById(id);
    if (!hotel) {
      return res.status(404).json({ ok: false, error: "Hotel not found" });
    }

    const {
      title,
      ownerName,
      contactPhone,
      contactEmail,
      address,
      city,
      state,
      pincode,
      price,
      about,
      description,
      facilities,
      images,
      sourceUrl,
      active,
      featured,
    } = req.body;

    if (title !== undefined) hotel.title = title.trim();
    if (city !== undefined) hotel.city = city.trim();
    if (state !== undefined) hotel.state = state.trim();
    if (contactPhone !== undefined) hotel.contactPhone = contactPhone.trim();
    if (contactEmail !== undefined) hotel.contactEmail = contactEmail.trim();
    if (price !== undefined) hotel.price = Math.max(0, Number(price));
    if (about !== undefined) hotel.about = about.trim();
    if (description !== undefined) hotel.description = description.trim();
    if (sourceUrl !== undefined) hotel.sourceUrl = sourceUrl.trim();
    if (active !== undefined) hotel.active = Boolean(active);
    if (featured !== undefined) hotel.featured = Boolean(featured);

    if (facilities !== undefined) {
      hotel.facilities = (Array.isArray(facilities) ? facilities : [])
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
      hotel.images = (Array.isArray(images) ? images : [])
        .map((img) => String(img).trim())
        .filter(Boolean);
    }

    await hotel.save();

    // Also update associated vendor user profile if present
    if (hotel.vendor) {
      const vendorUser = await User.findById(hotel.vendor);
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

    const updatedHotel = await Item.findById(hotel._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    const rooms = await Room.find({ hotel: hotel._id }).sort({ pricePerNight: 1 }).lean();

    return res.json({
      ok: true,
      message: "Hotel updated successfully.",
      data: {
        hotel: {
          ...updatedHotel,
          rooms,
          roomsCount: rooms.length,
        },
      },
    });
  } catch (error) {
    console.error("updateAdminHotel error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to update hotel" });
  }
}

/**
 * Admin: Delete a hotel and all of its associated rooms
 */
export async function deleteAdminHotel(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const hotel = await Item.findById(id);
    if (!hotel) {
      return res.status(404).json({ ok: false, error: "Hotel not found" });
    }

    // Delete all rooms under this hotel
    const deletedRooms = await Room.deleteMany({ hotel: hotel._id });

    // Delete hotel item
    await hotel.deleteOne();

    return res.json({
      ok: true,
      message: `Hotel "${hotel.title}" and ${deletedRooms.deletedCount} associated rooms deleted successfully.`,
      data: {
        deletedHotelId: id,
        deletedRoomsCount: deletedRooms.deletedCount,
      },
    });
  } catch (error) {
    console.error("deleteAdminHotel error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to delete hotel" });
  }
}
