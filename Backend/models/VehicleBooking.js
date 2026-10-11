import mongoose from "mongoose";

const VehicleBookingSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      enum: ["RENTAL", "TRANSPORT"],
      required: true,
      index: true,
    },

    // ============================================
    // Service A: Rent for a period (Self-Drive / Timed)
    // ============================================
    rentalDetails: {
      startDate: { type: Date },
      endDate: { type: Date },
      durationHours: { type: Number, default: 0 },
      durationDays: { type: Number, default: 0 },
      pickupLocation: { type: String, default: "" },
      returnLocation: { type: String, default: "" },
      selfDrive: { type: Boolean, default: true },
    },

    // ============================================
    // Service B: Book for transport (Trip / Event / Wedding)
    // ============================================
    transportDetails: {
      tripType: {
        type: String,
        enum: ["one_way", "round_trip"],
        default: "one_way",
      },
      travelDate: { type: Date },
      pickupTime: { type: String, default: "" },
      returnDate: { type: Date },
      returnTime: { type: String, default: "" },
      pickupAddress: { type: String, default: "" },
      destinationAddress: { type: String, default: "" },
      passengers: { type: Number, default: 1 },
      specialNotes: { type: String, default: "" },
    },

    // Contact info
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },

    // Pricing & Fees breakdown (calculated server-side)
    priceBreakdown: {
      basePrice: { type: Number, required: true, default: 0 },
      securityDeposit: { type: Number, default: 0 },
      driverAllowance: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      extraCharges: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
      quotedAmount: { type: Number, default: null },
      quoteNotes: { type: String, default: "" },
    },

    // Lifecycle status
    status: {
      type: String,
      enum: [
        "PENDING",
        "QUOTED",
        "CONFIRMED",
        "REJECTED",
        "CANCELLED",
        "IN_PROGRESS",
        "COMPLETED",
      ],
      default: "PENDING",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
    payment: {
      provider: { type: String, default: "razorpay" },
      orderId: String,
      paymentId: String,
      signature: String,
      paidAt: Date,
    },

    cancellationReason: { type: String, default: "" },
    cancelledBy: {
      type: String,
      enum: ["customer", "owner", "admin"],
      default: null,
    },
    cancelledAt: { type: Date, default: null },

    ownerResponseNotes: { type: String, default: "" },
    confirmedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

VehicleBookingSchema.index({ vehicle: 1, "rentalDetails.startDate": 1, "rentalDetails.endDate": 1, status: 1 });
VehicleBookingSchema.index({ customer: 1, createdAt: -1 });
VehicleBookingSchema.index({ owner: 1, createdAt: -1 });

const VehicleBooking =
  mongoose.models.VehicleBooking || mongoose.model("VehicleBooking", VehicleBookingSchema);
export default VehicleBooking;
