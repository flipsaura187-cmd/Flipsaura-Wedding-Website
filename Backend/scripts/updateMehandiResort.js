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
  console.log("🏨 UPDATING MEHANDI RESORT COVER IMAGE & ROOM PHOTOS");
  console.log("================================================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected.\n");

  // 1. Upload Mehandi Resort Cover Image
  const possibleCoverFiles = [
    "./images/mehandi resort.png",
    "./images/mehandi resort.jpg",
    "./images/mehandi resort.jpeg",
    "./images/mehandi resort.avif",
  ];
  let hotelCoverPath = "";
  for (const f of possibleCoverFiles) {
    if (fs.existsSync(path.resolve(f))) {
      hotelCoverPath = path.resolve(f);
      break;
    }
  }
  if (!hotelCoverPath) {
    throw new Error("No Mehandi Resort cover image found in ./images/");
  }
  console.log(`Using cover file: ${hotelCoverPath}`);

  const hotelTimestamp = Date.now();
  const hotelCoverUrl = await uploadToCloudinary(
    hotelCoverPath,
    "flipsaura/hotels",
    `hotel_mehandi_resort_${hotelTimestamp}`
  );

  // 2. Upload Mehandi Resort Room Photos (room1 & room2)
  const room1Path = path.resolve("./hotel_images/mehandi-resort/room1.avif");
  const room2Path = fs.existsSync(path.resolve("./hotel_images/mehandi-resort/room2.png"))
    ? path.resolve("./hotel_images/mehandi-resort/room2.png")
    : path.resolve("./hotel_images/mehandi-resort/room2.avif");
  const roomTimestamp = Date.now();

  const room1Url = await uploadToCloudinary(
    room1Path,
    "flipsaura/rooms",
    `room_mehandi_resort_room1_${roomTimestamp}`
  );

  const room2Url = await uploadToCloudinary(
    room2Path,
    "flipsaura/rooms",
    `room_mehandi_resort_room2_${roomTimestamp}`
  );

  // 3. Update Mehandi Resort Hotel Item (and related items)
  const mehandiHotel = await Item.findOne({
    title: { $regex: /mehandi resort.*hotel/i },
  });

  if (!mehandiHotel) {
    throw new Error("Mehandi Resort Hotel item not found in DB!");
  }

  mehandiHotel.images = [hotelCoverUrl];
  await mehandiHotel.save();
  console.log(`✅ Updated Mehandi Resort Hotel (${mehandiHotel._id}) cover image to: ${hotelCoverUrl}`);

  // Also update any other Mehandi Resort items (venue/catering) so the property photos stay unified
  const otherMehandiItems = await Item.find({
    title: { $regex: /mehandi resort/i },
    _id: { $ne: mehandiHotel._id },
  });
  for (const item of otherMehandiItems) {
    item.images = [hotelCoverUrl];
    await item.save();
    console.log(`✅ Updated Mehandi Resort item (${item.title}) cover image`);
  }

  // 4. Update Rooms for Mehandi Resort
  const rooms = await Room.find({ hotel: mehandiHotel._id });
  console.log(`\nFound ${rooms.length} room(s) for Mehandi Resort.`);

  for (const room of rooms) {
    const isStandard = /standard/i.test(room.name);
    // Standard gets room1 first, Deluxe gets room2 first; both include both photos in gallery
    if (isStandard) {
      room.images = [room1Url, room2Url];
    } else {
      room.images = [room2Url, room1Url];
    }
    await room.save();
    console.log(`✅ Updated Room "${room.name}" (${room._id}) images:`, room.images);
  }

  console.log("\n================================================================================");
  console.log("🎉 MEHANDI RESORT UPDATE COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error executing migration:", err);
  process.exit(1);
});
