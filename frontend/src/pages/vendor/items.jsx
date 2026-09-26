"use client";
import { useEffect, useState } from "react";
import ItemForm from "@/components/vendor/ItemForm";

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories]= useState([])

  const load = () => fetch("/api/items?limit=48&isVendor=true").then(r => r.json()).then(j => j.ok && setItems(j.data.items));
  const cate = () => fetch("/api/categories").then(r => r.json()).then(j => j.ok && setCategories(j.data.categories));
  useEffect(() => { load(); cate(); }, []);

  const remove = async (id) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
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
    load(); // refresh list after save
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Items</h1>
        <button className="btn btn-primary" onClick={handleCreate}>+ New item</button>
      </div>

      <table className="data" style={{ marginTop: 16 }}>
        <thead>
          <tr><th>Title</th><th>Price</th><th>City</th><th>Active</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it._id}>
              <td>{it.title}</td>
              <td>₹{it.price?.toLocaleString("en-IN")}</td>
              <td>{it.city}</td>
              <td>{it.active ? "Yes" : "No"}</td>
              <td>
                <button className="btn btn-ghost" onClick={() => handleEdit(it)}>Edit</button>
                <button className="btn btn-ghost" onClick={() => remove(it._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            <ItemForm
              key={editingItem?._id || 'new'}   // ← forces remount
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