import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "Backend/.env") });
import mongoose from "mongoose";

const CATALOGUE_SUBCAT_SLUGS = [
  "tent-pandal",
  "furniture-seating",
  "stage-decoration",
  "dj-sound-system",
  "lighting-special-effects",
  "power-generator",
  "additional-facilities",
  "venues-resorts",
];

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB...");

  // 1. Remove the 7 catalogue subcategory entries from categories collection
  const delRes = await mongoose.connection.db.collection("categories").deleteMany({
    slug: { $in: CATALOGUE_SUBCAT_SLUGS }
  });
  console.log(`Deleted ${delRes.deletedCount} subcategory records from categories collection.`);

  // 2. Ensure Home Setup category exists and has proper image and name
  const homeCat = await mongoose.connection.db.collection("categories").findOne({
    slug: "home-setup-pandal-tent-dj"
  });

  if (homeCat) {
    await mongoose.connection.db.collection("categories").updateOne(
      { _id: homeCat._id },
      {
        $set: {
          name: "Home Setup – Pandal / Tent / DJ / Full Ghar Setup",
          description: "Complete home wedding & event setups: Waterproof Tent, Royal Shamiana, Furniture, Stage Mandap, DJ Sound, Lighting, Generator & Facilities.",
          image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_home-setup-pandal-tent-dj.png",
          order: 3,
          active: true,
        }
      }
    );
    console.log("Updated Home Setup category.");
  } else {
    await mongoose.connection.db.collection("categories").insertOne({
      name: "Home Setup – Pandal / Tent / DJ / Full Ghar Setup",
      slug: "home-setup-pandal-tent-dj",
      description: "Complete home wedding & event setups: Waterproof Tent, Royal Shamiana, Furniture, Stage Mandap, DJ Sound, Lighting, Generator & Facilities.",
      image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_home-setup-pandal-tent-dj.png",
      order: 3,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Inserted Home Setup category.");
  }

  // 3. Print remaining categories
  const remaining = await mongoose.connection.db.collection("categories").find({}).sort({ order: 1 }).toArray();
  console.log(`Remaining categories in DB (${remaining.length}):`);
  remaining.forEach(c => console.log(`- ${c.name} (${c.slug})`));

  process.exit(0);
}

cleanup().catch(err => {
  console.error("Cleanup error:", err);
  process.exit(1);
});

