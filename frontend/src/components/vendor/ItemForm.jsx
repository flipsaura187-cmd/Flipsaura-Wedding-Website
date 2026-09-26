"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/compat/navigation";
import Image from "@/compat/Image";

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
                specifications: initialData.specifications?.length ? initialData.specifications : [{ key: "", value: "" }],
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
        setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSpecChange = (idx, field, value) => {
        const updated = [...form.specifications];
        updated[idx][field] = value;
        setForm(prev => ({ ...prev, specifications: updated }));
    };
    const addSpec = () => setForm(prev => ({ ...prev, specifications: [...prev.specifications, { key: "", value: "" }] }));
    const removeSpec = (idx) => setForm(prev => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== idx) }));
    const uploadImage = async (file) => {
        setUploading(true);
        try {
            // 1. Get signature from your API
            const sigRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folder: "flipsaura/items" }),
            });
            const sigData = await sigRes.json();
            if (!sigData.ok) throw new Error(sigData.error || "Failed to get upload signature");

            const { signature, timestamp, apiKey, cloudName } = sigData.data;

            // 2. Prepare form data for Cloudinary
            const cloudForm = new FormData();
            cloudForm.append("file", file);
            cloudForm.append("api_key", apiKey);
            cloudForm.append("timestamp", timestamp);
            cloudForm.append("signature", signature);
            cloudForm.append("folder", "flipsaura/items");

            // 3. Upload to Cloudinary
            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: "POST", body: cloudForm }
            );
            const uploadData = await uploadRes.json();
            if (!uploadData.secure_url) throw new Error("Upload failed");

            // 4. Add the new URL to images array
            const newImages = [...form.images];
            // Remove empty string placeholders at the end if any
            const lastIndex = newImages.length - 1;
            if (newImages[lastIndex] === "") {
                newImages[lastIndex] = uploadData.secure_url;
                newImages.push(""); // keep one empty for next
            } else {
                newImages.push(uploadData.secure_url, "");
            }
            setForm(prev => ({ ...prev, images: newImages.filter(url => url !== "") }));
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) uploadImage(file);
        e.target.value = ""; // allow re-upload same file
    };

    const handleImageChange = (idx, value) => {
        const updated = [...form.images];
        updated[idx] = value;
        setForm(prev => ({ ...prev, images: updated }));
    };
    const addImage = () => setForm(prev => ({ ...prev, images: [...prev.images, ""] }));
    const removeImage = (idx) => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const payload = {
            ...form,
            price: Number(form.price),
            capacity: form.capacity ? Number(form.capacity) : undefined,
            specifications: form.specifications.filter(s => s.key && s.value),
            images: form.images.filter(url => url.trim()),
        };

        try {
            const url = isEdit ? `/api/items/${initialData._id}` : "/api/items";
            const method = isEdit ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || "Something went wrong");
            if (onSaved) onSaved(data.data.item);
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="item-form">
            <h2>{isEdit ? "Edit Item" : "Create New Item"}</h2>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-grid">
                <div className="field">
                    <label>Title *</label>
                    <input name="title" value={form.title} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>Slug (optional)</label>
                    <input name="slug" value={form.slug} onChange={handleChange} />
                </div>
                <div className="field">
                    <label>Category ID *</label>
                    <select name="category" value={form.category} onChange={handleChange} required>
                        {
                            categories?.map((item, index)=> (
                                <option key={index} value={item?._id} >{item?.name}</option>
                            ))
                        }
                    </select>
                </div>
                <div className="field">
                    <label>Price * (₹)</label>
                    <input name="price" type="number" value={form.price} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>City</label>
                    <input name="city" value={form.city} onChange={handleChange} />
                </div>
                <div className="field">
                    <label>Contact Phone</label>
                    <input name="contactPhone" value={form.contactPhone} onChange={handleChange} />
                </div>
                <div className="field">
                    <label>Contact Email</label>
                    <input name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} />
                </div>
                <div className="field">
                    <label>Capacity (guests)</label>
                    <input name="capacity" type="number" value={form.capacity} onChange={handleChange} />
                </div>
                <div className="field checkbox">
                    <label>
                        <input name="active" type="checkbox" checked={form.active} onChange={handleChange} /> Active
                    </label>
                </div>
                <div className="field checkbox">
                    <label>
                        <input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} /> Featured
                    </label>
                </div>
            </div>

            <div className="field">
                <label>About (short description)</label>
                <textarea name="about" rows="2" value={form.about} onChange={handleChange} />
            </div>
            <div className="field">
                <label>Full description</label>
                <textarea name="description" rows="4" value={form.description} onChange={handleChange} />
            </div>

            <div className="field">
                <label>Specifications</label>
                {form.specifications.map((spec, idx) => (
                    <div key={idx} className="spec-row">
                        <input placeholder="Key" value={spec.key} onChange={(e) => handleSpecChange(idx, "key", e.target.value)} />
                        <input placeholder="Value" value={spec.value} onChange={(e) => handleSpecChange(idx, "value", e.target.value)} />
                        <button type="button" onClick={() => removeSpec(idx)}>✕</button>
                    </div>
                ))}
                <button type="button" onClick={addSpec}>+ Add specification</button>
            </div>

            <div className="field">
                <label>Images</label>
                <div style={{ marginBottom: 8 }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    {uploading && <span style={{ marginLeft: 8 }}>Uploading...</span>}
                </div>
                {form.images.map((url, idx) => (
                    <div key={idx} className="image-row">
                        {
                            url !== "" ?
                                <Image src={url} alt="Image" width={70} height={70} />
                                :
                                <input
                                    placeholder="Image URL"
                                    value={url}
                                    onChange={(e) => handleImageChange(idx, e.target.value)}
                                />

                        }

                        <button type="button" onClick={() => removeImage(idx)}>✕</button>
                    </div>
                ))}
                <button type="button" onClick={addImage}>+ Add URL field</button>
                <p style={{ fontSize: "0.7rem", marginTop: 4, color: "#8b7a6b" }}>
                    Tip: You can also paste direct image URLs above.
                </p>
            </div>

            <div className="actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : (isEdit ? "Update Item" : "Create Item")}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => onSaved && onSaved(null)}>Cancel</button>
            </div>
        </form>
    );
}