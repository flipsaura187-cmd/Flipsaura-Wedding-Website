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
    price: { type: Number, default: 0, min: 0, index: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true, index: true },
    address: { type: String, trim: true },
    pincode: { type: String, trim: true },
    contactPhone: String,
    contactEmail: String,
    capacity: Number,
    // Photography-specific fields
    photographyPackages: {
      basic: {
        price: { type: Number, default: 0, min: 0 },
        title: { type: String, default: "Basic Package" },
        description: { type: String, default: "" },
        deliverables: [{ type: String, trim: true }],
      },
      standard: {
        price: { type: Number, default: 0, min: 0 },
        title: { type: String, default: "Standard Package" },
        description: { type: String, default: "" },
        deliverables: [{ type: String, trim: true }],
      },
      premium: {
        price: { type: Number, default: 0, min: 0 },
        title: { type: String, default: "Premium Package" },
        description: { type: String, default: "" },
        deliverables: [{ type: String, trim: true }],
      },
      luxury: {
        price: { type: Number, default: 0, min: 0 },
        title: { type: String, default: "Luxury Package" },
        description: { type: String, default: "" },
        deliverables: [{ type: String, trim: true }],
      },
    },
    albums: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        coverImage: { type: String, trim: true },
        images: [{ type: String, trim: true }],
        link: { type: String, trim: true },
      },
    ],
    videos: [
      {
        title: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],
    // Venue-specific fields
    venueType: { type: String, trim: true, index: true },
    locality: { type: String, trim: true, index: true },
    guestCapacity: { type: Number, default: 0, min: 0, index: true },
    seatingCapacity: { type: Number, default: 0, min: 0 },
    floatingCapacity: { type: Number, default: 0, min: 0 },
    roomCount: { type: Number, default: 0, min: 0, index: true },
    pricePerPlateVeg: { type: Number, default: 0, min: 0, index: true },
    pricePerPlateNonVeg: { type: Number, default: 0, min: 0, index: true },
    rentalPrice: { type: Number, default: 0, min: 0, index: true },
    spaceTypes: [{ type: String, trim: true }],
    venueFeatures: [{ type: String, trim: true }],
    mainCategories: [{ type: String, trim: true, index: true }],
    subcategories: [{ type: String, trim: true, index: true }],
    customSubcategoriesMap: { type: mongoose.Schema.Types.Mixed, default: {} },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    source: { type: String, default: "vendor" },
    sourceUrl: String,
  },
  { timestamps: true }
);

ItemSchema.index({ title: "text", about: "text", description: "text", city: "text", state: "text" });

export default mongoose.models.Item || mongoose.model("Item", ItemSchema);
