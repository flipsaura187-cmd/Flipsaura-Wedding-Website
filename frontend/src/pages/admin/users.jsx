"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const load = () =>
    api
      .get("/api/admin/users")
      .then((r) => r.data)
      .then((j) => j.ok && setUsers(j.data.users));

  useEffect(() => {
    load();
  }, []);

  const update = async (id, body) => {
    await api.put("/api/admin/users", { id, ...body });
    load();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Users</h1>
        <Link href="/admin/vendors" className="btn btn-primary" style={{ fontSize: 13 }}>
          Open Full Vendor Management →
        </Link>
      </div>

      <table className="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Vendor Approved</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => update(u._id, { role: e.target.value })}>
                  <option value="user">user</option>
                  <option value="vendor">vendor</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>{u.role === "vendor" ? (u.vendorProfile?.approved ? "Yes" : "No") : "—"}</td>
              <td>
                {u.role === "vendor" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => update(u._id, { approved: !u.vendorProfile?.approved })}
                    >
                      {u.vendorProfile?.approved ? "Revoke" : "Approve"}
                    </button>
                    <Link
                      href="/admin/vendors"
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #ddd" }}
                    >
                      View KYC
                    </Link>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
