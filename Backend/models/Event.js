import mongoose from "mongoose";

const PrizeSchema = new mongoose.Schema(
  {
    position: { type: String, required: true }, // e.g. "1st Prize", "2nd Prize", "2nd Runner-Up"
    amount: { type: String, required: true },   // e.g. "₹25,000"
    description: { type: String, default: "" },
  },
  { _id: false }
);

const FaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const RoundSchema = new mongoose.Schema(
  {
    roundNumber: { type: String, default: "" }, // e.g. "Round 1"
    title: { type: String, required: true },     // e.g. "Preliminary Written Quiz"
    description: { type: String, default: "" },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    type: { type: String, default: "Quiz Competition", trim: true }, // Quiz, Exhibition, Workshop, etc.
    shortDescription: { type: String, default: "", trim: true },
    description: { type: String, default: "" }, // Comprehensive description
    bannerImage: { type: String, default: "" },
    organizer: { type: String, default: "Flipsaura × Marritcredence", trim: true },
    date: { type: String, default: "" }, // Display/Date string e.g. "2026-11-15" or "November 15, 2026"
    startTime: { type: String, default: "" }, // e.g. "10:00 AM"
    endTime: { type: String, default: "" },   // e.g. "05:00 PM"
    venue: { type: String, default: "Patna, Bihar", trim: true },
    city: { type: String, default: "Patna", trim: true },
    state: { type: String, default: "Bihar", trim: true },
    registrationFee: { type: Number, required: true, default: 1000, min: 0 },
    currency: { type: String, default: "INR" },

    // Participation configurations e.g. ["Individual", "Team of 3"]
    participationTypes: [{ type: String, default: "Individual" }],

    // Rich content
    prizes: [PrizeSchema],
    benefits: [{ type: String }],
    eventFormat: [RoundSchema],
    rules: [{ type: String }],
    faqs: [FaqSchema],
    contactInformation: {
      email: { type: String, default: "events@flipsaura.com" },
      phone: { type: String, default: "+91 98765 43210" },
      supportPerson: { type: String, default: "Event Coordinator" },
    },

    // Registration window
    registrationOpen: { type: Date, default: Date.now },
    registrationClose: { type: Date, default: null },
    registrationEnabled: { type: Boolean, default: true },

    // Lifecycle status
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CLOSED", "COMPLETED"],
      default: "PUBLISHED",
      index: true,
    },
    featured: { type: Boolean, default: true, index: true },

    // Terms and conditions
    terms: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
