import { dbConnect } from "../lib/db.js";
import Booking from "../models/Booking.js";
import Item from "../models/Item.js";
import User from "../models/User.js";
import { sendMail, bookingConfirmationHtml } from "../lib/mailer.js";

export async function getBookings(req, res) {
  await dbConnect();
  const filter =
    req.user.role === "admin"
      ? {}
      : req.user.role === "vendor"
        ? { vendor: req.user.id }
        : { user: req.user.id };

  const bookings = await Booking.find(filter)
    .populate("item")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ ok: true, data: { bookings } });
}

export async function createBooking(req, res) {
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ ok: false, error: "itemId required" });

  await dbConnect();
  const item = await Item.findById(itemId);
  if (!item) return res.status(404).json({ ok: false, error: "Item not found" });

  const booking = await Booking.create({
    user: req.user.id,
    item: item._id,
    vendor: item.vendor,
    name: req.body.name || req.user.name,
    email: req.body.email || req.user.email,
    phone: req.body.phone || req.user.phone,
    eventDate: req.body.eventDate,
    address: req.body.address,
    notes: req.body.notes,
    amount: item.price,
    status: "pending",
  });

  try {
    await sendMail({
      to: booking.email,
      subject: `FlipsAura — Booking received (#${booking._id})`,
      html: bookingConfirmationHtml({
        name: booking.name,
        itemTitle: item.title,
        bookingId: booking._id,
        eventDate: booking.eventDate,
        amount: booking.amount,
        status: "pending",
      }),
    });
  } catch (error) {
    console.error("mail error", error);
  }

  res.json({ ok: true, data: { booking } });
}

export async function getBooking(req, res) {
  await dbConnect();
  const booking = await Booking.findById(req.params.id).populate("item").lean();
  if (!booking) return res.status(404).json({ ok: false, error: "Not found" });

  if (
    req.user.role !== "admin" &&
    String(booking.user) !== req.user.id &&
    String(booking.vendor) !== req.user.id
  ) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  res.json({ ok: true, data: { booking } });
}

export async function updateBooking(req, res) {
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

  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ ok: false, error: "Not found" });

  if (req.user.role !== "admin" && String(booking.vendor) !== req.user.id) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  if (req.body.status) booking.status = req.body.status;
  await booking.save();

  res.json({ ok: true, data: { booking } });
}
