import mongoose from "mongoose";
import Item from "../models/Item.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import Category from "../models/Category.js";

/**
 * Returns current date string in IST (Asia/Kolkata) as 'YYYY-MM-DD'
 */
export function getISTDateString(d = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

/**
 * Adds N days to a YYYY-MM-DD date string
 */
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().split("T")[0];
}

/**
 * Converts check-in and check-out dates into an array of occupied night date strings (YYYY-MM-DD).
 * For a stay from Nov 22 to Nov 24, occupied nights are Nov 22 and Nov 23 (checkout day night is free).
 * For a single-day/same-day booking, the occupied night is [checkInDate].
 */
export function getOccupiedNights(checkInDate, checkOutDate, fallbackEventDate) {
  const checkIn = (checkInDate || "").trim();
  const checkOut = (checkOutDate || "").trim();

  if (checkIn) {
    if (!checkOut || checkOut <= checkIn) {
      return [checkIn];
    }
    const nights = [];
    let cur = checkIn;
    // Iterate nights up to (not including) checkOut
    while (cur < checkOut) {
      nights.push(cur);
      cur = addDays(cur, 1);
      if (nights.length > 90) break; // Safety limit
    }
    return nights.length > 0 ? nights : [checkIn];
  }

  // Fallback to legacy eventDate string (e.g. "2026-11-22" or "2026-11-22 to 2026-11-24")
  const ev = (fallbackEventDate || "").trim();
  if (ev.includes(" to ")) {
    const [start, end] = ev.split(" to ").map((s) => s.trim());
    return getOccupiedNights(start, end);
  }
  return ev ? [ev] : [];
}

/**
 * Checks whether an item represents a Hotel category
 */
export async function isItemHotel(item) {
  if (!item) return false;
  if (item.category) {
    let cat = item.category;
    if (mongoose.isValidObjectId(cat) && !cat.slug) {
      cat = await Category.findById(cat).lean();
    }
    const catSlug = (cat?.slug || "").toLowerCase();
    const catName = (cat?.name || "").toLowerCase();

    // If explicit non-hotel category (e.g., venues, caterers, photographers), do not treat as hotel
    if (catSlug && catSlug !== "hotels") {
      return false;
    }
    if (catSlug === "hotels" || catName.includes("hotel")) return true;
  }

  // If item has active room types created in Room collection
  const roomCount = await Room.countDocuments({ hotel: item._id, active: true });
  if (roomCount > 0) return true;

  const title = (item.title || "").toLowerCase();
  if (
    title.includes("hotel accommodation") ||
    title.includes("hotel") ||
    title.includes("resort") ||
    title.includes("inn")
  ) {
    return true;
  }
  return false;
}

/**
 * Compute real-time 30-day availability for a hotel or specific room.
 * Allowed booking window: current date (IST) up to 1 calendar month in advance (today + 30 days).
 */
export async function getHotelAvailabilityCalendar({ hotelId, roomId = null }) {
  const hotel = await Item.findById(hotelId).lean();
  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const todayIST = getISTDateString();
  const maxDateIST = addDays(todayIST, 30); // 1 calendar month advance

  // Fetch active rooms for this hotel
  const activeRooms = await Room.find({ hotel: hotelId, active: true }).lean();
  let selectedRoom = null;
  if (roomId) {
    selectedRoom = activeRooms.find((r) => String(r._id) === String(roomId));
    if (!selectedRoom) {
      // Attempt direct query if not in activeRooms list
      selectedRoom = await Room.findById(roomId).lean();
    }
  }

  // Active bookings overlapping window
  const now = new Date();
  const activeBookings = await Booking.find({
    item: hotelId,
    status: { $in: ["paid", "confirmed", "pending"] },
    $or: [
      { status: { $in: ["paid", "confirmed"] } },
      { status: "pending", holdExpiresAt: { $gt: now } },
      { status: "pending", holdExpiresAt: null, createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } },
    ],
  }).lean();

  // Hotel-level manually blocked dates
  const hotelBlockedSet = new Set(hotel.blockedDates || []);
  const roomBlockedSet = new Set(selectedRoom?.blockedDates || []);

  // Compute total inventory
  let totalInventory = 1;
  if (selectedRoom) {
    totalInventory = Math.max(1, Number(selectedRoom.availableRooms) || 1);
  } else if (activeRooms.length > 0) {
    totalInventory = activeRooms.reduce((sum, r) => sum + (Number(r.availableRooms) || 1), 0);
  } else {
    totalInventory = Math.max(1, Number(hotel.roomCount) || 1);
  }

  // Track room counts booked per night
  // Structure: { [dateStr]: { [roomId]: number, total: number } }
  const bookedPerNight = {};

  for (const b of activeBookings) {
    const nights = getOccupiedNights(b.checkInDate, b.checkOutDate, b.eventDate);
    const bRoomId = b.roomId ? String(b.roomId) : "general";
    const bCount = Math.max(1, Number(b.roomsCount) || 1);

    for (const night of nights) {
      if (!bookedPerNight[night]) {
        bookedPerNight[night] = { rooms: {}, total: 0 };
      }
      bookedPerNight[night].total += bCount;
      bookedPerNight[night].rooms[bRoomId] = (bookedPerNight[night].rooms[bRoomId] || 0) + bCount;
    }
  }

  // Build 31 days calendar list (today to today + 30 days)
  const calendarDays = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i <= 30; i++) {
    const curDate = addDays(todayIST, i);
    const [y, m, d] = curDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = daysOfWeek[dateObj.getUTCDay()];

    const isPast = curDate < todayIST;
    const isBeyond = curDate > maxDateIST;
    const isHotelBlocked = hotelBlockedSet.has(curDate);
    const isRoomBlocked = selectedRoom ? roomBlockedSet.has(curDate) : false;
    const isBlocked = isHotelBlocked || isRoomBlocked;

    let bookedCount = 0;
    let remainingRooms = 0;

    if (selectedRoom) {
      // Room-specific availability
      const roomKey = String(selectedRoom._id);
      bookedCount = (bookedPerNight[curDate]?.rooms?.[roomKey] || 0) +
        (bookedPerNight[curDate]?.rooms?.general || 0);
      remainingRooms = isBlocked ? 0 : Math.max(0, totalInventory - bookedCount);
    } else if (activeRooms.length > 0) {
      // Overall hotel: Check if ANY room type has available units
      let availableSum = 0;
      for (const r of activeRooms) {
        const rKey = String(r._id);
        const rCap = Math.max(1, Number(r.availableRooms) || 1);
        const rBlocked = hotelBlockedSet.has(curDate) || (r.blockedDates || []).includes(curDate);
        const rBooked = (bookedPerNight[curDate]?.rooms?.[rKey] || 0);
        const rRem = rBlocked ? 0 : Math.max(0, rCap - rBooked);
        availableSum += rRem;
      }
      remainingRooms = isHotelBlocked ? 0 : availableSum;
      bookedCount = bookedPerNight[curDate]?.total || 0;
    } else {
      // Single property
      bookedCount = bookedPerNight[curDate]?.total || 0;
      remainingRooms = isBlocked ? 0 : Math.max(0, totalInventory - bookedCount);
    }

    const available = !isPast && !isBeyond && !isBlocked && remainingRooms > 0;

    calendarDays.push({
      date: curDate,
      day: d,
      month: m,
      year: y,
      dayOfWeek,
      available,
      remainingRooms,
      totalRooms: totalInventory,
      isBlocked,
      isPast,
      isBeyond,
      status: !available ? (isBlocked || remainingRooms === 0 ? "unavailable" : "disabled") : "available",
    });
  }

  return {
    hotelId: String(hotel._id),
    hotelTitle: hotel.title,
    roomId: selectedRoom ? String(selectedRoom._id) : null,
    roomName: selectedRoom ? selectedRoom.name : null,
    today: todayIST,
    maxBookingDate: maxDateIST,
    totalRooms: totalInventory,
    calendar: calendarDays,
  };
}

/**
 * Validate that every requested night of a stay is available.
 * Returns { ok: true, nights: [...] } or { ok: false, error: "..." }
 */
export async function validateStayAvailability({
  hotelId,
  roomId = null,
  checkInDate,
  checkOutDate,
  roomsCount = 1,
  excludeBookingId = null,
}) {
  const checkIn = (checkInDate || "").trim();
  const checkOut = (checkOutDate || "").trim();

  if (!checkIn) {
    return { ok: false, error: "Check-in date is required for hotel reservation." };
  }

  const todayIST = getISTDateString();
  const maxDateIST = addDays(todayIST, 30);

  if (checkIn < todayIST) {
    return { ok: false, error: "Check-in date cannot be in the past." };
  }

  if (checkIn > maxDateIST) {
    return { ok: false, error: "Reservations can only be made up to one month in advance." };
  }

  if (checkOut && checkOut < checkIn) {
    return { ok: false, error: "Check-out date cannot be earlier than check-in date." };
  }

  const nights = getOccupiedNights(checkIn, checkOut);
  if (nights.length === 0) {
    return { ok: false, error: "Invalid reservation dates." };
  }

  for (const night of nights) {
    if (night > maxDateIST) {
      return { ok: false, error: `Stay night (${night}) exceeds the allowed 1-month booking window.` };
    }
  }

  const hotel = await Item.findById(hotelId).lean();
  if (!hotel) {
    return { ok: false, error: "Hotel listing not found." };
  }

  let selectedRoom = null;
  if (roomId) {
    selectedRoom = await Room.findById(roomId).lean();
    if (!selectedRoom) {
      return { ok: false, error: "Selected room type not found." };
    }
  }

  const hotelBlockedSet = new Set(hotel.blockedDates || []);
  const roomBlockedSet = new Set(selectedRoom?.blockedDates || []);

  const totalInventory = selectedRoom
    ? Math.max(1, Number(selectedRoom.availableRooms) || 1)
    : Math.max(1, Number(hotel.roomCount) || 1);

  // Active bookings excluding the one being verified (if updating/paying)
  const now = new Date();
  const bookingFilter = {
    item: hotelId,
    status: { $in: ["paid", "confirmed", "pending"] },
    $or: [
      { status: { $in: ["paid", "confirmed"] } },
      { status: "pending", holdExpiresAt: { $gt: now } },
      { status: "pending", holdExpiresAt: null, createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } },
    ],
  };

  if (excludeBookingId) {
    bookingFilter._id = { $ne: excludeBookingId };
  }

  const activeBookings = await Booking.find(bookingFilter).lean();

  // Check each requested night
  for (const night of nights) {
    if (hotelBlockedSet.has(night)) {
      return {
        ok: false,
        error: `Date ${night} has been manually blocked by the hotel and is not available.`,
      };
    }
    if (selectedRoom && roomBlockedSet.has(night)) {
      return {
        ok: false,
        error: `Date ${night} is not available for ${selectedRoom.name}.`,
      };
    }

    let bookedCount = 0;
    for (const b of activeBookings) {
      const bNights = getOccupiedNights(b.checkInDate, b.checkOutDate, b.eventDate);
      if (bNights.includes(night)) {
        if (!selectedRoom || !b.roomId || String(b.roomId) === String(selectedRoom._id)) {
          bookedCount += Math.max(1, Number(b.roomsCount) || 1);
        }
      }
    }

    const remaining = totalInventory - bookedCount;
    if (remaining < roomsCount) {
      return {
        ok: false,
        error: `Date ${night} is fully booked (${remaining <= 0 ? "0" : remaining} room${remaining === 1 ? "" : "s"} left, requested ${roomsCount}). Please pick different dates.`,
      };
    }
  }

  return {
    ok: true,
    nights,
    nightsCount: nights.length,
    checkIn,
    checkOut: checkOut || checkIn,
  };
}
