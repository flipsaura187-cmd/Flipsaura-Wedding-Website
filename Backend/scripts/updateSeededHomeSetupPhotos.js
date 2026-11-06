import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Item from "../models/Item.js";
import Category from "../models/Category.js";

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://user:pass@cluster0.uldltgr.mongodb.net/flipsaura";
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully!");

    const homeSetupCat = await Category.findOne({
      slug: { $in: ["home-setup-pandal-tent-dj", "home-setup"] },
    });

    if (!homeSetupCat) {
      console.log("Home setup category not found.");
      return;
    }

    const items = await Item.find({ category: homeSetupCat._id });
    console.log(`Found ${items.length} Home Setup items.`);

    // High quality themed images for each category
    const SAMPLE_CATEGORY_PHOTOS = {
      "Tent & Pandal": [
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
      ],
      "Furniture & Seating": [
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1545232979-fbf6c164d1f2?auto=format&fit=crop&w=1200&q=80",
      ],
      "Stage & Decoration": [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
      ],
      "DJ & Sound System": [
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
      ],
      "Lighting & Special Effects": [
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
      ],
      "Power & Generator": [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
      ],
      "Additional Facilities": [
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
      ],
    };

    const ICON_MAP = {
      "Tent & Pandal": "⛺",
      "Furniture & Seating": "🪑",
      "Stage & Decoration": "🌸",
      "DJ & Sound System": "🔊",
      "Lighting & Special Effects": "💡",
      "Power & Generator": "⚡",
      "Additional Facilities": "🚪",
    };

    for (const item of items) {
      const catMap = {};
      const catList = [];
      const itemCats = item.mainCategories?.length > 0
        ? item.mainCategories
        : ["Tent & Pandal", "Stage & Decoration", "DJ & Sound System", "Furniture & Seating", "Lighting & Special Effects"];

      itemCats.forEach((cName) => {
        if (SAMPLE_CATEGORY_PHOTOS[cName]) {
          catMap[cName] = SAMPLE_CATEGORY_PHOTOS[cName];
          catList.push({
            categoryName: cName,
            icon: ICON_MAP[cName] || "🎪",
            images: SAMPLE_CATEGORY_PHOTOS[cName],
          });
        }
      });

      const allCatImgs = Object.values(catMap).flat();
      const mergedImages = Array.from(new Set([...(item.images || []), ...allCatImgs]));

      item.categoryPhotosMap = catMap;
      item.categoryPhotos = catList;
      item.images = mergedImages;
      item.markModified("categoryPhotosMap");
      item.markModified("categoryPhotos");
      await item.save();

      console.log(`Updated "${item.title}" with ${Object.keys(catMap).length} category photo groups (${allCatImgs.length} photos).`);
    }

    console.log("All Home Setup items updated successfully!");
  } catch (err) {
    console.error("Script error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

main();

