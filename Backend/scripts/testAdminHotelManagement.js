import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Category from "../models/Category.js";

async function runTest() {
  console.log("============================================================");
  console.log("🧪 TESTING ADMIN HOTEL & ROOM MANAGEMENT SYSTEM INTEGRATION");
  console.log("============================================================\n");

  await dbConnect();

  // 1. Check existing hotels and rooms
  const hotelCat = await Category.findOne({ slug: "hotels" });
  if (!hotelCat) {
    throw new Error("Hotels category not found");
  }
  console.log(`✅ Hotels category confirmed: ID ${hotelCat._id}`);

  const existingHotels = await Item.find({ category: hotelCat._id }).lean();
  console.log(`✅ Found ${existingHotels.length} existing hotel items in database.`);

  const testTitle = `Test Imperial Grand Hotel - ${Date.now()}`;
  const testCity = "Daudnagar";
  const testPhone = "+91 9988776655";
  const testEmail = `test.hotel.${Date.now()}@flipsaura.local`;

  console.log(`\n🏨 Step 1: Testing Manual Creation of Hotel Vendor & Property...`);
  // Simulate admin creating hotel with vendor
  const defaultHash = await User.hashPassword("Flipsaura@Hotel2026");
  const testVendor = await User.create({
    name: "Vikram Singhania (Owner)",
    email: testEmail,
    phone: testPhone,
    passwordHash: defaultHash,
    role: "vendor",
    vendorProfile: {
      businessName: testTitle,
      ownerName: "Vikram Singhania",
      vendorType: "Business",
      address: "Station Road, Near Grand Square",
      city: testCity,
      state: "Bihar",
      pincode: "824143",
      about: "Luxury heritage wedding hotel and accommodation resort.",
      categories: [hotelCat._id],
      verificationStatus: "approved",
      approved: true,
      source: "manual_public_import",
    },
  });
  console.log(`✅ Hotel Vendor User created: ${testVendor._id} (${testVendor.name})`);

  const testHotel = await Item.create({
    title: testTitle,
    slug: `test-imperial-grand-${Date.now()}`,
    category: hotelCat._id,
    vendor: testVendor._id,
    city: testCity,
    state: "Bihar",
    contactPhone: testPhone,
    contactEmail: testEmail,
    price: 3649,
    about: "Imperial luxury air-conditioned hotel resort with landscaped gardens and wedding suites.",
    description: "Detailed hotel description with 24x7 room service, banquet facilities, and private bathrooms.",
    facilities: [
      { group: "Popular Amenities", name: "Free High-Speed Wi-Fi", highlight: true },
      { group: "Popular Amenities", name: "Air Conditioning (AC)", highlight: true },
      { group: "Popular Amenities", name: "Banquet & Wedding Hall", highlight: true },
    ],
    images: ["https://res.cloudinary.com/dvvpsnea0/image/upload/v1792763761/flipsaura/rooms/room_haweli_resort_room2_1792763761005.avif"],
    active: true,
  });
  console.log(`✅ Hotel Item created: ${testHotel._id} ("${testHotel.title}")`);

  console.log(`\n🛏️ Step 2: Testing Adding Rooms under Hotel...`);
  const room1 = await Room.create({
    hotel: testHotel._id,
    vendor: testVendor._id,
    name: "Deluxe AC (Countryside View)",
    roomType: "Deluxe Room",
    pricePerNight: 3649,
    availableRooms: 5,
    maxGuests: 2,
    bedType: "1 King Bed",
    numberOfBeds: 1,
    roomSize: "140 sq ft (13 sq m)",
    cancellationPolicy: "Free Cancellation Till Check-in",
    facilities: [
      "Air Conditioning (AC)",
      "Countryside View",
      "High-Speed Wi-Fi",
      "Flat-screen LED TV",
      "24x7 Hot & Cold Water",
      "Attached Bathroom",
      "Mineral Water Available",
      "Free Cancellation Till Check-in",
    ],
    description: "140 sq ft (13 sq m) Deluxe air-conditioned resort room with sweeping countryside views, king bed, fast Wi-Fi, and flat-screen TV.",
    images: ["https://res.cloudinary.com/dvvpsnea0/image/upload/v1792763761/flipsaura/rooms/room_haweli_resort_room2_1792763761005.avif"],
    active: true,
  });
  console.log(`✅ Room 1 created: "${room1.name}" | ₹${room1.pricePerNight} | Size: ${room1.roomSize} | Cancellation: ${room1.cancellationPolicy}`);

  const room2 = await Room.create({
    hotel: testHotel._id,
    vendor: testVendor._id,
    name: "Presidential Luxury Suite",
    roomType: "Suite Room",
    pricePerNight: 6499,
    availableRooms: 2,
    maxGuests: 4,
    bedType: "1 King Bed + 1 Sofa Bed",
    numberOfBeds: 2,
    roomSize: "320 sq ft (30 sq m)",
    cancellationPolicy: "Free Cancellation Till Check-in",
    facilities: [
      "Air Conditioning (AC)",
      "Jacuzzi Bathtub",
      "Living & Lounge Area",
      "Complimentary Breakfast",
      "High-Speed Wi-Fi",
      "24x7 Room Service",
    ],
    description: "Expansive presidential bridal suite with separate living area, king master bed, and luxury bathroom.",
    images: ["https://res.cloudinary.com/dvvpsnea0/image/upload/v1792700169/flipsaura/rooms/hotel-saraswati-inn_room1_1792700166703.avif"],
    active: true,
  });
  console.log(`✅ Room 2 created: "${room2.name}" | ₹${room2.pricePerNight} | Size: ${room2.roomSize}`);

  console.log(`\n🔍 Step 3: Testing Customer-Facing Item & Room Fetching...`);
  const fetchedHotel = await Item.findById(testHotel._id).lean();
  const fetchedRooms = await Room.find({ hotel: testHotel._id, active: true }).sort({ pricePerNight: 1 }).lean();

  console.log(`✅ Retrieved hotel: ${fetchedHotel.title} (Price: ₹${fetchedHotel.price})`);
  console.log(`✅ Retrieved ${fetchedRooms.length} active room(s):`);
  fetchedRooms.forEach((r, idx) => {
    console.log(`   ${idx + 1}. [${r.roomType}] "${r.name}" - ₹${r.pricePerNight}/night - Max ${r.maxGuests} Guests - ${r.bedType} - Size: "${r.roomSize}"`);
    console.log(`      Cancellation: "${r.cancellationPolicy}"`);
    console.log(`      Facilities count: ${r.facilities.length} items`);
  });

  if (fetchedRooms.length !== 2) {
    throw new Error(`Expected 2 rooms, found ${fetchedRooms.length}`);
  }

  console.log(`\n✏️ Step 4: Testing Room Update...`);
  await Room.findByIdAndUpdate(room1._id, {
    pricePerNight: 3499,
    availableRooms: 4,
    description: "Updated description for Deluxe AC room.",
  });
  const updatedRoom1 = await Room.findById(room1._id).lean();
  console.log(`✅ Updated Room 1 tariff: ₹${updatedRoom1.pricePerNight}/night, available: ${updatedRoom1.availableRooms}`);

  console.log(`\n🧹 Step 5: Testing Deletion Cleanup...`);
  const delRoomsResult = await Room.deleteMany({ hotel: testHotel._id });
  console.log(`✅ Deleted ${delRoomsResult.deletedCount} rooms.`);
  await Item.findByIdAndDelete(testHotel._id);
  console.log(`✅ Deleted test hotel item.`);
  await User.findByIdAndDelete(testVendor._id);
  console.log(`✅ Deleted test vendor user.`);

  console.log("\n============================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! FEATURE IS FULLY WORKING.");
  console.log("============================================================\n");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
