"use client";
import { useEffect, useState } from "react";

export default function VendorBookings() {
  const [list, setList] = useState([]);
  const load = () => fetch("/api/bookings").then(r => r.json()).then(j => j.ok && setList(j.data.bookings));
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await fetch(`/api/bookings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };

  return (
    <>
      <h1>Bookings</h1>
      <table className="data">
        <thead><tr><th>Item</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>
          {list.map(b => (
            <tr key={b._id}>
              <td>{b.item?.title || "—"}</td>
              <td>{b.name}<br/><small>{b.phone}</small></td>
              <td>{b.eventDate || "—"}</td>
              <td>₹{b.amount?.toLocaleString("en-IN")}</td>
              <td><span className={`tag ${b.status}`}>{b.status}</span></td>
              <td>
                <select value={b.status} onChange={e => setStatus(b._id, e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
