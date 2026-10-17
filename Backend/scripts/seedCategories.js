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
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_venues.png",
  },

  {
    name: "Home Setup – Pandal / Tent / DJ / Full Ghar Setup",
    slug: "home-setup-pandal-tent-dj",
    description:
      "Pandal and tent setup, wedding lighting, DJ and sound systems, and complete ghar pe shaadi packages.",
    order: 2,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_home-setup-pandal-tent-dj.png",
  },

  {
    name: "Planning & Decor",
    slug: "planning-decor",
    description:
      "Wedding planners and decorators for stage, entry, seating, floral decorations, themes, and complete event styling.",
    order: 3,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226357/flipsaura/categories/category_planning-decor.png",
  },

  {
    name: "Photographer & Videographer",
    slug: "photographer-videographer",
    description:
      "Wedding photography, candid photography, cinematic wedding films, traditional coverage, and pre-wedding shoots.",
    order: 4,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226358/flipsaura/categories/category_photographer-videographer.png",
  },

  {
    name: "Makeup & Grooming",
    slug: "makeup-grooming",
    description:
      "Bridal makeup, groom makeup and styling, hair styling, beauty services, and professional grooming.",
    order: 5,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226359/flipsaura/categories/category_makeup-grooming.png",
  },

  {
    name: "Mehndi Services",
    slug: "mehndi-services",
    description:
      "Professional mehndi artists and teams offering bridal mehndi, guest mehndi, Arabic, Rajasthani, and traditional designs.",
    order: 6,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226360/flipsaura/categories/category_mehndi-services.png",
  },

  {
    name: "Music & Dance",
    slug: "music-dance",
    description:
      "Orchestra, nautanki, baraati dance groups, live bands, singers, DJs, and folk dance groups for wedding celebrations.",
    order: 7,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226361/flipsaura/categories/category_music-dance.png",
  },

  {
    name: "Pandit / Priest",
    slug: "pandit-priest",
    description:
      "Experienced pandits and priests for different wedding rituals, languages, traditions, and sampraday.",
    order: 8,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226362/flipsaura/categories/category_pandit-priest.png",
  },

  {
    name: "Food / Catering",
    slug: "food-catering",
    description:
      "Full catering, per-plate services, halwai, home cooks, traditional Bihari and UP cuisine, vegetarian and non-vegetarian food, and sweets.",
    order: 9,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226363/flipsaura/categories/category_food-catering.png",
  },

  {
    name: "Invites & Gifts",
    slug: "invites-gifts",
    description:
      "Printed wedding cards, digital e-invites, return gifts, wedding favours, personalized gifts, and gift hampers.",
    order: 10,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226364/flipsaura/categories/category_invites-gifts.jpg",
  },

  {
    name: "Transport – Car / Bus / Auto",
    slug: "transport-car-bus-auto",
    description:
      "Barat cars, tempo travellers, buses, autos, and small guest vehicles with date and time-based booking options.",
    order: 11,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226365/flipsaura/categories/category_transport-car-bus-auto.png",
  },

  {
    name: "Virtual Planning",
    slug: "virtual-planning",
    description:
      "Online wedding consultation, virtual planning sessions, vendor guidance, and remote wedding planning packages.",
    order: 12,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226366/flipsaura/categories/category_virtual-planning.jpg",
  },

  {
    name: "Hotels",
    slug: "hotels",
    description:
      "Luxury wedding hotels, AC guest rooms for barat and family stays, honeymoon suites, and guest room accommodations.",
    order: 13,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226367/flipsaura/categories/category_hotels.png",
  },

  {
    name: "Orchestra & Live Band",
    slug: "orchestra-live-band",
    description:
      "Grand wedding orchestra, live musical troupes, stage singers, brass band, shehnai, and Bollywood musical performers.",
    order: 14,
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226368/flipsaura/categories/category_orchestra-live-band.png",
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
