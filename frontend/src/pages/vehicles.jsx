"use client";
import React, { useState, useEffect } from "react";
import Link from "@/compat/Link";
import { useSearchParams } from "@/compat/navigation";
import api from "@/api/axios";

export default function VehiclesPage() {
  const sp = useSearchParams();
  const initialService = sp.get("service") || "";
  const initialType = sp.get("type") || "";

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [serviceType, setServiceType] = useState(initialService);
  const [vehicleType, setVehicleType] = useState(initialType);
  const [city, setCity] = useState(sp.get("city") || "");
  const [seating, setSeating] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("featured");

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (serviceType) params.append("serviceType", serviceType);
      if (vehicleType) params.append("vehicleType", vehicleType);
      if (city) params.append("city", city);
      if (seating) params.append("seating", seating);
      if (q) params.append("q", q);
      if (sort) params.append("sort", sort);

      const res = await api.get(`/api/vehicles?${params.toString()}`);
      if (res.data?.ok) {
        setVehicles(res.data.data.vehicles || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [serviceType, vehicleType, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadVehicles();
  };

  const getVehicleBadge = (v) => {
    if (v.vehicleType === "bus") return "🚌 Luxury Bus / Coach";
    if (v.vehicleType === "auto") return "🛺 Wedding Auto";
    if (v.vehicleType === "four_wheeler") return "🚙 4x4 / SUV";
    return "🚗 Luxury Sedan / Car";
  };

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Hero Banner */}
      <section
        style={{
          background: "linear-gradient(135deg, #4A0E17 0%, #8B1E3F 50%, #2B0810 100%)",
          color: "#fff",
          padding: "60px 20px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(8px)",
              padding: "6px 16px",
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 16,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            FlipsAura Fleet & Mobility
          </span>
          <h1 style={{ fontSize: "2.6rem", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Vehicle Rentals & Wedding Transport
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)", maxWidth: 700, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Reserve self-drive luxury cars, four-wheelers, and decorative autos, or book chauffeur-driven Barat transport, VIP family transit, and luxury Volvo buses.
          </p>

          {/* Service Switcher Buttons */}
          <div
            style={{
              display: "inline-flex",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(12px)",
              padding: 6,
              borderRadius: 40,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setServiceType("")}
              style={{
                padding: "10px 22px",
                borderRadius: 30,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: serviceType === "" ? "#fff" : "transparent",
                color: serviceType === "" ? "#8B1E3F" : "#fff",
              }}
            >
              🌟 All Services
            </button>
            <button
              type="button"
              onClick={() => setServiceType("rental")}
              style={{
                padding: "10px 22px",
                borderRadius: 30,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: serviceType === "rental" ? "#fff" : "transparent",
                color: serviceType === "rental" ? "#8B1E3F" : "#fff",
              }}
            >
              ⏱️ Rent for a Period (Self-Drive)
            </button>
            <button
              type="button"
              onClick={() => setServiceType("transport")}
              style={{
                padding: "10px 22px",
                borderRadius: 30,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: serviceType === "transport" ? "#fff" : "transparent",
                color: serviceType === "transport" ? "#8B1E3F" : "#fff",
              }}
            >
              🚌 Book Transport (Chauffeur Trip)
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="container" style={{ maxWidth: 1240, margin: "-20px auto 0", padding: "0 16px" }}>
        {/* Search & Filter Bar */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "20px 24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.05)",
            marginBottom: 32,
          }}
        >
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, alignItems: "center" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  Search Vehicle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thar, Innova, Volvo, Auto..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patna, Danapur..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  Min Passengers / Seats
                </label>
                <select
                  value={seating}
                  onChange={(e) => setSeating(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="">Any Capacity</option>
                  <option value="3">3+ Seats (Auto / Compact)</option>
                  <option value="4">4+ Seats (Sedan / SUV)</option>
                  <option value="7">7+ Seats (MUV / Family)</option>
                  <option value="20">20+ Seats (Mini Bus)</option>
                  <option value="40">40+ Seats (Large Coach)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  Sort Order
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="featured">Featured First</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="seating">Seating Capacity</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: "11px 18px",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  🔍 Find Vehicles
                </button>
              </div>
            </div>
          </form>

          {/* Quick Vehicle Type Pill Filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, paddingTop: 16, borderTop: "1px solid #f0f0f0", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#777", fontWeight: 600, marginRight: 6 }}>Vehicle Category:</span>
            {[
              { id: "", label: "All Vehicles" },
              { id: "car", label: "🚗 Cars & Sedans" },
              { id: "four_wheeler", label: "🚙 4-Wheelers & SUVs" },
              { id: "auto", label: "🛺 Auto Rickshaws" },
              { id: "bus", label: "🚌 Buses & Coaches" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setVehicleType(btn.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  border: vehicleType === btn.id ? "1px solid var(--pink-700, #8B1E3F)" : "1px solid #e2e8f0",
                  background: vehicleType === btn.id ? "var(--pink-50, #FDF2F4)" : "#fff",
                  color: vehicleType === btn.id ? "var(--pink-700, #8B1E3F)" : "#4b5563",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1f2937" }}>
            Available Fleet ({total})
          </h2>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Showing verified vehicle listings with direct booking & quotes
          </div>
        </div>

        {/* Vehicle Cards Grid */}
        {loading ? (
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#888" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🚗</div>
            Loading available vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "#fff",
              borderRadius: 16,
              border: "1px dashed #cbd5e1",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>🚘</div>
            <h3 style={{ margin: "0 0 8px", color: "#374151" }}>No vehicles match your criteria</h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px" }}>
              Try adjusting your filters, location, or selecting another vehicle type.
            </p>
            <button
              type="button"
              onClick={() => {
                setServiceType("");
                setVehicleType("");
                setCity("");
                setSeating("");
                setQ("");
                loadVehicles();
              }}
              className="btn btn-primary"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {vehicles.map((v) => {
              const mainImg =
                v.images && v.images.length > 0
                  ? v.images[0]
                  : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop";

              return (
                <div
                  key={v._id}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    border: "1px solid #f0f0f0",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {/* Vehicle Image Container */}
                  <div style={{ position: "relative", height: 210, width: "100%", background: "#eee", overflow: "hidden" }}>
                    <img
                      src={mainImg}
                      alt={v.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                    />

                    {/* Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(6px)",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {getVehicleBadge(v)}
                    </div>

                    {/* City Tag */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        background: "rgba(255,255,255,0.92)",
                        color: "#1f2937",
                        padding: "3px 10px",
                        borderRadius: 14,
                        fontSize: 12,
                        fontWeight: 600,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      }}
                    >
                      📍 {v.city}
                    </div>

                    {v.featured && (
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: "#EAB308",
                          color: "#713F12",
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        ⭐ Featured
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--pink-700, #8B1E3F)", textTransform: "uppercase" }}>
                          {v.brand}
                        </span>
                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 0", color: "#111827" }}>
                          {v.name}
                        </h3>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#D97706", display: "flex", alignItems: "center", gap: 3 }}>
                        ★ {v.rating || "5.0"}
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        margin: "0 0 16px",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {v.description || "Well-maintained vehicle for weddings, parties, and personal rentals."}
                    </p>

                    {/* Quick Specs Chips */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                      <span style={{ fontSize: 12, background: "#f3f4f6", padding: "4px 8px", borderRadius: 6, color: "#4b5563" }}>
                        👥 {v.seatingCapacity} Seats
                      </span>
                      <span style={{ fontSize: 12, background: "#f3f4f6", padding: "4px 8px", borderRadius: 6, color: "#4b5563", textTransform: "capitalize" }}>
                        ⛽ {v.fuelType}
                      </span>
                      <span style={{ fontSize: 12, background: "#f3f4f6", padding: "4px 8px", borderRadius: 6, color: "#4b5563", textTransform: "capitalize" }}>
                        ⚙️ {v.transmission}
                      </span>
                      <span style={{ fontSize: 12, background: "#f3f4f6", padding: "4px 8px", borderRadius: 6, color: "#4b5563" }}>
                        🔒 {v.registrationNumber}
                      </span>
                    </div>

                    {/* Pricing Block */}
                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: 14,
                        borderTop: "1px solid #f3f4f6",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        {v.supportedServices.includes("rental") && v.rentalPricing?.pricePerDay > 0 ? (
                          <div>
                            <span style={{ fontSize: 11, color: "#9ca3af", display: "block" }}>Rental from</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--pink-700, #8B1E3F)" }}>
                              ₹{v.rentalPricing.pricePerDay.toLocaleString("en-IN")}
                            </span>
                            <span style={{ fontSize: 11, color: "#6b7280" }}> / day</span>
                          </div>
                        ) : v.supportedServices.includes("transport") && v.transportPricing?.baseTripPrice > 0 ? (
                          <div>
                            <span style={{ fontSize: 11, color: "#9ca3af", display: "block" }}>Trip from</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--pink-700, #8B1E3F)" }}>
                              ₹{v.transportPricing.baseTripPrice.toLocaleString("en-IN")}
                            </span>
                            <span style={{ fontSize: 11, color: "#6b7280" }}> / trip</span>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontSize: 11, color: "#9ca3af", display: "block" }}>Custom Service</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--pink-700, #8B1E3F)" }}>
                              Quote on Request
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/vehicles/${v._id}`}
                        to={`/vehicles/${v._id}`}
                        className="btn btn-primary"
                        style={{
                          padding: "8px 18px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        View & Book →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Explainer Section */}
        <section
          style={{
            marginTop: 60,
            background: "#fff",
            borderRadius: 20,
            padding: "40px 32px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 36px" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>
              Two Transparent Vehicle Services
            </h2>
            <p style={{ color: "#6b7280", margin: 0, fontSize: 15 }}>
              Choose whether you want self-drive flexibility or seamless chauffeur-driven wedding event transport.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div style={{ background: "var(--pink-50, #FDF2F4)", padding: 24, borderRadius: 14, border: "1px solid rgba(139,30,63,0.1)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏱️</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--pink-700, #8B1E3F)", margin: "0 0 8px" }}>
                Service A: Rent a Vehicle for a Period
              </h3>
              <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
                Rent cars, four-wheelers, or autos for hours or days. Backend checks strictly prevent double bookings. Complete price breakdown with included KMs and security deposit is visible upfront.
              </p>
            </div>

            <div style={{ background: "#F0FDF4", padding: 24, borderRadius: 14, border: "1px solid rgba(22,101,52,0.1)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚌</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#166534", margin: "0 0 8px" }}>
                Service B: Book a Vehicle for Transport
              </h3>
              <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
                Hassle-free wedding transport, guest airport pickup/drop, and grand Barat procession. Supports luxury sedans, autos, and large Volvo buses with verified chauffeurs.
              </p>
            </div>

            <div style={{ background: "#EFF6FF", padding: 24, borderRadius: 14, border: "1px solid rgba(30,64,175,0.1)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1E40AF", margin: "0 0 8px" }}>
                Own Vehicles? List & Earn With FlipsAura
              </h3>
              <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, margin: "0 0 12px" }}>
                Register as a Vehicle Owner/Provider. Add your cars, autos, or buses, set custom hourly/daily rates, and manage incoming wedding requests with ease.
              </p>
              <Link href="/register" to="/register" style={{ fontWeight: 700, color: "#1E40AF", fontSize: 13 }}>
                Register as Vehicle Owner →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
