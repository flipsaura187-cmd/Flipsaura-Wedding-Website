import mongoose from "mongoose";

const FacilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },
    group: { type: String, default: "Additional Facilities", trim: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },
    icon: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FacilitySchema.index({ slug: 1, group: 1 }, { unique: true });

export default mongoose.models.Facility || mongoose.model("Facility", FacilitySchema);

