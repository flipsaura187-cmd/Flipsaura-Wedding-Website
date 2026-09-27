import sanitizeHtml from "sanitize-html";
import { dbConnect } from "../lib/db.js";
import Blog from "../models/Blog.js";

// HTML Sanitization configuration supporting rich text, links, images, and video embeds
const sanitizeOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "p", "a", "ul", "ol",
    "nl", "li", "b", "i", "strong", "em", "strike", "code", "hr", "br", "div",
    "table", "thead", "caption", "tbody", "tr", "th", "td", "pre", "iframe",
    "img", "video", "source", "span", "figure", "figcaption", "u", "s"
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "srcset", "alt", "title", "width", "height", "loading", "style", "class"],
    iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "style", "class", "title"],
    video: ["src", "controls", "poster", "width", "height", "autoplay", "muted", "loop", "style", "class"],
    source: ["src", "type"],
    "*": ["style", "class"],
  },
  allowedIframeHostnames: [
    "www.youtube.com",
    "youtube.com",
    "youtu.be",
    "player.vimeo.com",
    "vimeo.com",
  ],
};

function cleanHtml(content) {
  if (!content) return "";
  return sanitizeHtml(content, sanitizeOptions);
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Public: GET /api/blogs (published only)
export async function getBlogs(req, res) {
  await dbConnect();
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, parseInt(req.query.limit || "9", 10));
  const skip = (page - 1) * limit;

  const filter = { status: "published" };

  if (req.query.category && req.query.category !== "All") {
    filter.category = req.query.category;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [{ title: searchRegex }, { excerpt: searchRegex }, { tags: searchRegex }];
  }

  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Blog.countDocuments(filter),
  ]);

  res.json({
    ok: true,
    blogs,
    data: blogs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

// Public: GET /api/blogs/:slug (published only)
export async function getBlog(req, res) {
  await dbConnect();
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug: slug.toLowerCase(), status: "published" });
  if (!blog) {
    return res.status(404).json({ ok: false, error: "Blog post not found or is unpublished" });
  }

  res.json({
    ok: true,
    blog,
    data: blog,
  });
}

// Admin only: GET /api/admin/blogs (drafts + published)
export async function getAdminBlogs(req, res) {
  await dbConnect();
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json({ ok: true, blogs, data: blogs });
}

// Admin only: POST /api/blogs
export async function createBlog(req, res) {
  await dbConnect();
  const { title, slug, excerpt, content, coverImage, featuredImage, category, tags, author, status } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ ok: false, error: "Blog title is required" });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ ok: false, error: "Blog content is required" });
  }

  let finalSlug = slugify(slug || title);
  if (!finalSlug) finalSlug = `blog-${Date.now()}`;

  // Ensure unique slug
  let existing = await Blog.findOne({ slug: finalSlug });
  let counter = 1;
  while (existing) {
    finalSlug = `${slugify(slug || title)}-${counter++}`;
    existing = await Blog.findOne({ slug: finalSlug });
  }

  const normalizedStatus = String(status || "draft").toLowerCase() === "published" ? "published" : "draft";
  const image = coverImage || featuredImage || "";

  const blogData = {
    title: title.trim(),
    slug: finalSlug,
    excerpt: excerpt?.trim() || "",
    content: cleanHtml(content),
    coverImage: image,
    featuredImage: image,
    category: category?.trim() || "Wedding Planning",
    tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    author: author?.trim() || "FlipsAura Team",
    status: normalizedStatus,
    publishedAt: normalizedStatus === "published" ? new Date() : null,
  };

  const blog = await Blog.create(blogData);
  res.status(201).json({ ok: true, blog, data: blog, message: "Blog post created successfully" });
}

// Admin only: PUT /api/blogs/:idOrSlug
export async function updateBlog(req, res) {
  await dbConnect();
  const { idOrSlug } = req.params;
  const updateData = { ...req.body };

  if (updateData.content) {
    updateData.content = cleanHtml(updateData.content);
  }

  if (updateData.title) {
    updateData.title = updateData.title.trim();
  }

  if (updateData.slug) {
    updateData.slug = slugify(updateData.slug);
  }

  if (updateData.coverImage || updateData.featuredImage) {
    const img = updateData.coverImage || updateData.featuredImage;
    updateData.coverImage = img;
    updateData.featuredImage = img;
  }

  if (updateData.status) {
    updateData.status = String(updateData.status).toLowerCase();
    if (updateData.status === "published") {
      const existing = await (idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? Blog.findById(idOrSlug) : Blog.findOne({ slug: idOrSlug }));
      if (existing && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
  }

  if (typeof updateData.tags === "string") {
    updateData.tags = updateData.tags.split(",").map(t => t.trim()).filter(Boolean);
  }

  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };

  const blog = await Blog.findOneAndUpdate(query, updateData, { returnDocument: "after", runValidators: true });
  if (!blog) {
    return res.status(404).json({ ok: false, error: "Blog post not found" });
  }

  res.json({ ok: true, blog, data: blog, message: "Blog post updated successfully" });
}

// Admin only: DELETE /api/blogs/:idOrSlug
export async function deleteBlog(req, res) {
  await dbConnect();
  const { idOrSlug } = req.params;

  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };

  const blog = await Blog.findOneAndDelete(query);
  if (!blog) {
    return res.status(404).json({ ok: false, error: "Blog post not found" });
  }

  res.json({ ok: true, message: "Blog post deleted successfully" });
}

// Admin only: PATCH /api/blogs/:idOrSlug/publish
export async function publishBlog(req, res) {
  await dbConnect();
  const { idOrSlug } = req.params;

  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };

  const blog = await Blog.findOneAndUpdate(
    query,
    { status: "published", publishedAt: new Date() },
    { returnDocument: "after" }
  );

  if (!blog) {
    return res.status(404).json({ ok: false, error: "Blog post not found" });
  }

  res.json({ ok: true, blog, data: blog, message: "Blog published successfully" });
}

// Admin only: PATCH /api/blogs/:idOrSlug/unpublish
export async function unpublishBlog(req, res) {
  await dbConnect();
  const { idOrSlug } = req.params;

  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };

  const blog = await Blog.findOneAndUpdate(
    query,
    { status: "draft" },
    { returnDocument: "after" }
  );

  if (!blog) {
    return res.status(404).json({ ok: false, error: "Blog post not found" });
  }

  res.json({ ok: true, blog, data: blog, message: "Blog unpublished (moved to drafts)" });
}
