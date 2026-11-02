import mongoose from "mongoose";

const BookingEnquirySchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true, index: true },
    customerEmail: { type: String, trim: true, default: "" },
    eventDate: { type: String, default: "", index: true },
    guestCount: { type: Number, default: 0 },
    selectedPackage: { type: String, default: "" },
    selectedServices: [{ type: String, trim: true }],
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "contacted", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.BookingEnquiry || mongoose.model("BookingEnquiry", BookingEnquirySchema);

