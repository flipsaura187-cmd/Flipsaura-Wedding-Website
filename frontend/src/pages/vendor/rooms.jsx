"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";
import RoomFormModal from "@/components/vendor/RoomFormModal";

export default function VendorRooms() {
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [vendorStatus, setVendorStatus] = useState(null);
  const [filterHotel, setFilterHotel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const loadData = async () => {
    try {
      const [roomsRes, itemsRes, statusRes] = await Promise.all([
        api
          .get("/api/rooms")
          .catch((err) =>
            err.response?.status === 404
              ? api.get("/api/vendor/rooms")
              : Promise.reject(err)
          )
          .catch(() => ({ data: { ok: false, data: { rooms: [] } } })),
        api.get("/api/items?limit=100&isVendor=true").catch(() => ({ data: { ok: false, data: { items: [] } } })),
        api.get("/api/vendor/status").catch(() => ({ data: { ok: false } })),
      ]);

      if (roomsRes.data?.ok) {
        setRooms(roomsRes.data.data?.rooms || []);
      }
      if (itemsRes.data?.ok) {
        setItems(itemsRes.data.data?.items || []);
      }
      if (statusRes.data?.ok) {
        setVendorStatus(statusRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load rooms data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isApproved = Boolean(vendorStatus?.isApproved);

  // Filter items that are hotel listings or all vendor items
  const hotelItems = useMemo(() => {
    return items.filter((it) => {
      const catSlug = (it.category?.slug || "").toLowerCase();
      const catName = (it.category?.name || "").toLowerCase();
      const title = (it.title || "").toLowerCase();
      return (
        catSlug === "hotels" ||
        catName.includes("hotel") ||
        catName.includes("resort") ||
        title.includes("hotel") ||
        title.includes("resort") ||
        title.includes("inn") ||
        title.includes("palace") ||
        items.length === 1 // if vendor has only 1 listing, let them associate rooms to it
      );
    });
  }, [items]);

  // If no specific hotel items matched but vendor has items, fallback to all vendor items
  const availableHotels = hotelItems.length > 0 ? hotelItems : items;

  const hasHotelService = Boolean(
    vendorStatus?.hasHotelService ||
    hotelItems.length > 0 ||
    rooms.length > 0
  );

  // Filtered rooms list
  const filteredRooms = useMemo(() => {
    return rooms.filter((rm) => {
      if (filterHotel !== "all" && String(rm.hotel?._id || rm.hotel) !== filterHotel) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (rm.name || "").toLowerCase().includes(q);
        const typeMatch = (rm.roomType || "").toLowerCase().includes(q);
        const hotelMatch = (rm.hotel?.title || "").toLowerCase().includes(q);
        if (!nameMatch && !typeMatch && !hotelMatch) return false;
      }
      return true;
    });
  }, [rooms, filterHotel, searchQuery]);

  const handleCreate = () => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    setEditingRoom(null);
    setModalOpen(true);
  };

  const handleEdit = (room) => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    setEditingRoom(room);
    setModalOpen(true);
  };

  const handleDelete = async (roomId, roomName) => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    if (!confirm(`Are you sure you want to delete room "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      let res;
      try {
        res = await api.delete(`/api/rooms/${roomId}`);
      } catch (delErr) {
        if (delErr.response?.status === 404) {
          res = await api.delete(`/api/vendor/rooms/${roomId}`);
        } else {
          throw delErr;
        }
      }
      if (!res.data?.ok) throw new Error(res.data?.error || "Failed to delete room");
      setActionMsg(`Room "${roomName}" was deleted.`);
      setTimeout(() => setActionMsg(""), 3500);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to delete room");
    }
  };

  const handleSaved = (savedRoom) => {
    setActionMsg(`Room "${savedRoom.name}" saved successfully!`);
    setTimeout(() => setActionMsg(""), 3500);
    loadData();
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-base font-medium">Loading hotel rooms...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛏️</span>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine tracking-tight">
              Manage Hotel Rooms
            </h1>
          </div>
          <p className="mt-1 text-xs md:text-sm text-muted">
            Add multiple room types (Deluxe, Suite, AC), define night tariffs, amenities and real-time room availability.
          </p>
        </div>

        <div>
          {isApproved ? (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm transition shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <span>+</span> Add Hotel Room
            </button>
          ) : (
            <button
              disabled
              title="Locked until admin approval"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed border border-gray-200"
            >
              <span>🔒</span> Add Room (Locked)
            </button>
          )}
        </div>
      </div>

      {/* Action Notice Toast */}
      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between gap-2 shadow-2xs">
          <span>✅ {actionMsg}</span>
          <button onClick={() => setActionMsg("")} className="text-emerald-700 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Locked Notice Banner */}
      {!isApproved && (
        <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⏳</span>
            <div>
              <h4 className="font-bold text-ink text-sm">Account Pending Verification</h4>
              <p className="text-xs text-muted mt-0.5">
                Room management is unlocked as soon as your vendor KYC documents are verified and approved by admin.
              </p>
            </div>
          </div>
          <Link
            href="/vendor/onboarding"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shrink-0 transition"
          >
            Check Status →
          </Link>
        </div>
      )}

      {/* Filter / Search Bar */}
      {rooms.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-line shadow-2xs">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room name, type, or hotel..."
              className="w-full text-xs md:text-sm bg-transparent border-none outline-hidden text-ink placeholder:text-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-600 px-1"
              >
                Clear
              </button>
            )}
          </div>

          {availableHotels.length > 1 && (
            <div className="flex items-center gap-2 sm:border-l sm:border-line sm:pl-4">
              <span className="text-xs font-semibold text-muted shrink-0">Hotel:</span>
              <select
                value={filterHotel}
                onChange={(e) => setFilterHotel(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-line bg-white text-ink text-xs font-medium focus:ring-1 focus:ring-brand-500 outline-hidden"
              >
                <option value="all">All Hotels ({availableHotels.length})</option>
                {availableHotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* If vendor does not offer hotel service */}
      {!hasHotelService ? (
        <div className="p-8 md:p-12 bg-white rounded-3xl border border-line text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-3xl mx-auto shadow-xs">
            🏨
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-xl font-bold text-wine">
              Hotel Service Required
            </h3>
            <p className="text-xs md:text-sm text-muted mt-2 leading-relaxed">
              Room management is reserved for vendors providing hotel and accommodation services. To manage rooms, add a Hotel service under <b>My Services / Items</b>.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/vendor/items"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              Go to My Services & Items →
            </Link>
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-10 md:p-14 bg-white rounded-3xl border border-line text-center space-y-5 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center text-3xl mx-auto shadow-xs">
            🛏️
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-xl md:text-2xl font-bold text-wine">
              No Hotel Rooms Added Yet
            </h3>
            <p className="text-xs md:text-sm text-muted mt-2 leading-relaxed">
              Start adding your room types (Deluxe Room, Standard AC, Luxury Suite) with per-night rates, amenities, and guest capacities. Customers will see these available rooms directly on your hotel listing page!
            </p>
          </div>
          <div>
            {isApproved ? (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm transition shadow-md shadow-brand-500/20 cursor-pointer"
              >
                <span>+</span> Add Your First Room
              </button>
            ) : (
              <p className="text-xs text-amber-700 font-medium">
                🔒 Room creation will be unlocked once your vendor profile is approved.
              </p>
            )}
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-line text-center text-muted text-sm">
          No rooms match your search query. Try clearing the filters.
        </div>
      ) : (
        /* Rooms Grid / Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const coverImage = room.images?.[0] || room.hotel?.images?.[0] || "/images/categories/hotels.jpg";
            const hotelTitle = room.hotel?.title || "Associated Hotel";
            const hotelId = room.hotel?._id || room.hotel;

            return (
              <div
                key={room._id}
                className="bg-white rounded-2xl border border-line shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Room Photo Preview */}
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={coverImage}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-brand-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
                      {room.roomType || "Room"}
                    </span>
                    {!room.active && (
                      <span className="bg-rose-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Inactive
                      </span>
                    )}
                  </div>
                  {room.images?.length > 1 && (
                    <span className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                      <span>📸</span> {room.images.length} Photos
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Hotel Title & City */}
                    <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 truncate">
                      🏢 {hotelTitle} {room.hotel?.city ? `• ${room.hotel.city}` : ""}
                    </div>

                    {/* Room Display Name */}
                    <h3 className="font-serif text-lg font-bold text-wine group-hover:text-brand-600 transition-colors line-clamp-1">
                      {room.name}
                    </h3>

                    {/* Tariff */}
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-2xl font-bold text-brand-700">
                        ₹{room.pricePerNight?.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-muted font-medium">/ night</span>
                    </div>

                    {/* Key Attributes Pills */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                      <span className="inline-flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg text-brand-900 font-semibold border border-brand-100">
                        👥 Up to {room.maxGuests} Guests
                      </span>
                      <span className="inline-flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg text-ink font-medium border border-line">
                        🛏️ {room.bedType || `${room.numberOfBeds} Bed`}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg text-emerald-800 font-medium border border-emerald-200">
                        📦 {room.availableRooms} Available
                      </span>
                    </div>

                    {/* Amenities Badges */}
                    {room.facilities?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {room.facilities.slice(0, 4).map((f, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-700 border border-gray-200 truncate max-w-[140px]"
                          >
                            ✓ {f}
                          </span>
                        ))}
                        {room.facilities.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold self-center">
                            +{room.facilities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                    {hotelId && (
                      <Link
                        href={`/product/${hotelId}`}
                        target="_blank"
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
                        title="View hotel page"
                      >
                        Preview ↗
                      </Link>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleEdit(room)}
                        className="px-3 py-1.5 rounded-lg border border-line hover:border-brand-500 hover:text-brand-600 text-ink text-xs font-semibold transition"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(room._id, room.name)}
                        className="px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                        title="Delete room"
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

      {/* Room Form Modal (Add / Edit) */}
      <RoomFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        initialData={editingRoom}
        hotelItems={availableHotels}
      />
    </div>
  );
}
