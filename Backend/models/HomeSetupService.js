import mongoose from "mongoose";

const SpecSchema = new mongoose.Schema({ key: String, value: String }, { _id: false });

const HomeSetupServiceSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: "HomeSetupProfile", index: true },

  // Classification
  mainCategory: { type: String, required: true },        // e.g. "Tent & Pandal"
  subcategory: { type: String, required: true },          // e.g. "Luxury Wedding Tent"
  isCustomCategory: { type: Boolean, default: false },

  // Basic Info
  name: { type: String, required: true },                 // package name
  shortDescription: String,
  description: String,

  // Pricing
  pricingModel: { type: String, enum: ["per_unit","per_hour","per_day","per_event","custom_quotation"], default: "per_event" },
  startingPrice: { type: Number, default: 0 },
  additionalCharges: String,
  minimumBookingQty: Number,

  // Specifications (category-specific key-value pairs)
  specifications: [SpecSchema],

  // Images
  images: [String],               // Cloudinary URLs
  coverImageIndex: { type: Number, default: 0 },

  // Availability
  isAvailable: { type: Boolean, default: true },
  customizationAvailable: { type: Boolean, default: false },
  setupCharge: Number,
  dismantlingCharge: Number,
  transportationCharge: Number,
  additionalNotes: String,

  // Publication
  status: { type: String, enum: ["draft","published"], default: "draft", index: true },

  // Location (from vendor's profile locations)
  serviceLocations: [String],     // cities where this service is available

  active: { type: Boolean, default: true },
}, { timestamps: true });

HomeSetupServiceSchema.index({ vendor: 1, mainCategory: 1, subcategory: 1 });
HomeSetupServiceSchema.index({ mainCategory: 1, status: 1, isAvailable: 1 });
HomeSetupServiceSchema.index({ "serviceLocations": 1, status: 1 });

export default mongoose.models.HomeSetupService || mongoose.model("HomeSetupService", HomeSetupServiceSchema);
