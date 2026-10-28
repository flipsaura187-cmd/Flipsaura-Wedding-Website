import { dbConnect } from "../lib/db.js";
import Booking from "../models/Booking.js";
import Item from "../models/Item.js";
import { getRazorpay, verifyRazorpaySignature } from "../lib/razorpay.js";
import { sendMail, bookingConfirmationHtml, adminBookingAlertHtml, vendorBookingAlertHtml } from "../lib/mailer.js";
import {
  sendBookingWhatsAppNotifications,
  sendPaymentWhatsAppNotifications,
} from "../lib/whatsapp.js";

export async function createOrder(req, res) {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ ok: false, error: "bookingId required" });

  await dbConnect();
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ ok: false, error: "Booking not found" });
  if (String(booking.user) !== req.user.id) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const order = await getRazorpay().orders.create({
    amount: Math.round(booking.amount * 100),
    currency: booking.currency || "INR",
    receipt: `bk_${booking._id}`,
    notes: { bookingId: String(booking._id) },
  });

  booking.payment = {
    ...(booking.payment || {}),
    provider: "razorpay",
    orderId: order.id,
  };
  await booking.save();

  res.json({
    ok: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
}

export async function verifyPayment(req, res) {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ ok: false, error: "Missing payment fields" });
  }

  if (!verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  })) {
    return res.status(400).json({ ok: false, error: "Invalid signature" });
  }

  await dbConnect();
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ ok: false, error: "Booking not found" });
  if (String(booking.user) !== req.user.id) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  // Idempotency: if booking is already paid, do not re-send duplicate emails or notifications
  if (booking.status === "paid") {
    console.log(`[Payment] Booking ${booking._id} already verified as paid. Skipping duplicate processing.`);
    return res.json({ ok: true, data: { booking } });
  }

  booking.status = "paid";
  booking.payment = {
    provider: "razorpay",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    paidAt: new Date(),
  };
  await booking.save();

  // Send WhatsApp payment confirmation asynchronously to Customer & Admin
  sendPaymentWhatsAppNotifications(booking._id).catch((error) =>
    console.error("[WhatsApp] Payment WhatsApp notification error:", error.message)
  );

  // Send ONE authoritative confirmation email to the Customer & alert to Admin
  Item.findById(booking.item)
    .populate("vendor")
    .lean()
    .then((item) => {
      const vendor = item?.vendor;

      // 1. Customer Confirmation Email
      sendMail({
        to: booking.email,
        subject: `FlipsAura — Booking & Payment Confirmed (#${booking._id})`,
        html: bookingConfirmationHtml({
          name: booking.name,
          itemTitle: item?.title || "Booking",
          bookingId: booking._id,
          eventDate: booking.eventDate,
          amount: booking.amount,
          status: "paid",
          paymentId: razorpay_payment_id,
          notes: booking.notes,
          phone: booking.phone,
          vendorName:
            vendor?.vendorProfile?.businessName ||
            vendor?.businessName ||
            vendor?.name ||
            "",
          vendorPhone: vendor?.phone || item?.contactPhone || "",
        }),
      }).catch((error) => console.error("Customer payment mail error:", error.message));

      // 2. Admin Immediate Alert Email
      const adminEmail = (process.env.ADMIN_EMAIL || "flipsaura187@gmail.com").trim().toLowerCase();
      sendMail({
        to: adminEmail,
        subject: `🚨 NEW PAID BOOKING (#${booking._id}): ${booking.name} booked ${item?.title || "Service"} (₹${booking.amount})`,
        html: adminBookingAlertHtml({
          booking,
          item,
          vendor,
        }),
      }).catch((error) => console.error("Admin booking alert mail error:", error.message));

      // 3. Vendor Email Alert (if vendor has a valid non-internal email)
      const vendorEmail = vendor?.email;
      if (vendorEmail && !vendorEmail.endsWith(".local")) {
        sendMail({
          to: vendorEmail,
          subject: `FlipsAura — New Confirmed Booking (#${booking._id}) for ${item?.title || "your listing"}`,
          html: vendorBookingAlertHtml({
            booking,
            item,
            vendor,
          }),
        }).catch((error) => console.error("Vendor booking alert mail error:", error.message));
      }
    })
    .catch((err) => console.error("item lookup error:", err.message));

  res.json({ ok: true, data: { booking } });
}
