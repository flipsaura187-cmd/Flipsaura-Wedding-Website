"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";

export default function AdminPhotographyFormModal({
  isOpen,
  onClose,
  initialData,
  onSaved,
}) {
  const [activeTab, setActiveTab] = useState("basic"); // basic | about | packages | photos | albums | videos

  const [form, setForm] = useState({
    name: "",
    address: "",
    locality: "",
    city: "Daudnagar",
    state: "Bihar",
    pincode: "",
    contactPhone: "",
    contactEmail: "",
    about: "",
    description: "",
    photos: [],
    albums: [],
    videos: [],
    photographyPackages: {
      basic: {
        price: "",
        title: "Basic Package",
        description: "1 Day Pre-Wedding or single ceremony coverage with digital photos.",
        deliverables: [
          "1 Traditional / Candid Photographer",
          "All edited high-res digital photos",
          "Online album gallery access",
        ],
      },
      standard: {
        price: "",
        title: "Standard Package",
        description: "Complete 1-day wedding day photography & traditional HD video coverage.",
        deliverables: [
          "1 Candid Photographer + 1 Traditional Videographer",
          "Full HD Wedding Video (45-60 mins)",
          "1 Premium Hardcover Photo Album (30 sheets)",
          "Full raw footage on USB drive",
        ],
      },
      premium: {
        price: "",
        title: "Premium Package",
        description: "2-Day comprehensive wedding, sangeet & reception coverage with cinema style.",
        deliverables: [
          "2 Candid Photographers + 2 Cinematic Videographers",
          "Cinematic Wedding Film & Teaser Trailer (3-5 mins)",
          "Drone aerial coverage of venue and baraat",
          "2 Luxury Flush-Mount Photo Albums",
        ],
      },
      luxury: {
        price: "",
        title: "Luxury Package",
        description: "Ultra-luxury multi-day wedding celebration with dedicated celebrity crew.",
        deliverables: [
          "Master Director + 3 Candid Photographers + 3 Cinematographers",
          "4K Cinema Film + Drone Aerial Coverage",
          "Pre-Wedding & Post-Wedding Shoots included",
          "3 Handcrafted Leather Royal Albums + Parent Albums",
          "Next-day Instagram Reel Teasers",
        ],
      },
    },
    active: true,
    featured: false,
    rating: "4.8",
    reviewsCount: "0",
  });

  // Direct image & album inputs
  const [directPhotoUrl, setDirectPhotoUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // New deliverable inputs for packages
  const [newDeliverable, setNewDeliverable] = useState({
    basic: "",
    standard: "",
    premium: "",
    luxury: "",
  });

  // New album draft state
  const [newAlbum, setNewAlbum] = useState({
    title: "",
    description: "",
    coverImage: "",
    imagesText: "",
    link: "",
  });

  // New video draft state
  const [newVideo, setNewVideo] = useState({
    title: "",
    url: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccessMsg("");
    setActiveTab("basic");

    if (initialData) {
      const pkg = initialData.photographyPackages || {};
      setForm({
        name: initialData.title || "",
        address: initialData.address || initialData.vendor?.vendorProfile?.address || "",
        locality: initialData.locality || "",
        city: initialData.city || initialData.vendor?.vendorProfile?.city || "Daudnagar",
        state: initialData.state || initialData.vendor?.vendorProfile?.state || "Bihar",
        pincode: initialData.pincode || initialData.vendor?.vendorProfile?.pincode || "",
        contactPhone: initialData.contactPhone || initialData.vendor?.phone || "",
        contactEmail: initialData.contactEmail || initialData.vendor?.email || "",
        about: initialData.about || "",
        description: initialData.description || "",
        photos: Array.isArray(initialData.images) ? initialData.images : [],
        albums: Array.isArray(initialData.albums) ? initialData.albums : [],
        videos: Array.isArray(initialData.videos) ? initialData.videos : [],
        photographyPackages: {
          basic: {
            price: pkg.basic?.price !== undefined ? String(pkg.basic.price) : "",
            title: pkg.basic?.title || "Basic Package",
            description: pkg.basic?.description || "",
            deliverables: Array.isArray(pkg.basic?.deliverables) ? pkg.basic.deliverables : [],
          },
          standard: {
            price: pkg.standard?.price !== undefined ? String(pkg.standard.price) : "",
            title: pkg.standard?.title || "Standard Package",
            description: pkg.standard?.description || "",
            deliverables: Array.isArray(pkg.standard?.deliverables) ? pkg.standard.deliverables : [],
          },
          premium: {
            price: pkg.premium?.price !== undefined ? String(pkg.premium.price) : "",
            title: pkg.premium?.title || "Premium Package",
            description: pkg.premium?.description || "",
            deliverables: Array.isArray(pkg.premium?.deliverables) ? pkg.premium.deliverables : [],
          },
          luxury: {
            price: pkg.luxury?.price !== undefined ? String(pkg.luxury.price) : "",
            title: pkg.luxury?.title || "Luxury Package",
            description: pkg.luxury?.description || "",
            deliverables: Array.isArray(pkg.luxury?.deliverables) ? pkg.luxury.deliverables : [],
          },
        },
        active: initialData.active !== undefined ? initialData.active : true,
        featured: Boolean(initialData.featured),
        rating: initialData.rating !== undefined ? String(initialData.rating) : "4.8",
        reviewsCount: initialData.reviewsCount !== undefined ? String(initialData.reviewsCount) : "0",
      });
    } else {
      setForm({
        name: "",
        address: "",
        locality: "",
        city: "Daudnagar",
        state: "Bihar",
        pincode: "",
        contactPhone: "",
        contactEmail: "",
        about: "",
        description: "",
        photos: [],
        albums: [],
        videos: [],
        photographyPackages: {
          basic: {
            price: "",
            title: "Basic Package",
            description: "1 Day Pre-Wedding or single ceremony coverage with digital photos.",
            deliverables: [
              "1 Traditional / Candid Photographer",
              "All edited high-res digital photos",
              "Online album gallery access",
            ],
          },
          standard: {
            price: "",
            title: "Standard Package",
            description: "Complete 1-day wedding day photography & traditional HD video coverage.",
            deliverables: [
              "1 Candid Photographer + 1 Traditional Videographer",
              "Full HD Wedding Video (45-60 mins)",
              "1 Premium Hardcover Photo Album (30 sheets)",
              "Full raw footage on USB drive",
            ],
          },
          premium: {
            price: "",
            title: "Premium Package",
            description: "2-Day comprehensive wedding, sangeet & reception coverage with cinema style.",
            deliverables: [
              "2 Candid Photographers + 2 Cinematic Videographers",
              "Cinematic Wedding Film & Teaser Trailer (3-5 mins)",
              "Drone aerial coverage of venue and baraat",
              "2 Luxury Flush-Mount Photo Albums",
            ],
          },
          luxury: {
            price: "",
            title: "Luxury Package",
            description: "Ultra-luxury multi-day wedding celebration with dedicated celebrity crew.",
            deliverables: [
              "Master Director + 3 Candid Photographers + 3 Cinematographers",
              "4K Cinema Film + Drone Aerial Coverage",
              "Pre-Wedding & Post-Wedding Shoots included",
              "3 Handcrafted Leather Royal Albums + Parent Albums",
              "Next-day Instagram Reel Teasers",
            ],
          },
        },
        active: true,
        featured: false,
        rating: "4.8",
        reviewsCount: "0",
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Handle Photo File Upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    setUploadProgress(`Uploading 1 of ${files.length}...`);
    setError("");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        const file = files[i];
        const url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64Data = reader.result;
              const { data } = await api.post("/api/upload/direct", {
                file: base64Data,
                folder: "flipsaura/photography",
              });
              if (!data?.ok || !data?.data?.url) {
                throw new Error(data?.error || `Upload failed for ${file.name}`);
              }
              resolve(data.data.url);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
          reader.readAsDataURL(file);
        });
        uploadedUrls.push(url);
      }

      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls],
      }));
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || err.message || "Failed to upload one or more photos");
    } finally {
      setUploadingImage(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  const addDirectPhotoUrl = () => {
    const raw = directPhotoUrl.trim();
    if (!raw) return;

    const urls = raw
      .split(/[\s,\n]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"));

    if (urls.length === 0) {
      setError("Please enter valid URL(s) starting with http://, https://, or /");
      return;
    }

    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...urls.filter((u) => !prev.photos.includes(u))],
    }));
    setDirectPhotoUrl("");
  };

  const removePhoto = (idx) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  // Deliverable Add/Remove for Packages
  const handleAddDeliverable = (pkgKey) => {
    const text = (newDeliverable[pkgKey] || "").trim();
    if (!text) return;

    setForm((prev) => ({
      ...prev,
      photographyPackages: {
        ...prev.photographyPackages,
        [pkgKey]: {
          ...prev.photographyPackages[pkgKey],
          deliverables: [...prev.photographyPackages[pkgKey].deliverables, text],
        },
      },
    }));

    setNewDeliverable((prev) => ({ ...prev, [pkgKey]: "" }));
  };

  const handleRemoveDeliverable = (pkgKey, dIdx) => {
    setForm((prev) => ({
      ...prev,
      photographyPackages: {
        ...prev.photographyPackages,
        [pkgKey]: {
          ...prev.photographyPackages[pkgKey],
          deliverables: prev.photographyPackages[pkgKey].deliverables.filter((_, i) => i !== dIdx),
        },
      },
    }));
  };

  // Albums Handlers
  const handleAddAlbum = () => {
    if (!newAlbum.title.trim() && !newAlbum.link.trim()) {
      setError("Please provide an Album Title or Album Link");
      return;
    }

    const imgList = newAlbum.imagesText
      ? newAlbum.imagesText
          .split(/[\s,\n]+/)
          .map((u) => u.trim())
          .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"))
      : [];

    const albumObj = {
      title: newAlbum.title.trim() || "Wedding Album",
      description: newAlbum.description.trim(),
      coverImage: newAlbum.coverImage.trim() || imgList[0] || "",
      images: imgList,
      link: newAlbum.link.trim(),
    };

    setForm((prev) => ({
      ...prev,
      albums: [...prev.albums, albumObj],
    }));

    setNewAlbum({
      title: "",
      description: "",
      coverImage: "",
      imagesText: "",
      link: "",
    });
    setError("");
  };

  const handleRemoveAlbum = (idx) => {
    setForm((prev) => ({
      ...prev,
      albums: prev.albums.filter((_, i) => i !== idx),
    }));
  };

  // Video Handlers
  const handleAddVideo = () => {
    if (!newVideo.url.trim()) {
      setError("Please enter a video URL (YouTube, Vimeo, Google Drive, or MP4)");
      return;
    }

    setForm((prev) => ({
      ...prev,
      videos: [
        ...prev.videos,
        {
          title: newVideo.title.trim() || "Showcase Video",
          url: newVideo.url.trim(),
        },
      ],
    }));

    setNewVideo({ title: "", url: "" });
    setError("");
  };

  const handleRemoveVideo = (idx) => {
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== idx),
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Studio or Photographer Name is required");
      setActiveTab("basic");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        locality: form.locality.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        about: form.about.trim(),
        description: form.description.trim(),
        photos: form.photos,
        albums: form.albums,
        videos: form.videos,
        photographyPackages: {
          basic: {
            price: Number(form.photographyPackages.basic.price) || 0,
            title: form.photographyPackages.basic.title,
            description: form.photographyPackages.basic.description,
            deliverables: form.photographyPackages.basic.deliverables,
          },
          standard: {
            price: Number(form.photographyPackages.standard.price) || 0,
            title: form.photographyPackages.standard.title,
            description: form.photographyPackages.standard.description,
            deliverables: form.photographyPackages.standard.deliverables,
          },
          premium: {
            price: Number(form.photographyPackages.premium.price) || 0,
            title: form.photographyPackages.premium.title,
            description: form.photographyPackages.premium.description,
            deliverables: form.photographyPackages.premium.deliverables,
          },
          luxury: {
            price: Number(form.photographyPackages.luxury.price) || 0,
            title: form.photographyPackages.luxury.title,
            description: form.photographyPackages.luxury.description,
            deliverables: form.photographyPackages.luxury.deliverables,
          },
        },
        active: form.active,
        featured: form.featured,
        rating: Number(form.rating) || 4.8,
        reviewsCount: Number(form.reviewsCount) || 0,
      };

      let res;
      if (initialData?._id) {
        res = await api.put(`/api/admin/photography/${initialData._id}`, payload);
      } else {
        res = await api.post("/api/admin/photography", payload);
      }

      if (res.data?.ok) {
        setSuccessMsg(initialData?._id ? "Photography listing updated successfully!" : "Photography listing created successfully!");
        if (onSaved) onSaved(res.data.data.item);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        throw new Error(res.data?.error || "Failed to save photography listing");
      }
    } catch (err) {
      console.error("Save photography error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save photography listing");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic & Contact", icon: "📋" },
    { id: "about", label: "About & Bio", icon: "📝" },
    { id: "packages", label: "Package Pricing (4)", icon: "💰" },
    { id: "photos", label: `Photos (${form.photos.length})`, icon: "📸" },
    { id: "albums", label: `Albums (${form.albums.length})`, icon: "📖" },
    { id: "videos", label: `Videos (${form.videos.length})`, icon: "🎥" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-brand-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xl shadow-sm">
              📷
            </span>
            <div>
              <h2 className="font-serif font-bold text-xl text-ink">
                {initialData ? "Edit Photography Listing" : "Add Photography Listing"}
              </h2>
              <p className="text-xs text-muted">
                Admin catalogue management for wedding photographers & studios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-brand-200 text-muted hover:text-ink flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brand-100 px-6 bg-brand-50/40 overflow-x-auto scrollbar-none gap-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-700 bg-white shadow-xs rounded-t-lg"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-rose-500 font-bold ml-2">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold">
            ✓ {successMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC & CONTACT */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Photographer / Studio Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Wedding Cinema & Photography"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. contact@royalfilms.com"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Complete Studio / Office Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Near Main Market, Old GT Road, Daudnagar, Aurangabad"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Locality / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Dani Bigha"
                    value={form.locality}
                    onChange={(e) => setForm({ ...form, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">City / District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daudnagar"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bihar"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">PIN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 824143"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-brand-100">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="photoActive"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-brand-300 focus:ring-brand-500"
                  />
                  <label htmlFor="photoActive" className="text-xs font-semibold text-ink">
                    Active (Visible to customers on FlipsAura)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="photoFeatured"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-brand-300 focus:ring-brand-500"
                  />
                  <label htmlFor="photoFeatured" className="text-xs font-semibold text-ink">
                    Featured Studio (Highlight on top of listings)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT SECTION */}
          {activeTab === "about" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  About Section (Short Summary / Bio) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Award-winning wedding photography studio specializing in candid bridal portraits, cinematic sangeet teasers, and royal pre-wedding shoots with 7+ years of experience."
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Detailed Service Description
                </label>
                <textarea
                  rows={6}
                  placeholder="Describe photography philosophy, team size, cameras and cinema lenses used (e.g. Sony FX3 / A7IV, G-Master lenses, DJI Ronin gimbals, Mavic 3 Pro drones), editing turnaround time, album delivery timeline, and travel availability across Bihar & India."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-100">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Customer Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Reviews Count</label>
                  <input
                    type="number"
                    min="0"
                    value={form.reviewsCount}
                    onChange={(e) => setForm({ ...form, reviewsCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PACKAGE PRICING (BASIC, STANDARD, PREMIUM, LUXURY) */}
          {activeTab === "packages" && (
            <div className="space-y-6">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800">
                💡 <b>FlipsAura Tiered Packages:</b> Configure pricing and deliverables for <b>Basic</b>, <b>Standard</b>, <b>Premium</b>, and <b>Luxury</b> tiers. Customers can compare deliverables and book directly.
              </div>

              {["basic", "standard", "premium", "luxury"].map((pkgKey) => {
                const pkg = form.photographyPackages[pkgKey];
                const badgeColors = {
                  basic: "bg-blue-50 text-blue-700 border-blue-200",
                  standard: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  premium: "bg-purple-50 text-purple-700 border-purple-200",
                  luxury: "bg-amber-50 text-amber-800 border-amber-200",
                }[pkgKey];

                return (
                  <div key={pkgKey} className="p-4 sm:p-5 rounded-xl border border-brand-100 bg-white shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-50 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColors}`}>
                          {pkgKey}
                        </span>
                        <input
                          type="text"
                          value={pkg.title}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              photographyPackages: {
                                ...prev.photographyPackages,
                                [pkgKey]: { ...prev.photographyPackages[pkgKey], title: e.target.value },
                              },
                            }))
                          }
                          className="font-serif font-bold text-ink text-sm sm:text-base border-b border-dashed border-brand-300 focus:outline-none focus:border-brand-600 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted">Price (₹):</span>
                        <input
                          type="number"
                          placeholder="e.g. 25000"
                          value={pkg.price}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              photographyPackages: {
                                ...prev.photographyPackages,
                                [pkgKey]: { ...prev.photographyPackages[pkgKey], price: e.target.value },
                              },
                            }))
                          }
                          className="w-32 px-3 py-1.5 rounded-lg border border-brand-200 font-bold text-sm text-brand-700 focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">Package Summary</label>
                      <input
                        type="text"
                        placeholder="e.g. Coverage scope, days, and major deliverables"
                        value={pkg.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            photographyPackages: {
                              ...prev.photographyPackages,
                              [pkgKey]: { ...prev.photographyPackages[pkgKey], description: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-brand-100 text-xs focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    {/* Deliverables List */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
                        Deliverables & Features Included ({pkg.deliverables.length})
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {pkg.deliverables.map((item, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-200 text-xs font-medium text-ink"
                          >
                            <span>✓</span>
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDeliverable(pkgKey, dIdx)}
                              className="text-muted hover:text-rose-600 ml-1 font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add new deliverable (e.g. Drone Aerial Shoot, 4K Cinema Film)..."
                          value={newDeliverable[pkgKey]}
                          onChange={(e) => setNewDeliverable({ ...newDeliverable, [pkgKey]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddDeliverable(pkgKey);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddDeliverable(pkgKey)}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs rounded-lg border border-brand-200 cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: PHOTOS (GALLERY & PORTFOLIO) */}
          {activeTab === "photos" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-3 border-b border-brand-100">
                <div>
                  <h3 className="font-serif font-bold text-ink text-sm sm:text-base">
                    Portfolio & Work Showcase Photos
                  </h3>
                  <p className="text-xs text-muted">
                    Upload high-resolution photographs showcasing candid, bridal portraits, and wedding events.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 cursor-pointer transition-colors shadow-xs">
                  <span>📸 Upload Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {uploadingImage && (
                <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-700 flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  <span>{uploadProgress || "Uploading photos to Cloudinary..."}</span>
                </div>
              )}

              {/* Direct URL input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste direct image URLs (comma/space separated or http/https)..."
                  value={directPhotoUrl}
                  onChange={(e) => setDirectPhotoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDirectPhotoUrl();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={addDirectPhotoUrl}
                  className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs rounded-xl border border-brand-200 cursor-pointer"
                >
                  + Add URL
                </button>
              </div>

              {/* Photos Grid */}
              {form.photos.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-brand-200 rounded-2xl text-center text-muted">
                  <span className="text-3xl block mb-2">📸</span>
                  <p className="text-xs sm:text-sm font-medium">No photos added yet</p>
                  <p className="text-xs text-muted mt-1">Upload files or paste direct image URLs above</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {form.photos.map((src, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-brand-100 bg-brand-50 shadow-xs"
                    >
                      <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-rose-600 hover:text-white rounded-full text-ink flex items-center justify-center text-xs font-bold shadow transition-all cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ALBUMS */}
          {activeTab === "albums" && (
            <div className="space-y-5">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800">
                📖 <b>Sample Photo Albums:</b> Create sample albums (e.g. <i>Pre-Wedding Shoot</i>, <i>Grand Wedding Day</i>, <i>Sangeet & Haldi</i>) with photo collections or external portfolio / Google Drive links.
              </div>

              {/* Add New Album Form */}
              <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/30 space-y-3">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-ink">
                  + Add New Album
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink mb-1">Album Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Jaipur Pre-Wedding Shoot"
                      value={newAlbum.title}
                      onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink mb-1">Cover Image URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://.../album_cover.jpg"
                      value={newAlbum.coverImage}
                      onChange={(e) => setNewAlbum({ ...newAlbum, coverImage: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Album Photos (comma or space separated image URLs)
                  </label>
                  <input
                    type="text"
                    placeholder="https://.../img1.jpg, https://.../img2.jpg"
                    value={newAlbum.imagesText}
                    onChange={(e) => setNewAlbum({ ...newAlbum, imagesText: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink mb-1">External Album / Drive Link</label>
                    <input
                      type="text"
                      placeholder="e.g. https://drive.google.com/... or portfolio link"
                      value={newAlbum.link}
                      onChange={(e) => setNewAlbum({ ...newAlbum, link: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink mb-1">Short Description</label>
                    <input
                      type="text"
                      placeholder="e.g. 50 curated shots with sunset golden hour"
                      value={newAlbum.description}
                      onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddAlbum}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 cursor-pointer shadow-xs"
                  >
                    + Add Album to Listing
                  </button>
                </div>
              </div>

              {/* Albums List */}
              {form.albums.length === 0 ? (
                <div className="py-8 border border-dashed border-brand-200 rounded-xl text-center text-muted text-xs">
                  No custom albums added yet. Add sample pre-wedding or wedding albums above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.albums.map((alb, aIdx) => (
                    <div
                      key={aIdx}
                      className="p-3 rounded-xl border border-brand-100 bg-white shadow-xs flex gap-3 relative group"
                    >
                      {alb.coverImage ? (
                        <img
                          src={alb.coverImage}
                          alt={alb.title}
                          className="w-20 h-20 rounded-lg object-cover shrink-0 border border-brand-100"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-brand-50 flex items-center justify-center text-xl shrink-0 border border-brand-100">
                          📖
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-serif font-bold text-xs text-ink truncate">{alb.title}</h4>
                        {alb.description && <p className="text-[11px] text-muted line-clamp-1">{alb.description}</p>}
                        {alb.images?.length > 0 && (
                          <span className="text-[10px] text-brand-700 font-semibold block mt-1">
                            📸 {alb.images.length} photos inside
                          </span>
                        )}
                        {alb.link && (
                          <a
                            href={alb.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-indigo-600 hover:underline truncate block mt-0.5"
                          >
                            🔗 View External Link
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlbum(aIdx)}
                        className="absolute top-2 right-2 text-muted hover:text-rose-600 font-bold text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VIDEOS (SHOWCASE / CINEMATOGRAPHY) */}
          {activeTab === "videos" && (
            <div className="space-y-5">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800">
                🎥 <b>Showcase Videos & Teasers:</b> Add YouTube, Vimeo, Google Drive, or MP4 video links to showcase wedding films and teasers.
              </div>

              {/* Add New Video Form */}
              <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/30 space-y-3">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-ink">
                  + Add Showcase Video
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink mb-1">Video Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Wedding Cinema Teaser (4K)"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink mb-1">Video URL *</label>
                    <input
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=... or .mp4 link"
                      value={newVideo.url}
                      onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 cursor-pointer shadow-xs"
                  >
                    + Add Video Link
                  </button>
                </div>
              </div>

              {/* Videos List */}
              {form.videos.length === 0 ? (
                <div className="py-8 border border-dashed border-brand-200 rounded-xl text-center text-muted text-xs">
                  No showcase videos added yet. Paste YouTube/Vimeo/Drive links above.
                </div>
              ) : (
                <div className="space-y-2">
                  {form.videos.map((vid, vIdx) => (
                    <div
                      key={vIdx}
                      className="p-3 rounded-xl border border-brand-100 bg-white shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          ▶
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-ink truncate">{vid.title}</h4>
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-muted hover:text-brand-600 truncate block"
                          >
                            {vid.url}
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(vIdx)}
                        className="text-muted hover:text-rose-600 font-bold text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Action Bar */}
          <div className="pt-4 border-t border-brand-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabs.findIndex((t) => t.id === activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1].id);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-ink bg-white border border-brand-200 rounded-xl hover:bg-brand-50"
                >
                  ← Previous Tab
                </button>
              )}
              {activeTab !== "videos" && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabs.findIndex((t) => t.id === activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100"
                >
                  Next Tab →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-ink border border-transparent hover:border-brand-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 disabled:opacity-60 cursor-pointer transition-all"
              >
                {submitting ? "Saving Listing..." : initialData ? "Save Changes" : "Create Photography Listing"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

