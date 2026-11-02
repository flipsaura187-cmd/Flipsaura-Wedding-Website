import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },
    categorySlug: { type: String, trim: true, index: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SubcategorySchema.index({ slug: 1, category: 1 }, { unique: true });

export default mongoose.models.Subcategory || mongoose.model("Subcategory", SubcategorySchema);

