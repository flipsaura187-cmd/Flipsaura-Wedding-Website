"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/api/admin/users")
      .then((r) => r.data)
      .then((j) => {
        if (j.ok) setUsers(j.data.users || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id, body) => {
    await api.put("/api/admin/users", { id, ...body });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">User Directory</h1>
          <p className="text-sm text-muted mt-0.5">Manage platform accounts, permissions, and vendor roles</p>
        </div>
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
        >
          Open Vendor KYC Management →
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink/80">
            <thead className="bg-surface text-xs font-semibold text-muted uppercase tracking-wider border-b border-brand-100">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Vendor Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/70">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-muted">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-muted">
                    No users registered.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-4 font-semibold text-ink">
                      {u.name}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {u.email}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => update(u._id, { role: e.target.value })}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-brand-200 bg-white text-ink capitalize focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="user">User</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      {u.role === "vendor" ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.vendorProfile?.approved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {u.vendorProfile?.approved ? "Approved" : "Pending KYC"}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.role === "vendor" && (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => update(u._id, { approved: !u.vendorProfile?.approved })}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                              u.vendorProfile?.approved
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {u.vendorProfile?.approved ? "Revoke" : "Approve"}
                          </button>
                          <Link
                            href="/admin/vendors"
                            className="px-3 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
                          >
                            View KYC
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
