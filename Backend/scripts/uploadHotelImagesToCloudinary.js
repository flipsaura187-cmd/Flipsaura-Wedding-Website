import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Item from "../models/Item.js";

const HOTEL_FOLDER_MAP = {
  "gargee-surya-vihar": ["gargee surya vihar", "gargee"],
  "hotel-us-residency": ["hotel us residency", "us residency"],
  "hotel-saraswati-inn": ["hotel saraswati inn", "saraswati inn"],
  "hotel-sky-view": ["hotel sky view", "the hotel sky view", "sky view"],
  "hotel-madhuram-banquet": ["hotel madhuram & banquet hall", "hotel madhuram", "madhuram"],
  "buddha-resort": ["buddha resort", "buddha"],
  "hotel-raj-residency": ["hotel raj residency & royal restaurant", "hotel raj residency", "raj residency"],
  "hotel-vaishnavi-heights": ["hotel vaishnavi heights", "vaishnavi heights"],
  "hotel-rinkesh-grand": ["hotel rinkesh grand", "rinkesh grand"],
  "hotel-imperial": ["hotel imperial aurangabad", "hotel imperial", "imperial"],
  "hotel-jhari-palace": ["hotel jhari palace", "jhari palace"],
  "amit-rest-house": ["amit rest house", "amit rest"],
  "diamond-hotel": ["the diamond hotel and family restaurant", "diamond hotel"],
  "sangam-resort": ["sangam resort", "sangam"],
  "janakpuri-palace": ["janakpuri palace hotel and resort", "janakpuri palace"],
  "janakpuri-resort": ["janakpuri resort"],
  "heaven-resort": ["heaven resort and restaurant", "heaven resort"],
  "mehandi-resort": ["mehandi resort hotel & restaurant", "mehandi resort"],
  "five-star-inn": ["five star inn"],
};

function normalizeName(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function uploadFileToCloudinary(filePath, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials in .env (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)");
  }

  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).replace(".", "") || "jpeg";
  const dataUri = `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buf.toString("base64")}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "flipsaura/hotels";
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

export async function uploadHotelImages() {
  await dbConnect();
  console.log(`\n======================================================`);
  console.log(` UPLOADING HOTEL IMAGES TO CLOUDINARY & SYNCING TO ATLAS`);
  console.log(`======================================================\n`);

  const searchDirs = [path.resolve("./hotel_images"), path.resolve("./images")].filter((d) => fs.existsSync(d));
  if (searchDirs.length === 0) {
    console.error(`Neither hotel_images nor images directory found.`);
    return;
  }

  const existingVendors = await User.find({ role: "vendor" }).lean();
  console.log(`Found ${existingVendors.length} registered vendors in MongoDB Atlas.\n`);

  const validExts = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
  let totalUploaded = 0;
  let totalUpdatedItems = 0;

  for (const baseDir of searchDirs) {
    console.log(`📂 Scanning directory: ${baseDir}`);
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    // 1. Check Subfolders
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderSlug = entry.name;
        const folderPath = path.join(baseDir, folderSlug);
        const files = fs.readdirSync(folderPath).filter((f) => validExts.includes(path.extname(f).toLowerCase()));

        if (files.length === 0) continue;

        console.log(`📁 Found ${files.length} image(s) in folder: "${folderSlug}"`);

        const aliases = HOTEL_FOLDER_MAP[folderSlug] || [folderSlug.replace(/-/g, " ")];
        const matchedVendor = existingVendors.find((v) => {
          const vName = normalizeName(v.vendorProfile?.businessName || v.name);
          return aliases.some((a) => {
            const normA = normalizeName(a);
            return vName === normA || vName.includes(normA) || normA.includes(vName);
          });
        });

        if (!matchedVendor) {
          console.warn(`  ⚠️ Could not match vendor for folder: "${folderSlug}"`);
          continue;
        }

        console.log(`  🎯 Matched Vendor: "${matchedVendor.vendorProfile?.businessName || matchedVendor.name}" (ID: ${matchedVendor._id})`);

        const uploadedUrls = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const filePath = path.join(folderPath, file);
          const cleanName = path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9_-]/g, "_");
          const publicId = `${folderSlug}_${cleanName}_${Date.now()}`;

          console.log(`    ☁️ Uploading "${file}" to Cloudinary (${publicId})...`);
          try {
            const cldUrl = await uploadFileToCloudinary(filePath, publicId);
            console.log(`    ✅ Uploaded: ${cldUrl}`);
            uploadedUrls.push(cldUrl);
            totalUploaded++;
          } catch (err) {
            console.error(`    ❌ Cloudinary upload failed for "${file}":`, err.message);
          }
        }

        if (uploadedUrls.length > 0) {
          const items = await Item.find({ vendor: matchedVendor._id });
          for (const item of items) {
            await Item.updateOne({ _id: item._id }, { $set: { images: uploadedUrls } });
            console.log(`    ⭐ Updated Atlas Item: "${item.title}" with ${uploadedUrls.length} Cloudinary photo(s)!`);
            totalUpdatedItems++;
          }
        }
        console.log();
      }
    }

    // 2. Check Top-level files in directory
    const topFiles = fs.readdirSync(baseDir).filter((f) => {
      const full = path.join(baseDir, f);
      return fs.statSync(full).isFile() && validExts.includes(path.extname(f).toLowerCase());
    });

    if (topFiles.length > 0) {
      console.log(`📄 Found ${topFiles.length} image(s) directly in ${path.basename(baseDir)}/ directory...`);
      for (const file of topFiles) {
        const filePath = path.join(baseDir, file);
        const rawBase = path.basename(file, path.extname(file));
        const cleanName = normalizeName(rawBase);

        const matchedVendor = existingVendors.find((v) => {
          const vn = normalizeName(v.vendorProfile?.businessName || v.name);
          if (vn === cleanName || vn.includes(cleanName) || cleanName.includes(vn)) return true;
          if (cleanName.includes("gargee") && vn.includes("gargee")) return true;
          if (cleanName.includes("raj residency") && vn.includes("raj residency")) return true;
          if (cleanName.includes("diamond hotel") && vn.includes("diamond hotel")) return true;
          if (cleanName.includes("mehandi resort") && vn.includes("mehandi resort")) return true;
          if (cleanName.includes("janakpuri palace") && vn.includes("janakpuri palace")) return true;
          if (cleanName.includes("us residency") && vn.includes("us residency")) return true;
          if (cleanName.includes("saraswati") && vn.includes("saraswati")) return true;
          if (cleanName.includes("vaishnavi") && vn.includes("vaishnavi")) return true;
          if (cleanName.includes("rinkesh") && vn.includes("rinkesh")) return true;
          if (cleanName.includes("sky view") && vn.includes("sky view")) return true;
          if (cleanName.includes("madhuram") && vn.includes("madhuram")) return true;
          if (cleanName.includes("imperial") && vn.includes("imperial")) return true;
          if (cleanName.includes("heaven") && vn.includes("heaven")) return true;
          if (cleanName.includes("amit rest") && vn.includes("amit rest")) return true;
          if (cleanName.includes("sangam") && vn.includes("sangam")) return true;
          if (cleanName.includes("buddha") && vn.includes("buddha")) return true;
          return false;
        });

        if (!matchedVendor) {
          console.warn(`  ⚠️ Could not match hotel for file: "${file}"`);
          continue;
        }

        console.log(`  🎯 Matched "${file}" to Vendor "${matchedVendor.vendorProfile?.businessName || matchedVendor.name}"`);
        const safeBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
        const publicId = `hotel_${safeBase}_${Date.now()}`;
        try {
          const cldUrl = await uploadFileToCloudinary(filePath, publicId);
          console.log(`    ✅ Uploaded to Cloudinary: ${cldUrl}`);
          totalUploaded++;

          const items = await Item.find({ vendor: matchedVendor._id });
          for (const item of items) {
            await Item.updateOne({ _id: item._id }, { $set: { images: [cldUrl] } });
            console.log(`    ⭐ Updated Atlas Item: "${item.title}" with Cloudinary image.`);
            totalUpdatedItems++;
          }

          // Special case: if Janakpuri Palace uploaded, also update Janakpuri Resort if it has no custom photo
          if (cleanName.includes("janakpuri palace")) {
            const janakpuriResortVendor = existingVendors.find((v) => {
              const vName = normalizeName(v.vendorProfile?.businessName || v.name);
              return vName === "janakpuri resort";
            });
            if (janakpuriResortVendor) {
              const resortItems = await Item.find({ vendor: janakpuriResortVendor._id });
              for (const item of resortItems) {
                await Item.updateOne({ _id: item._id }, { $set: { images: [cldUrl] } });
                console.log(`    ⭐ Also updated Janakpuri Resort item: "${item.title}"`);
              }
            }
          }
        } catch (err) {
          console.error(`    ❌ Failed to upload "${file}":`, err.message);
        }
      }
      console.log();
    }
  }

  console.log(`\n======================================================`);
  console.log(` SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total Images Uploaded to Cloudinary: ${totalUploaded}`);
  console.log(`Total Atlas Items Updated:          ${totalUpdatedItems}`);
  console.log(`======================================================\n`);
}

// Standalone execution
if (process.argv[1]?.endsWith("uploadHotelImagesToCloudinary.js")) {
  uploadHotelImages()
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error during upload:", err);
      process.exit(1);
    });
}
