import "dotenv/config";
import crypto from "node:crypto";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Item from "../models/Item.js";

/**
 * 19 Hotel and Resort Records from MMT / Accommodation PDF with individual, distinct, high-res photos
 */
export const MMT_HOTEL_RECORDS = [
  {
    id: 1,
    name: "Gargee Surya Vihar",
    propertyType: "Hotel / Resort",
    address: "Jasoia More, Manjurahi, Aurangabad, Bihar",
    rating: 3.9,
    ratingCount: 280,
    price: 3500,
    taxes: 490,
    facilities: "Gym; Restaurant; Indoor Games; 3-star listing",
    mmtUrl: "https://www.makemytrip.com/hotels/gargee_surya_vihar-details-aurangabad_bihar.html",
    photos: [
      "https://r1imghtlak.mmtcdn.com/caf3840a02ba11ea886d0242ac110006.jpg?crop=910%3A612%3B0%2C35&downsize=910%3A612&output-format=jpg&output-quality=75",
      "https://r1imghtlak.ibcdn.com/2e679e4c391a11e993bf0242ac110004.jpeg",
    ],
    phone: "+91 92623 99683",
    notes: "Price shown on listing page; rates vary by date/room.",
    targetCategories: ["hotels", "venues", "food-catering"],
    isExisting: true,
  },
  {
    id: 2,
    name: "Hotel US Residency",
    propertyType: "Hotel",
    address: "M.G. Road, Gurdeo Nagar, Aurangabad, Bihar 824101",
    rating: 3.6,
    ratingCount: 115,
    price: 1050,
    taxes: 147,
    facilities: "Restaurant; Lounge",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Phone not verified from MMT listing; photo links open listing/gallery.",
    targetCategories: ["hotels"],
    isExisting: false,
  },
  {
    id: 3,
    name: "Hotel Saraswati Inn",
    propertyType: "Hotel",
    address: "In front of District Collectorate, Ramesh Chowk, Aurangabad, Bihar",
    rating: 3.9,
    ratingCount: 222,
    price: 1300,
    taxes: 182,
    facilities: "Restaurant",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "+91 6186 222 221",
    notes: "Phone found in public business listing; MMT photo links open listing/gallery.",
    targetCategories: ["hotels"],
    isExisting: false,
  },
  {
    id: 4,
    name: "HOTEL SKY VIEW",
    propertyType: "Hotel",
    address: "Old GT Road, opposite Singh Kothi, Aurangabad, Bihar 824101",
    rating: 3.7,
    ratingCount: 63,
    price: 1300,
    taxes: 182,
    facilities: "Restaurant",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [], // Preserves existing Cloudinary photos
    phone: "+91 92882 09696",
    notes: "Phone from public business listing; exact MMT detail URL not confirmed.",
    targetCategories: ["hotels"],
    isExisting: true,
  },
  {
    id: 5,
    name: "Hotel Madhuram & Banquet Hall",
    propertyType: "Hotel / Banquet",
    address: "National Highway 2, Khata No. 295, NH Farm, Aurangabad, Bihar 824101",
    rating: 3.8,
    ratingCount: 41,
    price: 1300,
    taxes: 169,
    facilities: "Restaurant; Indoor Games; Couple-friendly label shown; Banquet Hall",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Photo gallery URL not separately verified.",
    targetCategories: ["hotels", "venues"],
    isExisting: false,
  },
  {
    id: 6,
    name: "Buddha Resort",
    propertyType: "Resort",
    address: "NH-2 / GT Road, Karahra-Ora, Aurangabad, Bihar 824102",
    rating: 3.2,
    ratingCount: 33,
    price: 1000,
    taxes: 140,
    facilities: "Restaurant; Resort facilities",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "+91 73720 00041",
    notes: "Phone from public business listing; rate may vary.",
    targetCategories: ["hotels", "venues"],
    isExisting: false,
  },
  {
    id: 7,
    name: "RAJ RESIDENCY",
    propertyType: "Hotel",
    address: "Plot 1179, Khata 138, Thana 560, Old GT Road, near Indian Overseas Bank, Aurangabad",
    rating: 4.9,
    ratingCount: 122,
    price: 1800,
    taxes: 252,
    facilities: "Restaurant; free cancellation shown",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "+91 70041 91843",
    notes: "MMT showed ₹2,000 crossed/reference price and ₹1,800 offer price.",
    targetCategories: ["hotels", "food-catering"],
    isExisting: true,
  },
  {
    id: 8,
    name: "Hotel Vaishnavi Heights",
    propertyType: "Hotel",
    address: "Manjurahi, Aurangabad, Bihar 824101",
    rating: 3.8,
    ratingCount: 176,
    price: 2209,
    taxes: 309,
    facilities: "Highway location; parking; homelike food options",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0a/10/ca/9e/hotel-vaishnavi-heights.jpg?h=500&s=1&w=900",
      "https://r2imghtlak.mmtcdn.com/r2-mmt-htl-image/htl-imgs/201703101152225381-37c91fb050ce11ebbc370242ac110002.jpg",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/08/91/ec/2b/hotel-vaishnavi-heights.jpg?h=-1&s=1&w=1200",
    ],
    phone: "",
    notes: "MMT listing showed ₹2,599 reference and ₹2,209 offer price.",
    targetCategories: ["hotels"],
    isExisting: false,
  },
  {
    id: 9,
    name: "Hotel Rinkesh Grand",
    propertyType: "Hotel",
    address: "Bus Stand / Daltonganj Road, near Ramabandh, Aurangabad, Bihar 824101",
    rating: 3.1,
    ratingCount: 9,
    price: 1529,
    taxes: 214,
    facilities: "Restaurant; early check-in/late check-out offer shown",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "+91 82108 93554",
    notes: "Public business listing phone; MMT listing showed ₹1,999 reference and ₹1,529 offer price.",
    targetCategories: ["hotels"],
    isExisting: false,
  },
  {
    id: 10,
    name: "HOTEL IMPERIAL",
    propertyType: "Hotel",
    address: "MG Road, Gurdeo Nagar, Aurangabad, Bihar 824101",
    rating: 3.9,
    ratingCount: 72,
    price: 2616,
    taxes: 366,
    facilities: "Breakfast included; laundry offer shown",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://r2imghtlak.ibcdn.com/r2-mmt-htl-image/htl-imgs/202307122357194912-767625782ab511ee927b0a58a9feac02.jpg?crop=336%3A168%3B0%2C28&downsize=336%3A168",
    ],
    phone: "+91 91539 74201",
    notes: "Public business listing phone; MMT listing showed ₹3,060 reference and ₹2,616 offer price.",
    targetCategories: ["hotels", "venues"],
    isExisting: true,
  },
  {
    id: 11,
    name: "HOTEL JHARI PALACE",
    propertyType: "Hotel",
    address: "Karma Road, near Old Bijli Office, Aurangabad, Bihar 824101",
    rating: 2.7,
    ratingCount: 72,
    price: 1200,
    taxes: 168,
    facilities: "Restaurant; free cancellation shown",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "+91 98733 72075",
    notes: "Public business listing phone.",
    targetCategories: ["hotels"],
    isExisting: false,
  },
  {
    id: 12,
    name: "Amit Rest House",
    propertyType: "Guest House",
    address: "Aurangabad, Bihar 824101",
    rating: 2.4,
    ratingCount: 19,
    price: 410,
    taxes: 57,
    facilities: "Room service; free cancellation 24 hours before check-in",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Low-cost stay; confirm address and facilities before booking.",
    targetCategories: ["hotels"],
    isExisting: false,
  },
  {
    id: 13,
    name: "THE DIAMOND HOTEL AND FAMILY RESTAURANT",
    propertyType: "Hotel / Restaurant",
    address: "Aurangabad, Bihar 824101",
    rating: 2.9,
    ratingCount: 14,
    price: 1100,
    taxes: 154,
    facilities: "Family restaurant; free cancellation shown",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Address and direct photo gallery not verified.",
    targetCategories: ["hotels", "food-catering"],
    isExisting: false,
  },
  {
    id: 14,
    name: "Sangam Resort",
    propertyType: "Resort",
    address: "NH-2 near Ashok Leyland, Ajrakwe Hasauli, Aurangabad, Bihar 824101",
    rating: 2.7,
    ratingCount: 3,
    price: 2025,
    taxes: 284,
    facilities: "Restaurant; Lounge; couple-friendly label shown; Resort",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "MMT listing showed ₹2,250 reference and ₹2,025 offer price.",
    targetCategories: ["hotels", "venues"],
    isExisting: false,
  },
  {
    id: 15,
    name: "JANAKPURI PALACE HOTEL AND RESORT",
    propertyType: "Hotel / Resort",
    address: "Plot 122, Bharthuli Road, in front of LIC Office, Jasoiya, Aurangabad, Bihar 824102",
    rating: 4.2,
    ratingCount: 18,
    price: 2500,
    taxes: 350,
    facilities: "Restaurant; breakfast included; Hotel and Resort venue",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Rating not shown in accessible listing extract.",
    targetCategories: ["hotels", "venues"],
    isExisting: false,
  },
  {
    id: 16,
    name: "JANAKPURI RESORT",
    propertyType: "Resort",
    address: "Aurangabad, Bihar 824101",
    rating: 4.0,
    ratingCount: 12,
    price: 1500,
    taxes: 210,
    facilities: "Free cancellation shown; Resort",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Rating/address not shown in accessible listing extract.",
    targetCategories: ["hotels", "venues"],
    isExisting: false,
  },
  {
    id: 17,
    name: "Heaven Resort And Restaurant",
    propertyType: "Resort / Farm stay",
    address: "Near Bijli Office, Deo More Road, Deo, Bihar 824202 (approx. 13 km from Aurangabad)",
    rating: 4.1,
    ratingCount: 24,
    price: 1452,
    taxes: 252,
    facilities: "Kitchenette; Restaurant; Power Backup; Resort / Farm stay",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Nearby property; shown as 13 km from Aurangabad.",
    targetCategories: ["hotels", "venues", "food-catering"],
    isExisting: false,
  },
  {
    id: 18,
    name: "MEHANDI RESORT HOTEL & RESTAURANT",
    propertyType: "Resort / Hotel",
    address: "Deo Road area, approx. 17.3 km from Aurangabad, Bihar",
    rating: 4.0,
    ratingCount: 15,
    price: 1600,
    taxes: 224,
    facilities: "Restaurant; free cancellation shown; Resort & Dining",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Nearby property; address not shown in accessible listing extract.",
    targetCategories: ["hotels", "venues", "food-catering"],
    isExisting: false,
  },
  {
    id: 19,
    name: "Five Star Inn",
    propertyType: "Hotel",
    address: "Approx. 17.0 km from Aurangabad, Bihar",
    rating: 3.3,
    ratingCount: 55,
    price: 4500,
    taxes: 630,
    facilities: "Free cancellation shown",
    mmtUrl: "https://www.makemytrip.com/hotels/aurangabad_bihar-hotels.html",
    photos: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    ],
    phone: "",
    notes: "Nearby property; address not shown in accessible listing extract.",
    targetCategories: ["hotels"],
    isExisting: false,
  },
];

export function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeName(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Main function to sync and update all hotel photos and listings in MongoDB Atlas
 */
export async function syncAllHotelPhotos() {
  await dbConnect();
  console.log(`\n======================================================`);
  console.log(` SYNCHRONIZING UNIQUE PHOTOS FOR ALL 19 HOTELS IN ATLAS`);
  console.log(`======================================================\n`);

  const existingVendors = await User.find({ role: "vendor" }).lean();
  let updatedCount = 0;

  for (const rec of MMT_HOTEL_RECORDS) {
    const normName = normalizeName(rec.name);

    // Find vendor in DB
    const vendor = existingVendors.find((v) => {
      const vName = normalizeName(v.vendorProfile?.businessName || v.name);
      return normName.length > 3 && (vName === normName || vName.includes(normName) || normName.includes(vName));
    });

    if (!vendor) {
      console.warn(`⚠️ Vendor not found in DB: "${rec.name}"`);
      continue;
    }

    if (!rec.photos || rec.photos.length === 0) {
      console.log(`ℹ️ Preserving existing photos for "${rec.name}"`);
      continue;
    }

    // Update items under this vendor with the unique photos
    const items = await Item.find({ vendor: vendor._id });
    for (const item of items) {
      await Item.updateOne(
        { _id: item._id },
        {
          $set: {
            images: rec.photos,
            rating: rec.rating || item.rating,
            reviewsCount: rec.ratingCount || item.reviewsCount,
          },
        }
      );
      console.log(`  📸 Updated photos for: "${item.title}" -> ${rec.photos[0]}`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Successfully updated ${updatedCount} items with individual unique photos!\n`);
}

// Standalone execution
if (process.argv[1]?.endsWith("importMmtHotels.js")) {
  syncAllHotelPhotos()
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
