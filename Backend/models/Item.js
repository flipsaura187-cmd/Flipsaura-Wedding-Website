import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    about: String,
    description: String,
    specifications: [{ key: String, value: String }],
    facilities: [
      {
        group: { type: String, default: "Popular Amenities" },
        name: { type: String, required: true },
        icon: { type: String, default: "" },
        highlight: { type: Boolean, default: false },
      },
    ],
    images: [String], // CloudFront URLs
    price: { type: Number, required: true, min: 0, index: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true, index: true },
    contactPhone: String,
    contactEmail: String,
    capacity: Number,
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ItemSchema.index({ title: "text", about: "text", description: "text", city: "text", state: "text" });

export default mongoose.models.Item || mongoose.model("Item", ItemSchema);
