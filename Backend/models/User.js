import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "vendor", "admin"], default: "user", index: true },
    vendorProfile: {
      businessName: String,
      about: String,
      aadhar: String,
      pan: String,
      approved: { type: Boolean, default: false },
    },
    // add inside schema:
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = function (pwd) {
  return bcrypt.compare(pwd, this.passwordHash);
};
UserSchema.statics.hashPassword = function (pwd) {
  return bcrypt.hash(pwd, 10);
};
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
