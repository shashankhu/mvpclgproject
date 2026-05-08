"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { ROLES, VENDOR_CATEGORY_LABELS } from "@/lib/constants";
import { Building2, User, Phone, Mail, MapPin, CheckCircle, XCircle, FileText, Download, ShieldCheck, MailWarning, MapPinHouse, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function VendorDetailPage({ params }) {
  const { id } = use(params);
  const { apiFetch, user } = useAuth();
  
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/vendors/${id}`);
      setVendor(data.vendor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/vendors/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "verify" }),
      });
      await fetchVendor(); // Reload data
      setShowVerifyModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      alert("Please provide a reason for rejection.");
      return;
    }
    
    setActionLoading(true);
    try {
      await apiFetch(`/api/vendors/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      setShowRejectModal(false);
      setRejectReason("");
      await fetchVendor(); // Reload data
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isAdminOrDean = [ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading vendor details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!vendor) return <div className="p-8 text-center text-slate-500">Vendor not found</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      {/* Header Profile Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "var(--accent-primary-hover)", height: 100 }}></div>
        <div style={{ padding: "0 var(--space-8) var(--space-8)", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "-48px", marginBottom: "var(--space-6)" }}>
            <div style={{ height: 96, width: 96, borderRadius: "var(--radius-xl)", background: "var(--bg-surface)", border: "4px solid var(--bg-surface)", boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={48} style={{ color: "var(--accent-primary-light)" }} />
            </div>
            {isAdminOrDean && (
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                {vendor.isVerified ? (
                  <span className="badge badge-approved" style={{ padding: "8px 16px", fontSize: "14px" }}>
                    <ShieldCheck size={18} style={{ marginRight: 8 }} /> Verified
                  </span>
                ) : (
                  <>
                    <button 
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="btn btn-danger"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => setShowVerifyModal(true)}
                      disabled={actionLoading}
                      className="btn btn-success"
                    >
                      {actionLoading ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                      Verify Vendor
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)" }}>{vendor.companyName}</h1>
            <div style={{ marginTop: "var(--space-2)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {vendor.categories.map(cat => (
                <span key={cat} className="badge badge-progress">
                  {VENDOR_CATEGORY_LABELS[cat]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "var(--space-6)" }}>
        
        {/* Left Column: Info & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div className="card">
            <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-4)" }}>Contact Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                <User size={20} style={{ color: "var(--text-muted)" }} />
                <div>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{vendor.contactPerson}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Primary Contact</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                <Phone size={20} style={{ color: "var(--text-muted)" }} />
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{vendor.phone}</p>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                <Mail size={20} style={{ color: "var(--text-muted)" }} />
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{vendor.email}</p>
              </div>
              {vendor.address && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                  <MapPinHouse size={20} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", whiteSpace: "pre-line" }}>{vendor.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-4)" }}>Registration Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Joined Date</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatDate(vendor.createdAt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>GST Number</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{vendor.gstNumber || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>PAN Number</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{vendor.panNumber || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Total Orders</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{vendor.totalOrders || 0}</span>
              </div>
              {vendor.rating && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Rating</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>★ {Number(vendor.rating).toFixed(1)}/5.0</span>
                </div>
              )}
              {vendor.verifiedBy && (
                 <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-default)" }}>
                 <span style={{ color: "var(--text-muted)" }}>Verified By</span>
                 <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{vendor.verifiedBy.name}</span>
               </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Docs & History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div className="card">
            <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-4)" }}>Registration Documents</h3>
            {vendor.documents.length === 0 ? (
               <div className="empty-state">
                 <FileText style={{ width: 48, height: 48, margin: "0 auto var(--space-3)", opacity: 0.5 }} />
                 <p>No documents uploaded.</p>
               </div>
            ) : (
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                 {vendor.documents.map(doc => (
                   <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)" }}>
                     <div style={{ display: "flex", alignItems: "center", overflow: "hidden", marginRight: "var(--space-4)" }}>
                       <FileText size={20} style={{ color: "var(--text-muted)", marginRight: "var(--space-3)", flexShrink: 0 }} />
                       <div style={{ overflow: "hidden" }}>
                         <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.fileName}</p>
                         <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{doc.docType.replace("_", " ")}</p>
                       </div>
                     </div>
                     <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                       <Download size={16} />
                     </a>
                   </div>
                 ))}
               </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-4)" }}>Recent Quotations</h3>
            {vendor._count.quotations === 0 ? (
                <div className="empty-state">This vendor has not submitted any quotations yet.</div>
            ) : (
               <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                 {vendor.quotations.map(quote => (
                    <div key={quote.id} style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                        <div>
                           <h4 style={{ fontWeight: 600, color: "var(--text-primary)" }}>{quote.quotationRequest.title}</h4>
                           <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{quote.quotationRequest.event.title}</p>
                        </div>
                        <span className={`badge ${
                          quote.status === 'accepted' ? 'badge-approved' :
                          quote.status === 'rejected' ? 'badge-rejected' :
                          'badge-progress'
                        }`}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-sm)", marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>₹{Number(quote.amount).toLocaleString("en-IN")}</div>
                        <div style={{ color: "var(--text-muted)" }}>{formatDate(quote.createdAt)}</div>
                      </div>
                    </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="modal" style={{ maxWidth: 450 }}>
            <h3 className="modal-title" style={{ marginBottom: "var(--space-2)" }}>Verify Vendor Registration</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-6)" }}>Are you sure you want to verify this vendor? They will be able to log in and participate in quotation requests immediately.</p>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleVerify}
                disabled={actionLoading}
                className="btn btn-success"
              >
                {actionLoading ? "Verifying..." : "Confirm Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="modal" style={{ maxWidth: 450 }}>
            <h3 className="modal-title" style={{ marginBottom: "var(--space-2)" }}>Reject Vendor Registration</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>Please provide a reason for rejecting this vendor. This will be sent to them via email/notification.</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="form-textarea"
              style={{ marginBottom: "var(--space-6)" }}
              rows={4}
              placeholder="E.g., Invalid GST documentation, doesn't meet minimum requirements..."
            />
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={actionLoading || !rejectReason}
                className="btn btn-danger"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
