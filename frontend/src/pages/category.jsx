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
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Category</span>
            <h2 style={{ textTransform: "capitalize" }}>{String(slug).replace(/-/g, " ")}</h2>
          </div>
        </div>

        <form className="filters" onSubmit={apply}>
          <input placeholder="Search…" value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })} />
          <input placeholder="City" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} />
          <input placeholder="Min ₹" type="number" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
          <input placeholder="Max ₹" type="number" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
          <select value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="priceAsc">Price ↑</option>
            <option value="priceDesc">Price ↓</option>
            <option value="rating">Top rated</option>
          </select>
          <button className="btn btn-primary" type="submit">Apply</button>
        </form>

        {loading ? (
          <div className="loading">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty">No items match your filters.</div>
        ) : (
          <div className="grid grid-4">
            {items.map(it => <ItemCard key={it._id} item={it} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </section>
  );
}
