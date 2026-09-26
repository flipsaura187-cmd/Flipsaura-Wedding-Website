import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
        excerpt: { type: String, required: true, maxlength: 200 },
        content: { type: String, required: true }, // rich HTML or markdown
        featuredImage: { type: String, required: true }, // URL
        author: { type: String, default: "FlipsAura Team" },
        status: { type: String, enum: ["draft", "published"], default: "draft" },
        publishedAt: { type: Date },
        tags: [String],
    },
    { timestamps: true }
);

// Auto-generate slug from title before save
BlogSchema.pre("save", function (next) {
    if (this.isModified("title") && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, "-");
    }
    // Set publishedAt when status changes to published
    if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
export default Blog;