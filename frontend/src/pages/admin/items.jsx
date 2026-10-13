"use client";
import { useEffect, useState } from "react";
import ItemForm from "@/components/admin/ItemForm";
import api from "@/api/axios";

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/api/items?limit=48")
      .then((r) => r.data)
      .then((j) => j.ok && setItems(j.data.items || []))
      .finally(() => setLoading(false));
  };

  const cate = () => {
    api
      .get("/api/categories")
      .then((r) => r.data)
      .then((j) => j.ok && setCategories(j.data.categories || []));
  };

  useEffect(() => {
    load();
    cate();
  }, []);

  const remove = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    await api.delete(`/api/items/${id}`);
    load();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Services & Products</h1>
          <p className="text-sm text-muted mt-0.5">Manage all catalog listings across categories</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
        >
          + Add New Item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink/80">
            <thead className="bg-surface text-xs font-semibold text-muted uppercase tracking-wider border-b border-brand-100">
              <tr>
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">City</th>
                <th className="px-5 py-4">Active</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/70">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-muted">
                    Loading items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-muted">
                    No items in catalog.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it._id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-4 font-semibold text-ink">
                      {it.title}
                    </td>
                    <td className="px-5 py-4 font-bold text-ink font-sans whitespace-nowrap">
                      ₹{it.price?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-ink/70">
                      {it.city || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          it.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {it.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(it)}
                        className="px-3 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(it._id)}
                        className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-brand-100 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface hover:bg-brand-50 text-muted hover:text-ink flex items-center justify-center text-sm font-bold transition"
            >
              ✕
            </button>
            <ItemForm
              key={editingItem?._id || "new"}
              initialData={editingItem}
              onSaved={closeModal}
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}
