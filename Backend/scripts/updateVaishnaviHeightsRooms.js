import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Room from "../models/Room.js";

async function uploadToCloudinary(filePath, folder, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials in .env");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).replace(".", "").toLowerCase() || "png";
  const mime = ext === "jpg" ? "jpeg" : ext;
  const dataUri = `data:image/${mime};base64,${buf.toString("base64")}`;

  const timestamp = Math.floor(Date.now() / 1000);
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

  console.log(`Uploading ${path.basename(filePath)} (${(buf.length / 1024).toFixed(1)} KB) to ${folder}/${publicId}...`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || `Cloudinary upload failed for ${publicId}`);
  }

  console.log(`✓ Uploaded: ${data.secure_url}`);
  return data.secure_url;
}

async function main() {
  console.log("================================================================================");
  console.log("🏨 UPDATING HOTEL VAISHNAVI HEIGHTS ROOMS FROM USER SCREENSHOT SPECIFICATIONS");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected.\n");

  // 1. Upload room images from hotel_images/hotel-vaishnavi-heights/
  const dir = path.resolve("./hotel_images/hotel-vaishnavi-heights");
  const timestamp = Date.now();

  const room1Url = await uploadToCloudinary(
    path.join(dir, "room1.png"),
    "flipsaura/rooms",
    `room_vaishnavi_heights_room1_${timestamp}`
  );

  const room2Url = await uploadToCloudinary(
    path.join(dir, "room2.png"),
    "flipsaura/rooms",
    `room_vaishnavi_heights_room2_${timestamp}`
  );

  // 2. Find Hotel Vaishnavi Heights Item
  const allItems = await Item.find({}).lean();
  const hotel = allItems.find(
    (i) =>
      i.title.toLowerCase().includes("vaishnavi") &&
      i.title.toLowerCase().includes("hotel")
  );

  if (!hotel) {
    throw new Error("Hotel Vaishnavi Heights item not found in DB!");
  }

  console.log(`\nFound Hotel: "${hotel.title}" (ID: ${hotel._id})`);

  // Update starting price for hotel to ₹1,599 ($19 base rate)
  const baseStartingPrice = 1599;
  await Item.updateOne(
    { _id: hotel._id },
    { $set: { price: baseStartingPrice } }
  );
  console.log(`✅ Updated Hotel starting price to ₹${baseStartingPrice}`);

  // 3. Remove old dummy rooms for Hotel Vaishnavi Heights
  const deleteResult = await Room.deleteMany({ hotel: hotel._id });
  console.log(`🗑️ Removed ${deleteResult.deletedCount} old room(s) for Hotel Vaishnavi Heights.`);

  // 4. Create new rooms matching screenshot:
  // - Category 1: Superior Room (115 sq.ft, Valley View, 1 Double Bed, Max 3 Guests)
  //   - Plan A: Room Only ($19 => ₹1,599)
  //   - Plan B: Room with Breakfast ($26 => ₹2,199)
  // - Category 2: Deluxe Room (120 sq.ft, Mountain/Hill View, 1 Double Bed, Max 3 Guests)
  //   - Plan A: Room Only ($24 => ₹1,999)
  //   - Plan B: Room with Breakfast ($30 => ₹2,499)
  // - Category 3: Club Room (140 sq.ft, 1 King Bed, Max 3 Guests)
  //   - Plan A: Room Only ($33 => ₹2,799)
  //   - Plan B: Room with Breakfast ($40 => ₹3,399)

  const roomsToCreate = [
    {
      hotel: hotel._id,
      vendor: hotel.vendor,
      name: "Superior Room",
      roomType: "Superior Room",
      pricePerNight: 1599,
      availableRooms: 6,
      maxGuests: 3,
      bedType: "1 Double Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "Valley View",
        "1 Double Bed",
        "Attached Bathroom",
        "Daily Housekeeping",
        "In-room Dining",
        "Laundry Service",
        "Mineral Water (Additional charge)",
        "Non-Refundable",
      ],
      description:
        "115 sq.ft (11 sq.mt) Superior Room with Valley View, Air Conditioning, 1 Double Bed, Attached Bathroom, Daily Housekeeping, In-room dining, and Laundry Service.",
      images: [room1Url, room2Url],
      active: true,
    },
    {
      hotel: hotel._id,
      vendor: hotel.vendor,
      name: "Superior Room (Breakfast Included)",
      roomType: "Superior Room",
      pricePerNight: 2199,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 Double Bed",
      numberOfBeds: 1,
      facilities: [
        "Complimentary Breakfast Included",
        "Air Conditioning (AC)",
        "Valley View",
        "1 Double Bed",
        "Attached Bathroom",
        "Daily Housekeeping",
        "In-room Dining",
        "Laundry Service",
        "Non-Refundable",
      ],
      description:
        "115 sq.ft (11 sq.mt) Superior Room with Free Breakfast included, Valley View, Air Conditioning, 1 Double Bed, Attached Bathroom, and Daily Housekeeping.",
      images: [room1Url, room2Url],
      active: true,
    },
    {
      hotel: hotel._id,
      vendor: hotel.vendor,
      name: "Deluxe Room",
      roomType: "Deluxe Room",
      pricePerNight: 1999,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 Double Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "Mountain / Hill View",
        "1 Double Bed",
        "Attached Bathroom",
        "Daily Housekeeping",
        "In-room Dining",
        "Laundry Service",
        "Mineral Water (Additional charge)",
        "Non-Refundable",
      ],
      description:
        "120 sq.ft (11 sq.mt) Deluxe Room with Mountain / Hill View, Air Conditioning, 1 Double Bed, Attached Bathroom, In-room Dining, and Daily Housekeeping.",
      images: [room2Url, room1Url],
      active: true,
    },
    {
      hotel: hotel._id,
      vendor: hotel.vendor,
      name: "Deluxe Room (Breakfast Included)",
      roomType: "Deluxe Room",
      pricePerNight: 2499,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 Double Bed",
      numberOfBeds: 1,
      facilities: [
        "Breakfast Included",
        "Air Conditioning (AC)",
        "Mountain / Hill View",
        "1 Double Bed",
        "Attached Bathroom",
        "Daily Housekeeping",
        "In-room Dining",
        "Laundry Service",
        "Non-Refundable",
      ],
      description:
        "120 sq.ft (11 sq.mt) Deluxe Room with Breakfast included, Mountain / Hill View, Air Conditioning, 1 Double Bed, Attached Bathroom, and Daily Housekeeping.",
      images: [room2Url, room1Url],
      active: true,
    },
    {
      hotel: hotel._id,
      vendor: hotel.vendor,
      name: "Club Room",
      roomType: "Club Room",
      pricePerNight: 2799,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "1 King Bed",
        "Attached Bathroom",
        "Daily Housekeeping",
        "In-room Dining",
        "Laundry Service",
        "Early Check-in / Late Check-out Available",
        "Mineral Water (Additional charge)",
        "Non-Refundable",
      ],
      description:
        "140 sq.ft (13 sq.mt) Club Room with 1 King Bed, Air Conditioning, Attached Bathroom, Housekeeping, In-room Dining, and Early Check-in / Late Check-out available.",
      images: [room2Url, room1Url],
      active: true,
    },
    {
      hotel: hotel._id,
      vendor: hotel.vendor,
      name: "Club Room (Breakfast Included)",
      roomType: "Club Room",
      pricePerNight: 3399,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Complimentary Breakfast Included",
        "Air Conditioning (AC)",
        "1 King Bed",
        "Attached Bathroom",
        "Daily Housekeeping",
        "In-room Dining",
        "Laundry Service",
        "Early Check-in / Late Check-out Available",
        "Non-Refundable",
      ],
      description:
        "140 sq.ft (13 sq.mt) Club Room with Free Breakfast included, 1 King Bed, Air Conditioning, Attached Bathroom, Housekeeping, and In-room Dining.",
      images: [room2Url, room1Url],
      active: true,
    },
  ];

  for (const r of roomsToCreate) {
    const created = await Room.create(r);
    console.log(`✅ Created Room "${created.name}" (₹${created.pricePerNight}) ID: ${created._id}`);
  }

  console.log("\n================================================================================");
  console.log("🎉 HOTEL VAISHNAVI HEIGHTS ROOMS UPDATED SUCCESSFULLY!");
  console.log("================================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error executing migration:", err);
  process.exit(1);
});
