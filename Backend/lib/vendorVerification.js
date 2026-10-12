/**
 * Helper utilities for Vendor Onboarding, Profile Completion & KYC Verification.
 */

export function maskAccountNumber(accNumber) {
  if (!accNumber) return "";
  const str = String(accNumber).trim();
  if (str.length <= 4) return str;
  const last4 = str.slice(-4);
  return "•".repeat(Math.max(4, str.length - 4)) + last4;
}

export function calculateVendorCompletion(user) {
  const vp = user?.vendorProfile || {};
  const bank = vp.bankDetails || {};
  const docs = Array.isArray(vp.documents) ? vp.documents : [];

  const missingFields = [];
  const missingCategories = {
    profile: [],
    services: [],
    documents: [],
    bank: [],
  };

  // 1. Basic Profile & Business Information
  if (!vp.businessName?.trim()) {
    missingFields.push("Business / Vendor Name");
    missingCategories.profile.push("Business / Vendor Name");
  }
  if (!vp.ownerName?.trim() && !user?.name?.trim()) {
    missingFields.push("Owner / Contact Person Name");
    missingCategories.profile.push("Owner / Contact Person Name");
  }
  if (!user?.phone?.trim()) {
    missingFields.push("Mobile Number");
    missingCategories.profile.push("Mobile Number");
  }
  if (!user?.email?.trim()) {
    missingFields.push("Email Address");
    missingCategories.profile.push("Email Address");
  }
  if (!vp.address?.trim()) {
    missingFields.push("Business Address");
    missingCategories.profile.push("Business Address");
  }
  if (!vp.city?.trim()) {
    missingFields.push("City");
    missingCategories.profile.push("City");
  }
  if (!vp.state?.trim()) {
    missingFields.push("State");
    missingCategories.profile.push("State");
  }
  if (!vp.pincode?.trim()) {
    missingFields.push("PIN Code");
    missingCategories.profile.push("PIN Code");
  }

  // 2. Service Information
  if (!vp.serviceDescription?.trim() && !vp.about?.trim()) {
    missingFields.push("Service Description");
    missingCategories.services.push("Service Description");
  }
  if ((!vp.startingPrice || vp.startingPrice <= 0) && !vp.priceRange?.trim()) {
    missingFields.push("Starting Price or Price Range");
    missingCategories.services.push("Starting Price or Price Range");
  }
  if (!vp.serviceLocation?.trim() && !vp.city?.trim()) {
    missingFields.push("Service Location");
    missingCategories.services.push("Service Location");
  }
  if (!vp.experience?.trim()) {
    missingFields.push("Experience (Years / Background)");
    missingCategories.services.push("Experience");
  }
  if ((!vp.categories || vp.categories.length === 0) && (!vp.servicesList || vp.servicesList.length === 0)) {
    missingFields.push("Wedding Service Category Selection");
    missingCategories.services.push("Wedding Category Selection");
  }

  // 3. Mandatory KYC Documents
  const hasPanDoc = docs.some(
    (d) => d.docType === "pan" && (d.frontUrl || d.fileUrl)
  ) || Boolean(vp.pan?.trim());
  if (!hasPanDoc) {
    missingFields.push("PAN Card Document");
    missingCategories.documents.push("PAN Card");
  }

  const hasAadhaarDoc = docs.some(
    (d) => d.docType === "aadhaar" && (d.frontUrl || d.fileUrl)
  ) || Boolean(vp.aadhar?.trim());
  if (!hasAadhaarDoc) {
    missingFields.push("Aadhaar Card Document");
    missingCategories.documents.push("Aadhaar Card");
  }

  const hasChequeDoc = docs.some(
    (d) => (d.docType === "cancelled_cheque" || d.docType === "bank_proof") && (d.frontUrl || d.fileUrl)
  ) || Boolean(bank.chequeUrl?.trim());
  if (!hasChequeDoc) {
    missingFields.push("Cancelled Cheque / Bank Proof");
    missingCategories.documents.push("Cancelled Cheque / Bank Proof");
  }

  // Conditional: If business, check GST or Business Registration
  const isBusiness = String(vp.vendorType || "").toLowerCase() === "business";
  if (isBusiness) {
    const hasGst = docs.some((d) => d.docType === "gst" && (d.frontUrl || d.fileUrl));
    const hasBusReg = docs.some((d) => d.docType === "business_reg" && (d.frontUrl || d.fileUrl));
    if (!hasGst && !hasBusReg) {
      // Conditional advisory - we list it as missing for business type
      missingFields.push("GST or Business Registration Certificate (Required for Business)");
      missingCategories.documents.push("GST or Business Registration Certificate");
    }
  }

  // 4. Bank Details
  if (!bank.accountHolderName?.trim()) {
    missingFields.push("Bank Account Holder Name");
    missingCategories.bank.push("Account Holder Name");
  }
  if (!bank.bankName?.trim()) {
    missingFields.push("Bank Name");
    missingCategories.bank.push("Bank Name");
  }
  if (!bank.accountNumber?.trim()) {
    missingFields.push("Bank Account Number");
    missingCategories.bank.push("Account Number");
  }
  if (!bank.ifscCode?.trim()) {
    missingFields.push("Bank IFSC Code");
    missingCategories.bank.push("IFSC Code");
  }

  // Portfolio items count (adds extra completeness score)
  const portfolioCount = Array.isArray(vp.portfolio) ? vp.portfolio.length : 0;

  // Total checklist items
  const totalItems = isBusiness ? 19 : 18;
  const missingCount = missingFields.length;
  const completedCount = Math.max(0, totalItems - missingCount);
  let percentage = Math.round((completedCount / totalItems) * 100);

  // Bonus up to 100% if portfolio added and everything else is complete
  if (missingCount === 0) {
    percentage = 100;
  } else {
    percentage = Math.min(95, percentage);
  }

  const isProfileComplete = missingCategories.profile.length === 0 && missingCategories.services.length === 0;
  const areDocumentsComplete = missingCategories.documents.length === 0;
  const areBankDetailsComplete = missingCategories.bank.length === 0;
  const canSubmitForVerification = isProfileComplete && areDocumentsComplete && areBankDetailsComplete;

  // Document count stats
  const mandatoryTotal = isBusiness ? 4 : 3;
  let mandatoryUploaded = 0;
  if (hasPanDoc) mandatoryUploaded++;
  if (hasAadhaarDoc) mandatoryUploaded++;
  if (hasChequeDoc) mandatoryUploaded++;
  if (isBusiness && docs.some((d) => (d.docType === "gst" || d.docType === "business_reg") && (d.frontUrl || d.fileUrl))) {
    mandatoryUploaded++;
  }

  // Status computation
  let kycStatus = "pending";
  if (docs.length > 0) {
    if (docs.some((d) => d.status === "rejected")) {
      kycStatus = "rejected";
    } else if (docs.every((d) => d.status === "verified")) {
      kycStatus = "verified";
    } else if (docs.some((d) => d.status === "under_review" || d.status === "pending")) {
      kycStatus = "under_review";
    }
  }

  const bankStatus = bank.status || "pending";
  const verificationStatus = vp.verificationStatus || (vp.approved ? "approved" : "profile_incomplete");

  return {
    percentage,
    missingFields,
    missingCategories,
    isProfileComplete,
    areDocumentsComplete,
    areBankDetailsComplete,
    canSubmitForVerification,
    portfolioCount,
    mandatoryUploaded,
    mandatoryTotal,
    kycStatus,
    bankStatus,
    verificationStatus,
    isApproved: Boolean(vp.approved && verificationStatus === "approved"),
    rejectionReason: vp.rejectionReason || "",
  };
}
