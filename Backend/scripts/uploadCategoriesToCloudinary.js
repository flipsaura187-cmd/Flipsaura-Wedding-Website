import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";

const CATEGORY_FILE_MAP = {
  hotels: "hotel.webp",
  venues: "venues.jpg",
  "home-setup-pandal-tent-dj": "home-setup.jpg",
  "transport-car-bus-auto": "transport.jpg",
  "pandit-priest": "pandit-priest.jpg",
  "photographer-videographer": "photography.jpg",
  "food-catering": "food-catering.jpg",
  "makeup-grooming": "makeup-grooming.jpg",
  "mehndi-services": "mehndi.jpg",
  "music-dance": "music-dance.jpg",
  "orchestra-live-band": "orchestra.jpg",
  "virtual-planning": "virtual-planning.jpg",
  "planning-decor": "planning-decor.jpg",
  "invites-gifts": "invites-gifts.jpg",
};

async function uploadFileToCloudinary(filePath, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials in .env");
  }

  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).replace(".", "") || "jpeg";
  const dataUri = `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buf.toString("base64")}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "flipsaura/categories";
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
    throw new Error(data.error?.message || `Failed to upload ${publicId}`);
  }

  return data.secure_url;
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  const categoriesCol = mongoose.connection.collection("categories");
  const categories = await categoriesCol.find({}).toArray();

  console.log(`Found ${categories.length} categories in database.`);

  const results = [];

  for (const cat of categories) {
    const fileName = CATEGORY_FILE_MAP[cat.slug];
    if (!fileName) {
      console.warn(`No file mapped for slug: ${cat.slug}`);
      continue;
    }

    const localPath = path.resolve(`../frontend/public/images/categories/${fileName}`);
    if (!fs.existsSync(localPath)) {
      console.warn(`File not found at ${localPath}`);
      continue;
    }

    const publicId = `category_${cat.slug}`;
    console.log(`Uploading ${fileName} for "${cat.name}" (${cat.slug})...`);

    try {
      const cldUrl = await uploadFileToCloudinary(localPath, publicId);
      console.log(`✓ Uploaded "${cat.name}" -> ${cldUrl}`);

      await categoriesCol.updateOne(
        { _id: cat._id },
        { $set: { image: cldUrl } }
      );

      results.push({
        name: cat.name,
        slug: cat.slug,
        image: cldUrl,
      });
    } catch (err) {
      console.error(`✗ Error uploading ${cat.name}:`, err.message);
    }
  }

  console.log("\n=== Upload Summary ===");
  console.table(results);
  await mongoose.disconnect();
  console.log("Done!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
