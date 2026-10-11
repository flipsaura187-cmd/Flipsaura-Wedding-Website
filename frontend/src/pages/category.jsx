"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "@/compat/navigation";
import Link from "@/compat/Link";
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

  const isTransport = String(slug).includes("transport") || String(slug).includes("car");

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Category</span>
            <h2 style={{ textTransform: "capitalize" }}>{String(slug).replace(/-/g, " ")}</h2>
          </div>
        </div>

        {isTransport && (
          <div
            style={{
              background: "linear-gradient(135deg, #FDF2F4 0%, #F5EEF0 100%)",
              border: "1px solid #FBCFE8",
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>🚗</span>
                <b style={{ color: "var(--pink-700, #8B1E3F)", fontSize: 16 }}>
                  FlipsAura Dedicated Vehicle Rentals & Transport Fleet
                </b>
              </div>
              <p style={{ margin: 0, color: "#4B5563", fontSize: 13 }}>
                Reserve self-drive luxury cars, 4x4 Thar, decorative autos, or book chauffeur-driven Barat coaches and buses with real-time pricing and availability checks.
              </p>
            </div>

            <Link
              href="/vehicles"
              to="/vehicles"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: "9px 18px", whiteSpace: "nowrap" }}
            >
              Explore Vehicles Fleet →
            </Link>
          </div>
        )}

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
