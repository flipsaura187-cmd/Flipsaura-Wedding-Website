import { dbConnect } from "../lib/db.js";
import Category from "../models/Category.js";

export async function getCategories(req, res) {
  await dbConnect();
  const categories = await Category.find({}).sort({ order: 1, name: 1 }).lean();
  res.json({ ok: true, data: { categories } });
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

  res.json({ ok: true, data: { category } });
}

export async function getCategory(req, res) {
  await dbConnect();
  const category = await Category.findOne({ slug: req.params.slug }).lean();
  if (!category) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, data: { category } });
}

export async function updateCategory(req, res) {
  await dbConnect();
  const category = await Category.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true }
  );
  if (!category) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, data: { category } });
}

export async function deleteCategory(req, res) {
  await dbConnect();
  await Category.deleteOne({ slug: req.params.slug });
  res.json({ ok: true, data: { deleted: true } });
}
