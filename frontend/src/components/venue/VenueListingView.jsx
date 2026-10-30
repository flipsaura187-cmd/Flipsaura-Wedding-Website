"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "@/compat/Link";
import { useRouter, useSearchParams } from "@/compat/navigation";
import api from "@/api/axios";
import Pagination from "@/components/Pagination";

const ALL_BIHAR_DISTRICTS = [
  "Araria",
  "Arwal",
  "Aurangabad",
  "Banka",
  "Begusarai",
  "Bhagalpur",
  "Bhojpur",
  "Buxar",
  "Darbhanga",
  "Daudnagar",
  "Dehri on Sone",
  "East Champaran",
  "Gaya",
  "Gopalganj",
  "Jamui",
  "Jehanabad",
  "Kaimur",
  "Katihar",
  "Khagaria",
  "Kishanganj",
  "Lakhisarai",
  "Madhepura",
  "Madhubani",
  "Munger",
  "Muzaffarpur",
  "Nalanda",
  "Nawada",
  "Patna",
  "Purnia",
  "Rohtas",
  "Saharsa",
  "Samastipur",
  "Saran",
  "Sheikhpura",
  "Sheohar",
  "Sitamarhi",
  "Siwan",
  "Supaul",
  "Vaishali",
  "West Champaran",
];

export const VENUE_CATEGORY_TABS = [
  { id: "all", label: "All Venues", icon: "🏛️" },
  { id: "Banquet Halls", label: "Banquet Halls", icon: "🏢" },
  { id: "Marriage Garden / Lawns", label: "Marriage Garden / Lawns", icon: "🌿" },
  { id: "Wedding Resorts", label: "Wedding Resorts", icon: "🏰" },
  { id: "Small Function / Party Halls", label: "Party Halls", icon: "🎉" },
];

export const SPACE_FILTER_OPTIONS = [
  { id: "Indoor", label: "Indoor (Banquet Hall)", icon: "🏛️" },
  { id: "Outdoor", label: "Outdoor (Lawn / Garden)", icon: "🌿" },
  { id: "Poolside", label: "Poolside", icon: "🏊" },
  { id: "Terrace", label: "Terrace / Rooftop", icon: "🌇" },
  { id: "Courtyard", label: "Courtyard", icon: "🏕️" },
];

export const FEATURE_FILTER_OPTIONS = [
  "In-House Catering Available",
  "Outside Catering Allowed",
  "Central Air Conditioning (AC)",
  "24/7 Power Backup Generator",
  "Valet Parking Available",
  "Bridal Dressing Room Available",
  "DJ & Sound System Allowed",
  "Hawan & Fire Rituals Permitted",
  "Baraat Allowed with Band",
  "Overnight Wedding Allowed",
];

export default function VenueListingView() {
  const router = useRouter();
  const sp = useSearchParams();

  // Primary list state
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(parseInt(sp.get("page") || "1", 10));
  const [totalPages, setTotalPages] = useState(1);
  const [filterMeta, setFilterMeta] = useState(null);

  // Mobile filters drawer open/close
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter State (Matching all 9 User Requirements)
  const [filters, setFilters] = useState({
    q: sp.get("q") || "",
    district: sp.get("district") || sp.get("city") || "",
    locality: sp.get("locality") || "",
    minGuests: sp.get("minGuests") || "",
    maxGuests: sp.get("maxGuests") || "",
    minRooms: sp.get("minRooms") || "",
    maxPricePerPlate: sp.get("maxPricePerPlate") || "",
    minRental: sp.get("minRental") || "",
    maxRental: sp.get("maxRental") || "",
    venueType: sp.get("venueType") || "all",
    space: sp.get("space") || "",
    minRating: sp.get("minRating") || "",
    features: sp.get("features") ? sp.get("features").split(",") : [],
    sort: sp.get("sort") || "newest",
  });

  // Fetch filter metadata
  useEffect(() => {
    let active = true;
    async function fetchMeta() {
      try {
        const { data } = await api.get("/api/items/filter-options?category=venues");
        if (active && data?.ok) {
          setFilterMeta(data.data?.venueFilterMeta || null);
        }
      } catch (err) {
        console.error("Filter options fetch error:", err);
      }
    }
    fetchMeta();
    return () => {
      active = false;
    };
  }, []);

  // Fetch venues with all filters
  const loadVenues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: "venues",
        page: String(page),
        limit: "12",
      });

      if (filters.q?.trim()) params.set("q", filters.q.trim());
      if (filters.district?.trim()) params.set("district", filters.district.trim());
      if (filters.locality?.trim()) params.set("locality", filters.locality.trim());
      if (filters.minGuests) params.set("minGuests", filters.minGuests);
      if (filters.maxGuests) params.set("maxGuests", filters.maxGuests);
      if (filters.minRooms) params.set("minRooms", filters.minRooms);
      if (filters.maxPricePerPlate) params.set("maxPricePerPlate", filters.maxPricePerPlate);
      if (filters.minRental) params.set("minRental", filters.minRental);
      if (filters.maxRental) params.set("maxRental", filters.maxRental);
      if (filters.venueType && filters.venueType !== "all") params.set("venueType", filters.venueType);
      if (filters.space) params.set("space", filters.space);
      if (filters.minRating) params.set("minRating", filters.minRating);
      if (Array.isArray(filters.features) && filters.features.length > 0) {
        params.set("features", filters.features.join(","));
      }
      if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);

      const { data } = await api.get(`/api/items?${params.toString()}`);
      if (data?.ok) {
        setVenues(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalCount(data.data.total ?? data.data.items?.length ?? 0);
      }
    } catch (err) {
      console.error("Load venues error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // Update filter & sync URL
  const updateFilter = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      const nextParams = new URLSearchParams();

      if (next.q?.trim()) nextParams.set("q", next.q.trim());
      if (next.district?.trim()) nextParams.set("district", next.district.trim());
      if (next.locality?.trim()) nextParams.set("locality", next.locality.trim());
      if (next.minGuests) nextParams.set("minGuests", next.minGuests);
      if (next.maxGuests) nextParams.set("maxGuests", next.maxGuests);
      if (next.minRooms) nextParams.set("minRooms", next.minRooms);
      if (next.maxPricePerPlate) nextParams.set("maxPricePerPlate", next.maxPricePerPlate);
      if (next.minRental) nextParams.set("minRental", next.minRental);
      if (next.maxRental) nextParams.set("maxRental", next.maxRental);
      if (next.venueType && next.venueType !== "all") nextParams.set("venueType", next.venueType);
      if (next.space) nextParams.set("space", next.space);
      if (next.minRating) nextParams.set("minRating", next.minRating);
      if (Array.isArray(next.features) && next.features.length > 0) {
        nextParams.set("features", next.features.join(","));
      }
      if (next.sort && next.sort !== "newest") nextParams.set("sort", next.sort);

      const queryStr = nextParams.toString();
      router.replace(`/categories/venues${queryStr ? `?${queryStr}` : ""}`);
      return next;
    });
    setPage(1);
  };

  const resetAllFilters = () => {
    setFilters({
      q: "",
      district: "",
      locality: "",
      minGuests: "",
      maxGuests: "",
      minRooms: "",
      maxPricePerPlate: "",
      minRental: "",
      maxRental: "",
      venueType: "all",
      space: "",
      minRating: "",
      features: [],
      sort: "newest",
    });
    setPage(1);
    router.replace("/categories/venues");
  };

  const toggleFeature = (feat) => {
    const list = Array.isArray(filters.features) ? [...filters.features] : [];
    const idx = list.indexOf(feat);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(feat);
    }
    updateFilter({ features: list });
  };

  const hasActiveFilters = Boolean(
    filters.q ||
    filters.district ||
    filters.locality ||
    filters.minGuests ||
    filters.maxGuests ||
    filters.minRooms ||
    filters.maxPricePerPlate ||
    filters.minRental ||
    filters.maxRental ||
    (filters.venueType && filters.venueType !== "all") ||
    filters.space ||
    filters.minRating ||
    (filters.features && filters.features.length > 0) ||
    (filters.sort && filters.sort !== "newest")
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.q) count++;
    if (filters.district) count++;
    if (filters.locality) count++;
    if (filters.minGuests || filters.maxGuests) count++;
    if (filters.minRooms) count++;
    if (filters.maxPricePerPlate) count++;
    if (filters.minRental || filters.maxRental) count++;
    if (filters.venueType && filters.venueType !== "all") count++;
    if (filters.space) count++;
    if (filters.minRating) count++;
    if (filters.features?.length) count += filters.features.length;
    return count;
  }, [filters]);

  return (
    <section className="py-6 sm:py-10 bg-slate-50 min-h-screen w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Hero Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-brand-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                FlipsAura Curated Venues
              </span>
              <span className="text-xs text-muted font-medium">
                • {totalCount} {totalCount === 1 ? "venue" : "venues"} available
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-ink">
              Wedding Venues & Resorts
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1.5 max-w-2xl">
              Discover verified banquet halls, marriage lawns, luxury wedding resorts, and party halls in Bihar. Filter by guest capacity, room count, rental cost, per-plate price, and spaces.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-600/20"
            >
              <span>⚡ Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-brand-700 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3.5 py-2.5 rounded-xl border border-brand-200 text-ink/80 hover:bg-brand-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filters ↺
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs: Banquet, Lawn, Resort, Party Halls */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {VENUE_CATEGORY_TABS.map((tab) => {
            const isActive = filters.venueType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateFilter({ venueType: tab.id })}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/20 scale-[1.02]"
                    : "bg-white text-ink/80 border border-brand-100 hover:bg-brand-50/60 hover:text-brand-700"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-brand-100 shadow-2xs">
            <span className="text-xs font-bold text-brand-900 mr-1 flex items-center gap-1">
              <span>⚡</span> Active Filters ({activeFilterCount}):
            </span>

            {filters.q && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                Keyword: "{filters.q}"
                <button type="button" onClick={() => updateFilter({ q: "" })} className="hover:text-red-600 ml-0.5">
                  ×
                </button>
              </span>
            )}

            {filters.district && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                City: {filters.district}
                <button type="button" onClick={() => updateFilter({ district: "" })} className="hover:text-red-600 ml-0.5">
                  ×
                </button>
              </span>
            )}

            {filters.locality && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                Locality: {filters.locality}
                <button type="button" onClick={() => updateFilter({ locality: "" })} className="hover:text-red-600 ml-0.5">
                  ×
                </button>
              </span>
            )}

            {(filters.minGuests || filters.maxGuests) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                👥 Guests: {filters.minGuests || "0"} - {filters.maxGuests || "Any"}
                <button
                  type="button"
                  onClick={() => updateFilter({ minGuests: "", maxGuests: "" })}
                  className="hover:text-red-600 ml-0.5"
                >
                  ×
                </button>
              </span>
            )}

            {filters.minRooms && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                🛏️ Rooms: {filters.minRooms}+ Rooms
                <button type="button" onClick={() => updateFilter({ minRooms: "" })} className="hover:text-red-600 ml-0.5">
                  ×
                </button>
              </span>
            )}

            {filters.maxPricePerPlate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                🍽️ Plate: Up to ₹{Number(filters.maxPricePerPlate).toLocaleString("en-IN")}
                <button type="button" onClick={() => updateFilter({ maxPricePerPlate: "" })} className="hover:text-red-600 ml-0.5">
                  ×
                </button>
              </span>
            )}

            {(filters.minRental || filters.maxRental) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                💰 Rent: {filters.minRental ? `₹${Number(filters.minRental).toLocaleString("en-IN")}` : "₹0"} - {filters.maxRental ? `₹${Number(filters.maxRental).toLocaleString("en-IN")}` : "Any"}
                <button
                  type="button"
                  onClick={() => updateFilter({ minRental: "", maxRental: "" })}
                  className="hover:text-red-600 ml-0.5"
                >
                  ×
                </button>
              </span>
            )}

            {filters.venueType && filters.venueType !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                Type: {filters.venueType}
                <button type="button" onClick={() => updateFilter({ venueType: "all" })} className="hover:text-red-600 ml-0.5">
                  ×
                </button>
              </span>
            )}

            {filters.space && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-medium">
                Space: {filters.space}
                <button type="button" onClick={() => updateFilter({ space: "" })} className="hover:text-red-600 ml-0.5">
                  ×
                </button>
              </span>
            )}

            {filters.minRating && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                ★ {filters.minRating}+ Rating
                <button type="button" onClick={() => updateFilter({ minRating: "" })} className="hover:text-red-600 ml-0.5">
                  ×
                </button>
              </span>
            )}

            {Array.isArray(filters.features) &&
              filters.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium"
                >
                  ✓ {f}
                  <button type="button" onClick={() => toggleFeature(f)} className="hover:text-red-600 ml-0.5">
                    ×
                  </button>
                </span>
              ))}

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-bold underline ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Content Layout: Filters Sidebar + Venues Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* DESKTOP FILTERS SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-3xl border border-brand-100 shadow-xs space-y-6 sticky top-24 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100">
              <h2 className="font-serif font-bold text-base text-ink flex items-center gap-1.5">
                <span>⚡</span> Narrow Down Venues
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-brand-600 hover:text-brand-800 font-bold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* 1. City / Locality Filter */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                📍 City / Locality
              </label>
              <select
                value={filters.district}
                onChange={(e) => updateFilter({ district: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">All Bihar Districts</option>
                {ALL_BIHAR_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={filters.locality}
                onChange={(e) => updateFilter({ locality: e.target.value })}
                placeholder="Locality / Area (e.g. Kankarbagh)"
                className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* 2. No. of Guests (Capacity) */}
            <div className="space-y-2 pt-3 border-t border-brand-50">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                👥 No. of Guests
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateFilter({ minGuests: "50", maxGuests: "200" })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filters.minGuests === "50" && filters.maxGuests === "200"
                      ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                      : "bg-surface text-ink border-brand-100 hover:border-brand-300"
                  }`}
                >
                  50 - 200
                </button>
                <button
                  type="button"
                  onClick={() => updateFilter({ minGuests: "200", maxGuests: "500" })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filters.minGuests === "200" && filters.maxGuests === "500"
                      ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                      : "bg-surface text-ink border-brand-100 hover:border-brand-300"
                  }`}
                >
                  200 - 500
                </button>
                <button
                  type="button"
                  onClick={() => updateFilter({ minGuests: "500", maxGuests: "1000" })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filters.minGuests === "500" && filters.maxGuests === "1000"
                      ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                      : "bg-surface text-ink border-brand-100 hover:border-brand-300"
                  }`}
                >
                  500 - 1000
                </button>
                <button
                  type="button"
                  onClick={() => updateFilter({ minGuests: "1000", maxGuests: "" })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filters.minGuests === "1000" && !filters.maxGuests
                      ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                      : "bg-surface text-ink border-brand-100 hover:border-brand-300"
                  }`}
                >
                  1000+
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="0"
                  value={filters.minGuests}
                  onChange={(e) => updateFilter({ minGuests: e.target.value })}
                  placeholder="Min Guests"
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-brand-200 text-xs"
                />
                <span className="text-xs text-muted">-</span>
                <input
                  type="number"
                  min="0"
                  value={filters.maxGuests}
                  onChange={(e) => updateFilter({ maxGuests: e.target.value })}
                  placeholder="Max Guests"
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-brand-200 text-xs"
                />
              </div>
            </div>

            {/* 3. Room Count Filter */}
            <div className="space-y-2 pt-3 border-t border-brand-50">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                🛏️ Room Count (Stay Rooms)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Any", val: "" },
                  { label: "5+", val: "5" },
                  { label: "10+", val: "10" },
                  { label: "20+", val: "20" },
                  { label: "30+", val: "30" },
                ].map((rm) => (
                  <button
                    key={rm.label}
                    type="button"
                    onClick={() => updateFilter({ minRooms: rm.val })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      filters.minRooms === rm.val
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-surface text-ink border-brand-100 hover:border-brand-300"
                    }`}
                  >
                    {rm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Price per Plate (Food Budget) */}
            <div className="space-y-2 pt-3 border-t border-brand-50">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                🍽️ Price per Plate (Food Budget)
              </label>
              <div className="space-y-1.5">
                {[
                  { label: "Under ₹600 / plate", max: "600" },
                  { label: "Under ₹850 / plate", max: "850" },
                  { label: "Under ₹1,200 / plate", max: "1200" },
                  { label: "Under ₹1,800 / plate", max: "1800" },
                ].map((p) => (
                  <label key={p.max} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="maxPricePerPlate"
                      checked={filters.maxPricePerPlate === p.max}
                      onChange={() => updateFilter({ maxPricePerPlate: p.max })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
                {filters.maxPricePerPlate && (
                  <button
                    type="button"
                    onClick={() => updateFilter({ maxPricePerPlate: "" })}
                    className="text-[11px] text-emerald-700 underline font-semibold mt-1"
                  >
                    Clear food budget
                  </button>
                )}
              </div>
            </div>

            {/* 5. Rental Cost Budget */}
            <div className="space-y-2 pt-3 border-t border-brand-50">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                💰 Venue Rental Cost
              </label>
              <div className="space-y-1.5">
                {[
                  { label: "Under ₹50,000", max: "50000" },
                  { label: "₹50k - ₹1 Lakh", min: "50000", max: "100000" },
                  { label: "₹1 Lakh - ₹2 Lakh", min: "100000", max: "200000" },
                  { label: "Above ₹2 Lakh", min: "200000", max: "" },
                ].map((r, idx) => {
                  const isMatch =
                    (r.min ? filters.minRental === r.min : !filters.minRental) &&
                    (r.max ? filters.maxRental === r.max : !filters.maxRental);
                  return (
                    <label key={idx} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                      <input
                        type="radio"
                        name="rentalRange"
                        checked={isMatch}
                        onChange={() => updateFilter({ minRental: r.min || "", maxRental: r.max || "" })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>{r.label}</span>
                    </label>
                  );
                })}
                {(filters.minRental || filters.maxRental) && (
                  <button
                    type="button"
                    onClick={() => updateFilter({ minRental: "", maxRental: "" })}
                    className="text-[11px] text-amber-700 underline font-semibold mt-1"
                  >
                    Clear rental budget
                  </button>
                )}
              </div>
            </div>

            {/* 6. Space Filter */}
            <div className="space-y-2 pt-3 border-t border-brand-50">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                🏛️ Space Type
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                  <input
                    type="radio"
                    name="spaceRadio"
                    checked={!filters.space}
                    onChange={() => updateFilter({ space: "" })}
                    className="text-brand-600"
                  />
                  <span>All Spaces</span>
                </label>
                {SPACE_FILTER_OPTIONS.map((sp) => (
                  <label key={sp.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="spaceRadio"
                      checked={filters.space === sp.id}
                      onChange={() => updateFilter({ space: sp.id })}
                      className="text-brand-600"
                    />
                    <span>
                      {sp.icon} {sp.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 7. Rating Filter */}
            <div className="space-y-2 pt-3 border-t border-brand-50">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                ⭐ Customer Rating
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "All", val: "" },
                  { label: "4.5+ ★", val: "4.5" },
                  { label: "4.0+ ★", val: "4.0" },
                  { label: "3.5+ ★", val: "3.5" },
                ].map((rt) => (
                  <button
                    key={rt.label}
                    type="button"
                    onClick={() => updateFilter({ minRating: rt.val })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      filters.minRating === rt.val
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-surface text-ink border-brand-100 hover:border-brand-300"
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Features & Facilities Filter */}
            <div className="space-y-2 pt-3 border-t border-brand-50">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                ✨ Catering, Decor & Features
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {FEATURE_FILTER_OPTIONS.map((feat) => {
                  const isChecked = filters.features.includes(feat);
                  return (
                    <label key={feat} className="flex items-start gap-2 text-xs text-ink cursor-pointer leading-snug">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature(feat)}
                        className="rounded text-brand-600 focus:ring-brand-500 mt-0.5"
                      />
                      <span>{feat}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* VENUES LISTINGS AREA */}
          <div className="lg:col-span-3 space-y-5">
            {/* Search Bar & Sorting Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-brand-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">🔍</span>
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) => updateFilter({ q: e.target.value })}
                  placeholder="Search by venue name, locality, city..."
                  className="w-full pl-9 pr-7 py-2 rounded-xl border border-brand-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {filters.q && (
                  <button
                    type="button"
                    onClick={() => updateFilter({ q: "" })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-muted font-medium whitespace-nowrap">Sort by:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter({ sort: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-brand-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="newest">Featured & Newest</option>
                  <option value="priceAsc">Tariff: Low to High</option>
                  <option value="priceDesc">Tariff: High to Low</option>
                  <option value="rating">Top Rated (Stars)</option>
                </select>
              </div>
            </div>

            {/* Venues Grid / Cards */}
            {loading ? (
              <div className="py-28 text-center bg-white rounded-3xl border border-brand-100 shadow-xs">
                <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-brand-600 animate-pulse">
                  Finding wedding venues matching your filters...
                </p>
              </div>
            ) : venues.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-brand-100 p-8 shadow-xs">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="font-serif text-xl font-bold text-ink mb-2">No Matching Venues Found</h3>
                <p className="text-xs sm:text-sm text-muted max-w-md mx-auto mb-6">
                  {hasActiveFilters
                    ? "No wedding venues match all your selected filters (guests, rooms, rental budget, or spaces). Try widening your criteria."
                    : "No wedding venues are listed yet in this section."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {venues.map((venue) => {
                  const coverImage = venue.images?.[0] || "/images/categories/venues.jpg";
                  const guestCap = venue.guestCapacity || venue.capacity || 0;
                  const rental = venue.rentalPrice || venue.price || 0;

                  return (
                    <div
                      key={venue._id}
                      className="group bg-white rounded-3xl overflow-hidden border border-brand-100 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Photo Section */}
                      <Link href={`/venue_details/${venue._id}`} className="block relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={coverImage}
                          alt={venue.title}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/categories/venues.jpg";
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {venue.featured && (
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                            ★ Featured
                          </span>
                        )}

                        <span className="absolute bottom-3 left-3 bg-ink/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                          {venue.venueType || "Banquet Hall"}
                        </span>

                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-amber-700 font-bold text-xs px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                          <span>★</span>
                          <span>{venue.rating?.toFixed ? venue.rating.toFixed(1) : venue.rating || "4.8"}</span>
                          {venue.reviewsCount > 0 && (
                            <span className="text-[10px] text-muted font-normal">({venue.reviewsCount})</span>
                          )}
                        </div>
                      </Link>

                      {/* Content Section */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <Link href={`/venue_details/${venue._id}`}>
                            <h3 className="font-serif font-bold text-base sm:text-lg text-ink line-clamp-1 group-hover:text-brand-600 transition-colors">
                              {venue.title}
                            </h3>
                          </Link>

                          <div className="text-xs text-muted flex items-center gap-1 mt-1 truncate">
                            <span>📍</span>
                            <span className="font-medium text-ink/80 truncate">
                              {venue.locality ? `${venue.locality}, ` : ""}
                              {venue.city}, {venue.state || "Bihar"}
                            </span>
                          </div>

                          {/* Quick Specs: Guests, Rooms, Spaces */}
                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-brand-50">
                            {guestCap > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-brand-50 text-brand-800 px-2 py-0.5 rounded-md border border-brand-100">
                                <span>👥</span> Up to {guestCap} Guests
                              </span>
                            )}

                            {venue.roomCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-100">
                                <span>🛏️</span> {venue.roomCount} Stay Rooms
                              </span>
                            )}

                            {Array.isArray(venue.spaceTypes) &&
                              venue.spaceTypes.slice(0, 2).map((sp) => (
                                <span
                                  key={sp}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-surface text-ink/70 px-2 py-0.5 rounded-md border border-brand-100"
                                >
                                  <span>🏛️</span> {sp}
                                </span>
                              ))}
                          </div>

                          {/* Highlight Features */}
                          {Array.isArray(venue.venueFeatures) && venue.venueFeatures.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {venue.venueFeatures.slice(0, 3).map((feat) => (
                                <span key={feat} className="text-[10px] text-muted bg-brand-50/50 px-2 py-0.5 rounded-md">
                                  ✓ {feat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pricing and Action Buttons */}
                        <div className="pt-3 border-t border-brand-50 flex items-center justify-between gap-2">
                          <div className="leading-tight">
                            {rental > 0 ? (
                              <>
                                <span className="text-[10px] text-muted font-medium block">Rental Tariff</span>
                                <span className="text-base font-bold text-brand-700">
                                  ₹{rental.toLocaleString("en-IN")}
                                  <span className="text-[10px] text-muted font-normal"> / day</span>
                                </span>
                              </>
                            ) : venue.pricePerPlateVeg > 0 ? (
                              <>
                                <span className="text-[10px] text-emerald-700 font-medium block">Food per plate</span>
                                <span className="text-sm font-bold text-emerald-800">
                                  ₹{venue.pricePerPlateVeg}
                                  <span className="text-[10px] text-muted font-normal"> / plate</span>
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                                Price on Request
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {venue.contactPhone && (
                              <a
                                href={`https://wa.me/${venue.contactPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                                  `Hello, I saw ${venue.title} on FlipsAura and would like to inquire about wedding availability and pricing.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-sm hover:bg-emerald-100 transition-colors"
                                title="Chat on WhatsApp"
                              >
                                💬
                              </a>
                            )}
                            <Link
                              href={`/venue_details/${venue._id}`}
                              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors"
                            >
                              View Details →
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
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/60 backdrop-blur-xs lg:hidden">
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-brand-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <h3 className="font-serif font-bold text-lg text-ink">Venue Filters</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-ink flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Mobile Filter Controls */}
              <div className="space-y-5">
                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    📍 City / District
                  </label>
                  <select
                    value={filters.district}
                    onChange={(e) => updateFilter({ district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs bg-white"
                  >
                    <option value="">All Bihar Districts</option>
                    {ALL_BIHAR_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    👥 Guests
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.minGuests}
                      onChange={(e) => updateFilter({ minGuests: e.target.value })}
                      placeholder="Min Guests"
                      className="w-1/2 px-3 py-2 rounded-xl border border-brand-200 text-xs"
                    />
                    <input
                      type="number"
                      value={filters.maxGuests}
                      onChange={(e) => updateFilter({ maxGuests: e.target.value })}
                      placeholder="Max Guests"
                      className="w-1/2 px-3 py-2 rounded-xl border border-brand-200 text-xs"
                    />
                  </div>
                </div>

                {/* Rooms */}
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    🛏️ Rooms Count
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["", "5", "10", "20", "30"].map((rm) => (
                      <button
                        key={rm}
                        type="button"
                        onClick={() => updateFilter({ minRooms: rm })}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          filters.minRooms === rm ? "bg-indigo-600 text-white" : "bg-slate-50 text-ink"
                        }`}
                      >
                        {rm ? `${rm}+` : "Any"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spaces */}
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    🏛️ Space
                  </label>
                  <div className="space-y-1.5">
                    {SPACE_FILTER_OPTIONS.map((sp) => (
                      <label key={sp.id} className="flex items-center gap-2 text-xs text-ink">
                        <input
                          type="radio"
                          name="mobileSpace"
                          checked={filters.space === sp.id}
                          onChange={() => updateFilter({ space: sp.id })}
                          className="text-brand-600"
                        />
                        <span>
                          {sp.icon} {sp.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-100 flex gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="w-1/2 py-2.5 rounded-xl border border-brand-200 text-xs font-bold text-ink"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

