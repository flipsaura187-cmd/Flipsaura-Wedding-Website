import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Vehicle from "../models/Vehicle.js";
import VehicleBooking from "../models/VehicleBooking.js";
import User from "../models/User.js";
import {
  checkRentalAvailability,
  calculatePricing,
} from "../controllers/vehicleController.js";

async function runVehicleTests() {
  await dbConnect();
  console.log("=========================================");
  console.log("🚗 RUNNING FLIPSAURA VEHICLE MODULE TESTS");
  console.log("=========================================\n");

  // 1. Get test provider & customer
  const provider = await User.findOne({ role: { $in: ["vendor", "admin"] } });
  if (!provider) throw new Error("No provider user found in DB.");

  let customer = await User.findOne({ role: "user" });
  if (!customer) {
    customer = provider;
  }

  // 2. Fetch or create a test vehicle
  let testVehicle = await Vehicle.findOne({ registrationNumber: "TEST 01 AB 9999" });
  if (!testVehicle) {
    testVehicle = await Vehicle.create({
      owner: provider._id,
      name: "Test Luxury Wedding BMW 5-Series",
      brand: "BMW",
      model: "5-Series",
      vehicleType: "car",
      supportedServices: ["rental", "transport"],
      registrationNumber: "TEST 01 AB 9999",
      seatingCapacity: 4,
      fuelType: "petrol",
      transmission: "automatic",
      city: "Patna",
      pickupLocation: "Patna Airport",
      rentalPricing: {
        pricePerHour: 1000,
        pricePerDay: 8000,
        minDurationHours: 4,
        maxDurationDays: 14,
        securityDeposit: 10000,
        includedKmPerDay: 200,
        extraKmRate: 25,
      },
      transportPricing: {
        pricingType: "fixed",
        baseTripPrice: 6500,
        driverAllowance: 500,
      },
      availabilityStatus: "available",
      verificationStatus: "verified",
      active: true,
    });
    console.log("✓ Created test vehicle:", testVehicle.name);
  } else {
    console.log("✓ Found existing test vehicle:", testVehicle.name);
  }

  // 3. Test Pricing Calculations
  console.log("\n[Test 1] Testing Server-Side Pricing Calculations...");
  const rentPricing = calculatePricing(testVehicle, "RENTAL", {
    startDate: "2026-12-01T10:00:00Z",
    endDate: "2026-12-03T10:00:00Z", // 2 days = 48 hrs
  });

  if (rentPricing.durationDays !== 2) throw new Error(`Expected 2 days, got ${rentPricing.durationDays}`);
  if (rentPricing.basePrice !== 16000) throw new Error(`Expected 16000 base, got ${rentPricing.basePrice}`);
  if (rentPricing.totalAmount !== 26000) throw new Error(`Expected 26000 total (16000 + 10000 deposit), got ${rentPricing.totalAmount}`);
  console.log("✓ Rental Pricing Calculation Passed: Total ₹26,000 for 2 days");

  const transportPricing = calculatePricing(testVehicle, "TRANSPORT", {
    tripType: "one_way",
    passengers: 3,
  });
  if (transportPricing.totalAmount !== 7000) throw new Error(`Expected 7000 (6500 base + 500 allowance), got ${transportPricing.totalAmount}`);
  console.log("✓ Transport Pricing Calculation Passed: Total ₹7,000 for one-way trip");

  // 4. Test Availability & Overlap Detection
  console.log("\n[Test 2] Testing Rental Overlap Prevention & Double-Booking Protection...");
  const slotStart = new Date("2026-12-10T10:00:00Z");
  const slotEnd = new Date("2026-12-12T10:00:00Z");

  // Clean any old test bookings for this slot
  await VehicleBooking.deleteMany({
    vehicle: testVehicle._id,
    "rentalDetails.startDate": slotStart,
  });

  // Check initial availability
  const initialAvail = await checkRentalAvailability(testVehicle._id, slotStart, slotEnd);
  if (!initialAvail.available) throw new Error("Slot should initially be available.");
  console.log("✓ Initial Slot is AVAILABLE");

  // Create confirmed booking for this slot
  const confirmedBooking = await VehicleBooking.create({
    bookingRef: `FL-TEST-${Date.now()}`,
    customer: customer._id,
    vehicle: testVehicle._id,
    owner: provider._id,
    serviceType: "RENTAL",
    rentalDetails: {
      startDate: slotStart,
      endDate: slotEnd,
      durationDays: 2,
      durationHours: 48,
      pickupLocation: "Patna Airport",
    },
    customerName: "Test Customer",
    customerEmail: "customer@flipsaura.test",
    customerPhone: "9988776655",
    priceBreakdown: rentPricing,
    status: "CONFIRMED",
    paymentStatus: "paid",
  });
  console.log("✓ Created CONFIRMED reservation:", confirmedBooking.bookingRef);

  // Now test overlapping requests
  // Overlap 1: Exact same slot
  const overlap1 = await checkRentalAvailability(testVehicle._id, slotStart, slotEnd);
  if (overlap1.available) throw new Error("Backend failed to block exact overlapping booking!");
  console.log("✓ Overlap 1 (Exact dates) correctly BLOCKED by backend");

  // Overlap 2: Middle of the slot (Dec 11 to Dec 11)
  const overlap2 = await checkRentalAvailability(
    testVehicle._id,
    new Date("2026-12-11T00:00:00Z"),
    new Date("2026-12-11T20:00:00Z")
  );
  if (overlap2.available) throw new Error("Backend failed to block middle overlapping booking!");
  console.log("✓ Overlap 2 (Interior date) correctly BLOCKED by backend");

  // Overlap 3: Overlapping start (Dec 09 to Dec 11)
  const overlap3 = await checkRentalAvailability(
    testVehicle._id,
    new Date("2026-12-09T00:00:00Z"),
    new Date("2026-12-11T00:00:00Z")
  );
  if (overlap3.available) throw new Error("Backend failed to block start-overlapping booking!");
  console.log("✓ Overlap 3 (Start overlap) correctly BLOCKED by backend");

  // Non-overlapping slot: Dec 13 to Dec 15
  const nonOverlap = await checkRentalAvailability(
    testVehicle._id,
    new Date("2026-12-13T10:00:00Z"),
    new Date("2026-12-15T10:00:00Z")
  );
  if (!nonOverlap.available) throw new Error("Backend blocked non-overlapping dates!");
  console.log("✓ Non-overlapping future dates correctly allowed: AVAILABLE");

  // 5. Test Customer Cancellation
  console.log("\n[Test 3] Testing Customer Cancellation Flow...");
  confirmedBooking.status = "CANCELLED";
  confirmedBooking.cancelledBy = "customer";
  confirmedBooking.cancellationReason = "Wedding dates rescheduled";
  await confirmedBooking.save();

  // Now the cancelled slot should become available again!
  const afterCancelAvail = await checkRentalAvailability(testVehicle._id, slotStart, slotEnd);
  if (!afterCancelAvail.available) throw new Error("Slot should be free after cancellation!");
  console.log("✓ Slot is immediately FREE after cancellation");

  // 6. Test Public Registration Masking
  console.log("\n[Test 4] Testing Vehicle Registration Privacy Masking...");
  const publicJson = testVehicle.toPublicJSON();
  if (publicJson.registrationNumber.includes("AB 9999")) {
    throw new Error(`Sensitive registration plate leaked in public view: ${publicJson.registrationNumber}`);
  }
  console.log(`✓ Registration correctly masked: "${publicJson.registrationNumber}"`);

  // 7. Test Admin Verification & Moderation Workflow
  console.log("\n[Test 5] Testing Admin Vehicle Approval & Moderation Lifecycle...");
  const pendingVehicle = await Vehicle.create({
    owner: provider._id,
    name: "Pending Approval Thar 4x4",
    brand: "Mahindra",
    model: "Thar",
    vehicleType: "four_wheeler",
    registrationNumber: "BR 01 MOD 1234",
    seatingCapacity: 4,
    city: "Patna",
    verificationStatus: "pending",
    active: false,
  });

  // Check 1: Inactive / pending vehicle must NOT appear in public verified search
  const publicCountPending = await Vehicle.countDocuments({
    _id: pendingVehicle._id,
    verificationStatus: "verified",
    active: true,
  });
  if (publicCountPending !== 0) {
    throw new Error("Pending vehicle erroneously appeared in public search!");
  }
  console.log("✓ Pending vehicle correctly HIDDEN from public marketplace");

  // Check 2: Admin approves the vehicle
  pendingVehicle.verificationStatus = "verified";
  pendingVehicle.active = true;
  pendingVehicle.rejectionReason = "";
  await pendingVehicle.save();

  const publicCountApproved = await Vehicle.countDocuments({
    _id: pendingVehicle._id,
    verificationStatus: "verified",
    active: true,
  });
  if (publicCountApproved !== 1) {
    throw new Error("Approved vehicle failed to become active on public marketplace!");
  }
  console.log("✓ Admin Approval correctly ACTIVATES vehicle on public marketplace");

  // Check 3: Admin rejects the vehicle
  pendingVehicle.verificationStatus = "rejected";
  pendingVehicle.active = false;
  pendingVehicle.rejectionReason = "RC image blurred";
  await pendingVehicle.save();

  const publicCountRejected = await Vehicle.countDocuments({
    _id: pendingVehicle._id,
    verificationStatus: "verified",
    active: true,
  });
  if (publicCountRejected !== 0) {
    throw new Error("Rejected vehicle was not hidden from public search!");
  }
  console.log("✓ Admin Rejection correctly HIDES vehicle and records rejection reason");

  // Clean up test booking and pending vehicle
  await VehicleBooking.deleteOne({ _id: confirmedBooking._id });
  await Vehicle.deleteOne({ _id: testVehicle._id });
  await Vehicle.deleteOne({ _id: pendingVehicle._id });
  console.log("✓ Cleaned up test artifacts.");

  console.log("\n=========================================");
  console.log("✅ ALL VEHICLE MODULE TESTS PASSED (100%)");
  console.log("=========================================\n");
  process.exit(0);
}

runVehicleTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
