"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";
import AdminHotelFormModal from "@/components/admin/AdminHotelFormModal";
import AdminRoomFormModal from "@/components/admin/AdminRoomFormModal";

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hotels"); // "hotels" | "rooms"

  // Filter States
  const [searchHotel, setSearchHotel] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedHotelFilter, setSelectedHotelFilter] = useState("all");
  const [roomSearch, setRoomSearch] = useState("");

  // Modals
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [preselectedHotelId, setPreselectedHotelId] = useState("");

  const [actionMsg, setActionMsg] = useState("");

  const loadHotels = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/hotels");
      if (data?.ok) {
        setHotels(data.data.hotels || []);
      }
    } catch (err) {
      console.error("Failed to load admin hotels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  // Compute Cities list for filter
  const cityList = useMemo(() => {
    const set = new Set();
    hotels.forEach((h) => {
      if (h.city?.trim()) set.add(h.city.trim());
    });
    return Array.from(set).sort();
  }, [hotels]);

  // Aggregate Stats
  const totalHotelsCount = hotels.length;
  const totalRoomsCount = useMemo(() => {
    return hotels.reduce((acc, h) => acc + (h.roomsCount || 0), 0);
  }, [hotels]);
  const totalActiveRoomsCount = useMemo(() => {
    return hotels.reduce((acc, h) => acc + (h.activeRoomsCount || 0), 0);
  }, [hotels]);

  // Filtered Hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (selectedCity !== "all" && (h.city || "").toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (searchHotel.trim()) {
        const q = searchHotel.toLowerCase();
        const titleMatch = (h.title || "").toLowerCase().includes(q);
        const cityMatch = (h.city || "").toLowerCase().includes(q);
        const vendorMatch = (h.vendorName || "").toLowerCase().includes(q);
        const phoneMatch = (h.contactPhone || h.vendorContact || "").toLowerCase().includes(q);
        if (!titleMatch && !cityMatch && !vendorMatch && !phoneMatch) return false;
      }
      return true;
    });
  }, [hotels, selectedCity, searchHotel]);

  // All Flattened Rooms (for Room Tab)
  const allRooms = useMemo(() => {
    const list = [];
    hotels.forEach((h) => {
      if (Array.isArray(h.rooms)) {
        h.rooms.forEach((rm) => {
          list.push({
            ...rm,
            hotelTitle: h.title,
            hotelCity: h.city,
            hotelId: h._id,
          });
        });
      }
    });
    return list;
  }, [hotels]);

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return allRooms.filter((rm) => {
      if (selectedHotelFilter !== "all" && String(rm.hotel?._id || rm.hotel || rm.hotelId) !== selectedHotelFilter) {
        return false;
      }
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const nameMatch = (rm.name || "").toLowerCase().includes(q);
        const typeMatch = (rm.roomType || "").toLowerCase().includes(q);
        const bedMatch = (rm.bedType || "").toLowerCase().includes(q);
        const hotelMatch = (rm.hotelTitle || "").toLowerCase().includes(q);
        if (!nameMatch && !typeMatch && !bedMatch && !hotelMatch) return false;
      }
      return true;
    });
  }, [allRooms, selectedHotelFilter, roomSearch]);

  // Actions
  const handleOpenAddHotel = () => {
    setEditingHotel(null);
    setHotelModalOpen(true);
  };

  const handleOpenEditHotel = (hotel) => {
    setEditingHotel(hotel);
    setHotelModalOpen(true);
  };

  const handleDeleteHotel = async (hotelId, title) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This will permanently delete the hotel property and all associated rooms!`
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/api/admin/hotels/${hotelId}`);
      if (!res.data?.ok) throw new Error(res.data?.error || "Failed to delete hotel");
      setActionMsg(`Hotel "${title}" and its rooms were deleted.`);
      setTimeout(() => setActionMsg(""), 3500);
      loadHotels();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to delete hotel");
    }
  };

  const handleOpenAddRoom = (hotelId = "") => {
    setEditingRoom(null);
    setPreselectedHotelId(hotelId);
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setPreselectedHotelId(room.hotel?._id || room.hotel || "");
    setRoomModalOpen(true);
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (!confirm(`Are you sure you want to delete room "${roomName}"?`)) return;

    try {
      const res = await api.delete(`/api/rooms/${roomId}`);
      if (!res.data?.ok) throw new Error(res.data?.error || "Failed to delete room");
      setActionMsg(`Room "${roomName}" was deleted.`);
      setTimeout(() => setActionMsg(""), 3500);
      loadHotels();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to delete room");
    }
  };

  const handleToggleRoomActive = async (room) => {
    try {
      const nextActive = !room.active;
      const res = await api.put(`/api/rooms/${room._id}`, { active: nextActive });
      if (!res.data?.ok) throw new Error(res.data?.error || "Failed to toggle status");
      setActionMsg(`Room "${room.name}" is now ${nextActive ? "Active" : "Inactive"}.`);
      setTimeout(() => setActionMsg(""), 3500);
      loadHotels();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to update room status");
    }
  };

  const handleManageHotelRooms = (hotelId) => {
    setSelectedHotelFilter(hotelId);
    setActiveTab("rooms");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏨</span>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine tracking-tight">
              Hotel & Room Management
            </h1>
          </div>
          <p className="mt-1 text-xs md:text-sm text-muted">
            Add hotel vendors from public listings, manage properties, nightly tariffs, and vendor-wise room inventories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenAddRoom()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-brand-700 font-bold text-xs md:text-sm transition shadow-2xs cursor-pointer"
          >
            <span>+</span> Add Room
          </button>
          <button
            type="button"
            onClick={handleOpenAddHotel}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs md:text-sm transition shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <span>🏨</span> + Add Hotel (Manual Entry)
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between gap-2 shadow-2xs">
          <span>✅ {actionMsg}</span>
          <button onClick={() => setActionMsg("")} className="text-emerald-700 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl shrink-0">
            🏨
          </div>
          <div>
            <div className="text-2xl font-bold text-ink">{totalHotelsCount}</div>
            <div className="text-xs text-muted font-medium">Hotel Properties</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl shrink-0">
            🛏️
          </div>
          <div>
            <div className="text-2xl font-bold text-ink">{totalRoomsCount}</div>
            <div className="text-xs text-muted font-medium">Total Room Types</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0">
            📦
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{totalActiveRoomsCount}</div>
            <div className="text-xs text-muted font-medium">Active Bookable Rooms</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-line shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center text-xl shrink-0">
            📍
          </div>
          <div>
            <div className="text-2xl font-bold text-ink">{cityList.length}</div>
            <div className="text-xs text-muted font-medium">Cities / Districts</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-line gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("hotels")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === "hotels"
              ? "border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl"
              : "border-transparent text-muted hover:text-ink hover:bg-gray-50 rounded-t-xl"
          }`}
        >
          <span>🏨</span>
          <span>Hotel Properties & Vendors</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-ink/70 font-semibold ml-1">
            {totalHotelsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rooms")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === "rooms"
              ? "border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl"
              : "border-transparent text-muted hover:text-ink hover:bg-gray-50 rounded-t-xl"
          }`}
        >
          <span>🛏️</span>
          <span>Room Inventory (Vendor-Wise)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-ink/70 font-semibold ml-1">
            {totalRoomsCount}
          </span>
        </button>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
          <p className="text-muted text-sm font-medium">Loading hotel & room inventory...</p>
        </div>
      ) : activeTab === "hotels" ? (
        /* TAB 1: HOTELS & VENDORS LIST */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-line shadow-2xs">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchHotel}
                onChange={(e) => setSearchHotel(e.target.value)}
                placeholder="Search hotels by property name, city, vendor, or phone..."
                className="w-full text-xs md:text-sm bg-transparent border-none outline-hidden text-ink placeholder:text-muted"
              />
              {searchHotel && (
                <button
                  type="button"
                  onClick={() => setSearchHotel("")}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {cityList.length > 0 && (
              <div className="flex items-center gap-2 sm:border-l sm:border-line sm:pl-4">
                <span className="text-xs font-semibold text-muted shrink-0">City:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-line bg-white text-ink text-xs font-medium focus:ring-1 focus:ring-brand-500 outline-hidden"
                >
                  <option value="all">All Cities ({cityList.length})</option>
                  {cityList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Hotels Grid */}
          {filteredHotels.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-line text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center text-2xl mx-auto shadow-xs">
                🏨
              </div>
              <h3 className="font-serif text-lg font-bold text-wine">No Hotels Found</h3>
              <p className="text-xs md:text-sm text-muted max-w-sm mx-auto">
                No hotel listings match your filters. Add your first hotel property collected from public listings!
              </p>
              <button
                type="button"
                onClick={handleOpenAddHotel}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition"
              >
                + Add Hotel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredHotels.map((hotel) => {
                const coverImage = hotel.images?.[0] || "/images/categories/hotels.jpg";
                const roomsCount = hotel.roomsCount || 0;
                const minPrice = hotel.minRoomPrice || hotel.price || 0;

                return (
                  <div
                    key={hotel._id}
                    className="bg-white rounded-2xl border border-line shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Row: Cover Thumbnail + Title & Location */}
                      <div className="flex items-start gap-4">
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-line">
                          <img
                            src={coverImage}
                            alt={hotel.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                            📷 {hotel.images?.length || 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted truncate">
                              📍 {hotel.city || "—"}{hotel.state ? `, ${hotel.state}` : ""}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                hotel.active
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {hotel.active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <h3 className="font-serif text-lg font-bold text-wine truncate mt-0.5" title={hotel.title}>
                            {hotel.title}
                          </h3>

                          {/* Contact Details */}
                          <div className="mt-1 text-xs text-ink/75 space-y-0.5">
                            <div className="truncate">
                              <span className="text-muted">Vendor:</span>{" "}
                              <span className="font-semibold">{hotel.vendorName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted truncate">
                              {hotel.contactPhone && (
                                <span>📞 {hotel.contactPhone}</span>
                              )}
                              {hotel.contactEmail && (
                                <span className="truncate">✉️ {hotel.contactEmail}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Rate & Room Count Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-line text-xs">
                        <div className="flex items-baseline gap-1">
                          <span className="text-muted font-medium">Starting Tariff:</span>
                          <span className="text-base font-bold text-brand-700">
                            {minPrice > 0 ? `₹${minPrice.toLocaleString("en-IN")}` : "On Request"}
                          </span>
                          <span className="text-[11px] text-muted">/ night</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-semibold border border-blue-200 text-xs">
                            🛏️ {roomsCount} Room{roomsCount === 1 ? "" : "s"} ({hotel.activeRoomsCount || 0} Active)
                          </span>
                        </div>
                      </div>

                      {/* Source tag if imported/collected */}
                      {hotel.sourceUrl && (
                        <div className="mt-2 text-[11px] text-muted truncate">
                          <span>🌐 Source Listing: </span>
                          <a
                            href={hotel.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:underline"
                          >
                            {hotel.sourceUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/product/${hotel._id}`}
                        target="_blank"
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
                      >
                        Public Page ↗
                      </Link>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleManageHotelRooms(hotel._id)}
                          className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>🛏️</span> Manage Rooms
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAddRoom(hotel._id)}
                          className="px-3 py-1.5 rounded-lg border border-line hover:border-brand-500 hover:text-brand-600 text-ink text-xs font-semibold transition cursor-pointer"
                        >
                          + Room
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditHotel(hotel)}
                          className="px-2.5 py-1.5 rounded-lg border border-line hover:border-brand-500 hover:text-brand-600 text-ink text-xs font-semibold transition cursor-pointer"
                          title="Edit Hotel"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteHotel(hotel._id, hotel.title)}
                          className="px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                          title="Delete Hotel"
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
        </div>
      ) : (
        /* TAB 2: ROOM INVENTORY (VENDOR-WISE) */
        <div className="space-y-4">
          {/* Room Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-line shadow-2xs">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search rooms by name, type (Deluxe, Suite), bed type..."
                className="w-full text-xs md:text-sm bg-transparent border-none outline-hidden text-ink placeholder:text-muted"
              />
              {roomSearch && (
                <button
                  type="button"
                  onClick={() => setRoomSearch("")}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:border-l sm:border-line sm:pl-4">
              <span className="text-xs font-semibold text-muted shrink-0">Hotel:</span>
              <select
                value={selectedHotelFilter}
                onChange={(e) => setSelectedHotelFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-line bg-white text-ink text-xs font-medium focus:ring-1 focus:ring-brand-500 outline-hidden max-w-[220px] truncate"
              >
                <option value="all">All Hotels ({hotels.length})</option>
                {hotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.title} ({h.roomsCount || 0} rooms)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-line text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center text-2xl mx-auto shadow-xs">
                🛏️
              </div>
              <h3 className="font-serif text-lg font-bold text-wine">No Rooms Found</h3>
              <p className="text-xs md:text-sm text-muted max-w-sm mx-auto">
                No rooms match the selected hotel or search criteria.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddRoom(selectedHotelFilter !== "all" ? selectedHotelFilter : "")}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition"
              >
                + Add Room to Hotel
              </button>
            </div>
          ) : (
            /* Rooms Grid Rendered with Reference-Matching Styling */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRooms.map((room) => {
                const coverImage = room.images?.[0] || "/images/categories/hotels.jpg";
                const photosCount = room.images?.length || 1;

                // Merge cancellation policy if present
                const displayFacilities = Array.isArray(room.facilities) ? [...room.facilities] : [];
                if (
                  room.cancellationPolicy &&
                  !displayFacilities.some((f) => f.toLowerCase().includes("cancellation"))
                ) {
                  displayFacilities.push(room.cancellationPolicy);
                }

                return (
                  <div
                    key={room._id}
                    className="bg-white rounded-3xl border border-pink-200/90 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {/* Image Preview with Badges */}
                      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                        <img
                          src={coverImage}
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="bg-amber-950/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
                            {room.roomType || "Room"}
                          </span>
                          {!room.active && (
                            <span className="bg-rose-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                              Inactive
                            </span>
                          )}
                        </div>

                        <span className="absolute bottom-2.5 right-2.5 bg-black/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                          <span>📷</span> {photosCount} Photo{photosCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3.5">
                        {/* Hotel Property Breadcrumb */}
                        <div className="text-[11px] font-semibold text-muted uppercase tracking-wider truncate">
                          🏨 {room.hotelTitle || "Hotel Property"} {room.hotelCity ? `• ${room.hotelCity}` : ""}
                        </div>

                        {/* Room Name & Tariff */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-serif text-lg font-bold text-[#b8246b] line-clamp-1 group-hover:text-brand-700 transition-colors">
                              {room.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {room.bedType || "1 King Bed"} • {room.numberOfBeds || 1} Bed{room.numberOfBeds === 1 ? "" : "s"}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xl font-extrabold text-[#b8246b]">
                              ₹{room.pricePerNight?.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium block">/ night</span>
                          </div>
                        </div>

                        {/* Badges: Max Guests, Beds, Available */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 font-bold border border-purple-200">
                            👥 Max {room.maxGuests} Guests
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-bold border border-blue-200">
                            🛏️ {room.bedType || "1 King Bed"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border ${
                              room.availableRooms > 0
                                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                : "bg-rose-50 text-rose-900 border-rose-200"
                            }`}
                          >
                            📦 {room.availableRooms} Available
                          </span>
                        </div>

                        {/* Room Size & Description */}
                        {(room.roomSize || room.description) && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {room.roomSize ? (
                              <span className="font-semibold text-gray-800">{room.roomSize} </span>
                            ) : null}
                            {room.description}
                          </p>
                        )}

                        {/* Facilities Pills */}
                        {displayFacilities.length > 0 && (
                          <div className="pt-2 border-t border-pink-100">
                            <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                              Room Facilities & Perks:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {displayFacilities.slice(0, 5).map((fac, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2 py-0.5 rounded-lg bg-pink-50/70 text-brand-900 border border-pink-200/90 font-medium truncate max-w-[150px]"
                                >
                                  ✓ {fac}
                                </span>
                              ))}
                              {displayFacilities.length > 5 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold self-center">
                                  +{displayFacilities.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Action Bar */}
                    <div className="p-4 border-t border-line bg-surface/50 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleRoomActive(room)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md transition cursor-pointer ${
                          room.active
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                        title="Click to toggle active status"
                      >
                        {room.active ? "● Active" : "○ Inactive"}
                      </button>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRoom(room)}
                          className="px-3 py-1.5 rounded-lg border border-line hover:border-brand-500 hover:text-brand-600 text-ink text-xs font-semibold transition cursor-pointer"
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room._id, room.name)}
                          className="px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                          title="Delete room"
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
        </div>
      )}

      {/* Hotel Form Modal (Create / Edit Hotel) */}
      <AdminHotelFormModal
        isOpen={hotelModalOpen}
        onClose={() => setHotelModalOpen(false)}
        onSaved={() => {
          loadHotels();
          setHotelModalOpen(false);
        }}
        initialData={editingHotel}
      />

      {/* Room Form Modal (Create / Edit Room) */}
      <AdminRoomFormModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        onSaved={() => {
          loadHotels();
          setRoomModalOpen(false);
        }}
        initialData={editingRoom}
        hotelList={hotels}
        preselectedHotelId={preselectedHotelId}
      />
    </div>
  );
}
