import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: String,
    email: String,
    phone: String,
    eventDate: String,
    address: String,
    notes: String,
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "paid", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    payment: {
      provider: { type: String, default: "razorpay" },
      orderId: String,
      paymentId: String,
      signature: String,
      paidAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
