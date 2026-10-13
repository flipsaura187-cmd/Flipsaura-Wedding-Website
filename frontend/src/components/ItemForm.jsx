"use client";
import { useEffect, useState } from "react";

import api from "@/api/axios";
import axios from "axios";
export default function ItemForm({ onSaved, initial }) {
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(initial || {
    title: "", category: "", price: "", city: "",
    about: "", description: "", contactPhone: "", contactEmail: "",
    images: [], specifications: [{ key: "", value: "" }], featured: false, active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/categories").then(r => r.data).then(j => j.ok && setCats(j.data.categories));
  }, []);

  const upload = async (file) => {
    setUploading(true); setErr("");
    try {
      // 1) get a short-lived signature from our server
      const { data: j } = await api.post("/api/upload", {
        folder: "flipsaura/items",
      });
      if (!j.ok) throw new Error(j.error);
      const { cloudName, apiKey, timestamp, folder, signature, uploadUrl } = j.data;

      // 2) upload the file directly to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("folder", folder);
      fd.append("signature", signature);

      const { data: upJson } = await axios.post(uploadUrl, fd);
      if (!upJson.secure_url) throw new Error(upJson.error?.message || "Cloudinary upload failed");

      // store the optimized delivery URL (auto format + quality)
      const optimized = upJson.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
      setForm(f => ({ ...f, images: [...f.images, optimized] }));
    } catch (e) { setErr(e.message); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const payload = { ...form, price: Number(form.price), specifications: form.specifications.filter(s => s.key) };
    const { data: j } = await api.post("/api/items", payload);
    if (j.ok) onSaved?.(j.data.item);
    else setErr(j.error);
  };

  return (
    <form onSubmit={submit} className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-6">
      {err && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium">
          {err}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Title</label>
          <input
            required
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Category</label>
          <select
            required
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
          >
            <option value="">Select…</option>
            {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Price (₹)</label>
          <input
            type="number"
            required
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">City</label>
          <input
            value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Contact phone</label>
          <input
            value={form.contactPhone}
            onChange={e => setForm({ ...form, contactPhone: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Contact email</label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={e => setForm({ ...form, contactEmail: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">About (short)</label>
        <textarea
          rows={2}
          value={form.about}
          onChange={e => setForm({ ...form, about: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-ink uppercase tracking-wider">Images (Cloudinary upload)</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => e.target.files?.[0] && upload(e.target.files[0])}
          disabled={uploading}
          className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
        />
        {uploading && <p className="text-xs text-brand-600 font-semibold animate-pulse">Uploading image to Cloudinary...</p>}
        <div className="flex gap-3 flex-wrap pt-2">
          {form.images.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-brand-200 shadow-sm group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                className="absolute top-1 right-1 bg-white/90 hover:bg-rose-500 hover:text-white text-ink rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-ink uppercase tracking-wider">Specifications</label>
        <div className="space-y-2">
          {form.specifications.map((s, i) => (
            <div key={i} className="flex gap-3">
              <input
                placeholder="Key (e.g. Guest Capacity)"
                value={s.key}
                onChange={e => {
                  const arr = [...form.specifications]; arr[i].key = e.target.value; setForm({ ...form, specifications: arr });
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                placeholder="Value (e.g. 500-1000)"
                value={s.value}
                onChange={e => {
                  const arr = [...form.specifications]; arr[i].value = e.target.value; setForm({ ...form, specifications: arr });
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, specifications: [...f.specifications, { key: "", value: "" }] }))}
          className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors inline-block"
        >
          + Add Specification
        </button>
      </div>

      <div className="flex items-center gap-6 pt-2">
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={e => setForm({ ...form, featured: e.target.checked })}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-brand-300"
          />
          Featured
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => setForm({ ...form, active: e.target.checked })}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-brand-300"
          />
          Active
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={uploading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
        >
          {uploading ? "Uploading..." : "Save Item"}
        </button>
      </div>
    </form>
  );
}
