"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get("/api/admin/stats")
      .then((r) => r.data)
      .then((j) => j.ok && setStats(j.data.stats));
  }, []);

  if (!stats) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center text-muted">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading admin dashboard statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Admin Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Real-time marketplace activity & metrics overview</p>
        </div>
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
        >
          Manage Vendors →
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Total Users</span>
          <b className="text-2xl sm:text-3xl font-extrabold text-ink mt-2 font-sans">{stats.users}</b>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Vendors</span>
          <b className="text-2xl sm:text-3xl font-extrabold text-ink mt-2 font-sans">{stats.vendors || 0}</b>
        </div>

        <div
          className={`rounded-2xl p-4 sm:p-5 border shadow-sm flex flex-col justify-between ${
            stats.pendingVendors > 0
              ? "bg-blue-50/70 border-blue-200 text-blue-900"
              : "bg-white border-brand-100"
          }`}
        >
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Pending KYC</span>
          <b
            className={`text-2xl sm:text-3xl font-extrabold mt-2 font-sans ${
              stats.pendingVendors > 0 ? "text-blue-700" : "text-ink"
            }`}
          >
            {stats.pendingVendors || 0}
          </b>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Active Items</span>
          <b className="text-2xl sm:text-3xl font-extrabold text-ink mt-2 font-sans">{stats.items}</b>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Bookings</span>
          <b className="text-2xl sm:text-3xl font-extrabold text-ink mt-2 font-sans">{stats.bookings}</b>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Revenue</span>
          <b className="text-2xl sm:text-3xl font-extrabold text-brand-700 mt-2 font-sans truncate">
            ₹{stats.revenue?.toLocaleString("en-IN")}
          </b>
        </div>
      </div>

      {/* Action / Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-base text-ink mb-1.5 flex items-center gap-2">
              <span>🏪</span> Vendor Verification Queue
            </h4>
            <p className="text-xs sm:text-sm text-muted mb-5 leading-relaxed">
              {stats.pendingVendors || 0} vendor applications awaiting KYC document review and administrative approval.
            </p>
          </div>
          <div>
            <Link
              href="/admin/vendors?status=under_review"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition"
            >
              Open Review Queue →
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-base text-ink mb-1.5 flex items-center gap-2">
              <span>🏷️</span> Wedding Categories
            </h4>
            <p className="text-xs sm:text-sm text-muted mb-5 leading-relaxed">
              Manage wedding marketplace categories, icons, SEO priority, and banner imagery.
            </p>
          </div>
          <div>
            <Link
              href="/admin/categories"
              className="inline-flex items-center px-4 py-2 rounded-xl border border-brand-200 hover:bg-brand-50 text-ink font-medium text-xs transition"
            >
              Manage Categories →
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-base text-ink mb-1.5 flex items-center gap-2">
              <span>📦</span> Listed Services & Packages
            </h4>
            <p className="text-xs sm:text-sm text-muted mb-5 leading-relaxed">
              Review vendor services, pricing packages, portfolio assets, and active listings.
            </p>
          </div>
          <div>
            <Link
              href="/admin/items"
              className="inline-flex items-center px-4 py-2 rounded-xl border border-brand-200 hover:bg-brand-50 text-ink font-medium text-xs transition"
            >
              Manage Items →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
