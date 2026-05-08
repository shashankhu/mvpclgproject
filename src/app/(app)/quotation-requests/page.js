"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ROLES, QUOTATION_REQUEST_STATUS, VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS } from "@/lib/constants";
import { ReceiptText, Search, Filter, Plus, ChevronRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function QuotationRequestsPage() {
  const { apiFetch, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, [status, category]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (category !== "all") params.append("category", category);

      const data = await apiFetch(`/api/quotation-requests?${params.toString()}`);
      setRequests(data.quotationRequests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isVendor = user?.role === ROLES.VENDOR;

  const getStatusBadge = (status) => {
    switch (status) {
      case "open": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">Open for Bidding</span>;
      case "closed": return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-xs font-medium">Closed</span>;
      case "awarded": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">Awarded</span>;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isVendor ? "Available Quotation Requests" : "Quotation Requests"}
          </h1>
          <p className="page-subtitle">
            {isVendor ? "Browse and submit quotations for upcoming events." : "Manage requests sent to vendors for event fulfillment."}
          </p>
        </div>
        
        {!isVendor && (
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
             <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", fontStyle: "italic", padding: "var(--space-2) var(--space-3)" }}>Create new requests from the Event Approval page</span>
          </div>
        )}
      </div>

      <div className="card" style={{ display: "flex", gap: "var(--space-4)", flexDirection: "row", flexWrap: "wrap", alignItems: "center", padding: "var(--space-4)" }}>
        <div style={{ minWidth: "200px" }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-select"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="awarded">Awarded</option>
          </select>
        </div>
        {!isVendor && (
          <div style={{ minWidth: "200px" }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="all">All Categories</option>
              {VENDOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{VENDOR_CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading && requests.length === 0 ? (
          <div className="empty-state">Loading requests...</div>
        ) : error ? (
          <div className="empty-state" style={{ color: "var(--accent-danger)" }}>{error}</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <ReceiptText style={{ width: 48, height: 48, margin: "0 auto var(--space-3)", opacity: 0.5 }} />
            <h3>No requests found</h3>
            <p>
              {isVendor ? "There are no active requests matching your service categories right now." : "No quotation requests have been created yet."}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request Details</th>
                  <th>Category & Budget</th>
                  <th>Timeline</th>
                  {!isVendor && <th>Status & Bids</th>}
                  {isVendor && <th>Action</th>}
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const isExpired = req.deadline && new Date(req.deadline) < new Date() && req.status === "open";
                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{req.title}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "4px" }}>Event: {req.event.title}</div>
                      </td>
                      <td>
                        <span className="badge badge-progress">
                          {VENDOR_CATEGORY_LABELS[req.category]}
                        </span>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "4px" }}>
                          Budget: {req.budgetLimit ? `₹${Number(req.budgetLimit).toLocaleString("en-IN")}` : "Unspecified"}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                          <Clock style={{ width: 14, height: 14, color: "var(--text-muted)", marginRight: 4 }} /> 
                          {req.deadline ? formatDate(req.deadline) : "No deadline"}
                        </div>
                        {isExpired && <span style={{ fontSize: "var(--text-xs)", color: "var(--accent-danger)", fontWeight: 600 }}>Expired</span>}
                      </td>
                      
                      {!isVendor && (
                        <td>
                          {getStatusBadge(req.status)}
                          <div style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--text-muted)", marginTop: "4px" }}>
                            {req._count.quotations} {req._count.quotations === 1 ? 'Bid' : 'Bids'} Received
                          </div>
                        </td>
                      )}
                      
                      {isVendor && (
                        <td>
                           <Link href={`/quotation-requests/${req.id}`} className="btn btn-primary btn-sm">
                             Submit Quote
                           </Link>
                        </td>
                      )}
                      
                      <td>
                        <Link href={`/quotation-requests/${req.id}`} className="btn btn-ghost btn-sm">
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
