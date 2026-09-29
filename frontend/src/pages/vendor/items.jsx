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
    if (!confirm("Delete this item?")) return;
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
    return <div className="loading" style={{ padding: 40, textAlign: "center" }}>Loading items...</div>;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>My Listed Services & Items</h1>
        {isApproved ? (
          <button className="btn btn-primary" onClick={handleCreate}>+ New item</button>
        ) : (
          <button className="btn btn-ghost" disabled title="Locked until admin approval" style={{ opacity: 0.6 }}>
            🔒 + New item (Locked)
          </button>
        )}
      </div>

      {!isApproved && (
        <div className="locked-card" style={{ marginBottom: 24, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div className="locked-overlay-tag">
              <span>🔒</span> Feature Locked
            </div>
            <h4 style={{ margin: "4px 0" }}>Service Management is Locked</h4>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Complete your profile and verification to unlock this feature and publish wedding services to couples.
            </p>
          </div>
          <Link href="/vendor/onboarding" className="btn btn-primary" style={{ fontSize: 13 }}>
            Complete Verification →
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ background: "#fff", padding: 36, textAlign: "center", borderRadius: 12, border: "1px dashed #d1c4cb" }}>
          <p style={{ color: "var(--muted)", margin: "0 0 12px" }}>
            {isApproved ? "No items listed yet. Click '+ New item' to create your first package." : "Services will appear here once your vendor account is verified."}
          </p>
          {isApproved && (
            <button className="btn btn-primary" onClick={handleCreate}>+ Create First Item</button>
          )}
        </div>
      ) : (
        <table className="data" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Title</th><th>Price</th><th>City</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.title}</td>
                <td>₹{it.price?.toLocaleString("en-IN")}</td>
                <td>{it.city}</td>
                <td>{it.active ? "Yes" : "No"}</td>
                <td>
                  <button className="btn btn-ghost" disabled={!isApproved} onClick={() => handleEdit(it)}>Edit</button>
                  <button className="btn btn-ghost" disabled={!isApproved} onClick={() => remove(it._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            <ItemForm
              key={editingItem?._id || "new"}
              initialData={editingItem}
              categories={categories}
              onSaved={closeModal}
            />
          </div>
        </div>
      )}
    </>
  );
}
