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
  console.log("🏨 UPDATING DIAMOND HOTEL ROOMS FROM USER SCREENSHOT SPECIFICATIONS");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected.\n");

  // 1. Upload room images from hotel_images/diamond-hotel/
  const dir = path.resolve("./hotel_images/diamond-hotel");
  const timestamp = Date.now();

  const room1Url = await uploadToCloudinary(
    path.join(dir, "room1.png"),
    "flipsaura/rooms",
    `room_diamond_hotel_room1_${timestamp}`
  );

  const room2Url = await uploadToCloudinary(
    path.join(dir, "room2.png"),
    "flipsaura/rooms",
    `room_diamond_hotel_room2_${timestamp}`
  );

  const room3Url = await uploadToCloudinary(
    path.join(dir, "room3.png"),
    "flipsaura/rooms",
    `room_diamond_hotel_room3_${timestamp}`
  );

  // 2. Find Diamond Hotel Item
  const allItems = await Item.find({}).lean();
  const diamondHotel = allItems.find(
    (i) =>
      i.title.toLowerCase().includes("diamond") &&
      i.title.toLowerCase().includes("hotel")
  );

  if (!diamondHotel) {
    throw new Error("Diamond Hotel item not found in DB!");
  }

  console.log(`\nFound Hotel: "${diamondHotel.title}" (ID: ${diamondHotel._id})`);

  // 3. Remove existing dummy rooms for Diamond Hotel
  const deleteResult = await Room.deleteMany({ hotel: diamondHotel._id });
  console.log(`🗑️ Removed ${deleteResult.deletedCount} old room(s) for Diamond Hotel.`);

  // 4. Create new rooms as per the screenshot:
  // Option 1: Deluxe Non-AC Rooms ($12 => ~ ₹1,050)
  // Option 2: Deluxe AC Room ($19 => ~ ₹1,599)
  // Option 3: Deluxe AC Room (Breakfast Included) ($24 => ~ ₹1,999)
  // Option 4: Deluxe AC Room (Breakfast + Lunch/Dinner) ($31 => ~ ₹2,599)

  const roomsToCreate = [
    {
      hotel: diamondHotel._id,
      vendor: diamondHotel.vendor,
      name: "Deluxe Non-AC Rooms",
      roomType: "Deluxe Non-AC",
      pricePerNight: 1050,
      availableRooms: 6,
      maxGuests: 2,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "1 King Bed",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "In-room Dining",
        "Room Service",
        "Iron / Ironing Board",
        "Mineral Water Available",
      ],
      description:
        "120 sq.ft (11 sq.mt) Deluxe Non-AC room with 1 King Bed, 1 Bathroom, In-room dining, Housekeeping, Room Service, and Free Cancellation till check-in.",
      images: [room1Url, room2Url, room3Url],
      active: true,
    },
    {
      hotel: diamondHotel._id,
      vendor: diamondHotel.vendor,
      name: "Deluxe AC Room",
      roomType: "Deluxe AC",
      pricePerNight: 1599,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "1 King Bed",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "In-room Dining",
        "Room Service",
        "Iron / Ironing Board",
        "Mineral Water Available",
      ],
      description:
        "180 sq.ft (17 sq.mt) Deluxe AC room with Air Conditioning, 1 King Bed, 1 Bathroom, In-room Dining, Housekeeping, and Free Cancellation till check-in.",
      images: [room2Url, room1Url, room3Url],
      active: true,
    },
    {
      hotel: diamondHotel._id,
      vendor: diamondHotel.vendor,
      name: "Deluxe AC Room (Breakfast Only)",
      roomType: "Deluxe AC",
      pricePerNight: 1999,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Breakfast Included",
        "Air Conditioning (AC)",
        "1 King Bed",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "In-room Dining",
        "Iron / Ironing Board",
      ],
      description:
        "180 sq.ft (17 sq.mt) Deluxe AC room with Complimentary Breakfast included, Air Conditioning, 1 King Bed, Attached Bathroom, and Free Cancellation till check-in.",
      images: [room2Url, room3Url, room1Url],
      active: true,
    },
    {
      hotel: diamondHotel._id,
      vendor: diamondHotel.vendor,
      name: "Deluxe AC Room (Breakfast + Lunch/Dinner)",
      roomType: "Deluxe AC",
      pricePerNight: 2599,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Breakfast Included",
        "Lunch or Dinner Included",
        "Air Conditioning (AC)",
        "1 King Bed",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "In-room Dining",
      ],
      description:
        "180 sq.ft (17 sq.mt) Deluxe AC room with Breakfast and Lunch or Dinner included, Air Conditioning, 1 King Bed, Attached Bathroom, and Free Cancellation till check-in.",
      images: [room3Url, room2Url, room1Url],
      active: true,
    },
  ];

  for (const r of roomsToCreate) {
    const created = await Room.create(r);
    console.log(`✅ Created Room "${created.name}" (₹${created.pricePerNight}) ID: ${created._id}`);
  }

  // 5. Update Hotel starting price to ₹1,050 ($12 USD base)
  await Item.updateOne(
    { _id: diamondHotel._id },
    { $set: { price: 1050 } }
  );
  console.log(`\n✅ Updated Diamond Hotel starting price to ₹1,050`);

  console.log("\n================================================================================");
  console.log("🎉 DIAMOND HOTEL ROOMS UPDATED SUCCESSFULLY!");
  console.log("================================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error executing migration:", err);
  process.exit(1);
});
