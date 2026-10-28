"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "@/compat/navigation";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";
import CategoryFacilitiesManager from "@/components/vendor/CategoryFacilitiesManager";
import Image from "@/compat/Image";

export const POPULAR_ROOM_FACILITIES = [
  "Air Conditioning (AC)",
  "High-Speed Wi-Fi",
  "Attached Private Bathroom",
  "Geyser / 24x7 Hot Water",
  "Flat-screen / Smart TV",
  "Free Breakfast",
  "Room Service",
  "Electric Kettle / Tea Maker",
  "Balcony / City View",
  "Daily Housekeeping",
  "Mini Bar / Refrigerator",
  "Wardrobe / Closet",
];

export const ROOM_TYPES = [
  "Deluxe Room",
  "Deluxe AC Room",
  "Super Deluxe Room",
  "Standard Room",
  "Standard AC Room",
  "Standard Non-AC Room",
  "Executive Room",
  "Suite Room",
  "Executive Suite",
  "Family Suite",
  "Resort Cottage",
  "Villa",
  "Honeymoon Suite",
  "Presidential Suite",
  "Villa / Cottage",
  "Dormitory / Shared",
];

export const BED_TYPES = [
  "1 King Bed",
  "1 Queen Bed",
  "1 Double Bed",
  "2 Twin Beds",
  "2 Double Beds",
  "1 Single Bed",
  "1 King Bed + 1 Single Bed",
  "1 Double Bed or 2 Single Beds",
  "King Bed + Sofa Bed",
  "2 Queen Beds",
  "3 Single Beds",
  "Bunk Beds",
  "Custom / Extra Bed Available",
];

export default function VendorOnboardingPage() {
  const [sp] = useSearchParams();
  const router = useRouter();
  const initialTab = sp?.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeServiceCatId, setActiveServiceCatId] = useState("");

  useEffect(() => {
    const tabFromUrl = sp?.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [sp]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    router.push(`/vendor/onboarding?tab=${key}`);
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [user, setUser] = useState(null);

  // Form states for profile & service
  const [profileForm, setProfileForm] = useState({
    businessName: "",
    ownerName: "",
    vendorType: "Individual",
    address: "",
    city: "",
    state: "",
    pincode: "",
    about: "",
    profilePhoto: "",
    coverPhoto: "",
    phone: "",
    // Services
    serviceDescription: "",
    startingPrice: "",
    priceRange: "",
    serviceLocation: "",
    experience: "",
    additionalServicesStr: "",
    categories: [],
    facilities: [],
    servicesList: [],
  });

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    chequeUrl: "",
  });

  // Portfolio Form State
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    category: "Wedding",
    serviceCategory: "",
    description: "",
    images: [],
    videoUrl: "",
  });

  // Doc Upload states
  const [uploadingDoc, setUploadingDoc] = useState({});

  // Hotel Room states for Services & Amenities tab
  const [hotelRooms, setHotelRooms] = useState([]);
  const [uploadingRoomIdx, setUploadingRoomIdx] = useState(null);
  const [customRoomAmenityInputs, setCustomRoomAmenityInputs] = useState({});
  const [roomUrlInputs, setRoomUrlInputs] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Always load categories first so category selection is never blank
      try {
        const catRes = await api.get("/api/categories");
        if (catRes.data?.ok) {
          setCategories(catRes.data.data?.categories || []);
        }
      } catch (catErr) {
        console.warn("Failed to load categories:", catErr);
      }

      // 2. Load vendor profile
      try {
        const profRes = await api.get("/api/vendor/profile");
        if (profRes.data?.ok) {
          const p = profRes.data.data.profile;
          const comp = profRes.data.data.completion;
          const u = profRes.data.data.user;

          setProfile(p);
          setCompletion(comp);
          setUser(u);

          // Populate profile form
          setProfileForm({
            businessName: p.businessName || "",
            ownerName: p.ownerName || u.name || "",
            vendorType: p.vendorType || "Individual",
            address: p.address || "",
            city: p.city || "",
            state: p.state || "",
            pincode: p.pincode || "",
            about: p.about || "",
            profilePhoto: p.profilePhoto || "",
            coverPhoto: p.coverPhoto || "",
            phone: u.phone || "",
            serviceDescription: p.serviceDescription || "",
            startingPrice: p.startingPrice || "",
            priceRange: p.priceRange || "",
            serviceLocation: p.serviceLocation || p.city || "",
            experience: p.experience || "",
            additionalServicesStr: (p.additionalServices || []).join(", "),
            categories: (p.categories || []).map((c) => c._id || c),
            facilities: (p.facilities || []).map((f) => ({
              category: f.category?._id || f.category || "",
              categoryName: f.categoryName || f.category?.name || "",
              group: f.group || "Popular Amenities",
              name: f.name || "",
              icon: f.icon || "",
              highlight: Boolean(f.highlight),
            })),
            servicesList: (p.servicesList || []).map((s) => ({
              category: s.category?._id || s.category || "",
              categoryName: s.categoryName || s.category?.name || "",
              serviceName: s.serviceName || "",
              serviceDescription: s.description || s.serviceDescription || "",
              startingPrice: s.startingPrice !== undefined ? s.startingPrice : "",
              priceRange: s.priceRange || "",
              serviceLocation: s.serviceLocation || s.location || "",
              experience: s.experience || "",
              additionalServicesStr: Array.isArray(s.additionalServices)
                ? s.additionalServices.join(", ")
                : s.additionalServices || "",
            })),
          });

          // Populate bank form
          if (p.bankDetails) {
            setBankForm({
              accountHolderName: p.bankDetails.accountHolderName || "",
              bankName: p.bankDetails.bankName || "",
              accountNumber: p.bankDetails.accountNumber || "",
              ifscCode: p.bankDetails.ifscCode || "",
              chequeUrl: p.bankDetails.chequeUrl || "",
            });
          }
        }
      } catch (profErr) {
        console.warn("Vendor profile not loaded:", profErr);
      }

      // 3. Load vendor hotel rooms if any
      try {
        const roomsRes = await api.get("/api/rooms");
        if (roomsRes.data?.ok && Array.isArray(roomsRes.data.data?.rooms)) {
          setHotelRooms(roomsRes.data.data.rooms);
        }
      } catch (rErr) {
        console.warn("Rooms not loaded:", rErr);
      }
    } catch (err) {
      setError(err.message || "Failed to load vendor profile.");
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceCategories = useMemo(() => {
    return categories.filter((c) => (profileForm.categories || []).includes(c._id));
  }, [categories, profileForm.categories]);

  const isHotelSelected = useMemo(() => {
    return selectedServiceCategories.some(
      (c) => c?.slug === "hotels" || (c?.name || "").toLowerCase().includes("hotel")
    );
  }, [selectedServiceCategories]);

  useEffect(() => {
    if (
      (!activeServiceCatId || !selectedServiceCategories.some((c) => c._id === activeServiceCatId)) &&
      selectedServiceCategories.length > 0
    ) {
      setActiveServiceCatId(selectedServiceCategories[0]._id);
    }
  }, [selectedServiceCategories, activeServiceCatId]);

  const activeCategoryObject = useMemo(() => {
    return (
      selectedServiceCategories.find((c) => c._id === activeServiceCatId) ||
      selectedServiceCategories[0] ||
      null
    );
  }, [selectedServiceCategories, activeServiceCatId]);

  const isActiveCategoryHotel = Boolean(
    activeCategoryObject?.slug === "hotels" ||
    (activeCategoryObject?.name || "").toLowerCase().includes("hotel")
  );

  // Sync localStorage flipsaura_has_hotel for instant sidebar update
  useEffect(() => {
    try {
      if (isHotelSelected) {
        localStorage.setItem("flipsaura_has_hotel", "true");
      } else {
        localStorage.removeItem("flipsaura_has_hotel");
      }
      window.dispatchEvent(new Event("vendor_profile_updated"));
    } catch {}
  }, [isHotelSelected]);

  // Auto-initialize 1 room when hotel is selected and hotelRooms is empty
  useEffect(() => {
    if (isHotelSelected && hotelRooms.length === 0) {
      setHotelRooms([
        {
          name: "Deluxe AC Room",
          roomType: "Deluxe Room",
          pricePerNight: 2500,
          availableRooms: 5,
          maxGuests: 2,
          bedType: "1 King Bed",
          numberOfBeds: 1,
          facilities: [
            "Air Conditioning (AC)",
            "High-Speed Wi-Fi",
            "Attached Private Bathroom",
            "Geyser / 24x7 Hot Water",
            "Flat-screen / Smart TV",
          ],
          description: "",
          images: [],
          active: true,
        },
      ]);
    }
  }, [isHotelSelected, hotelRooms.length]);

  const addHotelRoom = () => {
    setHotelRooms((prev) => [
      ...prev,
      {
        name: `Room Type ${prev.length + 1}`,
        roomType: "Deluxe Room",
        pricePerNight: 2500,
        availableRooms: 5,
        maxGuests: 2,
        bedType: "1 King Bed",
        numberOfBeds: 1,
        facilities: [
          "Air Conditioning (AC)",
          "High-Speed Wi-Fi",
          "Attached Private Bathroom",
          "Geyser / 24x7 Hot Water",
        ],
        description: "",
        images: [],
        active: true,
      },
    ]);
  };

  const removeHotelRoom = (idx) => {
    setHotelRooms((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateHotelRoom = (idx, field, value) => {
    setHotelRooms((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const toggleHotelRoomFacility = (idx, facName) => {
    setHotelRooms((prev) => {
      const copy = [...prev];
      const curFacilities = copy[idx]?.facilities || [];
      const exists = curFacilities.includes(facName);
      copy[idx] = {
        ...copy[idx],
        facilities: exists
          ? curFacilities.filter((f) => f !== facName)
          : [...curFacilities, facName],
      };
      return copy;
    });
  };

  const addCustomHotelRoomAmenity = (idx) => {
    const text = (customRoomAmenityInputs[idx] || "").trim();
    if (!text) return;
    setHotelRooms((prev) => {
      const copy = [...prev];
      const curFacilities = copy[idx]?.facilities || [];
      if (!curFacilities.includes(text)) {
        copy[idx] = {
          ...copy[idx],
          facilities: [...curFacilities, text],
        };
      }
      return copy;
    });
    setCustomRoomAmenityInputs((prev) => ({ ...prev, [idx]: "" }));
  };

  const handleHotelRoomPhotoUpload = async (idx, file) => {
    if (!file) return;
    setUploadingRoomIdx(idx);
    try {
      const url = await uploadFile(file, "flipsaura/rooms");
      if (url) {
        setHotelRooms((prev) => {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            images: [...(copy[idx]?.images || []), url],
          };
          return copy;
        });
      }
    } catch (err) {
      console.error("Room photo upload failed:", err);
      setError(err.message || "Failed to upload room photo");
    } finally {
      setUploadingRoomIdx(null);
    }
  };

  const addHotelRoomPhotoUrl = (idx) => {
    const url = (roomUrlInputs[idx] || "").trim();
    if (!url) return;
    setHotelRooms((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        images: [...(copy[idx]?.images || []), url],
      };
      return copy;
    });
    setRoomUrlInputs((prev) => ({ ...prev, [idx]: "" }));
  };

  const removeHotelRoomPhoto = (rIdx, pIdx) => {
    setHotelRooms((prev) => {
      const copy = [...prev];
      copy[rIdx] = {
        ...copy[rIdx],
        images: (copy[rIdx]?.images || []).filter((_, i) => i !== pIdx),
      };
      return copy;
    });
  };

  const getCategoryService = (catId) => {
    const list = profileForm.servicesList || [];
    const found = list.find((s) => String(s.category) === String(catId));
    if (found) return found;
    const catObj = categories.find((c) => String(c._id) === String(catId));
    return {
      category: catId,
      categoryName: catObj?.name || "",
      serviceName: catObj?.name || "",
      serviceDescription: profileForm.serviceDescription || "",
      startingPrice: profileForm.startingPrice || "",
      priceRange: profileForm.priceRange || "",
      serviceLocation: profileForm.serviceLocation || profileForm.city || "",
      experience: profileForm.experience || "",
      additionalServicesStr: profileForm.additionalServicesStr || "",
    };
  };

  const updateCategoryService = (catId, field, value) => {
    setProfileForm((prev) => {
      const list = [...(prev.servicesList || [])];
      const idx = list.findIndex((s) => String(s.category) === String(catId));
      const catObj = categories.find((c) => String(c._id) === String(catId));

      const existing = idx >= 0 ? list[idx] : {
        category: catId,
        categoryName: catObj?.name || "",
        serviceName: catObj?.name || "",
        serviceDescription: prev.serviceDescription || "",
        startingPrice: prev.startingPrice || "",
        priceRange: prev.priceRange || "",
        serviceLocation: prev.serviceLocation || prev.city || "",
        experience: prev.experience || "",
        additionalServicesStr: prev.additionalServicesStr || "",
      };

      const updated = {
        ...existing,
        category: catId,
        categoryName: catObj?.name || existing.categoryName,
        [field]: value,
      };

      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }

      // If updating the primary/first category, mirror to root fields as well
      const isPrimary = (prev.categories || [])[0] === catId;
      return {
        ...prev,
        servicesList: list,
        ...(isPrimary && {
          ...(field === "startingPrice" && { startingPrice: value }),
          ...(field === "priceRange" && { priceRange: value }),
          ...(field === "serviceLocation" && { serviceLocation: value }),
          ...(field === "experience" && { experience: value }),
          ...(field === "serviceDescription" && { serviceDescription: value }),
          ...(field === "additionalServicesStr" && { additionalServicesStr: value }),
        }),
      };
    });
  };

  const saveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const cleanServicesList = (profileForm.categories || []).map((catId) => {
        const item = getCategoryService(catId);
        const catObj = categories.find((c) => String(c._id) === String(catId));
        return {
          category: catId,
          categoryName: catObj?.name || item.categoryName || "",
          serviceName: item.serviceName || catObj?.name || "",
          serviceDescription: (item.serviceDescription || "").trim(),
          startingPrice: Number(item.startingPrice) || 0,
          priceRange: (item.priceRange || "").trim(),
          serviceLocation: (item.serviceLocation || "").trim(),
          experience: String(item.experience || "").trim(),
          additionalServices: (item.additionalServicesStr || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };
      });

      const primary = cleanServicesList[0] || {};

      const payload = {
        ...profileForm,
        startingPrice: Number(primary.startingPrice) || Number(profileForm.startingPrice) || 0,
        priceRange: primary.priceRange || profileForm.priceRange || "",
        serviceLocation: primary.serviceLocation || profileForm.serviceLocation || "",
        serviceDescription: primary.serviceDescription || profileForm.serviceDescription || "",
        experience: primary.experience || profileForm.experience || "",
        additionalServices: primary.additionalServices || profileForm.additionalServicesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        servicesList: cleanServicesList,
        facilities: profileForm.facilities || [],
        rooms: isHotelSelected
          ? hotelRooms.filter((r) => r && r.name && r.name.trim())
          : undefined,
      };

      const { data } = await api.put("/api/vendor/profile", payload);
      if (!data.ok) throw new Error(data.error);

      setProfile(data.data.profile);
      setCompletion(data.data.completion);
      setSuccess("Category services, pricing models, facilities & hotel rooms saved successfully!");
      window.dispatchEvent(new Event("vendor_profile_updated"));
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const saveBankDetails = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.put("/api/vendor/bank-details", bankForm);
      if (!data.ok) throw new Error(data.error);

      setProfile((prev) => ({ ...prev, bankDetails: data.data.bankDetails }));
      setCompletion(data.data.completion);
      setSuccess("Bank details saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save bank details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (docType, file, side = "front") => {
    setUploadingDoc((prev) => ({ ...prev, [docType]: true }));
    setError("");
    setSuccess("");

    try {
      const url = await uploadFile(file, "flipsaura/documents");
      const currentDoc = (profile?.documents || []).find((d) => d.docType === docType) || {};

      const payload = {
        docType,
        frontUrl: side === "front" ? url : currentDoc.frontUrl || url,
        backUrl: side === "back" ? url : currentDoc.backUrl || "",
        fileUrl: url,
        fileType: file.type === "application/pdf" ? "pdf" : "image",
      };

      const { data } = await api.post("/api/vendor/document", payload);
      if (!data.ok) throw new Error(data.error);

      setProfile((prev) => ({ ...prev, documents: data.data.documents }));
      setCompletion(data.data.completion);
      setSuccess(`${docType.toUpperCase()} uploaded successfully!`);
    } catch (err) {
      setError(`Failed to upload document: ${err.message}`);
    } finally {
      setUploadingDoc((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const savePortfolioItem = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...portfolioForm,
        videos: portfolioForm.videoUrl ? [portfolioForm.videoUrl] : [],
      };

      let res;
      if (editingPortfolioId) {
        res = await api.put(`/api/vendor/portfolio/${editingPortfolioId}`, payload);
      } else {
        res = await api.post("/api/vendor/portfolio", payload);
      }

      if (!res.data.ok) throw new Error(res.data.error);

      setProfile((prev) => ({ ...prev, portfolio: res.data.data.portfolio }));
      if (res.data.data.completion) setCompletion(res.data.data.completion);

      setPortfolioModalOpen(false);
      setEditingPortfolioId(null);
      setPortfolioForm({ title: "", category: "Wedding", serviceCategory: "", description: "", images: [], videoUrl: "" });
      setSuccess("Portfolio item saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save portfolio item.");
    } finally {
      setSaving(false);
    }
  };

  const deletePortfolioItem = async (id) => {
    if (!confirm("Are you sure you want to delete this portfolio item?")) return;
    try {
      const { data } = await api.delete(`/api/vendor/portfolio/${id}`);
      if (!data.ok) throw new Error(data.error);
      setProfile((prev) => ({ ...prev, portfolio: data.data.portfolio }));
      if (data.data.completion) setCompletion(data.data.completion);
      setSuccess("Portfolio item deleted.");
    } catch (err) {
      setError(err.message || "Failed to delete item.");
    }
  };

  const submitForVerification = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/api/vendor/submit-verification");
      if (!data.ok) throw new Error(data.error);

      setCompletion(data.data.completion);
      setProfile((prev) => ({
        ...prev,
        verificationStatus: "under_review",
      }));
      setSuccess("🎉 Profile submitted for admin verification! Your status is now Under Review.");
      router.push("/vendor/dashboard");
    } catch (err) {
      setError(err.message || "Submission failed. Please complete all missing fields.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-base font-medium">Loading vendor onboarding profile...</p>
      </div>
    );
  }

  const isBusiness = String(profileForm.vendorType).toLowerCase() === "business";

  // Document status lookup helper
  const getDoc = (type) => (profile?.documents || []).find((d) => d.docType === type);

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine tracking-tight">
            Vendor Profile & Verification
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted">
            Complete all profile sections and submit required KYC documents to unlock your vendor account.
          </p>
        </div>

        <button
          onClick={submitForVerification}
          disabled={!completion?.canSubmitForVerification || saving || profile?.verificationStatus === "approved"}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {profile?.verificationStatus === "approved"
            ? "✓ Account Approved"
            : profile?.verificationStatus === "under_review"
            ? "⏳ Under Review"
            : "Submit for Verification →"}
        </button>
      </div>

      {/* Profile Completion Bar Banner */}
      <div className="p-5 md:p-6 rounded-2xl bg-white border border-line shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-serif text-base font-bold text-brand-700">
            Profile Completion: {completion?.percentage || 0}%
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
              profile?.verificationStatus === "approved"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : profile?.verificationStatus === "under_review"
                ? "bg-sky-50 text-sky-700 border border-sky-200"
                : profile?.verificationStatus === "rejected"
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            Status: {completion?.verificationStatus?.replace("_", " ") || "Incomplete"}
          </span>
        </div>

        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${completion?.percentage || 0}%` }}
          />
        </div>

        {completion?.missingFields?.length > 0 && (
          <div className="pt-1 text-xs text-amber-800">
            <b className="font-semibold">Pending requirements to unlock: </b>
            {completion.missingFields.slice(0, 5).join(" • ")}
            {completion.missingFields.length > 5 ? ` and ${completion.missingFields.length - 5} more` : ""}
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">⚠️</span>
          <div>
            <b>Notice: </b>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">✅</span>
          <div>{success}</div>
        </div>
      )}

      {/* Onboarding Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-line">
        {[
          { key: "profile", label: "Basic Profile", icon: "👤" },
          { key: "services", label: "Services & Categories", icon: "✨" },
          { key: "documents", label: "KYC Documents", icon: "📄" },
          { key: "bank", label: "Bank Details", icon: "🏦" },
          { key: "portfolio", label: `Portfolio (${profile?.portfolio?.length || 0})`, icon: "🎨" },
          { key: "verification", label: "Verification Checklist", icon: "📋" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-brand-50 text-brand-600 border border-brand-200 shadow-2xs"
                  : "text-muted hover:text-ink hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BASIC PROFILE */}
      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="bg-white p-6 md:p-8 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="border-b border-line pb-4">
            <h3 className="font-serif text-lg md:text-xl font-bold text-wine">
              Business & Contact Information
            </h3>
            <p className="text-xs text-muted mt-0.5">Primary information displayed on your FlipsAura profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Business / Vendor Name *
              </label>
              <input
                required
                value={profileForm.businessName}
                onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Owner / Contact Person Name *
              </label>
              <input
                required
                value={profileForm.ownerName}
                onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Mobile Number *
              </label>
              <input
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Vendor Type *
              </label>
              <select
                value={profileForm.vendorType}
                onChange={(e) => setProfileForm({ ...profileForm, vendorType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white cursor-pointer"
              >
                <option value="Individual">Individual (Freelancer / Sole Proprietor)</option>
                <option value="Business">Business (Registered Company / Agency)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Business Address *
            </label>
            <input
              required
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                City *
              </label>
              <input
                required
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                State *
              </label>
              <input
                required
                value={profileForm.state}
                onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                PIN Code *
              </label>
              <input
                required
                value={profileForm.pincode}
                onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              About Business / Bio
            </label>
            <textarea
              rows={3}
              placeholder="Tell couples about your wedding services, experience, and achievements..."
              value={profileForm.about}
              onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl border border-line bg-surface/50">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Profile Photo / Business Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadFile(e.target.files[0], "flipsaura/profiles");
                    setProfileForm((prev) => ({ ...prev, profilePhoto: url }));
                  }
                }}
                className="text-xs file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
              {profileForm.profilePhoto && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={profileForm.profilePhoto}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border-2 border-brand-200"
                  />
                  <span className="text-xs text-emerald-700 font-medium">✓ Logo attached</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-line bg-surface/50">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Cover Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadFile(e.target.files[0], "flipsaura/covers");
                    setProfileForm((prev) => ({ ...prev, coverPhoto: url }));
                  }
                }}
                className="text-xs file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
              {profileForm.coverPhoto && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={profileForm.coverPhoto}
                    alt="Cover"
                    className="w-20 h-10 rounded-lg object-cover border border-line"
                  />
                  <span className="text-xs text-emerald-700 font-medium">✓ Cover attached</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-2xs disabled:opacity-50"
            >
              {saving ? "Saving Profile..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SERVICES & CATEGORIES */}
      {activeTab === "services" && (
        <form onSubmit={saveProfile} className="bg-white p-6 md:p-8 rounded-2xl border border-line shadow-2xs space-y-7">
          <div className="border-b border-line pb-4">
            <h3 className="font-serif text-lg md:text-xl font-bold text-wine">
              Service Information & Category-Specific Offerings
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Select all wedding categories your business offers. For each selected category, customize its individual starting price, price range model, service location, and facilities.
            </p>
          </div>

          {/* 1. Category Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2.5">
              Select Wedding Categories Offered *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {categories.map((cat) => {
                const checked = profileForm.categories.includes(cat._id);
                const isHotelCat = cat.slug === "hotels" || (cat.name || "").toLowerCase().includes("hotel");
                return (
                  <label
                    key={cat._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                      checked
                        ? "border-brand-600 bg-brand-50/70 text-brand-700 font-semibold shadow-2xs"
                        : "border-line bg-surface/50 text-ink/80 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const updated = [...profileForm.categories, cat._id];
                          setProfileForm({ ...profileForm, categories: updated });
                          setActiveServiceCatId(cat._id);
                        } else {
                          const updated = profileForm.categories.filter((id) => id !== cat._id);
                          setProfileForm({ ...profileForm, categories: updated });
                          if (activeServiceCatId === cat._id) {
                            setActiveServiceCatId(updated[0] || "");
                          }
                        }
                      }}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="truncate">{cat.name}</span>
                    {isHotelCat && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                        🛏️ Rooms
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Quick banner if Hotels is selected */}
            {isHotelSelected && (
              <div className="mt-3 p-3.5 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🏨</span>
                  <div>
                    <span className="font-bold text-wine">Hotels Category Selected:</span>
                    <span className="text-muted ml-1">
                      Configure your hotel room types (Deluxe, Suite, AC), nightly tariffs (₹), amenities, and photos below.
                    </span>
                  </div>
                </div>
                {!isActiveCategoryHotel ? (
                  <button
                    type="button"
                    onClick={() => {
                      const hotelCat = selectedServiceCategories.find(
                        (c) => c?.slug === "hotels" || (c?.name || "").toLowerCase().includes("hotel")
                      );
                      if (hotelCat) setActiveServiceCatId(hotelCat._id);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition"
                  >
                    Switch to Hotels & Rooms Form ↓
                  </button>
                ) : (
                  <span className="text-purple-700 font-semibold px-2.5 py-1 rounded-md bg-purple-100 border border-purple-200 shrink-0">
                    Active Below ↓
                  </span>
                )}
              </div>
            )}
          </div>

          {/* If no category is selected */}
          {selectedServiceCategories.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-900">
              <span className="text-3xl block mb-2">💡</span>
              <h4 className="font-semibold text-base">Select at least one wedding category</h4>
              <p className="text-xs text-amber-800/80 mt-1 max-w-md mx-auto">
                Check one or more categories above (e.g. Hotels, Transport / Cars, Venues, Mehndi) to configure distinct pricing, locations, and facilities for each category.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category Tab Selector Strip */}
              <div className="p-4 md:p-5 rounded-2xl bg-brand-50/50 border border-brand-200/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-xs font-bold text-wine uppercase tracking-wider flex items-center gap-1.5">
                      <span>🏷️</span> Active Category Configuration ({selectedServiceCategories.length} Categories Selected)
                    </h4>
                    <p className="text-[11px] text-muted">
                      Click a category tab below to customize its specific price range, locations, and amenities:
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedServiceCategories.map((cat) => {
                    const isSelected = activeCategoryObject?._id === cat._id;
                    const catData = getCategoryService(cat._id);
                    const catFacCount = (profileForm.facilities || []).filter((f) => {
                      const fCatId = String(f.category?._id || f.category || "");
                      const fCatName = (f.categoryName || f.category?.name || "").toLowerCase().trim();
                      return fCatId === String(cat._id) || (cat.name && fCatName === cat.name.toLowerCase().trim());
                    }).length;

                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => setActiveServiceCatId(cat._id)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-brand-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]"
                            : "bg-white text-ink/80 border border-line hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {catData.startingPrice ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            ₹{Number(catData.startingPrice).toLocaleString("en-IN")}
                          </span>
                        ) : null}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected ? "bg-white/20 text-white" : "bg-surface text-ink/70"
                        }`}>
                          {catFacCount} amenities
                        </span>
                        {Boolean(cat.slug === "hotels" || (cat.name || "").toLowerCase().includes("hotel")) && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isSelected ? "bg-purple-900/40 text-purple-100 border border-purple-300/30" : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}>
                            🛏️ {hotelRooms.length} Rooms
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Category Workspace */}
              {activeCategoryObject && (
                (() => {
                  const catServiceData = getCategoryService(activeCategoryObject._id);
                  return (
                    <div className="space-y-6">
                      {/* Sub-Card 1: Specific Pricing & Service Details */}
                      <div className="p-5 md:p-7 rounded-2xl border border-line bg-surface/30 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                          <div>
                            <h4 className="font-serif text-base md:text-lg font-bold text-wine flex items-center gap-2">
                              <span>🏷️</span>
                              <span>{activeCategoryObject.name} — Pricing & Service Parameters</span>
                            </h4>
                            <p className="text-xs text-muted mt-0.5">
                              Pricing model and service details specifically for <b>{activeCategoryObject.name}</b>.
                            </p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 self-start sm:self-auto">
                            Category: {activeCategoryObject.name}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                              Starting Price for {activeCategoryObject.name} (₹) *
                            </label>
                            <input
                              required
                              type="number"
                              placeholder={`e.g. 25000 for ${activeCategoryObject.name}`}
                              value={catServiceData.startingPrice}
                              onChange={(e) => updateCategoryService(activeCategoryObject._id, "startingPrice", e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                            />
                            <p className="text-[11px] text-muted mt-1">
                              Minimum base price for {activeCategoryObject.name} bookings.
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                              Price Range / Model for {activeCategoryObject.name}
                            </label>
                            <input
                              placeholder={`e.g. ₹25,000 - ₹80,000 per event / per day`}
                              value={catServiceData.priceRange}
                              onChange={(e) => updateCategoryService(activeCategoryObject._id, "priceRange", e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                            />
                            <p className="text-[11px] text-muted mt-1">
                              Typical rate or package range for {activeCategoryObject.name}.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                              Service Location / Cities Covered for {activeCategoryObject.name} *
                            </label>
                            <input
                              required
                              placeholder="e.g. Jamshedpur, Ranchi, Jharkhand, Pan-India"
                              value={catServiceData.serviceLocation}
                              onChange={(e) => updateCategoryService(activeCategoryObject._id, "serviceLocation", e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                              Experience in {activeCategoryObject.name} *
                            </label>
                            <input
                              required
                              placeholder="e.g. 5+ Years, 100+ events handled"
                              value={catServiceData.experience}
                              onChange={(e) => updateCategoryService(activeCategoryObject._id, "experience", e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                            {activeCategoryObject.name} Service Description <span className="text-muted font-normal lowercase">(optional)</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder={`Description of your ${activeCategoryObject.name} services, offerings, packages, or equipment (optional)...`}
                            value={catServiceData.serviceDescription}
                            onChange={(e) => updateCategoryService(activeCategoryObject._id, "serviceDescription", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white resize-y"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                            Additional Inclusions / Add-ons for {activeCategoryObject.name} (Comma separated)
                          </label>
                          <input
                            placeholder="e.g. Dedicated manager, fuel included, free tasting, cleanup included"
                            value={catServiceData.additionalServicesStr}
                            onChange={(e) => updateCategoryService(activeCategoryObject._id, "additionalServicesStr", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                          />
                        </div>
                      </div>

                      {/* Sub-Card 2: Facilities & Amenities for Active Category */}
                      <CategoryFacilitiesManager
                        selectedCategoryIds={profileForm.categories}
                        categories={categories}
                        facilities={profileForm.facilities || []}
                        activeCategoryId={activeCategoryObject._id}
                        onCategoryChange={setActiveServiceCatId}
                        hideCategoryTabs={true}
                        onChange={(updatedFacilities) =>
                          setProfileForm((prev) => ({ ...prev, facilities: updatedFacilities }))
                        }
                      />

                      {/* Sub-Card 3: Hotel Rooms & Tariffs (When Active Category is Hotels) */}
                      {isActiveCategoryHotel && (
                        <div className="p-5 md:p-7 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/40 via-white to-brand-50/30 space-y-5 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                            <div>
                              <h4 className="font-serif text-base md:text-lg font-bold text-wine flex items-center gap-2">
                                <span>🛏️</span>
                                <span>Hotel Room Types & Nightly Tariffs</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                                  {hotelRooms.length} {hotelRooms.length === 1 ? "Room Type" : "Room Types"}
                                </span>
                              </h4>
                              <p className="text-xs text-muted mt-0.5">
                                Add all room types available at your property (e.g. Deluxe AC, Standard, Executive Suite) with night tariffs, guest capacity, and amenities.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={addHotelRoom}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
                            >
                              <span>+</span>
                              <span>Add Another Room</span>
                            </button>
                          </div>

                          {hotelRooms.length === 0 ? (
                            <div className="p-6 text-center border-2 border-dashed border-purple-200 rounded-xl bg-white/70">
                              <p className="text-sm text-muted mb-3">No room types added yet for this hotel.</p>
                              <button
                                type="button"
                                onClick={addHotelRoom}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
                              >
                                + Add First Room Type
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {hotelRooms.map((room, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="p-4 sm:p-5 rounded-xl bg-white border border-purple-100 shadow-xs space-y-4"
                                >
                                  {/* Room Card Header */}
                                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                                        {rIdx + 1}
                                      </span>
                                      <h5 className="text-sm font-bold text-ink">
                                        {room.name || `Room Type ${rIdx + 1}`}
                                      </h5>
                                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                                        {room.roomType || "Deluxe Room"}
                                      </span>
                                      <span className="text-xs font-bold text-wine">
                                        ₹{room.pricePerNight ? Number(room.pricePerNight).toLocaleString("en-IN") : 0} / night
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <label className="flex items-center gap-1.5 text-xs font-medium text-ink cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={room.active !== false}
                                          onChange={(e) => updateHotelRoom(rIdx, "active", e.target.checked)}
                                          className="w-3.5 h-3.5 accent-brand-600 rounded cursor-pointer"
                                        />
                                        Active
                                      </label>
                                      {hotelRooms.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeHotelRoom(rIdx)}
                                          className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                                        >
                                          ✕ Remove
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Room Fields Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                    <div>
                                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                                        Room Name / Title *
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Deluxe AC Room, Presidential Suite"
                                        value={room.name || ""}
                                        onChange={(e) => updateHotelRoom(rIdx, "name", e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-line text-xs md:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                                        required
                                      />
                                    </div>

                                    {/* Room Type */}
                                    <div>
                                      {(() => {
                                        const isCustomRt = Boolean(room.isCustomRoomType || (room.roomType && !ROOM_TYPES.includes(room.roomType)));
                                        return (
                                          <>
                                            <div className="flex items-center justify-between mb-1.5">
                                              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                                                Room Type
                                              </label>
                                              {!isCustomRt ? (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    updateHotelRoom(rIdx, "isCustomRoomType", true);
                                                    if (!room.roomType || ROOM_TYPES.includes(room.roomType)) {
                                                      updateHotelRoom(rIdx, "roomType", "");
                                                    }
                                                  }}
                                                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                                                >
                                                  + Custom
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    updateHotelRoom(rIdx, "isCustomRoomType", false);
                                                    const fallback = ROOM_TYPES.includes(room.roomType) ? room.roomType : ROOM_TYPES[0];
                                                    updateHotelRoom(rIdx, "roomType", fallback);
                                                  }}
                                                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                                                >
                                                  ← Presets
                                                </button>
                                              )}
                                            </div>

                                            {!isCustomRt ? (
                                              <select
                                                value={room.roomType || "Deluxe Room"}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === "__custom__") {
                                                    updateHotelRoom(rIdx, "isCustomRoomType", true);
                                                    updateHotelRoom(rIdx, "roomType", "");
                                                  } else {
                                                    updateHotelRoom(rIdx, "roomType", val);
                                                  }
                                                }}
                                                className="w-full px-3.5 py-2 rounded-xl border border-line text-xs md:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                                              >
                                                <optgroup label="Popular Categories">
                                                  {ROOM_TYPES.map((t) => (
                                                    <option key={t} value={t}>
                                                      {t}
                                                    </option>
                                                  ))}
                                                </optgroup>
                                                <optgroup label="Personalized / Custom">
                                                  <option value="__custom__">✨ + Add Custom Room Type...</option>
                                                </optgroup>
                                              </select>
                                            ) : (
                                              <div className="space-y-1.5">
                                                <div className="flex gap-1.5">
                                                  <input
                                                    type="text"
                                                    placeholder="Write your custom room category..."
                                                    value={room.roomType || ""}
                                                    onChange={(e) => updateHotelRoom(rIdx, "roomType", e.target.value)}
                                                    className="w-full px-3.5 py-2 rounded-xl border-2 border-brand-500 bg-white text-xs md:text-sm text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1"
                                                    autoFocus
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (room.roomType?.trim()) {
                                                        updateHotelRoom(rIdx, "roomType", room.roomType.trim());
                                                      }
                                                    }}
                                                    className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                                                  >
                                                    + Add
                                                  </button>
                                                </div>
                                                {room.roomType?.trim() && (
                                                  <div className="flex items-center gap-2 mt-1">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 border border-brand-300 text-brand-900 font-bold text-xs shadow-xs">
                                                      <span>👑 {room.roomType.trim()}</span>
                                                      <button
                                                        type="button"
                                                        onClick={() => updateHotelRoom(rIdx, "roomType", "")}
                                                        className="w-4 h-4 rounded-full bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 flex items-center justify-center font-black text-xs cursor-pointer transition ml-1"
                                                        title="Remove category"
                                                      >
                                                        ✕
                                                      </button>
                                                    </span>
                                                    <span className="text-[11px] text-emerald-700 font-medium">✓ Added</span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                                        Price Per Night (₹) *
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 2500"
                                        value={room.pricePerNight || ""}
                                        onChange={(e) => updateHotelRoom(rIdx, "pricePerNight", e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-line text-xs md:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                                        Available Rooms Count
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 5"
                                        value={room.availableRooms || 1}
                                        onChange={(e) => updateHotelRoom(rIdx, "availableRooms", e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-line text-xs md:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                                        Max Guests (Capacity)
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 2"
                                        value={room.maxGuests || 2}
                                        onChange={(e) => updateHotelRoom(rIdx, "maxGuests", e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-line text-xs md:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                                      />
                                    </div>

                                    {/* Bed Configuration */}
                                    <div>
                                      {(() => {
                                        const isCustomBt = Boolean(room.isCustomBedType || (room.bedType && !BED_TYPES.includes(room.bedType)));
                                        return (
                                          <>
                                            <div className="flex items-center justify-between mb-1.5">
                                              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                                                Bed Configuration
                                              </label>
                                              {!isCustomBt ? (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    updateHotelRoom(rIdx, "isCustomBedType", true);
                                                    if (!room.bedType || BED_TYPES.includes(room.bedType)) {
                                                      updateHotelRoom(rIdx, "bedType", "");
                                                    }
                                                  }}
                                                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                                                >
                                                  + Custom
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    updateHotelRoom(rIdx, "isCustomBedType", false);
                                                    const fallback = BED_TYPES.includes(room.bedType) ? room.bedType : BED_TYPES[0];
                                                    updateHotelRoom(rIdx, "bedType", fallback);
                                                  }}
                                                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                                                >
                                                  ← Presets
                                                </button>
                                              )}
                                            </div>

                                            {!isCustomBt ? (
                                              <select
                                                value={room.bedType || "1 King Bed"}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === "__custom__") {
                                                    updateHotelRoom(rIdx, "isCustomBedType", true);
                                                    updateHotelRoom(rIdx, "bedType", "");
                                                  } else {
                                                    updateHotelRoom(rIdx, "bedType", val);
                                                  }
                                                }}
                                                className="w-full px-3.5 py-2 rounded-xl border border-line text-xs md:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                                              >
                                                <optgroup label="Standard Bed Types">
                                                  {BED_TYPES.map((b) => (
                                                    <option key={b} value={b}>
                                                      {b}
                                                    </option>
                                                  ))}
                                                </optgroup>
                                                <optgroup label="Personalized / Custom">
                                                  <option value="__custom__">✨ + Add Custom Bed Config...</option>
                                                </optgroup>
                                              </select>
                                            ) : (
                                              <div className="space-y-1.5">
                                                <div className="flex gap-1.5">
                                                  <input
                                                    type="text"
                                                    placeholder="Write your custom bed config (e.g. Double Bed)..."
                                                    value={room.bedType || ""}
                                                    onChange={(e) => updateHotelRoom(rIdx, "bedType", e.target.value)}
                                                    className="w-full px-3.5 py-2 rounded-xl border-2 border-brand-500 bg-white text-xs md:text-sm text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1"
                                                    autoFocus
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (room.bedType?.trim()) {
                                                        updateHotelRoom(rIdx, "bedType", room.bedType.trim());
                                                      }
                                                    }}
                                                    className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                                                  >
                                                    + Add
                                                  </button>
                                                </div>
                                                {room.bedType?.trim() && (
                                                  <div className="flex items-center gap-2 mt-1">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 border border-brand-300 text-brand-900 font-bold text-xs shadow-xs">
                                                      <span>🛏️ {room.bedType.trim()}</span>
                                                      <button
                                                        type="button"
                                                        onClick={() => updateHotelRoom(rIdx, "bedType", "")}
                                                        className="w-4 h-4 rounded-full bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 flex items-center justify-center font-black text-xs cursor-pointer transition ml-1"
                                                        title="Remove bed"
                                                      >
                                                        ✕
                                                      </button>
                                                    </span>
                                                    <span className="text-[11px] text-emerald-700 font-medium">✓ Added</span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Room Description */}
                                  <div>
                                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                                      Room Description (Optional)
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="e.g. Premium room with city view, king size bed, attached bathroom, and 24x7 room service."
                                      value={room.description || ""}
                                      onChange={(e) => updateHotelRoom(rIdx, "description", e.target.value)}
                                      className="w-full px-3.5 py-2 rounded-xl border border-line text-xs md:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white resize-y"
                                    />
                                  </div>

                                  {/* Room Amenities */}
                                  <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                                      Room Facilities & Amenities
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {POPULAR_ROOM_FACILITIES.map((fac) => {
                                        const isChecked = (room.facilities || []).includes(fac);
                                        return (
                                          <button
                                            key={fac}
                                            type="button"
                                            onClick={() => toggleHotelRoomFacility(rIdx, fac)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                                              isChecked
                                                ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                                            }`}
                                          >
                                            {isChecked ? "✓ " : "+ "}
                                            {fac}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Custom Amenities */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {(room.facilities || [])
                                        .filter((f) => !POPULAR_ROOM_FACILITIES.includes(f))
                                        .map((customFac, cIdx) => (
                                          <span
                                            key={cIdx}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200"
                                          >
                                            <span>✓ {customFac}</span>
                                            <button
                                              type="button"
                                              onClick={() => toggleHotelRoomFacility(rIdx, customFac)}
                                              className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer font-bold"
                                            >
                                              ✕
                                            </button>
                                          </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 max-w-md pt-1">
                                      <input
                                        placeholder="Add other amenity (e.g. Jacuzzi, Soundproofing)"
                                        value={customRoomAmenityInputs[rIdx] || ""}
                                        onChange={(e) =>
                                          setCustomRoomAmenityInputs((prev) => ({
                                            ...prev,
                                            [rIdx]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            addCustomHotelRoomAmenity(rIdx);
                                          }
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-ink focus:outline-none focus:border-purple-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => addCustomHotelRoomAmenity(rIdx)}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold shrink-0 hover:bg-slate-900 transition cursor-pointer"
                                      >
                                        + Add
                                      </button>
                                    </div>
                                  </div>

                                  {/* Room Photos */}
                                  <div className="space-y-2 pt-1 border-t border-slate-100">
                                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                                      Room Photos
                                    </label>
                                    <div className="flex flex-wrap items-center gap-3">
                                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-100 cursor-pointer transition">
                                        <span>📷</span>
                                        <span>{uploadingRoomIdx === rIdx ? "Uploading..." : "Upload Room Photo"}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          disabled={uploadingRoomIdx === rIdx}
                                          onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) handleHotelRoomPhotoUpload(rIdx, file);
                                            e.target.value = "";
                                          }}
                                          className="hidden"
                                        />
                                      </label>

                                      <div className="flex gap-2 flex-1 max-w-sm">
                                        <input
                                          placeholder="Or paste direct Image URL"
                                          value={roomUrlInputs[rIdx] || ""}
                                          onChange={(e) =>
                                            setRoomUrlInputs((prev) => ({
                                              ...prev,
                                              [rIdx]: e.target.value,
                                            }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              addHotelRoomPhotoUrl(rIdx);
                                            }
                                          }}
                                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-ink focus:outline-none focus:border-purple-500"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => addHotelRoomPhotoUrl(rIdx)}
                                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold shrink-0 hover:bg-slate-900 transition cursor-pointer"
                                        >
                                          + Add URL
                                        </button>
                                      </div>
                                    </div>

                                    {/* Previews */}
                                    {room.images && room.images.length > 0 && (
                                      <div className="flex flex-wrap gap-2.5 pt-2">
                                        {room.images.map((imgUrl, imgIdx) => (
                                          <div
                                            key={imgIdx}
                                            className="relative w-20 h-20 rounded-xl overflow-hidden border border-purple-200 bg-slate-100 group shadow-2xs"
                                          >
                                            <Image
                                              src={imgUrl}
                                              alt={`Room Photo ${imgIdx + 1}`}
                                              fill
                                              className="object-cover"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => removeHotelRoomPhoto(rIdx, imgIdx)}
                                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center opacity-90 hover:opacity-100 shadow-sm cursor-pointer"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-line">
            <p className="text-xs text-muted">
              All category-specific rates, coverage, and facilities will be saved together.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving All Categories..." : "Save Category Services & Facilities"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: KYC DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-brand-50/70 border border-brand-200">
            <h4 className="font-serif text-base font-bold text-wine">
              Mandatory Verification Documents
            </h4>
            <p className="mt-1 text-xs md:text-sm text-muted">
              Please upload clear images or PDF copies of all mandatory documents. Our admin team verifies each document individually.
            </p>
          </div>

          {/* Document Cards List */}
          <div className="space-y-4">
            {[
              { type: "pan", title: "PAN Card", req: true, desc: "Personal or Company PAN Card" },
              { type: "aadhaar", title: "Aadhaar Card", req: true, desc: "Front and back image of Aadhaar Card" },
              { type: "cancelled_cheque", title: "Cancelled Cheque / Bank Proof", req: true, desc: "Cancelled cheque showing account number and IFSC, or passbook copy" },
              { type: "gst", title: "GST Certificate", req: isBusiness, desc: "Mandatory for registered businesses, optional for individuals" },
              { type: "business_reg", title: "Business Registration Certificate", req: isBusiness, desc: "MSME, Shop Act, Incorporation or Partnership deed (for businesses)" },
            ].map((item) => {
              const doc = getDoc(item.type);
              const status = doc?.status || "pending";
              const isUploading = uploadingDoc[item.type];

              return (
                <div key={item.type} className="bg-white p-5 md:p-6 rounded-2xl border border-line shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-ink text-base">
                        {item.title} {item.req ? <span className="text-rose-600">*</span> : <span className="text-xs text-muted font-normal">(Conditional)</span>}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
                        status === "verified"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : status === "under_review"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : status === "rejected"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span>{status === "verified" ? "🟢" : status === "under_review" ? "🔵" : status === "rejected" ? "🔴" : "🟡"}</span>
                      {status === "verified"
                        ? "Verified"
                        : status === "under_review"
                        ? "Under Review"
                        : status === "rejected"
                        ? "Rejected"
                        : "Pending"}
                    </span>
                  </div>

                  {status === "rejected" && doc?.rejectionReason && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                      <b className="font-semibold">Admin Rejection Reason: </b> {doc.rejectionReason}
                      <div className="mt-1 text-ink/70">Please re-upload a clearer or corrected copy below.</div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {doc?.fileUrl && (
                      <div className="flex items-center gap-3">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-line hover:border-brand-600 text-xs font-medium text-ink hover:text-brand-600 transition-colors"
                        >
                          <span>👁️</span> View Uploaded Document
                        </a>
                        {doc.uploadedAt && (
                          <span className="text-xs text-muted">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-brand-500 bg-brand-50/40 text-brand-700 hover:bg-brand-50 text-xs font-semibold cursor-pointer transition-colors">
                      <span>{isUploading ? "⏳ Uploading..." : doc?.fileUrl ? "↻ Re-upload File" : "📤 Upload File (Image/PDF)"}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => e.target.files?.[0] && handleDocUpload(item.type, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BANK DETAILS */}
      {activeTab === "bank" && (
        <form onSubmit={saveBankDetails} className="bg-white p-6 md:p-8 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-wine">
                Bank Account Details
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Required for direct vendor booking payouts and settlements. Information is securely stored.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
                profile?.bankDetails?.status === "verified"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : profile?.bankDetails?.status === "rejected"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              Status: {profile?.bankDetails?.status || "pending"}
            </span>
          </div>

          {profile?.bankDetails?.status === "rejected" && profile?.bankDetails?.rejectionReason && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
              <b className="font-semibold">Bank Verification Rejected: </b> {profile.bankDetails.rejectionReason}
              <div className="mt-1 text-ink/70">Please update your bank details and re-upload the cancelled cheque.</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Account Holder Name *
              </label>
              <input
                required
                placeholder="Must match ID/Business Name"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Bank Name *
              </label>
              <input
                required
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Bank Account Number *
              </label>
              <input
                required
                placeholder="Enter complete bank account number"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                IFSC Code *
              </label>
              <input
                required
                placeholder="e.g. HDFC0001234"
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 uppercase"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface/50">
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Cancelled Cheque / Bank Proof *
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "flipsaura/documents");
                  setBankForm((prev) => ({ ...prev, chequeUrl: url }));
                }
              }}
              className="text-xs file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
            />
            {bankForm.chequeUrl && (
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={bankForm.chequeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:border-brand-600 text-xs font-medium text-ink hover:text-brand-600 transition-colors"
                >
                  👁️ View Uploaded Cheque / Proof
                </a>
                <span className="text-xs text-emerald-700 font-medium">✓ File attached</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-2xs disabled:opacity-50"
            >
              {saving ? "Saving Bank Details..." : "Save Bank Details"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: PORTFOLIO */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-wine">
                Vendor Portfolio & Previous Work
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Upload photos and videos showcasing your wedding work to impress prospective couples.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPortfolioId(null);
                setPortfolioForm({ title: "", category: "Wedding", serviceCategory: "", description: "", images: [], videoUrl: "" });
                setPortfolioModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-2xs self-start sm:self-auto"
            >
              + Add Portfolio Item
            </button>
          </div>

          {(!profile?.portfolio || profile.portfolio.length === 0) ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-line shadow-2xs">
              <span className="text-4xl block mb-2">📸</span>
              <h4 className="font-serif text-lg font-bold text-ink mb-1">No Portfolio Items Yet</h4>
              <p className="text-muted text-xs sm:text-sm max-w-md mx-auto mb-6">
                Showcase your previous work, wedding shoots, decoration setups, or event highlights.
              </p>
              <button
                onClick={() => setPortfolioModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors shadow-2xs"
              >
                + Add First Portfolio Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profile.portfolio.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-line overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-brand-50 flex items-center justify-center text-brand-700 text-sm font-semibold">
                        🎬 Video Project
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                          {item.category || "General"}
                        </span>
                        {item.images?.length > 1 && (
                          <span className="text-xs text-muted">+{item.images.length - 1} photos</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-ink text-base line-clamp-1">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-muted line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-line/60 mt-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPortfolioId(item._id);
                        setPortfolioForm({
                          title: item.title,
                          category: item.category,
                          serviceCategory: item.serviceCategory?._id || item.serviceCategory || "",
                          description: item.description,
                          images: item.images || [],
                          videoUrl: item.videos?.[0] || "",
                        });
                        setPortfolioModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-ink hover:text-brand-600 hover:border-brand-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePortfolioItem(item._id)}
                      className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit Portfolio Modal */}
          {portfolioModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
              onClick={() => setPortfolioModalOpen(false)}
            >
              <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 md:p-8 relative border border-line space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <h3 className="font-serif text-lg font-bold text-wine">
                    {editingPortfolioId ? "Edit Portfolio Item" : "Add Portfolio Item"}
                  </h3>
                  <button
                    onClick={() => setPortfolioModalOpen(false)}
                    className="text-gray-400 hover:text-ink w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={savePortfolioItem} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Project / Event Title *
                    </label>
                    <input
                      required
                      placeholder="e.g. Royal Palace Wedding at Rambagh"
                      value={portfolioForm.title}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                        Category / Event Type
                      </label>
                      <input
                        placeholder="e.g. Wedding, Decor"
                        value={portfolioForm.category}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                        Service Category
                      </label>
                      <select
                        value={portfolioForm.serviceCategory}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, serviceCategory: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief details about the event, theme, or setup..."
                      value={portfolioForm.description}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 resize-y"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-line bg-surface/50">
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Upload Photos (Multiple allowed)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        for (const file of files) {
                          const url = await uploadFile(file, "flipsaura/portfolio");
                          setPortfolioForm((prev) => ({ ...prev, images: [...prev.images, url] }));
                        }
                      }}
                      className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                    />
                    {portfolioForm.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {portfolioForm.images.map((imgUrl, idx) => (
                          <div key={idx} className="relative group">
                            <img src={imgUrl} alt="prev" className="w-14 h-14 rounded-lg object-cover border border-line" />
                            <button
                              type="button"
                              onClick={() => setPortfolioForm({ ...portfolioForm, images: portfolioForm.images.filter((_, i) => i !== idx) })}
                              className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                      Video / Reel URL (YouTube, Vimeo, Cloudinary)
                    </label>
                    <input
                      placeholder="https://..."
                      value={portfolioForm.videoUrl}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, videoUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setPortfolioModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-line text-xs font-medium text-ink hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save to Portfolio"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: VERIFICATION CHECKLIST & SUBMISSION */}
      {activeTab === "verification" && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="border-b border-line pb-4">
            <h3 className="font-serif text-lg md:text-xl font-bold text-wine">
              Verification Checklist & Submission
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Ensure all requirements below are completed. Once submitted, your profile will be sent to the FlipsAura verification team for final review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${completion?.isProfileComplete ? "bg-emerald-50/70 border-emerald-200" : "bg-amber-50/70 border-amber-200"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{completion?.isProfileComplete ? "✅" : "⚠️"}</span>
                <div>
                  <h4 className="font-semibold text-ink text-sm">Profile & Services</h4>
                  <span className="text-xs text-muted">
                    {completion?.isProfileComplete ? "All required details filled" : "Incomplete information"}
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${completion?.areDocumentsComplete ? "bg-emerald-50/70 border-emerald-200" : "bg-amber-50/70 border-amber-200"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{completion?.areDocumentsComplete ? "✅" : "⚠️"}</span>
                <div>
                  <h4 className="font-semibold text-ink text-sm">Mandatory KYC Documents</h4>
                  <span className="text-xs text-muted">
                    {completion?.mandatoryUploaded} of {completion?.mandatoryTotal} mandatory documents uploaded
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${completion?.areBankDetailsComplete ? "bg-emerald-50/70 border-emerald-200" : "bg-amber-50/70 border-amber-200"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{completion?.areBankDetailsComplete ? "✅" : "⚠️"}</span>
                <div>
                  <h4 className="font-semibold text-ink text-sm">Bank Settlement Details</h4>
                  <span className="text-xs text-muted">
                    {completion?.areBankDetailsComplete ? "Account details & cheque attached" : "Incomplete bank details"}
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${profile?.verificationStatus === "approved" ? "bg-emerald-50/70 border-emerald-200" : "bg-sky-50/70 border-sky-200"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{profile?.verificationStatus === "approved" ? "🟢" : "⏳"}</span>
                <div>
                  <h4 className="font-semibold text-ink text-sm">Admin Approval</h4>
                  <span className="text-xs text-muted capitalize">
                    Status: {profile?.verificationStatus?.replace("_", " ") || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {completion?.missingFields?.length > 0 ? (
            <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <h4 className="font-bold text-sm">Your profile cannot be submitted yet.</h4>
              <p className="text-xs text-rose-800">Please provide the following required items:</p>
              <ul className="list-disc list-inside text-xs space-y-1 text-rose-900 font-medium">
                {completion.missingFields.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <h4 className="font-bold text-sm mb-1">🎉 All requirements are complete!</h4>
              <p className="text-xs text-emerald-800">
                You are ready to submit your application for Admin Verification.
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={submitForVerification}
              disabled={!completion?.canSubmitForVerification || saving || profile?.verificationStatus === "approved"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profile?.verificationStatus === "approved"
                ? "✓ Account Approved & Active"
                : profile?.verificationStatus === "under_review"
                ? "⏳ Submitted — Currently Under Review"
                : "Submit for Admin Verification →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
