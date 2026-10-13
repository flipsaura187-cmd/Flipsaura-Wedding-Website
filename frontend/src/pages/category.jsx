"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "@/compat/navigation";
import ItemCard from "@/components/ItemCard";
import Pagination from "@/components/Pagination";

import api from "@/api/axios";
export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const sp = useSearchParams();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(parseInt(sp.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: sp.get("q") || "",
    city: sp.get("city") || "",
    minPrice: sp.get("minPrice") || "",
    maxPrice: sp.get("maxPrice") || "",
    sort: sp.get("sort") || "newest",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ category: slug, page: String(page), limit: "12" });
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const { data: j } = await api.get(`/api/items?${params}`);
    if (j.ok) {
      setItems(j.data.items);
      setTotalPages(j.data.totalPages || 1);
    }
    setLoading(false);
  }, [slug, page, filters]);

  useEffect(() => { load(); }, [load]);

  const apply = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <section className="py-12 md:py-16 bg-white min-h-[70vh]">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1.5 block">
            Category
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink capitalize">
            {String(slug).replace(/-/g, " ")}
          </h1>
        </div>

        <form
          className="bg-brand-50/70 p-4 rounded-2xl border border-brand-100 mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3"
          onSubmit={apply}
        >
          <input
            className="px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Search…"
            value={filters.q}
            onChange={e => setFilters({ ...filters, q: e.target.value })}
          />
          <input
            className="px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="City"
            value={filters.city}
            onChange={e => setFilters({ ...filters, city: e.target.value })}
          />
          <input
            className="px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Min ₹"
            type="number"
            value={filters.minPrice}
            onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
          />
          <input
            className="px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Max ₹"
            type="number"
            value={filters.maxPrice}
            onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
          />
          <select
            className="px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={filters.sort}
            onChange={e => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <button
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            type="submit"
          >
            Apply
          </button>
        </form>

        {loading ? (
          <div className="py-20 text-center text-brand-600 font-semibold animate-pulse">
            Loading items…
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-brand-50/50 rounded-2xl border border-brand-100 text-muted">
            No items match your filters in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(it => <ItemCard key={it._id} item={it} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </section>
  );
}

