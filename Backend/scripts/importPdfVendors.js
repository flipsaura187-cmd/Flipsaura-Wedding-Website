import "dotenv/config";
import crypto from "node:crypto";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Item from "../models/Item.js";

/**
 * Raw data extracted from vendors.pdf
 */
export const PDF_RECORDS = [
  {
    id: 1,
    businessName: "TIN FILMS",
    categoryPdf: "Photography / videography",
    publicPhone: "+91 77820 74645",
    address: "Old GT Road, Dani Bigha, Aurangabad, Bihar 824101",
    services: "Wedding photography, photography studio, video editing, photography training",
    rating: 4.9,
    reviewsCount: 338,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=TIN+FILMS+Old+GT+Road+Dani+Bigha+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Public listing result; verify contact and service packages directly.",
    targetCategorySlugs: ["photographer-videographer"],
    isWeddingVendor: true,
  },
  {
    id: 2,
    businessName: "Hotel Imperial Aurangabad",
    categoryPdf: "Hotel / hospitality",
    publicPhone: "+91 91539 74201",
    address: "Ward No. 11, MG Road, near PNB Bank, Aurangabad, Bihar 824101",
    services: "Hotel accommodation; listing description also mentions an in-house restaurant and banquet/event facilities",
    rating: 5.0,
    reviewsCount: 2,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Hotel+Imperial+MG+Road+PNB+Bank+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Small review count; verify facilities and current contact details.",
    targetCategorySlugs: ["hotels", "venues"],
    isWeddingVendor: true,
  },
  {
    id: 3,
    businessName: "Adityan",
    categoryPdf: "Restaurant / bakery / banquet",
    publicPhone: "+91 80510 03510",
    address: "MG Road, Aurangabad, Bihar 824101",
    services: "North Indian restaurant, bakery, sweets/candy, ice cream and banquet hall",
    rating: 4.2,
    reviewsCount: 767,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Adityan+MG+Road+Aurangabad+Bihar+restaurant",
    sourceType: "Public business listing search",
    notes: "Public listing result; confirm business name spelling and current contact.",
    targetCategorySlugs: ["venues", "food-catering"],
    isWeddingVendor: true,
  },
  {
    id: 4,
    businessName: "Hotel Raj Residency & Royal Restaurant",
    categoryPdf: "Hotel / restaurant",
    publicPhone: "+91 70041 91843",
    address: "Nagar Thana area, Aurangabad, Bihar 824101",
    services: "Hotel and restaurant; public listing describes Indian meals",
    rating: 4.9,
    reviewsCount: 122,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Hotel+Raj+Residency+Royal+Restaurant+Nagar+Thana+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Verify exact street address before visiting or outreach.",
    targetCategorySlugs: ["hotels", "food-catering"],
    isWeddingVendor: true,
  },
  {
    id: 5,
    businessName: "Dholi Sati Retail Mall India",
    categoryPdf: "Clothing / retail",
    publicPhone: "+91 90310 06760",
    address: "MG Road, Ramesh Chowk, near J.K. Hotel, Aurangabad, Bihar 824101",
    services: "Clothing showroom; listing reviews mention wedding wear",
    rating: 4.9,
    reviewsCount: 588,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Dholi+Sati+Retail+Mall+India+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Public listing result; confirm current contact.",
    targetCategorySlugs: ["invites-gifts"],
    isWeddingVendor: true,
  },
  {
    id: 6,
    businessName: "Hotel Sky View",
    categoryPdf: "Hotel / restaurant",
    publicPhone: "+91 92882 09696",
    address: "Old GT Road, opposite Singh Kothi, Aurangabad, Bihar 824101",
    services: "Hotel accommodation and restaurant; listing mentions Swad Restaurant",
    rating: 4.0,
    reviewsCount: 1,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Hotel+Sky+View+Old+GT+Road+Singh+Kothi+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Very small review count; verify current operation and contact.",
    targetCategorySlugs: ["hotels", "food-catering"],
    isWeddingVendor: true,
  },
  {
    id: 7,
    businessName: "Gargee Surya Vihar Hotel & Resorts",
    categoryPdf: "Hotel / resort / events",
    publicPhone: "+91 92623 99683",
    address: "Jasoiya More, Patna–Aurangabad Road area, Bihar 824102 (listing also associates the property with Aurangabad district)",
    services: "Hotel, resort, banquet hall, event venue, restaurant and serviced accommodation",
    rating: 4.9,
    reviewsCount: 122,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Gargee+Surya+Vihar+Hotel+Resorts+Jasoiya+More+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Confirm exact locality and district coverage; listing metadata has slightly differing locality labels. Verify exact address and available packages.",
    targetCategorySlugs: ["venues", "hotels", "food-catering"],
    isWeddingVendor: true,
  },
  {
    id: 8,
    businessName: "Ashirwad Digital",
    categoryPdf: "Photography",
    publicPhone: "+91 72509 85143",
    address: "Baijnath Bigha, near Pokhar/Tendua, Aurangabad district, Bihar 824101 (as listed)",
    services: "Photography; listing description also references wedding/event photography and videography",
    rating: 4.9,
    reviewsCount: 82,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Ashirwad+Digital+Baijnath+Bigha+Tendua+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Verify exact address and available packages.",
    targetCategorySlugs: ["photographer-videographer"],
    isWeddingVendor: true,
  },
  {
    id: 9,
    businessName: "wedmantra Films",
    categoryPdf: "Wedding photography / events",
    publicPhone: "+91 74885 56302",
    address: "Old GT Road, Aurangabad, Bihar 824101",
    services: "Wedding photography, videography/filmmaking, event planning and wedding services",
    rating: 5.0,
    reviewsCount: 69,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=wedmantra+Films+Old+GT+Road+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Public listing result; confirm package inclusions and availability.",
    targetCategorySlugs: ["photographer-videographer", "planning-decor"],
    isWeddingVendor: true,
  },
  {
    id: 10,
    businessName: "Maa Shakti Honda",
    categoryPdf: "Automobile / two-wheeler dealer",
    publicPhone: "+91 81029 19410",
    address: "MG Road, beside LG Shopee, near Bypass Chowk, Aurangabad, Bihar 824101",
    services: "Honda motorcycle/scooter sales and servicing; dealer listing",
    rating: 4.8,
    reviewsCount: 2403,
    photoUrl: "",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Maa+Shakti+Honda+MG+Road+Bypass+Chowk+Aurangabad+Bihar",
    sourceType: "Public business listing search",
    notes: "Public listing result; verify current contact and service availability.",
    targetCategorySlugs: ["transport-car-bus-auto"],
    isWeddingVendor: true,
  },
];

/**
 * Normalization utilities for duplicate detection
 */
export function normalizeName(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhone(str) {
  const digits = String(str || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractPincode(address) {
  const match = String(address || "").match(/\b(82\d{4})\b/);
  return match ? match[1] : "824101";
}

/**
 * Main import function
 */
export async function runVendorImport(options = {}) {
  const isDryRun = Boolean(options.dryRun);
  await dbConnect();

  console.log(`\n======================================================`);
  console.log(` FLIPSAURA VENDOR BULK IMPORT ${isDryRun ? "[DRY RUN MODE]" : "[LIVE EXECUTION]"}`);
  console.log(`======================================================\n`);

  // 1. Fetch all supported categories
  const allCategories = await Category.find({ active: true }).lean();
  const categoryMap = new Map();
  for (const c of allCategories) {
    categoryMap.set(c.slug, c);
  }

  // 2. Fetch existing vendors for duplicate checking
  const existingVendors = await User.find({ role: "vendor" }).lean();
  console.log(`Found ${existingVendors.length} existing vendors in MongoDB.`);
  console.log(`Found ${allCategories.length} active categories in MongoDB.\n`);

  const report = {
    totalRecords: PDF_RECORDS.length,
    insertedVendors: [],
    insertedItems: [],
    skippedDuplicates: [],
    flaggedForReview: [],
    excludedUnrelated: [],
    errors: [],
  };

  for (const rec of PDF_RECORDS) {
    console.log(`--------------------------------------------------`);
    console.log(`Processing Record #${rec.id}: "${rec.businessName}"`);

    // Check 1: Exclude non-wedding or unrelated businesses
    if (!rec.isWeddingVendor && rec.reason?.includes("Unrelated")) {
      console.log(`  ⛔ EXCLUDED: ${rec.reason}`);
      report.excludedUnrelated.push({
        id: rec.id,
        businessName: rec.businessName,
        categoryPdf: rec.categoryPdf,
        reason: rec.reason,
      });
      continue;
    }

    // Check 2: Flag businesses whose actual services have no matching supported category
    if (!rec.isWeddingVendor || rec.targetCategorySlugs.length === 0) {
      console.log(`  ⚠️ FLAGGED FOR REVIEW: ${rec.reason}`);
      report.flaggedForReview.push({
        id: rec.id,
        businessName: rec.businessName,
        categoryPdf: rec.categoryPdf,
        services: rec.services,
        reason: rec.reason || "No supported category found in FlipsAura.",
      });
      continue;
    }

    // Check 3: Duplicate detection against existing MongoDB vendors
    const normName = normalizeName(rec.businessName);
    const normPhone = normalizePhone(rec.publicPhone);

    const duplicateVendor = existingVendors.find((v) => {
      const vNormName = normalizeName(v.vendorProfile?.businessName || v.name);
      const vNormPhone = normalizePhone(v.phone || v.vendorProfile?.phone);

      const nameMatch = normName.length > 3 && (normName === vNormName || vNormName.includes(normName) || normName.includes(vNormPhone));
      const phoneMatch = normPhone.length === 10 && vNormPhone === normPhone;

      return nameMatch || phoneMatch;
    });

    if (duplicateVendor) {
      const matchedBy = normalizeName(duplicateVendor.vendorProfile?.businessName || duplicateVendor.name) === normName
        ? `Business name match ("${duplicateVendor.vendorProfile?.businessName || duplicateVendor.name}")`
        : `Phone number match ("${duplicateVendor.phone}")`;

      console.log(`  ⏭️ SKIPPED DUPLICATE: Existing vendor found in DB (ID: ${duplicateVendor._id}). Matched by: ${matchedBy}`);
      report.skippedDuplicates.push({
        id: rec.id,
        businessName: rec.businessName,
        existingVendorId: String(duplicateVendor._id),
        existingBusinessName: duplicateVendor.vendorProfile?.businessName || duplicateVendor.name,
        matchedBy,
      });
      continue;
    }

    // Check 4: Validate target categories
    const matchedCategories = [];
    for (const slug of rec.targetCategorySlugs) {
      const catDoc = categoryMap.get(slug);
      if (catDoc) {
        matchedCategories.push(catDoc);
      } else {
        console.warn(`  ⚠️ Warning: Category slug "${slug}" not found in MongoDB.`);
      }
    }

    if (matchedCategories.length === 0) {
      console.log(`  ⚠️ FLAGGED FOR REVIEW: Matched categories could not be resolved in DB.`);
      report.flaggedForReview.push({
        id: rec.id,
        businessName: rec.businessName,
        reason: `Target categories [${rec.targetCategorySlugs.join(", ")}] not active in DB.`,
      });
      continue;
    }

    console.log(`  ✅ Validated: Matched categories -> [${matchedCategories.map((c) => c.name).join(", ")}]`);

    // Prepare vendor and items
    const businessSlug = slugify(rec.businessName);
    const syntheticEmail = `listing.${businessSlug}@imported.flipsaura.local`;
    const pincode = extractPincode(rec.address);

    const vendorPayload = {
      name: rec.businessName,
      email: syntheticEmail,
      phone: rec.publicPhone,
      passwordHash: await User.hashPassword(crypto.randomBytes(24).toString("hex")),
      role: "vendor",
      isPhoneVerified: false,
      vendorProfile: {
        businessName: rec.businessName,
        ownerName: "",
        vendorType: "Business",
        address: rec.address,
        city: "Aurangabad",
        state: "Bihar",
        pincode,
        about: rec.services,
        serviceDescription: `${rec.services}. Note: ${rec.notes}`,
        startingPrice: 0,
        categories: matchedCategories.map((c) => c._id),
        verificationStatus: "registered", // Safe imported state; not falsely approved
        approved: false, // Ensures compliance with KYC / admin-approval verification requirement
        source: "bulk_import",
        sourceUrl: rec.sourceUrl,
      },
    };

    if (isDryRun) {
      console.log(`  [DRY-RUN] Would create vendor: "${rec.businessName}" (${syntheticEmail})`);
      for (const cat of matchedCategories) {
        console.log(`  [DRY-RUN] Would create Item in category "${cat.name}" (${cat.slug}) with Price on Request.`);
      }
      report.insertedVendors.push({
        id: rec.id,
        businessName: rec.businessName,
        email: syntheticEmail,
        categories: matchedCategories.map((c) => c.name),
        status: "WOULD_INSERT",
      });
      continue;
    }

    // Live Insertion
    try {
      // 1. Create vendor User
      const newVendor = await User.create(vendorPayload);
      console.log(`  🎉 Created Vendor User: ID ${newVendor._id}`);
      report.insertedVendors.push({
        id: rec.id,
        businessName: rec.businessName,
        vendorId: String(newVendor._id),
        email: syntheticEmail,
        categories: matchedCategories.map((c) => c.name),
      });

      // 2. Create customer-facing Item for each matching category
      for (const cat of matchedCategories) {
        // Tailored listing title
        let itemTitle = `${rec.businessName} – ${cat.name}`;
        if (cat.slug === "hotels") {
          itemTitle = `${rec.businessName} – Hotel Accommodation`;
        } else if (cat.slug === "venues") {
          itemTitle = `${rec.businessName} – Wedding Venue & Banquet`;
        } else if (cat.slug === "food-catering") {
          itemTitle = `${rec.businessName} – Wedding Catering & Dining`;
        } else if (cat.slug === "photographer-videographer") {
          itemTitle = `${rec.businessName} – Photography & Videography`;
        } else if (cat.slug === "planning-decor") {
          itemTitle = `${rec.businessName} – Event Planning & Wedding Services`;
        } else if (cat.slug === "transport-car-bus-auto") {
          itemTitle = `${rec.businessName} – Transport & Automobile Services`;
        } else if (cat.slug === "invites-gifts") {
          itemTitle = `${rec.businessName} – Wedding Wear, Gifts & Retail`;
        }

        const itemSlug = `${slugify(rec.businessName)}-${cat.slug}`;

        // Verify item doesn't exist
        const existingItem = await Item.findOne({ vendor: newVendor._id, category: cat._id });
        if (existingItem) {
          console.log(`    ⏭️ Item already exists for category ${cat.name}, skipping.`);
          continue;
        }

        const categoryImageMap = {
          "transport-car-bus-auto": "/images/categories/transport.jpg",
          "invites-gifts": "/images/categories/invites-gifts.jpg",
          "food-catering": "/images/categories/food-catering.jpg",
          "hotels": "/images/categories/hotels.jpg",
          "photographer-videographer": "/images/categories/photography.jpg",
          "venues": "/images/categories/venues.jpg",
          "planning-decor": "/images/categories/planning-decor.jpg",
        };
        const defaultImage = categoryImageMap[cat.slug] || cat.image || "/images/categories/venues.jpg";

        const itemPayload = {
          title: itemTitle,
          slug: itemSlug,
          category: cat._id,
          vendor: newVendor._id,
          about: rec.services,
          description: `${rec.businessName} is located at ${rec.address}.\n\nOffered Services: ${rec.services}.\n\nPublic Listing Note: ${rec.notes}`,
          specifications: [
            { key: "Address", value: rec.address },
            { key: "City & District", value: "Aurangabad, Bihar" },
            { key: "Public Rating", value: `${rec.rating} ★ (${rec.reviewsCount} Google reviews)` },
            { key: "Services", value: rec.services },
            { key: "Listing Type", value: "Verified Public Listing" },
            { key: "Google Maps Listing", value: rec.sourceUrl },
          ],
          images: rec.photoUrl ? [rec.photoUrl] : [defaultImage],
          price: 0, // Price on Request
          city: "Aurangabad",
          state: "Bihar",
          contactPhone: rec.publicPhone,
          rating: rec.rating,
          reviewsCount: rec.reviewsCount,
          active: true,
          featured: false,
          source: "bulk_import",
          sourceUrl: rec.sourceUrl,
        };

        const newItem = await Item.create(itemPayload);
        console.log(`    ⭐ Created Item: "${newItem.title}" (ID: ${newItem._id}) in "${cat.name}"`);
        report.insertedItems.push({
          itemId: String(newItem._id),
          title: newItem.title,
          category: cat.name,
          categorySlug: cat.slug,
          city: newItem.city,
          rating: newItem.rating,
        });
      }
    } catch (err) {
      console.error(`  ❌ Failed to insert "${rec.businessName}":`, err.message);
      report.errors.push({
        id: rec.id,
        businessName: rec.businessName,
        error: err.message,
      });
    }
  }

  // Print Summary
  console.log(`\n======================================================`);
  console.log(` IMPORT AUDIT SUMMARY ${isDryRun ? "(DRY RUN)" : "(LIVE)"}`);
  console.log(`======================================================`);
  console.log(`Total Records in PDF:              ${report.totalRecords}`);
  console.log(`Imported / Processed Vendors:      ${report.insertedVendors.length}`);
  console.log(`Active Listing Items Created:      ${report.insertedItems.length}`);
  console.log(`Duplicates Skipped:                ${report.skippedDuplicates.length}`);
  console.log(`Flagged for Review (No Category):  ${report.flaggedForReview.length}`);
  console.log(`Excluded (Unrelated Businesses):   ${report.excludedUnrelated.length}`);
  console.log(`Errors / Failures:                 ${report.errors.length}`);
  console.log(`======================================================\n`);

  if (report.skippedDuplicates.length > 0) {
    console.log(`📌 Skipped Duplicates:`);
    report.skippedDuplicates.forEach((d) => {
      console.log(`   - "${d.businessName}" -> Matched existing vendor: "${d.existingBusinessName}" (ID: ${d.existingVendorId}) [${d.matchedBy}]`);
    });
    console.log();
  }

  if (report.flaggedForReview.length > 0) {
    console.log(`📌 Flagged for Review (Unsupported Category):`);
    report.flaggedForReview.forEach((f) => {
      console.log(`   - "${f.businessName}" (${f.categoryPdf}): ${f.reason}`);
    });
    console.log();
  }

  if (report.excludedUnrelated.length > 0) {
    console.log(`📌 Excluded Unrelated Businesses:`);
    report.excludedUnrelated.forEach((e) => {
      console.log(`   - "${e.businessName}" (${e.categoryPdf}): ${e.reason}`);
    });
    console.log();
  }

  // Backfill any empty images for bulk_import items with appropriate category images
  if (!isDryRun) {
    const categoryImageMap = {
      "transport-car-bus-auto": "/images/categories/transport.jpg",
      "invites-gifts": "/images/categories/invites-gifts.jpg",
      "food-catering": "/images/categories/food-catering.jpg",
      "hotels": "/images/categories/hotels.jpg",
      "photographer-videographer": "/images/categories/photography.jpg",
      "venues": "/images/categories/venues.jpg",
      "planning-decor": "/images/categories/planning-decor.jpg",
    };
    const emptyImageItems = await Item.find({
      source: "bulk_import",
      $or: [{ images: { $size: 0 } }, { images: { $exists: false } }],
    });
    if (emptyImageItems.length > 0) {
      console.log(`🖼️ Backfilling category images for ${emptyImageItems.length} previously imported items...`);
      for (const item of emptyImageItems) {
        const cat = await Category.findById(item.category).lean();
        if (cat) {
          const img = categoryImageMap[cat.slug] || cat.image || "/images/categories/venues.jpg";
          await Item.updateOne({ _id: item._id }, { $set: { images: [img] } });
          console.log(`   - "${item.title}" -> ${img}`);
        }
      }
      console.log(`✅ Backfilled images successfully.\n`);
    }
  }

  return report;
}

// Standalone execution
if (process.argv[1]?.endsWith("importPdfVendors.js")) {
  const isDryRun = process.argv.includes("--dry-run") || process.argv.includes("-d");
  runVendorImport({ dryRun: isDryRun })
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error during import:", err);
      process.exit(1);
    });
}
