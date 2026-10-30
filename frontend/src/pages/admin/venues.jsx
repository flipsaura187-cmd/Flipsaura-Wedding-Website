"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";
import AdminVenueFormModal, { VENUE_PRIMARY_CATEGORIES } from "@/components/admin/AdminVenueFormModal";
import AdminVenueDetailsModal from "@/components/admin/AdminVenueDetailsModal";

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeTab, setSelectedTypeTab] = useState("all");

  // Filters
  const [searchVenue, setSearchVenue] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  // In-page Details Modal
  const [detailsVenue, setDetailsVenue] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [actionMsg, setActionMsg] = useState("");
  const [loadError, setLoadError] = useState("");

  const loadVenues = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const { data } = await api.get("/api/admin/venues");
      if (data?.ok) {
        setVenues(data.data.venues || []);
      }
    } catch (err) {
      console.error("Failed to load admin venues:", err);
      const msg = err.response?.data?.error || err.message || "Failed to load admin venues";
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  // Compute unique cities
  const cityList = useMemo(() => {
    const set = new Set();
    venues.forEach((v) => {
      if (v.city?.trim()) set.add(v.city.trim());
    });
    return Array.from(set).sort();
  }, [venues]);

  // Aggregate Category Stats
  const stats = useMemo(() => {
    let banquets = 0;
    let lawns = 0;
    let resorts = 0;
    let partyHalls = 0;

    venues.forEach((v) => {
      const vt = (v.venueType || "").toLowerCase();
      if (vt.includes("banquet")) banquets++;
      else if (vt.includes("lawn") || vt.includes("garden")) lawns++;
      else if (vt.includes("resort")) resorts++;
      else if (vt.includes("party") || vt.includes("small") || vt.includes("function")) partyHalls++;
      else banquets++;
    });

    return {
      total: venues.length,
      banquets,
      lawns,
      resorts,
      partyHalls,
    };
  }, [venues]);

  // Filtered Venues
  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      // Category tab filter
      if (selectedTypeTab !== "all") {
        const vt = (v.venueType || "").toLowerCase();
        if (selectedTypeTab === "banquet" && !vt.includes("banquet")) return false;
        if (selectedTypeTab === "lawn" && (!vt.includes("lawn") && !vt.includes("garden"))) return false;
        if (selectedTypeTab === "resort" && !vt.includes("resort")) return false;
        if (selectedTypeTab === "party" && (!vt.includes("party") && !vt.includes("small") && !vt.includes("function"))) return false;
      }

      // City filter
      if (selectedCity !== "all" && (v.city || "").toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Search keyword
      if (searchVenue.trim()) {
        const q = searchVenue.toLowerCase();
        const titleMatch = (v.title || "").toLowerCase().includes(q);
        const cityMatch = (v.city || "").toLowerCase().includes(q);
        const localityMatch = (v.locality || "").toLowerCase().includes(q);
        const vendorMatch = (v.vendorName || "").toLowerCase().includes(q);
        const phoneMatch = (v.contactPhone || v.vendorContact || "").toLowerCase().includes(q);
        const typeMatch = (v.venueType || "").toLowerCase().includes(q);
        if (!titleMatch && !cityMatch && !localityMatch && !vendorMatch && !phoneMatch && !typeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [venues, selectedTypeTab, selectedCity, searchVenue]);

  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingVenue(null);
    setModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete venue "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      const { data } = await api.delete(`/api/admin/venues/${id}`);
      if (data?.ok) {
        setActionMsg(`Venue "${title}" deleted successfully.`);
        setTimeout(() => setActionMsg(""), 4000);
        loadVenues();
      } else {
        alert(data?.error || "Failed to delete venue");
      }
    } catch (err) {
      console.error("Delete venue error:", err);
      alert(err.response?.data?.error || err.message || "Failed to delete venue");
    }
  };

  const handleToggleActive = async (venue) => {
    try {
      const nextActive = !venue.active;
      const { data } = await api.put(`/api/admin/venues/${venue._id}`, { active: nextActive });
      if (data?.ok) {
        setVenues((prev) =>
          prev.map((v) => (v._id === venue._id ? { ...v, active: nextActive } : v))
        );
        setActionMsg(`Venue marked as ${nextActive ? "Active" : "Inactive"}.`);
        setTimeout(() => setActionMsg(""), 3000);
      }
    } catch (err) {
      console.error("Toggle active error:", err);
      alert(err.response?.data?.error || err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-brand-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🏛️</span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Venue Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Add & manage wedding venues, banquet halls, marriage lawns, resorts, rental tariffs, guest capacities, and event services.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-sm shadow-md shadow-brand-600/25 transition-all cursor-pointer shrink-0"
        >
          <span>+ Add Venue (Manual Entry)</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <span>✓ {actionMsg}</span>
          <button type="button" onClick={() => setActionMsg("")} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center justify-between">
          <span>⚠️ {loadError}</span>
          <button type="button" onClick={loadVenues} className="underline text-xs ml-2 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏛️</span>
            <span className="text-xs text-muted font-medium">Total Venues</span>
          </div>
          <p className="text-2xl font-bold text-ink">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏢</span>
            <span className="text-xs text-muted font-medium">Banquet Halls</span>
          </div>
          <p className="text-2xl font-bold text-brand-700">{stats.banquets}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🌿</span>
            <span className="text-xs text-muted font-medium">Marriage Lawns</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.lawns}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏰</span>
            <span className="text-xs text-muted font-medium">Wedding Resorts</span>
          </div>
          <p className="text-2xl font-bold text-indigo-700">{stats.resorts}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🎉</span>
            <span className="text-xs text-muted font-medium">Party Halls</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.partyHalls}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📍</span>
            <span className="text-xs text-muted font-medium">Cities / Districts</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{cityList.length}</p>
        </div>
      </div>

      {/* Category Pills / Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-brand-100">
        <button
          type="button"
          onClick={() => setSelectedTypeTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTypeTab === "all"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-ink/70 hover:bg-brand-50"
          }`}
        >
          All Venues ({venues.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTypeTab("banquet")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTypeTab === "banquet"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-ink/70 hover:bg-brand-50"
          }`}
        >
          🏛️ Banquet Halls ({stats.banquets})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTypeTab("lawn")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTypeTab === "lawn"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-ink/70 hover:bg-brand-50"
          }`}
        >
          🌿 Marriage Garden / Lawns ({stats.lawns})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTypeTab("resort")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTypeTab === "resort"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-ink/70 hover:bg-brand-50"
          }`}
        >
          🏰 Wedding Resorts ({stats.resorts})
        </button>

        <button
          type="button"
          onClick={() => setSelectedTypeTab("party")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTypeTab === "party"
              ? "bg-brand-600 text-white shadow-xs"
              : "text-ink/70 hover:bg-brand-50"
          }`}
        >
          🎉 Small Function / Party Halls ({stats.partyHalls})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-brand-100 shadow-2xs">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            type="text"
            value={searchVenue}
            onChange={(e) => setSearchVenue(e.target.value)}
            placeholder="Search venues by name, locality, city, vendor name, or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {searchVenue && (
            <button
              type="button"
              onClick={() => setSearchVenue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-ink whitespace-nowrap">City:</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full sm:w-48 px-3 py-2.5 rounded-xl border border-brand-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="all">All Cities ({cityList.length})</option>
            {cityList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Venues Grid / List */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-brand-100">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-brand-600">Loading wedding venues...</p>
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-brand-100 p-8">
          <div className="text-4xl mb-3">🏛️</div>
          <h3 className="font-serif text-xl font-bold text-ink mb-1.5">No Venues Found</h3>
          <p className="text-xs text-muted max-w-md mx-auto mb-6">
            {searchVenue || selectedCity !== "all" || selectedTypeTab !== "all"
              ? "No venues match the current search or filters. Try adjusting your query or resetting filters."
              : "No wedding venues have been added yet. Click '+ Add Venue' to create your first venue listing."}
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            + Add First Venue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredVenues.map((v) => {
            const coverImage = v.images?.[0] || "/images/categories/venues.jpg";
            const guestCap = v.guestCapacity || v.capacity || 0;
            const rental = v.rentalPrice || v.price || 0;

            return (
              <div
                key={v._id}
                className="bg-white rounded-3xl border border-brand-100 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-40 sm:h-36 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-brand-100">
                    <img
                      src={coverImage}
                      alt={v.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/categories/venues.jpg";
                      }}
                    />
                    {v.featured && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        ★ Featured
                      </span>
                    )}
                    <span
                      className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                        v.active ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"
                      }`}
                    >
                      {v.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200 mb-1">
                          {v.venueType || "Banquet Hall"}
                        </span>
                        <h3 className="font-serif font-bold text-base sm:text-lg text-ink line-clamp-1">
                          {v.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                        <span>★</span>
                        <span>{v.rating?.toFixed ? v.rating.toFixed(1) : v.rating || "4.8"}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted flex items-center gap-1 mt-1 truncate">
                      <span>📍</span>
                      <span className="font-medium text-ink/80 truncate">
                        {v.locality ? `${v.locality}, ` : ""}
                        {v.city}, {v.state || "Bihar"}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted mt-1 truncate">
                      <span>Vendor: </span>
                      <span className="font-semibold text-ink">{v.vendorName}</span>
                      {v.vendorContact && v.vendorContact !== "—" && (
                        <span> • {v.vendorContact}</span>
                      )}
                    </div>

                    {/* Quick Specs Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {guestCap > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-brand-50 text-brand-800 px-2 py-0.5 rounded-md border border-brand-100">
                          <span>👥</span> {guestCap} Guests
                        </span>
                      )}

                      {v.roomCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-100">
                          <span>🛏️</span> {v.roomCount} Rooms
                        </span>
                      )}

                      {Array.isArray(v.spaceTypes) &&
                        v.spaceTypes.slice(0, 2).map((sp) => (
                          <span
                            key={sp}
                            className="inline-flex items-center gap-1 text-[10px] font-medium bg-surface text-ink/70 px-2 py-0.5 rounded-md border border-brand-100"
                          >
                            <span>🏛️</span> {sp}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Pricing & Footer Actions */}
                <div className="pt-3 border-t border-brand-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3 text-xs">
                    {rental > 0 && (
                      <div>
                        <span className="text-[10px] text-muted block leading-none">Rental Cost</span>
                        <span className="font-bold text-ink text-sm sm:text-base">
                          ₹{rental.toLocaleString("en-IN")}
                          <span className="text-[10px] text-muted font-normal"> / day</span>
                        </span>
                      </div>
                    )}

                    {v.pricePerPlateVeg > 0 && (
                      <div className="border-l border-brand-100 pl-3">
                        <span className="text-[10px] text-emerald-700 block leading-none font-medium">
                          Veg Plate
                        </span>
                        <span className="font-bold text-emerald-800 text-xs sm:text-sm">
                          ₹{v.pricePerPlateVeg}
                        </span>
                      </div>
                    )}

                    {v.pricePerPlateNonVeg > 0 && (
                      <div className="border-l border-brand-100 pl-3">
                        <span className="text-[10px] text-rose-700 block leading-none font-medium">
                          Non-Veg Plate
                        </span>
                        <span className="font-bold text-rose-800 text-xs sm:text-sm">
                          ₹{v.pricePerPlateNonVeg}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsVenue(v);
                        setDetailsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="View full details directly here"
                    >
                      <span>👁️</span> Full Detail
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(v)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        v.active
                          ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {v.active ? "Active" : "Hidden"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(v)}
                      className="p-1.5 rounded-xl border border-brand-200 text-brand-700 hover:bg-brand-50 text-sm transition-colors cursor-pointer"
                      title="Edit venue details"
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(v._id, v.title)}
                      className="p-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm transition-colors cursor-pointer"
                      title="Delete venue"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add / Edit Venue */}
      <AdminVenueFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          loadVenues();
        }}
        initialData={editingVenue}
      />

      {/* In-page Full Details Modal */}
      <AdminVenueDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        venue={detailsVenue}
        onEdit={(vToEdit) => {
          setEditingVenue(vToEdit);
          setModalOpen(true);
        }}
      />
    </div>
  );
}

