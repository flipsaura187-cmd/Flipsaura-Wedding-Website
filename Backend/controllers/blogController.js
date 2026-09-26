import { dbConnect } from "../lib/db.js";
import Blog from "../models/Blog.js";

export async function getBlogs(req, res) {
  await dbConnect();
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "9", 10);
  const skip = (page - 1) * limit;

  const filter = { status: "published" };
  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit),
    Blog.countDocuments(filter),
  ]);

  res.json({ blogs, total, page, totalPages: Math.ceil(total / limit) });
}

export async function createBlog(req, res) {
  await dbConnect();
  const blog = await Blog.create(req.body);
  res.status(201).json(blog);
}

export async function getBlog(req, res) {
  await dbConnect();
  const blog = await Blog.findOne({ slug: req.params.slug, status: "published" });
  if (!blog) return res.status(404).json({ error: "Not found" });
  res.json(blog);
}

export async function updateBlog(req, res) {
  await dbConnect();
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true }
  );
  if (!blog) return res.status(404).json({ error: "Not found" });
  res.json(blog);
}

export async function deleteBlog(req, res) {
  await dbConnect();
  const blog = await Blog.findOneAndDelete({ slug: req.params.slug });
  if (!blog) return res.status(404).json({ error: "Not found" });
  res.json({ message: "Deleted" });
}

export async function getAdminBlogs(req, res) {
  await dbConnect();
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
}
