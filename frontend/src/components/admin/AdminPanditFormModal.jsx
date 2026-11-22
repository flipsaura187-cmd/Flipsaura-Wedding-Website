"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";

const DEFAULT_PANDIT_CEREMONIES = [
  "Complete Vedic Vivah Sanskar (Full Wedding Vidhi)",
  "Sagai / Roka & Tilak Ceremony",
  "Haldi / Tel / Matrika Pooja",
  "Mandap Chhadan & Gauri Ganesh Pooja",
  "Navgrah Shanti & Hawan",
  "Satyanarayan Bhagwan Katha",
  "Griha Pravesh & Vastu Shanti",
  "Rudrabhishek & Mahamrityunjaya Jaap",
  "Kundali Matching & Guna Milan",
  "Shubh Muhurat & Jyotish Consultation",
];

const DEFAULT_TRADITIONS = [
  "North Indian / Sanatan Vedic Tradition",
  "Bihari Traditional Vivah Vidhi",
  "Maithil Vivah Vidhi (Mithila Parampara)",
  "Bhojpuri & Magahi Wedding Traditions",
  "Marwari / Rajasthani Vivah",
  "Arya Samaj Vivah Sanskar",
];

const DEFAULT_LANGUAGES = [
  "Sanskrit (Vedic Mantras & Slokas)",
  "Hindi (Detailed Vidhi & Katha explanation)",
  "Maithili",
  "Bhojpuri",
  "Magahi",
  "English (For NRI / modern couples)",
];

const DEFAULT_PANDIT_AMENITIES = [
  "Samagri Included Option Available",
  "Host-Provided Samagri Option (List given in advance)",
  "Destination & Outstation Travel Available",
  "Team of 2 to 4 Assistant / Sahayak Pandits",
  "Musical Shankhanaad & Vedic Stotra Chanting",
  "Pre-Wedding Kundali & Shubh Muhurat Call",
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

export default function AdminPanditFormModal({
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
    selectedCeremonies: [
      "Complete Vedic Vivah Sanskar (Full Wedding Vidhi)",
      "Sagai / Roka & Tilak Ceremony",
      "Haldi / Tel / Matrika Pooja",
      "Navgrah Shanti & Hawan",
    ],
    selectedTraditions: [
      "North Indian / Sanatan Vedic Tradition",
      "Bihari Traditional Vivah Vidhi",
    ],
    selectedLanguages: [
      "Sanskrit (Vedic Mantras & Slokas)",
      "Hindi (Detailed Vidhi & Katha explanation)",
    ],
    selectedAmenities: [
      "Host-Provided Samagri Option (List given in advance)",
      "Samagri Included Option Available",
      "Musical Shankhanaad & Vedic Stotra Chanting",
    ],
    packages: {
      basic: {
        title: "Roka / Sagai & Tilak Pooja",
        price: "2100",
        description: "Vedic Roka, Tilak, and Ganesh worship with auspicious sankalp and blessings.",
        deliverables: "Ganesh Pooja, Navgrah Smaran, Tilak Vidhi, Auspicious Sankalp",
      },
      standard: {
        title: "One-Day Complete Vivah Vidhi",
        price: "7100",
        description: "Authentic Vedic wedding rituals including Kanyadaan, Saptapadi, Sindoor Daan, and Laja Hom.",
        deliverables: "Full Vivah Vidhi (4-6 Hours), Kanyadaan, Saat Phere / Saptapadi, Sindoor Daan, Havan",
      },
      premium: {
        title: "Complete 2-Day Wedding Pooja",
        price: "12500",
        description: "Covers all wedding days from Haldi, Mandap Chhadan, Vivah Sanskar to morning Vidai blessings.",
        deliverables: "Haldi & Tel Pooja, Mandap Pujan, Vivah Sanskar, Griha Pravesh, Vidai Aashirwad",
      },
      luxury: {
        title: "All-Inclusive Vivah + Pure Samagri + 2 Acharyas",
        price: "21000",
        description: "Grand Vedic wedding conducted by 2 qualified Acharyas with 100% pure organic hawan samagri & pure ghee.",
        deliverables: "Lead Acharya + Assistant Pandit, All Sacred Samagri Included, Pure Desi Ghee, Shankh, Kundali Match",
      },
    },
    images: [],
    videos: [],
    active: true,
    featured: false,
  });

  const [customCeremony, setCustomCeremony] = useState("");
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
        selectedCeremonies: Array.isArray(initialData.subcategories) && initialData.subcategories.length > 0
          ? initialData.subcategories
          : [
              "Complete Vedic Vivah Sanskar (Full Wedding Vidhi)",
              "Sagai / Roka & Tilak Ceremony",
            ],
        selectedTraditions: Array.isArray(initialData.mainCategories) && initialData.mainCategories.length > 0
          ? initialData.mainCategories
          : ["North Indian / Sanatan Vedic Tradition"],
        selectedLanguages: [
          "Sanskrit (Vedic Mantras & Slokas)",
          "Hindi (Detailed Vidhi & Katha explanation)",
        ],
        selectedAmenities: Array.isArray(initialData.venueFeatures) && initialData.venueFeatures.length > 0
          ? initialData.venueFeatures
          : ["Host-Provided Samagri Option (List given in advance)"],
        packages: {
          basic: {
            title: initialData.photographyPackages?.basic?.title || "Roka / Sagai & Tilak Pooja",
            price: initialData.photographyPackages?.basic?.price || "2100",
            description: initialData.photographyPackages?.basic?.description || "Vedic Roka, Tilak, and Ganesh worship.",
            deliverables: (initialData.photographyPackages?.basic?.deliverables || []).join(", ") || "Ganesh Pooja, Tilak Vidhi",
          },
          standard: {
            title: initialData.photographyPackages?.standard?.title || "One-Day Complete Vivah Vidhi",
            price: initialData.photographyPackages?.standard?.price || "7100",
            description: initialData.photographyPackages?.standard?.description || "Authentic Vedic wedding rituals.",
            deliverables: (initialData.photographyPackages?.standard?.deliverables || []).join(", ") || "Full Vivah Vidhi, Kanyadaan, Saat Phere",
          },
          premium: {
            title: initialData.photographyPackages?.premium?.title || "Complete 2-Day Wedding Pooja",
            price: initialData.photographyPackages?.premium?.price || "12500",
            description: initialData.photographyPackages?.premium?.description || "All wedding poojas from Haldi to Vidai.",
            deliverables: (initialData.photographyPackages?.premium?.deliverables || []).join(", ") || "Haldi, Mandap, Vivah, Vidai",
          },
          luxury: {
            title: initialData.photographyPackages?.luxury?.title || "All-Inclusive Vivah + Pure Samagri + 2 Acharyas",
            price: initialData.photographyPackages?.luxury?.price || "21000",
            description: initialData.photographyPackages?.luxury?.description || "Grand wedding with 2 Acharyas and all samagri.",
            deliverables: (initialData.photographyPackages?.luxury?.deliverables || []).join(", ") || "2 Acharyas, All Samagri, Pure Ghee",
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

  const toggleCeremony = (c) => {
    setForm((prev) => ({
      ...prev,
      selectedCeremonies: prev.selectedCeremonies.includes(c)
        ? prev.selectedCeremonies.filter((x) => x !== c)
        : [...prev.selectedCeremonies, c],
    }));
  };

  const addCustomCeremony = () => {
    const trimmed = customCeremony.trim();
    if (!trimmed) return;
    if (!form.selectedCeremonies.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        selectedCeremonies: [...prev.selectedCeremonies, trimmed],
      }));
    }
    setCustomCeremony("");
  };

  const toggleTradition = (t) => {
    setForm((prev) => ({
      ...prev,
      selectedTraditions: prev.selectedTraditions.includes(t)
        ? prev.selectedTraditions.filter((x) => x !== t)
        : [...prev.selectedTraditions, t],
    }));
  };

  const toggleLanguage = (l) => {
    setForm((prev) => ({
      ...prev,
      selectedLanguages: prev.selectedLanguages.includes(l)
        ? prev.selectedLanguages.filter((x) => x !== l)
        : [...prev.selectedLanguages, l],
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
        const url = await uploadFile(files[i], "flipsaura/pandit");
        if (url) uploadedUrls.push(url);
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      console.error("Pandit upload error:", err);
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
          title: newVideoTitle.trim() || "Vedic Chanting & Pooja Video",
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
      setError("Please enter Pandit / Acharya / Mandali Name.");
      return;
    }
    if (!form.city.trim()) {
      setError("City / District is required.");
      return;
    }

    setSubmitting(true);

    try {
      // Find Pandit / Priest category ID
      let categoryId = null;
      try {
        const catRes = await api.get("/api/categories");
        const cats = catRes.data?.data?.categories || [];
        const panditCat = cats.find(
          (c) => c.slug === "pandit-priest" || c.name.toLowerCase().includes("pandit") || c.name.toLowerCase().includes("priest")
        );
        if (panditCat) categoryId = panditCat._id;
      } catch (catErr) {
        console.warn("Category fetch fallback:", catErr);
      }

      const startingPrice =
        Number(form.price) ||
        Number(form.packages.standard.price) ||
        Number(form.packages.basic.price) ||
        7100;

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
        about: form.about.trim() || `${form.title} is a revered Vedic Acharya & priest providing authentic Vivah Vidhi and sacred pooja ceremonies in ${form.city}.`,
        description: form.description.trim() || form.about.trim() || "Conducting traditional Vedic wedding rituals with pure Sanskrit mantra uccharan, hawan, and spiritual solemnity.",
        subcategories: form.selectedCeremonies,
        mainCategories: form.selectedTraditions,
        venueFeatures: [...form.selectedAmenities, ...form.selectedLanguages],
        photographyPackages: {
          basic: {
            title: form.packages.basic.title,
            price: Number(form.packages.basic.price) || 2100,
            description: form.packages.basic.description,
            deliverables: form.packages.basic.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          },
          standard: {
            title: form.packages.standard.title,
            price: Number(form.packages.standard.price) || 7100,
            description: form.packages.standard.description,
            deliverables: form.packages.standard.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          },
          premium: {
            title: form.packages.premium.title,
            price: Number(form.packages.premium.price) || 12500,
            description: form.packages.premium.description,
            deliverables: form.packages.premium.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          },
          luxury: {
            title: form.packages.luxury.title,
            price: Number(form.packages.luxury.price) || 21000,
            description: form.packages.luxury.description,
            deliverables: form.packages.luxury.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          },
        },
        images: form.images.length > 0 ? form.images : ["https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226362/flipsaura/categories/category_pandit-priest.png"],
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
        setSuccessMsg("✓ Pandit & Vedic Rituals listing saved and published successfully!");
        setTimeout(() => {
          if (onSaved) onSaved(res.data.data?.item || res.data.data);
          onClose();
        }, 800);
      } else {
        setError(res.data?.error || "Failed to save pandit listing.");
      }
    } catch (err) {
      console.error("Save pandit error:", err);
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
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col border border-amber-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-amber-300 flex items-center justify-center text-lg sm:text-xl shadow-xs shrink-0">
              🕉️
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-base sm:text-xl font-bold text-amber-950 truncate">
                {isEdit ? "Edit Pandit & Vedic Rituals Listing" : "Add Pandit & Vedic Rituals Listing"}
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-800/80 line-clamp-1">
                Configure Vedic Vivah Vidhi, Havans, Samagri options, Traditions, Languages, and Dakshina packages.
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

          {/* Section 1: Pandit & Contact Info */}
          <div className="space-y-4 bg-white p-3.5 sm:p-5 rounded-2xl border border-amber-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-amber-950 border-b border-amber-100 pb-2 flex items-center gap-2">
              <span>📿</span> Acharya / Pandit / Mandali Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Pandit / Acharya / Mandali Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Acharya Pt. Rameshwar Shastri (Vedic Vivah Mandali)"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Lead Acharya / Contact Person
                </label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="e.g. Pt. Rameshwar Shastri"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="e.g. acharya@beplanr.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  City / District <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm bg-white"
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
                  Locality / Temple / Ashram Address
                </label>
                <input
                  type="text"
                  value={form.locality}
                  onChange={(e) => setForm({ ...form, locality: e.target.value })}
                  placeholder="e.g. Shiv Mandir Parisar, Main Road"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ceremonies & Pooja Vidhi Catalogue */}
          <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-amber-950 border-b border-amber-100 pb-2 flex items-center gap-2">
              <span>🔥</span> Vedic Rituals & Ceremonies Conducted
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {DEFAULT_PANDIT_CEREMONIES.map((c) => {
                const selected = form.selectedCeremonies.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCeremony(c)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition text-left cursor-pointer ${
                      selected
                        ? "bg-amber-50 text-amber-950 border-amber-400 font-semibold shadow-2xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                      selected ? "bg-amber-600 text-white" : "border border-gray-300"
                    }`}>
                      {selected ? "✓" : ""}
                    </span>
                    <span className="truncate">{c}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Ceremony Input */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                value={customCeremony}
                onChange={(e) => setCustomCeremony(e.target.value)}
                placeholder="Add custom pooja / anushthan (e.g. Sundarkand Paath, Shanti Hawan)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
              <button
                type="button"
                onClick={addCustomCeremony}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition cursor-pointer text-center"
              >
                + Add Custom
              </button>
            </div>
          </div>

          {/* Section 3: Traditions, Languages & Samagri Facilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-100 space-y-2.5">
              <h5 className="font-serif font-bold text-xs text-amber-950 border-b border-amber-100 pb-1.5 flex items-center gap-1.5">
                <span>🚩</span> Traditions / Sampraday
              </h5>
              <div className="space-y-1.5">
                {DEFAULT_TRADITIONS.map((t) => {
                  const sel = form.selectedTraditions.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTradition(t)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium transition text-left cursor-pointer truncate ${
                        sel ? "bg-amber-50 text-amber-900 border-amber-400 font-semibold" : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {sel ? "✓ " : ""}{t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-100 space-y-2.5">
              <h5 className="font-serif font-bold text-xs text-amber-950 border-b border-amber-100 pb-1.5 flex items-center gap-1.5">
                <span>🗣️</span> Languages Spoken
              </h5>
              <div className="space-y-1.5">
                {DEFAULT_LANGUAGES.map((l) => {
                  const sel = form.selectedLanguages.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleLanguage(l)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium transition text-left cursor-pointer truncate ${
                        sel ? "bg-orange-50 text-orange-900 border-orange-400 font-semibold" : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {sel ? "✓ " : ""}{l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-100 space-y-2.5 sm:col-span-2 md:col-span-1">
              <h5 className="font-serif font-bold text-xs text-amber-950 border-b border-amber-100 pb-1.5 flex items-center gap-1.5">
                <span>🌿</span> Samagri & Travel Policy
              </h5>
              <div className="space-y-1.5">
                {DEFAULT_PANDIT_AMENITIES.map((a) => {
                  const sel = form.selectedAmenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium transition text-left cursor-pointer truncate ${
                        sel ? "bg-yellow-50 text-yellow-900 border-yellow-400 font-semibold" : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {sel ? "✓ " : ""}{a}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: 4-Tier Dakshina & Ceremony Packages */}
          <div className="space-y-4 bg-white p-3.5 sm:p-5 rounded-2xl border border-amber-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-amber-950 border-b border-amber-100 pb-2 flex items-center gap-2">
              <span>💰</span> Dakshina & Pooja Packages
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {Object.entries(form.packages).map(([tierKey, pkg]) => (
                <div key={tierKey} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      {tierKey} Package
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-amber-950">₹</span>
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
                        className="w-24 px-2 py-1 rounded-lg border border-amber-300 text-xs font-bold text-amber-900 bg-white"
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
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold bg-white"
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
                    placeholder="Short description of rituals and sacred vidhi..."
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-200 text-xs bg-white"
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
                    placeholder="Deliverables (e.g. Vivah Vidhi, Kanyadaan, Saat Phere, Havan)"
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-200 text-xs bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Photos & Videos */}
          <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-amber-950 border-b border-amber-100 pb-2 flex items-center gap-2">
              <span>📸</span> Ceremony Photos & Chanting Videos
            </h4>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Upload Mandap / Pooja Photos
              </label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer">
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
                  className="flex-1 px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
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
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-amber-200 group">
                      <img src={img} alt="Pooja" className="w-full h-full object-cover" />
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
            <div className="pt-3 border-t border-amber-100 space-y-2">
              <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span className="text-rose-600">▶</span> YouTube Chanting / Mandap Hawan Video
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  placeholder="Video Title (e.g. Vedic Vivah Mantra Uccharan)"
                  className="w-full sm:w-1/3 px-3.5 py-2 rounded-xl border border-amber-200 text-xs"
                />
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or Reel"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-amber-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition cursor-pointer text-center shrink-0"
                  >
                    + Add Video
                  </button>
                </div>
              </div>

              {form.videos.length > 0 && (
                <div className="space-y-1 pt-1">
                  {form.videos.map((vid, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
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
          <div className="space-y-3 bg-white p-3.5 sm:p-5 rounded-2xl border border-amber-100 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-amber-950 border-b border-amber-100 pb-2 flex items-center gap-2">
              <span>📜</span> Acharya Credentials, Sampraday Background & Terms
            </h4>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Short Overview</label>
              <textarea
                rows={2}
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                placeholder="e.g. Acharya in Sanskrit & Veda from Varanasi, with 15+ years of experience conducting authentic Sanatan Vivah Sanskar."
                className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Detailed Pooja Policies & Samagri Notes</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Details on advance booking, muhurat timings, samagri arrangements, outstation dakshina, and ritual guidelines."
                className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-xs"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-amber-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
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
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 transition cursor-pointer text-center"
            >
              {submitting ? "Saving..." : isEdit ? "Update Pandit Listing ✓" : "Publish Pandit Listing ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
