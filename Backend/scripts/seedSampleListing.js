import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Item from "../models/Item.js";

async function seedSampleListing() {
  await dbConnect();

  const hotelCat = await Category.findOne({ slug: { $in: ["hotels", "hotels-resorts"] } });
  if (!hotelCat) {
    console.error("Hotel category not found");
    process.exit(1);
  }

  // Find or create sample vendor
  let vendor = await User.findOne({ email: "royalheritage.vendor@example.com" });
  if (!vendor) {
    vendor = new User({
      name: "Rajeshwar Singh",
      email: "royalheritage.vendor@example.com",
      phone: "+91 98765 43210",
      passwordHash: await User.hashPassword("VendorPass123!"),
      role: "vendor",
    });
  }

  vendor.vendorProfile = {
    businessName: "The Royal Heritage Palace & Suites",
    ownerName: "Rajeshwar Singh",
    vendorType: "Business",
    address: "Palace Road, Civil Lines",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302006",
    about: "A 5-star premier heritage hotel providing bespoke wedding venues and hospitality.",
    serviceDescription: "Full hotel accommodations and banqueting for luxury royal weddings.",
    startingPrice: 18500,
    priceRange: "₹18,500 - ₹1,50,000 per night",
    serviceLocation: "Jaipur, Rajasthan",
    experience: "15+ Years in Luxury Hospitality",
    categories: [hotelCat._id],
    approved: true,
    verificationStatus: "approved",
    facilities: [
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Popular Amenities",
        name: "Free High-Speed Wi-Fi",
        highlight: true,
      },
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Food & Dining",
        name: "Multi-Cuisine Royal Restaurant",
        highlight: true,
      },
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Basic Facilities",
        name: "24/7 Power Backup Generator",
        highlight: true,
      },
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Popular Amenities",
        name: "Swimming Pool & Sun Deck",
        highlight: true,
      },
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Room & Venue Features",
        name: "Central Air Conditioned Rooms",
        highlight: true,
      },
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Basic Facilities",
        name: "Ample Valet Parking",
        highlight: false,
      },
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Services & Inclusions",
        name: "24-Hour Room Service",
        highlight: false,
      },
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Basic Facilities",
        name: "Elevator / Passenger Lift",
        highlight: false,
      },
      {
        category: hotelCat._id,
        categoryName: hotelCat.name,
        group: "Safety & Hygiene",
        name: "24-Hour Security & CCTV",
        highlight: false,
      },
    ],
  };

  await vendor.save();
  console.log(`✅ Vendor seeded/updated: ${vendor.vendorProfile.businessName}`);

  // Create or update item
  let item = await Item.findOne({ title: "The Royal Heritage Palace & Luxury Suites" });
  if (!item) {
    item = new Item({
      title: "The Royal Heritage Palace & Luxury Suites",
      slug: "royal-heritage-palace-suites",
      category: hotelCat._id,
      vendor: vendor._id,
      price: 18500,
      city: "Jaipur",
      contactPhone: "+91 98765 43210",
      contactEmail: "reservations@royalheritage.example.com",
      capacity: 500,
      rating: 4.9,
      reviewsCount: 38,
      about: "Experience world-class regal hospitality with modern luxuries, lush lawns, and royal heritage architecture.",
      description: "Located in the heart of Jaipur, The Royal Heritage Palace offers wedding parties and families luxury accommodations, lavish wedding feast banqueting, and impeccable 24/7 concierge service.",
      specifications: [
        { key: "Check-in / Check-out", value: "12:00 PM / 11:00 AM" },
        { key: "Room Inventory", value: "75 Heritage Luxury Rooms" },
        { key: "Event Capacity", value: "Up to 500 Wedding Guests" },
        { key: "Dining Facilities", value: "In-house Multi-cuisine Kitchen" },
      ],
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
      ],
      active: true,
      featured: true,
    });
  } else {
    item.vendor = vendor._id;
    item.category = hotelCat._id;
  }

  await item.save();
  console.log(`✅ Sample Item seeded: ${item.title}`);
  console.log(`ITEM_ID=${item._id}`);
  process.exit(0);
}

seedSampleListing().catch(console.error);
