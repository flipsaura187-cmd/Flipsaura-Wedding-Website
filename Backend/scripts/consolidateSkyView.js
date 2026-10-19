import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Room from "../models/Room.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

async function consolidateSkyView() {
  await dbConnect();

  console.log("==================================================");
  console.log("  CONSOLIDATING HOTEL SKY VIEW ROOMS INTO 1 HOTEL ");
  console.log("==================================================");

  // 1. Find all items related to Sky View
  const skyViewItems = await Item.find({ title: /sky\s*view/i }).sort({ price: 1 });
  console.log(`Found ${skyViewItems.length} Sky View items.`);

  if (skyViewItems.length === 0) {
    console.log("No Sky View items found in database!");
    process.exit(0);
  }

  // Choose the master item (lowest ID or first)
  const masterItem = skyViewItems[0];
  const duplicateItems = skyViewItems.slice(1);
  const duplicateIds = duplicateItems.map((d) => d._id);

  console.log(`\nMASTER HOTEL ITEM: "${masterItem.title}" (${masterItem._id})`);
  console.log(`DUPLICATE ITEMS TO CONSOLIDATE (${duplicateItems.length}):`);
  duplicateItems.forEach((d) => console.log(`  - "${d.title}" (${d._id}) - Price: ₹${d.price}`));

  // 2. Fetch Hotels Category
  const hotelCat = await Category.findOne({
    $or: [{ slug: "hotels" }, { name: /hotel/i }],
  });
  const hotelCatId = hotelCat ? hotelCat._id : masterItem.category;

  const vendorId = masterItem.vendor;

  // 3. Update Master Item to be the unified "The Hotel Sky View"
  const cldPhoto = masterItem.images?.[0] ||
    "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792316229/flipsaura/hotels/hotel_HOTEL_SKY_VIEW_1792316228998.jpg";

  masterItem.title = "The Hotel Sky View";
  masterItem.slug = "the-hotel-sky-view-aurangabad";
  masterItem.category = hotelCatId;
  masterItem.price = 1700;
  masterItem.city = "Aurangabad, Bihar";
  masterItem.images = [cldPhoto];
  masterItem.about =
    "The Hotel Sky View in Aurangabad offers comfortable accommodation with multiple room categories including Semi Deluxe, Deluxe, Super Deluxe, and Superior Rooms. Features modern amenities, in-room dining, 24x7 room service, air conditioning, and warm hospitality for business and leisure guests.";
  masterItem.description =
    "Welcome to The Hotel Sky View, Aurangabad. Situated conveniently opposite Singh Kothi on G.T. Road, The Hotel Sky View is an ideal destination for business travelers, wedding parties, and holiday guests. The property features beautifully maintained guest rooms across Semi Deluxe, Deluxe, Super Deluxe, and Superior room types, offering air conditioning, premium bedding, attached private bathrooms, flat-screen TVs, high-speed Wi-Fi, in-house dining, and warm personalized service.";
  masterItem.facilities = [
    { name: "Air Conditioning (AC)", group: "Popular Amenities", highlight: true },
    { name: "High-Speed Wi-Fi", group: "Popular Amenities", highlight: true },
    { name: "In-House Restaurant", group: "Dining", highlight: true },
    { name: "24x7 Room Service", group: "Services", highlight: true },
    { name: "24x7 Power Backup", group: "Popular Amenities", highlight: false },
    { name: "Parking Facility", group: "Popular Amenities", highlight: false },
    { name: "Daily Housekeeping", group: "Services", highlight: false },
    { name: "24x7 Hot Water / Geyser", group: "Popular Amenities", highlight: false },
  ];
  masterItem.specifications = [
    { key: "Starting Tariff", value: "₹1,700/night (+ taxes)" },
    { key: "Room Categories", value: "Semi Deluxe, Deluxe, Super Deluxe, Superior Room" },
    { key: "Property Type", value: "Hotel / Accommodation" },
    { key: "Location", value: "Opposite Singh Kothi, G.T. Road, Aurangabad, Bihar" },
    { key: "MMT Guest Rating", value: "3.7 ★ (63 reviews)" },
  ];
  masterItem.active = true;
  await masterItem.save();
  console.log(`\nUpdated Master Hotel Item: "${masterItem.title}" (ID: ${masterItem._id})`);

  // 4. Update vendor profile with Hotels category and business name
  if (vendorId) {
    await User.updateOne(
      { _id: vendorId },
      {
        $addToSet: { "vendorProfile.categories": hotelCatId },
        $set: {
          "vendorProfile.businessName": "THE HOTEL SKY VIEW",
          "vendorProfile.city": "Aurangabad, Bihar",
          "vendorProfile.startingPrice": 1700,
          "vendorProfile.approved": true,
          "vendorProfile.verificationStatus": "approved",
        },
      }
    );
    console.log(`Updated Vendor profile (${vendorId}) with Hotels category & starting price ₹1,700.`);
  }

  // 5. Clean up old/generic test rooms for this hotel
  await Room.deleteMany({ hotel: { $in: skyViewItems.map((i) => i._id) } });
  console.log("Cleared old test rooms for Sky View.");

  // 6. Define the 4 authentic rooms based on the items
  const roomsData = [
    {
      hotel: masterItem._id,
      vendor: vendorId,
      name: "Semi Deluxe Room",
      roomType: "Standard Room",
      pricePerNight: 1700,
      availableRooms: 6,
      maxGuests: 2,
      bedType: "1 Queen Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "Free Wi-Fi",
        "Attached Private Bathroom",
        "Queen Bed",
        "24x7 Hot Water / Geyser",
        "Flat-screen TV",
        "Room Service",
        "Daily Housekeeping",
      ],
      description:
        "Semi Deluxe Room at Hotel Sky View offers a comfortable stay with a Queen Bed, private bathroom, air conditioning, TV, work desk, in-room dining, housekeeping, and essential modern amenities.",
      images: [cldPhoto],
      active: true,
    },
    {
      hotel: masterItem._id,
      vendor: vendorId,
      name: "Deluxe Room",
      roomType: "Deluxe Room",
      pricePerNight: 1900,
      availableRooms: 8,
      maxGuests: 2,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "High-Speed Wi-Fi",
        "Attached Private Bathroom",
        "King Size Bed",
        "24x7 Hot Water / Geyser",
        "Flat-screen TV",
        "In-room Dining",
        "Daily Housekeeping",
        "Electric Kettle / Tea Maker",
      ],
      description:
        "Deluxe Room at Hotel Sky View offers a spacious and comfortable stay with a plush King Bed, private bathroom, air conditioning, TV, work desk, in-room dining, housekeeping, and premium amenities.",
      images: [cldPhoto],
      active: true,
    },
    {
      hotel: masterItem._id,
      vendor: vendorId,
      name: "Super Deluxe Room",
      roomType: "Deluxe Room",
      pricePerNight: 2100,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "High-Speed Wi-Fi",
        "Attached Private Bathroom",
        "King Size Bed",
        "24x7 Hot Water / Geyser",
        "Smart TV",
        "Mini Bar / Refrigerator",
        "Balcony / City View",
        "Room Service",
        "Daily Housekeeping",
      ],
      description:
        "Super Deluxe Room at The Hotel Sky View offers premium comfort, welcoming ambience, city view, extra space, and top-tier amenities for a luxury stay.",
      images: [cldPhoto],
      active: true,
    },
    {
      hotel: masterItem._id,
      vendor: vendorId,
      name: "Superior Room",
      roomType: "Executive Suite",
      pricePerNight: 2800,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 King Bed + 1 Single Bed",
      numberOfBeds: 2,
      facilities: [
        "Air Conditioning (AC)",
        "High-Speed Wi-Fi",
        "Attached Luxury Bathroom",
        "King Bed + Extra Bed",
        "24x7 Hot Water / Geyser",
        "Smart TV",
        "Mini Bar / Refrigerator",
        "Balcony / City View",
        "Free Breakfast",
        "Priority Room Service",
      ],
      description:
        "Superior Room at The Hotel Sky View offers executive-level luxury, spacious seating area, ideal for business travellers and families seeking exceptional comfort.",
      images: [cldPhoto],
      active: true,
    },
  ];

  const createdRooms = await Room.insertMany(roomsData);
  console.log(`\nSuccessfully created ${createdRooms.length} room types under "${masterItem.title}":`);
  createdRooms.forEach((r, idx) => {
    console.log(`  [${idx + 1}] "${r.name}" (${r.roomType}) - ₹${r.pricePerNight}/night`);
  });

  // 7. Migrate any bookings referencing duplicate IDs to masterItem
  if (duplicateIds.length > 0) {
    const bookingUpdate = await Booking.updateMany(
      { item: { $in: duplicateIds } },
      { $set: { item: masterItem._id } }
    );
    console.log(`Migrated ${bookingUpdate.modifiedCount} bookings to master hotel.`);

    // 8. Delete duplicate hotel items
    const deleteResult = await Item.deleteMany({ _id: { $in: duplicateIds } });
    console.log(`Deleted ${deleteResult.deletedCount} duplicate items from MongoDB.`);
  }

  console.log("\n==================================================");
  console.log("  HOTEL SKY VIEW CONSOLIDATION COMPLETE! ");
  console.log("==================================================");
  process.exit(0);
}

consolidateSkyView().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
