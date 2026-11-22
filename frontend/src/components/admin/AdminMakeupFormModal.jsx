"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";

const DEFAULT_MAKEUP_SERVICES = [
  "Bridal HD Makeup",
  "Bridal Airbrush Makeup",
  "Engagement & Roka Makeover",
  "Reception & Sangeet Look",
  "Party / Family Makeup (Per Person)",
  "Bridesmaids Glam Package",
  "Hair Styling (Bridal Bun & Flowers)",
  "Saree & Dupatta Draping",
  "Groom Makeup & Beard Styling",
  "Pre-Bridal Skincare & Facial",
];

const DEFAULT_MAKEUP_BRANDS = [
  "MAC Cosmetics",
  "Huda Beauty",
  "Bobbi Brown",
  "NARS",
  "Charlotte Tilbury",
  "Kryolan Professional",
  "Estée Lauder",
  "PAC Cosmetics",
  "Forever 52",
  "Anastasia Beverly Hills",
];

const DEFAULT_MAKEUP_AMENITIES = [
  "At-Venue / Home Service Available",
  "Studio / Salon Visit Available",
  "Paid Trial Session Available",
  "Outstation / Destination Travel",
  "Professional Ring Light & Vanity Kit",
  "Hygienic Disposable Applicators",
  "Premium Mink Eyelashes Included",
  "Hair Extensions Setup",
];

const BIHAR_CITIES = [
  "Daudnagar",
  "Aurangabad",
  "Patna",
  "Gaya",
  "Dehri on Sone",
  "Sasaram",
  "Arwal",
  "Jehanabad",
  "Muzaffarpur",
  "Bhagalpur",
  "Ranchi",
  "Jamshedpur",
  "Varanasi",
  "Kolkata",
  "Delhi NCR",
];

export default function AdminMakeupFormModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  isVendor = false,
}) {
  const isEdit = Boolean(initialData?._id);

  const [form, setForm] = useState({
    title: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    city: "Daudnagar",
    state: "Bihar",
    locality: "",
    address: "",
    price: "",
    about: "",
    description: "",
    selectedServices: [
      "Bridal HD Makeup",
      "Bridal Airbrush Makeup",
      "Engagement & Roka Makeover",
      "Saree & Dupatta Draping",
      "Hair Styling (Bridal Bun & Flowers)",
    ],
    selectedBrands: ["MAC Cosmetics", "Huda Beauty", "Kryolan Professional", "PAC Cosmetics"],
    selectedAmenities: [
      "At-Venue / Home Service Available",
      "Paid Trial Session Available",
      "Premium Mink Eyelashes Included",
    ],
    packages: {
      basic: {
        title: "Party / Sangeet Makeup",
        price: "2500",
        description: "Elegant glam look for family, sangeet, or engagement with hairstyling & basic draping.",
        deliverables: "HD Party Makeup, Hairstyling, Saree/Dupatta Draping, False Lashes",
      },
      standard: {
        title: "Bridal HD Makeover",
        price: "8500",
        description: "Flawless HD bridal makeup using international brands, waterproof finish & royal styling.",
        deliverables: "Bridal HD Makeup, Complex Bun / Floral Hair, Saree & Lehenga Draping, Premium Lashes, Lenses",
      },
      premium: {
        title: "Airbrush Luxury Bridal",
        price: "15000",
        description: "Ultra-high-definition silicon-based airbrush finish that lasts 18+ hours without creasing.",
        deliverables: "Full Airbrush Bridal Makeup, Luxury Hair Art, Double Dupatta Draping, Pre-Bridal Touchup, Nails",
      },
      luxury: {
        title: "Complete 3-Event Bridal Combo",
        price: "28000",
        description: "All-inclusive royal bridal experience covering Engagement, Haldi/Sangeet, and Wedding Day.",
        deliverables: "3 Complete Makeovers (Haldi + Sangeet + Wedding), Airbrush Bridal, Groom Touchup, Free Trial",
      },
    },
    images: [],
    videos: [],
    active: true,
    featured: false,
  });

  const [customService, setCustomService] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccessMsg("");

    if (initialData) {
      setForm({
        title: initialData.title || "",
        contactPerson: initialData.contactPerson || initialData.vendor?.name || "",
        contactPhone: initialData.contactPhone || initialData.vendor?.phone || "",
        contactEmail: initialData.contactEmail || initialData.vendor?.email || "",
        city: initialData.city || initialData.vendor?.vendorProfile?.city || "Daudnagar",
        state: initialData.state || "Bihar",
        locality: initialData.locality || "",
        address: initialData.address || initialData.vendor?.vendorProfile?.address || "",
        price: initialData.price || "",
        about: initialData.about || "",
        description: initialData.description || "",
        selectedServices: Array.isArray(initialData.subcategories) && initialData.subcategories.length > 0
          ? initialData.subcategories
          : [
              "Bridal HD Makeup",
              "Bridal Airbrush Makeup",
              "Engagement & Roka Makeover",
              "Saree & Dupatta Draping",
            ],
        selectedBrands: Array.isArray(initialData.mainCategories) && initialData.mainCategories.length > 0
          ? initialData.mainCategories
          : ["MAC Cosmetics", "Huda Beauty", "Kryolan Professional"],
        selectedAmenities: Array.isArray(initialData.venueFeatures) && initialData.venueFeatures.length > 0
          ? initialData.venueFeatures
          : ["At-Venue / Home Service Available", "Paid Trial Session Available"],
        packages: {
          basic: {
            title: initialData.photographyPackages?.basic?.title || "Party / Sangeet Makeup",
            price: initialData.photographyPackages?.basic?.price || "2500",
            description: initialData.photographyPackages?.basic?.description || "Elegant glam look with hair & draping.",
            deliverables: (initialData.photographyPackages?.basic?.deliverables || []).join(", ") || "HD Makeup, Hair, Draping",
          },
          standard: {
            title: initialData.photographyPackages?.standard?.title || "Bridal HD Makeover",
            price: initialData.photographyPackages?.standard?.price || "8500",
            description: initialData.photographyPackages?.standard?.description || "Flawless HD bridal makeup.",
            deliverables: (initialData.photographyPackages?.standard?.deliverables || []).join(", ") || "Bridal HD Makeup, Royal Hair, Draping",
          },
          premium: {
            title: initialData.photographyPackages?.premium?.title || "Airbrush Luxury Bridal",
            price: initialData.photographyPackages?.premium?.price || "15000",
            description: initialData.photographyPackages?.premium?.description || "Silicon-based airbrush finish.",
            deliverables: (initialData.photographyPackages?.premium?.deliverables || []).join(", ") || "Airbrush Makeup, Hair Art, Dupatta Draping",
          },
          luxury: {
            title: initialData.photographyPackages?.luxury?.title || "Complete 3-Event Bridal Combo",
            price: initialData.photographyPackages?.luxury?.price || "28000",
            description: initialData.photographyPackages?.luxury?.description || "All-inclusive 3-event bridal makeover.",
            deliverables: (initialData.photographyPackages?.luxury?.deliverables || []).join(", ") || "3 Complete Makeovers, Groom Touchup",
          },
        },
        images: Array.isArray(initialData.images) ? initialData.images : [],
        videos: Array.isArray(initialData.videos) ? initialData.videos : [],
        active: initialData.active !== undefined ? initialData.active : true,
        featured: Boolean(initialData.featured),
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const toggleService = (s) => {
    setForm((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(s)
        ? prev.selectedServices.filter((x) => x !== s)
        : [...prev.selectedServices, s],
    }));
  };

  const addCustomService = () => {
    const trimmed = customService.trim();
    if (!trimmed) return;
    if (!form.selectedServices.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        selectedServices: [...prev.selectedServices, trimmed],
      }));
    }
    setCustomService("");
  };

  const toggleBrand = (b) => {
    setForm((prev) => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(b)
        ? prev.selectedBrands.filter((x) => x !== b)
        : [...prev.selectedBrands, b],
    }));
  };

  const toggleAmenity = (a) => {
    setForm((prev) => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(a)
        ? prev.selectedAmenities.filter((x) => x !== a)
        : [...prev.selectedAmenities, a],
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImage(true);
    setUploadProgress(`Uploading ${files.length} photo(s)...`);
    setError("");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        const url = await uploadFile(files[i], "flipsaura/makeup");
        if (url) uploadedUrls.push(url);
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      console.error("Makeup upload error:", err);
      setError(err.message || "Failed to upload images");
    } finally {
      setUploadingImage(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  const handleAddDirectImage = () => {
    const raw = directImageUrl.trim();
    if (!raw) return;
    const splitUrls = raw
      .split(/[\s,\n]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"));

    if (!splitUrls.length) {
      setError("Please enter a valid image URL starting with http:// or https://");
      return;
    }

    setForm((prev) => ({
      ...prev,
      images: Array.from(new Set([...prev.images, ...splitUrls])),
    }));
    setDirectImageUrl("");
  };

  const handleAddVideo = () => {
    const url = newVideoUrl.trim();
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      videos: [
        ...prev.videos,
        {
          title: newVideoTitle.trim() || "Bridal Makeup Reel / Video",
          url,
        },
      ],
    }));
    setNewVideoUrl("");
    setNewVideoTitle("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.title.trim()) {
      setError("Please enter Makeup Artist / Salon / Studio Name.");
      return;
    }
    if (!form.city.trim()) {
      setError("City / District is required.");
      return;
    }

    setSubmitting(true);

    try {
      // Find Makeup & Grooming category ID
      let categoryId = null;
      try {
        const catRes = await api.get("/api/categories");
        const cats = catRes.data?.data?.categories || [];
        const makeupCat = cats.find(
          (c) => c.slug === "makeup-grooming" || c.name.toLowerCase().includes("makeup")
        );
        if (makeupCat) categoryId = makeupCat._id;
      } catch (catErr) {
        console.warn("Category fetch fallback:", catErr);
      }

      const startingPrice =
        Number(form.price) ||
        Number(form.packages.standard.price) ||
        Number(form.packages.basic.price) ||
        8500;

      const payload = {
        title: form.title.trim(),
        category: categoryId,
        contactPerson: form.contactPerson.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        city: form.city.trim(),
        state: form.state.trim() || "Bihar",
        locality: form.locality.trim(),
        address: form.address.trim(),
        price: startingPrice,
        rentalPrice: startingPrice,
        about: form.about.trim() || `${form.title} is a premier bridal makeup artist and grooming studio based in ${form.city}.`,
        description: form.description.trim() || form.about.trim() || "Specializing in HD bridal makeup, airbrush makeup, hairstyling, and party makeovers.",
        subcategories: form.selectedServices,
        mainCategories: form.selectedBrands,
        venueFeatures: form.selectedAmenities,
        photographyPackages: {
          basic: {
            title: form.packages.basic.title,
            price: Number(form.packages.basic.price) || 2500,
            description: form.packages.basic.description,
            deliverables: form.packages.basic.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          },
          standard: {
            title: form.packages.standard.title,
            price: Number(form.packages.standard.price) || 8500,
            description: form.packages.standard.description,
            deliverables: form.packages.standard.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          },
          premium: {
            title: form.packages.premium.title,
            price: Number(form.packages.premium.price) || 15000,
            description: form.packages.premium.description,
            deliverables: form.packages.premium.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          },
          luxury: {
            title: form.packages.luxury.title,
            price: Number(form.packages.luxury.price) || 28000,
            description: form.packages.luxury.description,
            deliverables: form.packages.luxury.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          },
        },
        images: form.images.length > 0 ? form.images : ["https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226359/flipsaura/categories/category_makeup-grooming.png"],
        videos: form.videos,
        active: Boolean(form.active),
        featured: Boolean(form.featured),
      };

      let res;
      if (isEdit) {
        res = await api.put(`/api/items/${initialData._id}`, payload);
      } else {
        res = await api.post("/api/items", payload);
      }

      if (res.data?.ok) {
        setSuccessMsg("✓ Makeup & Grooming service saved and published successfully!");
        setTimeout(() => {
          if (onSaved) onSaved(res.data.data?.item || res.data.data);
          onClose();
        }, 800);
      } else {
        setError(res.data?.error || "Failed to save makeup service.");
      }
    } catch (err) {
      console.error("Save makeup error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col border border-fuchsia-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 via-pink-50 to-rose-50 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-fuchsia-200 flex items-center justify-center text-lg sm:text-xl shadow-xs shrink-0">
              💄
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-base sm:text-xl font-bold text-ink truncate">
                {isEdit ? "Edit Makeup & Grooming Listing" : "Add Bridal Makeup & Grooming Listing"}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted line-clamp-1">
                Configure bridal makeup artist details, cosmetics brands, packages, portfolio, and styling services.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-ink hover:bg-white/80 transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1 text-ink">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Section 1: Basic Studio & Contact Info */}
          <div className="space-y-4 bg-white p-3.5 sm:p-5 rounded-2xl border border-fuchsia-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-fuchsia-950 border-b border-fuchsia-100 pb-2 flex items-center gap-2">
              <span>👑</span> Makeup Studio & Artist Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Artist / Studio / Salon Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Glamour Bride Makeover & Academy"
                  className="w-full px-3.5 py-2 rounded-xl border border-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Lead Artist / Contact Person
                </label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="e.g. Shalini Verma (Celebrity MUA)"
                  className="w-full px-3.5 py-2 rounded-xl border border-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Contact Phone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2 rounded-xl border border-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="e.g. artist@beplanr.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  City / District <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-xs sm:text-sm bg-white"
                >
                  {BIHAR_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Locality / Landmark
                </label>
                <input
                  type="text"
                  value={form.locality}
                  onChange={(e) => setForm({ ...form, locality: e.target.value })}
                  placeholder="e.g. Old GT Road, Near Patel Chowk"
                  className="w-full px-3.5 py-2 rounded-xl border border-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Makeup Services & Treatments */}
          <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-fuchsia-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-fuchsia-950 border-b border-fuchsia-100 pb-2 flex items-center gap-2">
              <span>✨</span> Services & Makeover Looks Offered
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {DEFAULT_MAKEUP_SERVICES.map((s) => {
                const selected = form.selectedServices.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition text-left cursor-pointer ${
                      selected
                        ? "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-400 font-semibold shadow-2xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                      selected ? "bg-fuchsia-600 text-white" : "border border-gray-300"
                    }`}>
                      {selected ? "✓" : ""}
                    </span>
                    <span className="truncate">{s}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Service Input */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                placeholder="Add custom makeup service (e.g. Nail Extension Art, Glitter Eyes)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-xs"
              />
              <button
                type="button"
                onClick={addCustomService}
                className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs transition cursor-pointer text-center"
              >
                + Add Custom
              </button>
            </div>
          </div>

          {/* Section 3: Cosmetics Brands & Facilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-fuchsia-100 space-y-3">
              <h4 className="font-serif font-bold text-sm text-fuchsia-950 border-b border-fuchsia-100 pb-2 flex items-center gap-2">
                <span>💄</span> Cosmetics Brands Used
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_MAKEUP_BRANDS.map((b) => {
                  const sel = form.selectedBrands.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBrand(b)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition text-left cursor-pointer ${
                        sel
                          ? "bg-pink-50 text-pink-900 border-pink-400 font-semibold"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {sel ? "✓ " : ""}{b}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-fuchsia-100 space-y-3">
              <h4 className="font-serif font-bold text-sm text-fuchsia-950 border-b border-fuchsia-100 pb-2 flex items-center gap-2">
                <span>⭐</span> Facilities & Service Policy
              </h4>
              <div className="space-y-1.5">
                {DEFAULT_MAKEUP_AMENITIES.map((a) => {
                  const sel = form.selectedAmenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium transition text-left cursor-pointer ${
                        sel
                          ? "bg-purple-50 text-purple-900 border-purple-400 font-semibold"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {sel ? "✓ " : ""}{a}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: 4-Tier Bridal Packages */}
          <div className="space-y-4 bg-white p-3.5 sm:p-5 rounded-2xl border border-fuchsia-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-fuchsia-950 border-b border-fuchsia-100 pb-2 flex items-center gap-2">
              <span>💼</span> Bridal & Party Makeover Packages
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {Object.entries(form.packages).map(([tierKey, pkg]) => (
                <div key={tierKey} className="p-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50/30 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-900">
                      {tierKey} Package
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-fuchsia-950">₹</span>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            packages: {
                              ...prev.packages,
                              [tierKey]: { ...prev.packages[tierKey], price: e.target.value },
                            },
                          }))
                        }
                        placeholder="Price"
                        className="w-24 px-2 py-1 rounded-lg border border-fuchsia-300 text-xs font-bold text-fuchsia-900 bg-white"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={pkg.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        packages: {
                          ...prev.packages,
                          [tierKey]: { ...prev.packages[tierKey], title: e.target.value },
                        },
                      }))
                    }
                    placeholder="Package Title"
                    className="w-full px-3 py-1.5 rounded-lg border border-fuchsia-200 text-xs font-semibold bg-white"
                  />

                  <textarea
                    rows={2}
                    value={pkg.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        packages: {
                          ...prev.packages,
                          [tierKey]: { ...prev.packages[tierKey], description: e.target.value },
                        },
                      }))
                    }
                    placeholder="Short description of makeup style & products..."
                    className="w-full px-3 py-1.5 rounded-lg border border-fuchsia-200 text-xs bg-white"
                  />

                  <input
                    type="text"
                    value={pkg.deliverables}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        packages: {
                          ...prev.packages,
                          [tierKey]: { ...prev.packages[tierKey], deliverables: e.target.value },
                        },
                      }))
                    }
                    placeholder="Deliverables (comma-separated: e.g. HD Makeup, Lashes, Draping)"
                    className="w-full px-3 py-1.5 rounded-lg border border-fuchsia-200 text-xs bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Photos & Videos */}
          <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-fuchsia-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-fuchsia-950 border-b border-fuchsia-100 pb-2 flex items-center gap-2">
              <span>📸</span> Real Brides Portfolio & Video Links
            </h4>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Upload Portfolio Photos
              </label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 rounded-xl border border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800 text-xs font-semibold hover:bg-fuchsia-100 transition cursor-pointer">
                  <span>📷 Choose Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {uploadingImage && <span className="text-xs text-muted font-medium">{uploadProgress}</span>}
              </div>

              {/* Direct image URLs */}
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <input
                  type="text"
                  value={directImageUrl}
                  onChange={(e) => setDirectImageUrl(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddDirectImage}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer text-center shrink-0"
                >
                  + Add URL
                </button>
              </div>

              {/* Photo thumbnails */}
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-fuchsia-200 group">
                      <img src={img} alt="Bride" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video links */}
            <div className="pt-3 border-t border-fuchsia-100 space-y-2">
              <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span className="text-rose-600">▶</span> Instagram Reel / YouTube Makeup Tour Video
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  placeholder="Video Title (e.g. Royal HD Bridal Reveal)"
                  className="w-full sm:w-1/3 px-3.5 py-2 rounded-xl border border-fuchsia-200 text-xs"
                />
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or Reel"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-fuchsia-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs transition cursor-pointer text-center shrink-0"
                  >
                    + Add Video
                  </button>
                </div>
              </div>

              {form.videos.length > 0 && (
                <div className="space-y-1 pt-1">
                  {form.videos.map((vid, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-fuchsia-50/50 border border-fuchsia-200 text-xs">
                      <span className="truncate font-medium">{vid.title} — {vid.url}</span>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }))}
                        className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 6: About & Experience */}
          <div className="space-y-3 bg-white p-3.5 sm:p-5 rounded-2xl border border-fuchsia-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-fuchsia-950 border-b border-fuchsia-100 pb-2 flex items-center gap-2">
              <span>📝</span> About the Makeup Artist & Booking Policies
            </h4>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Short Overview</label>
              <textarea
                rows={2}
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                placeholder="e.g. Certified bridal makeup artist with 7+ years of experience across luxury weddings in Bihar and North India."
                className="w-full px-3.5 py-2 rounded-xl border border-fuchsia-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Detailed Wedding Policies</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Booking deposit terms, cancellation policies, early morning muhurat charges, and travel allowances."
                className="w-full px-3.5 py-2 rounded-xl border border-fuchsia-200 text-xs"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-fuchsia-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-muted hover:text-ink cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold shadow-md shadow-fuchsia-600/20 disabled:opacity-50 transition cursor-pointer text-center"
            >
              {submitting ? "Saving..." : isEdit ? "Update Makeup Listing ✓" : "Publish Makeup Service ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
