"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "@/compat/navigation";
import Link from "@/compat/Link";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/axios";

export default function VehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [error, setError] = useState("");

  // Service Tabs: "rental" vs "transport"
  const [activeTab, setActiveTab] = useState("rental");

  // Rental Form State (Service A)
  const [rentalForm, setRentalForm] = useState({
    startDate: "",
    startTime: "10:00",
    endDate: "",
    endTime: "10:00",
    pickupLocation: "",
    returnLocation: "",
    selfDrive: true,
  });

  // Transport Form State (Service B)
  const [transportForm, setTransportForm] = useState({
    tripType: "one_way",
    travelDate: "",
    pickupTime: "09:00",
    returnDate: "",
    returnTime: "18:00",
    pickupAddress: "",
    destinationAddress: "",
    passengers: 1,
    specialNotes: "",
  });

  // Contact Info
  const [contact, setContact] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Dynamic Availability & Pricing states
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState(null);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    if (user) {
      setContact((prev) => ({
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/vehicles/${id}`);
        if (data?.ok && data.data?.vehicle) {
          const v = data.data.vehicle;
          setVehicle(v);
          setRentalForm((prev) => ({
            ...prev,
            pickupLocation: v.pickupLocation || v.city || "",
            returnLocation: v.pickupLocation || v.city || "",
          }));
          // Set initial active tab based on supported services
          if (!v.supportedServices?.includes("rental") && v.supportedServices?.includes("transport")) {
            setActiveTab("transport");
          }
        } else {
          setError("Vehicle not found.");
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load vehicle details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVehicle();
  }, [id]);

  // Real-time rental availability & pricing calculation
  useEffect(() => {
    if (activeTab !== "rental" || !rentalForm.startDate || !rentalForm.endDate || !vehicle) {
      setAvailResult(null);
      return;
    }

    const startIso = `${rentalForm.startDate}T${rentalForm.startTime || "00:00"}:00`;
    const endIso = `${rentalForm.endDate}T${rentalForm.endTime || "00:00"}:00`;

    if (new Date(startIso) >= new Date(endIso)) {
      setAvailResult({ available: false, error: "End date/time must be strictly after start date/time." });
      return;
    }

    let isCancelled = false;
    const check = async () => {
      try {
        setCheckingAvail(true);
        const res = await api.get(
          `/api/vehicles/${vehicle._id}/check-availability?serviceType=RENTAL&startDate=${startIso}&endDate=${endIso}`
        );
        if (!isCancelled && res.data?.ok) {
          setAvailResult(res.data.data);
        }
      } catch (err) {
        if (!isCancelled) {
          setAvailResult({ available: false, error: err.response?.data?.error || "Availability check failed." });
        }
      } finally {
        if (!isCancelled) setCheckingAvail(false);
      }
    };

    const debounce = setTimeout(check, 350);
    return () => {
      isCancelled = true;
      clearTimeout(debounce);
    };
  }, [rentalForm.startDate, rentalForm.startTime, rentalForm.endDate, rentalForm.endTime, activeTab, vehicle]);

  // Handle Booking Submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!contact.name || !contact.email || !contact.phone) {
      setError("Please provide your full contact name, email, and phone number.");
      return;
    }

    try {
      setBookingBusy(true);

      let payload = {
        serviceType: activeTab === "rental" ? "RENTAL" : "TRANSPORT",
        customerName: contact.name,
        customerEmail: contact.email,
        customerPhone: contact.phone,
      };

      if (activeTab === "rental") {
        if (!rentalForm.startDate || !rentalForm.endDate) {
          setError("Please select both start and end date/time.");
          setBookingBusy(false);
          return;
        }

        const startIso = `${rentalForm.startDate}T${rentalForm.startTime}:00`;
        const endIso = `${rentalForm.endDate}T${rentalForm.endTime}:00`;

        payload.rentalDetails = {
          startDate: startIso,
          endDate: endIso,
          pickupLocation: rentalForm.pickupLocation,
          returnLocation: rentalForm.returnLocation,
          selfDrive: rentalForm.selfDrive,
        };
      } else {
        if (!transportForm.travelDate || !transportForm.pickupAddress || !transportForm.destinationAddress) {
          setError("Please enter the travel date, pickup address, and destination address.");
          setBookingBusy(false);
          return;
        }

        payload.transportDetails = {
          tripType: transportForm.tripType,
          travelDate: `${transportForm.travelDate}T${transportForm.pickupTime}:00`,
          pickupTime: transportForm.pickupTime,
          returnDate:
            transportForm.tripType === "round_trip" && transportForm.returnDate
              ? `${transportForm.returnDate}T${transportForm.returnTime}:00`
              : null,
          returnTime: transportForm.returnTime,
          pickupAddress: transportForm.pickupAddress,
          destinationAddress: transportForm.destinationAddress,
          passengers: Number(transportForm.passengers || 1),
          specialNotes: transportForm.specialNotes,
        };
      }

      const { data } = await api.post(`/api/vehicles/${vehicle._id}/book`, payload);
      if (data.ok && data.data?.booking) {
        setBookingSuccess(data.data.booking);
      } else {
        setError(data.error || "Booking request failed. Please verify dates and details.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to submit booking.");
    } finally {
      setBookingBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚗</div>
        <p style={{ color: "#666", fontSize: 16 }}>Loading vehicle specifications & availability...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Vehicle Not Found</h2>
        <p style={{ color: "#888" }}>{error || "The requested vehicle is unavailable or does not exist."}</p>
        <Link href="/vehicles" to="/vehicles" className="btn btn-primary" style={{ marginTop: 20 }}>
          ← Back to Vehicle Fleet
        </Link>
      </div>
    );
  }

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop"];

  const supportsRental = vehicle.supportedServices?.includes("rental");
  const supportsTransport = vehicle.supportedServices?.includes("transport");

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", padding: "32px 0 80px" }}>
      <div className="container" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 16px" }}>
        {/* Breadcrumb Navigation */}
        <nav style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/" to="/" style={{ color: "#6B7280", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/vehicles" to="/vehicles" style={{ color: "#6B7280", textDecoration: "none" }}>Vehicles</Link>
          <span>/</span>
          <span style={{ color: "var(--pink-700, #8B1E3F)", fontWeight: 600 }}>{vehicle.name}</span>
        </nav>

        {/* Success Modal / Banner */}
        {bookingSuccess && (
          <div
            style={{
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: 16,
              padding: "32px 24px",
              marginBottom: 32,
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.1)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ color: "#065F46", margin: "0 0 8px", fontSize: 24, fontWeight: 800 }}>
              Booking Request Received!
            </h2>
            <p style={{ color: "#047857", fontSize: 16, maxWidth: 600, margin: "0 auto 16px" }}>
              Your request for <b>{vehicle.name}</b> has been placed successfully under reference{" "}
              <b style={{ background: "#D1FAE5", padding: "3px 8px", borderRadius: 6 }}>
                {bookingSuccess.bookingRef}
              </b>.
            </p>
            <p style={{ color: "#065F46", fontSize: 14, margin: "0 0 24px" }}>
              The vehicle provider has been notified. You can track this request and accept provider quotes directly from your FlipsAura account.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/account" to="/account" className="btn btn-primary" style={{ padding: "10px 24px" }}>
                View In My Bookings →
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setBookingSuccess(null)}
                style={{ padding: "10px 20px" }}
              >
                Close & View Vehicle
              </button>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(360px, 1fr)", gap: 32, alignItems: "start" }}>
          {/* LEFT COLUMN: Vehicle Presentation & Details */}
          <div>
            {/* Header Titles */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pink-700, #8B1E3F)", textTransform: "uppercase" }}>
                  {vehicle.brand} · {vehicle.vehicleType.replace("_", " ")}
                </span>
                <span style={{ background: "#F3F4F6", color: "#374151", fontSize: 12, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                  📍 {vehicle.city}
                </span>
                <span style={{ color: "#D97706", fontWeight: 700, fontSize: 13 }}>
                  ★ {vehicle.rating || "5.0"} ({vehicle.reviewsCount || 12} reviews)
                </span>
              </div>
              <h1 style={{ fontSize: "2.2rem", fontWeight: 800, margin: 0, color: "#111827", lineHeight: 1.2 }}>
                {vehicle.name}
              </h1>
            </div>

            {/* Image Gallery */}
            <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #E5E7EB", marginBottom: 32 }}>
              <div style={{ width: "100%", height: 420, background: "#111", overflow: "hidden", position: "relative" }}>
                <img
                  src={images[activeImageIdx]}
                  alt={vehicle.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={{ display: "flex", gap: 10, padding: 12, overflowX: "auto", background: "#F9FAFB" }}>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIdx(i)}
                      style={{
                        width: 80,
                        height: 56,
                        borderRadius: 8,
                        overflow: "hidden",
                        padding: 0,
                        border: activeImageIdx === i ? "2px solid var(--pink-700, #8B1E3F)" : "2px solid transparent",
                        cursor: "pointer",
                        opacity: activeImageIdx === i ? 1 : 0.7,
                      }}
                    >
                      <img src={img} alt={`Thumb ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Specs Grid */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "24px",
                border: "1px solid #E5E7EB",
                marginBottom: 32,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "#111827" }}>
                Vehicle Specifications
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
                <div style={{ background: "#F9FAFB", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Category</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", textTransform: "capitalize" }}>
                    {vehicle.vehicleType.replace("_", " ")}
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Seating</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    👥 {vehicle.seatingCapacity} Passengers
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Fuel Type</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", textTransform: "capitalize" }}>
                    ⛽ {vehicle.fuelType}
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Transmission</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", textTransform: "capitalize" }}>
                    ⚙️ {vehicle.transmission}
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Registration</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    🔒 {vehicle.registrationNumber}
                  </div>
                </div>

                <div style={{ background: "#F9FAFB", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Location</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    📍 {vehicle.city}
                  </div>
                </div>
              </div>

              {/* Features List */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 10 }}>
                    Comfort & Convenience Highlights
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {vehicle.features.map((feat, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#EEF2FF",
                          color: "#3730A3",
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description & Overview */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "24px",
                border: "1px solid #E5E7EB",
                marginBottom: 32,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px", color: "#111827" }}>
                About This Vehicle
              </h3>
              <p style={{ fontSize: 15, color: "#4B5563", lineHeight: 1.7, margin: 0 }}>
                {vehicle.description || "Premium verified vehicle available for FlipsAura wedding rentals and transportation."}
              </p>

              {vehicle.serviceArea && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#F9FAFB", borderRadius: 8, fontSize: 13, color: "#4B5563" }}>
                  <b>Service Area:</b> {vehicle.serviceArea}
                </div>
              )}
            </div>

            {/* Provider Profile Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "24px",
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "var(--pink-50, #FDF2F4)",
                    color: "var(--pink-700, #8B1E3F)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  🚘
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 16, color: "#111827" }}>
                      {vehicle.owner?.vendorProfile?.businessName || vehicle.owner?.name || "Verified FlipsAura Partner"}
                    </h4>
                    <span style={{ fontSize: 12, background: "#ECFDF5", color: "#065F46", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                      ✓ Verified Fleet Owner
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
                    Pickup: {vehicle.pickupLocation || vehicle.city} · 100% Verified Documents
                  </p>
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#6B7280" }}>
                Direct Platform Guarantee
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Interactive Booking Card */}
          <div style={{ position: "sticky", top: 24 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                border: "1px solid #E5E7EB",
                boxShadow: "0 12px 36px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              {/* Service Tab Switcher */}
              <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                {supportsRental && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("rental")}
                    style={{
                      flex: 1,
                      padding: "16px 14px",
                      border: "none",
                      background: activeTab === "rental" ? "#fff" : "transparent",
                      color: activeTab === "rental" ? "var(--pink-700, #8B1E3F)" : "#6B7280",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      borderBottom: activeTab === "rental" ? "2px solid var(--pink-700, #8B1E3F)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    ⏱️ Rent for a Period
                  </button>
                )}

                {supportsTransport && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("transport")}
                    style={{
                      flex: 1,
                      padding: "16px 14px",
                      border: "none",
                      background: activeTab === "transport" ? "#fff" : "transparent",
                      color: activeTab === "transport" ? "var(--pink-700, #8B1E3F)" : "#6B7280",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      borderBottom: activeTab === "transport" ? "2px solid var(--pink-700, #8B1E3F)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🚌 Book Transport
                  </button>
                )}
              </div>

              {/* Form Body */}
              <div style={{ padding: "24px" }}>
                {error && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: "#FEE2E2",
                      color: "#991B1B",
                      fontSize: 13,
                      marginBottom: 16,
                      border: "1px solid #FCA5A5",
                    }}
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleBookingSubmit}>
                  {/* TAB 1: RENT FOR A PERIOD */}
                  {activeTab === "rental" && (
                    <div>
                      {/* Price header */}
                      <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #F3F4F6" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span style={{ fontSize: 26, fontWeight: 800, color: "var(--pink-700, #8B1E3F)" }}>
                            ₹{vehicle.rentalPricing?.pricePerDay?.toLocaleString("en-IN") || 0}
                          </span>
                          <span style={{ color: "#6B7280", fontSize: 14 }}>/ day</span>
                          {vehicle.rentalPricing?.pricePerHour > 0 && (
                            <span style={{ color: "#9CA3AF", fontSize: 13 }}>
                              (or ₹{vehicle.rentalPricing.pricePerHour}/hr)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                          Included {vehicle.rentalPricing?.includedKmPerDay || 200} km/day · Extra ₹{vehicle.rentalPricing?.extraKmRate || 15}/km
                        </div>
                      </div>

                      {/* Date & Time Pickers */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Start Date *
                          </label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split("T")[0]}
                            value={rentalForm.startDate}
                            onChange={(e) => setRentalForm({ ...rentalForm, startDate: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={rentalForm.startTime}
                            onChange={(e) => setRentalForm({ ...rentalForm, startTime: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            End Date *
                          </label>
                          <input
                            type="date"
                            required
                            min={rentalForm.startDate || new Date().toISOString().split("T")[0]}
                            value={rentalForm.endDate}
                            onChange={(e) => setRentalForm({ ...rentalForm, endDate: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            End Time
                          </label>
                          <input
                            type="time"
                            value={rentalForm.endTime}
                            onChange={(e) => setRentalForm({ ...rentalForm, endTime: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                          />
                        </div>
                      </div>

                      {/* Pickup & Return */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                          Pickup / Delivery Location
                        </label>
                        <input
                          type="text"
                          value={rentalForm.pickupLocation}
                          onChange={(e) => setRentalForm({ ...rentalForm, pickupLocation: e.target.value })}
                          placeholder="e.g. Airport, Hotel, or Home Address"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                        />
                      </div>

                      {/* Self Drive Toggle */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <input
                          type="checkbox"
                          id="selfDrive"
                          checked={rentalForm.selfDrive}
                          onChange={(e) => setRentalForm({ ...rentalForm, selfDrive: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: "var(--pink-700, #8B1E3F)" }}
                        />
                        <label htmlFor="selfDrive" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>
                          I want self-drive rental (valid driving license required)
                        </label>
                      </div>

                      {/* Availability Check Feedback */}
                      {checkingAvail && (
                        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, textAlign: "center" }}>
                          Checking dates availability...
                        </div>
                      )}

                      {availResult && (
                        <div
                          style={{
                            padding: "12px",
                            borderRadius: 8,
                            marginBottom: 16,
                            background: availResult.available ? "#F0FDF4" : "#FEF2F2",
                            border: `1px solid ${availResult.available ? "#BBF7D0" : "#FECACA"}`,
                            fontSize: 13,
                          }}
                        >
                          {availResult.available ? (
                            <div>
                              <div style={{ color: "#166534", fontWeight: 700, marginBottom: 6 }}>
                                ✓ Vehicle is Available for this Period!
                              </div>
                              {availResult.pricing && (
                                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Duration:</span>
                                    <b>{availResult.pricing.durationDays} day(s) ({availResult.pricing.durationHours} hrs)</b>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Base Rental:</span>
                                    <span>₹{availResult.pricing.basePrice?.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Refundable Deposit:</span>
                                    <span>₹{availResult.pricing.securityDeposit?.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      borderTop: "1px dashed #cbd5e1",
                                      marginTop: 6,
                                      paddingTop: 6,
                                      fontWeight: 800,
                                      color: "var(--pink-700, #8B1E3F)",
                                      fontSize: 14,
                                    }}
                                  >
                                    <span>Total Estimate:</span>
                                    <span>₹{availResult.pricing.totalAmount?.toLocaleString("en-IN")}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: "#991B1B" }}>
                              ✕ {availResult.reason || availResult.error || "Unavailable for selected dates."}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: BOOK FOR TRANSPORT */}
                  {activeTab === "transport" && (
                    <div>
                      {/* Price header */}
                      <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #F3F4F6" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          {vehicle.transportPricing?.pricingType === "quote" ? (
                            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--pink-700, #8B1E3F)" }}>
                              Custom Quote Trip
                            </span>
                          ) : (
                            <>
                              <span style={{ fontSize: 26, fontWeight: 800, color: "var(--pink-700, #8B1E3F)" }}>
                                ₹{vehicle.transportPricing?.baseTripPrice?.toLocaleString("en-IN") || 0}
                              </span>
                              <span style={{ color: "#6B7280", fontSize: 14 }}>/ fixed trip</span>
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                          Includes professional chauffeur · Capacity up to {vehicle.seatingCapacity} passengers
                        </div>
                      </div>

                      {/* One way vs Round trip */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                        <button
                          type="button"
                          onClick={() => setTransportForm({ ...transportForm, tripType: "one_way" })}
                          style={{
                            padding: "8px",
                            borderRadius: 8,
                            border: transportForm.tripType === "one_way" ? "2px solid var(--pink-700, #8B1E3F)" : "1px solid #D1D5DB",
                            background: transportForm.tripType === "one_way" ? "var(--pink-50, #FDF2F4)" : "#fff",
                            color: transportForm.tripType === "one_way" ? "var(--pink-700, #8B1E3F)" : "#374151",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          One-Way Trip
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransportForm({ ...transportForm, tripType: "round_trip" })}
                          style={{
                            padding: "8px",
                            borderRadius: 8,
                            border: transportForm.tripType === "round_trip" ? "2px solid var(--pink-700, #8B1E3F)" : "1px solid #D1D5DB",
                            background: transportForm.tripType === "round_trip" ? "var(--pink-50, #FDF2F4)" : "#fff",
                            color: transportForm.tripType === "round_trip" ? "var(--pink-700, #8B1E3F)" : "#374151",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Round-Trip
                        </button>
                      </div>

                      {/* Travel Date & Pickup Time */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Travel Date *
                          </label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split("T")[0]}
                            value={transportForm.travelDate}
                            onChange={(e) => setTransportForm({ ...transportForm, travelDate: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                            Pickup Time
                          </label>
                          <input
                            type="time"
                            value={transportForm.pickupTime}
                            onChange={(e) => setTransportForm({ ...transportForm, pickupTime: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                          />
                        </div>
                      </div>

                      {/* If Round Trip: Return date/time */}
                      {transportForm.tripType === "round_trip" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                              Return Date
                            </label>
                            <input
                              type="date"
                              min={transportForm.travelDate || new Date().toISOString().split("T")[0]}
                              value={transportForm.returnDate}
                              onChange={(e) => setTransportForm({ ...transportForm, returnDate: e.target.value })}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                              Return Time
                            </label>
                            <input
                              type="time"
                              value={transportForm.returnTime}
                              onChange={(e) => setTransportForm({ ...transportForm, returnTime: e.target.value })}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Pickup Address */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                          Pickup Address / Landmark *
                        </label>
                        <input
                          type="text"
                          required
                          value={transportForm.pickupAddress}
                          onChange={(e) => setTransportForm({ ...transportForm, pickupAddress: e.target.value })}
                          placeholder="e.g. Hotel Maurya, Fraser Road, Patna"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                        />
                      </div>

                      {/* Destination Address */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                          Destination Address / Wedding Venue *
                        </label>
                        <input
                          type="text"
                          required
                          value={transportForm.destinationAddress}
                          onChange={(e) => setTransportForm({ ...transportForm, destinationAddress: e.target.value })}
                          placeholder="e.g. Gyan Bhawan, Patna / Outstation Venue"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                        />
                      </div>

                      {/* Passenger count */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                          Passenger Count (Max {vehicle.seatingCapacity})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={vehicle.seatingCapacity}
                          value={transportForm.passengers}
                          onChange={(e) => setTransportForm({ ...transportForm, passengers: e.target.value })}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                        />
                      </div>

                      {/* Special notes */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                          Special Notes (e.g. Barat Entry, Groom floral car, Guest luggage)
                        </label>
                        <textarea
                          rows={2}
                          value={transportForm.specialNotes}
                          onChange={(e) => setTransportForm({ ...transportForm, specialNotes: e.target.value })}
                          placeholder="Any specific requests or timing instructions..."
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, resize: "none" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Customer Contact Details */}
                  <div style={{ padding: "14px 0", borderTop: "1px solid #F3F4F6", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 10 }}>
                      Customer Contact Details
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name *"
                        value={contact.name}
                        onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <input
                          type="tel"
                          required
                          placeholder="Phone / WhatsApp *"
                          value={contact.phone}
                          onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                        />
                        <input
                          type="email"
                          required
                          placeholder="Email Address *"
                          value={contact.email}
                          onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={bookingBusy || (activeTab === "rental" && availResult && !availResult.available)}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "linear-gradient(135deg, #8B1E3F 0%, #A82046 100%)",
                      boxShadow: "0 4px 14px rgba(139,30,63,0.35)",
                    }}
                  >
                    {bookingBusy
                      ? "Submitting Request..."
                      : activeTab === "rental"
                      ? "Reserve / Request Rental"
                      : "Request Transport Booking"}
                  </button>

                  <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", margin: "12px 0 0", lineHeight: 1.4 }}>
                    🔒 Zero immediate charges. The provider will review your request and confirm availability directly.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
