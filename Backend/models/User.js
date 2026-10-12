import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "customer", "vendor", "admin", "USER", "CUSTOMER", "VENDOR", "ADMIN"],
      default: "user",
      index: true,
    },
    vendorProfile: {
      businessName: { type: String, trim: true, default: "" },
      ownerName: { type: String, trim: true, default: "" },
      vendorType: {
        type: String,
        enum: ["Individual", "Business", "individual", "business"],
        default: "Individual",
      },
      address: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
      profilePhoto: { type: String, default: "" },
      coverPhoto: { type: String, default: "" },
      about: { type: String, default: "" },

      // Service Details
      serviceDescription: { type: String, default: "" },
      startingPrice: { type: Number, default: 0 },
      priceRange: { type: String, default: "" },
      serviceLocation: { type: String, default: "" },
      experience: { type: String, default: "" },
      additionalServices: [{ type: String }],
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      servicesList: [
        {
          category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
          categoryName: { type: String, default: "" },
          serviceName: { type: String, default: "" },
          description: { type: String, default: "" },
          startingPrice: { type: Number, default: 0 },
          priceRange: { type: String, default: "" },
          location: { type: String, default: "" },
          experience: { type: String, default: "" },
          additionalServices: [{ type: String }],
        },
      ],

      // KYC / Verification Documents
      documents: [
        {
          docType: {
            type: String,
            enum: [
              "pan",
              "aadhaar",
              "bank_proof",
              "cancelled_cheque",
              "gst",
              "business_reg",
              "other",
            ],
            required: true,
          },
          name: { type: String, required: true },
          frontUrl: { type: String, default: "" },
          backUrl: { type: String, default: "" },
          fileUrl: { type: String, default: "" },
          fileType: { type: String, default: "image" },
          status: {
            type: String,
            enum: ["pending", "under_review", "verified", "rejected"],
            default: "pending",
          },
          rejectionReason: { type: String, default: "" },
          uploadedAt: { type: Date, default: Date.now },
          verifiedAt: { type: Date, default: null },
        },
      ],

      // Bank Details
      bankDetails: {
        accountHolderName: { type: String, default: "" },
        bankName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        ifscCode: { type: String, default: "" },
        chequeUrl: { type: String, default: "" },
        status: {
          type: String,
          enum: ["pending", "under_review", "verified", "rejected"],
          default: "pending",
        },
        rejectionReason: { type: String, default: "" },
        verifiedAt: { type: Date, default: null },
      },

      // Portfolio
      portfolio: [
        {
          title: { type: String, required: true },
          category: { type: String, default: "" },
          serviceCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
          },
          description: { type: String, default: "" },
          images: [{ type: String }],
          videos: [{ type: String }],
          createdAt: { type: Date, default: Date.now },
        },
      ],

      // Verification & Approval
      verificationStatus: {
        type: String,
        enum: [
          "registered",
          "profile_incomplete",
          "pending_verification",
          "under_review",
          "approved",
          "rejected",
          "suspended",
          "blocked",
        ],
        default: "profile_incomplete",
        index: true,
      },
      approved: { type: Boolean, default: false, index: true },
      rejectionReason: { type: String, default: "" },
      submittedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },

      // Legacy compatibility
      aadhar: { type: String, default: "" },
      pan: { type: String, default: "" },
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    resetPasswordLastSent: { type: Date, default: null },
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
