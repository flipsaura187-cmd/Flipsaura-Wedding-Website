import { dbConnect } from "../lib/db.js";
import Booking from "../models/Booking.js";
import Item from "../models/Item.js";
import { getRazorpay, verifyRazorpaySignature } from "../lib/razorpay.js";
import { sendMail, bookingConfirmationHtml } from "../lib/mailer.js";

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

  booking.status = "paid";
  booking.payment = {
    provider: "razorpay",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    paidAt: new Date(),
  };
  await booking.save();

  // Send email asynchronously in the background so verification responds instantly
  Item.findById(booking.item).lean().then((item) => {
    sendMail({
      to: booking.email,
      subject: `FlipsAura — Payment received (#${booking._id})`,
      html: bookingConfirmationHtml({
        name: booking.name,
        itemTitle: item?.title || "Booking",
        bookingId: booking._id,
        eventDate: booking.eventDate,
        amount: booking.amount,
        status: "paid",
      }),
    }).catch((error) => console.error("payment mail error:", error.message));
  }).catch((err) => console.error("item lookup error:", err.message));

  res.json({ ok: true, data: { booking } });
}
