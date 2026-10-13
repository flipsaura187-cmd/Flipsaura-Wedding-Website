"use client";
import { useEffect, useState } from "react";
import api from "@/api/axios";
import axios from "axios";

export default function AdminCategories() {
  const [list, setList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    order: 0,
    active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/api/categories")
      .then(({ data: j }) => {
        if (j.ok) setList(j.data.categories || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", slug: "", description: "", image: "", order: 0, active: true });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingId(cat._id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
      order: cat.order,
      active: cat.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const url = editingId ? `/api/categories/${formData.slug}` : "/api/categories";
    const method = editingId ? "PUT" : "POST";

    try {
      const { data } = method === "PUT"
        ? await api.put(url, formData)
        : await api.post(url, formData);

      if (!data.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save category");
    }
  };

  const remove = async (slug) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await api.delete(`/api/categories/${slug}`);
    load();
  };

  const uploadImage = async (file) => {
    setUploading(true);
    setError("");
    try {
      const { data: sigData } = await api.post("/api/upload", {
        folder: "flipsaura/categories",
      });
      if (!sigData.ok) throw new Error(sigData.error || "Failed to get signature");

      const { signature, timestamp, apiKey, cloudName } = sigData.data;
      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("api_key", apiKey);
      cloudForm.append("timestamp", timestamp);
      cloudForm.append("signature", signature);
      cloudForm.append("folder", "flipsaura/categories");

      const { data: uploadData } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        cloudForm
      );
      if (!uploadData.secure_url) throw new Error("Upload failed");
      return uploadData.secure_url;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = await uploadImage(file);
    if (imageUrl) setFormData({ ...formData, image: imageUrl });
    e.target.value = "";
  };

  const deleteImage = () => setFormData({ ...formData, image: "" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Categories</h1>
          <p className="text-sm text-muted mt-0.5">Manage wedding categories, priority sorting, and display photos</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
        >
          + Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink/80">
            <thead className="bg-surface text-xs font-semibold text-muted uppercase tracking-wider border-b border-brand-100">
              <tr>
                <th className="px-5 py-4">Image</th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Slug</th>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Active</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/70">
              {loading && list.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-muted">
                    Loading categories...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-muted">
                    No categories found.
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c._id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-4">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="w-10 h-10 object-cover rounded-lg border border-brand-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface border border-brand-100 flex items-center justify-center text-xs text-muted">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink">
                      {c.name}
                    </td>
                    <td className="px-5 py-4 text-muted font-mono text-xs">
                      {c.slug}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      {c.order}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="px-3 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c.slug)}
                        className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-brand-100 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-brand-100">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                {editingId ? "Edit Category" : "Add Category"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-brand-50 text-muted hover:text-ink flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-1.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-1.5">Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink/80 mb-1.5">Description</label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-1.5">Order (Priority)</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ink">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                    />
                    Active Category
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink/80 mb-1.5">Image</label>
                  <div className="space-y-3">
                    {formData.image && (
                      <div className="relative inline-block">
                        <img
                          src={formData.image}
                          alt="preview"
                          className="w-24 h-24 object-cover rounded-xl border border-brand-200"
                        />
                        <button
                          type="button"
                          onClick={deleteImage}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-md hover:bg-rose-700 transition"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="text-xs text-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                      />
                      {uploading && <span className="text-xs text-brand-600 font-medium">Uploading...</span>}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste external image URL"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-brand-200 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
                >
                  {editingId ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
