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
  console.log("🏨 SYNCING HEAVEN RESORT ROOMS & MEHANDI RESORT ROOMS/IMAGES");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected.\n");

  // ==========================================
  // 1. HEAVEN RESORT ROOMS
  // ==========================================
  console.log("--- 1. PROCESSING HEAVEN RESORT ROOM IMAGES ---");
  const heavenRoom1Path = path.resolve("./hotel_images/heavenResort/room1.png");
  const heavenRoom2Path = path.resolve("./hotel_images/heavenResort/room2.png");
  const heavenTimestamp = Date.now();

  const heavenRoom1Url = await uploadToCloudinary(
    heavenRoom1Path,
    "flipsaura/rooms",
    `room_heaven_resort_room1_${heavenTimestamp}`
  );

  const heavenRoom2Url = await uploadToCloudinary(
    heavenRoom2Path,
    "flipsaura/rooms",
    `room_heaven_resort_room2_${heavenTimestamp}`
  );

  const heavenHotel = await Item.findOne({
    title: { $regex: /heaven resort.*hotel/i },
  });

  if (!heavenHotel) {
    console.warn("⚠️ Heaven Resort Hotel item not found by regex!");
  } else {
    const heavenRooms = await Room.find({ hotel: heavenHotel._id });
    console.log(`Found ${heavenRooms.length} room(s) for Heaven Resort (${heavenHotel.title}).`);
    for (const room of heavenRooms) {
      const isStandard = /standard/i.test(room.name);
      if (isStandard) {
        room.images = [heavenRoom1Url, heavenRoom2Url];
      } else {
        room.images = [heavenRoom2Url, heavenRoom1Url];
      }
      await room.save();
      console.log(`  ✅ Updated Room "${room.name}" (${room._id}) images to:`, room.images);
    }
  }

  // ==========================================
  // 2. MEHANDI RESORT ROOMS & IMAGES
  // ==========================================
  console.log("\n--- 2. PROCESSING MEHANDI RESORT NEW ROOM2.PNG ---");
  const mehandiRoom1Path = path.resolve("./hotel_images/mehandi-resort/room1.avif");
  const mehandiRoom2Path = path.resolve("./hotel_images/mehandi-resort/room2.png");
  const mehandiTimestamp = Date.now();

  // Upload room2.png (the newly updated high-res room image)
  const mehandiRoom2Url = await uploadToCloudinary(
    mehandiRoom2Path,
    "flipsaura/rooms",
    `room_mehandi_resort_room2_${mehandiTimestamp}`
  );

  // We can also re-verify room1 or upload fresh if needed
  let mehandiRoom1Url = "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792764158/flipsaura/rooms/room_mehandi_resort_room1_1792764157305.avif";
  if (!mehandiRoom1Url) {
    mehandiRoom1Url = await uploadToCloudinary(
      mehandiRoom1Path,
      "flipsaura/rooms",
      `room_mehandi_resort_room1_${mehandiTimestamp}`
    );
  }

  const mehandiHotel = await Item.findOne({
    title: { $regex: /mehandi resort.*hotel/i },
  });

  if (!mehandiHotel) {
    console.warn("⚠️ Mehandi Resort Hotel item not found!");
  } else {
    const mehandiRooms = await Room.find({ hotel: mehandiHotel._id });
    console.log(`Found ${mehandiRooms.length} room(s) for Mehandi Resort (${mehandiHotel.title}).`);
    for (const room of mehandiRooms) {
      const isStandard = /standard/i.test(room.name);
      if (isStandard) {
        room.images = [mehandiRoom1Url, mehandiRoom2Url];
      } else {
        room.images = [mehandiRoom2Url, mehandiRoom1Url];
      }
      await room.save();
      console.log(`  ✅ Updated Room "${room.name}" (${room._id}) images to:`, room.images);
    }
  }

  console.log("\n================================================================================");
  console.log("🎉 ALL HEAVEN RESORT & MEHANDI RESORT IMAGES UPDATED SUCCESSFULLY!");
  console.log("================================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error executing sync script:", err);
  process.exit(1);
});
