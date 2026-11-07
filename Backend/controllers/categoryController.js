import { dbConnect } from "../lib/db.js";
import Category from "../models/Category.js";
import {
  cacheGetJSON,
  cacheSetJSON,
  invalidateCategoryCache,
} from "../lib/redis.js";

const EXCLUDED_SLUGS = [
  "tent-pandal",
  "furniture-seating",
  "stage-decoration",
  "dj-sound-system",
  "lighting-special-effects",
  "power-generator",
  "additional-facilities",
  "venues-resorts",
];

export async function getCategories(req, res) {
  const cacheKey = "categories:all";
  const cached = await cacheGetJSON(cacheKey);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.json({ ok: true, data: cached });
  }

  await dbConnect();
  const categories = await Category.find({
    slug: { $nin: EXCLUDED_SLUGS },
  })
    .sort({ order: 1, name: 1 })
    .lean();

  const responseData = { categories };
  await cacheSetJSON(cacheKey, responseData, 900);
  res.setHeader("X-Cache", "MISS");

  res.json({ ok: true, data: responseData });
}

export async function createCategory(req, res) {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ ok: false, error: "name and slug required" });

  await dbConnect();
  const category = await Category.create({
    name,
    slug: String(slug).toLowerCase(),
    description: req.body.description,
    image: req.body.image,
    order: req.body.order || 0,
    active: req.body.active !== false,
  });

  await invalidateCategoryCache();

  res.json({ ok: true, data: { category } });
}

export async function getCategory(req, res) {
  const slug = req.params.slug;
  const cacheKey = `category:detail:${slug}`;
  const cached = await cacheGetJSON(cacheKey);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.json({ ok: true, data: cached });
  }

  await dbConnect();
  const category = await Category.findOne({
    $or: [{ slug }, ...(slug === "hotels-resorts" ? [{ slug: "hotels" }] : [])]
  }).lean();
  if (!category) return res.status(404).json({ ok: false, error: "Not found" });

  const responseData = { category };
  await cacheSetJSON(cacheKey, responseData, 900);
  res.setHeader("X-Cache", "MISS");

  res.json({ ok: true, data: responseData });
}

export async function updateCategory(req, res) {
  await dbConnect();
  const category = await Category.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true }
  );
  if (!category) return res.status(404).json({ ok: false, error: "Not found" });

  await invalidateCategoryCache();

  res.json({ ok: true, data: { category } });
}

export async function deleteCategory(req, res) {
  await dbConnect();
  await Category.deleteOne({ slug: req.params.slug });
  await invalidateCategoryCache();
  res.json({ ok: true, data: { deleted: true } });
}
