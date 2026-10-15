"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "@/compat/navigation";
import ItemCard from "@/components/ItemCard";
import Pagination from "@/components/Pagination";
import api from "@/api/axios";

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
    state: sp.get("state") || "",
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

  // Derive districts for currently selected state
  const currentDistricts = useMemo(() => {
    if (!filters.state) return [];
    const foundState = filterMeta.states.find(
      (s) => s.name.toLowerCase() === filters.state.toLowerCase()
    );
    return foundState?.districts || [];
  }, [filters.state, filterMeta.states]);

  // Handle State Change: reset district if it doesn't belong to the newly selected state
  const handleStateChange = (newState) => {
    setFilters((prev) => {
      let nextDistrict = prev.district;
      if (newState) {
        const targetState = filterMeta.states.find(
          (s) => s.name.toLowerCase() === newState.toLowerCase()
        );
        const hasCurrentDistrict = targetState?.districts?.some(
          (d) => d.name.toLowerCase() === (prev.district || "").toLowerCase()
        );
        if (!hasCurrentDistrict) {
          nextDistrict = "";
        }
      } else {
        nextDistrict = "";
      }
      return {
        ...prev,
        state: newState,
        district: nextDistrict,
      };
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setWarningMessage("");
    const params = new URLSearchParams({
      category: slug,
      page: String(page),
      limit: "12",
    });

    if (filters.q?.trim()) params.set("q", filters.q.trim());
    if (filters.state?.trim()) params.set("state", filters.state.trim());
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

  const apply = (e) => {
    if (e) e.preventDefault();
    setPage(1);

    // Sync to URL
    const nextParams = new URLSearchParams();
    if (filters.q?.trim()) nextParams.set("q", filters.q.trim());
    if (filters.state?.trim()) nextParams.set("state", filters.state.trim());
    if (filters.district?.trim()) nextParams.set("district", filters.district.trim());
    if (filters.minPrice !== "") nextParams.set("minPrice", filters.minPrice);
    if (filters.maxPrice !== "") nextParams.set("maxPrice", filters.maxPrice);
    if (filters.sort && filters.sort !== "newest") nextParams.set("sort", filters.sort);

    const queryStr = nextParams.toString();
    router.replace(`/categories/${slug}${queryStr ? `?${queryStr}` : ""}`);
    load();
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      state: "",
      district: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
    setPage(1);
    router.replace(`/categories/${slug}`);
  };

  const removeFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: key === "sort" ? "newest" : "" };
      if (key === "state") next.district = "";
      return next;
    });
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.q ||
    filters.state ||
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

        {/* Filter Card */}
        <form
          className="bg-brand-50/70 p-4 sm:p-5 rounded-2xl border border-brand-100 mb-6 shadow-xs"
          onSubmit={apply}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-ink/70 uppercase tracking-wider mb-1">
                Keyword
              </label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted/60"
                placeholder="Search name, hotel, service…"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>

            {/* State Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-ink/70 uppercase tracking-wider mb-1">
                State
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                value={filters.state}
                onChange={(e) => handleStateChange(e.target.value)}
              >
                <option value="">All States</option>
                {filterMeta.states.map((st) => (
                  <option key={st.name} value={st.name}>
                    {st.name} {st.count > 0 ? `(${st.count})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* District / City Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-ink/70 uppercase tracking-wider mb-1">
                District / City
              </label>
              <select
                disabled={!filters.state}
                className={`w-full px-3 py-2 rounded-xl border border-brand-200 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer ${
                  !filters.state ? "bg-brand-100/40 opacity-70 cursor-not-allowed" : "bg-white"
                }`}
                value={filters.district}
                onChange={(e) => setFilters({ ...filters, district: e.target.value })}
              >
                <option value="">
                  {!filters.state ? "Select State first" : `All ${filters.state} Districts`}
                </option>
                {currentDistricts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} {d.count > 0 ? `(${d.count})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-ink/70 uppercase tracking-wider mb-1">
                Min Price
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted/60"
                  placeholder={`Min ₹ (${unitShort})`}
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
              </div>
            </div>

            {/* Max Price */}
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-ink/70 uppercase tracking-wider mb-1">
                Max Price
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted/60 ${
                    priceInvalid ? "border-amber-400 focus:ring-amber-400" : "border-brand-200"
                  }`}
                  placeholder={`Max ₹ (${unitShort})`}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>
            </div>

            {/* Sort & Actions */}
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-ink/70 uppercase tracking-wider mb-1">
                Sort By
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              >
                <option value="newest">Newest First</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Form Action Buttons & Invalidation Warning */}
          <div className="mt-4 pt-3 border-t border-brand-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-2 ml-auto">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl border border-brand-200 hover:bg-brand-100/50 text-ink text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
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
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.state && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium">
                State: {filters.state}
                <button
                  type="button"
                  onClick={() => removeFilter("state")}
                  className="hover:text-red-600 ml-0.5 text-sm leading-none cursor-pointer"
                  title="Remove filter"
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


