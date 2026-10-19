"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "@/compat/navigation";
import Script from "@/compat/Script";
import { useAuth } from "@/context/AuthContext";

import api from "@/api/axios";
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPageCom() {
  const sp = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const itemId = sp.get("itemId");
  const roomId = sp.get("roomId");
  const roomName = sp.get("roomName");
  const queryPrice = sp.get("price") ? Number(sp.get("price")) : null;
  const [item, setItem] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", eventDate: "", address: "", notes: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    (async () => {
      const { data: j } = await api.get(`/api/items/${itemId}`);
      if (j.ok) setItem(j.data.item);
    })();
  }, [itemId]);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name, email: user.email, phone: user.phone || "" }));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Razorpay payment gateway failed to load. Please check your internet connection.");
      }

      const payableAmount = queryPrice !== null && !isNaN(queryPrice) && queryPrice >= 0 ? queryPrice : (item?.price || 0);
      const bookingNotes = roomName
        ? (form.notes ? `${form.notes} (Room: ${roomName})` : `Selected Room: ${roomName}`)
        : form.notes;

      // 2. Create booking
      const { data: j1 } = await api.post("/api/bookings", {
        itemId,
        amount: payableAmount,
        notes: bookingNotes,
        ...form,
      });
      if (!j1.ok) throw new Error(j1.error || "Could not create booking");
      const booking = j1.data.booking;

      // 3. Create Razorpay order
      const { data: j2 } = await api.post("/api/payment/create-order", { bookingId: booking._id });
      if (!j2.ok) throw new Error(j2.error || "Payment init failed");

      // 4. Open Razorpay checkout
      const options = {
        key: j2.data.keyId,
        amount: j2.data.amount,
        currency: j2.data.currency,
        order_id: j2.data.orderId,
        name: "FlipsAura",
        description: item?.title || "Booking",
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#e63f87" },
        handler: async (resp) => {
          try {
            const { data: j3 } = await api.post("/api/payment/verify", {
              bookingId: booking._id,
              ...resp,
            });
            if (j3.ok) router.push(`/account?booking=${booking._id}`);
            else setError(j3.error || "Verification failed");
          } catch (err) {
            setError(err?.response?.data?.error || err.message || "Payment verification failed");
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setBusy(false);
        setError(response.error.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
      setBusy(false);
    }
  };

  if (!itemId) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center text-muted">
        Pick an item first before checking out.
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center text-brand-600 font-semibold animate-pulse">
        Loading checkout details…
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <section className="py-12 md:py-16 bg-white min-h-[80vh]">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-brand-100 shadow-xl shadow-brand-500/5">
              <h1 className="font-serif text-3xl font-bold text-ink mb-1">Checkout</h1>
              <p className="text-muted text-sm mb-6">
                Fill in your details to confirm your wedding service booking.
              </p>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Phone *
                    </label>
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Venue / Event Address *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any special requests or instructions for the vendor"
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-base bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all cursor-pointer mt-4"
                >
                  {busy
                    ? "Processing Payment…"
                    : `Pay ₹${((queryPrice !== null && !isNaN(queryPrice) && queryPrice >= 0) ? queryPrice : (item?.price || 0)).toLocaleString("en-IN")} with Razorpay`}
                </button>
              </form>
            </div>

            {/* Order summary */}
            <aside className="lg:col-span-5 bg-brand-50/70 p-6 sm:p-8 rounded-2xl border border-brand-100 space-y-5 lg:sticky lg:top-24">
              <h3 className="font-serif text-xl font-bold text-ink">Order Summary</h3>

              <div className="flex gap-3.5 items-center pb-4 border-b border-brand-100">
                {item.images?.[0] && (
                  <img
                    src={item.images[0]}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover border border-brand-200 shrink-0"
                  />
                )}
                <div>
                  <h4 className="font-bold text-ink text-sm line-clamp-2">{item.title}</h4>
                  <div className="text-xs text-muted mt-1">📍 {item.city || "India"}</div>
                  {roomName && (
                    <div className="inline-flex items-center gap-1 text-xs text-brand-700 font-bold bg-white px-2 py-0.5 rounded-md border border-brand-200 mt-1.5">
                      <span>🛏️</span> {roomName}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{roomName ? `Room tariff (${roomName})` : "Item price"}</span>
                  <span className="font-semibold text-ink">
                    ₹{((queryPrice !== null && !isNaN(queryPrice) && queryPrice >= 0) ? queryPrice : (item?.price || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Taxes & fees</span>
                  <span className="font-semibold text-emerald-600">Included</span>
                </div>
                <div className="flex justify-between text-base font-bold text-ink pt-3 border-t border-brand-200">
                  <span>Total Amount</span>
                  <span className="text-brand-700">
                    ₹{((queryPrice !== null && !isNaN(queryPrice) && queryPrice >= 0) ? queryPrice : (item?.price || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted pt-2 border-t border-brand-100 text-center">
                🔒 256-bit SSL encrypted secure Razorpay payment
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

