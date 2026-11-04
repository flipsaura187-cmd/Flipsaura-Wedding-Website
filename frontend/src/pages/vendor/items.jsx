"use client";
import { useEffect, useState } from "react";
import ItemForm from "@/components/vendor/ItemForm";
import AdminVenueFormModal from "@/components/admin/AdminVenueFormModal";
import AdminHotelFormModal from "@/components/admin/AdminHotelFormModal";
import AdminPhotographyFormModal from "@/components/admin/AdminPhotographyFormModal";
import AdminMehandiFormModal from "@/components/admin/AdminMehandiFormModal";
import AdminHomeSetupFormModal from "@/components/admin/AdminHomeSetupFormModal";
import Link from "@/compat/Link";
import api from "@/api/axios";

const SERVICE_CATEGORY_CARDS = [
  {
    type: "home-setup",
    title: "Home Setup – Pandal, Tent, DJ & Ghar Setup",
    icon: "🎪",
    badge: "Full Ghar Setup",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Complete home wedding setups: Tents, Pandals, Seating, Stage Mandap, DJ, Lighting, Power & Amenities.",
    highlights: ["Tent & Pandal", "Furniture & Seating", "Stage & Decoration", "DJ & Sound", "Lighting & Special Effects", "Power Backup"],
    bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent",
    borderColor: "hover:border-amber-400 hover:shadow-amber-500/10",
  },
  {
    type: "venue",
    title: "Wedding Venues & Resorts",
    icon: "🏛️",
    badge: "Venues Catalogue",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Banquet Halls, Marriage Lawns, Luxury Resorts & Small Function / Party Halls.",
    highlights: ["Tent & Pandal", "Furniture & Seating", "Stage & Decoration", "DJ & Sound", "Lighting & Special Effects", "Power Backup"],
    bgGradient: "from-amber-500/10 via-rose-500/5 to-transparent",
    borderColor: "hover:border-amber-400 hover:shadow-amber-500/10",
  },
  {
    type: "hotel",
    title: "Hotels & Room Stays",
    icon: "🏨",
    badge: "Room Inventory",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Hotel rooms for guest accommodation, baraat stays & luxury bridal suites.",
    highlights: ["Deluxe & Suite Rooms", "Tariff Rates", "AC / Non-AC", "Bed Types", "Guest Capacity", "Stay Amenities"],
    bgGradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
    borderColor: "hover:border-blue-400 hover:shadow-blue-500/10",
  },
  {
    type: "photography",
    title: "Photographer & Videographer",
    icon: "📷",
    badge: "4-Tier Packages",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Wedding cinematographers, candid photographers & drone aerial teams.",
    highlights: ["Basic, Standard, Premium & Luxury Packages", "Photo Albums", "Cinema Videos", "Shooting Styles & Gear"],
    bgGradient: "from-purple-500/10 via-pink-500/5 to-transparent",
    borderColor: "hover:border-purple-400 hover:shadow-purple-500/10",
  },
  {
    type: "mehandi",
    title: "Mehndi Services",
    icon: "🌿",
    badge: "Bridal Specialist",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Bridal mehndi artists, sangeet henna teams & traditional/Arabic designer styles.",
    highlights: ["Basic, Standard, Premium & Luxury Packages", "Bridal & Arabic Styles", "100% Organic Henna", "Home Visits & Group Setup"],
    bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    borderColor: "hover:border-emerald-400 hover:shadow-emerald-500/10",
  },
  {
    type: "generic",
    title: "Other Wedding Services",
    icon: "✨",
    badge: "Catering, Decor & More",
    badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
    description: "Food catering, decoration, transportation, makeup, priest or orchestra.",
    highlights: ["Standard Catalog Listing", "Custom Pricing", "Custom Specifications"],
    bgGradient: "from-gray-500/10 via-slate-500/5 to-transparent",
    borderColor: "hover:border-gray-400 hover:shadow-gray-500/10",
  },
];

export default function VendorItems() {
  const [items, setItems] = useState([]);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [activeCategoryType, setActiveCategoryType] = useState(null); // 'venue' | 'hotel' | 'photography' | 'mehandi' | 'generic' | null
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vendorStatus, setVendorStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .get("/api/items?limit=48&isVendor=true")
      .then((r) => r.data)
      .then((j) => j.ok && setItems(j.data.items))
      .catch(() => {});

  const cate = () =>
    api
      .get("/api/categories")
      .then((r) => r.data)
      .then((j) => j.ok && setCategories(j.data.categories))
      .catch(() => {});

  const checkStatus = () =>
    api
      .get("/api/vendor/status")
      .then((r) => r.data)
      .then((j) => j.ok && setVendorStatus(j.data))
      .catch(() => {});

  useEffect(() => {
    Promise.all([load(), cate(), checkStatus()]).finally(() => setLoading(false));
  }, []);

  const isApproved = Boolean(vendorStatus?.isApproved || items.length > 0);

  const detectCategory = (item) => {
    if (!item) return "generic";
    const slug = (item.category?.slug || "").toLowerCase();
    const name = (item.category?.name || "").toLowerCase();

    if (
      slug === "home-setup-pandal-tent-dj" ||
      slug.includes("home-setup") ||
      name.includes("home setup") ||
      name.includes("ghar setup") ||
      name.includes("pandal")
    ) {
      return "home-setup";
    }

    if (
      slug === "venues" ||
      slug === "venues-resorts" ||
      name.includes("venue") ||
      item.venueType ||
      (item.rentalPrice !== undefined && Number(item.rentalPrice) > 0) ||
      (Array.isArray(item.spaceTypes) && item.spaceTypes.length > 0)
    ) {
      return "venue";
    }

    if (
      slug === "hotels" ||
      slug === "hotels-resorts" ||
      name.includes("hotel") ||
      (Array.isArray(item.rooms) && item.rooms.length > 0)
    ) {
      return "hotel";
    }

    if (
      slug === "photographer-videographer" ||
      slug === "photography" ||
      name.includes("photo") ||
      item.photographyPackages ||
      (Array.isArray(item.albums) && item.albums.length > 0)
    ) {
      return "photography";
    }

    if (
      slug === "mehndi-services" ||
      slug === "mehandi" ||
      name.includes("mehndi") ||
      name.includes("mehandi") ||
      item.mehandiPackages ||
      item.contactPerson
    ) {
      return "mehandi";
    }

    return "generic";
  };

  const getCategoryBadge = (item) => {
    const type = detectCategory(item);
    switch (type) {
      case "home-setup":
        return { label: "Home Setup & Pandal", icon: "🎪", color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "venue":
        return { label: item.venueType || "Wedding Venue", icon: "🏛️", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "hotel":
        return { label: "Hotel & Stay", icon: "🏨", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "photography":
        return { label: "Photography & Video", icon: "📷", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "mehandi":
        return { label: "Mehndi Services", icon: "🌿", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      default:
        return { label: item.category?.name || "Service", icon: "✨", color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const remove = async (id) => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await api.delete(`/api/items/${id}`);
      load();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.error || "Failed to delete item.");
    }
  };

  const handleEdit = (item) => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    const type = detectCategory(item);
    setEditingItem(item);
    setActiveCategoryType(type);
  };

  const handleOpenCategoryPicker = () => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    setEditingItem(null);
    setIsCategoryPickerOpen(true);
  };

  const closeModal = () => {
    setActiveCategoryType(null);
    setEditingItem(null);
    load();
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-base font-medium">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine tracking-tight">
            My Listed Services & Items
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted">
            Manage your public wedding service packages, rates, equipment catalogues, and property listings.
          </p>
        </div>

        <div>
          {isApproved ? (
            <button
              onClick={handleOpenCategoryPicker}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors shadow-2xs cursor-pointer"
            >
              <span className="text-base font-bold">+</span> New Service Item
            </button>
          ) : (
            <button
              disabled
              title="Locked until admin approval"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed border border-gray-200"
            >
              <span>🔒</span> New Item (Locked)
            </button>
          )}
        </div>
      </div>

      {/* Locked Notice Banner */}
      {!isApproved && (
        <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">🔒</span>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">Service Management is Locked</h4>
              <p className="mt-0.5 text-xs sm:text-sm text-amber-900/80 max-w-xl">
                Complete your profile and KYC verification to unlock this feature and publish wedding services to couples.
              </p>
            </div>
          </div>
          <Link
            href="/vendor/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs flex-shrink-0"
          >
            Complete Verification →
          </Link>
        </div>
      )}

      {/* Items Content */}
      {items.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-line shadow-2xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-2xl mb-4">
            📦
          </div>
          <h3 className="font-serif text-lg font-bold text-ink mb-1">No services listed yet</h3>
          <p className="text-muted text-xs sm:text-sm max-w-md mx-auto mb-6">
            {isApproved
              ? "Click '+ New Service Item' to choose your category (Venues, Hotels, Photography, Mehndi) and showcase your work."
              : "Services will appear here once your vendor account is verified by FlipsAura administrators."}
          </p>
          {isApproved && (
            <button
              onClick={handleOpenCategoryPicker}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors shadow-2xs cursor-pointer"
            >
              + Create First Item
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-xs font-semibold text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 md:px-6">Title & Category</th>
                  <th className="py-3.5 px-4 md:px-6">Price</th>
                  <th className="py-3.5 px-4 md:px-6">City</th>
                  <th className="py-3.5 px-4 md:px-6">Active</th>
                  <th className="py-3.5 px-4 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm text-ink">
                {items.map((it) => {
                  const badge = getCategoryBadge(it);
                  return (
                    <tr key={it._id} className="hover:bg-brand-50/30 transition-colors">
                      <td className="py-3.5 px-4 md:px-6 font-medium text-ink">
                        <div className="flex items-center gap-3">
                          {it.images?.[0] ? (
                            <img
                              src={it.images[0]}
                              alt={it.title}
                              className="w-12 h-12 rounded-xl object-cover border border-line flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-base flex-shrink-0">
                              {badge.icon}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-ink line-clamp-1">{it.title}</div>
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${badge.color}`}>
                                <span>{badge.icon}</span>
                                <span>{badge.label}</span>
                              </span>
                              {it.subcategories?.length > 0 && (
                                <span className="text-[11px] text-muted">
                                  • {it.subcategories.length} equipment/options
                                </span>
                              )}
                              {it.rooms?.length > 0 && (
                                <span className="text-[11px] text-muted">
                                  • {it.rooms.length} rooms
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 md:px-6 font-semibold text-brand-700 whitespace-nowrap">
                        ₹{(it.rentalPrice || it.price || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 md:px-6 text-muted whitespace-nowrap">{it.city || "—"}</td>
                      <td className="py-3.5 px-4 md:px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            it.active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {it.active ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 md:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={detectCategory(it) === "hotel" ? `/hotels/${it._id}` : `/venues/${it._id}`}
                            className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-ink hover:text-brand-600 hover:border-brand-600 transition-colors"
                          >
                            View ↗
                          </Link>
                          <button
                            disabled={!isApproved}
                            onClick={() => handleEdit(it)}
                            className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-ink hover:text-brand-600 hover:border-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            disabled={!isApproved}
                            onClick={() => remove(it._id)}
                            className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Picker Modal */}
      {isCategoryPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setIsCategoryPickerOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 relative border border-line animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-wine tracking-tight">
                  Choose Service Category
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-muted">
                  Select your service category to open the specialized configuration form with equipment catalogues, room inventories, and package options.
                </p>
              </div>
              <button
                onClick={() => setIsCategoryPickerOpen(false)}
                className="text-gray-400 hover:text-ink w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVICE_CATEGORY_CARDS.map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => {
                    setIsCategoryPickerOpen(false);
                    setEditingItem(null);
                    setActiveCategoryType(cat.type);
                  }}
                  className={`text-left p-5 rounded-2xl border-2 border-line/80 bg-gradient-to-br ${cat.bgGradient} ${cat.borderColor} transition-all duration-200 hover:shadow-lg group flex flex-col justify-between cursor-pointer`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-3xl group-hover:scale-110 transition-transform">
                        {cat.icon}
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cat.badgeColor}`}>
                        {cat.badge}
                      </span>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-ink group-hover:text-brand-600 transition-colors">
                      {cat.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60">
                    <div className="flex flex-wrap gap-1.5">
                      {cat.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/80 text-gray-700 border border-line"
                        >
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Add {cat.title} →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 0. Home Setup Form Modal (Interactive 7-Group Catalogue & Custom Options) */}
      {activeCategoryType === "home-setup" && (
        <AdminHomeSetupFormModal
          isOpen={true}
          isVendor={true}
          initialData={editingItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            load();
          }}
        />
      )}

      {/* 1. Venue Form Modal (Rich Catalogue & Custom Options) */}
      {activeCategoryType === "venue" && (
        <AdminVenueFormModal
          isOpen={true}
          isVendor={true}
          initialData={editingItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            load();
          }}
        />
      )}

      {/* 2. Hotel Form Modal (Rooms & Tariffs) */}
      {activeCategoryType === "hotel" && (
        <AdminHotelFormModal
          isOpen={true}
          isVendor={true}
          initialData={editingItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            load();
          }}
        />
      )}

      {/* 3. Photography Form Modal (4 Packages, Albums, Videos & Options) */}
      {activeCategoryType === "photography" && (
        <AdminPhotographyFormModal
          isOpen={true}
          isVendor={true}
          initialData={editingItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            load();
          }}
        />
      )}

      {/* 4. Mehandi Form Modal (4 Packages, Design Styles & Options) */}
      {activeCategoryType === "mehandi" && (
        <AdminMehandiFormModal
          isOpen={true}
          isVendor={true}
          initialData={editingItem}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            load();
          }}
        />
      )}

      {/* 5. Generic Item Form Modal */}
      {activeCategoryType === "generic" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 relative border border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-gray-400 hover:text-ink w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-lg cursor-pointer"
            >
              ✕
            </button>
            <ItemForm
              key={editingItem?._id || "new"}
              initialData={editingItem}
              categories={categories}
              onSaved={closeModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
