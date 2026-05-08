"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ROLES, VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS } from "@/lib/constants";
import { Building2, Search, Filter, ShieldCheck, ShieldAlert, ChevronRight, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function VendorsRegistryPage() {
  const { apiFetch, user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState(""); // "" | "true" | "false"

  useEffect(() => {
    fetchVendors();
  }, [search, category, verified]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (verified) params.append("verified", verified);

      const data = await apiFetch(`/api/vendors?${params.toString()}`);
      setVendors(data.vendors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE].includes(user?.role)) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-slate-600 mt-2">You don't have permission to view the vendor registry.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Registry</h1>
          <p className="page-subtitle">Manage and verify registered service providers.</p>
        </div>
        <div style={{ padding: "var(--space-2) var(--space-3)", background: "var(--accent-info-bg)", color: "var(--accent-info)", borderRadius: "var(--radius-md)", fontWeight: 500, fontSize: "var(--text-sm)", display: "flex", alignItems: "center" }}>
          <Building2 size={16} style={{ marginRight: 8 }} /> {vendors.length} Vendors Found
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: "flex", gap: "var(--space-4)", flexDirection: "row", flexWrap: "wrap", alignItems: "center", padding: "var(--space-4)" }}>
        <div style={{ flex: 1, position: "relative", minWidth: "200px" }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", width: 16, height: 16 }} />
          <input
            type="text"
            placeholder="Search company or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ minWidth: "200px" }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-select"
          >
            <option value="">All Categories</option>
            {VENDOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{VENDOR_CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: "150px" }}>
          <select
            value={verified}
            onChange={(e) => setVerified(e.target.value)}
            className="form-select"
          >
            <option value="">All Statuses</option>
            <option value="true">Verified</option>
            <option value="false">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading && vendors.length === 0 ? (
          <div className="empty-state">Loading vendors...</div>
        ) : error ? (
          <div className="empty-state" style={{ color: "var(--accent-danger)" }}>{error}</div>
        ) : vendors.length === 0 ? (
          <div className="empty-state">
            <Building2 style={{ width: 48, height: 48, margin: "0 auto var(--space-3)", opacity: 0.5 }} />
            <h3>No vendors found</h3>
            <p>Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Categories</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{vendor.companyName}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "4px" }}>Reg: {formatDate(vendor.createdAt)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{vendor.contactPerson}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{vendor.phone}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {vendor.categories.slice(0, 2).map((cat) => (
                          <span key={cat} className="badge badge-draft">
                            {VENDOR_CATEGORY_LABELS[cat]}
                          </span>
                        ))}
                        {vendor.categories.length > 2 && (
                          <span className="badge badge-draft">
                            +{vendor.categories.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {vendor.isVerified ? (
                        <span className="badge badge-approved">
                          <ShieldCheck size={14} /> Verified
                        </span>
                      ) : (
                        <span className="badge badge-pending">
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", marginRight: 4 }} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/vendors/${vendor.id}`} className="btn btn-ghost btn-sm">
                        View <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
