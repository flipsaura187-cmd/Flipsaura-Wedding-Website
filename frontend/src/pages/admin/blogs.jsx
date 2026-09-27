"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import BlogForm from "@/components/admin/BlogForm";

import api from "@/api/axios";
export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/blogs");
      const list = Array.isArray(data) ? data : data.blogs || data.data || [];
      setBlogs(list);
    } catch (err) {
      console.error("Failed to load blogs:", err);
      setFeedback({ type: "error", message: "Failed to fetch blogs from server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleTogglePublish = async (blog) => {
    const isPublished = blog.status === "published";
    const endpoint = isPublished
      ? `/api/blogs/${blog._id || blog.slug}/unpublish`
      : `/api/blogs/${blog._id || blog.slug}/publish`;

    try {
      const { data } = await api.patch(endpoint);
      if (!data.ok) throw new Error(data.error || "Action failed");

      setFeedback({
        type: "success",
        message: isPublished ? "Article moved to drafts." : "Article published live to customer marketplace!",
      });
      fetchBlogs();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleDelete = async (blog) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { data } = await api.delete(`/api/blogs/${blog._id || blog.slug}`);
      if (!data.ok) throw new Error(data.error || "Failed to delete blog");

      setFeedback({ type: "success", message: "Article deleted successfully." });
      fetchBlogs();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: "var(--wine, #8B1E3F)" }}>Wedding Articles & Guides</h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
            Create and manage inspirational blogs visible to couples and vendors.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingBlog(null);
            setShowModal(true);
          }}
          style={{ background: "var(--wine, #8B1E3F)", color: "#fff", padding: "10px 18px", borderRadius: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
        >
          <span>✍️</span>
          <span>Create Article</span>
        </button>
      </div>

      {feedback.message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 20,
            background: feedback.type === "error" ? "#FFEBEE" : "#E8F5E9",
            color: feedback.type === "error" ? "#C62828" : "#2E7D32",
            border: `1px solid ${feedback.type === "error" ? "#FFCDD2" : "#C8E6C9"}`,
            fontSize: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: "", message: "" })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          Loading articles…
        </div>
      ) : blogs.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "#FAF8F5", borderRadius: 16, border: "1px dashed #D4AF37" }}>
          <span style={{ fontSize: 48 }}>📰</span>
          <h3 style={{ margin: "12px 0 6px", color: "var(--wine, #8B1E3F)" }}>No articles published yet</h3>
          <p style={{ color: "#666", maxWidth: 420, margin: "0 auto 20px", fontSize: 14 }}>
            Start sharing wedding inspiration, decor trends, budget advice, and vendor highlights.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingBlog(null);
              setShowModal(true);
            }}
          >
            Create Your First Article
          </button>
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12, border: "1px solid #EAE0D7", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
          <table className="data" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#FAF8F5", borderBottom: "1px solid #EAE0D7", fontSize: 13, textTransform: "uppercase", color: "#666", letterSpacing: "0.5px" }}>
                <th style={{ padding: "14px 16px" }}>Cover</th>
                <th style={{ padding: "14px 16px" }}>Title & Slug</th>
                <th style={{ padding: "14px 16px" }}>Category</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px" }}>Created</th>
                <th style={{ padding: "14px 16px" }}>Published</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => {
                const isPublished = blog.status === "published";
                const img = blog.coverImage || blog.featuredImage;

                return (
                  <tr key={blog._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    {/* Cover image */}
                    <td style={{ padding: "12px 16px", width: 70 }}>
                      {img ? (
                        <img
                          src={img}
                          alt={blog.title}
                          style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                        />
                      ) : (
                        <div style={{ width: 60, height: 40, background: "#f0f0f0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          📷
                        </div>
                      )}
                    </td>

                    {/* Title */}
                    <td style={{ padding: "12px 16px", maxWidth: 280 }}>
                      <div style={{ fontWeight: 600, color: "#222", fontSize: 14 }}>{blog.title}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>/blogs/{blog.slug}</div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <span style={{ background: "#F5EFF2", color: "var(--wine, #8B1E3F)", padding: "3px 8px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                        {blog.category || "Wedding"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 600,
                          background: isPublished ? "#E8F5E9" : "#FFF3E0",
                          color: isPublished ? "#2E7D32" : "#E65100",
                          border: `1px solid ${isPublished ? "#C8E6C9" : "#FFE0B2"}`,
                          textTransform: "capitalize",
                        }}
                      >
                        {isPublished ? "● Published" : "○ Draft"}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#666" }}>
                      {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : "-"}
                    </td>

                    {/* Published Date */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#666" }}>
                      {isPublished && blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : "—"}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        {/* Publish / Unpublish */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(blog)}
                          title={isPublished ? "Unpublish (Move to Draft)" : "Publish Live to Customers"}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: `1px solid ${isPublished ? "#FFE0B2" : "#C8E6C9"}`,
                            background: isPublished ? "#FFF8E1" : "#E8F5E9",
                            color: isPublished ? "#B78103" : "#2E7D32",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {isPublished ? "Unpublish" : "Publish"}
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBlog(blog);
                            setShowModal(true);
                          }}
                          title="Edit Article"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ✏️ Edit
                        </button>

                        {/* View Live */}
                        {isPublished && (
                          <a
                            href={`/blogs/${blog.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Customer Site"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #ddd",
                              background: "#fff",
                              color: "#444",
                              textDecoration: "none",
                              fontSize: 12,
                              display: "inline-block",
                            }}
                          >
                            👁️ View
                          </a>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(blog)}
                          title="Delete Article"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #FFCDD2",
                            background: "#FFEBEE",
                            color: "#C62828",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
            overflowY: "auto",
          }}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 960,
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: 16,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <BlogForm
              initialData={editingBlog}
              onSuccess={() => {
                setShowModal(false);
                fetchBlogs();
                setFeedback({
                  type: "success",
                  message: editingBlog ? "Article updated successfully!" : "Article created successfully!",
                });
              }}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
