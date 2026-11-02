"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";

export default function AdminCatalogueManagerModal({ isOpen, onClose, onCatalogueChanged }) {
  const [activeTab, setActiveTab] = useState("categories"); // 'categories', 'subcategories', 'facilities'
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create/Edit State
  const [newCat, setNewCat] = useState({ name: "", description: "", icon: "🎪", order: 0 });
  const [newSub, setNewSub] = useState({ name: "", category: "", description: "", icon: "🏷️", order: 0 });
  const [newFac, setNewFac] = useState({ name: "", group: "Popular Amenities", icon: "✨", order: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [catsRes, subsRes, facsRes] = await Promise.all([
        api.get("/api/admin/categories"),
        api.get("/api/admin/subcategories"),
        api.get("/api/admin/facilities"),
      ]);

      if (catsRes.data?.ok) setCategories(catsRes.data.data || []);
      if (subsRes.data?.ok) setSubcategories(subsRes.data.data || []);
      if (facsRes.data?.ok) setFacilities(facsRes.data.data || []);
      if (catsRes.data?.data?.length && !newSub.category) {
        setNewSub((prev) => ({ ...prev, category: catsRes.data.data[0].name }));
      }
    } catch (err) {
      console.error("Load catalogue err:", err);
      setError("Failed to load catalogue items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Category Actions
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      const res = await api.post("/api/admin/categories", newCat);
      if (res.data?.ok) {
        setSuccess(`Category "${newCat.name}" added!`);
        setNewCat({ name: "", description: "", icon: "🎪", order: 0 });
        loadData();
        if (onCatalogueChanged) onCatalogueChanged();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add category");
    }
  };

  const handleToggleCategoryActive = async (cat) => {
    try {
      await api.put(`/api/admin/categories/${cat._id}`, { active: !cat.active });
      loadData();
      if (onCatalogueChanged) onCatalogueChanged();
    } catch (err) {
      setError("Failed to update category status");
    }
  };

  // Subcategory Actions
  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    if (!newSub.name.trim() || !newSub.category) return;
    try {
      const res = await api.post("/api/admin/subcategories", newSub);
      if (res.data?.ok) {
        setSuccess(`Subcategory "${newSub.name}" added under ${newSub.category}!`);
        setNewSub({ ...newSub, name: "", description: "" });
        loadData();
        if (onCatalogueChanged) onCatalogueChanged();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add subcategory");
    }
  };

  const handleToggleSubcategoryActive = async (sub) => {
    try {
      await api.put(`/api/admin/subcategories/${sub._id}`, { active: !sub.active });
      loadData();
      if (onCatalogueChanged) onCatalogueChanged();
    } catch (err) {
      setError("Failed to update subcategory status");
    }
  };

  // Facility Actions
  const handleCreateFacility = async (e) => {
    e.preventDefault();
    if (!newFac.name.trim()) return;
    try {
      const res = await api.post("/api/admin/facilities", newFac);
      if (res.data?.ok) {
        setSuccess(`Facility "${newFac.name}" added!`);
        setNewFac({ name: "", group: "Popular Amenities", icon: "✨", order: 0 });
        loadData();
        if (onCatalogueChanged) onCatalogueChanged();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add facility");
    }
  };

  const handleToggleFacilityActive = async (fac) => {
    try {
      await api.put(`/api/admin/facilities/${fac._id}`, { active: !fac.active });
      loadData();
      if (onCatalogueChanged) onCatalogueChanged();
    } catch (err) {
      setError("Failed to update facility status");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-brand-100 flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-700 to-indigo-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold">Dynamic Catalogue & Facilities Manager</h2>
              <p className="text-xs text-brand-100">
                Add, edit, or disable categories, subcategories & facilities without touching code.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-brand-100 bg-sand-50/70 px-6 gap-2">
          {[
            { id: "categories", label: `Main Categories (${categories.length})`, icon: "🎪" },
            { id: "subcategories", label: `Subcategories (${subcategories.length})`, icon: "🏷️" },
            { id: "facilities", label: `Facilities & Equipment (${facilities.length})`, icon: "🛋️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError("");
                setSuccess("");
              }}
              className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-700 bg-white"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">⚠️ {error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs">✓ {success}</div>}

          {/* TAB: CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              {/* Add category form */}
              <form onSubmit={handleCreateCategory} className="p-4 bg-sand-50/80 rounded-2xl border border-brand-100 space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-brand-800">Add New Category</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Category Name (e.g. Photography & Video)"
                    value={newCat.name}
                    onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-brand-200 text-xs sm:col-span-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Icon Emoji (e.g. 📷)"
                    value={newCat.icon}
                    onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-brand-200 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs hover:bg-brand-700"
                  >
                    + Add Category
                  </button>
                </div>
              </form>

              {/* List Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((c) => (
                  <div
                    key={c._id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      c.active !== false ? "bg-white border-brand-200" : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.icon || "📦"}</span>
                      <div>
                        <div className="font-bold text-xs text-ink">{c.name}</div>
                        <div className="text-[10px] text-ink-muted">Slug: {c.slug}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryActive(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        c.active !== false
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {c.active !== false ? "Active" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SUBCATEGORIES */}
          {activeTab === "subcategories" && (
            <div className="space-y-6">
              {/* Add subcategory form */}
              <form onSubmit={handleCreateSubcategory} className="p-4 bg-sand-50/80 rounded-2xl border border-brand-100 space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-brand-800">Add New Subcategory</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select
                    value={newSub.category}
                    onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-brand-200 text-xs bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Subcategory Name (e.g. Laser Lights)"
                    value={newSub.name}
                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-brand-200 text-xs sm:col-span-2"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs hover:bg-brand-700"
                  >
                    + Add Subcategory
                  </button>
                </div>
              </form>

              {/* List subcategories grouped by category */}
              <div className="space-y-4">
                {categories.map((cat) => {
                  const subs = subcategories.filter((s) => s.category === cat.name);
                  if (subs.length === 0) return null;
                  return (
                    <div key={cat._id} className="p-4 bg-sand-50/50 rounded-2xl border border-brand-100 space-y-2">
                      <div className="font-bold text-xs text-brand-800 uppercase tracking-wide flex items-center justify-between">
                        <span>{cat.name} ({subs.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {subs.map((s) => (
                          <span
                            key={s._id}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                              s.active !== false
                                ? "bg-white border-brand-200 text-ink"
                                : "bg-slate-100 border-slate-300 text-slate-400 line-through"
                            }`}
                          >
                            <span>{s.name}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleSubcategoryActive(s)}
                              title={s.active !== false ? "Disable" : "Enable"}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                s.active !== false
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800"
                                  : "bg-slate-200 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800"
                              }`}
                            >
                              {s.active !== false ? "Active" : "Off"}
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: FACILITIES */}
          {activeTab === "facilities" && (
            <div className="space-y-6">
              {/* Add facility form */}
              <form onSubmit={handleCreateFacility} className="p-4 bg-sand-50/80 rounded-2xl border border-brand-100 space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-brand-800">Add New Facility / Amenity</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Facility Name (e.g. Bridal Room)"
                    value={newFac.name}
                    onChange={(e) => setNewFac({ ...newFac, name: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-brand-200 text-xs sm:col-span-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Emoji Icon (e.g. 🚪)"
                    value={newFac.icon}
                    onChange={(e) => setNewFac({ ...newFac, icon: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-brand-200 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs hover:bg-brand-700"
                  >
                    + Add Facility
                  </button>
                </div>
              </form>

              {/* List facilities */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {facilities.map((fac) => (
                  <div
                    key={fac._id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      fac.active !== false ? "bg-white border-brand-200" : "bg-slate-100 border-slate-300 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{fac.icon || "✨"}</span>
                      <span className="font-medium truncate">{fac.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFacilityActive(fac)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        fac.active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {fac.active !== false ? "Active" : "Off"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-brand-100 bg-sand-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-brand-600 text-white font-semibold rounded-xl text-xs hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

