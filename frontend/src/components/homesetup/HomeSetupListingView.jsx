"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "@/compat/Link";
import { useRouter, useSearchParams } from "@/compat/navigation";
import Pagination from "@/components/Pagination";
import {
  fetchCategoryItems,
  selectCategoryItems,
  selectCategoryLoading,
} from "@/store/listingsSlice";

const HOME_SETUP_SLUG = "home-setup-pandal-tent-dj";

const ALL_BIHAR_DISTRICTS = [
  "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur",
  "Bhojpur", "Buxar", "Darbhanga", "Daudnagar", "Dehri on Sone",
  "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad",
  "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai",
  "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda",
  "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur",
  "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul",
  "Vaishali", "West Champaran",
];

export const HOME_SETUP_SUBCATEGORIES = [
  {
    id: "all",
    name: "All Services",
    icon: "🎪",
    description: "Browse all complete home wedding setups and event rentals.",
    items: [],
  },
  {
    id: "Tent & Pandal",
    name: "Tent & Pandal",
    icon: "⛺",
    description: "Waterproof tents, royal shamianas, German hangers, and luxury pandal setups.",
    items: [
      "Waterproof Tent",
      "German Hanger Tent",
      "Royal Shamiana",
      "Wedding Pandal",
      "VIP Pandal",
      "Canopy & Open-Air Tent",
      "Garden Tent Setup",
    ],
  },
  {
    id: "Furniture & Seating",
    name: "Furniture & Seating",
    icon: "🪑",
    description: "Banquet chairs, VIP sofas, dining arrangements, and lounge seating.",
    items: [
      "Plastic & Banquet Chairs",
      "VIP Sofa",
      "Bride & Groom Sofa",
      "Round Dining Tables",
      "Dining Chairs",
      "Guest Seating Arrangement",
      "VIP Lounge Setup",
    ],
  },
  {
    id: "Stage & Decoration",
    name: "Stage & Decoration",
    icon: "🌸",
    description: "Wedding stages, floral mandaps, LED backdrops, and red carpet entrance setups.",
    items: [
      "Wedding Stage",
      "Reception Stage",
      "Bride & Groom Stage",
      "LED Backdrop",
      "Floral Decoration",
      "Mandap Decoration",
      "Entrance Gate Decoration",
      "Theme-Based Decoration",
      "Red Carpet & Stage Flooring",
    ],
  },
  {
    id: "DJ & Sound System",
    name: "DJ & Sound System",
    icon: "🔊",
    description: "Professional DJs, line array sound systems, bass subwoofers, and live mics.",
    items: [
      "Professional DJ",
      "DJ Console",
      "DJ with Operator",
      "Line Array Sound System",
      "Bass & Subwoofer",
      "Professional Speakers",
      "Wireless Microphone",
      "Orchestra Sound System",
      "Anchor & Announcement Mic",
    ],
  },
  {
    id: "Lighting & Special Effects",
    name: "Lighting & Special Effects",
    icon: "💡",
    description: "LED par lights, moving heads, lasers, disco effects, and cold pyros.",
    items: [
      "LED Par Lights",
      "Moving Head Lights",
      "RGB Lights",
      "Serial Lights",
      "Focus Lights",
      "Laser & Disco Lights",
      "Follow Spot Lights",
      "Cold Pyro Effects",
    ],
  },
  {
    id: "Power & Generator",
    name: "Power & Generator",
    icon: "⚡",
    description: "Silent generators, uninterrupted power backups, electrical wiring, and on-site electricians.",
    items: [
      "Generator (5 KVA / 10 KVA / 25 KVA / 62.5 KVA)",
      "Silent Generator",
      "Power Backup",
      "Electrical Wiring",
      "Distribution Board",
      "Professional Electrician",
    ],
  },
  {
    id: "Additional Facilities",
    name: "Additional Facilities",
    icon: "🚪",
    description: "Green rooms, changing rooms, VIP areas, ACs, coolers, and parking arrangements.",
    items: [
      "Green Room",
      "Changing Room",
      "VIP Guest Area",
      "Portable Fans",
      "Air Coolers",
      "Air Conditioners",
      "Portable Washroom",
      "Waterproof Flooring",
      "Barricading",
      "Parking Arrangement",
    ],
  },
];

export default function HomeSetupListingView() {
  const router = useRouter();
  const sp = useSearchParams();
  const dispatch = useDispatch();

  const [page, setPage] = useState(parseInt(sp.get("page") || "1", 10));
  const [warningMessage, setWarningMessage] = useState("");

  // Subcategory tab state
  const [activeSubcat, setActiveSubcat] = useState(sp.get("subcat") || "all");
  const [selectedItemPill, setSelectedItemPill] = useState(sp.get("item") || "");

  // Filters state
  const [filters, setFilters] = useState({
    q: sp.get("q") || "",
    district: sp.get("district") || sp.get("city") || "",
    minPrice: sp.get("minPrice") || "",
    maxPrice: sp.get("maxPrice") || "",
    sort: sp.get("sort") || "newest",
  });

  // ── Build query params object for Redux cache key ──────────────────────────
  const queryParams = useMemo(() => {
    const p = { page: String(page) };
    if (activeSubcat && activeSubcat !== "all") p.mainCategory = activeSubcat;
    if (selectedItemPill) p.subcategory = selectedItemPill;
    if (filters.q?.trim()) p.q = filters.q.trim();
    if (filters.district?.trim()) p.district = filters.district.trim();
    if (filters.minPrice !== "") p.minPrice = filters.minPrice;
    if (filters.maxPrice !== "") p.maxPrice = filters.maxPrice;
    if (filters.sort) p.sort = filters.sort;
    return p;
  }, [page, activeSubcat, selectedItemPill, filters]);

  // ── Redux selectors (instant from cache, 0ms on revisit) ──────────────────
  const cachedData = useSelector(selectCategoryItems(HOME_SETUP_SLUG, queryParams));
  const isLoading = useSelector(selectCategoryLoading(HOME_SETUP_SLUG, queryParams));

  const items = cachedData?.items || [];
  const totalCount = cachedData?.total ?? 0;
  const totalPages = cachedData?.totalPages ?? 1;

  // ── Fetch via Redux thunk (skips if cache is fresh) ───────────────────────
  useEffect(() => {
    dispatch(fetchCategoryItems({ slug: HOME_SETUP_SLUG, params: queryParams }));
  }, [dispatch, queryParams]);

  // Show loading only when no cached data exists
  const loading = isLoading && items.length === 0;

  // Show warning from cached data
  useEffect(() => {
    if (cachedData?.warning) setWarningMessage(cachedData.warning);
    else setWarningMessage("");
  }, [cachedData]);

  const updateSubcatTab = (subcatId) => {
    setActiveSubcat(subcatId);
    setSelectedItemPill("");
    setPage(1);

    const nextParams = new URLSearchParams();
    if (subcatId !== "all") nextParams.set("subcat", subcatId);
    if (filters.q?.trim()) nextParams.set("q", filters.q.trim());
    if (filters.district?.trim()) nextParams.set("district", filters.district.trim());
    if (filters.minPrice !== "") nextParams.set("minPrice", filters.minPrice);
    if (filters.maxPrice !== "") nextParams.set("maxPrice", filters.maxPrice);
    if (filters.sort && filters.sort !== "newest") nextParams.set("sort", filters.sort);

    const queryStr = nextParams.toString();
    router.replace(`/categories/home-setup-pandal-tent-dj${queryStr ? `?${queryStr}` : ""}`);
  };

  const updateItemPill = (itemName) => {
    const nextVal = selectedItemPill === itemName ? "" : itemName;
    setSelectedItemPill(nextVal);
    setPage(1);

    const nextParams = new URLSearchParams();
    if (activeSubcat !== "all") nextParams.set("subcat", activeSubcat);
    if (nextVal) nextParams.set("item", nextVal);
    if (filters.q?.trim()) nextParams.set("q", filters.q.trim());
    if (filters.district?.trim()) nextParams.set("district", filters.district.trim());
    if (filters.minPrice !== "") nextParams.set("minPrice", filters.minPrice);
    if (filters.maxPrice !== "") nextParams.set("maxPrice", filters.maxPrice);
    if (filters.sort && filters.sort !== "newest") nextParams.set("sort", filters.sort);

    const queryStr = nextParams.toString();
    router.replace(`/categories/home-setup-pandal-tent-dj${queryStr ? `?${queryStr}` : ""}`);
  };

  const updateFilter = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      const nextParams = new URLSearchParams();
      if (activeSubcat !== "all") nextParams.set("subcat", activeSubcat);
      if (selectedItemPill) nextParams.set("item", selectedItemPill);
      if (next.q?.trim()) nextParams.set("q", next.q.trim());
      if (next.district?.trim()) nextParams.set("district", next.district.trim());
      if (next.minPrice !== "") nextParams.set("minPrice", next.minPrice);
      if (next.maxPrice !== "") nextParams.set("maxPrice", next.maxPrice);
      if (next.sort && next.sort !== "newest") nextParams.set("sort", next.sort);

      const queryStr = nextParams.toString();
      router.replace(`/categories/home-setup-pandal-tent-dj${queryStr ? `?${queryStr}` : ""}`);
      return next;
    });
    setPage(1);
  };

  const resetAllFilters = () => {
    setActiveSubcat("all");
    setSelectedItemPill("");
    setFilters({
      q: "",
      district: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
    setPage(1);
    router.replace(`/categories/home-setup-pandal-tent-dj`);
  };

  const currentSubcatData = useMemo(() => {
    return HOME_SETUP_SUBCATEGORIES.find((s) => s.id === activeSubcat) || HOME_SETUP_SUBCATEGORIES[0];
  }, [activeSubcat]);

  const hasActiveFilters = Boolean(
    activeSubcat !== "all" ||
    selectedItemPill ||
    filters.q ||
    filters.district ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.sort && filters.sort !== "newest")
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border-b border-amber-200/60 py-8 sm:py-12">
        <div className="w-full px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted mb-3 flex-wrap">
            <Link href="/" className="hover:text-amber-800 transition">Home</Link>
            <span>/</span>
            <span className="text-amber-800 font-semibold">Home Setup – Pandal, Tent & DJ</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                <span>🎪</span>
                <span>Event Services Catalogue & Equipment Setup</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-ink">
                Home Setup – Pandal, Tent, DJ & Ghar Setup
              </h1>
              <p className="text-muted text-xs sm:text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed">
                Book verified home wedding & event setups: waterproof tents, royal shamianas, stages, sound systems, generators, and dining furniture across Bihar.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-amber-200 shadow-xs text-center">
                <span className="text-xl font-bold text-amber-900 block">{totalCount}</span>
                <span className="text-[11px] text-muted font-medium">Available Setups</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategory Navigation Bar (7 Catalogue Groups) */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-line shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            {HOME_SETUP_SUBCATEGORIES.map((tab) => {
              const isActive = activeSubcat === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateSubcatTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
                    isActive
                      ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
                      : "bg-surface/80 hover:bg-amber-50 text-ink/80 border-line hover:border-amber-200"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto py-6 sm:py-8 space-y-6">
        {/* Quick Item Filter Chips for Selected Subcategory */}
        {currentSubcatData.items.length > 0 && (
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-900 font-bold uppercase tracking-wider">
              <span>Included Equipment & Options in {currentSubcatData.name}:</span>
              {selectedItemPill && (
                <button
                  type="button"
                  onClick={() => setSelectedItemPill("")}
                  className="text-[11px] text-amber-800 hover:underline font-semibold"
                >
                  Clear Item Filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {currentSubcatData.items.map((itemName) => {
                const isSelected = selectedItemPill === itemName;
                return (
                  <button
                    key={itemName}
                    type="button"
                    onClick={() => updateItemPill(itemName)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-amber-600 text-white border-amber-700 shadow-xs font-semibold"
                        : "bg-white text-ink/80 border-amber-200 hover:bg-amber-100/60"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{itemName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Location Filter Bar */}
        <div className="bg-brand-50/60 p-3.5 sm:p-4 rounded-2xl border border-brand-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search tent, pandal, DJ, generator, VIP sofa..."
                value={filters.q}
                onChange={(e) => updateFilter({ q: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
              <span className="absolute left-3 top-2.5 text-muted text-xs">🔍</span>
            </div>

            {/* District Filter */}
            <div className="w-full sm:w-56 shrink-0">
              <select
                value={filters.district}
                onChange={(e) => updateFilter({ district: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
              >
                <option value="">All Bihar Districts</option>
                {ALL_BIHAR_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 justify-between md:justify-end">
            {/* Sort Dropdown */}
            <select
              value={filters.sort}
              onChange={(e) => updateFilter({ sort: e.target.value })}
              className="px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
            >
              <option value="newest">Newest First</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-muted hover:text-ink text-xs font-semibold border border-line transition cursor-pointer shadow-xs"
              >
                ↺ Reset
              </button>
            )}
          </div>
        </div>

        {/* Warning banner */}
        {warningMessage && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-medium text-amber-800">
            ⚠️ {warningMessage}
          </div>
        )}

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted mr-1">Active:</span>
            {activeSubcat !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold">
                Category: {activeSubcat}
                <button type="button" onClick={() => updateSubcatTab("all")} className="hover:text-red-600">×</button>
              </span>
            )}
            {selectedItemPill && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold">
                Equipment: {selectedItemPill}
                <button type="button" onClick={() => setSelectedItemPill("")} className="hover:text-red-600">×</button>
              </span>
            )}
            {filters.district && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold">
                District: {filters.district}
                <button type="button" onClick={() => updateFilter({ district: "" })} className="hover:text-red-600">×</button>
              </span>
            )}
            {filters.q && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold">
                "{filters.q}"
                <button type="button" onClick={() => updateFilter({ q: "" })} className="hover:text-red-600">×</button>
              </span>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl border border-line bg-surface/50 h-96 animate-pulse p-4 space-y-3">
                <div className="w-full h-48 bg-gray-200 rounded-xl" />
                <div className="w-3/4 h-5 bg-gray-200 rounded-md" />
                <div className="w-1/2 h-4 bg-gray-200 rounded-md" />
                <div className="w-full h-10 bg-gray-200 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/30 p-8 space-y-3">
            <span className="text-4xl">🎪</span>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-ink">
              No Home Setup services found matching your criteria
            </h3>
            <p className="text-muted text-xs sm:text-sm max-w-md mx-auto">
              Try selecting a different category tab, clearing filters, or choosing "All Bihar Districts".
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const activeCatPhoto =
                activeSubcat !== "all"
                  ? ((Array.isArray(item.categoryPhotosMap?.[activeSubcat]) && item.categoryPhotosMap[activeSubcat][0]) ||
                     (Array.isArray(item.categoryPhotos) && item.categoryPhotos.find((cp) => cp?.categoryName === activeSubcat)?.images?.[0]))
                  : null;

              const displayImage =
                activeCatPhoto ||
                item.images?.[0] ||
                "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_home-setup-pandal-tent-dj.png";
              const priceVal = Number(item.rentalPrice || item.price) || 0;
              const mainCats = Array.isArray(item.mainCategories) ? item.mainCategories : [];
              const subcats = Array.isArray(item.subcategories) ? item.subcategories : [];
              const vendorPhone = item.contactPhone || item.vendor?.phone || "";

              return (
                <div
                  key={item._id}
                  className="rounded-2xl border border-brand-100 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  {/* Card Image */}
                  <Link href={`/product/${item._id}`} className="relative aspect-[16/10] block overflow-hidden bg-gray-100">
                    <img
                      src={displayImage}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    {/* Verified & Featured Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                        Home Setup
                      </span>
                      {activeCatPhoto && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white shadow-xs">
                          📸 {activeSubcat}
                        </span>
                      )}
                      {item.featured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-xs">
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1">
                      <span>★</span>
                      <span>{item.rating?.toFixed(1) || "4.8"}</span>
                    </div>

                    {/* Location at bottom of photo */}
                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                      <span className="text-xs font-semibold flex items-center gap-1 drop-shadow-sm">
                        <span>📍</span>
                        <span>{item.locality ? `${item.locality}, ${item.city}` : item.city || "Bihar"}</span>
                      </span>
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    <div>
                      <Link href={`/product/${item._id}`}>
                        <h3 className="font-serif font-bold text-base sm:text-lg text-ink hover:text-amber-800 transition line-clamp-1">
                          {item.title}
                        </h3>
                      </Link>

                      {item.about && (
                        <p className="text-muted text-xs line-clamp-2 mt-1 leading-relaxed">
                          {item.about}
                        </p>
                      )}

                      {/* Main Category Service Tags */}
                      {mainCats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {mainCats.slice(0, 4).map((catName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900"
                            >
                              <span>✓</span>
                              <span>{catName}</span>
                            </span>
                          ))}
                          {mainCats.length > 4 && (
                            <span className="text-[10px] font-semibold text-muted px-1 self-center">
                              +{mainCats.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Specific Subcategory Equipment Chips */}
                      {subcats.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-brand-50 flex flex-wrap gap-1">
                          {subcats.slice(0, 3).map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] text-muted bg-surface px-2 py-0.5 rounded border border-line"
                            >
                              • {sub}
                            </span>
                          ))}
                          {subcats.length > 3 && (
                            <span className="text-[10px] text-muted self-center">
                              +{subcats.length - 3} items
                            </span>
                          )}
                        </div>
                      )}

                      {/* Category Photos Count Pill */}
                      {(() => {
                        const catEntries = Object.entries(item.categoryPhotosMap || {}).filter(([_, imgs]) => Array.isArray(imgs) && imgs.length > 0);
                        if (catEntries.length > 0) {
                          const totalImgs = catEntries.reduce((sum, [_, imgs]) => sum + imgs.length, 0);
                          return (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-900 bg-amber-50/90 border border-amber-200/90 px-2 py-1 rounded-lg">
                              <span>📸</span>
                              <span>{totalImgs} Real Photos across {catEntries.length} Categories</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Price & Actions Footer */}
                    <div className="pt-3 border-t border-line space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-muted uppercase font-bold tracking-wider block">
                            Setup Package Price
                          </span>
                          <span className="text-xl font-bold text-amber-900">
                            {priceVal > 0 ? `₹${priceVal.toLocaleString("en-IN")}` : "On Request"}
                          </span>
                        </div>

                        <span className="text-[11px] text-muted font-medium bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                          Complete Setup
                        </span>
                      </div>

                      {/* Contact & View Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {vendorPhone ? (
                          <a
                            href={`tel:${vendorPhone}`}
                            className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>📞</span>
                            <span>Call</span>
                          </a>
                        ) : (
                          <a
                            href="tel:9876543210"
                            className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>📞</span>
                            <span>Enquire</span>
                          </a>
                        )}

                        <Link
                          href={`/product/${item._id}`}
                          className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        >
                          <span>View Setup</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-6 flex justify-center">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 200, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

