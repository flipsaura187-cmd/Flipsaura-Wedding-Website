"use client";
import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const load = () => fetch("/api/admin/users").then(r => r.json()).then(j => j.ok && setUsers(j.data.users));
  useEffect(() => { load(); }, []);

  const update = async (id, body) => {
    await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    load();
  };

  return (
    <>
      <h1>Users</h1>
      <table className="data">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Vendor approved</th><th></th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={e => update(u._id, { role: e.target.value })}>
                  <option value="user">user</option>
                  <option value="vendor">vendor</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>{u.role === "vendor" ? (u.vendorProfile?.approved ? "Yes" : "No") : "—"}</td>
              <td>
                {u.role === "vendor" && (
                  <button className="btn btn-ghost" onClick={() => update(u._id, { approved: !u.vendorProfile?.approved })}>
                    {u.vendorProfile?.approved ? "Revoke" : "Approve"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
