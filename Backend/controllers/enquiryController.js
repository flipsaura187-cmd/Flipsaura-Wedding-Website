import { dbConnect } from "../lib/db.js";
import BookingEnquiry from "../models/BookingEnquiry.js";
import Item from "../models/Item.js";

/**
 * Public: Customer submits a booking enquiry for a venue or service
 */
export async function createBookingEnquiry(req, res) {
  try {
    await dbConnect();
    const {
      item: itemId,
      customerName,
      customerPhone,
      customerEmail = "",
      eventDate = "",
      guestCount = 0,
      selectedPackage = "",
      selectedServices = [],
      notes = "",
    } = req.body;

    if (!itemId) {
      return res.status(400).json({ ok: false, error: "Venue / Item ID is required" });
    }
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ ok: false, error: "Your name is required" });
    }
    if (!customerPhone || !customerPhone.trim()) {
      return res.status(400).json({ ok: false, error: "Valid phone number is required" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Selected venue/service not found" });
    }

    // Check if event date is available
    if (eventDate && item.unavailableDates && item.unavailableDates.includes(eventDate)) {
      return res.status(400).json({
        ok: false,
        error: `Sorry, this venue is marked unavailable on ${eventDate}. Please choose another date or contact support.`,
      });
    }

    const enquiry = await BookingEnquiry.create({
      item: item._id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      eventDate: eventDate.trim(),
      guestCount: Math.max(0, Number(guestCount) || 0),
      selectedPackage: selectedPackage.trim(),
      selectedServices: Array.isArray(selectedServices) ? selectedServices : [],
      notes: notes.trim(),
      status: "pending",
    });

    return res.status(201).json({
      ok: true,
      message: "Your booking enquiry has been submitted successfully! The team will contact you shortly.",
      data: enquiry,
    });
  } catch (error) {
    console.error("createBookingEnquiry error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to submit enquiry" });
  }
}

/**
 * Admin: Get list of all booking enquiries with filter by status or item
 */
export async function getAdminEnquiries(req, res) {
  try {
    await dbConnect();
    const { status, itemId, search } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (itemId) {
      filter.item = itemId;
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { customerName: sRegex },
        { customerPhone: sRegex },
        { customerEmail: sRegex },
        { notes: sRegex },
      ];
    }

    const enquiries = await BookingEnquiry.find(filter)
      .populate("item", "title city images contactPhone rentalPrice price")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      data: {
        enquiries,
        total: enquiries.length,
      },
    });
  } catch (error) {
    console.error("getAdminEnquiries error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to fetch enquiries" });
  }
}

/**
 * Admin: Update enquiry status or notes (e.g. mark confirmed, contacted, cancelled)
 */
export async function updateAdminEnquiryStatus(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const enquiry = await BookingEnquiry.findById(id).populate("item");
    if (!enquiry) {
      return res.status(404).json({ ok: false, error: "Enquiry not found" });
    }

    if (status) {
      enquiry.status = status;
    }
    if (adminNotes !== undefined) {
      enquiry.adminNotes = adminNotes.trim();
    }

    await enquiry.save();

    // If confirmed and there is an eventDate, add to item's unavailableDates if not already present
    if (status === "confirmed" && enquiry.eventDate && enquiry.item) {
      const item = await Item.findById(enquiry.item._id);
      if (item) {
        if (!item.unavailableDates) item.unavailableDates = [];
        if (!item.unavailableDates.includes(enquiry.eventDate)) {
          item.unavailableDates.push(enquiry.eventDate);
          await item.save();
        }
      }
    }

    return res.json({
      ok: true,
      message: "Enquiry status updated successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error("updateAdminEnquiryStatus error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Failed to update enquiry" });
  }
}

