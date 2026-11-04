"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";

// Default Mehandi Catalogue Options
const DEFAULT_MEHANDI_CATALOGUE = [
  {
    id: "services",
    name: "A. Mehndi Application & Services",
    icon: "🖐️",
    description: "Bridal, semi-bridal, family, and ceremony mehndi services.",
    subcategories: [
      "Bridal Full Hands & Feet (Elbow to Palm, Knee to Toes)",
      "Bridal Hands Only (Intricate Elbow Length)",
      "Semi-Bridal Mehndi",
      "Engagement / Roka Mehndi",
      "Baby Shower / Godh Bharai Mehndi",
      "Sangeet & Family Guest Mehndi",
      "Guest Mehndi (Per Hand / Per Person)",
      "Bridesmaids Mehndi Package",
      "Groom / Dulha Mehndi",
    ],
  },
  {
    id: "styles",
    name: "B. Mehndi Design Styles",
    icon: "✨",
    description: "Traditional, contemporary, artistic, and figurative design styles.",
    subcategories: [
      "Traditional Rajasthani Mehndi",
      "Marwari Intricate Henna",
      "Arabic Bold Floral Mehndi",
      "Indo-Arabic Fusion",
      "Portrait / Dulha-Dulhan Figurative Art",
      "Mandala & Geometric Art",
      "Moroccan Mehndi",
      "Kolkata / Bengali Fine Line",
      "Khafif Gulf Style",
      "Western Tattoo Mehndi",
      "Minimalist Negative Space Art",
    ],
  },
  {
    id: "quality",
    name: "C. Henna Quality & Aftercare",
    icon: "🌿",
    description: "Organic materials, stain guarantee, and herbal aftercare.",
    subcategories: [
      "100% Organic Natural Herbal Henna",
      "Chemical-Free & Ammonia-Free Cone",
      "Guaranteed Dark Mahogany Stain",
      "Nilgiri & Eucalyptus Oil Infused",
      "Clove Smoke & Lemon-Sugar Aftercare",
      "White Henna & Glitter Accents",
    ],
  },
  {
    id: "team",
    name: "D. Team, Travel & Setup Facilities",
    icon: "👥",
    description: "Artist team size, destination travel, and event setup.",
    subcategories: [
      "Team of 2 to 5 Assistant Artists",
      "Team of 5+ Artists for Large Weddings",
      "Home Visit Service Available",
      "Destination & Outstation Travel Available",
      "Mehndi Seating, Cushions & Props Setup",
      "High-Intensity Lighting for Night Events",
    ],
  },
];

export default function AdminMehandiFormModal({
  isOpen,
  onClose,
  initialData,
  onSaved,
  isVendor = false,
}) {
  const [activeTab, setActiveTab] = useState("basic"); // basic | options | packages | photos | albums | videos | about

  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    address: "",
    locality: "",
    city: "Daudnagar",
    state: "Bihar",
    pincode: "",
    contactPhone: "",
    contactEmail: "",
    price: "",
    about: "",
    description: "",
    photos: [],
    albums: [],
    videos: [],
    mainCategories: [],
    subcategories: [],
    customSubcategoriesMap: {},
    mehandiPackages: {
      basic: {
        price: "3500",
        title: "Basic Package",
        description: "Simple bridal hands or family guest mehndi coverage.",
        deliverables: [
          "Bridal Hands Mehndi (Wrist length)",
          "100% Organic Herbal Cone",
          "Up to 5 Family Guest Hands",
        ],
      },
      standard: {
        price: "7500",
        title: "Standard Package",
        description: "Complete bridal hands & feet with traditional Rajasthani or Arabic designs.",
        deliverables: [
          "Full Bridal Hands (Elbow length)",
          "Full Bridal Feet (Ankle length)",
          "Up to 15 Guest Hands",
          "Clove smoke & aftercare kit",
        ],
      },
      premium: {
        price: "15000",
        title: "Premium Package",
        description: "Intricate designer bridal mehndi with portrait art & assistant team.",
        deliverables: [
          "Intricate Bridal Hands (Elbow to palm)",
          "Intricate Bridal Feet (Mid-calf)",
          "Dulha-Dulhan Portrait Figurative Art",
          "1 Lead Artist + 2 Assistant Artists",
          "Up to 30 Family / Guest Hands",
          "Dark stain guarantee formula",
        ],
      },
      luxury: {
        price: "25000",
        title: "Luxury Royal Package",
        description: "Ultra-luxury celebrity style custom storytelling mehndi for destination weddings.",
        deliverables: [
          "Custom Love Story / Portrait Bridal Mehndi",
          "Full Legs & Full Arms Royal Coverage",
          "Team of 4 Professional Artists",
          "Unlimited Guest Mehndi Coverage (Sangeet Night)",
          "Groom Royal Dulha Mehndi included",
          "Bridal Touch-up & Dark Stain Aftercare Kit",
        ],
      },
    },
    active: true,
    featured: false,
    rating: "4.8",
    reviewsCount: "0",
  });

  // Custom Category & Option states
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customOptionInputs, setCustomOptionInputs] = useState({});

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
  const [uploadingAlbumCover, setUploadingAlbumCover] = useState(false);
  const [uploadingAlbumPhotos, setUploadingAlbumPhotos] = useState(false);
  const [albumPhotosList, setAlbumPhotosList] = useState([]);

  // New video draft state
  const [newVideo, setNewVideo] = useState({
    title: "",
    url: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load initial data on edit
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.title || initialData.name || "",
        contactPerson: initialData.contactPerson || "",
        address: initialData.address || "",
        locality: initialData.locality || "",
        city: initialData.city || "Daudnagar",
        state: initialData.state || "Bihar",
        pincode: initialData.pincode || "",
        contactPhone: initialData.contactPhone || initialData.vendor?.phone || "",
        contactEmail: initialData.contactEmail || initialData.vendor?.email || "",
        price: initialData.price ? String(initialData.price) : "",
        about: initialData.about || "",
        description: initialData.description || initialData.about || "",
        photos: Array.isArray(initialData.images) ? initialData.images : [],
        albums: Array.isArray(initialData.albums) ? initialData.albums : [],
        videos: Array.isArray(initialData.videos) ? initialData.videos : [],
        mainCategories: Array.isArray(initialData.mainCategories) ? initialData.mainCategories : [],
        subcategories: Array.isArray(initialData.subcategories) ? initialData.subcategories : [],
        customSubcategoriesMap: initialData.customSubcategoriesMap || {},
        mehandiPackages: {
          basic: {
            price: initialData.mehandiPackages?.basic?.price !== undefined ? String(initialData.mehandiPackages.basic.price) : "3500",
            title: initialData.mehandiPackages?.basic?.title || "Basic Package",
            description: initialData.mehandiPackages?.basic?.description || "Simple bridal hands or family guest mehndi coverage.",
            deliverables: initialData.mehandiPackages?.basic?.deliverables || [
              "Bridal Hands Mehndi (Wrist length)",
              "100% Organic Herbal Cone",
              "Up to 5 Family Guest Hands",
            ],
          },
          standard: {
            price: initialData.mehandiPackages?.standard?.price !== undefined ? String(initialData.mehandiPackages.standard.price) : "7500",
            title: initialData.mehandiPackages?.standard?.title || "Standard Package",
            description: initialData.mehandiPackages?.standard?.description || "Complete bridal hands & feet with traditional Rajasthani or Arabic designs.",
            deliverables: initialData.mehandiPackages?.standard?.deliverables || [
              "Full Bridal Hands (Elbow length)",
              "Full Bridal Feet (Ankle length)",
              "Up to 15 Guest Hands",
              "Clove smoke & aftercare kit",
            ],
          },
          premium: {
            price: initialData.mehandiPackages?.premium?.price !== undefined ? String(initialData.mehandiPackages.premium.price) : "15000",
            title: initialData.mehandiPackages?.premium?.title || "Premium Package",
            description: initialData.mehandiPackages?.premium?.description || "Intricate designer bridal mehndi with portrait art & assistant team.",
            deliverables: initialData.mehandiPackages?.premium?.deliverables || [
              "Intricate Bridal Hands (Elbow to palm)",
              "Intricate Bridal Feet (Mid-calf)",
              "Dulha-Dulhan Portrait Figurative Art",
              "1 Lead Artist + 2 Assistant Artists",
              "Up to 30 Family / Guest Hands",
            ],
          },
          luxury: {
            price: initialData.mehandiPackages?.luxury?.price !== undefined ? String(initialData.mehandiPackages.luxury.price) : "25000",
            title: initialData.mehandiPackages?.luxury?.title || "Luxury Royal Package",
            description: initialData.mehandiPackages?.luxury?.description || "Ultra-luxury celebrity style custom storytelling mehndi for destination weddings.",
            deliverables: initialData.mehandiPackages?.luxury?.deliverables || [
              "Custom Love Story / Portrait Bridal Mehndi",
              "Full Legs & Full Arms Royal Coverage",
              "Team of 4 Professional Artists",
              "Unlimited Guest Mehndi Coverage (Sangeet Night)",
              "Groom Royal Dulha Mehndi included",
            ],
          },
        },
        active: initialData.active !== undefined ? initialData.active : true,
        featured: Boolean(initialData.featured),
        rating: initialData.rating ? String(initialData.rating) : "4.8",
        reviewsCount: initialData.reviewsCount ? String(initialData.reviewsCount) : "0",
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  // Toggle Subcategory
  const handleToggleSubcategory = (mainCatName, subcat) => {
    setForm((prev) => {
      const hasSub = prev.subcategories.includes(subcat);
      const newSubs = hasSub
        ? prev.subcategories.filter((s) => s !== subcat)
        : [...prev.subcategories, subcat];

      const newMains = new Set(prev.mainCategories);
      if (!hasSub) {
        newMains.add(mainCatName);
      }
      return {
        ...prev,
        subcategories: newSubs,
        mainCategories: Array.from(newMains),
      };
    });
  };

  // Add Custom Option under Category
  const handleAddCustomOption = (catName) => {
    const val = (customOptionInputs[catName] || "").trim();
    if (!val) return;

    setForm((prev) => {
      const map = { ...prev.customSubcategoriesMap };
      const currentList = map[catName] || [];
      if (!currentList.includes(val)) {
        map[catName] = [...currentList, val];
      }
      return {
        ...prev,
        customSubcategoriesMap: map,
        subcategories: [...new Set([...prev.subcategories, val])],
        mainCategories: [...new Set([...prev.mainCategories, catName])],
      };
    });

    setCustomOptionInputs((prev) => ({ ...prev, [catName]: "" }));
  };

  // Add Entire New Custom Category
  const handleAddNewCategory = () => {
    const catName = customCategoryName.trim();
    if (!catName) return;

    setForm((prev) => {
      const map = { ...prev.customSubcategoriesMap };
      if (!map[catName]) {
        map[catName] = [];
      }
      return {
        ...prev,
        customSubcategoriesMap: map,
        mainCategories: [...new Set([...prev.mainCategories, catName])],
      };
    });

    setCustomCategoryName("");
  };

  // Package deliverables
  const handleAddDeliverable = (pkgKey) => {
    const itemToAdd = newDeliverable[pkgKey]?.trim();
    if (!itemToAdd) return;

    setForm((prev) => ({
      ...prev,
      mehandiPackages: {
        ...prev.mehandiPackages,
        [pkgKey]: {
          ...prev.mehandiPackages[pkgKey],
          deliverables: [...(prev.mehandiPackages[pkgKey].deliverables || []), itemToAdd],
        },
      },
    }));

    setNewDeliverable((prev) => ({ ...prev, [pkgKey]: "" }));
  };

  const handleQuickAddChip = (pkgKey, chipText) => {
    setForm((prev) => {
      const currentList = prev.mehandiPackages[pkgKey].deliverables || [];
      if (currentList.includes(chipText)) return prev;
      return {
        ...prev,
        mehandiPackages: {
          ...prev.mehandiPackages,
          [pkgKey]: {
            ...prev.mehandiPackages[pkgKey],
            deliverables: [...currentList, chipText],
          },
        },
      };
    });
  };

  const handleRemoveDeliverable = (pkgKey, idx) => {
    setForm((prev) => ({
      ...prev,
      mehandiPackages: {
        ...prev.mehandiPackages,
        [pkgKey]: {
          ...prev.mehandiPackages[pkgKey],
          deliverables: prev.mehandiPackages[pkgKey].deliverables.filter((_, i) => i !== idx),
        },
      },
    }));
  };

  // Photos
  const handleAddDirectPhoto = () => {
    if (!directPhotoUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, directPhotoUrl.trim()],
    }));
    setDirectPhotoUrl("");
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImage(true);
    setUploadProgress(`Uploading 1 of ${files.length}...`);
    setError("");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        const file = files[i];
        const url = await uploadFile(file, "flipsaura/mehandi");
        if (url) {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          photos: [...prev.photos, ...uploadedUrls],
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Image upload failed. You can paste direct image URLs instead.");
    } finally {
      setUploadingImage(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (idx) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  // Album Handlers & Uploads
  const handleAlbumCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAlbumCover(true);
    setError("");
    try {
      const url = await uploadFile(file, "flipsaura/albums");
      if (url) {
        setNewAlbum((prev) => ({ ...prev, coverImage: url }));
      }
    } catch (err) {
      console.error("Album cover upload error:", err);
      setError("Failed to upload album cover image.");
    } finally {
      setUploadingAlbumCover(false);
      e.target.value = "";
    }
  };

  const handleAlbumPhotosUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingAlbumPhotos(true);
    setError("");
    try {
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], "flipsaura/albums");
        if (url) uploaded.push(url);
      }
      if (uploaded.length > 0) {
        setAlbumPhotosList((prev) => [...prev, ...uploaded]);
        setNewAlbum((prev) => ({
          ...prev,
          coverImage: prev.coverImage || uploaded[0] || "",
        }));
      }
    } catch (err) {
      console.error("Album photos upload error:", err);
      setError("Failed to upload album photos.");
    } finally {
      setUploadingAlbumPhotos(false);
      e.target.value = "";
    }
  };

  const handleRemoveAlbumDraftPhoto = (idx) => {
    setAlbumPhotosList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddAlbum = () => {
    if (!newAlbum.title.trim()) {
      setError("Please enter an Album Title");
      return;
    }

    const imgsFromText = newAlbum.imagesText
      ? newAlbum.imagesText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : [];
    const allImgs = Array.from(new Set([...albumPhotosList, ...imgsFromText]));

    setForm((prev) => ({
      ...prev,
      albums: [
        ...prev.albums,
        {
          title: newAlbum.title.trim(),
          description: newAlbum.description.trim(),
          coverImage: newAlbum.coverImage.trim() || allImgs[0] || "",
          images: allImgs,
          link: newAlbum.link.trim(),
        },
      ],
    }));

    setNewAlbum({ title: "", description: "", coverImage: "", imagesText: "", link: "" });
    setAlbumPhotosList([]);
    setError("");
  };

  const handleRemoveAlbum = (idx) => {
    setForm((prev) => ({
      ...prev,
      albums: prev.albums.filter((_, i) => i !== idx),
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Mehandi Artist or Studio Name is required");
      setActiveTab("basic");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim(),
        address: form.address.trim(),
        locality: form.locality.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        about: form.about.trim(),
        description: form.description.trim() || form.about.trim(),
        price: Number(form.price) || 0,
        photos: form.photos,
        albums: form.albums,
        videos: form.videos,
        mainCategories: form.mainCategories,
        subcategories: form.subcategories,
        customSubcategoriesMap: form.customSubcategoriesMap,
        mehandiPackages: {
          basic: {
            price: Number(form.mehandiPackages.basic.price) || 0,
            title: form.mehandiPackages.basic.title,
            description: form.mehandiPackages.basic.description,
            deliverables: form.mehandiPackages.basic.deliverables,
          },
          standard: {
            price: Number(form.mehandiPackages.standard.price) || 0,
            title: form.mehandiPackages.standard.title,
            description: form.mehandiPackages.standard.description,
            deliverables: form.mehandiPackages.standard.deliverables,
          },
          premium: {
            price: Number(form.mehandiPackages.premium.price) || 0,
            title: form.mehandiPackages.premium.title,
            description: form.mehandiPackages.premium.description,
            deliverables: form.mehandiPackages.premium.deliverables,
          },
          luxury: {
            price: Number(form.mehandiPackages.luxury.price) || 0,
            title: form.mehandiPackages.luxury.title,
            description: form.mehandiPackages.luxury.description,
            deliverables: form.mehandiPackages.luxury.deliverables,
          },
        },
        active: form.active,
        featured: form.featured,
        rating: Number(form.rating) || 4.8,
        reviewsCount: Number(form.reviewsCount) || 0,
      };

      let res;
      const endpoint = isVendor ? `/api/vendor/mehandi` : `/api/admin/mehandi`;
      if (initialData?._id) {
        res = await api.put(`${endpoint}/${initialData._id}`, payload);
      } else {
        res = await api.post(endpoint, payload);
      }

      if (res.data?.ok) {
        setSuccessMsg(initialData?._id ? "Mehandi listing updated successfully!" : "Mehandi listing created successfully!");
        if (onSaved) onSaved(res.data.data.item);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        throw new Error(res.data?.error || "Failed to save Mehandi listing");
      }
    } catch (err) {
      console.error("Save Mehandi error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save Mehandi listing");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic & Contact", icon: "📋" },
    { id: "options", label: `Designs & Options (${form.subcategories.length})`, icon: "🌿" },
    { id: "packages", label: "Packages (4)", icon: "💰" },
    { id: "photos", label: `Photos (${form.photos.length})`, icon: "📸" },
    { id: "albums", label: `Albums (${form.albums.length})`, icon: "📖" },
    { id: "about", label: "About & Bio", icon: "📝" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-brand-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-brand-100 flex items-start sm:items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg sm:text-xl shadow-sm shrink-0">
              🌿
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif font-bold text-base sm:text-xl text-ink truncate">
                {initialData?._id ? "Edit Mehndi Artist Listing" : "Add New Mehndi Artist"}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted truncate">
                Configure artist profile, designs catalogue, custom options & bridal packages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-muted hover:text-ink flex items-center justify-center border border-line transition shadow-2xs shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-6 border-b border-line bg-surface/40 overflow-x-auto scrollbar-none shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 sm:py-3 px-3 sm:px-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-800 bg-white"
                  : "border-transparent text-muted hover:text-ink hover:bg-white/50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: BASIC & CONTACT */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Artist / Studio Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Heena Arts & Bridal Mehndi"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Lead Artist / Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pooja Verma"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Contact Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Vendor can log in directly with this mobile number to manage their services.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. artist@flipsaura.com"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Complete Studio / Base Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Market Road, Near Old Bus Stand"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rapid Colony"
                    value={form.locality}
                    onChange={(e) => setForm({ ...form, locality: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Daudnagar"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="Bihar"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    placeholder="824143"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Starting Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Auto-calculated from lowest package if left empty.
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-ink">Active Listing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-ink">Featured</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPTIONS & CUSTOM DESIGNS */}
          {activeTab === "options" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs">
                <b>💡 Interactive Mehndi Options & Custom Additions:</b> Click on any design or service option to include it in this listing. You can also add your own custom categories and specific custom options below.
              </div>

              {/* Standard Catalogue Sections */}
              {DEFAULT_MEHANDI_CATALOGUE.map((cat) => {
                const customItemsForCat = form.customSubcategoriesMap[cat.name] || [];
                const allSubcats = [...cat.subcategories, ...customItemsForCat];
                const selectedCount = allSubcats.filter((s) => form.subcategories.includes(s)).length;

                return (
                  <div key={cat.id} className="p-4 rounded-2xl border border-line bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-ink">{cat.name}</h4>
                          <p className="text-xs text-muted">{cat.description}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {selectedCount} selected
                      </span>
                    </div>

                    {/* Chips grid */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {allSubcats.map((subcat) => {
                        const isSelected = form.subcategories.includes(subcat);
                        return (
                          <button
                            key={subcat}
                            type="button"
                            onClick={() => handleToggleSubcategory(cat.name, subcat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs font-semibold"
                                : "bg-surface hover:bg-emerald-50 text-ink/80 border border-line"
                            }`}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{subcat}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom option input for this category */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`+ Add custom option to ${cat.name}...`}
                        value={customOptionInputs[cat.name] || ""}
                        onChange={(e) =>
                          setCustomOptionInputs({ ...customOptionInputs, [cat.name]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomOption(cat.name);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-line text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomOption(cat.name)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Add Option
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic User-Added Categories */}
              {Object.keys(form.customSubcategoriesMap)
                .filter((catName) => !DEFAULT_MEHANDI_CATALOGUE.some((c) => c.name === catName))
                .map((customCatName) => {
                  const items = form.customSubcategoriesMap[customCatName] || [];
                  return (
                    <div key={customCatName} className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/30 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌟</span>
                          <div>
                            <h4 className="font-bold text-sm text-ink">{customCatName}</h4>
                            <span className="text-[11px] text-emerald-800 font-semibold">Custom Category</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {items.map((subcat) => {
                          const isSelected = form.subcategories.includes(subcat);
                          return (
                            <button
                              key={subcat}
                              type="button"
                              onClick={() => handleToggleSubcategory(customCatName, subcat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                                  : "bg-white hover:bg-emerald-50 text-ink/80 border border-line"
                              }`}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{subcat}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`+ Add option to ${customCatName}...`}
                          value={customOptionInputs[customCatName] || ""}
                          onChange={(e) =>
                            setCustomOptionInputs({ ...customOptionInputs, [customCatName]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomOption(customCatName);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-line text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomOption(customCatName)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          Add Option
                        </button>
                      </div>
                    </div>
                  );
                })}

              {/* Add Brand New Category Button */}
              <div className="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/20 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="+ Create completely new custom category (e.g. Glitter & Tattoos)..."
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="flex-1 w-full px-3.5 py-2 rounded-xl border border-line text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-2xs whitespace-nowrap"
                >
                  + Add Custom Category
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PACKAGES */}
          {activeTab === "packages" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs">
                <b>💰 4-Tier Mehndi Pricing Packages:</b> Configure Basic, Standard, Premium, and Luxury packages. Use quick-click chips or add custom deliverables.
              </div>

              {["basic", "standard", "premium", "luxury"].map((pkgKey) => {
                const pkg = form.mehandiPackages[pkgKey];
                const badgeColor =
                  pkgKey === "basic"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : pkgKey === "standard"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : pkgKey === "premium"
                    ? "bg-purple-50 text-purple-800 border-purple-200"
                    : "bg-amber-50 text-amber-800 border-amber-200";

                const suggestedDeliverables =
                  pkgKey === "basic"
                    ? ["Simple Bridal Hands (Wrist length)", "100% Organic Henna", "Up to 5 Guest Hands", "Arabic Design"]
                    : pkgKey === "standard"
                    ? ["Full Bridal Hands (Elbow length)", "Full Bridal Feet (Ankle)", "Up to 15 Guest Hands", "Rajasthani Traditional", "Clove Smoke Aftercare"]
                    : pkgKey === "premium"
                    ? ["Intricate Bridal Hands & Feet", "Dulha-Dulhan Portrait Art", "1 Lead + 2 Assistant Artists", "Up to 30 Family Hands", "Dark Stain Guarantee"]
                    : ["Royal Love Story Portrait Art", "Full Legs & Arms Royal Coverage", "Team of 4 Artists", "Unlimited Guest Sangeet Mehndi", "Groom Mehndi Included"];

                return (
                  <div key={pkgKey} className="p-4 sm:p-5 rounded-2xl border border-line bg-white shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${badgeColor}`}>
                          {pkgKey}
                        </span>
                        <input
                          type="text"
                          value={pkg.title}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              mehandiPackages: {
                                ...form.mehandiPackages,
                                [pkgKey]: { ...pkg, title: e.target.value },
                              },
                            })
                          }
                          className="font-bold text-sm sm:text-base text-ink px-2 py-1 rounded border border-transparent hover:border-line focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted font-medium">Price (₹):</span>
                        <input
                          type="number"
                          min="0"
                          value={pkg.price}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              mehandiPackages: {
                                ...form.mehandiPackages,
                                [pkgKey]: { ...pkg, price: e.target.value },
                              },
                            })
                          }
                          className="w-32 px-3 py-1.5 rounded-lg border border-line text-sm font-bold text-wine focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1">
                        Package Description
                      </label>
                      <input
                        type="text"
                        value={pkg.description}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            mehandiPackages: {
                              ...form.mehandiPackages,
                              [pkgKey]: { ...pkg, description: e.target.value },
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-line text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Quick-Click Deliverables Chips */}
                    <div>
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
                        ⚡ Quick Add Deliverable Option:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedDeliverables.map((chip) => {
                          const alreadyAdded = (pkg.deliverables || []).includes(chip);
                          return (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => handleQuickAddChip(pkgKey, chip)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                                alreadyAdded
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                                  : "bg-surface hover:bg-emerald-50 text-ink/70 border-line"
                              }`}
                            >
                              <span>{alreadyAdded ? "✓" : "+"}</span>
                              <span>{chip}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Deliverables List */}
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1.5">
                        Deliverables Included ({pkg.deliverables?.length || 0})
                      </label>
                      <div className="space-y-1.5 mb-2">
                        {(pkg.deliverables || []).map((d, dIdx) => (
                          <div
                            key={dIdx}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface text-xs text-ink border border-line"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{d}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDeliverable(pkgKey, dIdx)}
                              className="text-muted hover:text-rose-600 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Custom Deliverable input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type custom deliverable & press Enter..."
                          value={newDeliverable[pkgKey]}
                          onChange={(e) =>
                            setNewDeliverable({ ...newDeliverable, [pkgKey]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddDeliverable(pkgKey);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-line text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddDeliverable(pkgKey)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
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

          {/* TAB 4: PHOTOS */}
          {activeTab === "photos" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs">
                <b>📸 Showcase & Previous Work Photos:</b> Upload high-resolution photos of bridal mehndi, hand & feet designs, and live events.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload from PC */}
                <div className="p-4 rounded-xl border border-line bg-surface/40 space-y-2">
                  <label className="block text-xs font-bold text-ink">Upload from Device</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                    className="block w-full text-xs text-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                  {uploadingImage && (
                    <p className="text-xs text-emerald-600 font-medium animate-pulse">{uploadProgress}</p>
                  )}
                </div>

                {/* Paste direct URL */}
                <div className="p-4 rounded-xl border border-line bg-surface/40 space-y-2">
                  <label className="block text-xs font-bold text-ink">Add Image via Direct URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/mehndi-photo.jpg"
                      value={directPhotoUrl}
                      onChange={(e) => setDirectPhotoUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-line text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddDirectPhoto}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted">
                  Gallery Photos ({form.photos.length})
                </span>
                {form.photos.length === 0 ? (
                  <div className="py-8 text-center text-muted text-xs border border-dashed border-line rounded-xl">
                    No photos added yet. Upload or paste URLs above.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {form.photos.map((url, pIdx) => (
                      <div key={pIdx} className="relative group rounded-xl overflow-hidden border border-line aspect-square bg-gray-100">
                        <img src={url} alt={`Mehndi ${pIdx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(pIdx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ALBUMS */}
          {activeTab === "albums" && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                📖 <b>Previous Work Albums & Collections:</b> Add bridal mehndi sets, collections, cover photos, and customer gallery links.
              </div>

              {/* New Album Form */}
              <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-3.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center justify-between">
                  <span>+ Add New Mehndi Album</span>
                  {(uploadingAlbumCover || uploadingAlbumPhotos) && (
                    <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                      Uploading image(s)...
                    </span>
                  )}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Album Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Traditional Marwari Bridal Hands & Feet"
                      value={newAlbum.title}
                      onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-line text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Short Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Arabic floral pattern with dark stain"
                      value={newAlbum.description}
                      onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-line text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                {/* Album Cover Section */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200/70 space-y-2">
                  <label className="block text-xs font-bold text-ink">
                    1. Album Cover Image
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingAlbumCover}
                        onChange={handleAlbumCoverUpload}
                        className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        placeholder="Or paste direct cover image URL"
                        value={newAlbum.coverImage}
                        onChange={(e) => setNewAlbum({ ...newAlbum, coverImage: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-line text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>

                  {newAlbum.coverImage && (
                    <div className="flex items-center gap-2 pt-1">
                      <img
                        src={newAlbum.coverImage}
                        alt="Album Cover Preview"
                        className="w-14 h-14 object-cover rounded-lg border border-emerald-200"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-700 block">✓ Cover Selected</span>
                        <button
                          type="button"
                          onClick={() => setNewAlbum({ ...newAlbum, coverImage: "" })}
                          className="text-rose-600 hover:underline font-medium text-[11px]"
                        >
                          ✕ Remove Cover
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Album Photos Section */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-ink">
                      2. Album Photos ({albumPhotosList.length})
                    </label>
                    {albumPhotosList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAlbumPhotosList([])}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Clear Uploaded ({albumPhotosList.length})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Choose Files from Device</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={uploadingAlbumPhotos}
                        onChange={handleAlbumPhotosUpload}
                        className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Or Paste Direct URLs (comma separated)</label>
                      <input
                        type="text"
                        placeholder="https://.../img1.jpg, https://.../img2.jpg"
                        value={newAlbum.imagesText}
                        onChange={(e) => setNewAlbum({ ...newAlbum, imagesText: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-line text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>

                  {albumPhotosList.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 max-h-36 overflow-y-auto p-1 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      {albumPhotosList.map((photoUrl, pIdx) => (
                        <div key={pIdx} className="relative aspect-square rounded-md overflow-hidden border border-emerald-200 group">
                          <img src={photoUrl} alt={`Album photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveAlbumDraftPhoto(pIdx)}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">External Gallery Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. Instagram Post or Drive Link"
                      value={newAlbum.link}
                      onChange={(e) => setNewAlbum({ ...newAlbum, link: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-line text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddAlbum}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-xs"
                  >
                    + Add Album to Portfolio
                  </button>
                </div>
              </div>

              {/* Albums List */}
              {form.albums.length === 0 ? (
                <div className="py-8 border border-dashed border-line rounded-xl text-center text-muted text-xs">
                  No sample albums added yet. Use the form above to add an album.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.albums.map((alb, aIdx) => (
                    <div
                      key={aIdx}
                      className="p-3.5 rounded-xl border border-line bg-white shadow-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {alb.coverImage ? (
                          <img
                            src={alb.coverImage}
                            alt={alb.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-line"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0">
                            📖
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-ink truncate">{alb.title}</h4>
                          {alb.description && <p className="text-[11px] text-muted truncate">{alb.description}</p>}
                          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                            {alb.images?.length || 0} Photos Included
                          </span>
                          {Array.isArray(alb.images) && alb.images.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                              {alb.images.slice(0, 4).map((img, iIdx) => (
                                <img key={iIdx} src={img} alt="" className="w-6 h-6 rounded object-cover border border-emerald-100" />
                              ))}
                              {alb.images.length > 4 && (
                                <span className="text-[10px] text-muted px-1 font-medium">+{alb.images.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlbum(aIdx)}
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

          {/* TAB 6: ABOUT & BIO */}
          {activeTab === "about" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  About Artist & Bio *
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell couples about the artist's experience, signature styles, organic henna ingredients, awards, and celebrity weddings..."
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Booking & Cancellation Policy
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. 30% advance for booking confirmation. Free rescheduling up to 7 days before event. Travel expenses included within 25 km."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-line text-ink hover:bg-surface text-xs font-semibold transition text-center cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer text-center"
            >
              {submitting ? "Saving..." : initialData?._id ? "Update Mehandi Listing" : "Publish Mehandi Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

