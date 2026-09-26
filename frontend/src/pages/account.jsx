"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/bookings");
      const j = await r.json();
      if (j.ok) setBookings(j.data.bookings);
      setLoading(false);
    })();
  }, []);

  if (!user) return <div className="container loading">Loading…</div>;

  return (
    <section className="section">
      <div className="container">
        <h1>Hi, {user.name}</h1>
        <p style={{ color: "var(--muted)" }}>{user.email} · {user.role}</p>

        <h2 style={{ marginTop: 30 }}>Your bookings</h2>
        {loading ? <div className="loading">Loading…</div> :
         bookings.length === 0 ? <div className="empty">You haven't booked anything yet.</div> : (
          <table className="data" style={{ marginTop: 16 }}>
            <thead><tr><th>Item</th><th>Event date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id}>
                  <td>{b.item?.title || "—"}</td>
                  <td>{b.eventDate || "—"}</td>
                  <td>₹{b.amount?.toLocaleString("en-IN")}</td>
                  <td><span className={`tag ${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
