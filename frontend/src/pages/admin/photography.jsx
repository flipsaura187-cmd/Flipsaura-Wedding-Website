"use client";
import React, { useEffect, useState, useMemo } from "react";
import api from "@/api/axios";
import AdminPhotographyFormModal from "@/components/admin/AdminPhotographyFormModal";
import AdminPhotographyDetailsModal from "@/components/admin/AdminPhotographyDetailsModal";

export default function AdminPhotographyPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, withPackages: 0, citiesCount: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);

  const [actionMsg, setActionMsg] = useState("");
  const [loadError, setLoadError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const { data } = await api.get("/api/admin/photography");
      if (data?.ok) {
        setItems(data.data.items || []);
        setCities(data.data.cities || []);
        if (data.data.stats) setStats(data.data.stats);
      }
    } catch (err) {
      console.error("Failed to load photography items:", err);
      setLoadError(err.response?.data?.error || err.message || "Failed to load photography listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCity !== "all" && (item.city || "").toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (statusFilter === "active" && !item.active) return false;
      if (statusFilter === "inactive" && item.active) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const cityMatch = (item.city || "").toLowerCase().includes(q);
        const addrMatch = (item.address || "").toLowerCase().includes(q);
        const phoneMatch = (item.contactPhone || item.vendor?.phone || "").toLowerCase().includes(q);
        if (!titleMatch && !cityMatch && !addrMatch && !phoneMatch) return false;
      }
      return true;
    });
  }, [items, selectedCity, statusFilter, search]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      const { data } = await api.delete(`/api/admin/photography/${item._id}`);
      if (data?.ok) {
        setActionMsg(`"${item.title}" deleted successfully!`);
        setTimeout(() => setActionMsg(""), 3500);
        loadData();
      } else {
        alert(data?.error || "Failed to delete item");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.error || err.message || "Failed to delete item");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-lg shadow-sm">
              📷
            </span>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-ink">
              Photography & Cinematography
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            Manage wedding photographers, studios, portfolio galleries, sample albums, videos, and 4-tier package pricing.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setFormModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-600/20 cursor-pointer transition-all self-start sm:self-auto shrink-0"
        >
          <span>+ Add Photography</span>
        </button>
      </div>

      {/* Notifications */}
      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>{actionMsg}</span>
        </div>
      )}
      {loadError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{loadError}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-brand-100 shadow-xs">
          <span className="text-[11px] font-bold text-muted uppercase block">Total Studios</span>
          <span className="text-2xl font-serif font-bold text-ink mt-0.5 block">{stats.total}</span>
          <span className="text-[10px] text-muted">All registered studios</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Active Listings</span>
          <span className="text-2xl font-serif font-bold text-emerald-700 mt-0.5 block">{stats.active}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Visible to customers</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 uppercase block">With Packages</span>
          <span className="text-2xl font-serif font-bold text-purple-700 mt-0.5 block">{stats.withPackages}</span>
          <span className="text-[10px] text-purple-600 font-medium">Basic / Std / Prem / Lux</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-brand-100 shadow-xs">
          <span className="text-[11px] font-bold text-muted uppercase block">Covered Cities</span>
          <span className="text-2xl font-serif font-bold text-brand-700 mt-0.5 block">{stats.citiesCount || cities.length}</span>
          <span className="text-[10px] text-muted">Across Bihar & India</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-brand-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by Studio Name, City, Address, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-brand-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-200 text-xs font-medium text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Cities ({cities.length})</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-200 text-xs font-medium text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Listings List */}
      {loading ? (
        <div className="py-20 text-center text-muted">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm">Loading photography listings...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-brand-200 text-center">
          <span className="text-4xl block mb-2">📸</span>
          <h3 className="font-serif font-bold text-lg text-ink">No Photography Listings Found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
            {search || selectedCity !== "all" || statusFilter !== "all"
              ? "No studios match your filter criteria. Try resetting filters."
              : "No photography listings have been added yet. Click '+ Add Photography' to create the first listing."}
          </p>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 cursor-pointer shadow-xs"
          >
            + Add First Photography Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const pkg = item.photographyPackages || {};
            const hasBasic = pkg.basic?.price > 0;
            const hasStd = pkg.standard?.price > 0;
            const hasPrem = pkg.premium?.price > 0;
            const hasLux = pkg.luxury?.price > 0;

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-brand-100 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Image Banner */}
                <div className="relative aspect-[16/9] bg-brand-50 overflow-hidden">
                  <img
                    src={item.images?.[0] || "/images/categories/photography.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/categories/photography.jpg";
                    }}
                  />
                  <span
                    className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                      item.active
                        ? "bg-emerald-600 text-white"
                        : "bg-ink/70 text-white"
                    }`}
                  >
                    {item.active ? "Active" : "Inactive"}
                  </span>
                  {item.featured && (
                    <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase">
                      Featured
                    </span>
                  )}
                  {item.images?.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                      📸 {item.images.length} photos
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-ink line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {item.title}
                    </h3>

                    <div className="text-xs text-muted flex items-center gap-1.5 mt-1 truncate">
                      <span>📍</span>
                      <span className="truncate">
                        {item.address || `${item.locality ? `${item.locality}, ` : ""}${item.city}, ${item.state || "Bihar"}`}
                      </span>
                    </div>

                    {item.contactPhone && (
                      <div className="text-xs text-ink/80 flex items-center gap-1.5 mt-1 font-medium">
                        <span>📞</span>
                        <span>{item.contactPhone}</span>
                      </div>
                    )}

                    {item.about && (
                      <p className="text-xs text-muted line-clamp-2 mt-2 leading-relaxed">
                        {item.about}
                      </p>
                    )}
                  </div>

                  {/* Package Pills */}
                  <div className="pt-2 border-t border-brand-50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted font-medium">Starting Tariff:</span>
                      <span className="font-bold text-brand-700 text-sm">
                        {item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "Price on Request"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${hasBasic ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-400 border-gray-200 line-through"}`}>
                        Basic
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${hasStd ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-200 line-through"}`}>
                        Standard
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${hasPrem ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-gray-50 text-gray-400 border-gray-200 line-through"}`}>
                        Premium
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${hasLux ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-gray-50 text-gray-400 border-gray-200 line-through"}`}>
                        Luxury
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-brand-50 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsItem(item);
                        setDetailsModalOpen(true);
                      }}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                    >
                      View Details
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setFormModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-brand-200 text-ink/80 hover:text-brand-600 hover:bg-brand-50 transition-colors text-xs font-semibold cursor-pointer"
                        title="Edit Listing"
                      >
                        ✎ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold cursor-pointer"
                        title="Delete Listing"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AdminPhotographyFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        onSaved={() => {
          loadData();
        }}
      />

      <AdminPhotographyDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setDetailsItem(null);
        }}
        item={detailsItem}
        onEdit={(item) => {
          setDetailsItem(null);
          setEditingItem(item);
          setFormModalOpen(true);
        }}
      />
    </div>
  );
}

