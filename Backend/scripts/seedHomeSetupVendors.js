import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "Backend/.env") });
import mongoose from "mongoose";

const SAMPLE_HOME_SETUPS = [
  {
    title: "Royal Shamiana & Wedding Tent House – Complete Ghar Setup",
    city: "Daudnagar",
    locality: "Old GT Road, Daudnagar",
    state: "Bihar",
    pincode: "824143",
    price: 35000,
    rentalPrice: 35000,
    contactPhone: "9876543210",
    contactEmail: "royaltent.daudnagar@gmail.com",
    about: "Specialized in luxury German Hanger tents, waterproof pandals, royal shamianas, bride-groom stages, and full wedding home setups in Daudnagar & Aurangabad.",
    description: "Full event equipment and home wedding services including:\n- Waterproof & German Hanger Tent setups\n- Banquet Chairs, VIP Sofas & Round Dining Tables\n- Royal Stage Mandap & Entrance Floral Gate\n- DJ with line array sound system and mic\n- Moving heads and LED serial lights\n- Silent generator 25 KVA power backup\n- Changing rooms & portable washrooms.",
    mainCategories: [
      "Tent & Pandal",
      "Furniture & Seating",
      "Stage & Decoration",
      "DJ & Sound System",
      "Lighting & Special Effects",
      "Power & Generator",
      "Additional Facilities",
    ],
    subcategories: [
      "Waterproof Tent",
      "Royal Shamiana",
      "German Hanger Tent",
      "Plastic & Banquet Chairs",
      "VIP Sofa",
      "Bride & Groom Sofa",
      "Round Dining Tables",
      "Wedding Stage",
      "Floral Decoration",
      "Mandap Decoration",
      "Entrance Gate Decoration",
      "Line Array Sound System",
      "DJ Console",
      "LED Par Lights",
      "Moving Head Lights",
      "Silent Generator",
      "Power Backup",
      "Green Room",
      "Air Coolers",
    ],
    images: [
      "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_home-setup-pandal-tent-dj.png",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.9,
    reviewsCount: 18,
    featured: true,
    active: true,
  },
  {
    title: "Maa Durga Event & Pandal House",
    city: "Patna",
    locality: "Boring Road, Patna",
    state: "Bihar",
    pincode: "800001",
    price: 45000,
    rentalPrice: 45000,
    contactPhone: "9835012345",
    contactEmail: "maadurga.events.patna@gmail.com",
    about: "Patna's premier wedding pandal decorators, German hanger setups, floral mandaps, and high-bass DJ sound systems for grand home weddings.",
    description: "We provide complete home setup equipment for baraat reception, haldi, and wedding ceremonies.\n- Luxury Waterproof Pandal\n- VIP Sofas & Banquet Setup\n- LED Backdrop Stage & Floral Mandap\n- Line Array Sound System & Bass Subwoofer\n- Focus & Laser Disco Lights\n- 62.5 KVA Silent Generator.",
    mainCategories: [
      "Tent & Pandal",
      "Furniture & Seating",
      "Stage & Decoration",
      "DJ & Sound System",
      "Lighting & Special Effects",
      "Power & Generator",
    ],
    subcategories: [
      "Wedding Pandal",
      "Waterproof Tent",
      "VIP Pandal",
      "VIP Sofa",
      "Plastic & Banquet Chairs",
      "Reception Stage",
      "LED Backdrop",
      "Floral Decoration",
      "Professional DJ",
      "Line Array Sound System",
      "Bass & Subwoofer",
      "Moving Head Lights",
      "Laser & Disco Lights",
      "Silent Generator",
    ],
    images: [
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.8,
    reviewsCount: 24,
    featured: true,
    active: true,
  },
  {
    title: "Shree Ram Tent & Sound System",
    city: "Aurangabad",
    locality: "MG Road, Aurangabad",
    state: "Bihar",
    pincode: "824101",
    price: 28000,
    rentalPrice: 28000,
    contactPhone: "9431098765",
    contactEmail: "shreeram.tent@gmail.com",
    about: "All-in-one wedding tent, mandap, sound and lighting contractor for ghar pe shaadi, tilak, and sangeet in Aurangabad district.",
    description: "Offering premium royal shamianas, comfortable banquet dining seating, traditional mandap setups, and DJ with sound operator.",
    mainCategories: [
      "Tent & Pandal",
      "Furniture & Seating",
      "Stage & Decoration",
      "DJ & Sound System",
      "Lighting & Special Effects",
      "Power & Generator",
    ],
    subcategories: [
      "Royal Shamiana",
      "Waterproof Tent",
      "Plastic & Banquet Chairs",
      "Round Dining Tables",
      "Wedding Stage",
      "Theme-Based Decoration",
      "Professional DJ",
      "DJ with Operator",
      "LED Par Lights",
      "Serial Lights",
      "Generator (5 KVA / 10 KVA / 25 KVA / 62.5 KVA)",
    ],
    images: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.7,
    reviewsCount: 12,
    featured: false,
    active: true,
  },
  {
    title: "Celebration Hub – Luxury Stage Mandap & Home Setup",
    city: "Gaya",
    locality: "Civil Lines, Gaya",
    state: "Bihar",
    pincode: "823001",
    price: 52000,
    rentalPrice: 52000,
    contactPhone: "9123456780",
    contactEmail: "celebrationhub.gaya@gmail.com",
    about: "Exclusive thematic floral wedding stages, German hanger waterproof structures, royal shamianas, and complete VIP lounge setups for Gaya weddings.",
    description: "Specialists in turnkey wedding home setups with air conditioners, green rooms, royal bride-groom sofas, and imported lighting.",
    mainCategories: [
      "Tent & Pandal",
      "Furniture & Seating",
      "Stage & Decoration",
      "Lighting & Special Effects",
      "Power & Generator",
      "Additional Facilities",
    ],
    subcategories: [
      "German Hanger Tent",
      "Canopy & Open-Air Tent",
      "VIP Sofa",
      "Bride & Groom Sofa",
      "VIP Lounge Setup",
      "Floral Decoration",
      "Mandap Decoration",
      "Red Carpet & Stage Flooring",
      "Focus Lights",
      "Follow Spot Lights",
      "Silent Generator",
      "Green Room",
      "Air Conditioners",
    ],
    images: [
      "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.9,
    reviewsCount: 31,
    featured: true,
    active: true,
  },
  {
    title: "Bass Beats DJ & Light House",
    city: "Daudnagar",
    locality: "Cinema Road, Daudnagar",
    state: "Bihar",
    pincode: "824143",
    price: 18000,
    rentalPrice: 18000,
    contactPhone: "9988776655",
    contactEmail: "bassbeats.daudnagar@gmail.com",
    about: "Heavy bass line-array DJ setups, moving head truss lighting, cold pyros, wireless microphones, and power backup for baraat & sangeet.",
    description: "Top-tier audio-visual and power infrastructure for home wedding events, sangeet night, and baraat dance.",
    mainCategories: [
      "DJ & Sound System",
      "Lighting & Special Effects",
      "Power & Generator",
    ],
    subcategories: [
      "Professional DJ",
      "Line Array Sound System",
      "Bass & Subwoofer",
      "Professional Speakers",
      "Wireless Microphone",
      "Moving Head Lights",
      "Laser & Disco Lights",
      "Cold Pyro Effects",
      "Silent Generator",
      "Power Backup",
    ],
    images: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
    ],
    rating: 4.8,
    reviewsCount: 15,
    featured: false,
    active: true,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Home Setup vendor seeding...");

  const homeCat = await mongoose.connection.db.collection("categories").findOne({
    slug: "home-setup-pandal-tent-dj"
  });

  if (!homeCat) {
    console.error("Home Setup category not found!");
    process.exit(1);
  }

  for (const setup of SAMPLE_HOME_SETUPS) {
    const existing = await mongoose.connection.db.collection("items").findOne({
      title: setup.title,
      category: homeCat._id
    });

    if (!existing) {
      await mongoose.connection.db.collection("items").insertOne({
        ...setup,
        category: homeCat._id,
        slug: setup.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`+ Seeded Home Setup: ${setup.title}`);
    } else {
      await mongoose.connection.db.collection("items").updateOne(
        { _id: existing._id },
        {
          $set: {
            mainCategories: setup.mainCategories,
            subcategories: setup.subcategories,
            price: setup.price,
            rentalPrice: setup.rentalPrice,
            contactPhone: setup.contactPhone,
            images: setup.images,
            about: setup.about,
            description: setup.description,
            active: true,
          }
        }
      );
      console.log(`✓ Updated Home Setup: ${setup.title}`);
    }
  }

  console.log("✅ Successfully seeded Home Setup listings.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});

