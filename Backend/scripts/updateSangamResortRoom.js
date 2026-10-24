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
  console.log("🏨 UPDATING SANGAM RESORT TO A SINGLE ROOM BASED ON MMT SPECIFICATIONS");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected.\n");

  // 1. Upload room images from hotel_images/sangam-resort/
  const room1Path = path.resolve("./hotel_images/sangam-resort/room1.png");
  const room2Path = path.resolve("./hotel_images/sangam-resort/room2.png");
  const timestamp = Date.now();

  const room1Url = await uploadToCloudinary(
    room1Path,
    "flipsaura/rooms",
    `room_sangam_resort_room1_${timestamp}`
  );

  const room2Url = await uploadToCloudinary(
    room2Path,
    "flipsaura/rooms",
    `room_sangam_resort_room2_${timestamp}`
  );

  // 2. Find Sangam Resort Hotel Accommodation item
  const allItems = await Item.find({}).lean();
  const sangamHotel = allItems.find(
    (i) =>
      i.title.toLowerCase().includes("sangam") &&
      i.title.toLowerCase().includes("hotel")
  );

  if (!sangamHotel) {
    throw new Error("Sangam Resort Hotel item not found in DB!");
  }

  console.log(`\nFound Hotel: "${sangamHotel.title}" (ID: ${sangamHotel._id})`);

  // 3. Delete existing rooms for Sangam Resort
  const deleteResult = await Room.deleteMany({ hotel: sangamHotel._id });
  console.log(`🗑️ Removed ${deleteResult.deletedCount} old room(s) for Sangam Resort.`);

  // 4. Create the single room as specified in user's MMT details screenshot:
  // - Name: Deluxe Room - AC
  // - Subtitle: Room With Free Cancellation
  // - Room Size: 120 sq.ft (11 sq.mt)
  // - Guests: Max 3 Guests
  // - Bed: 1 King Bed
  // - Bathroom: 1 Bathroom
  // - Amenities: Bathroom, Air Conditioning, Mineral Water - additional charge, Closet, Chair, Work Desk
  // - Price: $14 (~ ₹1,199 / ₹1,200)
  const roomPriceInr = 1199;

  const newRoom = await Room.create({
    hotel: sangamHotel._id,
    vendor: sangamHotel.vendor,
    name: "Deluxe Room - AC",
    roomType: "Deluxe Room",
    pricePerNight: roomPriceInr,
    availableRooms: 5,
    maxGuests: 3,
    bedType: "1 King Bed",
    numberOfBeds: 1,
    facilities: [
      "Air Conditioning (AC)",
      "Free Cancellation till check-in",
      "Attached Bathroom",
      "1 King Bed",
      "Closet",
      "Chair",
      "Work Desk",
      "Mineral Water (Additional charge)",
    ],
    description:
      "120 sq.ft (11 sq.mt) Deluxe Room with Air Conditioning, 1 King Bed, 1 Bathroom, Closet, Work Desk, Chair, and Free Cancellation till check-in.",
    images: [room1Url, room2Url],
    active: true,
  });

  console.log(`\n✅ Created Single Room for Sangam Resort:`);
  console.log(`   ID:            ${newRoom._id}`);
  console.log(`   Name:          ${newRoom.name}`);
  console.log(`   Room Type:     ${newRoom.roomType}`);
  console.log(`   Price/Night:   ₹${newRoom.pricePerNight} ($14 equivalent)`);
  console.log(`   Max Guests:    ${newRoom.maxGuests}`);
  console.log(`   Bed Type:      ${newRoom.bedType}`);
  console.log(`   Facilities:    ${newRoom.facilities.join(", ")}`);
  console.log(`   Images:        ${newRoom.images.join(", ")}`);

  // 5. Update hotel starting price
  await Item.updateOne(
    { _id: sangamHotel._id },
    { $set: { price: roomPriceInr } }
  );
  console.log(`✅ Updated Sangam Resort Hotel starting price to ₹${roomPriceInr}`);

  console.log("\n================================================================================");
  console.log("🎉 SANGAM RESORT SINGLE ROOM UPDATE COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error executing migration:", err);
  process.exit(1);
});
