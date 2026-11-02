import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "Backend/.env") });

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATALOGUE_DATA = [
  {
    category: {
      name: "Tent & Pandal",
      slug: "tent-pandal",
      icon: "⛺",
      group: "Venue & Event Setup",
      description: "Waterproof tents, royal shamianas, German hangers, and luxury pandal setups.",
      order: 1,
    },
    subcategories: [
      "Waterproof Tent",
      "German Hanger Tent",
      "Royal Shamiana",
      "Wedding Pandal",
      "VIP Pandal",
      "Canopy & Open-Air Tent",
      "Garden Tent Setup",
    ],
  },
  {
    category: {
      name: "Furniture & Seating",
      slug: "furniture-seating",
      icon: "🪑",
      group: "Venue & Event Setup",
      description: "Banquet chairs, VIP sofas, bride & groom seating, and dining arrangements.",
      order: 2,
    },
    subcategories: [
      "Plastic & Banquet Chairs",
      "VIP Sofa",
      "Bride & Groom Sofa",
      "Round Dining Tables",
      "Dining Chairs",
      "Guest Seating Arrangement",
      "VIP Lounge Setup",
    ],
  },
  {
    category: {
      name: "Stage & Decoration",
      slug: "stage-decoration",
      icon: "✨",
      group: "Decor & Production",
      description: "Wedding stages, floral mandaps, LED backdrops, and theme entrances.",
      order: 3,
    },
    subcategories: [
      "Wedding Stage",
      "Reception Stage",
      "Bride & Groom Stage",
      "LED Backdrop",
      "Floral Decoration",
      "Mandap Decoration",
      "Entrance Gate Decoration",
      "Theme-Based Decoration",
      "Red Carpet & Stage Flooring",
    ],
  },
  {
    category: {
      name: "DJ & Sound System",
      slug: "dj-sound-system",
      icon: "🔊",
      group: "Entertainment & Sound",
      description: "Line array sound systems, professional DJ consoles, and wireless microphones.",
      order: 4,
    },
    subcategories: [
      "Professional DJ",
      "DJ Console",
      "DJ with Operator",
      "Line Array Sound System",
      "Bass & Subwoofer",
      "Professional Speakers",
      "Wireless Microphone",
      "Orchestra Sound System",
      "Anchor & Announcement Mic",
    ],
  },
  {
    category: {
      name: "Lighting & Special Effects",
      slug: "lighting-special-effects",
      icon: "💡",
      group: "Decor & Production",
      description: "Moving head lights, LED pars, laser effects, and ambient serial lighting.",
      order: 5,
    },
    subcategories: [
      "LED Par Lights",
      "Moving Head Lights",
      "RGB Lights",
      "Serial Lights",
      "Focus Lights",
      "Laser & Disco Lights",
      "Follow Spot Lights",
      "Cold Pyro Effects (where legally permitted)",
    ],
  },
  {
    category: {
      name: "Power & Generator",
      slug: "power-generator",
      icon: "⚡",
      group: "Technical Infrastructure",
      description: "Silent generators from 5 KVA to 62.5 KVA, electrical wiring, and power backup.",
      order: 6,
    },
    subcategories: [
      "Generator (5 KVA / 10 KVA / 25 KVA / 62.5 KVA)",
      "Silent Generator",
      "Power Backup",
      "Electrical Wiring",
      "Distribution Board",
      "Professional Electrician",
    ],
  },
  {
    category: {
      name: "Additional Facilities",
      slug: "additional-facilities",
      icon: "🏢",
      group: "Venue Infrastructure",
      description: "Green rooms, portable washrooms, AC units, barricading, and parking setups.",
      order: 7,
    },
    subcategories: [
      "Green Room",
      "Changing Room",
      "VIP Guest Area",
      "Portable Fans",
      "Air Coolers",
      "Air Conditioners",
      "Portable Washroom",
      "Waterproof Flooring",
      "Barricading",
      "Parking Arrangement",
    ],
  },
];

const INITIAL_FACILITIES = [
  { name: "Green Room", group: "Additional Facilities", icon: "🚪" },
  { name: "Changing Room", group: "Additional Facilities", icon: "👗" },
  { name: "VIP Guest Area", group: "Additional Facilities", icon: "⭐" },
  { name: "Portable Fans", group: "Additional Facilities", icon: "🌀" },
  { name: "Air Coolers", group: "Additional Facilities", icon: "💨" },
  { name: "Air Conditioners", group: "Additional Facilities", icon: "❄️" },
  { name: "Portable Washroom", group: "Additional Facilities", icon: "🚻" },
  { name: "Waterproof Flooring", group: "Additional Facilities", icon: "🧱" },
  { name: "Barricading", group: "Additional Facilities", icon: "🚧" },
  { name: "Parking Arrangement", group: "Additional Facilities", icon: "🅿️" },
  { name: "Valet Parking Available", group: "Popular Amenities", icon: "🚗" },
  { name: "In-House Catering Available", group: "Popular Amenities", icon: "🍽️" },
  { name: "Outside Catering Permitted", group: "Popular Amenities", icon: "🍲" },
  { name: "DJ & Sound System Allowed", group: "Popular Amenities", icon: "🎶" },
  { name: "Power Backup Generator", group: "Popular Amenities", icon: "⚡" },
  { name: "Hawan & Pheras Permitted", group: "Popular Amenities", icon: "🔥" },
  { name: "Overnight Wedding Permitted", group: "Popular Amenities", icon: "🌙" },
];

async function seed() {
  const { dbConnect } = await import("../lib/db.js");
  const Category = (await import("../models/Category.js")).default;
  const Subcategory = (await import("../models/Subcategory.js")).default;
  const Facility = (await import("../models/Facility.js")).default;

  await dbConnect();
  console.log("Connected to MongoDB for catalogue seeding...");

  let seededCats = 0;
  let seededSubcats = 0;
  let seededFacilities = 0;

  for (const block of CATALOGUE_DATA) {
    const catData = block.category;
    let cat = await Category.findOne({ slug: catData.slug });
    if (!cat) {
      cat = await Category.create(catData);
      console.log(`+ Created Category: ${cat.name}`);
      seededCats++;
    } else {
      cat.icon = catData.icon;
      cat.group = catData.group;
      cat.order = catData.order;
      await cat.save();
    }

    for (let i = 0; i < block.subcategories.length; i++) {
      const subName = block.subcategories[i];
      const subSlug = slugify(subName);

      let sub = await Subcategory.findOne({ slug: subSlug, category: cat._id });
      if (!sub) {
        await Subcategory.create({
          name: subName,
          slug: subSlug,
          category: cat._id,
          categorySlug: cat.slug,
          order: i + 1,
          active: true,
        });
        seededSubcats++;
      }
    }
  }

  for (let i = 0; i < INITIAL_FACILITIES.length; i++) {
    const fac = INITIAL_FACILITIES[i];
    const facSlug = slugify(fac.name);

    let existing = await Facility.findOne({ slug: facSlug });
    if (!existing) {
      await Facility.create({
        name: fac.name,
        slug: facSlug,
        group: fac.group,
        icon: fac.icon,
        order: i + 1,
        active: true,
      });
      seededFacilities++;
    }
  }

  console.log(`Catalogue seed complete! Added ${seededCats} categories, ${seededSubcats} subcategories, ${seededFacilities} facilities.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});

