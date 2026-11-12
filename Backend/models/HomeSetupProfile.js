import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  state: { type: String, required: true },
  city: { type: String, required: true },
  localities: [String],           // optional
  serviceRadius: String,          // optional e.g. "20 km"
}, { _id: true });

const CustomCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  subcategories: [String],
}, { _id: true });

const HomeSetupProfileSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  locations: [LocationSchema],
  selectedCategories: [String],      // e.g. ["Tent & Pandal", "DJ & Sound System"]
  customCategories: [CustomCategorySchema],
  onboardingCompleted: { type: Boolean, default: false },
  onboardingCompletedAt: Date,
}, { timestamps: true });

export default mongoose.models.HomeSetupProfile || mongoose.model("HomeSetupProfile", HomeSetupProfileSchema);
