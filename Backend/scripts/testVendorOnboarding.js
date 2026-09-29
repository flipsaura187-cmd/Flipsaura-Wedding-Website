import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dbConnect } from "../lib/db.js";
import authRoutes from "../routes/authRoutes.js";
import vendorRoutes from "../routes/vendorRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import itemRoutes from "../routes/itemRoutes.js";
import categoryRoutes from "../routes/categoryRoutes.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Item from "../models/Item.js";

async function runVendorTests() {
  console.log("=================================================");
  console.log("🚀 STARTING VENDOR ONBOARDING & APPROVAL TEST SUITE");
  console.log("=================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected successfully.\n");

  // Setup test Express server
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());
  app.use("/api/auth", authRoutes);
  app.use("/api/vendor", vendorRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/items", itemRoutes);
  app.use("/api/categories", categoryRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5088, resolve));
  const baseUrl = "http://localhost:5088";

  const testVendorEmail = `vendor_test_${Date.now()}@example.com`;
  const adminEmail = (process.env.ADMIN_EMAIL || "flipsaura187@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@Flipsaura2026!";

  try {
    // -------------------------------------------------------------
    // STEP 1: VENDOR REGISTRATION & AUTHENTICATION
    // -------------------------------------------------------------
    console.log("--- STEP 1: VENDOR REGISTRATION ---");
    const regPayload = {
      name: "Rohit Verma",
      ownerName: "Rohit Verma",
      businessName: "Royal Jaipur Photography Studio",
      email: testVendorEmail,
      phone: "9876543210",
      password: "VendorPassword123!",
      role: "vendor",
      vendorType: "Individual",
      address: "123 MI Road, Near Raj Mandir",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      coverPhoto: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
    };

    console.log(`1. Registering vendor: ${testVendorEmail}...`);
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regPayload),
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.ok || !regData.data?.token) {
      throw new Error(`Vendor registration failed: ${JSON.stringify(regData)}`);
    }

    const vendorToken = regData.data.token;
    const vendorId = regData.data.user.id;
    console.log(`✅ Vendor registered and authenticated! ID: ${vendorId}, Status: ${regData.data.user.verificationStatus}`);

    if (regData.data.user.isApproved !== false) {
      throw new Error("SECURITY FAILURE: Vendor was prematurely approved upon registration!");
    }
    console.log("✅ Verified: Vendor is initially unapproved (isApproved: false).");

    // -------------------------------------------------------------
    // STEP 2: DASHBOARD LOCKED STATE & PROTECTED APIS
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: VERIFY LOCKED FEATURES & API PROTECTION ---");

    // Try to create an item as an unapproved vendor (MUST BE REJECTED 403)
    const testCat = await Category.findOne();
    if (!testCat) throw new Error("No categories found in database!");

    console.log("1. Testing item creation by unapproved vendor (should fail with 403)...");
    const forbiddenItemRes = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        title: "Unauthorized Wedding Package",
        category: testCat._id,
        price: 50000,
      }),
    });

    if (forbiddenItemRes.status === 403) {
      const errJson = await forbiddenItemRes.json();
      console.log(`✅ Item creation correctly rejected with 403: "${errJson.error}"`);
    } else {
      throw new Error(`Expected 403 Forbidden but got ${forbiddenItemRes.status}`);
    }

    // Check vendor profile status & completion metrics
    console.log("2. Checking vendor profile completion metrics...");
    const profileRes = await fetch(`${baseUrl}/api/vendor/profile`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok || !profileData.ok) {
      throw new Error(`Get vendor profile failed: ${JSON.stringify(profileData)}`);
    }

    console.log(`✅ Completion: ${profileData.data.completion.percentage}%`);
    console.log(`   Missing fields: ${profileData.data.completion.missingFields.length}`);
    console.log(`   Sample missing: ${profileData.data.completion.missingFields.slice(0, 3).join(", ")}`);

    // Premature submission attempt (MUST BE REJECTED 400 WITH MISSING FIELDS)
    console.log("3. Testing premature submission for verification (should fail with 400)...");
    const prematureSubRes = await fetch(`${baseUrl}/api/vendor/submit-verification`, {
      method: "POST",
      headers: { Authorization: `Bearer ${vendorToken}` },
    });

    if (prematureSubRes.status === 400) {
      const prematureData = await prematureSubRes.json();
      if (!prematureData.missing || prematureData.missing.length === 0) {
        throw new Error("Missing fields list was not returned in 400 response!");
      }
      console.log(`✅ Premature submission rejected with 400: "${prematureData.error}"`);
      console.log(`   List of missing items correctly returned: ${prematureData.missing.length} items.`);
    } else {
      throw new Error(`Expected 400 Bad Request but got ${prematureSubRes.status}`);
    }

    // -------------------------------------------------------------
    // STEP 3: VENDOR PROFILE COMPLETION & SERVICE INFO
    // -------------------------------------------------------------
    console.log("\n--- STEP 3: COMPLETING VENDOR PROFILE & SERVICES ---");

    const categoriesList = await Category.find().limit(3);
    const selectedCategoryIds = categoriesList.map((c) => c._id);

    console.log(`1. Updating service information with ${selectedCategoryIds.length} categories...`);
    const updateRes = await fetch(`${baseUrl}/api/vendor/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        serviceDescription: "Leading royal wedding photography and cinematography studio based in Jaipur with over 7 years of luxury wedding experience.",
        startingPrice: 45000,
        priceRange: "₹45,000 - ₹2,50,000",
        serviceLocation: "Jaipur, Udaipur, Jodhpur, Delhi NCR",
        experience: "7+ Years (250+ Weddings)",
        additionalServicesStr: "Drone Shoots, Cinematic Teaser, Pre-Wedding Shoots, Album Designing",
        categories: selectedCategoryIds,
      }),
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok || !updateData.ok) {
      throw new Error(`Profile update failed: ${JSON.stringify(updateData)}`);
    }
    console.log(`✅ Profile updated! New completion score: ${updateData.data.completion.percentage}%`);

    // -------------------------------------------------------------
    // STEP 4: KYC & MANDATORY DOCUMENT UPLOADS
    // -------------------------------------------------------------
    console.log("\n--- STEP 4: UPLOADING MANDATORY KYC DOCUMENTS ---");

    // 4a. Upload PAN Card
    console.log("1. Uploading PAN Card...");
    const panRes = await fetch(`${baseUrl}/api/vendor/document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        docType: "pan",
        name: "PAN Card",
        frontUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        fileType: "image",
      }),
    });
    const panData = await panRes.json();
    if (!panRes.ok || !panData.ok) throw new Error("PAN upload failed");
    console.log("✅ PAN Card uploaded successfully.");

    // 4b. Upload Aadhaar Card
    console.log("2. Uploading Aadhaar Card...");
    const aadhaarRes = await fetch(`${baseUrl}/api/vendor/document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        docType: "aadhaar",
        name: "Aadhaar Card",
        frontUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        backUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        fileType: "image",
      }),
    });
    const aadhaarData = await aadhaarRes.json();
    if (!aadhaarRes.ok || !aadhaarData.ok) throw new Error("Aadhaar upload failed");
    console.log("✅ Aadhaar Card uploaded successfully.");

    // -------------------------------------------------------------
    // STEP 5: BANK DETAILS & CANCELLED CHEQUE
    // -------------------------------------------------------------
    console.log("\n--- STEP 5: ADDING BANK DETAILS & CANCELLED CHEQUE ---");
    const bankRes = await fetch(`${baseUrl}/api/vendor/bank-details`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        accountHolderName: "Rohit Verma",
        bankName: "HDFC Bank",
        accountNumber: "50100234567890",
        ifscCode: "HDFC0001234",
        chequeUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      }),
    });
    const bankData = await bankRes.json();
    if (!bankRes.ok || !bankData.ok) throw new Error("Bank details save failed");
    console.log("✅ Bank details and Cancelled Cheque saved successfully.");

    // -------------------------------------------------------------
    // STEP 6: PORTFOLIO ITEM
    // -------------------------------------------------------------
    console.log("\n--- STEP 6: ADDING PORTFOLIO PROJECT ---");
    const portRes = await fetch(`${baseUrl}/api/vendor/portfolio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        title: "Royal Palace Wedding at Taj Lake Palace",
        category: "Wedding",
        serviceCategory: selectedCategoryIds[0],
        description: "Capturing timeless heritage wedding moments at Udaipur lake.",
        images: [
          "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800",
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
        ],
        videos: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
      }),
    });
    const portData = await portRes.json();
    if (!portRes.ok || !portData.ok) throw new Error("Portfolio add failed");
    console.log(`✅ Portfolio project added! Completion score: ${portData.data.completion.percentage}%`);

    // -------------------------------------------------------------
    // STEP 7: SUBMISSION FOR ADMIN VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- STEP 7: SUBMITTING FOR ADMIN VERIFICATION ---");
    const submitRes = await fetch(`${baseUrl}/api/vendor/submit-verification`, {
      method: "POST",
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok || !submitData.ok) {
      throw new Error(`Submission failed: ${JSON.stringify(submitData)}`);
    }
    console.log(`✅ Submitted successfully! Status is now: ${submitData.data.verificationStatus}`);

    // Verify vendor status is now under_review
    const statusRes = await fetch(`${baseUrl}/api/vendor/status`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const statusData = await statusRes.json();
    if (statusData.data.verificationStatus !== "under_review" || statusData.data.isApproved !== false) {
      throw new Error(`Expected under_review and isApproved=false, but got: ${JSON.stringify(statusData)}`);
    }
    console.log("✅ Verified: Vendor status is under_review, features remain locked.");

    // -------------------------------------------------------------
    // STEP 8: ADMIN LOGIN & VENDOR MANAGEMENT
    // -------------------------------------------------------------
    console.log("\n--- STEP 8: ADMIN REVIEW & DOCUMENT VERIFICATION ---");

    console.log("1. Logging in as Admin...");
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok || !adminLoginData.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    const adminToken = adminLoginData.data.token;
    console.log("✅ Admin logged in successfully!");

    // List vendors in Admin Panel
    console.log("2. Admin listing vendors (filtering by under_review)...");
    const listVendorsRes = await fetch(`${baseUrl}/api/admin/vendors?status=under_review`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listVendorsData = await listVendorsRes.json();
    if (!listVendorsRes.ok || !listVendorsData.ok) throw new Error("List vendors failed");

    const foundVendor = listVendorsData.data.vendors.find((v) => String(v._id) === String(vendorId));
    if (!foundVendor) {
      throw new Error("Submitted vendor did not appear in admin under_review list!");
    }
    console.log(`✅ Found vendor in admin list: "${foundVendor.businessName}" (Completion: ${foundVendor.completionPercentage}%)`);

    // Open complete vendor verification profile
    console.log("3. Admin retrieving vendor detail...");
    const vendorDetailRes = await fetch(`${baseUrl}/api/admin/vendors/${vendorId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const vendorDetailData = await vendorDetailRes.json();
    if (!vendorDetailRes.ok || !vendorDetailData.ok) throw new Error("Get vendor detail failed");
    console.log(`✅ Admin retrieved vendor details: ${vendorDetailData.data.vendor.vendorProfile?.documents?.length} documents, ${vendorDetailData.data.vendor.vendorProfile?.portfolio?.length} portfolio items.`);

    // -------------------------------------------------------------
    // STEP 9: TEST DOCUMENT REJECTION & RE-UPLOAD FLOW
    // -------------------------------------------------------------
    console.log("\n--- STEP 9: DOCUMENT REJECTION & RE-UPLOAD FLOW ---");

    const testRejectionReason = "Uploaded Aadhaar image is unclear. Please upload a clearer copy.";
    console.log(`1. Admin rejecting Aadhaar document with reason: "${testRejectionReason}"...`);
    const rejectDocRes = await fetch(`${baseUrl}/api/admin/vendors/${vendorId}/documents/aadhaar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        action: "reject",
        rejectionReason: testRejectionReason,
      }),
    });
    const rejectDocData = await rejectDocRes.json();
    if (!rejectDocRes.ok || !rejectDocData.ok) throw new Error("Document rejection failed");
    console.log("✅ Aadhaar document marked as Rejected.");

    // Vendor inspects profile -> sees rejection reason
    console.log("2. Vendor checking profile to see document status and rejection reason...");
    const checkRejectionRes = await fetch(`${baseUrl}/api/vendor/profile`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const checkRejectionData = await checkRejectionRes.json();
    const aadhaarInProfile = checkRejectionData.data.profile.documents.find((d) => d.docType === "aadhaar");
    if (!aadhaarInProfile || aadhaarInProfile.status !== "rejected" || aadhaarInProfile.rejectionReason !== testRejectionReason) {
      throw new Error(`Vendor did not see document rejection status/reason correctly! Data: ${JSON.stringify(aadhaarInProfile)}`);
    }
    console.log(`✅ Verified: Vendor sees Aadhaar status="rejected" and reason: "${aadhaarInProfile.rejectionReason}"`);

    // Vendor re-uploads clearer copy
    console.log("3. Vendor re-uploading corrected Aadhaar copy...");
    const reuploadRes = await fetch(`${baseUrl}/api/vendor/document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        docType: "aadhaar",
        name: "Aadhaar Card",
        frontUrl: "https://res.cloudinary.com/demo/image/upload/sample_clear_front.jpg",
        backUrl: "https://res.cloudinary.com/demo/image/upload/sample_clear_back.jpg",
        fileType: "image",
      }),
    });
    const reuploadData = await reuploadRes.json();
    if (!reuploadRes.ok || !reuploadData.ok) throw new Error("Document re-upload failed");

    const reuploadedDoc = reuploadData.data.documents.find((d) => d.docType === "aadhaar");
    if (reuploadedDoc.status !== "under_review" || reuploadedDoc.rejectionReason !== "") {
      throw new Error(`Re-uploaded document did not reset to under_review! Data: ${JSON.stringify(reuploadedDoc)}`);
    }
    console.log("✅ Verified: Re-uploaded document status reset to 'under_review' and rejection reason cleared.");

    // Admin verifies documents & bank details
    console.log("4. Admin verifying all documents...");
    await fetch(`${baseUrl}/api/admin/vendors/${vendorId}/documents/pan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: "verify" }),
    });
    await fetch(`${baseUrl}/api/admin/vendors/${vendorId}/documents/aadhaar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: "verify" }),
    });
    await fetch(`${baseUrl}/api/admin/vendors/${vendorId}/documents/cancelled_cheque`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: "verify" }),
    });
    await fetch(`${baseUrl}/api/admin/vendors/${vendorId}/bank-details`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: "verify" }),
    });
    console.log("✅ All individual documents and bank details verified by admin.");

    // -------------------------------------------------------------
    // STEP 10: FINAL ADMIN APPROVAL & UNLOCK WORKFLOW
    // -------------------------------------------------------------
    console.log("\n--- STEP 10: FINAL ADMIN APPROVAL & UNLOCK ---");
    console.log("1. Admin approving vendor...");
    const approveRes = await fetch(`${baseUrl}/api/admin/vendors/${vendorId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "approved" }),
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || !approveData.ok || approveData.data.vendor.approved !== true) {
      throw new Error(`Vendor approval failed: ${JSON.stringify(approveData)}`);
    }
    console.log(`✅ Vendor approved! Status: ${approveData.data.vendor.verificationStatus}`);

    // Verify vendor status now shows approved
    console.log("2. Checking vendor status from vendor endpoint...");
    const finalVendorStatusRes = await fetch(`${baseUrl}/api/vendor/status`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const finalVendorStatus = await finalVendorStatusRes.json();
    if (!finalVendorStatus.data.isApproved || finalVendorStatus.data.verificationStatus !== "approved") {
      throw new Error(`Vendor status did not reflect approval! Data: ${JSON.stringify(finalVendorStatus)}`);
    }
    console.log("✅ Verified: Vendor is now APPROVED and isApproved = true.");

    // -------------------------------------------------------------
    // STEP 11: UNLOCKED VENDOR CAPABILITIES
    // -------------------------------------------------------------
    console.log("\n--- STEP 11: UNLOCKED VENDOR CAPABILITIES ---");

    // Vendor can now create items/services across all categories!
    console.log("1. Vendor creating a new wedding service package...");
    const createItemRes = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        title: "Royal Heritage 2-Day Wedding Photography Package",
        category: selectedCategoryIds[0],
        price: 95000,
        city: "Jaipur",
        about: "Comprehensive coverage of Sangeet, Wedding Ceremony, and Reception with 3 candid photographers.",
        description: "Includes high-res edited photos, 4K wedding film, teaser video, and 2 luxury photobooks.",
        contactPhone: "9876543210",
        active: true,
      }),
    });

    const createItemData = await createItemRes.json();
    if (!createItemRes.ok || !createItemData.ok || !createItemData.data?.item) {
      throw new Error(`Approved vendor item creation failed: ${JSON.stringify(createItemData)}`);
    }
    const createdItemId = createItemData.data.item._id;
    console.log(`✅ Item created successfully! Title: "${createItemData.data.item.title}", Price: ₹${createItemData.data.item.price}`);

    // Vendor can update their item
    console.log("2. Vendor updating their item...");
    const updateItemRes = await fetch(`${baseUrl}/api/items/${createdItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        price: 110000,
      }),
    });
    const updateItemData = await updateItemRes.json();
    if (!updateItemRes.ok || updateItemData.data?.item?.price !== 110000) {
      throw new Error("Item update failed");
    }
    console.log(`✅ Item updated successfully! New price: ₹${updateItemData.data.item.price}`);

    // Vendor stats reflect the new item
    console.log("3. Checking vendor dashboard stats...");
    const finalStatsRes = await fetch(`${baseUrl}/api/vendor/stats`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const finalStats = await finalStatsRes.json();
    if (finalStats.data?.stats?.items < 1) {
      throw new Error("Vendor stats did not reflect created item!");
    }
    console.log(`✅ Vendor stats verified! Items: ${finalStats.data.stats.items}, Status: ${finalStats.data.stats.verificationStatus}, isApproved: ${finalStats.data.stats.isApproved}`);

    // Clean up created test item and test vendor
    await Item.deleteOne({ _id: createdItemId });
    await User.deleteOne({ email: testVendorEmail });
    console.log("\n✅ Test items and test vendor account cleaned up successfully.");

    console.log("\n=================================================");
    console.log("🎉 ALL VENDOR ONBOARDING & APPROVAL TESTS PASSED (100%)!");
    console.log("=================================================");
  } finally {
    server.close();
    process.exit(0);
  }
}

runVendorTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILURE:", err);
  process.exit(1);
});
