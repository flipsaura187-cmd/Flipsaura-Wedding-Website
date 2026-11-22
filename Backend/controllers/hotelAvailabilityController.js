import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Room from "../models/Room.js";
import {
  getHotelAvailabilityCalendar,
  validateStayAvailability,
  getISTDateString,
  addDays,
} from "../lib/hotelAvailability.js";
import { invalidateRoomCache } from "../lib/redis.js";

/**
 * Public endpoint to fetch real-time 30-day availability calendar for a hotel item (and optional room)
 * GET /api/items/:id/hotel-availability?roomId=...
 */
export async function getHotelAvailability(req, res) {
  try {
    await dbConnect();
    const hotelId = req.params.id;
    const roomId = req.query.roomId || null;

    const calendarData = await getHotelAvailabilityCalendar({ hotelId, roomId });

    return res.json({
      ok: true,
      data: calendarData,
    });
  } catch (error) {
    console.error("[HotelAvailability] Error:", error);
    return res.status(error.message === "Hotel not found" ? 404 : 500).json({
      ok: false,
      error: error.message || "Failed to fetch hotel availability",
    });
  }
}

/**
 * Admin or Vendor endpoint to manually block/unblock dates for a Hotel
 * POST /api/items/:id/block-dates
 * Body: { dates: ["YYYY-MM-DD"], action: "block" | "unblock" }
 */
export async function toggleHotelBlockedDates(req, res) {
  try {
    await dbConnect();
    const hotelId = req.params.id;
    const { dates, action } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ ok: false, error: "dates array required" });
    }

    const hotel = await Item.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ ok: false, error: "Hotel not found" });
    }

    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
    const hotelVendorId = String(hotel.vendor?._id || hotel.vendor || "");
    if (!isAdmin && hotelVendorId !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: You do not have permission to manage dates for this hotel.",
      });
    }

    const currentBlocked = new Set(hotel.blockedDates || []);
    if (action === "unblock") {
      for (const d of dates) currentBlocked.delete(d);
    } else {
      // Default: block
      for (const d of dates) currentBlocked.add(d);
    }

    hotel.blockedDates = Array.from(currentBlocked).sort();
    await hotel.save();

    return res.json({
      ok: true,
      message: `Dates successfully ${action === "unblock" ? "unblocked" : "blocked"}.`,
      data: { blockedDates: hotel.blockedDates },
    });
  } catch (error) {
    console.error("[toggleHotelBlockedDates] Error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to update blocked dates" });
  }
}

/**
 * Admin or Vendor endpoint to manually block/unblock dates for a specific Room
 * POST /api/rooms/:id/block-dates
 * Body: { dates: ["YYYY-MM-DD"], action: "block" | "unblock" }
 */
export async function toggleRoomBlockedDates(req, res) {
  try {
    await dbConnect();
    const roomId = req.params.id;
    const { dates, action } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ ok: false, error: "dates array required" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
    const roomVendorId = String(room.vendor?._id || room.vendor || "");
    if (!isAdmin && roomVendorId !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: You do not have permission to manage dates for this room.",
      });
    }

    const currentBlocked = new Set(room.blockedDates || []);
    if (action === "unblock") {
      for (const d of dates) currentBlocked.delete(d);
    } else {
      // Default: block
      for (const d of dates) currentBlocked.add(d);
    }

    room.blockedDates = Array.from(currentBlocked).sort();
    await room.save();

    await invalidateRoomCache(room._id, room.hotel);

    return res.json({
      ok: true,
      message: `Room dates successfully ${action === "unblock" ? "unblocked" : "blocked"}.`,
      data: { blockedDates: room.blockedDates },
    });
  } catch (error) {
    console.error("[toggleRoomBlockedDates] Error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to update blocked dates" });
  }
}
