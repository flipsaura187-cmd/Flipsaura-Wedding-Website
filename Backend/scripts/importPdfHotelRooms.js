import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";
import Room from "../models/Room.js";

/**
 * Uploads a local file to Cloudinary in the flipsaura/rooms folder.
 */
async function uploadToCloudinary(filePath, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials");
  }

  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).replace(".", "").toLowerCase() || "jpeg";
  const mime = ext === "jpg" ? "jpeg" : ext;
  const dataUri = `data:image/${mime};base64,${buf.toString("base64")}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "flipsaura/rooms";
  const params = {
    folder,
    public_id: publicId,
    timestamp,
  };

  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  const body = new URLSearchParams();
  body.append("file", dataUri);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);
  body.append("public_id", publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || `Cloudinary upload failed for ${publicId}`);
  }

  return data.secure_url;
}

async function main() {
  console.log("================================================================================");
  console.log("🏨 IMPORTING PDF ROOM DETAILS & SYNCING HOTEL ROOM IMAGES TO CLOUDINARY");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected successfully.\n");

  const baseImageDir = path.resolve("./hotel_images");

  // Step 1: Upload images from each folder to Cloudinary and map them
  console.log("--- 1. UPLOADING LOCAL ROOM IMAGES TO CLOUDINARY ---");
  const folderImageMap = {};

  const foldersToUpload = [
    "hotel-saraswati-inn",
    "gargee-surya-vihar",
    "hotel-us-residency",
    "amit-rest-house",
    "hotel-rinkesh-grand",
    "janakpuri-resort",
    "hotel-raj-residency",
    "heaven-resort",
    "heavenResort",
    "haweli-resort",
    "mehandi-resort",
  ];

  for (const folderName of foldersToUpload) {
    const dirPath = path.join(baseImageDir, folderName);
    if (!fs.existsSync(dirPath)) {
      console.warn(`  ⚠️ Folder not found: ${dirPath}`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(ext);
    });

    folderImageMap[folderName] = [];
    console.log(`📁 Processing ${folderName} (${files.length} images)...`);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const cleanBase = path.basename(file, path.extname(file));
      const publicId = `${folderName}_${cleanBase}_${Date.now()}`;

      try {
        const url = await uploadToCloudinary(filePath, publicId);
        folderImageMap[folderName].push(url);
        console.log(`  ✓ Uploaded ${file} -> ${url}`);
      } catch (err) {
        console.error(`  ❌ Error uploading ${file}:`, err.message);
      }
    }
  }

  console.log("\n--- 2. LOCATING HOTEL ITEMS & VENDORS ---");

  // 1. Hotel Saraswati Inn
  const saraswatiItem = await Item.findById("6ad4861d43c3b607c03f6a8b");
  console.log(`✓ Saraswati Inn: ${saraswatiItem?.title} (ID: ${saraswatiItem?._id})`);

  // 2. Gargee Surya Vihar
  const gargeeItem = await Item.findById("6ad45ad0ea2b47b2212768c9");
  console.log(`✓ Gargee Surya Vihar: ${gargeeItem?.title} (ID: ${gargeeItem?._id})`);

  // 3. Hotel US Residency
  const usResidencyItem = await Item.findById("6ad4861c43c3b607c03f6a81");
  console.log(`✓ Hotel US Residency: ${usResidencyItem?.title} (ID: ${usResidencyItem?._id})`);

  // 4. Amit Rest House
  const amitItem = await Item.findById("6ad4862043c3b607c03f6b34");
  console.log(`✓ Amit Rest House: ${amitItem?.title} (ID: ${amitItem?._id})`);

  // 5. Hotel Rinkesh Grand
  const rinkeshItem = await Item.findById("6ad4861f43c3b607c03f6afd");
  console.log(`✓ Hotel Rinkesh Grand: ${rinkeshItem?.title} (ID: ${rinkeshItem?._id})`);

  // 6. Janakpuri Resort
  const janakpuriItem = await Item.findById("6ad4862143c3b607c03f6b64");
  console.log(`✓ Janakpuri Palace/Resort: ${janakpuriItem?.title} (ID: ${janakpuriItem?._id})`);

  // 7. Raj Residency
  const rajItem = await Item.findById("6ad45acfea2b47b2212768b3");
  console.log(`✓ Raj Residency: ${rajItem?.title} (ID: ${rajItem?._id})`);

  // 8. The Haweli Resorts
  let haweliItem = await Item.findOne({ title: { $regex: /haweli/i } });
  let haweliVendor = await User.findOne({
    $or: [{ name: { $regex: /haweli/i } }, { "vendorProfile.businessName": { $regex: /haweli/i } }],
  });

  const hotelCategory = await Category.findOne({ slug: "hotels" });

  if (!haweliVendor) {
    haweliVendor = await User.create({
      name: "The Haweli Resorts",
      email: "thehaweliresorts@flipsaura.com",
      passwordHash: "hash123",
      role: "vendor",
      vendorProfile: {
        businessName: "The Haweli Resorts",
        ownerName: "The Haweli Resorts",
        vendorType: "Business",
        city: "Aurangabad",
        state: "Bihar",
        approved: true,
        verificationStatus: "approved",
      },
    });
    console.log(`✓ Created Vendor for The Haweli Resorts: ${haweliVendor._id}`);
  }

  if (!haweliItem) {
    const haweliImg =
      "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792763760/flipsaura/hotels/hotel_the_haweli_resorts_1792763758640.jpg";

    haweliItem = await Item.create({
      title: "The Haweli Resorts – Hotel Accommodation",
      slug: "the-haweli-resorts-hotel-accommodation",
      category: hotelCategory?._id,
      vendor: haweliVendor._id,
      about: "Serene countryside resort destination featuring luxury air-conditioned accommodations, verdant surroundings, and world-class hospitality.",
      description: "The Haweli Resorts provides a peaceful countryside retreat with modern Deluxe AC rooms, complimentary Wi-Fi, 24x7 room service, and stunning open views.",
      city: "Aurangabad",
      state: "Bihar",
      price: 3649,
      images: [haweliImg],
      active: true,
    });
    console.log(`✓ Created Hotel Item for The Haweli Resorts: ${haweliItem._id}`);
  } else {
    console.log(`✓ Existing Haweli Resorts Item: ${haweliItem._id}`);
  }

  console.log("\n--- 3. REMOVING OLD DUMMY ROOMS FOR THESE SPECIFIC HOTELS ---");
  const targetHotelIds = [
    saraswatiItem._id,
    gargeeItem._id,
    usResidencyItem._id,
    amitItem._id,
    rinkeshItem._id,
    janakpuriItem._id,
    rajItem._id,
    haweliItem._id,
  ];

  const delResult = await Room.deleteMany({ hotel: { $in: targetHotelIds } });
  console.log(`✓ Cleared ${delResult.deletedCount} old dummy rooms.\n`);

  console.log("--- 4. INSERTING ALL 17 OFFICIAL ROOMS FROM PDF ---");

  // Helper to safely pick image
  const getImg = (folder, index, fallbackUrl) => {
    const list = folderImageMap[folder] || [];
    return list[index] || list[0] || fallbackUrl || "/images/categories/hotels.jpg";
  };

  const roomsToInsert = [
    // -------------------------------------------------------------------------
    // HOTEL SARASWATI INN (3 Rooms)
    // -------------------------------------------------------------------------
    {
      hotel: saraswatiItem._id,
      vendor: saraswatiItem.vendor,
      name: "Suite Room (Breakfast Included)",
      roomType: "Suite Room",
      pricePerNight: 6039,
      availableRooms: 4,
      maxGuests: 4,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "City View",
        "Complimentary Breakfast",
        "In-Room Dining",
        "Iron / Ironing Board",
        "Attached Bathroom",
        "Laundry Service",
        "Daily Housekeeping",
        "Free Cancellation Till Check-in",
      ],
      description: "Expansive 200 sq ft (19 sq m) Suite Room with panoramic city view, luxury king bed accommodating up to 4 guests, and daily morning breakfast included.",
      images: [getImg("hotel-saraswati-inn", 0, saraswatiItem.images?.[0])],
      active: true,
    },
    {
      hotel: saraswatiItem._id,
      vendor: saraswatiItem.vendor,
      name: "Suite Room (Room Only)",
      roomType: "Suite Room",
      pricePerNight: 5575,
      availableRooms: 5,
      maxGuests: 4,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "City View",
        "In-Room Dining",
        "Iron / Ironing Board",
        "Attached Bathroom",
        "Laundry Service",
        "Daily Housekeeping",
        "Free Cancellation Till Check-in",
      ],
      description: "Elegant 200 sq ft (19 sq m) Suite Room overlooking the city with king bedding, in-room dining, ironing facilities, and private bath.",
      images: [getImg("hotel-saraswati-inn", 1, saraswatiItem.images?.[0])],
      active: true,
    },
    {
      hotel: saraswatiItem._id,
      vendor: saraswatiItem.vendor,
      name: "Suite Room (Breakfast + Lunch / Dinner)",
      roomType: "Suite Room",
      pricePerNight: 6968,
      availableRooms: 3,
      maxGuests: 4,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "City View",
        "Breakfast + Lunch/Dinner Included",
        "In-Room Dining",
        "Iron / Ironing Board",
        "Attached Bathroom",
        "Laundry Service",
        "Daily Housekeeping",
        "Free Cancellation Till Check-in",
      ],
      description: "All-inclusive 200 sq ft (19 sq m) Suite Room featuring city vistas, king-size bed, complete housekeeping, and daily breakfast plus lunch or dinner.",
      images: [getImg("hotel-saraswati-inn", 2, saraswatiItem.images?.[0])],
      active: true,
    },

    // -------------------------------------------------------------------------
    // GARGEE SURYA VIHAR (2 Rooms)
    // -------------------------------------------------------------------------
    {
      hotel: gargeeItem._id,
      vendor: gargeeItem.vendor,
      name: "Resort Cottage (Buffet Breakfast Included)",
      roomType: "Cottage",
      pricePerNight: 5281,
      availableRooms: 6,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Garden View",
        "Complimentary Buffet Breakfast",
        "Dedicated Living & Seating Area",
        "Coffee / Tea Machine",
        "Bathroom Phone",
        "Shower Cap & Toiletries",
        "Multiple Charging Points",
        "Free Cancellation Till Check-in",
      ],
      description: "Luxurious 450 sq ft (42 sq m) private resort cottage with serene garden view, living area, gourmet coffee machine, and full buffet breakfast spread.",
      images: [
        getImg("gargee-surya-vihar", 0, gargeeItem.images?.[0]),
        getImg("gargee-surya-vihar", 1, gargeeItem.images?.[0]),
      ],
      active: true,
    },
    {
      hotel: gargeeItem._id,
      vendor: gargeeItem.vendor,
      name: "Resort Cottage (Room Only)",
      roomType: "Cottage",
      pricePerNight: 4809,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Garden View",
        "Dedicated Living & Seating Area",
        "Coffee / Tea Machine",
        "Bathroom Phone",
        "Shower Cap & Toiletries",
        "Multiple Charging Points",
        "Free Cancellation Till Check-in",
      ],
      description: "Peaceful 450 sq ft (42 sq m) cottage set amid lush landscaped gardens, featuring king bedding, cozy seating area, and modern charging points.",
      images: [
        getImg("gargee-surya-vihar", 2, gargeeItem.images?.[0]),
        getImg("gargee-surya-vihar", 0, gargeeItem.images?.[0]),
      ],
      active: true,
    },

    // -------------------------------------------------------------------------
    // HOTEL US RESIDENCY (4 Rooms)
    // -------------------------------------------------------------------------
    {
      hotel: usResidencyItem._id,
      vendor: usResidencyItem.vendor,
      name: "Deluxe Non-AC Room With Cooler (Room Only)",
      roomType: "Deluxe Room",
      pricePerNight: 1050,
      availableRooms: 6,
      maxGuests: 3,
      bedType: "1 Double Bed or 2 Single Beds",
      numberOfBeds: 1,
      facilities: [
        "Room Air Cooler",
        "Study Room / Work Desk",
        "Smoking Room Option",
        "In-Room Dining",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Mineral Water Available",
        "Free Cancellation Till Check-in",
      ],
      description: "180 sq ft (17 sq m) comfortable room equipped with air cooler, work desk, in-room dining, and choice of double bed or twin single beds.",
      images: [getImg("hotel-us-residency", 0, usResidencyItem.images?.[0])],
      active: true,
    },
    {
      hotel: usResidencyItem._id,
      vendor: usResidencyItem.vendor,
      name: "Deluxe Non-AC Room With Cooler (Breakfast Included)",
      roomType: "Deluxe Room",
      pricePerNight: 1350,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 Double Bed or 2 Single Beds",
      numberOfBeds: 1,
      facilities: [
        "Room Air Cooler",
        "Complimentary Breakfast (Fixed Menu)",
        "Study Room / Work Desk",
        "Smoking Room Option",
        "In-Room Dining",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Free Cancellation Till Check-in",
      ],
      description: "180 sq ft (17 sq m) cooler room including hot fixed-menu breakfast every morning, study desk, and 24x7 room service.",
      images: [getImg("hotel-us-residency", 1, usResidencyItem.images?.[0])],
      active: true,
    },
    {
      hotel: usResidencyItem._id,
      vendor: usResidencyItem.vendor,
      name: "Deluxe AC Room (Room Only)",
      roomType: "Deluxe Room",
      pricePerNight: 1300,
      availableRooms: 7,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "City View",
        "High-Speed Free Wi-Fi",
        "24-Hour Room Service",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Mineral Water Available",
        "Free Cancellation Till Check-in",
      ],
      description: "120 sq ft (11 sq m) Deluxe AC room offering city view, king bed, high-speed Wi-Fi, and 24-hour room service.",
      images: [getImg("hotel-us-residency", 2, usResidencyItem.images?.[0])],
      active: true,
    },
    {
      hotel: usResidencyItem._id,
      vendor: usResidencyItem.vendor,
      name: "Deluxe AC Room (Breakfast Included)",
      roomType: "Deluxe Room",
      pricePerNight: 1500,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "City View",
        "Complimentary Breakfast (Fixed Menu)",
        "High-Speed Free Wi-Fi",
        "24-Hour Room Service",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Free Cancellation Till Check-in",
      ],
      description: "Deluxe air-conditioned 120 sq ft (11 sq m) room with city view, king bed, and complimentary fixed-menu breakfast.",
      images: [getImg("hotel-us-residency", 2, usResidencyItem.images?.[0])],
      active: true,
    },

    // -------------------------------------------------------------------------
    // AMIT REST HOUSE (2 Rooms)
    // -------------------------------------------------------------------------
    {
      hotel: amitItem._id,
      vendor: amitItem.vendor,
      name: "Standard Room with Fan",
      roomType: "Standard Room",
      pricePerNight: 410,
      availableRooms: 8,
      maxGuests: 3,
      bedType: "1 Double Bed",
      numberOfBeds: 1,
      facilities: [
        "Ceiling Fan",
        "Closet & Wardrobe",
        "Seating Area",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Room Service",
        "Mineral Water Available",
        "Free Cancellation Till 24 Hrs Before Check-in",
      ],
      description: "Budget-friendly and clean 120 sq ft (11 sq m) standard room with ceiling fan, comfortable double bed, seating, and closet.",
      images: [getImg("amit-rest-house", 0, amitItem.images?.[0])],
      active: true,
    },
    {
      hotel: amitItem._id,
      vendor: amitItem.vendor,
      name: "Standard AC Room",
      roomType: "Standard Room",
      pricePerNight: 1150,
      availableRooms: 6,
      maxGuests: 3,
      bedType: "1 Double Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "Comfortable Sofa Seating",
        "Mobile & Laptop Charging Points",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Room Service",
        "Mineral Water Available",
        "Free Cancellation Till 24 Hrs Before Check-in",
      ],
      description: "144 sq ft (13 sq m) standard air-conditioned room featuring double bed, plush sofa, charging points, and prompt room service.",
      images: [getImg("amit-rest-house", 1, amitItem.images?.[0])],
      active: true,
    },

    // -------------------------------------------------------------------------
    // HOTEL RINKESH GRAND (3 Rooms)
    // -------------------------------------------------------------------------
    {
      hotel: rinkeshItem._id,
      vendor: rinkeshItem.vendor,
      name: "Deluxe Room",
      roomType: "Deluxe Room",
      pricePerNight: 1718,
      availableRooms: 5,
      maxGuests: 2,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "Study Room / Desk",
        "Smoking Room Option",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Mineral Water Available",
        "Free Cancellation Till Check-in",
      ],
      description: "120 sq ft (11 sq m) Deluxe AC room equipped with king bed, study desk, private bathroom, and daily housekeeping.",
      images: [getImg("hotel-rinkesh-grand", 0, rinkeshItem.images?.[0])],
      active: true,
    },
    {
      hotel: rinkeshItem._id,
      vendor: rinkeshItem.vendor,
      name: "Super Deluxe Room",
      roomType: "Super Deluxe Room",
      pricePerNight: 2141,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "City View",
        "High-Speed Wi-Fi",
        "Electric Kettle / Tea Maker",
        "Iron & Ironing Board",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Free Cancellation Till Check-in",
      ],
      description: "Spacious 160 sq ft (15 sq m) Super Deluxe room with expansive city view, high-speed Wi-Fi, electric kettle, and iron with board.",
      images: [getImg("hotel-rinkesh-grand", 1, rinkeshItem.images?.[0])],
      active: true,
    },
    {
      hotel: rinkeshItem._id,
      vendor: rinkeshItem.vendor,
      name: "Executive Room (Breakfast Included)",
      roomType: "Executive Room",
      pricePerNight: 2219,
      availableRooms: 3,
      maxGuests: 2,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "City View",
        "Complimentary Breakfast",
        "Interconnected Room Option",
        "In-Room Dining",
        "Smoking Room Option",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Free Cancellation Till Check-in",
      ],
      description: "Executive 160 sq ft (15 sq m) luxury room offering panoramic city view, interconnected room facility, and complimentary morning breakfast.",
      images: [getImg("hotel-rinkesh-grand", 2, rinkeshItem.images?.[0])],
      active: true,
    },

    // -------------------------------------------------------------------------
    // JANAKPURI RESORT (1 Room)
    // -------------------------------------------------------------------------
    {
      hotel: janakpuriItem._id,
      vendor: janakpuriItem.vendor,
      name: "Deluxe AC Room (Countryside View)",
      roomType: "Deluxe Room",
      pricePerNight: 1311,
      availableRooms: 8,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "Countryside View",
        "Flat-screen LED TV",
        "24x7 Hot & Cold Water",
        "Complimentary Toiletries",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Free Cancellation Till Check-in",
      ],
      description: "140 sq ft (13 sq m) Deluxe room with tranquil countryside view, king bed, flat-screen television, and continuous geyser hot water.",
      images: [getImg("janakpuri-resort", 0, janakpuriItem.images?.[0])],
      active: true,
    },

    // -------------------------------------------------------------------------
    // RAJ RESIDENCY (1 Room)
    // -------------------------------------------------------------------------
    {
      hotel: rajItem._id,
      vendor: rajItem.vendor,
      name: "Deluxe Room",
      roomType: "Deluxe Room",
      pricePerNight: 1659,
      availableRooms: 6,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "Smoking Room Option",
        "In-Room Dining",
        "Attached Bathroom",
        "Daily Housekeeping",
        "Mineral Water Available",
        "Free Cancellation Till 24 Hrs Before Check-in",
      ],
      description: "120 sq ft (11 sq m) Deluxe AC room with premium king bedding, prompt in-room dining, and 24-hr hot water bathroom.",
      images: [getImg("hotel-raj-residency", 0, rajItem.images?.[0])],
      active: true,
    },

    // -------------------------------------------------------------------------
    // THE HAWELI RESORTS (1 Room)
    // -------------------------------------------------------------------------
    {
      hotel: haweliItem._id,
      vendor: haweliItem.vendor,
      name: "Deluxe AC (Countryside View)",
      roomType: "Deluxe Room",
      pricePerNight: 3649,
      availableRooms: 5,
      maxGuests: 2,
      bedType: "1 King Bed",
      numberOfBeds: 1,
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
      images: [
        getImg("haweli-resort", 0, haweliItem.images?.[0]),
      ],
      active: true,
    },
  ];

  for (const r of roomsToInsert) {
    const createdRoom = await Room.create(r);
    console.log(`  ✓ Inserted [${createdRoom._id}] "${createdRoom.name}" at Hotel: ${createdRoom.hotel} (₹${createdRoom.pricePerNight})`);
  }

  console.log(`\n✅ Successfully inserted all ${roomsToInsert.length} official PDF rooms!`);

  // Update base prices on hotel items to reflect lowest room rates
  await Item.updateOne({ _id: saraswatiItem._id }, { $set: { price: 5575 } });
  await Item.updateOne({ _id: gargeeItem._id }, { $set: { price: 4809 } });
  await Item.updateOne({ _id: usResidencyItem._id }, { $set: { price: 1050 } });
  await Item.updateOne({ _id: amitItem._id }, { $set: { price: 410 } });
  await Item.updateOne({ _id: rinkeshItem._id }, { $set: { price: 1718 } });
  await Item.updateOne({ _id: janakpuriItem._id }, { $set: { price: 1311 } });
  await Item.updateOne({ _id: rajItem._id }, { $set: { price: 1659 } });
  await Item.updateOne({ _id: haweliItem._id }, { $set: { price: 3649 } });
  console.log("✓ Updated starting prices for all 8 hotels.");

  console.log("\n================================================================================");
  console.log("🎉 ALL HOTEL ROOMS SUCCESSFULLY IMPORTED AND DISPLAYED!");
  console.log("================================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
