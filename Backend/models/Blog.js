import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: { type: String, trim: true, default: "" },
    content: { type: String, required: true }, // Rich HTML containing headings, paragraphs, lists, links, images, video embeds
    coverImage: { type: String, default: "" }, // Cloudinary or image URL
    featuredImage: { type: String, default: "" }, // Legacy / compatibility alias
    category: { type: String, default: "Wedding Planning", trim: true },
    author: { type: String, default: "FlipsAura Team", trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "DRAFT", "PUBLISHED"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, default: null },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pre-validate hook to generate slug and synchronize coverImage/featuredImage
BlogSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  } else if (this.slug) {
    this.slug = slugify(this.slug);
  }

  // Normalize status
  if (this.status) {
    this.status = this.status.toLowerCase();
  }

  // Synchronize coverImage and featuredImage
  if (this.coverImage && !this.featuredImage) {
    this.featuredImage = this.coverImage;
  } else if (this.featuredImage && !this.coverImage) {
    this.coverImage = this.featuredImage;
  }

  // Auto-generate excerpt if missing
  if (!this.excerpt && this.content) {
    const plainText = this.content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    this.excerpt = plainText.length > 180 ? plainText.slice(0, 177) + "..." : plainText;
  }

  // Set publishedAt timestamp
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
export default Blog;