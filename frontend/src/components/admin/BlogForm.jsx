"use client";
import { useState } from "react";

export default function BlogForm({ initialData, onSuccess }) {
    const [form, setForm] = useState({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        excerpt: initialData?.excerpt || "",
        content: initialData?.content || "",
        featuredImage: initialData?.featuredImage || "",
        author: initialData?.author || "FlipsAura Team",
        status: initialData?.status || "draft",
        tags: initialData?.tags?.join(", ") || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const payload = {
            ...form,
            tags: form.tags.split(",").map(t => t.trim()),
        };
        const url = initialData ? `/api/blogs/${initialData.slug}` : "/api/blogs";
        const method = initialData ? "PUT" : "POST";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) setError("Failed to save");
        else onSuccess();
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="item-form">
            <h2>{initialData ? "Edit Blog" : "Create Blog"}</h2>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-grid">
                <div className="field">
                    <label>Title *</label>
                    <input name="title" value={form.title} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>Slug (URL)</label>
                    <input name="slug" value={form.slug} onChange={handleChange} placeholder="auto-from-title" />
                </div>
                <div className="field">
                    <label>Excerpt *</label>
                    <textarea name="excerpt" rows="2" value={form.excerpt} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>Featured Image URL *</label>
                    <input name="featuredImage" value={form.featuredImage} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>Author</label>
                    <input name="author" value={form.author} onChange={handleChange} />
                </div>
                <div className="field">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
                <div className="field">
                    <label>Tags (comma separated)</label>
                    <input name="tags" value={form.tags} onChange={handleChange} placeholder="wedding, venues, decor" />
                </div>
            </div>
            <div className="field">
                <label>Content (HTML or Markdown) *</label>
                <textarea name="content" rows="10" value={form.content} onChange={handleChange} required />
            </div>
            <div className="actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Blog"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={onSuccess}>Cancel</button>
            </div>
        </form>
    );
}