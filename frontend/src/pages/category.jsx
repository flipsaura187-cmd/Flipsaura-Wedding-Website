"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "@/compat/navigation";
import ItemCard from "@/components/ItemCard";
import Pagination from "@/components/Pagination";
import api from "@/api/axios";

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

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const sp = useSearchParams();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(parseInt(sp.get("page") || "1", 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [warningMessage, setWarningMessage] = useState("");

  const [filterMeta, setFilterMeta] = useState({
    pricingUnit: { unit: "per booking", label: "₹ / booking", short: "booking" },
    priceBounds: { min: 0, max: 100000 },
    states: [],
  });

  const [filters, setFilters] = useState({
    q: sp.get("q") || "",
    district: sp.get("district") || sp.get("city") || "",
    minPrice: sp.get("minPrice") || "",
    maxPrice: sp.get("maxPrice") || "",
    sort: sp.get("sort") || "newest",
  });

  // Fetch dynamic category-specific filter metadata (pricing unit, states & districts)
  useEffect(() => {
    let active = true;
    async function fetchFilterMeta() {
      try {
        const { data: res } = await api.get(`/api/items/filter-options?category=${slug}`);
        if (active && res?.ok && res.data) {
          setFilterMeta(res.data);
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    }
    fetchFilterMeta();
    return () => {
      active = false;
    };
  }, [slug]);

  // Derive districts for Bihar with dynamic counts
  const biharDistricts = useMemo(() => {
    const biharState = filterMeta.states?.find(
      (s) => s.name?.toLowerCase() === "bihar"
    );
    const apiDistricts = biharState?.districts || [];
    const countMap = new Map();
    for (const d of apiDistricts) {
      if (d.name) countMap.set(d.name.toLowerCase(), d.count || 0);
    }

    return ALL_BIHAR_DISTRICTS.map((name) => {
      const count = countMap.get(name.toLowerCase()) || 0;
      return {
        name,
        count,
        hasItems: count > 0,
      };
    }).sort((a, b) => {
      if (a.hasItems && !b.hasItems) return -1;
      if (!a.hasItems && b.hasItems) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filterMeta.states]);

  const load = useCallback(async () => {
    setLoading(true);
    setWarningMessage("");
    const params = new URLSearchParams({
      category: slug,
      page: String(page),
      limit: "12",
    });

    if (filters.q?.trim()) params.set("q", filters.q.trim());
    if (filters.district?.trim()) params.set("district", filters.district.trim());
    if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
    if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
    if (filters.sort) params.set("sort", filters.sort);

    try {
      const { data: j } = await api.get(`/api/items?${params.toString()}`);
      if (j.ok) {
        setItems(j.data.items || []);
        setTotalPages(j.data.totalPages || 1);
        setTotalCount(j.data.total ?? j.data.items?.length ?? 0);
        if (j.data.warning) setWarningMessage(j.data.warning);
      }
    } catch (err) {
      console.error("Failed to load category items", err);
    } finally {
      setLoading(false);
    }
  }, [slug, page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      const nextParams = new URLSearchParams();
      if (next.q?.trim()) nextParams.set("q", next.q.trim());
      if (next.district?.trim()) nextParams.set("district", next.district.trim());
      if (next.minPrice !== "") nextParams.set("minPrice", next.minPrice);
      if (next.maxPrice !== "") nextParams.set("maxPrice", next.maxPrice);
      if (next.sort && next.sort !== "newest") nextParams.set("sort", next.sort);

      const queryStr = nextParams.toString();
      router.replace(`/categories/${slug}${queryStr ? `?${queryStr}` : ""}`);
      return next;
    });
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      district: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
    setPage(1);
    router.replace(`/categories/${slug}`);
  };

  const removeFilter = (key) => {
    updateFilter({ [key]: key === "sort" ? "newest" : "" });
  };

  const hasActiveFilters = Boolean(
    filters.q ||
    filters.district ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.sort && filters.sort !== "newest")
  );

  const priceInvalid =
    filters.minPrice !== "" &&
    filters.maxPrice !== "" &&
    Number(filters.minPrice) > Number(filters.maxPrice);

  const unitLabel = filterMeta.pricingUnit?.label || "₹";
  const unitShort = filterMeta.pricingUnit?.short || "unit";

  return (
    <section className="py-10 md:py-14 bg-white min-h-[70vh]">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        {/* Category Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1.5 block">
              Category
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink capitalize">
              {String(slug).replace(/-/g, " ")}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full border border-brand-200">
              Pricing: <b>{unitLabel}</b>
            </span>
            <span className="text-xs text-muted font-medium">
              {totalCount} {totalCount === 1 ? "listing" : "listings"} available
            </span>
          </div>
        </div>

        {/* Horizontal Scrollable Filter Bar (Airbnb / MakeMyTrip style) */}
        <form
          className="bg-brand-50/70 p-3 sm:p-4 rounded-2xl border border-brand-100 mb-6 shadow-xs relative"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Mobile swipe hint banner */}
          <div className="flex md:hidden items-center justify-between text-[11px] text-brand-600/80 mb-2 px-1">
            <span className="flex items-center gap-1 font-semibold">
              <span>⚡</span> Filters
            </span>
            <span className="text-[10px] text-muted flex items-center gap-1 font-medium bg-white/80 px-2 py-0.5 rounded-full border border-brand-100">
              Swipe horizontally ⇄
            </span>
          </div>

          <div className="flex items-end gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scroll-smooth touch-pan-x overscroll-x-contain">
            {/* Search by Name */}
            <div className="shrink-0 w-48 sm:w-60 flex flex-col">
              <label className="text-[10px] sm:text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 px-0.5 flex items-center gap-1">
                <span>🔍</span> {slug === "hotels" ? "Search Hotel Name" : "Search Name"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2 pr-7 rounded-xl border border-brand-200 bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted/60 shadow-xs"
                  placeholder={slug === "hotels" ? "e.g. Sky View, Imperial..." : "Search keyword..."}
                  value={filters.q}
                  onChange={(e) => updateFilter({ q: e.target.value })}
                />
                {filters.q && (
                  <button
                    type="button"
                    onClick={() => updateFilter({ q: "" })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs p-0.5"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Bihar Districts Filter */}
            <div className="shrink-0 w-48 sm:w-52 flex flex-col">
              <label className="text-[10px] sm:text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 px-0.5 flex items-center gap-1">
                <span>📍</span> District (Bihar)
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs truncate"
                value={filters.district}
                onChange={(e) => updateFilter({ district: e.target.value })}
              >
                <option value="">All Bihar Districts</option>
                {biharDistricts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} {d.count > 0 ? `(${d.count})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div className="shrink-0 w-32 sm:w-36 flex flex-col">
              <label className="text-[10px] sm:text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 px-0.5">
                Min Price
              </label>
              <input
                type="number"
                min="0"
                step="100"
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted/60 shadow-xs"
                placeholder={`Min ₹ (${unitShort})`}
                value={filters.minPrice}
                onChange={(e) => updateFilter({ minPrice: e.target.value })}
              />
            </div>

            {/* Max Price */}
            <div className="shrink-0 w-32 sm:w-36 flex flex-col">
              <label className="text-[10px] sm:text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 px-0.5">
                Max Price
              </label>
              <input
                type="number"
                min="0"
                step="100"
                className={`w-full px-3 py-2 rounded-xl border bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted/60 shadow-xs ${
                  priceInvalid ? "border-amber-400 focus:ring-amber-400" : "border-brand-200"
                }`}
                placeholder={`Max ₹ (${unitShort})`}
                value={filters.maxPrice}
                onChange={(e) => updateFilter({ maxPrice: e.target.value })}
              />
            </div>

            {/* Sort By */}
            <div className="shrink-0 w-36 sm:w-40 flex flex-col">
              <label className="text-[10px] sm:text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 px-0.5">
                Sort By
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
                value={filters.sort}
                onChange={(e) => updateFilter({ sort: e.target.value })}
              >
                <option value="newest">Newest First</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* Reset Button (when active) */}
            {hasActiveFilters && (
              <div className="shrink-0 flex items-center pb-0.5">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3.5 py-2 rounded-xl border border-brand-200 hover:bg-brand-100/60 bg-white text-ink text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <span>↺</span> Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Validation Warnings */}
          {(priceInvalid || warningMessage) && (
            <div className="mt-2.5 pt-2 border-t border-brand-100/70 flex items-center">
              {priceInvalid && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                  ⚠️ Minimum price cannot be greater than maximum price
                </span>
              )}
              {warningMessage && !priceInvalid && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                  ⚠️ {warningMessage}
                </span>
              )}
            </div>
          )}
        </form>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted mr-1">Active filters:</span>

            {filters.q && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                Keyword: "{filters.q}"
                <button
                  type="button"
                  onClick={() => removeFilter("q")}
                  className="hover:text-red-600 ml-0.5 text-sm leading-none cursor-pointer"
                  title="Remove search"
                >
                  ×
                </button>
              </span>
            )}

            {filters.district && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                District: {filters.district}
                <button
                  type="button"
                  onClick={() => removeFilter("district")}
                  className="hover:text-red-600 ml-0.5 text-sm leading-none cursor-pointer"
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}

            {(filters.minPrice !== "" || filters.maxPrice !== "") && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                Price: {filters.minPrice ? `₹${Number(filters.minPrice).toLocaleString("en-IN")}` : "₹0"}
                {" – "}
                {filters.maxPrice ? `₹${Number(filters.maxPrice).toLocaleString("en-IN")}` : "Any"}
                {" "}({unitShort})
                <button
                  type="button"
                  onClick={() => {
                    removeFilter("minPrice");
                    removeFilter("maxPrice");
                  }}
                  className="hover:text-red-600 ml-0.5 text-sm leading-none cursor-pointer"
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.sort && filters.sort !== "newest" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                Sort: {filters.sort === "priceAsc" ? "Price Low-High" : filters.sort === "priceDesc" ? "Price High-Low" : "Top Rated"}
                <button
                  type="button"
                  onClick={() => removeFilter("sort")}
                  className="hover:text-red-600 ml-0.5 text-sm leading-none cursor-pointer"
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Listings Grid or Empty State */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-200 border-t-brand-600 mb-3" />
            <p className="text-sm font-semibold text-brand-600 animate-pulse">
              Finding matching listings…
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 md:p-14 text-center bg-brand-50/40 rounded-2xl border border-brand-100 max-w-2xl mx-auto my-6">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-serif text-xl font-bold text-ink mb-2">
              No matching listings found
            </h3>
            <p className="text-sm text-muted mb-6">
              {priceInvalid
                ? "Your minimum price is greater than your maximum price. Please adjust your price bounds."
                : hasActiveFilters
                ? "No listings match your selected state, district, or price criteria in this category. Try broadening your filters."
                : "There are currently no active listings available in this category."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((it) => (
              <ItemCard key={it._id} item={it} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </section>
  );
}


