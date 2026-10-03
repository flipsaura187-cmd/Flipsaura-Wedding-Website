import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema(
  {
    isLeader: { type: Boolean, default: false },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    yearOrSemester: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const RegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    eventSlug: { type: String, required: true, index: true },
    eventTitle: { type: String, required: true },

    participationType: {
      type: String,
      required: true,
      enum: ["Individual", "Team of 3"],
      default: "Individual",
    },
    teamName: { type: String, default: "", trim: true },

    participants: [ParticipantSchema],

    // Primary contact / Leader details
    primaryName: { type: String, required: true, trim: true },
    primaryEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    primaryPhone: { type: String, required: true, trim: true, index: true },
    primaryCollege: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },

    // Additional questions
    source: { type: String, default: "Other" },
    previousQuizParticipation: { type: String, default: "No" },
    termsAccepted: { type: Boolean, required: true, default: false },

    // Financials
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },

    // Statuses
    paymentStatus: {
      type: String,
      enum: ["CREATED", "PENDING", "PAID", "FAILED"],
      default: "CREATED",
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: ["PENDING_PAYMENT", "CONFIRMED", "PAYMENT_FAILED", "CANCELLED"],
      default: "PENDING_PAYMENT",
      index: true,
    },

    // Payment Gateway Info
    payment: {
      provider: { type: String, default: "razorpay" },
      orderId: { type: String, default: "", index: true },
      paymentId: { type: String, default: "", index: true },
      signature: { type: String, default: "" },
      paidAt: { type: Date, default: null },
      failureReason: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Registration || mongoose.model("Registration", RegistrationSchema);
