import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";

async function uploadFileToCloudinary(filePath, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials in .env");
  }

  const buf = fs.readFileSync(filePath);
  const dataUri = `data:image/webp;base64,${buf.toString("base64")}`;

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
  const localWebpPath = path.resolve("./images/hotel.webp");
  if (!fs.existsSync(localWebpPath)) {
    throw new Error(`hotel.webp not found at ${localWebpPath}`);
  }
  console.log(`Found hotel.webp (${fs.statSync(localWebpPath).size} bytes)`);

  // 1. Copy to frontend/public/images/categories
  const targetDir = path.resolve("../frontend/public/images/categories");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(localWebpPath, path.join(targetDir, "hotel.webp"));
  fs.copyFileSync(localWebpPath, path.join(targetDir, "hotels.webp"));
  fs.copyFileSync(localWebpPath, path.join(targetDir, "hotels.jpg"));
  console.log("✓ Copied hotel.webp to frontend/public/images/categories/ (hotel.webp, hotels.webp, hotels.jpg)");

  // 2. Upload to Cloudinary
  console.log("Uploading hotel.webp to Cloudinary...");
  const publicId = `category_hotels_${Date.now()}`;
  const cldUrl = await uploadFileToCloudinary(localWebpPath, publicId);
  console.log(`✓ Cloudinary Upload successful: ${cldUrl}`);

  // 3. Update in MongoDB
  console.log("Updating category 'hotels' in MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  const categoriesCol = mongoose.connection.collection("categories");
  
  const updateResult = await categoriesCol.updateOne(
    { slug: "hotels" },
    { $set: { image: cldUrl } }
  );
  console.log(`✓ MongoDB update result: modified ${updateResult.modifiedCount} document(s)`);

  const updatedDoc = await categoriesCol.findOne({ slug: "hotels" });
  console.log("New hotels category doc:", updatedDoc);

  await mongoose.disconnect();
  console.log("All done!");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
