"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import HomeSetupServiceForm from "@/components/vendor/HomeSetupServiceForm";
import { HOME_SETUP_CATEGORIES } from "@/components/vendor/HomeSetupOnboarding";

function categoryToSlug(cat) {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function slugToCategory(slug) {
  return HOME_SETUP_CATEGORIES.find((c) => categoryToSlug(c.id) === slug)?.id || decodeURIComponent(slug);
}

function StatusBadge({ status }) {
  const map = {
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || map.draft}`}>
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

export default function VendorHomeSetupCategoryPage() {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();

  const categoryName = slugToCategory(categorySlug);
  const categoryMeta = HOME_SETUP_CATEGORIES.find((c) => c.id === categoryName);
  const subcategories = categoryMeta?.subcategories || [];

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/vendor/home-setup-v2/my-services?category=${encodeURIComponent(categoryName)}`
      );
      if (res.data?.ok) {
        setServices(res.data.data?.services || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [categoryName]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openAdd = (sub) => {
    setActiveSubcategory(sub);
    setEditingService(null);
    setModalOpen(true);
  };

  const openEdit = (svc) => {
    setActiveSubcategory(svc.subcategory);
    setEditingService(svc);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/vendor/home-setup-v2/services/${id}`);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete service.");
    } finally {
      setDeletingId(null);
    }
  };

  const getServicesForSub = (sub) => services.filter((s) => s.subcategory === sub);

  // For custom categories (no predefined subcategories), group all services together
  const isCustomCategory = !categoryMeta;

  return (
    <div className="space-y-5">
      {/* Service Form Modal */}
      <HomeSetupServiceForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          fetchServices();
        }}
        mainCategory={categoryName}
        subcategory={activeSubcategory || ""}
        initialData={editingService}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          type="button"
          onClick={() => navigate("/vendor/home-setup")}
          className="hover:text-amber-700 font-medium transition-colors cursor-pointer"
        >
          🎪 Home Setup
        </button>
        <span>→</span>
        <span className="text-amber-800 font-semibold">
          {categoryMeta?.icon} {categoryName}
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-100">
        <div>
          <h1 className="font-serif text-2xl font-bold text-amber-900">
            {categoryMeta?.icon || "📦"} {categoryName}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {services.length} service{services.length !== 1 ? "s" : ""} · {services.filter(s => s.status === "published").length} published
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/vendor/home-setup")}
          className="px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium transition-colors cursor-pointer"
        >
          ← Back to Categories
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center">
          <div className="inline-block w-7 h-7 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading services...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Custom Category — single section */}
          {isCustomCategory && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-amber-50 flex items-center justify-between">
                <h3 className="font-semibold text-amber-900">{categoryName}</h3>
                <button
                  type="button"
                  onClick={() => openAdd(categoryName)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Add Service
                </button>
              </div>
              <ServiceList
                services={services}
                onEdit={openEdit}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            </div>
          )}

          {/* Standard category — one card per subcategory */}
          {!isCustomCategory && subcategories.map((sub) => {
            const subServices = getServicesForSub(sub);
            return (
              <div key={sub} className="bg-white rounded-2xl border border-amber-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-amber-50/80 flex items-center justify-between gap-2 bg-amber-50/40">
                  <div>
                    <h3 className="font-semibold text-amber-900 text-sm">{sub}</h3>
                    <p className="text-[11px] text-gray-500">
                      {subServices.length} service{subServices.length !== 1 ? "s" : ""}
                      {subServices.filter(s => s.status === "published").length > 0 &&
                        ` · ${subServices.filter(s => s.status === "published").length} published`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAdd(sub)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + Add Service
                  </button>
                </div>

                {subServices.length > 0 ? (
                  <ServiceList
                    services={subServices}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                  />
                ) : (
                  <p className="p-4 text-xs text-gray-400 italic">No services yet. Click "+ Add Service" to get started.</p>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function ServiceList({ services, onEdit, onDelete, deletingId }) {
  if (!services.length) return null;
  return (
    <div className="divide-y divide-amber-50">
      {services.map((svc) => (
        <div key={svc._id} className="p-4 flex items-center gap-3 hover:bg-amber-50/30 transition-colors">
          {/* Cover image */}
          {svc.images?.[0] ? (
            <img
              src={svc.images[0]}
              alt={svc.name}
              className="w-12 h-12 rounded-xl object-cover border border-amber-100 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-gray-400 text-xl flex-shrink-0">
              📦
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-800 truncate">{svc.name}</span>
              <StatusBadge status={svc.status} />
              {!svc.isAvailable && (
                <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded-full">
                  Unavailable
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {svc.pricingModel === "custom_quotation" ? (
                <span className="text-amber-600 font-medium">Custom Quotation</span>
              ) : (
                <span>
                  ₹{(svc.startingPrice || 0).toLocaleString("en-IN")}
                  {" "}
                  <span className="text-gray-400">/ {(svc.pricingModel || "").replace("_", " ")}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => onEdit(svc)}
              className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(svc._id)}
              disabled={deletingId === svc._id}
              className="px-2.5 py-1.5 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {deletingId === svc._id ? "..." : "✕"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
