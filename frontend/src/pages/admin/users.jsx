"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    vendors: 0,
    admins: 0,
    phoneVerified: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // Filter States
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("all");

  // User Details Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", role: "user", isPhoneVerified: false });
  const [updating, setUpdating] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const { data } = await api.get("/api/admin/users");
      if (data?.ok) {
        setUsers(data.data.users || []);
        if (data.data.stats) setStats(data.data.stats);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      setErrorMsg(err.response?.data?.error || err.message || "Failed to load user directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "all") {
        const uRole = (u.role || "user").toLowerCase();
        if (roleFilter === "customer" && uRole !== "user" && uRole !== "customer") return false;
        if (roleFilter === "vendor" && uRole !== "vendor") return false;
        if (roleFilter === "admin" && uRole !== "admin") return false;
      }

      // Phone verification filter
      if (phoneFilter === "verified" && !u.isPhoneVerified) return false;
      if (phoneFilter === "unverified" && u.isPhoneVerified) return false;

      // Keyword search
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = (u.name || "").toLowerCase().includes(q);
        const emailMatch = (u.email || "").toLowerCase().includes(q);
        const phoneMatch = (u.phone || "").toLowerCase().includes(q);
        const bNameMatch = (u.vendorProfile?.businessName || "").toLowerCase().includes(q);
        const cityMatch = (u.vendorProfile?.city || "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch && !bNameMatch && !cityMatch) return false;
      }

      return true;
    });
  }, [users, roleFilter, phoneFilter, search]);

  const handleUpdate = async (id, body) => {
    try {
      const { data } = await api.put("/api/admin/users", { id, ...body });
      if (data?.ok) {
        setActionMsg("User updated successfully");
        setTimeout(() => setActionMsg(""), 3000);
        loadUsers();
      }
    } catch (err) {
      console.error("Update user error:", err);
      alert(err.response?.data?.error || err.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name || user.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data } = await api.delete(`/api/admin/users/${user._id}`);
      if (data?.ok) {
        setActionMsg(`User "${user.name || user.email}" removed successfully`);
        setTimeout(() => setActionMsg(""), 3500);
        if (detailsModalOpen && selectedUser?._id === user._id) {
          setDetailsModalOpen(false);
          setSelectedUser(null);
        }
        loadUsers();
      } else {
        alert(data?.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      alert(err.response?.data?.error || err.message || "Failed to delete user");
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name || "",
      phone: u.phone || "",
      role: u.role || "user",
      isPhoneVerified: Boolean(u.isPhoneVerified),
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      const { data } = await api.put("/api/admin/users", {
        id: editingUser._id,
        ...editForm,
      });
      if (data?.ok) {
        setActionMsg("User details saved successfully");
        setTimeout(() => setActionMsg(""), 3000);
        setEditModalOpen(false);
        loadUsers();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to save user changes");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-lg shadow-sm">
              👥
            </span>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-ink">
              All Users Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            Complete database of all registered Customers, Vendors, and Administrators on FlipsAura.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-ink text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>🔄</span> Refresh
          </button>
          <Link
            href="/admin/vendors"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition flex items-center gap-1.5"
          >
            <span>🏪</span> Vendor KYC Portal →
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>{actionMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-brand-100 shadow-xs">
          <span className="text-[11px] font-bold text-muted uppercase block">Total Accounts</span>
          <span className="text-2xl font-serif font-bold text-ink mt-0.5 block">{stats.total || users.length}</span>
          <span className="text-[10px] text-muted">All registered users</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase block">Customers</span>
          <span className="text-2xl font-serif font-bold text-blue-700 mt-0.5 block">{stats.customers}</span>
          <span className="text-[10px] text-blue-600 font-medium">Regular users</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 uppercase block">Vendors</span>
          <span className="text-2xl font-serif font-bold text-purple-700 mt-0.5 block">{stats.vendors}</span>
          <span className="text-[10px] text-purple-600 font-medium">Business partners</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase block">Administrators</span>
          <span className="text-2xl font-serif font-bold text-amber-800 mt-0.5 block">{stats.admins}</span>
          <span className="text-[10px] text-amber-700 font-medium">Platform staff</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Phone Verified</span>
          <span className="text-2xl font-serif font-bold text-emerald-700 mt-0.5 block">{stats.phoneVerified}</span>
          <span className="text-[10px] text-emerald-600 font-medium">SMS / WhatsApp OTP</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-brand-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by Name, Email, Phone, Business Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-brand-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-200 text-xs font-semibold text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers (Users)</option>
            <option value="vendor">Vendors</option>
            <option value="admin">Administrators</option>
          </select>

          {/* Verification Filter */}
          <select
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-200 text-xs font-semibold text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Verification</option>
            <option value="verified">Phone Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>

          {(search || roleFilter !== "all" || phoneFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setPhoneFilter("all");
              }}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Users Table / Directory */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink/80">
            <thead className="bg-surface text-xs font-semibold text-muted uppercase tracking-wider border-b border-brand-100">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Mobile & Verification</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status / KYC</th>
                <th className="px-5 py-4">Registered On</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/70">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-muted">
                    <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-muted">
                    <span className="text-3xl block mb-1">🔍</span>
                    <p className="text-sm font-semibold text-ink">No users found</p>
                    <p className="text-xs text-muted mt-0.5">Try adjusting your search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const role = String(u.role || "user").toLowerCase();
                  const initials = (u.name || u.email || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const regDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={u._id} className="hover:bg-brand-50/30 transition-colors">
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-ink block truncate max-w-xs">
                              {u.name || "Unnamed User"}
                            </span>
                            <span className="text-xs text-muted block truncate max-w-xs">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number & Verification Badge */}
                      <td className="px-5 py-4">
                        {u.phone ? (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-ink block">{u.phone}</span>
                            {u.isPhoneVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                ⚠️ Unverified
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">No phone added</span>
                        )}
                      </td>

                      {/* Role Selector */}
                      <td className="px-5 py-4">
                        <select
                          value={role}
                          onChange={(e) => handleUpdate(u._id, { role: e.target.value })}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer ${
                            role === "admin"
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : role === "vendor"
                              ? "bg-purple-50 text-purple-900 border-purple-200"
                              : "bg-blue-50 text-blue-900 border-blue-200"
                          }`}
                        >
                          <option value="user">User (Customer)</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>

                      {/* Vendor Status / Profile */}
                      <td className="px-5 py-4">
                        {role === "vendor" ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.vendorProfile?.approved
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {u.vendorProfile?.approved ? "Approved Vendor" : "Pending KYC"}
                            </span>
                            {u.vendorProfile?.businessName && (
                              <span className="text-[11px] text-muted block truncate max-w-xs font-medium">
                                🏬 {u.vendorProfile.businessName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">Active Customer</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                        {regDate}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setDetailsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-brand-200 text-ink/80 hover:text-brand-600 hover:bg-brand-50 transition text-xs font-semibold cursor-pointer"
                            title="View Full Profile Details"
                          >
                            👁️ View
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg border border-brand-200 text-ink/80 hover:text-brand-600 hover:bg-brand-50 transition text-xs font-semibold cursor-pointer"
                            title="Edit User Info"
                          >
                            ✎ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition text-xs font-semibold cursor-pointer"
                            title="Delete Account"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Count Summary */}
        <div className="px-5 py-3 bg-surface border-t border-brand-100 flex items-center justify-between text-xs text-muted">
          <span>
            Showing <b>{filteredUsers.length}</b> of <b>{users.length}</b> users
          </span>
          <span>FlipsAura Platform Directory</span>
        </div>
      </div>

      {/* USER DETAILS MODAL */}
      {detailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-brand-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg font-bold">
                  {(selectedUser.name || "U")[0].toUpperCase()}
                </span>
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink">
                    {selectedUser.name || "Unnamed User"}
                  </h3>
                  <span className="text-xs text-muted block">{selectedUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-brand-200 text-muted hover:text-ink flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4 bg-brand-50/50 rounded-xl border border-brand-100">
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase block">User ID</span>
                  <span className="text-xs font-mono font-semibold text-ink truncate block">
                    {selectedUser._id}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase block">Account Role</span>
                  <span className="text-xs font-bold uppercase text-brand-700 block">
                    {selectedUser.role}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase block">Mobile Phone</span>
                  <span className="text-xs font-semibold text-ink block">
                    {selectedUser.phone || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase block">Phone Verification</span>
                  <span className={`text-xs font-bold block ${selectedUser.isPhoneVerified ? "text-emerald-700" : "text-amber-700"}`}>
                    {selectedUser.isPhoneVerified ? "✓ Verified" : "⚠️ Unverified"}
                  </span>
                </div>
              </div>

              {/* Vendor Profile Info */}
              {selectedUser.role === "vendor" && (
                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 space-y-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900">
                    🏬 Vendor Business Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted block text-[10px]">Business Name</span>
                      <b className="text-ink">{selectedUser.vendorProfile?.businessName || "—"}</b>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Owner Name</span>
                      <b className="text-ink">{selectedUser.vendorProfile?.ownerName || "—"}</b>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">City & State</span>
                      <span className="text-ink font-medium">
                        {selectedUser.vendorProfile?.city || "—"}, {selectedUser.vendorProfile?.state || ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">KYC Status</span>
                      <span className="font-bold text-purple-700 uppercase">
                        {selectedUser.vendorProfile?.verificationStatus || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted pt-2 border-t border-brand-100">
                <div>
                  <span className="block font-semibold">Account Created:</span>
                  <span>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString("en-IN") : "—"}</span>
                </div>
                <div>
                  <span className="block font-semibold">Last Updated:</span>
                  <span>{selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString("en-IN") : "—"}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-brand-50/50 border-t border-brand-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const toggled = !selectedUser.isPhoneVerified;
                  handleUpdate(selectedUser._id, { isPhoneVerified: toggled });
                  setSelectedUser({ ...selectedUser, isPhoneVerified: toggled });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  selectedUser.isPhoneVerified
                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {selectedUser.isPhoneVerified ? "Mark Phone as Unverified" : "✓ Mark Phone as Verified"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    openEditModal(selectedUser);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
                >
                  ✎ Edit User
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl border border-brand-200 bg-white text-ink font-semibold text-xs hover:bg-brand-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-brand-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-ink">Edit User Account</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-muted hover:text-ink font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">Account Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                >
                  <option value="user">User (Customer)</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editVerified"
                  checked={editForm.isPhoneVerified}
                  onChange={(e) => setEditForm({ ...editForm, isPhoneVerified: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-brand-300 focus:ring-brand-500"
                />
                <label htmlFor="editVerified" className="text-xs font-semibold text-ink">
                  Phone Number Verified
                </label>
              </div>

              <div className="pt-4 border-t border-brand-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-brand-200 text-xs font-semibold hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs disabled:opacity-60"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
