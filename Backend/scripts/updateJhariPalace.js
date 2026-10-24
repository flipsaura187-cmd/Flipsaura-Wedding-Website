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
  console.log("🏨 UPDATING HOTEL JHARI PALACE COVER & ROOMS FROM SCREENSHOT SPECIFICATIONS");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected.\n");

  // 1. Upload Cover Image (Backend/images/jhari_palace.png)
  const coverPath = path.resolve("./images/jhari_palace.png");
  const coverTimestamp = Date.now();
  const hotelCoverUrl = await uploadToCloudinary(
    coverPath,
    "flipsaura/hotels",
    `hotel_jhari_palace_${coverTimestamp}`
  );

  // 2. Upload Room Images (Backend/hotel_images/hotel-jhari-palace/room1.png, room2.png, room3.png)
  const dir = path.resolve("./hotel_images/hotel-jhari-palace");
  const roomTimestamp = Date.now();

  const room1Url = await uploadToCloudinary(
    path.join(dir, "room1.png"),
    "flipsaura/rooms",
    `room_jhari_palace_room1_${roomTimestamp}`
  );

  const room2Url = await uploadToCloudinary(
    path.join(dir, "room2.png"),
    "flipsaura/rooms",
    `room_jhari_palace_room2_${roomTimestamp}`
  );

  const room3Url = await uploadToCloudinary(
    path.join(dir, "room3.png"),
    "flipsaura/rooms",
    `room_jhari_palace_room3_${roomTimestamp}`
  );

  // 3. Find Hotel Jhari Palace Item in DB
  const allItems = await Item.find({}).lean();
  const jhariHotel = allItems.find(
    (i) =>
      i.title.toLowerCase().includes("jhari") &&
      i.title.toLowerCase().includes("hotel")
  );

  if (!jhariHotel) {
    throw new Error("Hotel Jhari Palace item not found in DB!");
  }

  console.log(`\nFound Hotel: "${jhariHotel.title}" (ID: ${jhariHotel._id})`);

  // Update Cover Image & Base Starting Price for Hotel Item
  const baseStartingPrice = 699; // $8 USD base rate
  await Item.updateOne(
    { _id: jhariHotel._id },
    {
      $set: {
        images: [hotelCoverUrl],
        price: baseStartingPrice,
      },
    }
  );
  console.log(`✅ Updated Hotel Cover image & starting price (₹${baseStartingPrice})`);

  // 4. Remove old dummy rooms for Hotel Jhari Palace
  const deleteResult = await Room.deleteMany({ hotel: jhariHotel._id });
  console.log(`🗑️ Removed ${deleteResult.deletedCount} old room(s) for Hotel Jhari Palace.`);

  // 5. Create new rooms matching screenshot:
  // - Category 1: ECONOMY NON AC (144 sq.ft, 1 Double Bed, Max 3 Guests)
  //   - Plan A: Room with Free Cancellation ($8 => ₹699)
  //   - Plan B: Room with Free Cancellation | Breakfast only ($14 => ₹1,199)
  // - Category 2: DELUXE ROOM (144 sq.ft, 1 King Bed, Max 3 Guests, AC)
  //   - Plan A: Room with Free Cancellation ($14 => ₹1,199)
  //   - Plan B: Room with Free Cancellation | Breakfast only ($16 => ₹1,349)
  // - Category 3: PREMIUM ROOM (225 sq.ft, 1 King Bed, Max 3 Guests, AC, City View)
  //   - Plan A: Room with Free Cancellation ($26 => ₹2,199)
  //   - Plan B: Room with Free Cancellation | Breakfast only ($32 => ₹2,699)

  const roomsToCreate = [
    {
      hotel: jhariHotel._id,
      vendor: jhariHotel.vendor,
      name: "Economy Non-AC Room",
      roomType: "Economy Non-AC",
      pricePerNight: 699,
      availableRooms: 6,
      maxGuests: 3,
      bedType: "1 Double Bed",
      numberOfBeds: 1,
      facilities: [
        "1 Double Bed",
        "City View",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "Room Service",
        "In-room Dining",
        "Laundry Service",
        "Smoking Room Available",
      ],
      description:
        "144 sq.ft (13 sq.mt) Economy Non-AC room with City View, 1 Double Bed, Attached Bathroom, Housekeeping, In-room dining, Room Service, and Free Cancellation till check-in.",
      images: [room1Url, room2Url, room3Url],
      active: true,
    },
    {
      hotel: jhariHotel._id,
      vendor: jhariHotel.vendor,
      name: "Economy Non-AC Room (Breakfast Only)",
      roomType: "Economy Non-AC",
      pricePerNight: 1199,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 Double Bed",
      numberOfBeds: 1,
      facilities: [
        "Breakfast Included",
        "1 Double Bed",
        "City View",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "Room Service",
        "In-room Dining",
        "Laundry Service",
      ],
      description:
        "144 sq.ft (13 sq.mt) Economy Non-AC room with Breakfast included, City View, 1 Double Bed, Attached Bathroom, and Free Cancellation till check-in.",
      images: [room1Url, room2Url, room3Url],
      active: true,
    },
    {
      hotel: jhariHotel._id,
      vendor: jhariHotel.vendor,
      name: "Deluxe AC Room",
      roomType: "Deluxe AC",
      pricePerNight: 1199,
      availableRooms: 6,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Air Conditioning (AC)",
        "1 King Bed",
        "City View",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "Room Service",
        "Laundry Service",
        "Smoking Room Available",
      ],
      description:
        "144 sq.ft (13 sq.mt) Deluxe AC Room with Air Conditioning, City View, 1 King Bed, Attached Bathroom, Housekeeping, Room Service, and Free Cancellation till check-in.",
      images: [room2Url, room3Url, room1Url],
      active: true,
    },
    {
      hotel: jhariHotel._id,
      vendor: jhariHotel.vendor,
      name: "Deluxe AC Room (Breakfast Only)",
      roomType: "Deluxe AC",
      pricePerNight: 1349,
      availableRooms: 5,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Breakfast Included",
        "Air Conditioning (AC)",
        "1 King Bed",
        "City View",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "Room Service",
      ],
      description:
        "144 sq.ft (13 sq.mt) Deluxe AC Room with Breakfast included, Air Conditioning, City View, 1 King Bed, Attached Bathroom, and Free Cancellation till check-in.",
      images: [room2Url, room3Url, room1Url],
      active: true,
    },
    {
      hotel: jhariHotel._id,
      vendor: jhariHotel.vendor,
      name: "Premium Room (Early Check-in)",
      roomType: "Premium Room",
      pricePerNight: 2199,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Guaranteed Early Check-in upto 4 hrs",
        "Air Conditioning (AC)",
        "Spacious 225 sq.ft (21 sq.mt)",
        "City View",
        "1 King Bed",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "Room Service",
      ],
      description:
        "225 sq.ft (21 sq.mt) Premium air-conditioned room with Guaranteed Early Check-in up to 4 hrs, 1 King Bed, City View, Attached Bathroom, Housekeeping, and Free Cancellation till check-in.",
      images: [room3Url, room2Url, room1Url],
      active: true,
    },
    {
      hotel: jhariHotel._id,
      vendor: jhariHotel.vendor,
      name: "Premium Room (Breakfast Included)",
      roomType: "Premium Room",
      pricePerNight: 2699,
      availableRooms: 4,
      maxGuests: 3,
      bedType: "1 King Bed",
      numberOfBeds: 1,
      facilities: [
        "Complimentary Breakfast Included",
        "Air Conditioning (AC)",
        "Spacious 225 sq.ft (21 sq.mt)",
        "City View",
        "1 King Bed",
        "Attached Bathroom",
        "Free Cancellation till check-in",
        "Housekeeping",
        "Room Service",
      ],
      description:
        "225 sq.ft (21 sq.mt) Premium room with Complimentary Breakfast included, Air Conditioning, 1 King Bed, City View, Attached Bathroom, and Free Cancellation till check-in.",
      images: [room3Url, room2Url, room1Url],
      active: true,
    },
  ];

  for (const r of roomsToCreate) {
    const created = await Room.create(r);
    console.log(`✅ Created Room "${created.name}" (₹${created.pricePerNight}) ID: ${created._id}`);
  }

  console.log("\n================================================================================");
  console.log("🎉 HOTEL JHARI PALACE COVER & ROOMS UPDATED SUCCESSFULLY!");
  console.log("================================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error executing migration:", err);
  process.exit(1);
});
