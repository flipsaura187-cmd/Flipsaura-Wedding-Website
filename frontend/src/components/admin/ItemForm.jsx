"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/compat/navigation";
import Image from "@/compat/Image";
import api from "@/api/axios";
import axios from "axios";

export default function ItemForm({ onSaved, initialData = null, categories }) {
  const router = useRouter();
  const isEdit = !!initialData?._id;
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    about: "",
    description: "",
    specifications: [{ key: "", value: "" }],
    images: [""],
    price: "",
    city: "",
    contactPhone: "",
    contactEmail: "",
    capacity: "",
    active: true,
    featured: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        slug: initialData.slug || "",
        category: initialData.category?._id || initialData.category || "",
        about: initialData.about || "",
        description: initialData.description || "",
        specifications: initialData.specifications?.length
          ? initialData.specifications
          : [{ key: "", value: "" }],
        images: initialData.images?.length ? initialData.images : [""],
        price: initialData.price || "",
        city: initialData.city || "",
        contactPhone: initialData.contactPhone || "",
        contactEmail: initialData.contactEmail || "",
        capacity: initialData.capacity || "",
        active: initialData.active !== undefined ? initialData.active : true,
        featured: initialData.featured || false,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSpecChange = (idx, field, value) => {
    const updated = [...form.specifications];
    updated[idx][field] = value;
    setForm((prev) => ({ ...prev, specifications: updated }));
  };

  const addSpec = () =>
    setForm((prev) => ({ ...prev, specifications: [...prev.specifications, { key: "", value: "" }] }));

  const removeSpec = (idx) =>
    setForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== idx) }));

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const { data: sigData } = await api.post("/api/upload", {
        folder: "flipsaura/items",
      });
      if (!sigData.ok) throw new Error(sigData.error || "Failed to get upload signature");

      const { signature, timestamp, apiKey, cloudName } = sigData.data;

      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("api_key", apiKey);
      cloudForm.append("timestamp", timestamp);
      cloudForm.append("signature", signature);
      cloudForm.append("folder", "flipsaura/items");

      const { data: uploadData } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        cloudForm
      );
      if (!uploadData.secure_url) throw new Error("Upload failed");

      const newImages = [...form.images];
      const lastIndex = newImages.length - 1;
      if (newImages[lastIndex] === "") {
        newImages[lastIndex] = uploadData.secure_url;
        newImages.push("");
      } else {
        newImages.push(uploadData.secure_url, "");
      }
      setForm((prev) => ({ ...prev, images: newImages.filter((url) => url !== "") }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadImage(file);
    e.target.value = "";
  };

  const handleImageChange = (idx, value) => {
    const updated = [...form.images];
    updated[idx] = value;
    setForm((prev) => ({ ...prev, images: updated }));
  };

  const addImage = () => setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));

  const removeImage = (idx) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      price: Number(form.price),
      capacity: form.capacity ? Number(form.capacity) : undefined,
      specifications: form.specifications.filter((s) => s.key && s.value),
      images: form.images.filter((url) => url.trim()),
    };

    try {
      const url = isEdit ? `/api/items/${initialData._id}` : "/api/items";
      const method = isEdit ? "PUT" : "POST";
      const { data } =
        method === "PUT" ? await api.put(url, payload) : await api.post(url, payload);
      if (!data.ok) throw new Error(data.error || "Something went wrong");
      if (onSaved) onSaved(data.data.item);
      router.refresh();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-brand-100 pb-3">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
          {isEdit ? "Edit Item" : "Create New Item"}
        </h2>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Slug (optional)</label>
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Category *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">Select Category</option>
            {categories?.map((item, index) => (
              <option key={index} value={item?._id}>
                {item?.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Price * (₹)</label>
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>City</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Contact Phone</label>
          <input
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Contact Email</label>
          <input
            name="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Capacity (guests)</label>
          <input
            name="capacity"
            type="number"
            value={form.capacity}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ink">
            <input
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
            />
            Active
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ink">
            <input
              name="featured"
              type="checkbox"
              checked={form.featured}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
            />
            Featured
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>About (short description)</label>
        <textarea
          name="about"
          rows="2"
          value={form.about}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Full Description</label>
        <textarea
          name="description"
          rows="4"
          value={form.description}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {/* Specifications */}
      <div className="space-y-3">
        <label className={labelClass}>Specifications</label>
        {form.specifications.map((spec, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              placeholder="Key (e.g. Area, Cuisine, AC)"
              value={spec.key}
              onChange={(e) => handleSpecChange(idx, "key", e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Value (e.g. 5000 sq ft, Vegetarian, Yes)"
              value={spec.value}
              onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeSpec(idx)}
              className="text-rose-600 hover:text-rose-800 text-lg font-bold px-2"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSpec}
          className="px-3 py-1.5 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-semibold transition"
        >
          + Add Specification
        </button>
      </div>

      {/* Images */}
      <div className="space-y-3">
        <label className={labelClass}>Images</label>
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

        <div className="space-y-2">
          {form.images.map((url, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-surface p-2 rounded-xl border border-brand-100">
              {url !== "" ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-brand-200 flex-shrink-0">
                  <Image src={url} alt="Image" fill className="object-cover" />
                </div>
              ) : (
                <input
                  placeholder="Or paste direct Image URL"
                  value={url}
                  onChange={(e) => handleImageChange(idx, e.target.value)}
                  className={inputClass}
                />
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="text-rose-600 hover:text-rose-800 text-lg font-bold px-2 ml-auto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addImage}
          className="px-3 py-1.5 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-semibold transition"
        >
          + Add URL field
        </button>
        <p className="text-[11px] text-muted">
          Tip: You can upload files directly to Cloudinary or paste web image URLs above.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-brand-100">
        <button
          type="button"
          className="px-5 py-2.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-sm font-semibold transition"
          onClick={() => onSaved && onSaved(null)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-7 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Item" : "Create Item"}
        </button>
      </div>
    </form>
  );
}
