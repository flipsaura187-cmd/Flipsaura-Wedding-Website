import { dbConnect } from "../lib/db.js";
import Room from "../models/Room.js";
import Item from "../models/Item.js";
import User from "../models/User.js";

/**
 * List rooms:
 * - If `hotelId` / `hotel` query param is provided: Public customer list of active rooms for that hotel item.
 * - If called by logged-in vendor: Returns all rooms created by this vendor (across all their hotels).
 * - If called by admin: Returns all rooms or filters by hotel/vendor.
 */
export async function getRooms(req, res) {
  try {
    await dbConnect();

    const hotelId = req.query.hotelId || req.query.hotel;
    const vendorId = req.query.vendorId || req.query.vendor;

    // Public customer request for a specific hotel's rooms
    if (hotelId) {
      const filter = { hotel: hotelId };
      // Non-vendor / public only sees active rooms
      if (!req.user || req.user.role === "user" || req.user.role === "customer") {
        filter.active = true;
      }

      const rooms = await Room.find(filter)
        .populate("hotel", "title city state images category")
        .sort({ pricePerNight: 1, createdAt: -1 })
        .lean();

      return res.json({ ok: true, data: { rooms } });
    }

    // Authenticated vendor or admin listing their own rooms
    if (req.user) {
      const userRole = String(req.user.role || "").toLowerCase();

      if (userRole === "vendor") {
        const rooms = await Room.find({ vendor: req.user.id })
          .populate("hotel", "title city state images category")
          .sort({ createdAt: -1 })
          .lean();

        return res.json({ ok: true, data: { rooms } });
      }

      if (userRole === "admin") {
        const filter = {};
        if (vendorId) filter.vendor = vendorId;

        const rooms = await Room.find(filter)
          .populate("hotel", "title city state images category")
          .populate("vendor", "name email vendorProfile.businessName")
          .sort({ createdAt: -1 })
          .lean();

        return res.json({ ok: true, data: { rooms } });
      }
    }

    return res.status(400).json({
      ok: false,
      error: "Please provide hotelId query parameter or authenticate as a vendor.",
    });
  } catch (error) {
    console.error("getRooms error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to fetch rooms" });
  }
}

/**
 * Get a single room by ID
 */
export async function getRoom(req, res) {
  try {
    await dbConnect();
    const room = await Room.findById(req.params.id)
      .populate("hotel", "title city state images category vendor")
      .lean();

    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    return res.json({ ok: true, data: { room } });
  } catch (error) {
    console.error("getRoom error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to fetch room" });
  }
}

/**
 * Create a new room for a hotel (Vendor or Admin)
 */
export async function createRoom(req, res) {
  try {
    await dbConnect();

    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const {
      hotel: hotelId,
      name,
      roomType = "Deluxe Room",
      pricePerNight,
      availableRooms = 1,
      maxGuests = 2,
      bedType = "Double Bed",
      numberOfBeds = 1,
      facilities = [],
      description = "",
      images = [],
      active = true,
    } = req.body;

    if (!hotelId) {
      return res.status(400).json({ ok: false, error: "Hotel is required" });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: "Room name is required" });
    }
    if (pricePerNight === undefined || pricePerNight === null || Number(pricePerNight) < 0) {
      return res.status(400).json({ ok: false, error: "Valid price per night is required" });
    }

    // Verify hotel exists
    const hotel = await Item.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ ok: false, error: "Selected hotel listing not found" });
    }

    // Strict ownership check: vendor can only add rooms to their own hotel
    const isAdmin = String(req.user.role || "").toLowerCase() === "admin";
    if (!isAdmin && String(hotel.vendor) !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: You can only add rooms to your own hotel listing.",
      });
    }

    // Clean facilities & images array
    const cleanFacilities = Array.isArray(facilities)
      ? facilities.map((f) => String(f).trim()).filter(Boolean)
      : typeof facilities === "string"
      ? facilities.split(",").map((f) => f.trim()).filter(Boolean)
      : [];

    const cleanImages = Array.isArray(images)
      ? images.map((img) => String(img).trim()).filter(Boolean)
      : typeof images === "string" && images.trim()
      ? [images.trim()]
      : [];

    const room = await Room.create({
      hotel: hotel._id,
      vendor: hotel.vendor || req.user.id,
      name: name.trim(),
      roomType: roomType ? roomType.trim() : "Deluxe Room",
      pricePerNight: Number(pricePerNight),
      availableRooms: Math.max(0, Number(availableRooms) || 1),
      maxGuests: Math.max(1, Number(maxGuests) || 2),
      bedType: bedType ? bedType.trim() : "Double Bed",
      numberOfBeds: Math.max(1, Number(numberOfBeds) || 1),
      facilities: cleanFacilities,
      description: description ? description.trim() : "",
      images: cleanImages,
      active: active !== undefined ? Boolean(active) : true,
    });

    const populatedRoom = await Room.findById(room._id)
      .populate("hotel", "title city state images category")
      .lean();

    return res.status(201).json({
      ok: true,
      message: "Room created successfully.",
      data: { room: populatedRoom },
    });
  } catch (error) {
    console.error("createRoom error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to create room" });
  }
}

/**
 * Update an existing room (Vendor or Admin)
 */
export async function updateRoom(req, res) {
  try {
    await dbConnect();

    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    const isAdmin = String(req.user.role || "").toLowerCase() === "admin";
    if (!isAdmin && String(room.vendor) !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: You do not have permission to edit this room.",
      });
    }

    const {
      hotel: hotelId,
      name,
      roomType,
      pricePerNight,
      availableRooms,
      maxGuests,
      bedType,
      numberOfBeds,
      facilities,
      description,
      images,
      active,
    } = req.body;

    // If changing hotel, verify ownership of the new hotel
    if (hotelId && String(hotelId) !== String(room.hotel)) {
      const newHotel = await Item.findById(hotelId);
      if (!newHotel) {
        return res.status(404).json({ ok: false, error: "New hotel listing not found" });
      }
      if (!isAdmin && String(newHotel.vendor) !== String(req.user.id)) {
        return res.status(403).json({
          ok: false,
          error: "Forbidden: You can only assign rooms to your own hotel.",
        });
      }
      room.hotel = newHotel._id;
      room.vendor = newHotel.vendor || req.user.id;
    }

    if (name !== undefined) room.name = name.trim();
    if (roomType !== undefined) room.roomType = roomType.trim();
    if (pricePerNight !== undefined) room.pricePerNight = Math.max(0, Number(pricePerNight));
    if (availableRooms !== undefined) room.availableRooms = Math.max(0, Number(availableRooms));
    if (maxGuests !== undefined) room.maxGuests = Math.max(1, Number(maxGuests));
    if (bedType !== undefined) room.bedType = bedType.trim();
    if (numberOfBeds !== undefined) room.numberOfBeds = Math.max(1, Number(numberOfBeds));
    if (description !== undefined) room.description = description.trim();
    if (active !== undefined) room.active = Boolean(active);

    if (facilities !== undefined) {
      room.facilities = Array.isArray(facilities)
        ? facilities.map((f) => String(f).trim()).filter(Boolean)
        : typeof facilities === "string"
        ? facilities.split(",").map((f) => f.trim()).filter(Boolean)
        : [];
    }

    if (images !== undefined) {
      room.images = Array.isArray(images)
        ? images.map((img) => String(img).trim()).filter(Boolean)
        : typeof images === "string" && images.trim()
        ? [images.trim()]
        : [];
    }

    await room.save();

    const updated = await Room.findById(room._id)
      .populate("hotel", "title city state images category")
      .lean();

    return res.json({
      ok: true,
      message: "Room updated successfully.",
      data: { room: updated },
    });
  } catch (error) {
    console.error("updateRoom error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to update room" });
  }
}

/**
 * Delete a room (Vendor or Admin)
 */
export async function deleteRoom(req, res) {
  try {
    await dbConnect();

    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    const isAdmin = String(req.user.role || "").toLowerCase() === "admin";
    if (!isAdmin && String(room.vendor) !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: You do not have permission to delete this room.",
      });
    }

    await room.deleteOne();

    return res.json({
      ok: true,
      message: "Room deleted successfully.",
      data: { deleted: true },
    });
  } catch (error) {
    console.error("deleteRoom error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to delete room" });
  }
}
