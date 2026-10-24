import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Room from "../models/Room.js";
import User from "../models/User.js";

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
  const ext = path.extname(filePath).replace(".", "").toLowerCase() || "jpeg";
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

  console.log(`Uploading ${path.basename(filePath)} to Cloudinary (${folder}/${publicId})...`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || `Cloudinary upload failed for ${publicId}`);
  }

  console.log(`✓ Uploaded successfully: ${data.secure_url}`);
  return data.secure_url;
}

async function main() {
  console.log("================================================================================");
  console.log("🏨 UPDATING HAWELI RESORT & REMOVING FIVE STAR INN");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected.\n");

  // 1. Upload Haweli Resort Hotel Image
  const haweliHotelImagePath = path.resolve("./images/haweli resort.jpeg");
  const hotelTimestamp = Date.now();
  const haweliHotelUrl = await uploadToCloudinary(
    haweliHotelImagePath,
    "flipsaura/hotels",
    `hotel_the_haweli_resorts_${hotelTimestamp}`
  );

  // 2. Upload Haweli Resort Room2 Image
  const haweliRoomImagePath = path.resolve("./hotel_images/haweli-resort/room2.avif");
  const roomTimestamp = Date.now();
  const haweliRoomUrl = await uploadToCloudinary(
    haweliRoomImagePath,
    "flipsaura/rooms",
    `room_haweli_resort_room2_${roomTimestamp}`
  );

  // 3. Update Haweli Resort Item in DB
  const haweliItem = await Item.findOne({ title: { $regex: /haweli/i } });
  if (!haweliItem) {
    throw new Error("The Haweli Resorts item not found in DB!");
  }
  haweliItem.images = [haweliHotelUrl];
  await haweliItem.save();
  console.log(`✅ Updated Haweli Resort Item (${haweliItem._id}) with hotel image: ${haweliHotelUrl}`);

  // 4. Update Room(s) for Haweli Resort in DB
  const haweliRooms = await Room.find({ hotel: haweliItem._id });
  console.log(`Found ${haweliRooms.length} room(s) for Haweli Resort.`);
  for (const room of haweliRooms) {
    room.images = [haweliRoomUrl];
    await room.save();
    console.log(`✅ Updated Room "${room.name}" (${room._id}) with room2 image: ${haweliRoomUrl}`);
  }

  // 5. Remove Five Star Inn Hotel & its Rooms
  const fiveStarItems = await Item.find({ title: { $regex: /five star|5 star/i } });
  for (const item of fiveStarItems) {
    const deletedRooms = await Room.deleteMany({ hotel: item._id });
    console.log(`🗑️ Deleted ${deletedRooms.deletedCount} rooms for ${item.title}`);
    await Item.deleteOne({ _id: item._id });
    console.log(`🗑️ Deleted Hotel Item: ${item.title} (${item._id})`);

    if (item.vendor) {
      const remainingItemsForVendor = await Item.countDocuments({ vendor: item.vendor });
      if (remainingItemsForVendor === 0) {
        await User.deleteOne({ _id: item.vendor });
        console.log(`🗑️ Deleted orphan Vendor (${item.vendor}) for ${item.title}`);
      }
    }
  }

  console.log("\n================================================================================");
  console.log("🎉 ALL UPDATES COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error executing migration:", err);
  process.exit(1);
});
