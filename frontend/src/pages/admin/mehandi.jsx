"use client";
import React, { useEffect, useState, useMemo } from "react";
import api from "@/api/axios";
import AdminMehandiFormModal from "@/components/admin/AdminMehandiFormModal";
import AdminMehandiDetailsModal from "@/components/admin/AdminMehandiDetailsModal";

export default function AdminMehandiPage() {
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
      const { data } = await api.get("/api/admin/mehandi");
      if (data?.ok) {
        setItems(data.data.items || []);
        setCities(data.data.cities || []);
        if (data.data.stats) setStats(data.data.stats);
      }
    } catch (err) {
      console.error("Failed to load Mehandi items:", err);
      setLoadError(err.response?.data?.error || err.message || "Failed to load Mehandi listings");
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
      const { data } = await api.delete(`/api/admin/mehandi/${item._id}`);
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

  const handleToggleStatus = async (item) => {
    try {
      const { data } = await api.patch(`/api/admin/mehandi/${item._id}/toggle`);
      if (data?.ok) {
        setActionMsg(data.message || "Status updated");
        setTimeout(() => setActionMsg(""), 2500);
        loadData();
      }
    } catch (err) {
      console.error("Toggle error:", err);
      alert(err.response?.data?.error || err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm">
              🌿
            </span>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-ink">
              Mehndi Artists & Services
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            Manage bridal mehndi artists, intricate designs catalogue, custom options, portfolios, and 4-tier package pricing.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setFormModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer transition-all self-start sm:self-auto shrink-0"
        >
          <span>+ Add Mehndi Artist</span>
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
          <span className="text-[11px] font-bold text-muted uppercase block">Total Artists</span>
          <span className="text-2xl font-serif font-bold text-ink mt-0.5 block">{stats.total}</span>
          <span className="text-[10px] text-muted">All registered artists</span>
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
          <span className="text-2xl font-serif font-bold text-emerald-700 mt-0.5 block">{stats.citiesCount || cities.length}</span>
          <span className="text-[10px] text-muted">Across Bihar & India</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-brand-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by Artist Name, City, Address, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-brand-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-200 text-xs font-medium text-ink bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="px-3 py-2 rounded-xl border border-brand-200 text-xs font-medium text-ink bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm">Loading Mehndi listings...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-emerald-200 text-center">
          <span className="text-4xl block mb-2">🌿</span>
          <h3 className="font-serif font-bold text-lg text-ink">No Mehndi Listings Found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
            {search || selectedCity !== "all" || statusFilter !== "all"
              ? "No artists match your filter criteria. Try resetting filters."
              : "No mehndi listings have been added yet. Click '+ Add Mehndi Artist' to create the first listing."}
          </p>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
          >
            + Add First Mehndi Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const pkg = item.mehandiPackages || {};
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
                <div className="relative aspect-[16/9] bg-emerald-50 overflow-hidden">
                  <img
                    src={item.images?.[0] || "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226360/flipsaura/categories/category_mehndi-services.png"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226360/flipsaura/categories/category_mehndi-services.png";
                    }}
                  />
                  <span
                    className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                      item.active
                        ? "bg-emerald-600 text-white"
                        : "bg-ink/70 text-white"
                    }`}
                  >
                    {item.active ? "● Live" : "○ Inactive"}
                  </span>

                  {item.featured && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-ink shadow-xs">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-ink line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <span>📍</span>
                      <span className="truncate">{item.locality ? `${item.locality}, ` : ""}{item.city || "Bihar"}</span>
                    </p>

                    {/* Subcategories tags count */}
                    {item.subcategories?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          🌿 {item.subcategories.length} Design & Service Options
                        </span>
                      </div>
                    )}

                    {/* Packages pill row */}
                    <div className="flex items-center gap-1 mt-2.5">
                      <span className="text-[10px] font-bold text-muted uppercase mr-1">Tiers:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasBasic ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-400"}`}>
                        Basic
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasStd ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-400"}`}>
                        Std
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasPrem ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-gray-100 text-gray-400"}`}>
                        Prem
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${hasLux ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-400"}`}>
                        Lux
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-2.5 pt-2 border-t border-line text-xs space-y-1">
                      <div className="flex items-center justify-between text-muted">
                        <span>📞 Phone:</span>
                        <span className="font-semibold text-ink">{item.contactPhone || item.vendor?.phone || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted">
                        <span>💰 Starting Tariff:</span>
                        <span className="font-bold text-wine">
                          {item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "Price on Request"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition ${
                        item.active
                          ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                          : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      {item.active ? "Pause" : "Activate"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setDetailsItem(item);
                          setDetailsModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink rounded-lg hover:bg-surface transition"
                        title="View Full Details"
                      >
                        View
                      </button>

                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setFormModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        title="Edit Listing"
                      >
                        Edit ✏️
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1 text-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Listing"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <AdminMehandiFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        onSaved={() => {
          loadData();
          setActionMsg(editingItem ? "Mehandi listing updated!" : "Mehandi listing created!");
          setTimeout(() => setActionMsg(""), 3500);
        }}
      />

      {/* Details Modal */}
      <AdminMehandiDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setDetailsItem(null);
        }}
        item={detailsItem}
        onEdit={(itemToEdit) => {
          setDetailsModalOpen(false);
          setEditingItem(itemToEdit);
          setFormModalOpen(true);
        }}
      />
    </div>
  );
}

