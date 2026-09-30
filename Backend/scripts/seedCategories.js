import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Category from "../models/Category.js";

export const WEDDING_CATEGORIES = [
  {
    name: "Venues",
    slug: "venues",
    description:
      "Banquet halls, hotels, marriage lawns, resorts, and community halls for weddings and events.",
    order: 1,
    image: "/images/categories/venues.jpg",
  },

  {
    name: "Home Setup – Pandal / Tent / DJ / Full Ghar Setup",
    slug: "home-setup-pandal-tent-dj",
    description:
      "Pandal and tent setup, wedding lighting, DJ and sound systems, and complete ghar pe shaadi packages.",
    order: 2,
    image: "/images/categories/home-setup.jpg",
  },

  {
    name: "Planning & Decor",
    slug: "planning-decor",
    description:
      "Wedding planners and decorators for stage, entry, seating, floral decorations, themes, and complete event styling.",
    order: 3,
    image: "/images/categories/planning-decor.jpg",
  },

  {
    name: "Photographer & Videographer",
    slug: "photographer-videographer",
    description:
      "Wedding photography, candid photography, cinematic wedding films, traditional coverage, and pre-wedding shoots.",
    order: 4,
    image: "/images/categories/photography.jpg",
  },

  {
    name: "Makeup & Grooming",
    slug: "makeup-grooming",
    description:
      "Bridal makeup, groom makeup and styling, hair styling, beauty services, and professional grooming.",
    order: 5,
    image: "/images/categories/makeup-grooming.jpg",
  },

  {
    name: "Mehndi Services",
    slug: "mehndi-services",
    description:
      "Professional mehndi artists and teams offering bridal mehndi, guest mehndi, Arabic, Rajasthani, and traditional designs.",
    order: 6,
    image: "/images/categories/mehndi.jpg",
  },

  {
    name: "Music & Dance",
    slug: "music-dance",
    description:
      "Orchestra, nautanki, baraati dance groups, live bands, singers, DJs, and folk dance groups for wedding celebrations.",
    order: 7,
    image: "/images/categories/music-dance.jpg",
  },

  {
    name: "Pandit / Priest",
    slug: "pandit-priest",
    description:
      "Experienced pandits and priests for different wedding rituals, languages, traditions, and sampraday.",
    order: 8,
    image: "/images/categories/pandit-priest.jpg",
  },

  {
    name: "Food / Catering",
    slug: "food-catering",
    description:
      "Full catering, per-plate services, halwai, home cooks, traditional Bihari and UP cuisine, vegetarian and non-vegetarian food, and sweets.",
    order: 9,
    image: "/images/categories/food-catering.jpg",
  },

  {
    name: "Invites & Gifts",
    slug: "invites-gifts",
    description:
      "Printed wedding cards, digital e-invites, return gifts, wedding favours, personalized gifts, and gift hampers.",
    order: 10,
    image: "/images/categories/invites-gifts.jpg",
  },

  {
    name: "Transport – Car / Bus / Auto",
    slug: "transport-car-bus-auto",
    description:
      "Barat cars, tempo travellers, buses, autos, and small guest vehicles with date and time-based booking options.",
    order: 11,
    image: "/images/categories/transport.jpg",
  },

  {
    name: "Virtual Planning",
    slug: "virtual-planning",
    description:
      "Online wedding consultation, virtual planning sessions, vendor guidance, and remote wedding planning packages.",
    order: 12,
    image: "/images/categories/virtual-planning.jpg",
  },
];
export async function seedCategories() {
  await dbConnect();
  console.log(`Seeding / updating ${WEDDING_CATEGORIES.length} Flipsaura Wedding Categories...`);
  
  const validSlugs = WEDDING_CATEGORIES.map((c) => c.slug);
  const deleteResult = await Category.deleteMany({ slug: { $nin: validSlugs } });
  if (deleteResult.deletedCount > 0) {
    console.log(`🗑️ Removed ${deleteResult.deletedCount} outdated categories.`);
  }

  let count = 0;
  for (const cat of WEDDING_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          description: cat.description,
          order: cat.order,
          image: cat.image,
          active: true,
        },
      },
      { upsert: true, new: true }
    );
    count++;
  }
  console.log(`✅ Successfully seeded/updated ${count} categories.`);
}

if (process.argv[1]?.endsWith("seedCategories.js")) {
  seedCategories()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Failed to seed categories:", err);
      process.exit(1);
    });
}
