import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";

export async function seedVehicles() {
  await dbConnect();
  console.log("Seeding sample vehicles...");

  // Find or create a verified vendor to act as the sample vehicle provider
  let provider = await User.findOne({ role: { $in: ["vendor", "admin"] } });
  if (!provider) {
    provider = await User.findOne({});
  }

  if (!provider) {
    console.error("No user found in database to associate vehicles with.");
    return;
  }

  const sampleVehicles = [
    {
      name: "Mahindra Thar 4x4 Luxury Hardtop",
      brand: "Mahindra",
      model: "Thar 4x4",
      vehicleType: "four_wheeler",
      supportedServices: ["rental", "transport"],
      registrationNumber: "BR 01 CA 8899",
      seatingCapacity: 4,
      fuelType: "diesel",
      transmission: "automatic",
      images: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop",
      ],
      description: "Iconic red Mahindra Thar 4x4 Hardtop. Perfect for grand groom wedding entry, pre-wedding photoshoot, and self-drive celebrations.",
      features: ["Convertible / Hardtop Style", "4x4 Drive", "Apple CarPlay & Android Auto", "Touchscreen Display", "Airbags"],
      city: "Patna",
      pickupLocation: "Bailey Road, Patna",
      serviceArea: "Patna, Danapur, Hajipur & surrounding regions",
      rentalPricing: {
        pricePerHour: 800,
        pricePerDay: 5500,
        minDurationHours: 4,
        maxDurationDays: 14,
        securityDeposit: 5000,
        includedKmPerDay: 250,
        extraKmRate: 18,
        rentalTerms: "Valid driving license required for self-drive. Zero alcohol tolerance. Fastag charges as per actuals.",
      },
      transportPricing: {
        pricingType: "fixed",
        baseTripPrice: 4500,
        perKmRate: 20,
        driverAllowance: 500,
        transportNotes: "Includes verified uniformed chauffeur for groom entry & Barat procession.",
      },
      availabilityStatus: "available",
      verificationStatus: "verified",
      active: true,
      featured: true,
      rating: 4.9,
      reviewsCount: 18,
    },
    {
      name: "Toyota Innova Crysta ZX Luxury 7-Seater",
      brand: "Toyota",
      model: "Innova Crysta",
      vehicleType: "car",
      supportedServices: ["rental", "transport"],
      registrationNumber: "BR 01 EA 4521",
      seatingCapacity: 7,
      fuelType: "diesel",
      transmission: "automatic",
      images: [
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200&auto=format&fit=crop",
      ],
      description: "The gold standard of Indian wedding family transport. Captain seats, plush leather interiors, rear AC vents, and ultra-smooth ride.",
      features: ["Captain Seats", "Tri-Zone Climate Control", "Spacious Boot Space", "Roof Ambient Lighting", "Rear Reclining Seats"],
      city: "Patna",
      pickupLocation: "Patna Airport / Kankarbagh",
      serviceArea: "Entire Bihar & Outstation",
      rentalPricing: {
        pricePerHour: 600,
        pricePerDay: 4200,
        minDurationHours: 4,
        maxDurationDays: 30,
        securityDeposit: 4000,
        includedKmPerDay: 250,
        extraKmRate: 15,
        rentalTerms: "Available for self-drive with ID proof or with seasoned professional driver.",
      },
      transportPricing: {
        pricingType: "fixed",
        baseTripPrice: 3800,
        perKmRate: 18,
        driverAllowance: 400,
        transportNotes: "Ideal for airport guest pickup/drop, VIP family transit, and Barat travel.",
      },
      availabilityStatus: "available",
      verificationStatus: "verified",
      active: true,
      featured: true,
      rating: 4.8,
      reviewsCount: 34,
    },
    {
      name: "Bajaj RE Grand Passenger Auto Rickshaw",
      brand: "Bajaj",
      model: "RE Compact",
      vehicleType: "auto",
      supportedServices: ["rental", "transport"],
      registrationNumber: "BR 01 T 9921",
      seatingCapacity: 3,
      fuelType: "cng",
      transmission: "manual",
      images: [
        "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=1200&auto=format&fit=crop",
      ],
      description: "Decorated vibrant wedding auto-rickshaw for quirky mehndi entries, local photo shoots, and city guest shuttles.",
      features: ["Traditional Floral Decor Ready", "Music Player", "Luggage Carrier", "Rain Curtains"],
      city: "Patna",
      pickupLocation: "Boring Road, Patna",
      serviceArea: "Patna City (15 km radius)",
      rentalPricing: {
        pricePerHour: 250,
        pricePerDay: 1800,
        minDurationHours: 2,
        maxDurationDays: 3,
        securityDeposit: 1000,
        includedKmPerDay: 100,
        extraKmRate: 12,
        rentalTerms: "Self-drive requires commercial three-wheeler license, or comes with courteous driver.",
      },
      transportPricing: {
        pricingType: "fixed",
        baseTripPrice: 1200,
        perKmRate: 14,
        driverAllowance: 200,
        transportNotes: "Fun Haldi/Mehndi photo-op entry or local event shuttle.",
      },
      availabilityStatus: "available",
      verificationStatus: "verified",
      active: true,
      featured: false,
      rating: 4.7,
      reviewsCount: 12,
    },
    {
      name: "Volvo Luxury AC Coach 45-Seater Bus",
      brand: "Volvo",
      model: "B11R 9600 Multi-Axle",
      vehicleType: "bus",
      supportedServices: ["transport"],
      registrationNumber: "BR 01 B 7712",
      seatingCapacity: 45,
      fuelType: "diesel",
      transmission: "automatic",
      images: [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop",
      ],
      description: "Grand Barat luxury AC coach bus. Pushback ergonomic seats, chilled air conditioning, massive luggage compartment, and PA sound system.",
      features: ["45 Pushback Seats", "Dual AC", "Public Address & Microphone System", "Charging Ports at Every Seat", "Luggage Hold"],
      city: "Patna",
      pickupLocation: "Patna Bypass / Transport Nagar",
      serviceArea: "All India Interstate & Intercity",
      rentalPricing: {
        pricePerHour: 0,
        pricePerDay: 0,
        minDurationHours: 8,
        maxDurationDays: 7,
        securityDeposit: 0,
        includedKmPerDay: 0,
        extraKmRate: 0,
        rentalTerms: "Bus is provided strictly with 2 licensed commercial heavy vehicle drivers.",
      },
      transportPricing: {
        pricingType: "fixed",
        baseTripPrice: 18000,
        perKmRate: 45,
        driverAllowance: 1000,
        transportNotes: "Toll taxes & state border permits charged at actuals. 2 experienced chauffeurs included.",
      },
      availabilityStatus: "available",
      verificationStatus: "verified",
      active: true,
      featured: true,
      rating: 4.9,
      reviewsCount: 22,
    },
    {
      name: "Mercedes-Benz E-Class Luxury Wedding Sedan",
      brand: "Mercedes-Benz",
      model: "E-Class Exclusive",
      vehicleType: "car",
      supportedServices: ["rental", "transport"],
      registrationNumber: "DL 01 Z 1008",
      seatingCapacity: 4,
      fuelType: "diesel",
      transmission: "automatic",
      images: [
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop",
      ],
      description: "The ultimate bridal send-off & VVIP wedding arrival car. Panoramic sunroof, Burmester surround sound, and immaculate white finish.",
      features: ["Panoramic Sunroof", "Burmester Sound System", "Chauffeur Driven", "White Wedding Decor Ready", "Rear Entertainment"],
      city: "Patna",
      pickupLocation: "Maurya Hotel / Fraser Road",
      serviceArea: "Patna Metropolitan Area",
      rentalPricing: {
        pricePerHour: 1500,
        pricePerDay: 12000,
        minDurationHours: 4,
        maxDurationDays: 5,
        securityDeposit: 15000,
        includedKmPerDay: 150,
        extraKmRate: 35,
        rentalTerms: "Security deposit and identity verification required prior to delivery.",
      },
      transportPricing: {
        pricingType: "fixed",
        baseTripPrice: 9500,
        perKmRate: 35,
        driverAllowance: 800,
        transportNotes: "Includes red carpet treatment, floral front grill decor, and seasoned tuxedo driver.",
      },
      availabilityStatus: "available",
      verificationStatus: "verified",
      active: true,
      featured: true,
      rating: 5.0,
      reviewsCount: 15,
    },
  ];

  for (const item of sampleVehicles) {
    await Vehicle.findOneAndUpdate(
      { registrationNumber: item.registrationNumber },
      { $set: { ...item, owner: provider._id } },
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Successfully seeded ${sampleVehicles.length} sample vehicles!`);
  process.exit(0);
}

if (process.argv[1]?.endsWith("seedVehicles.js")) {
  seedVehicles().catch((err) => {
    console.error("❌ Failed to seed vehicles:", err);
    process.exit(1);
  });
}
