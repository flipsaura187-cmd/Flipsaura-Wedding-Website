import { dbConnect } from "../lib/db.js";
import Item from "../models/Item.js";
import Category from "../models/Category.js";
import User from "../models/User.js";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Locate or create the Photographer & Videographer category
 */
async function getPhotographyCategory() {
  let photoCat = await Category.findOne({ slug: "photographer-videographer" });
  if (!photoCat) {
    photoCat = await Category.findOne({ slug: "photography" });
  }
  if (!photoCat) {
    photoCat = await Category.findOne({ name: /photograph/i });
  }
  if (!photoCat) {
    photoCat = await Category.create({
      name: "Photographer & Videographer",
      slug: "photographer-videographer",
      description: "Wedding photography, candid photography, cinematic wedding films, traditional coverage, and pre-wedding shoots.",
      order: 4,
      image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226358/flipsaura/categories/category_photographer-videographer.png",
      active: true,
    });
  }
  return photoCat;
}

/**
 * Admin: List all photography listings with search, filters & statistics
 */
export async function getAdminPhotographies(req, res) {
  try {
    await dbConnect();
    const photoCat = await getPhotographyCategory();

    const { search, city, state, active } = req.query;

    const query = {
      $or: [
        { category: photoCat._id },
        { "photographyPackages.basic.price": { $exists: true } },
      ],
    };

    if (city && city.trim() && city !== "all") {
      query.city = new RegExp(`^${city.trim()}$`, "i");
    }

    if (state && state.trim() && state !== "all") {
      query.state = new RegExp(`^${state.trim()}$`, "i");
    }

    if (active !== undefined && active !== "all") {
      query.active = active === "true" || active === true;
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$and = [
        {
          $or: [
            { title: sRegex },
            { city: sRegex },
            { locality: sRegex },
            { address: sRegex },
            { contactPhone: sRegex },
            { contactEmail: sRegex },
            { about: sRegex },
            { description: sRegex },
          ],
        },
      ];
    }

    const items = await Item.find(query)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate statistics
    const allMatches = await Item.find({
      $or: [
        { category: photoCat._id },
        { "photographyPackages.basic.price": { $exists: true } },
      ],
    })
      .select("city active photographyPackages")
      .lean();

    const citiesSet = new Set();
    let activeCount = 0;
    let totalWithPackages = 0;

    for (const item of allMatches) {
      if (item.city?.trim()) citiesSet.add(item.city.trim());
      if (item.active) activeCount++;
      if (
        item.photographyPackages?.basic?.price > 0 ||
        item.photographyPackages?.standard?.price > 0 ||
        item.photographyPackages?.premium?.price > 0 ||
        item.photographyPackages?.luxury?.price > 0
      ) {
        totalWithPackages++;
      }
    }

    res.json({
      ok: true,
      data: {
        items,
        total: items.length,
        cities: Array.from(citiesSet).sort(),
        stats: {
          total: allMatches.length,
          active: activeCount,
          withPackages: totalWithPackages,
          citiesCount: citiesSet.size,
        },
      },
    });
  } catch (error) {
    console.error("[getAdminPhotographies Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch photography listings" });
  }
}

/**
 * Admin: Get single photography listing detail
 */
export async function getAdminPhotographyDetail(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findById(id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: "Photography listing not found" });
    }

    res.json({ ok: true, data: { item } });
  } catch (error) {
    console.error("[getAdminPhotographyDetail Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch photography details" });
  }
}

/**
 * Admin: Create a new Photography listing
 */
export async function createAdminPhotography(req, res) {
  try {
    await dbConnect();
    const photoCat = await getPhotographyCategory();

    const {
      name,
      title,
      address,
      locality,
      city = "Daudnagar",
      state = "Bihar",
      pincode,
      contactPhone,
      contactEmail,
      photos,
      images,
      albums,
      videos,
      about,
      description,
      packages,
      photographyPackages,
      active = true,
      featured = false,
      rating = 4.8,
      reviewsCount = 0,
    } = req.body;

    const listingName = (name || title || "").trim();
    if (!listingName) {
      return res.status(400).json({ ok: false, error: "Photographer or Studio Name is required" });
    }

    // 1. Resolve or create vendor user
    const safeEmail =
      contactEmail && contactEmail.trim()
        ? contactEmail.trim().toLowerCase()
        : `photo.${slugify(listingName)}.${Date.now().toString().slice(-4)}@flipsaura.local`;

    let vendor = await User.findOne({ email: safeEmail });
    if (!vendor) {
      const defaultHash = await User.hashPassword("Flipsaura@Photo2026");
      vendor = await User.create({
        name: listingName,
        email: safeEmail,
        phone: contactPhone?.trim() || "",
        passwordHash: defaultHash,
        role: "vendor",
        vendorProfile: {
          businessName: listingName,
          ownerName: listingName,
          vendorType: "Business",
          address: address?.trim() || "",
          city: city?.trim() || "",
          state: state?.trim() || "",
          pincode: pincode?.trim() || "",
          about: about?.trim() || description?.trim() || "",
          serviceDescription: description?.trim() || about?.trim() || "",
          serviceLocation: city?.trim() || "",
          categories: [photoCat._id],
          verificationStatus: "approved",
          approved: true,
          reviewedAt: new Date(),
          source: "admin_manual",
        },
      });
    }

    // 2. Format photos / images
    const rawImages = Array.isArray(photos) ? photos : (Array.isArray(images) ? images : []);
    const cleanImages = rawImages.map((img) => String(img).trim()).filter(Boolean);
    if (cleanImages.length === 0) {
      cleanImages.push("https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226358/flipsaura/categories/category_photographer-videographer.png");
    }

    // 3. Format albums
    const formattedAlbums = (Array.isArray(albums) ? albums : [])
      .map((alb) => {
        if (!alb) return null;
        if (typeof alb === "string") {
          return { title: alb.trim(), description: "", coverImage: "", images: [], link: "" };
        }
        return {
          title: (alb.title || alb.name || "").trim(),
          description: (alb.description || "").trim(),
          coverImage: (alb.coverImage || alb.image || "").trim(),
          images: (Array.isArray(alb.images) ? alb.images : []).map((i) => String(i).trim()).filter(Boolean),
          link: (alb.link || alb.url || "").trim(),
        };
      })
      .filter((a) => a && (a.title || a.link || a.images?.length > 0));

    // 4. Format videos
    const formattedVideos = (Array.isArray(videos) ? videos : [])
      .map((vid) => {
        if (!vid) return null;
        if (typeof vid === "string") {
          return { title: "Showcase Video", url: vid.trim() };
        }
        return {
          title: (vid.title || "Showcase Video").trim(),
          url: (vid.url || vid.link || "").trim(),
        };
      })
      .filter((v) => v && v.url);

    // 5. Format packages: Basic, Standard, Premium, Luxury
    const rawPackages = photographyPackages || packages || {};
    const cleanDeliverables = (dList) =>
      (Array.isArray(dList) ? dList : typeof dList === "string" ? dList.split(/[\n,]+/) : [])
        .map((d) => String(d).trim())
        .filter(Boolean);

    const formattedPackages = {
      basic: {
        price: Math.max(0, Number(rawPackages.basic?.price) || 0),
        title: (rawPackages.basic?.title || "Basic Package").trim(),
        description: (rawPackages.basic?.description || "Single event coverage (Pre-wedding or 1 wedding function)").trim(),
        deliverables: cleanDeliverables(rawPackages.basic?.deliverables || [
          "1 Traditional Photographer",
          "All edited high-resolution digital photos",
          "Digital album access",
        ]),
      },
      standard: {
        price: Math.max(0, Number(rawPackages.standard?.price) || 0),
        title: (rawPackages.standard?.title || "Standard Package").trim(),
        description: (rawPackages.standard?.description || "Complete 1-day wedding day photography & traditional videography").trim(),
        deliverables: cleanDeliverables(rawPackages.standard?.deliverables || [
          "1 Candid Photographer + 1 Traditional Videographer",
          "Edited HD Video Highlights (30-45 min)",
          "1 Hardcover Premium Photo Album (30 sheets / 60 pages)",
          "Full raw footage on USB drive",
        ]),
      },
      premium: {
        price: Math.max(0, Number(rawPackages.premium?.price) || 0),
        title: (rawPackages.premium?.title || "Premium Package").trim(),
        description: (rawPackages.premium?.description || "Comprehensive 2-day wedding & sangeet/reception coverage").trim(),
        deliverables: cleanDeliverables(rawPackages.premium?.deliverables || [
          "2 Candid Photographers + 2 Cinematic Videographers",
          "Cinematic Wedding Teaser (3-5 mins) + Full Movie",
          "Drone aerial coverage",
          "2 Luxury Flush-Mount Photo Albums",
        ]),
      },
      luxury: {
        price: Math.max(0, Number(rawPackages.luxury?.price) || 0),
        title: (rawPackages.luxury?.title || "Luxury Package").trim(),
        description: (rawPackages.luxury?.description || "Ultra-luxury multi-day wedding celebration with dedicated crew").trim(),
        deliverables: cleanDeliverables(rawPackages.luxury?.deliverables || [
          "Master Director + 3 Candid Photographers + 3 Cinematographers",
          "4K Cinema Production + Drone Shoots",
          "Pre-Wedding / Post-Wedding Shoot included",
          "3 Handcrafted Leather Royal Albums + Mini Parent Albums",
          "Same-Day Edit / Next-Day Sangeet Teaser Reel",
        ]),
      },
    };

    // Determine starting price (lowest non-zero price among packages)
    const validPrices = [
      formattedPackages.basic.price,
      formattedPackages.standard.price,
      formattedPackages.premium.price,
      formattedPackages.luxury.price,
    ].filter((p) => p > 0);

    const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

    const slug = `${slugify(listingName)}-${slugify(city)}-${Date.now().toString().slice(-4)}`;

    const newItem = await Item.create({
      title: listingName,
      slug,
      category: photoCat._id,
      vendor: vendor._id,
      address: address?.trim() || "",
      locality: locality?.trim() || "",
      city: city.trim(),
      state: state.trim() || "Bihar",
      pincode: pincode?.trim() || "",
      contactPhone: contactPhone?.trim() || vendor.phone || "",
      contactEmail: contactEmail?.trim() || vendor.email || "",
      price: startingPrice,
      about: about?.trim() || `${listingName} is a premier wedding photography and cinematography studio based in ${city}, ${state}.`,
      description: description?.trim() || about?.trim() || `${listingName} captures your unforgettable wedding moments with artistry, cinematic brilliance, and professional dedication.`,
      images: cleanImages,
      albums: formattedAlbums,
      videos: formattedVideos,
      photographyPackages: formattedPackages,
      rating: Math.min(5, Math.max(0, Number(rating) || 4.8)),
      reviewsCount: Math.max(0, Number(reviewsCount) || 0),
      active: active !== undefined ? Boolean(active) : true,
      featured: Boolean(featured),
      source: "admin_manual",
    });

    const populated = await Item.findById(newItem._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    res.status(201).json({
      ok: true,
      message: "Photography listing created successfully!",
      data: { item: populated },
    });
  } catch (error) {
    console.error("[createAdminPhotography Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to create photography listing" });
  }
}

/**
 * Admin: Update an existing Photography listing
 */
export async function updateAdminPhotography(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const existing = await Item.findById(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Photography listing not found" });
    }

    const {
      name,
      title,
      address,
      locality,
      city,
      state,
      pincode,
      contactPhone,
      contactEmail,
      photos,
      images,
      albums,
      videos,
      about,
      description,
      packages,
      photographyPackages,
      active,
      featured,
      rating,
      reviewsCount,
    } = req.body;

    if (name || title) {
      existing.title = (name || title).trim();
    }
    if (address !== undefined) existing.address = address.trim();
    if (locality !== undefined) existing.locality = locality.trim();
    if (city !== undefined) existing.city = city.trim();
    if (state !== undefined) existing.state = state.trim();
    if (pincode !== undefined) existing.pincode = pincode.trim();
    if (contactPhone !== undefined) existing.contactPhone = contactPhone.trim();
    if (contactEmail !== undefined) existing.contactEmail = contactEmail.trim();

    if (photos !== undefined || images !== undefined) {
      const rawImages = Array.isArray(photos) ? photos : (Array.isArray(images) ? images : []);
      const cleanImages = rawImages.map((img) => String(img).trim()).filter(Boolean);
      if (cleanImages.length > 0) {
        existing.images = cleanImages;
      }
    }

    if (albums !== undefined) {
      existing.albums = (Array.isArray(albums) ? albums : [])
        .map((alb) => {
          if (!alb) return null;
          if (typeof alb === "string") {
            return { title: alb.trim(), description: "", coverImage: "", images: [], link: "" };
          }
          return {
            title: (alb.title || alb.name || "").trim(),
            description: (alb.description || "").trim(),
            coverImage: (alb.coverImage || alb.image || "").trim(),
            images: (Array.isArray(alb.images) ? alb.images : []).map((i) => String(i).trim()).filter(Boolean),
            link: (alb.link || alb.url || "").trim(),
          };
        })
        .filter((a) => a && (a.title || a.link || a.images?.length > 0));
    }

    if (videos !== undefined) {
      existing.videos = (Array.isArray(videos) ? videos : [])
        .map((vid) => {
          if (!vid) return null;
          if (typeof vid === "string") {
            return { title: "Showcase Video", url: vid.trim() };
          }
          return {
            title: (vid.title || "Showcase Video").trim(),
            url: (vid.url || vid.link || "").trim(),
          };
        })
        .filter((v) => v && v.url);
    }

    if (about !== undefined) existing.about = about.trim();
    if (description !== undefined) existing.description = description.trim();

    if (photographyPackages !== undefined || packages !== undefined) {
      const rawPackages = photographyPackages || packages || {};
      const cleanDeliverables = (dList) =>
        (Array.isArray(dList) ? dList : typeof dList === "string" ? dList.split(/[\n,]+/) : [])
          .map((d) => String(d).trim())
          .filter(Boolean);

      existing.photographyPackages = {
        basic: {
          price: Math.max(0, Number(rawPackages.basic?.price) || 0),
          title: (rawPackages.basic?.title || "Basic Package").trim(),
          description: (rawPackages.basic?.description || "").trim(),
          deliverables: cleanDeliverables(rawPackages.basic?.deliverables),
        },
        standard: {
          price: Math.max(0, Number(rawPackages.standard?.price) || 0),
          title: (rawPackages.standard?.title || "Standard Package").trim(),
          description: (rawPackages.standard?.description || "").trim(),
          deliverables: cleanDeliverables(rawPackages.standard?.deliverables),
        },
        premium: {
          price: Math.max(0, Number(rawPackages.premium?.price) || 0),
          title: (rawPackages.premium?.title || "Premium Package").trim(),
          description: (rawPackages.premium?.description || "").trim(),
          deliverables: cleanDeliverables(rawPackages.premium?.deliverables),
        },
        luxury: {
          price: Math.max(0, Number(rawPackages.luxury?.price) || 0),
          title: (rawPackages.luxury?.title || "Luxury Package").trim(),
          description: (rawPackages.luxury?.description || "").trim(),
          deliverables: cleanDeliverables(rawPackages.luxury?.deliverables),
        },
      };

      const validPrices = [
        existing.photographyPackages.basic.price,
        existing.photographyPackages.standard.price,
        existing.photographyPackages.premium.price,
        existing.photographyPackages.luxury.price,
      ].filter((p) => p > 0);

      if (validPrices.length > 0) {
        existing.price = Math.min(...validPrices);
      }
    }

    if (active !== undefined) existing.active = Boolean(active);
    if (featured !== undefined) existing.featured = Boolean(featured);
    if (rating !== undefined) existing.rating = Math.min(5, Math.max(0, Number(rating) || 0));
    if (reviewsCount !== undefined) existing.reviewsCount = Math.max(0, Number(reviewsCount) || 0);

    await existing.save();

    const populated = await Item.findById(existing._id)
      .populate("category", "name slug")
      .populate("vendor", "name email phone vendorProfile")
      .lean();

    res.json({
      ok: true,
      message: "Photography listing updated successfully!",
      data: { item: populated },
    });
  } catch (error) {
    console.error("[updateAdminPhotography Error]:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update photography listing" });
  }
}

/**
 * Admin: Delete a photography listing
 */
export async function deleteAdminPhotography(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const item = await Item.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ ok: false, error: "Photography listing not found" });
    }

    res.json({ ok: true, message: "Photography listing removed successfully" });
  } catch (error) {
    console.error("[deleteAdminPhotography Error]:", error);
    res.status(500).json({ ok: false, error: "Failed to delete photography listing" });
  }
}
