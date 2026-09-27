"use client";
import { useState, useEffect, useRef } from "react";

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
  const [activeTab, setActiveTab] = useState("editor"); // "editor" or "preview"
  const [customSlug, setCustomSlug] = useState(Boolean(initialData?.slug));
  const textareaRef = useRef(null);

  // Auto-generate slug when title changes, unless admin explicitly entered a custom slug
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

  // Helper to insert formatted text at cursor in textarea
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

    // Check YouTube
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

    // Check Vimeo
    const vimeoMatch = input.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
    if (vimeoMatch && vimeoMatch[3]) {
      const embedUrl = `https://player.vimeo.com/video/${vimeoMatch[3]}`;
      insertText(
        `\n<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:24px 0;">\n  <iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>\n</div>\n`
      );
      return;
    }

    // Fallback: direct HTML5 video
    insertText(
      `\n<div class="video-player" style="margin:24px 0;">\n  <video src="${input}" controls style="max-width:100%;border-radius:12px;"></video>\n</div>\n`
    );
  };

  // Upload Cover Image directly to Cloudinary
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // 1. Fetch signed parameters from our server
      const { data: sigData } = await api.post("/api/upload", {
        folder: "flipsaura/blogs",
      });
      if (!sigData.ok) {
        throw new Error(sigData.error || "Failed to obtain upload authorization");
      }

      const { signature, timestamp, apiKey, cloudName } = sigData.data;

      // 2. Post to Cloudinary
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
      const { data } = method === "PUT"
        ? await api.put(url, payload)
        : await api.post(url, payload);

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

  return (
    <div className="blog-editor-card" style={{ background: "#fff", borderRadius: 16, padding: "24px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "var(--wine, #8B1E3F)" }}>
            {initialData ? "Edit Wedding Article" : "Create New Wedding Article"}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
            Publish inspiring guides, vendor stories, and trends for FlipsAura couples.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setActiveTab(activeTab === "editor" ? "preview" : "editor")}
            style={{ fontSize: 13, padding: "6px 12px", border: "1px solid #ddd" }}
          >
            {activeTab === "editor" ? "👁️ Live Preview" : "✏️ Back to Editor"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FFEBEE", color: "#C62828", marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {activeTab === "preview" ? (
        <div style={{ background: "#FAF8F5", borderRadius: 12, padding: 32, border: "1px solid #E8DFD8" }}>
          <span style={{ display: "inline-block", background: "var(--wine, #8B1E3F)", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            {form.category}
          </span>
          <h1 style={{ fontSize: 28, color: "#222", margin: "0 0 12px" }}>{form.title || "Untitled Article"}</h1>
          <p style={{ fontSize: 13, color: "#777", marginBottom: 20 }}>
            By {form.author} • Status: <strong style={{ textTransform: "capitalize", color: form.status === "published" ? "#2E7D32" : "#E65100" }}>{form.status}</strong>
          </p>

          {form.coverImage && (
            <img
              src={form.coverImage}
              alt={form.title}
              style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 12, marginBottom: 24 }}
            />
          )}

          {form.excerpt && (
            <p style={{ fontSize: 16, fontStyle: "italic", color: "#555", borderLeft: "4px solid var(--wine, #8B1E3F)", paddingLeft: 16, margin: "20px 0" }}>
              {form.excerpt}
            </p>
          )}

          <div
            className="blog-content-body"
            dangerouslySetInnerHTML={{ __html: form.content || "<p><em>No content written yet.</em></p>" }}
            style={{ lineHeight: 1.8, fontSize: 16, color: "#333" }}
          />

          {form.tags && (
            <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #ddd", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {form.tags.split(",").map((t, idx) => (
                <span key={idx} style={{ background: "#EDE7F6", color: "#4A148C", padding: "4px 10px", borderRadius: 16, fontSize: 12 }}>
                  #{t.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>
            {/* Title */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                Article Title *
              </label>
              <input
                type="text"
                required
                name="title"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="e.g. 10 Breathtaking Wedding Mandap Ideas for 2026"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ccc", fontSize: 15 }}
              />
            </div>

            {/* Slug */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#555" }}>
                URL Slug (/blogs/slug)
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  required
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="auto-generated-from-title"
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13, background: "#fafafa" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const s = slugify(form.title);
                    setForm((p) => ({ ...p, slug: s }));
                  }}
                  title="Regenerate slug from title"
                  style={{ padding: "0 12px", borderRadius: 8, border: "1px solid #ddd", background: "#f0f0f0", cursor: "pointer", fontSize: 12 }}
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#555" }}>
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
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
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#555" }}>
                Author
              </label>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="FlipsAura Editorial"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
              />
            </div>

            {/* Status */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#555" }}>
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14, fontWeight: 600 }}
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Visible to Customers)</option>
              </select>
            </div>
          </div>

          {/* Cover Image Upload + Preview */}
          <div style={{ marginBottom: 20, padding: 16, background: "#FDFBF9", borderRadius: 10, border: "1px dashed #D4AF37" }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
              Cover Image (Upload via Cloudinary or enter URL)
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <input
                type="text"
                name="coverImage"
                value={form.coverImage}
                onChange={handleChange}
                placeholder="https://res.cloudinary.com/... or paste image link"
                style={{ flex: 1, minWidth: 240, padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
              />
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "#8B1E3F",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                <span>{uploading ? "Uploading…" : "📁 Upload Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {form.coverImage && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={form.coverImage}
                  alt="Cover Preview"
                  style={{ width: 120, height: 75, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}
                />
                <span style={{ fontSize: 12, color: "#666" }}>Preview: Cover will display on blog card & detail hero.</span>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
              Short Excerpt (Displayed on blog cards)
            </label>
            <textarea
              name="excerpt"
              rows={2}
              value={form.excerpt}
              onChange={handleChange}
              placeholder="A brief 1-2 sentence preview for search results and social cards..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
            />
          </div>

          {/* Rich Content Editor Toolbar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontWeight: 600, fontSize: 14 }}>
                Article Content (Supports Rich HTML, Headings, Lists, Links, Images & Video) *
              </label>
            </div>

            {/* Quick Action Toolbar */}
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                padding: "8px 12px",
                background: "#f7f7f7",
                borderRadius: "8px 8px 0 0",
                border: "1px solid #ccc",
                borderBottom: "none",
              }}
            >
              <button
                type="button"
                onClick={() => insertText("<h2>", "</h2>", "Subheading")}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12, fontWeight: "bold" }}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertText("<h3>", "</h3>", "Section Title")}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12, fontWeight: "bold" }}
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => insertText("<p>", "</p>", "Write paragraph text here...")}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12 }}
                title="Paragraph"
              >
                ¶ Paragraph
              </button>
              <button
                type="button"
                onClick={() => insertText("<strong>", "</strong>", "bold text")}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12, fontWeight: "bold" }}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertText("<em>", "</em>", "italic text")}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12, fontStyle: "italic" }}
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertText("<ul>\n  <li>", "</li>\n  <li>Item 2</li>\n</ul>", "Item 1")}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12 }}
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertText("<ol>\n  <li>", "</li>\n  <li>Step 2</li>\n</ol>", "Step 1")}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12 }}
                title="Numbered List"
              >
                1. List
              </button>
              <button
                type="button"
                onClick={() => insertText("<blockquote style=\"border-left:4px solid #8B1E3F;padding-left:14px;color:#555;margin:16px 0;\">", "</blockquote>", "Inspiring wedding quote...")}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12 }}
                title="Blockquote"
              >
                “ Quote
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12 }}
                title="Insert Link"
              >
                🔗 Link
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", background: "#fff", fontSize: 12 }}
                title="Insert Image"
              >
                🖼️ Image
              </button>
              <button
                type="button"
                onClick={handleInsertVideo}
                style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #D4AF37", background: "#FFF8E7", color: "#855F10", fontSize: 12, fontWeight: 600 }}
                title="Embed Video (YouTube, Vimeo, MP4)"
              >
                🎬 Video Embed
              </button>
            </div>

            <textarea
              ref={textareaRef}
              name="content"
              rows={14}
              required
              value={form.content}
              onChange={handleChange}
              placeholder="<p>Begin writing your inspiring wedding article...</p>"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "0 0 8px 8px",
                border: "1px solid #ccc",
                fontFamily: "monospace, sans-serif",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#555" }}>
              Tags (Comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="mehndi, mandap, decor, bridal-wear, photography"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: 20 }}>
            {onCancel && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onCancel}
                disabled={loading}
                style={{ padding: "10px 20px", borderRadius: 8 }}
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #ccc" }}
            >
              {loading ? "Saving…" : "Save as Draft"}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSubmit("published")}
              disabled={loading}
              style={{ padding: "10px 24px", borderRadius: 8, background: "var(--wine, #8B1E3F)", color: "#fff", fontWeight: 600 }}
            >
              {loading ? "Publishing…" : "Publish Live 🚀"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
