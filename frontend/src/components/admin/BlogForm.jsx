"use client";
import { useState, useRef } from "react";
import api from "@/api/axios";
import axios from "axios";

const CATEGORIES = [
  "Wedding Planning",
  "Wedding Decoration",
  "Mehndi & Henna",
  "Bridal Fashion & Makeup",
  "Groom Wear & Accessories",
  "Photography & Videography",
  "Venues & Destinations",
  "Budget & Timeline",
  "Wedding Trends",
  "Catering & Cakes",
  "Music & Entertainment",
  "Vendor Spotlight",
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BlogForm({ initialData, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    coverImage: initialData?.coverImage || initialData?.featuredImage || "",
    category: initialData?.category || "Wedding Planning",
    author: initialData?.author || "FlipsAura Team",
    status: initialData?.status || "draft",
    tags: initialData?.tags?.join(", ") || "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("editor");
  const [customSlug, setCustomSlug] = useState(Boolean(initialData?.slug));
  const textareaRef = useRef(null);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setForm((prev) => ({
      ...prev,
      title: newTitle,
      slug: customSlug ? prev.slug : slugify(newTitle),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "slug") setCustomSlug(true);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const insertText = (before, after = "", placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || placeholder;
    const replacement = `${before}${selected}${after}`;

    const newContent =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    setForm((prev) => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 50);
  };

  const handleInsertLink = () => {
    const url = prompt("Enter URL (e.g. https://flipsaura.com):", "https://");
    if (!url) return;
    const text = prompt("Enter link display text:", "Click here") || url;
    insertText(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, "</a>", text);
  };

  const handleInsertImage = () => {
    const url = prompt("Enter image URL:", "https://");
    if (!url) return;
    const alt = prompt("Enter image description (alt text):", "Wedding image") || "Image";
    insertText(`\n<figure class="blog-img">\n  <img src="${url}" alt="${alt}" style="max-width:100%;border-radius:12px;margin:16px 0;" />\n  <figcaption style="font-size:13px;color:#888;text-align:center;">${alt}</figcaption>\n</figure>\n`);
  };

  const handleInsertVideo = () => {
    const input = prompt(
      "Enter YouTube, Vimeo, or Video URL:\n(e.g., https://www.youtube.com/watch?v=VIDEO_ID or direct MP4 link)"
    );
    if (!input) return;

    const ytMatch = input.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    );

    if (ytMatch && ytMatch[1]) {
      const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      insertText(
        `\n<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:24px 0;box-shadow:0 4px 16px rgba(0,0,0,0.1);">\n  <iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>\n</div>\n`
      );
      return;
    }

    const vimeoMatch = input.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
    if (vimeoMatch && vimeoMatch[3]) {
      const embedUrl = `https://player.vimeo.com/video/${vimeoMatch[3]}`;
      insertText(
        `\n<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:24px 0;">\n  <iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>\n</div>\n`
      );
      return;
    }

    insertText(
      `\n<div class="video-player" style="margin:24px 0;">\n  <video src="${input}" controls style="max-width:100%;border-radius:12px;"></video>\n</div>\n`
    );
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const { data: sigData } = await api.post("/api/upload", {
        folder: "flipsaura/blogs",
      });
      if (!sigData.ok) {
        throw new Error(sigData.error || "Failed to obtain upload authorization");
      }

      const { signature, timestamp, apiKey, cloudName } = sigData.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", "flipsaura/blogs");

      const { data: uploadData } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      if (!uploadData.secure_url) {
        throw new Error(uploadData.error?.message || "Cloudinary upload failed");
      }

      setForm((prev) => ({
        ...prev,
        coverImage: uploadData.secure_url,
      }));
    } catch (err) {
      setError(`Image upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (overrideStatus) => {
    setLoading(true);
    setError("");

    const targetStatus = overrideStatus || form.status;

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      coverImage: form.coverImage,
      featuredImage: form.coverImage,
      category: form.category,
      author: form.author.trim() || "FlipsAura Team",
      status: targetStatus,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const isEdit = Boolean(initialData?._id || initialData?.slug);
    const identifier = initialData?._id || initialData?.slug;
    const url = isEdit ? `/api/blogs/${identifier}` : "/api/blogs";
    const method = isEdit ? "PUT" : "POST";

    try {
      const { data } =
        method === "PUT" ? await api.put(url, payload) : await api.post(url, payload);

      if (!data.ok) {
        throw new Error(data.error || "Failed to save blog post");
      }

      if (onSuccess) onSuccess(data.blog || data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm text-ink placeholder:text-muted/60 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500";
  const labelClass = "block text-xs font-semibold text-ink/80 mb-1.5";

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-100 pb-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
            {initialData ? "Edit Wedding Article" : "Create New Wedding Article"}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Publish inspiring guides, vendor stories, and trends for FlipsAura couples.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "editor" ? "preview" : "editor")}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
        >
          {activeTab === "editor" ? "👁️ Live Preview" : "✏️ Back to Editor"}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {activeTab === "preview" ? (
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-brand-100 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-600 text-white">
            {form.category}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">{form.title || "Untitled Article"}</h1>
          <p className="text-xs text-muted">
            By {form.author} • Status:{" "}
            <strong className="capitalize text-ink">{form.status}</strong>
          </p>

          {form.coverImage && (
            <img
              src={form.coverImage}
              alt={form.title}
              className="w-full max-h-96 object-cover rounded-2xl border border-brand-100"
            />
          )}

          {form.excerpt && (
            <p className="text-base italic text-ink/80 border-l-4 border-l-brand-600 pl-4 py-1">
              {form.excerpt}
            </p>
          )}

          <div
            className="prose max-w-none text-ink/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: form.content || "<p><em>No content written yet.</em></p>" }}
          />

          {form.tags && (
            <div className="pt-4 border-t border-brand-100 flex gap-2 flex-wrap">
              {form.tags.split(",").map((t, idx) => (
                <span key={idx} className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
                  #{t.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Article Title *</label>
              <input
                type="text"
                required
                name="title"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="e.g. 10 Breathtaking Wedding Mandap Ideas for 2026"
                className={inputClass}
              />
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>URL Slug (/blogs/slug)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="auto-generated-from-title"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    const s = slugify(form.title);
                    setForm((p) => ({ ...p, slug: s }));
                  }}
                  title="Regenerate slug from title"
                  className="px-3 rounded-xl border border-brand-200 bg-surface hover:bg-brand-50 text-xs"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className={labelClass}>Author</label>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="FlipsAura Editorial"
                className={inputClass}
              />
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Visible to Customers)</option>
              </select>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="bg-brand-50/40 p-5 rounded-2xl border border-dashed border-brand-200 space-y-3">
            <label className={labelClass}>Cover Image</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                name="coverImage"
                value={form.coverImage}
                onChange={handleChange}
                placeholder="https://res.cloudinary.com/... or paste image link"
                className={inputClass}
              />
              <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap transition">
                <span>{uploading ? "Uploading…" : "📁 Upload Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {form.coverImage && (
              <div className="flex items-center gap-3 pt-1">
                <img
                  src={form.coverImage}
                  alt="Cover Preview"
                  className="w-24 h-16 object-cover rounded-xl border border-brand-200"
                />
                <span className="text-xs text-muted">Preview: Cover will display on blog card & detail hero.</span>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className={labelClass}>Short Excerpt (Displayed on blog cards)</label>
            <textarea
              name="excerpt"
              rows={2}
              value={form.excerpt}
              onChange={handleChange}
              placeholder="A brief 1-2 sentence preview for search results and cards..."
              className={inputClass}
            />
          </div>

          {/* Rich Content Editor Toolbar */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Article Content (Supports Rich HTML, Headings, Lists, Links, Images & Video) *
            </label>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-surface rounded-t-2xl border border-brand-200 border-b-0">
              <button
                type="button"
                onClick={() => insertText("<h2>", "</h2>", "Subheading")}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs font-bold hover:bg-brand-50"
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertText("<h3>", "</h3>", "Section Title")}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs font-bold hover:bg-brand-50"
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => insertText("<p>", "</p>", "Write paragraph text here...")}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs hover:bg-brand-50"
                title="Paragraph"
              >
                ¶ Paragraph
              </button>
              <button
                type="button"
                onClick={() => insertText("<strong>", "</strong>", "bold text")}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs font-bold hover:bg-brand-50"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertText("<em>", "</em>", "italic text")}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs italic hover:bg-brand-50"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertText("<ul>\n  <li>", "</li>\n  <li>Item 2</li>\n</ul>", "Item 1")}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs hover:bg-brand-50"
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertText("<ol>\n  <li>", "</li>\n  <li>Step 2</li>\n</ol>", "Step 1")}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs hover:bg-brand-50"
                title="Numbered List"
              >
                1. List
              </button>
              <button
                type="button"
                onClick={() => insertText("<blockquote style=\"border-left:4px solid #8B1E3F;padding-left:14px;color:#555;margin:16px 0;\">", "</blockquote>", "Inspiring wedding quote...")}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs hover:bg-brand-50"
                title="Blockquote"
              >
                “ Quote
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs hover:bg-brand-50"
                title="Insert Link"
              >
                🔗 Link
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                className="px-2 py-1 rounded bg-white border border-brand-200 text-xs hover:bg-brand-50"
                title="Insert Image"
              >
                🖼️ Image
              </button>
              <button
                type="button"
                onClick={handleInsertVideo}
                className="px-2.5 py-1 rounded bg-gold/15 border border-gold/40 text-gold-dark text-xs font-semibold hover:bg-gold/25"
                title="Embed Video"
              >
                🎬 Video Embed
              </button>
            </div>

            <textarea
              ref={textareaRef}
              name="content"
              rows={12}
              required
              value={form.content}
              onChange={handleChange}
              placeholder="<p>Begin writing your inspiring wedding article...</p>"
              className="w-full p-4 rounded-b-2xl border border-brand-200 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>Tags (Comma separated)</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="mehndi, mandap, decor, bridal-wear, photography"
              className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-100">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-sm font-semibold transition"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save as Draft"}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
            >
              {loading ? "Publishing…" : "Publish Live 🚀"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
