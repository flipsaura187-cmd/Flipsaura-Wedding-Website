/**
 * Comprehensive Automated Test Suite for WhatsApp Booking Notifications
 *
 * Scenarios tested (Step 7 requirements):
 * 1. A successful booking triggers both notifications.
 * 2. The admin receives the correct booking details.
 * 3. The customer receives the correct booking details.
 * 4. A failed booking triggers neither notification.
 * 5. A WhatsApp API failure does not break booking creation.
 * 6. An admin notification failure does not prevent the customer notification attempt, and vice versa.
 * 7. Duplicate booking requests do not cause duplicate notifications.
 * 8. Existing booking and dashboard functionality still works.
 */

import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { dbConnect } from "../lib/db.js";
import bookingRoutes from "../routes/bookingRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import Booking from "../models/Booking.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import {
  formatAdminBookingWhatsAppMessage,
  formatCustomerBookingWhatsAppMessage,
  sendBookingWhatsAppNotifications,
  normalizePhoneNumber,
  maskPhoneNumber,
} from "../lib/whatsapp.js";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("🧪 STARTING FLIPSAURA WHATSAPP NOTIFICATIONS VERIFICATION TEST SUITE");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB connected successfully.");

  // Spin up test server
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/auth", authRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5095, resolve));
  const baseUrl = "http://localhost:5095";
  console.log("✅ Test HTTP server running on port 5095.\n");

  const results = [];
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ ASSERTION FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`  ✓ ${message}`);
  }

  try {
    // -------------------------------------------------------------
    // SETUP TEST FIXTURES
    // -------------------------------------------------------------
    console.log("--- SETTING UP TEST USERS & ITEMS ---");

    // Admin user
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.create({
        name: "Test Admin",
        email: `test_admin_${Date.now()}@flipsaura.com`,
        phone: "9876543210",
        passwordHash: "hash123",
        role: "admin",
      });
    }
    const adminToken = signToken({ uid: String(admin._id), role: "admin" });

    // Vendor user
    let vendor = await User.findOne({ role: "vendor" });
    if (!vendor) {
      vendor = await User.create({
        name: "Test Vendor",
        email: `test_vendor_${Date.now()}@flipsaura.com`,
        phone: "9876543211",
        passwordHash: "hash123",
        role: "vendor",
        vendorProfile: {
          businessName: "Royal Grand Palace",
          approved: true,
          verificationStatus: "approved",
        },
      });
    }
    const vendorToken = signToken({ uid: String(vendor._id), role: "vendor" });

    // Customer user
    const customer = await User.create({
      name: "Rohit Sharma",
      email: `customer_${Date.now()}@example.com`,
      phone: "9812345678",
      passwordHash: "hash123",
      role: "user",
    });
    const customerToken = signToken({ uid: String(customer._id), role: "user" });

    // Test Category
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({
        name: "Wedding Venue",
        slug: `venue-${Date.now()}`,
      });
    }

    // Test Item
    const item = await Item.create({
      title: "Royal Grand Banquet Hall",
      category: category._id,
      vendor: vendor._id,
      price: 45000,
      city: "New Delhi",
      state: "Delhi",
    });

    console.log(`  ✓ Test Customer: ${customer.name} (${customer.phone})`);
    console.log(`  ✓ Test Vendor:   ${vendor.vendorProfile?.businessName || vendor.name}`);
    console.log(`  ✓ Test Item:     ${item.title} (₹${item.price})\n`);

    // Ensure environment is set to mock mode during automated test so we do not spam live WhatsApp numbers
    process.env.WHATSAPP_PROVIDER = "mock";
    process.env.WHATSAPP_ADMIN_PHONE = "919876543210";

    // -------------------------------------------------------------
    // SCENARIO 1, 2, 3: SUCCESSFUL BOOKING TRIGGERS BOTH NOTIFICATIONS WITH ACCURATE DETAILS
    // -------------------------------------------------------------
    console.log("--- SCENARIO 1, 2, 3: SUCCESSFUL BOOKING & ACCURATE DETAILS ---");
    const bookingPayload = {
      itemId: String(item._id),
      eventDate: "2026-11-20",
      amount: 45000,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      notes: "Main Hall banquet setup with catering",
      address: "Connaught Place, Central Delhi",
    };

    const res1 = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(bookingPayload),
    });

    const body1 = await res1.json();
    assert(res1.ok && body1.ok, "API returned HTTP 200 OK for valid booking creation");
    assert(body1.data?.booking?._id, "Booking record was persisted in database");
    const createdBookingId = body1.data.booking._id;

    // Wait 1.5 seconds for background dispatch
    await new Promise((r) => setTimeout(r, 1500));

    const freshBooking1 = await Booking.findById(createdBookingId);
    assert(freshBooking1.status === "pending", "Booking initial status is correctly 'pending'");
    assert(
      freshBooking1.notifications?.adminWhatsApp?.sent === true,
      "Admin WhatsApp notification sent flag is true"
    );
    assert(
      freshBooking1.notifications?.customerWhatsApp?.sent === true,
      "Customer WhatsApp notification sent flag is true"
    );

    // Verify Admin message formatting
    const adminMsg = formatAdminBookingWhatsAppMessage(freshBooking1, item, vendor);
    assert(adminMsg.includes("New Booking Received — FlipsAura!"), "Admin message has FlipsAura header");
    assert(adminMsg.includes(String(freshBooking1._id)), "Admin message contains accurate Booking ID");
    assert(adminMsg.includes(customer.name), "Admin message contains accurate Customer Name");
    assert(adminMsg.includes(customer.phone), "Admin message contains accurate Customer Phone");
    assert(adminMsg.includes(item.title), "Admin message contains accurate Service Title");
    assert(adminMsg.includes("2026-11-20"), "Admin message contains accurate Event Date");
    assert(adminMsg.includes("pending"), "Admin message contains accurate Status ('pending')");
    assert(adminMsg.includes(vendor.vendorProfile?.businessName || vendor.name), "Admin message contains Vendor Name");
    assert(adminMsg.includes("45,000"), "Admin message contains Amount");

    // Verify Customer message formatting
    const custMsg = formatCustomerBookingWhatsAppMessage(freshBooking1, item, vendor);
    assert(custMsg.includes(`Hi ${customer.name}!`), "Customer message contains personalized greeting");
    assert(custMsg.includes(String(freshBooking1._id)), "Customer message contains accurate Booking ID");
    assert(custMsg.includes(item.title), "Customer message contains accurate Service Title");
    assert(custMsg.includes("2026-11-20"), "Customer message contains accurate Booking Date");
    assert(custMsg.includes("pending"), "Customer message correctly states 'pending' (not confirmed)");
    assert(custMsg.includes("Thank you for choosing FlipsAura!"), "Customer message contains signoff");

    results.push("Scenario 1, 2, 3: Successful booking triggers both notifications with accurate details -> PASSED");
    console.log("✅ Scenario 1, 2, 3 PASSED.\n");

    // -------------------------------------------------------------
    // SCENARIO 4: FAILED BOOKING TRIGGERS NEITHER NOTIFICATION
    // -------------------------------------------------------------
    console.log("--- SCENARIO 4: FAILED BOOKING TRIGGERS NEITHER NOTIFICATION ---");
    const countBefore = await Booking.countDocuments();

    // Invalid item ID
    const resBad = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ itemId: new mongoose.Types.ObjectId().toString() }),
    });

    const bodyBad = await resBad.json();
    assert(resBad.status === 404 && bodyBad.ok === false, "Booking creation with invalid item returns 404");
    const countAfter = await Booking.countDocuments();
    assert(countBefore === countAfter, "No new booking persisted in database");

    results.push("Scenario 4: Failed booking triggers neither notification -> PASSED");
    console.log("✅ Scenario 4 PASSED.\n");

    // -------------------------------------------------------------
    // SCENARIO 5: WHATSAPP API FAILURE DOES NOT BREAK BOOKING CREATION
    // -------------------------------------------------------------
    console.log("--- SCENARIO 5: WHATSAPP FAILURE DOES NOT BREAK BOOKING CREATION ---");

    // Force provider to unconfigured / failing provider to simulate gateway outage
    process.env.WHATSAPP_PROVIDER = "meta";
    process.env.WHATSAPP_ACCESS_TOKEN = "invalid_bad_token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "00000000";

    const res5 = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        itemId: String(item._id),
        eventDate: "2026-12-15",
        amount: 45000,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        notes: "Testing resilience when WhatsApp API fails",
      }),
    });

    const body5 = await res5.json();
    assert(res5.ok && body5.ok === true, "Booking succeeds (HTTP 200) even when WhatsApp provider fails");
    assert(body5.data?.booking?._id, "Booking is safely persisted in DB despite WhatsApp error");

    await new Promise((r) => setTimeout(r, 1500));
    const booking5 = await Booking.findById(body5.data.booking._id);
    assert(booking5 !== null, "Booking was not rolled back or corrupted");
    assert(booking5.status === "pending", "Booking status remains valid");
    assert(booking5.notifications?.adminWhatsApp?.sent === false, "Admin notification recorded failure safely");
    assert(booking5.notifications?.customerWhatsApp?.sent === false, "Customer notification recorded failure safely");

    // Reset provider to mock for remaining tests
    process.env.WHATSAPP_PROVIDER = "mock";
    results.push("Scenario 5: WhatsApp API failure does not break booking creation -> PASSED");
    console.log("✅ Scenario 5 PASSED.\n");

    // -------------------------------------------------------------
    // SCENARIO 6: ISOLATION — ADMIN FAILURE DOES NOT STOP CUSTOMER, AND VICE VERSA
    // -------------------------------------------------------------
    console.log("--- SCENARIO 6: NOTIFICATION FAILURE ISOLATION ---");

    // 6A: Admin phone invalid / missing -> Customer notification must still succeed
    process.env.WHATSAPP_ADMIN_PHONE = "";
    // Temporary remove phone from admin users in DB
    await User.updateMany({ role: "admin" }, { $set: { phone: "" } });

    const booking6A = await Booking.create({
      user: customer._id,
      item: item._id,
      vendor: vendor._id,
      name: "Isolation Test Customer",
      email: customer.email,
      phone: "9811122233",
      eventDate: "2027-01-10",
      amount: 45000,
      status: "pending",
    });

    await sendBookingWhatsAppNotifications(booking6A._id);
    const fresh6A = await Booking.findById(booking6A._id);
    assert(
      fresh6A.notifications?.adminWhatsApp?.sent === false,
      "Admin notification marked false when admin phone missing"
    );
    assert(
      fresh6A.notifications?.customerWhatsApp?.sent === true,
      "Customer notification STILL succeeded despite admin failure!"
    );

    // 6B: Customer phone invalid -> Admin notification must still succeed
    process.env.WHATSAPP_ADMIN_PHONE = "919876543210";
    const booking6B = await Booking.create({
      user: customer._id,
      item: item._id,
      vendor: vendor._id,
      name: "No Phone Customer",
      email: customer.email,
      phone: "", // Missing customer phone
      eventDate: "2027-02-14",
      amount: 45000,
      status: "pending",
    });

    await sendBookingWhatsAppNotifications(booking6B._id);
    const fresh6B = await Booking.findById(booking6B._id);
    assert(
      fresh6B.notifications?.adminWhatsApp?.sent === true,
      "Admin notification STILL succeeded despite customer phone missing!"
    );
    assert(
      fresh6B.notifications?.customerWhatsApp?.sent === false,
      "Customer notification marked false when phone is missing"
    );

    results.push("Scenario 6: Notification failure isolation -> PASSED");
    console.log("✅ Scenario 6 PASSED.\n");

    // -------------------------------------------------------------
    // SCENARIO 7: DUPLICATE BOOKING PROTECTION & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log("--- SCENARIO 7: DUPLICATE BOOKING PROTECTION & IDEMPOTENCY ---");

    const duplicatePayload = {
      itemId: String(item._id),
      eventDate: "2026-12-31",
      amount: 45000,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };

    // First booking request
    const res7A = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(duplicatePayload),
    });
    const body7A = await res7A.json();
    assert(body7A.ok === true, "First booking submission succeeds");
    const originalBookingId = body7A.data.booking._id;

    // Rapid second booking request (simulate double-click within 10s)
    const res7B = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(duplicatePayload),
    });
    const body7B = await res7B.json();
    assert(body7B.ok === true, "Second booking submission returns 200");
    assert(
      body7B.data.booking._id === originalBookingId,
      "Rapid duplicate submission returned the existing booking ID without creating a duplicate record"
    );

    // Test notification dispatch idempotency: calling sendBookingWhatsAppNotifications again
    await new Promise((r) => setTimeout(r, 1200));
    const reDispatchResult = await sendBookingWhatsAppNotifications(originalBookingId);
    assert(
      reDispatchResult.skipped === true,
      "Re-dispatching notifications on an already-sent booking skipped sending duplicate messages"
    );

    results.push("Scenario 7: Duplicate booking requests do not cause duplicate notifications -> PASSED");
    console.log("✅ Scenario 7 PASSED.\n");

    // -------------------------------------------------------------
    // SCENARIO 8: EXISTING BOOKING & DASHBOARD FUNCTIONALITY STILL WORKS
    // -------------------------------------------------------------
    console.log("--- SCENARIO 8: EXISTING BOOKING & DASHBOARD FUNCTIONALITY ---");

    // 8A: GET /api/bookings as Customer returns customer's bookings
    const resCustBookings = await fetch(`${baseUrl}/api/bookings`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const bodyCustBookings = await resCustBookings.json();
    assert(resCustBookings.ok && bodyCustBookings.ok, "Customer can fetch their own bookings");
    assert(
      bodyCustBookings.data.bookings.length > 0,
      `Customer retrieved ${bodyCustBookings.data.bookings.length} bookings`
    );

    // 8B: GET /api/bookings as Admin returns all bookings
    const resAdminBookings = await fetch(`${baseUrl}/api/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bodyAdminBookings = await resAdminBookings.json();
    assert(resAdminBookings.ok && bodyAdminBookings.ok, "Admin can fetch all bookings across platform");
    assert(
      bodyAdminBookings.data.bookings.length >= bodyCustBookings.data.bookings.length,
      "Admin bookings list contains all bookings"
    );

    // 8C: GET /api/bookings/:id retrieves single booking
    const resSingle = await fetch(`${baseUrl}/api/bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const bodySingle = await resSingle.json();
    assert(resSingle.ok && bodySingle.ok, "Can fetch single booking by ID");
    assert(bodySingle.data.booking._id === createdBookingId, "Fetched booking matches ID");

    // 8D: PUT /api/bookings/:id updates status (Admin/Vendor)
    const resUpdate = await fetch(`${baseUrl}/api/bookings/${createdBookingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "confirmed" }),
    });
    const bodyUpdate = await resUpdate.json();
    assert(resUpdate.ok && bodyUpdate.ok, "Admin can update booking status");
    assert(bodyUpdate.data.booking.status === "confirmed", "Booking status updated to 'confirmed'");

    results.push("Scenario 8: Existing booking and dashboard functionality still works -> PASSED");
    console.log("✅ Scenario 8 PASSED.\n");

    // -------------------------------------------------------------
    // CLEANUP TEST FIXTURES
    // -------------------------------------------------------------
    await Booking.deleteMany({
      $or: [
        { _id: createdBookingId },
        { _id: body5.data.booking._id },
        { _id: booking6A._id },
        { _id: booking6B._id },
        { _id: originalBookingId },
      ],
    });
    await Item.deleteOne({ _id: item._id });
    await User.deleteOne({ _id: customer._id });

    // Restore admin phone if had one
    await User.updateOne({ _id: admin._id }, { $set: { phone: "9876543210" } });

    console.log("================================================================================");
    console.log("🎉 ALL 8 SCENARIOS PASSED SUCCESSFULLY!");
    console.log("================================================================================\n");
    results.forEach((r) => console.log(`  ✓ ${r}`));

    server.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED WITH ERROR:", err);
    server.close();
    process.exit(1);
  }
}

runTestSuite();
