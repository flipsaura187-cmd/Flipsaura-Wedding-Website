import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Category from "../models/Category.js";

export const WEDDING_CATEGORIES = [
  {
    name: "Wedding Venues",
    slug: "wedding-venues",
    description: "Banquet halls, lawns, resorts, luxury hotels, and heritage palaces for your dream wedding.",
    order: 1,
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
  },
  {
    name: "Wedding Planners",
    slug: "wedding-planners",
    description: "Expert wedding planners and coordinators to organize flawless ceremonies and receptions.",
    order: 2,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
  },
  {
    name: "Wedding Decor & Decoration",
    slug: "wedding-decor-decoration",
    description: "Floral decorations, theme setups, mandap designs, lighting, and ambient styling.",
    order: 3,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
  },
  {
    name: "Wedding Photographers & Videographers",
    slug: "wedding-photographers-videographers",
    description: "Candid photography, cinematic wedding films, pre-wedding shoots, and traditional coverage.",
    order: 4,
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800",
  },
  {
    name: "Bridal Makeup & Beauty",
    slug: "bridal-makeup-beauty",
    description: "Professional bridal hair styling, HD makeup, airbrush makeup, and pre-bridal grooming.",
    order: 5,
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800",
  },
  {
    name: "Mehndi Artists",
    slug: "mehndi-artists",
    description: "Intricate bridal mehndi, Arabic patterns, Rajasthani designs, and guest henna services.",
    order: 6,
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800",
  },
  {
    name: "Bridal Wear",
    slug: "bridal-wear",
    description: "Designer bridal lehengas, sarees, gowns, reception dresses, and customized bridal couture.",
    order: 7,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800",
  },
  {
    name: "Groom Wear",
    slug: "groom-wear",
    description: "Sherwanis, bandhgalas, tuxedos, indo-western suits, and royal accessories for grooms.",
    order: 8,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
  },
  {
    name: "Jewellery & Accessories",
    slug: "jewellery-accessories",
    description: "Kundan, Polki, Diamond, Gold bridal jewellery, matha patti, kaliras, and footwear.",
    order: 9,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
  },
  {
    name: "Catering & Wedding Food",
    slug: "catering-wedding-food",
    description: "Multi-cuisine catering, live food counters, gourmet royal buffets, and custom menus.",
    order: 10,
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
  },
  {
    name: "Wedding Invitations & Cards",
    slug: "wedding-invitations-cards",
    description: "Designer printed cards, digital video invites, personalized wedding stationery, and boxes.",
    order: 11,
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800",
  },
  {
    name: "Music, DJ & Entertainment",
    slug: "music-dj-entertainment",
    description: "Wedding DJs, live music bands, acoustic singers, dhol players, and celebrity artists.",
    order: 12,
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
  },
  {
    name: "Wedding Choreographers",
    slug: "wedding-choreographers",
    description: "Sangeet choreography, couple dance routines, family performances, and flash mobs.",
    order: 13,
    image: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800",
  },
  {
    name: "Wedding Cars & Transportation",
    slug: "wedding-cars-transportation",
    description: "Vintage cars, luxury sedans, bridal procession convoys, and guest shuttle buses.",
    order: 14,
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
  },
  {
    name: "Hotels & Guest Accommodation",
    slug: "hotels-guest-accommodation",
    description: "Comfortable guest stays, room block bookings, hospitality management, and resorts.",
    order: 15,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
  },
  {
    name: "Wedding Cakes & Desserts",
    slug: "wedding-cakes-desserts",
    description: "Custom multi-tier wedding cakes, dessert bars, customized chocolates, and sweet hampers.",
    order: 16,
    image: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=800",
  },
  {
    name: "Wedding Gifts & Return Gifts",
    slug: "wedding-gifts-return-gifts",
    description: "Thoughtful wedding favors, customized gift hampers, dry fruit boxes, and keepsakes.",
    order: 17,
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800",
  },
  {
    name: "Pandits & Wedding Ritual Services",
    slug: "pandits-wedding-ritual-services",
    description: "Experienced Vedic pandits, priests, puja materials, and customized wedding ritual samagri.",
    order: 18,
    image: "https://images.unsplash.com/photo-1609137144820-21a48c66db9b?w=800",
  },
  {
    name: "Fireworks & Special Effects",
    slug: "fireworks-special-effects",
    description: "Cold pyros, dry ice clouds, smoke entries, confetti blasts, and safe fireworks displays.",
    order: 19,
    image: "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=800",
  },
  {
    name: "Other Wedding Services",
    slug: "other-wedding-services",
    description: "Turban/Safa tying, security bouncers, drone pilots, photobooths, and valet services.",
    order: 20,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
  },
];

export async function seedCategories() {
  await dbConnect();
  console.log("Seeding / updating 20 Flipsaura Wedding Categories...");
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
