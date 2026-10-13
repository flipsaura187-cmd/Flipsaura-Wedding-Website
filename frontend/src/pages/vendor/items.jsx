"use client";
import { useEffect, useState } from "react";
import ItemForm from "@/components/vendor/ItemForm";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function VendorItems() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
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

  const isApproved = Boolean(vendorStatus?.isApproved);

  const remove = async (id) => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    if (!confirm("Are you sure you want to delete this item?")) return;
    await api.delete(`/api/items/${id}`);
    load();
  };

  const handleEdit = (item) => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCreate = () => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    setEditingItem(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
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
            Manage your public wedding service packages, rates, and listings.
          </p>
        </div>

        <div>
          {isApproved ? (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors shadow-2xs"
            >
              <span>+</span> New Service Item
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
              ? "Click '+ New Service Item' to create your first wedding package and showcase your work."
              : "Services will appear here once your vendor account is verified by FlipsAura administrators."}
          </p>
          {isApproved && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors shadow-2xs"
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
                  <th className="py-3.5 px-4 md:px-6">Title</th>
                  <th className="py-3.5 px-4 md:px-6">Price</th>
                  <th className="py-3.5 px-4 md:px-6">City</th>
                  <th className="py-3.5 px-4 md:px-6">Active</th>
                  <th className="py-3.5 px-4 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm text-ink">
                {items.map((it) => (
                  <tr key={it._id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="py-3.5 px-4 md:px-6 font-medium text-ink">
                      <div className="flex items-center gap-3">
                        {it.images?.[0] ? (
                          <img
                            src={it.images[0]}
                            alt={it.title}
                            className="w-10 h-10 rounded-lg object-cover border border-line"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                            📷
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-ink line-clamp-1">{it.title}</div>
                          {it.category?.name && (
                            <div className="text-xs text-muted">{it.category.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 md:px-6 font-semibold text-brand-700">
                      ₹{it.price?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 md:px-6 text-muted">{it.city || "—"}</td>
                    <td className="py-3.5 px-4 md:px-6">
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
                    <td className="py-3.5 px-4 md:px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          disabled={!isApproved}
                          onClick={() => handleEdit(it)}
                          className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-ink hover:text-brand-600 hover:border-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          disabled={!isApproved}
                          onClick={() => remove(it._id)}
                          className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Item Modal */}
      {modalOpen && (
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
              className="absolute top-5 right-5 text-gray-400 hover:text-ink w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-lg"
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
