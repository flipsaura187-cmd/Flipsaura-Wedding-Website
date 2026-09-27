"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "@/compat/navigation";
import Script from "@/compat/Script";
import { useAuth } from "@/context/AuthContext";

import api from "@/api/axios";
export default function CheckoutPageCom() {
  const sp = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const itemId = sp.get("itemId");
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
      // 1. Create booking
      const { data: j1 } = await api.post("/api/bookings", { itemId, ...form });
      if (!j1.ok) throw new Error(j1.error || "Could not create booking");
      const booking = j1.data.booking;

      // 2. Create Razorpay order
      const { data: j2 } = await api.post("/api/payment/create-order", { bookingId: booking._id });
      if (!j2.ok) throw new Error(j2.error || "Payment init failed");

      // 3. Open Razorpay checkout
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
          const { data: j3 } = await api.post("/api/payment/verify", {
            bookingId: booking._id,
            ...resp,
          });
          if (j3.ok) router.push(`/account?booking=${booking._id}`);
          else setError(j3.error || "Verification failed");
        },
        modal: { ondismiss: () => setBusy(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (!itemId) return <div className="container empty">Pick an item first.</div>;
  if (!item) return <div className="container loading">Loading…</div>;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <section className="section">
        <div className="container checkout">
          <div>
            <h1>Checkout</h1>
            <p style={{ color: "var(--muted)" }}>Fill in your details to confirm the booking.</p>
            {error && <div className="error">{error}</div>}
            <form onSubmit={submit} style={{ marginTop: 20 }}>
              <div className="field"><label>Full name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="field"><label>Phone</label><input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="field"><label>Event date</label><input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} /></div>
              <div className="field"><label>Address</label><textarea rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="field"><label>Notes (optional)</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Processing…" : `Pay ₹${item.price.toLocaleString("en-IN")} with Razorpay`}</button>
            </form>
          </div>
          <aside className="summary">
            <h3>Order summary</h3>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              {item.images?.[0] && <img src={item.images[0]} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />}
              <div>
                <b>{item.title}</b>
                <div className="card-meta">{item.city}</div>
              </div>
            </div>
            <div className="row"><span>Item price</span><b>₹{item.price.toLocaleString("en-IN")}</b></div>
            <div className="row"><span>Taxes & fees</span><b>Included</b></div>
            <div className="row total"><span>Total</span><span>₹{item.price.toLocaleString("en-IN")}</span></div>
          </aside>
        </div>
      </section>
    </>
  );
}
