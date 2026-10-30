import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";
import User from "../models/User.js";

const SAMPLE_VENUES = [
  {
    title: "Rajwada Grand Banquet Hall",
    venueType: "Banquet Halls",
    locality: "Bailey Road",
    city: "Patna",
    state: "Bihar",
    contactPhone: "+91 98350 11223",
    contactEmail: "rajwada.banquet@flipsaura.local",
    rentalPrice: 85000,
    pricePerPlateVeg: 650,
    pricePerPlateNonVeg: 850,
    guestCapacity: 600,
    seatingCapacity: 350,
    floatingCapacity: 800,
    roomCount: 8,
    spaceTypes: ["Indoor"],
    venueFeatures: [
      "In-House Catering Available",
      "Outside Catering Allowed",
      "Central Air Conditioning (AC)",
      "24/7 Power Backup Generator",
      "Valet Parking Available",
      "Bridal Dressing Room Available",
      "DJ & Sound System Allowed",
      "Hawan & Fire Rituals Permitted",
      "Baraat Allowed with Band",
      "Overnight Wedding Allowed",
    ],
    about: "A luxurious air-conditioned banquet hall on Bailey Road with pillarless architecture, crystal chandeliers, and dedicated bridal rooms.",
    description: "Rajwada Grand Banquet Hall is equipped with modern acoustics, centralized cooling, spacious pre-function foyer, and a sprawling parking lot for over 150 vehicles. Custom catering packages and decorative mandap setups available.",
    rating: 4.8,
    reviewsCount: 38,
    images: [
      "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_venues.png",
      "/images/categories/venues.jpg",
    ],
    featured: true,
  },
  {
    title: "Shahi Utsav Marriage Garden & Lawn",
    venueType: "Marriage Garden / Lawns",
    locality: "Old GT Road",
    city: "Daudnagar",
    state: "Bihar",
    contactPhone: "+91 94312 33445",
    contactEmail: "shahi.utsav@flipsaura.local",
    rentalPrice: 65000,
    pricePerPlateVeg: 550,
    pricePerPlateNonVeg: 750,
    guestCapacity: 1200,
    seatingCapacity: 600,
    floatingCapacity: 1500,
    roomCount: 12,
    spaceTypes: ["Outdoor", "Indoor"],
    venueFeatures: [
      "In-House Catering Available",
      "Outside Catering Allowed",
      "24/7 Power Backup Generator",
      "Valet Parking Available",
      "Bridal Dressing Room Available",
      "DJ & Sound System Allowed",
      "Hawan & Fire Rituals Permitted",
      "Baraat Allowed with Band",
      "Overnight Wedding Allowed",
      "Firecrackers Permitted",
    ],
    about: "Sprawling 25,000 sq.ft lush green wedding lawn in Daudnagar with natural foliage, magnificent stage setups, and AC changing rooms.",
    description: "Shahi Utsav Marriage Garden offers open-air starlit receptions with traditional and modern themes, baraat welcoming path, extensive buffet counters, and parking space for 200+ cars.",
    rating: 4.7,
    reviewsCount: 29,
    images: [
      "/images/categories/venues.jpg",
      "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_venues.png",
    ],
    featured: true,
  },
  {
    title: "Heritage Palace & Wedding Resort",
    venueType: "Wedding Resorts",
    locality: "NH-19 Bypass",
    city: "Aurangabad",
    state: "Bihar",
    contactPhone: "+91 97712 55667",
    contactEmail: "heritage.resort@flipsaura.local",
    rentalPrice: 150000,
    pricePerPlateVeg: 800,
    pricePerPlateNonVeg: 1100,
    guestCapacity: 1500,
    seatingCapacity: 750,
    floatingCapacity: 2000,
    roomCount: 25,
    spaceTypes: ["Indoor", "Outdoor", "Poolside"],
    venueFeatures: [
      "In-House Catering Available",
      "Central Air Conditioning (AC)",
      "24/7 Power Backup Generator",
      "Valet Parking Available",
      "Bridal Dressing Room Available",
      "DJ & Sound System Allowed",
      "Alcohol License Allowed",
      "Hawan & Fire Rituals Permitted",
      "Baraat Allowed with Band",
      "Overnight Wedding Allowed",
    ],
    about: "A royal destination wedding resort in Aurangabad with 25 boutique guest stay rooms, poolside sangeet deck, and banquet lawn.",
    description: "Heritage Palace Resort provides complete end-to-end wedding stays with luxury suites, multiple event venues (poolside haldi, indoor sangeet, lawn reception), and multi-cuisine catering.",
    rating: 4.9,
    reviewsCount: 52,
    images: [
      "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_venues.png",
      "/images/categories/venues.jpg",
    ],
    featured: true,
  },
  {
    title: "Milan Utsav Party Hall",
    venueType: "Small Function / Party Halls",
    locality: "Bodh Gaya Road",
    city: "Gaya",
    state: "Bihar",
    contactPhone: "+91 91234 77889",
    contactEmail: "milan.partyhall@flipsaura.local",
    rentalPrice: 35000,
    pricePerPlateVeg: 450,
    pricePerPlateNonVeg: 650,
    guestCapacity: 200,
    seatingCapacity: 120,
    floatingCapacity: 250,
    roomCount: 4,
    spaceTypes: ["Indoor"],
    venueFeatures: [
      "In-House Catering Available",
      "Outside Catering Allowed",
      "Central Air Conditioning (AC)",
      "24/7 Power Backup Generator",
      "Bridal Dressing Room Available",
      "DJ & Sound System Allowed",
    ],
    about: "An intimate and elegant hall ideal for Haldi, Mehndi, Roka, Engagement, and family functions in Gaya.",
    description: "Milan Utsav Hall offers cozy seating, beautiful backdrop lighting, clean air conditioning, and convenient central location with easy access for guests.",
    rating: 4.6,
    reviewsCount: 18,
    images: [
      "/images/categories/venues.jpg",
    ],
    featured: false,
  },
];

async function seed() {
  await dbConnect();
  console.log("Connected to MongoDB.");

  // Locate or create category
  let cat = await Category.findOne({ slug: "venues" });
  if (!cat) {
    cat = await Category.create({
      name: "Venue/Resorts",
      slug: "venues",
      description: "Banquet halls, hotels, marriage lawns, resorts, and community halls for weddings and events.",
      image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_venues.png",
      order: 1,
      active: true,
    });
    console.log("Created category 'Venue/Resorts'.");
  }

  for (const v of SAMPLE_VENUES) {
    const existing = await Item.findOne({ title: v.title });
    if (!existing) {
      // Find or create dummy vendor
      let vendor = await User.findOne({ email: v.contactEmail });
      if (!vendor) {
        vendor = await User.create({
          name: v.title,
          email: v.contactEmail,
          phone: v.contactPhone,
          passwordHash: await User.hashPassword("Flipsaura@Venue2026"),
          role: "vendor",
          vendorProfile: {
            businessName: v.title,
            ownerName: v.title,
            city: v.city,
            state: v.state,
            address: `${v.locality}, ${v.city}`,
            approved: true,
            verificationStatus: "approved",
            startingPrice: v.rentalPrice,
            categories: [cat._id],
          },
        });
      }

      await Item.create({
        ...v,
        category: cat._id,
        vendor: vendor._id,
        price: v.rentalPrice,
        capacity: v.guestCapacity,
        facilities: v.venueFeatures.map((f) => ({ group: "Popular Amenities", name: f, highlight: true })),
        active: true,
      });
      console.log(`Seeded venue: ${v.title}`);
    } else {
      console.log(`Venue already exists: ${v.title}`);
    }
  }

  console.log("Venue seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});

