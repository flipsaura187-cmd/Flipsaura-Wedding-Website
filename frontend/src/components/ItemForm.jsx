"use client";
import { useEffect, useState } from "react";

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
    fetch("/api/categories").then(r => r.json()).then(j => j.ok && setCats(j.data.categories));
  }, []);

  const upload = async (file) => {
    setUploading(true); setErr("");
    try {
      // 1) get a short-lived signature from our server
      const r = await fetch("/api/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "flipsaura/items" }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      const { cloudName, apiKey, timestamp, folder, signature, uploadUrl } = j.data;

      // 2) upload the file directly to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("folder", folder);
      fd.append("signature", signature);

      const up = await fetch(uploadUrl, { method: "POST", body: fd });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error?.message || "Cloudinary upload failed");

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
    const r = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (j.ok) onSaved?.(j.data.item);
    else setErr(j.error);
  };

  return (
    <form onSubmit={submit} style={{ background: "#fff", padding: 20, border: "1px solid var(--line)", borderRadius: 14 }}>
      {err && <div className="error">{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field"><label>Title</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="field"><label>Category</label>
          <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="">Select…</option>
            {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Price (₹)</label><input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
        <div className="field"><label>City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
        <div className="field"><label>Contact phone</label><input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} /></div>
        <div className="field"><label>Contact email</label><input value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
      </div>
      <div className="field"><label>About (short)</label><textarea rows={2} value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} /></div>
      <div className="field"><label>Description</label><textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>

      <div className="field">
        <label>Images (uploaded to Cloudinary)</label>
        <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {form.images.map((src, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
              <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                style={{ position: "absolute", top: -6, right: -6, background: "#fff", border: "1px solid var(--line)", borderRadius: "50%", width: 22, height: 22 }}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Specifications</label>
        {form.specifications.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input placeholder="Key" value={s.key} onChange={e => {
              const arr = [...form.specifications]; arr[i].key = e.target.value; setForm({ ...form, specifications: arr });
            }} />
            <input placeholder="Value" value={s.value} onChange={e => {
              const arr = [...form.specifications]; arr[i].value = e.target.value; setForm({ ...form, specifications: arr });
            }} />
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setForm(f => ({ ...f, specifications: [...f.specifications, { key: "", value: "" }] }))}>+ Add spec</button>
      </div>

      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 16 }}>
        <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured
      </label>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
      </label>

      <div style={{ marginTop: 18 }}>
        <button className="btn btn-primary" disabled={uploading}>Save item</button>
      </div>
    </form>
  );
}
