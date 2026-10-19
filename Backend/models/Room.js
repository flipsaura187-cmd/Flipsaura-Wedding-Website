import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: false,
      index: true,
    },
    vendor: {
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
    roomType: {
      type: String,
      trim: true,
      default: "Deluxe Room",
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    availableRooms: {
      type: Number,
      default: 1,
      min: 0,
    },
    maxGuests: {
      type: Number,
      default: 2,
      min: 1,
    },
    bedType: {
      type: String,
      default: "Double Bed",
      trim: true,
    },
    numberOfBeds: {
      type: Number,
      default: 1,
      min: 1,
    },
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      default: "",
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

RoomSchema.index({ hotel: 1, active: 1 });
RoomSchema.index({ vendor: 1, createdAt: -1 });

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
