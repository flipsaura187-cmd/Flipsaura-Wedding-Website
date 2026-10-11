"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";

export default function VendorVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState("");

  const initialForm = {
    name: "",
    brand: "",
    model: "",
    vehicleType: "car",
    supportedServices: ["rental", "transport"],
    registrationNumber: "",
    seatingCapacity: 4,
    fuelType: "diesel",
    transmission: "manual",
    images: [],
    city: "Patna",
    pickupLocation: "",
    serviceArea: "",
    description: "",
    featuresStr: "Air Conditioning, Music System, GPS Tracking",
    rentalPricing: {
      pricePerHour: 500,
      pricePerDay: 4000,
      minDurationHours: 4,
      maxDurationDays: 30,
      securityDeposit: 3000,
      includedKmPerDay: 200,
      extraKmRate: 15,
      rentalTerms: "Valid ID and driving license required for self-drive.",
    },
    transportPricing: {
      pricingType: "fixed",
      baseTripPrice: 3500,
      perKmRate: 18,
      driverAllowance: 400,
      transportNotes: "Chauffeur included for event duration.",
    },
    availabilityStatus: "available",
  };

  const [form, setForm] = useState(initialForm);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/vehicles/my-vehicles");
      if (res.data?.ok) {
        setVehicles(res.data.data.vehicles || []);
      }
    } catch (err) {
      console.error("Failed to load owner vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingId(v._id);
    setForm({
      ...v,
      featuresStr: (v.features || []).join(", "),
      rentalPricing: { ...initialForm.rentalPricing, ...(v.rentalPricing || {}) },
      transportPricing: { ...initialForm.transportPricing, ...(v.transportPricing || {}) },
    });
    setError("");
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImg(true);
      const url = await uploadFile(file, "flipsaura/vehicles");
      setForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), url],
      }));
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const removeImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const payload = {
        ...form,
        name: form.name || `${form.brand} ${form.model}`,
        features: form.featuresStr
          ? form.featuresStr.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        seatingCapacity: Number(form.seatingCapacity),
        rentalPricing: {
          ...form.rentalPricing,
          pricePerHour: Number(form.rentalPricing.pricePerHour || 0),
          pricePerDay: Number(form.rentalPricing.pricePerDay || 0),
          securityDeposit: Number(form.rentalPricing.securityDeposit || 0),
          includedKmPerDay: Number(form.rentalPricing.includedKmPerDay || 0),
          extraKmRate: Number(form.rentalPricing.extraKmRate || 0),
        },
        transportPricing: {
          ...form.transportPricing,
          baseTripPrice: Number(form.transportPricing.baseTripPrice || 0),
          driverAllowance: Number(form.transportPricing.driverAllowance || 0),
          perKmRate: Number(form.transportPricing.perKmRate || 0),
        },
      };

      if (editingId) {
        await api.put(`/api/vehicles/${editingId}`, payload);
      } else {
        await api.post("/api/vehicles", payload);
      }

      setModalOpen(false);
      loadVehicles();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save vehicle.");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "available" ? "maintenance" : "available";
    try {
      await api.patch(`/api/vehicles/${id}/status`, { availabilityStatus: nextStatus });
      loadVehicles();
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to deactivate this vehicle listing?")) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      loadVehicles();
    } catch (err) {
      alert("Failed to deactivate: " + err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, color: "#111827" }}>My Vehicle Fleet</h1>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
            Manage cars, four-wheelers, autos, and buses available for rental or transport bookings.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
        >
          <span>➕</span> Add New Vehicle
        </button>
      </div>

      {/* Vehicles Table / Cards */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
          Loading your vehicles...
        </div>
      ) : vehicles.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "60px 20px",
            borderRadius: 16,
            textAlign: "center",
            border: "1px dashed #D1D5DB",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
          <h3 style={{ margin: "0 0 8px", color: "#374151" }}>No vehicles in your fleet yet</h3>
          <p style={{ color: "#6B7280", margin: "0 0 20px", fontSize: 14 }}>
            Add your cars, wedding 4x4s, autos, or passenger buses to start receiving client rental and trip bookings.
          </p>
          <button type="button" onClick={openAddModal} className="btn btn-primary">
            + Add First Vehicle
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {vehicles.map((v) => (
            <div
              key={v._id}
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #E5E7EB",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img
                  src={
                    v.images && v.images.length > 0
                      ? v.images[0]
                      : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=300&auto=format&fit=crop"
                  }
                  alt={v.name}
                  style={{ width: 90, height: 65, borderRadius: 8, objectFit: "cover", background: "#f3f4f6" }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{v.name}</h3>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontWeight: 700,
                        background: v.availabilityStatus === "available" ? "#ECFDF5" : "#FEF3C7",
                        color: v.availabilityStatus === "available" ? "#065F46" : "#92400E",
                      }}
                    >
                      {v.availabilityStatus === "available" ? "🟢 Operational" : "🟡 Maintenance"}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontWeight: 700,
                        background:
                          v.verificationStatus === "verified"
                            ? "#ECFDF5"
                            : v.verificationStatus === "rejected"
                            ? "#FEE2E2"
                            : "#FEF3C7",
                        color:
                          v.verificationStatus === "verified"
                            ? "#065F46"
                            : v.verificationStatus === "rejected"
                            ? "#991B1B"
                            : "#92400E",
                      }}
                    >
                      {v.verificationStatus === "verified"
                        ? "✓ Approved by Admin"
                        : v.verificationStatus === "rejected"
                        ? "✕ Rejected by Admin"
                        : "⏳ Pending Admin Approval"}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: "#6B7280" }}>
                    Plate: <b>{v.registrationNumber}</b> · 👥 {v.seatingCapacity} Seats · 📍 {v.city}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                    Services: {v.supportedServices?.join(" & ")} · Active Bookings: <b>{v.activeBookingsCount || 0}</b>
                  </div>

                  {v.verificationStatus === "rejected" && v.rejectionReason && (
                    <div style={{ marginTop: 6, padding: "5px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, fontSize: 12, color: "#B91C1C" }}>
                      <b>Admin Notice:</b> {v.rejectionReason}
                    </div>
                  )}

                  {v.verificationStatus === "pending" && (
                    <div style={{ marginTop: 4, fontSize: 11, color: "#D97706" }}>
                      ℹ️ Vehicle is under review by admin and will appear on the public marketplace once approved.
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right", marginRight: 8 }}>
                  {v.rentalPricing?.pricePerDay > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pink-700, #8B1E3F)" }}>
                      ₹{v.rentalPricing.pricePerDay}/day
                    </div>
                  )}
                  {v.transportPricing?.baseTripPrice > 0 && (
                    <div style={{ fontSize: 12, color: "#6B7280" }}>
                      ₹{v.transportPricing.baseTripPrice}/trip
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleStatus(v._id, v.availabilityStatus)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {v.availabilityStatus === "available" ? "Set Maintenance" : "Set Available"}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(v)}
                  className="btn btn-ghost"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                >
                  Edit ✏️
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(v._id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #FCA5A5",
                    background: "#FFF",
                    color: "#DC2626",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD / EDIT VEHICLE MODAL */}
      {/* ============================================================ */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 780,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>
                {editingId ? "Edit Vehicle Listing" : "Add Vehicle to Fleet"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Category & Basic Specs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 4 }}>
                    Brand *
                  </label>
                  <input
                    required
                    placeholder="e.g. Mahindra, Toyota, Volvo"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 4 }}>
                    Model *
                  </label>
                  <input
                    required
                    placeholder="e.g. Thar 4x4, Innova, B11R"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 4 }}>
                    Vehicle Type *
                  </label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff" }}
                  >
                    <option value="car">🚗 Car / Luxury Sedan</option>
                    <option value="four_wheeler">🚙 Four-Wheeler / 4x4 / SUV</option>
                    <option value="auto">🛺 Auto Rickshaw</option>
                    <option value="bus">🚌 Passenger Bus / Coach</option>
                  </select>
                </div>
              </div>

              {/* Plate Number & Seating & City */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 4 }}>
                    Registration Plate *
                  </label>
                  <input
                    required
                    placeholder="e.g. BR 01 CA 8899"
                    value={form.registrationNumber}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 4 }}>
                    Passenger Seats *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.seatingCapacity}
                    onChange={(e) => setForm({ ...form, seatingCapacity: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 4 }}>
                    City / Base Location *
                  </label>
                  <input
                    required
                    placeholder="e.g. Patna, Danapur"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                  />
                </div>
              </div>

              {/* Supported Services */}
              <div style={{ marginBottom: 16, background: "#F9FAFB", padding: "12px 16px", borderRadius: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
                  Supported Services:
                </label>
                <div style={{ display: "flex", gap: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.supportedServices.includes("rental")}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.supportedServices, "rental"]
                          : form.supportedServices.filter((s) => s !== "rental");
                        setForm({ ...form, supportedServices: next });
                      }}
                    />
                    ⏱️ Rent for a Period (Self-Drive / Timed)
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.supportedServices.includes("transport")}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.supportedServices, "transport"]
                          : form.supportedServices.filter((s) => s !== "transport");
                        setForm({ ...form, supportedServices: next });
                      }}
                    />
                    🚌 Book Transport (Chauffeur Trip / Barat)
                  </label>
                </div>
              </div>

              {/* Rental Pricing Configuration */}
              {form.supportedServices.includes("rental") && (
                <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--pink-700, #8B1E3F)" }}>
                    Rental Pricing Configuration (Service A)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block" }}>Price / Day (₹)</label>
                      <input
                        type="number"
                        value={form.rentalPricing.pricePerDay}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            rentalPricing: { ...form.rentalPricing, pricePerDay: e.target.value },
                          })
                        }
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block" }}>Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={form.rentalPricing.securityDeposit}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            rentalPricing: { ...form.rentalPricing, securityDeposit: e.target.value },
                          })
                        }
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block" }}>Included KM / Day</label>
                      <input
                        type="number"
                        value={form.rentalPricing.includedKmPerDay}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            rentalPricing: { ...form.rentalPricing, includedKmPerDay: e.target.value },
                          })
                        }
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Transport Pricing Configuration */}
              {form.supportedServices.includes("transport") && (
                <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#166534" }}>
                    Transport Pricing Configuration (Service B)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block" }}>Base Trip Price (₹)</label>
                      <input
                        type="number"
                        value={form.transportPricing.baseTripPrice}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            transportPricing: { ...form.transportPricing, baseTripPrice: e.target.value },
                          })
                        }
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block" }}>Driver Allowance (₹)</label>
                      <input
                        type="number"
                        value={form.transportPricing.driverAllowance}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            transportPricing: { ...form.transportPricing, driverAllowance: e.target.value },
                          })
                        }
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#666", display: "block" }}>Pricing Type</label>
                      <select
                        value={form.transportPricing.pricingType}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            transportPricing: { ...form.transportPricing, pricingType: e.target.value },
                          })
                        }
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                      >
                        <option value="fixed">Fixed Price</option>
                        <option value="quote">Quote on Request</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 6 }}>
                  Vehicle Images
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {form.images?.map((img, idx) => (
                    <div key={idx} style={{ position: "relative", width: 70, height: 50, borderRadius: 6, overflow: "hidden" }}>
                      <img src={img} alt="Vehicle" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 16,
                          height: 16,
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <label
                    style={{
                      border: "1px dashed #9CA3AF",
                      padding: "10px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: "pointer",
                      color: "#4B5563",
                    }}
                  >
                    {uploadingImg ? "Uploading..." : "📷 + Upload Photo"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  </label>
                </div>
              </div>

              {/* Features & Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 4 }}>
                  Features (comma-separated)
                </label>
                <input
                  placeholder="e.g. Air Conditioning, Bluetooth, Chauffeur Included, Floral Decor Ready"
                  value={form.featuresStr}
                  onChange={(e) => setForm({ ...form, featuresStr: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 4 }}>
                  Vehicle Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide details about condition, wedding uses, and pickup instructions..."
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost"
                  style={{ padding: "10px 18px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary"
                  style={{ padding: "10px 24px" }}
                >
                  {busy ? "Saving..." : editingId ? "Update Vehicle" : "Create Vehicle Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
