"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/lib/constants";
import { Receipt, Search, ChevronRight, CheckCircle, Clock, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function VendorBillsPage() {
  const { apiFetch, user } = useAuth();
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [paymentStatus, setPaymentStatus] = useState("all");

  useEffect(() => {
    fetchBills();
  }, [paymentStatus]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentStatus !== "all") params.append("paymentStatus", paymentStatus);

      const data = await apiFetch(`/api/vendor-bills?${params.toString()}`);
      setBills(data.bills);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isVendor = user?.role === ROLES.VENDOR;
  const isFinance = user?.role === ROLES.FINANCE || user?.role === ROLES.SUPER_ADMIN;

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200 text-xs font-medium flex items-center w-fit"><Clock className="w-3 h-3 mr-1"/> Pending</span>;
      case "processing": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200 text-xs font-medium flex items-center w-fit"><AlertCircle className="w-3 h-3 mr-1"/> Processing</span>;
      case "paid": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200 text-xs font-medium flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1"/> Paid</span>;
      case "rejected": return <span className="bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200 text-xs font-medium flex items-center w-fit"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>;
      default: return null;
    }
  };

  if (![ROLES.FINANCE, ROLES.SUPER_ADMIN, ROLES.DEAN, ROLES.ADMIN, ROLES.VENDOR].includes(user?.role)) {
    return (
      <div className="p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-slate-600 mt-2">You don't have permission to view vendor bills.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
             {isVendor ? "My Invoices & Payments" : "Vendor Billing & Finance"}
          </h1>
          <p className="page-subtitle">
            {isVendor ? "Track your payment statuses for delivered services." : "Manage and process payments for awarded vendor contracts."}
          </p>
        </div>
      </div>

      {stats && !isVendor && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon warning"><Clock size={22} /></div>
            <div className="stat-content">
              <p>Pending Amount</p>
              <h3>₹{stats.pending?.total.toLocaleString("en-IN") || 0}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><TrendingUp size={22} /></div>
            <div className="stat-content">
              <p>Processing</p>
              <h3>₹{stats.processing?.total.toLocaleString("en-IN") || 0}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><CheckCircle size={22} /></div>
            <div className="stat-content">
              <p>Total Paid</p>
              <h3>₹{stats.paid?.total.toLocaleString("en-IN") || 0}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ display: "flex", gap: "var(--space-4)", flexDirection: "row", flexWrap: "wrap", alignItems: "center", padding: "var(--space-4)" }}>
        <div style={{ minWidth: "200px" }}>
          <label className="form-label" style={{ marginBottom: "var(--space-1)" }}>Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="form-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading && bills.length === 0 ? (
          <div className="empty-state">Loading bills...</div>
        ) : error ? (
          <div className="empty-state" style={{ color: "var(--accent-danger)" }}>{error}</div>
        ) : bills.length === 0 ? (
          <div className="empty-state">
            <Receipt style={{ width: 48, height: 48, margin: "0 auto var(--space-3)", opacity: 0.5 }} />
            <h3>No bills found</h3>
            <p>There are no bills matching your current filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {!isVendor && <th>Vendor</th>}
                  <th>Event & Requirement</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    {!isVendor && (
                       <td>
                         <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{bill.vendor.companyName}</div>
                         <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "4px" }}>GST: {bill.vendor.gstNumber || "N/A"}</div>
                       </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{bill.quotationRequest.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "4px" }}>Event: {bill.event.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Inv #: {bill.billNumber || "Not Provided"}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>₹{Number(bill.totalAmount).toLocaleString("en-IN")}</div>
                      {bill.taxAmount && <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "4px" }}>Inc. Tax: ₹{Number(bill.taxAmount).toLocaleString("en-IN")}</div>}
                    </td>
                    <td>
                      {getStatusBadge(bill.paymentStatus)}
                    </td>
                    <td className="data-mono text-muted">
                      {formatDate(bill.createdAt)}
                    </td>
                    <td>
                      <Link href={`/vendor-bills/${bill.id}`} className="btn btn-ghost btn-sm">
                        View Details <ChevronRight size={18} />
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
