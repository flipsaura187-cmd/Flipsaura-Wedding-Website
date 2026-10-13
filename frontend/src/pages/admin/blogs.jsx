"use client";
import { useEffect, useState } from "react";
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Wedding Articles & Guides</h1>
          <p className="text-sm text-muted mt-0.5">
            Create and manage inspirational blogs visible to couples and vendors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBlog(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
        >
          <span>✍️</span>
          <span>Create Article</span>
        </button>
      </div>

      {feedback.message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between border ${
            feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-muted hover:text-ink font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center text-muted">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading articles...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-brand-200">
          <span className="text-5xl block mb-3">📰</span>
          <h3 className="font-serif text-xl font-bold text-ink mb-1.5">No articles published yet</h3>
          <p className="text-muted max-w-md mx-auto mb-6 text-sm">
            Start sharing wedding inspiration, decor trends, budget advice, and vendor highlights.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingBlog(null);
              setShowModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
          >
            Create Your First Article
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink/80">
              <thead className="bg-surface text-xs font-semibold text-muted uppercase tracking-wider border-b border-brand-100">
                <tr>
                  <th className="px-5 py-4">Cover</th>
                  <th className="px-5 py-4">Title & Slug</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Published</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
                {blogs.map((blog) => {
                  const isPublished = blog.status === "published";
                  const img = blog.coverImage || blog.featuredImage;

                  return (
                    <tr key={blog._id} className="hover:bg-brand-50/30 transition-colors">
                      <td className="px-5 py-4">
                        {img ? (
                          <img
                            src={img}
                            alt={blog.title}
                            className="w-14 h-10 object-cover rounded-lg border border-brand-100"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-surface border border-brand-100 flex items-center justify-center text-base text-muted">
                            📷
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-ink line-clamp-1">{blog.title}</div>
                        <div className="text-xs text-muted truncate mt-0.5">/blogs/{blog.slug}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                          {blog.category || "Wedding"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${
                            isPublished
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          {isPublished ? "● Published" : "○ Draft"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                        {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : "-"}
                      </td>

                      <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                        {isPublished && blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(blog)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              isPublished
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {isPublished ? "Unpublish" : "Publish"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingBlog(blog);
                              setShowModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
                          >
                            ✏️ Edit
                          </button>

                          {isPublished && (
                            <a
                              href={`/blogs/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
                            >
                              👁️ View
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(blog)}
                            className="px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
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
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 border border-brand-100 my-8"
            onClick={(e) => e.stopPropagation()}
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
