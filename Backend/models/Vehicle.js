import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ["car", "four_wheeler", "auto", "bus"],
      required: true,
      index: true,
    },
    supportedServices: {
      type: [String],
      enum: ["rental", "transport"],
      default: ["rental", "transport"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Vehicle must support at least one service type (rental or transport).",
      },
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },
    seatingCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "cng", "electric", "hybrid", "other"],
      default: "diesel",
    },
    transmission: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual",
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    features: {
      type: [String],
      default: [],
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pickupLocation: {
      type: String,
      default: "",
    },
    serviceArea: {
      type: String,
      default: "",
    },

    // Rental Pricing Configuration (Service A: Rent for a period)
    rentalPricing: {
      pricePerHour: { type: Number, default: 0, min: 0 },
      pricePerDay: { type: Number, default: 0, min: 0 },
      minDurationHours: { type: Number, default: 1, min: 1 },
      maxDurationDays: { type: Number, default: 30, min: 1 },
      securityDeposit: { type: Number, default: 0, min: 0 },
      includedKmPerDay: { type: Number, default: 200, min: 0 },
      extraKmRate: { type: Number, default: 15, min: 0 },
      rentalTerms: { type: String, default: "" },
    },

    // Transport Pricing Configuration (Service B: Book for transport)
    transportPricing: {
      pricingType: {
        type: String,
        enum: ["fixed", "per_km", "quote"],
        default: "fixed",
      },
      baseTripPrice: { type: Number, default: 0, min: 0 },
      perKmRate: { type: Number, default: 0, min: 0 },
      driverAllowance: { type: Number, default: 0, min: 0 },
      transportNotes: { type: String, default: "" },
    },

    availabilityStatus: {
      type: String,
      enum: ["available", "booked", "maintenance", "disabled"],
      default: "available",
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "verified",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

VehicleSchema.index({ name: "text", brand: "text", model: "text", city: "text", description: "text" });

/**
 * Returns a sanitized vehicle object for public listing (masks registration number)
 */
VehicleSchema.methods.toPublicJSON = function () {
  const obj = this.toObject ? this.toObject() : { ...this };
  if (obj.registrationNumber) {
    const reg = String(obj.registrationNumber).trim();
    if (reg.length > 4) {
      obj.registrationNumber = `${reg.slice(0, 2)} ** **** ${reg.slice(-4)}`;
    } else {
      obj.registrationNumber = "** ****";
    }
  }
  return obj;
};

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);
export default Vehicle;
