"use client";
import { useEffect, useState } from "react";

import api from "@/api/axios";
import axios from "axios";
export default function AdminCategories() {
  const [list, setList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add mode, otherwise category _id
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

  const load = () =>
    api.get("/api/categories")
      .then(({ data: j }) => j.ok && setList(j.data.categories));

  useEffect(() => {
    load();
  }, []);

  // Open modal in "add" mode
  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", slug: "", description: "", image: "", order: 0, active: true });
    setModalOpen(true);
  };

  // Open modal in "edit" mode
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

  // Submit handler (POST or PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const url = editingId ? `/api/categories/${formData.slug}` : "/api/categories";
    const method = editingId ? "PUT" : "POST";

    const { data } = method === "PUT"
      ? await api.put(url, formData)
      : await api.post(url, formData);
    if (!data.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setModalOpen(false);
    load();
  };

  // Delete category
  const remove = async (slug) => {
    if (!confirm("Delete this category?")) return;
    await api.delete(`/api/categories/${slug}`);
    load();
  };

  // Image upload to Cloudinary
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

  // ----- Modal Component -----
  const Modal = () => {
    if (!modalOpen) return null;

    return (
      <div className="modal-overlay" onClick={() => setModalOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>{editingId ? "Edit Category" : "Add Category"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div className="field full-width">
                <label>Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="field checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  /> Active
                </label>
              </div>

              <div className="field full-width">
                <label>Image</label>
                <div className="image-area">
                  {formData.image && (
                    <div className="image-preview">
                      <img src={formData.image} alt="preview" />
                      <button type="button" onClick={deleteImage}>×</button>
                    </div>
                  )}
                  <div>
                    <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                    {uploading && <span>Uploading...</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste image URL"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal-content {
            background: white;
            padding: 24px;
            border-radius: 16px;
            width: 90%;
            max-width: 650px;
            max-height: 90vh;
            overflow-y: auto;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .full-width { grid-column: span 2; }
          .field label { display: block; margin-bottom: 4px; font-weight: 500; }
          .field input, .field textarea, .field select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .checkbox { display: flex; align-items: center; }
          .image-area { display: flex; flex-direction: column; gap: 8px; }
          .image-preview { position: relative; width: 100px; }
          .image-preview img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; }
          .image-preview button {
            position: absolute; top: -8px; right: -8px;
            background: red; color: white; border: none;
            border-radius: 50%; width: 24px; height: 24px; cursor: pointer;
          }
          .actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
          .btn-primary, .btn-ghost { padding: 8px 16px; border-radius: 8px; cursor: pointer; }
          .btn-primary { background: #2c3e66; color: white; border: none; }
          .btn-ghost { background: transparent; border: 1px solid #ccc; }
          .error { color: red; margin-top: 12px; }
        `}</style>
      </div>
    );
  };

  // ----- Main UI -----
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={openAddModal}>+ Add Category</button>
      </div>

      <table className="data" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr><th>Name</th><th>Slug</th><th>Order</th><th>Active</th><th>Image</th><th></th></tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.slug}</td>
              <td>{c.order}</td>
              <td>{c.active ? "Yes" : "No"}</td>
              <td>{c.image ? <img src={c.image} alt={c.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : "—"}</td>
              <td>
                <button className="btn btn-ghost" onClick={() => openEditModal(c)}>Edit</button>
                <button className="btn btn-ghost" onClick={() => remove(c.slug)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal />
    </>
  );
}
