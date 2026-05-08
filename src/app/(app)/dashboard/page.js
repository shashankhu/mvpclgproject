"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle, Clock, XCircle, Bell, ListTodo, AlertTriangle, FileText, Users, Building2 } from "lucide-react";
import { getStatusBadgeClass, getStatusLabel, formatDate, formatCurrency } from "@/lib/utils";
import EventCalendar from "@/components/EventCalendar";

export default function DashboardPage() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    apiFetch("/api/dashboard")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, apiFetch, authLoading, router]);

  if (authLoading || loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!data) return null;

  const isApprover = ["faculty_coordinator", "dean", "principal", "admin"].includes(user?.role);
  const isDeptRole = ["transport", "security", "resource", "finance"].includes(user?.role);
  const isClubHead = data.myClubs?.length > 0;
  const isFC = data.coordinatedClubs?.length > 0;
  const isVendor = user?.role === "vendor";

  if (isVendor) {
    const vp = data.vendorProfile;
    if (!vp) return <div className="p-8 text-center text-red-500">Vendor Profile Not Found</div>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">{user?.name}</h1>
            <p className="page-subtitle">Your Supplier Dashboard</p>
          </div>
          <div>
            {!vp.isVerified ? (
              <span className="badge badge-pending" title="Account under review by Admin">Pending Verification</span>
            ) : (
              <span className="badge badge-approved"><CheckCircle size={14} /> Verified Vendor</span>
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary"><ListTodo size={22} /></div>
            <div className="stat-content">
              <p>Available Requests</p>
              <h3>{data.availableRequestsCount || 0}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><FileText size={22} /></div>
            <div className="stat-content">
              <p>Submitted Quotes</p>
              <h3>{vp.stats.submissions || 0}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><CheckCircle size={22} /></div>
            <div className="stat-content">
              <p>Contracts Won</p>
              <h3>{vp.stats.awards || 0}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><Clock size={22} /></div>
            <div className="stat-content">
              <p>Pending Bills</p>
              <h3>{data.pendingBillsCount || 0}</h3>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
          <div className="card">
             <div className="card-header">
                <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                   <ListTodo size={18} style={{ color: "var(--accent-primary)" }}/> Actions Needed
                </h3>
             </div>
             <div className="empty-state">
                {data.availableRequestsCount > 0 ? (
                  <>
                     <h3 style={{ color: "var(--accent-primary)", marginBottom: "var(--space-3)" }}>
                        You have {data.availableRequestsCount} open quotation requests!
                     </h3>
                     <button onClick={() => router.push("/quotation-requests")} className="btn btn-primary">
                        View & Submit Bids
                     </button>
                  </>
                ) : (
                  <>
                    <p>No action required at the moment. You'll be notified when new requests are available.</p>
                  </>
                )}
             </div>
          </div>

          <div className="card">
             <div className="card-header">
                <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                   <Building2 size={18} style={{ color: "var(--accent-info)" }}/> Recently Awarded Contracts
                </h3>
             </div>
             <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
               {data.recentEvents?.length > 0 ? (
                 data.recentEvents.map(e => (
                    <div key={e.id} style={{ padding: "var(--space-4)", background: "var(--bg-muted)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                       <div>
                          <div style={{ fontWeight: 600 }}>{e.title}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Event: {e.event.title}</div>
                       </div>
                       <button onClick={() => router.push(`/vendor-bills`)} className="btn btn-ghost btn-sm">View Bill</button>
                    </div>
                 ))
               ) : (
                 <div className="empty-state" style={{ padding: "var(--space-6)" }}>
                    <p>You haven't been awarded any contracts yet. Keep submitting quotations!</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header - Mission Control Style */}
      <div className="page-header">
        <div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-1)" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
          </p>
          <h1 className="page-title">{user?.name}</h1>
          <p className="page-subtitle">
            Here&apos;s your mission status for today
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {data.unreadNotifications > 0 && (
            <button className="btn btn-outline" onClick={() => router.push("/notifications")}>
              <Bell size={16} />
              {data.unreadNotifications} unread
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setShowCalendar(true)} title="View Event Calendar">
            <Calendar size={16} />
            <span style={{ display: "none" }}>Calendar</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - 4 Column Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><Calendar size={22} /></div>
          <div className="stat-content">
            <p>Total Events</p>
            <h3>{data.stats.totalEvents}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle size={22} /></div>
          <div className="stat-content">
            <p>Approved</p>
            <h3>{data.stats.approvedEvents}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><Clock size={22} /></div>
          <div className="stat-content">
            <p>Pending</p>
            <h3>{data.stats.pendingEvents}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><XCircle size={22} /></div>
          <div className="stat-content">
            <p>Rejected</p>
            <h3>{data.stats.rejectedEvents}</h3>
          </div>
        </div>
      </div>

      {/* ─── Vendor Management (Unified Section) ─── */}
      {(data.financeStats || data.unverifiedVendorsCount > 0) && (
        <div className="card" style={{ marginBottom: "var(--space-6)", borderLeft: "4px solid var(--accent-primary)" }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Building2 size={18} style={{ color: "var(--accent-primary)" }} />
              Vendor Management
            </h2>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-outline btn-sm" onClick={() => router.push("/vendors")}>
                Registry
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => router.push("/vendor-bills")}>
                Bills
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => router.push("/quotation-requests")}>
                Quotations
              </button>
            </div>
          </div>

          {/* Billing stats row */}
          {data.financeStats && (
            <div style={{ display: "grid", gridTemplateColumns: data.unverifiedVendorsCount > 0 ? "1fr 1fr 1fr" : "1fr 1fr", gap: "var(--space-4)", marginBottom: data.unverifiedVendorsCount > 0 ? "var(--space-4)" : 0 }}>
              <div style={{ background: "var(--bg-muted)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>Pending Bills</p>
                <h3 style={{ fontSize: "24px", color: "var(--accent-warning)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{data.financeStats.pendingBills}</h3>
              </div>
              <div style={{ background: "var(--bg-muted)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>Processing</p>
                <h3 style={{ fontSize: "24px", color: "var(--accent-info)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{data.financeStats.processingBills}</h3>
              </div>
              {data.unverifiedVendorsCount > 0 && (
                <div style={{ background: "var(--accent-danger-bg)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", textAlign: "center", cursor: "pointer" }} onClick={() => router.push("/vendors?verified=false")}>
                  <p style={{ color: "var(--accent-danger-text)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-1)" }}>Pending Verification</p>
                  <h3 style={{ fontSize: "24px", color: "var(--accent-danger)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{data.unverifiedVendorsCount}</h3>
                </div>
              )}
            </div>
          )}

          {/* Alert banner if unverified vendors exist but no financeStats */}
          {!data.financeStats && data.unverifiedVendorsCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-4)", background: "var(--accent-danger-bg)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <AlertTriangle size={18} style={{ color: "var(--accent-danger)" }} />
                <span style={{ fontWeight: 600, color: "var(--accent-danger-text)" }}>{data.unverifiedVendorsCount} vendor(s) pending verification</span>
              </div>
              <button onClick={() => router.push("/vendors?verified=false")} className="btn btn-danger btn-sm">Review</button>
            </div>
          )}
        </div>
      )}

      {/* My Clubs Section (for Club Heads) */}
      {isClubHead && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Users size={18} style={{ color: "var(--accent-primary)" }} />
              My Clubs
              <span style={{
                background: "var(--accent-primary-light)",
                color: "var(--accent-primary)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                marginLeft: "var(--space-2)"
              }}>
                Club Head
              </span>
            </h2>
            <button className="btn btn-primary btn-sm" onClick={() => router.push("/events/new")}>
              Create Event
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
            {data.myClubs.map((club) => (
              <div
                key={club.id}
                onClick={() => router.push("/clubs")}
                style={{
                  padding: "var(--space-4)",
                  background: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  borderLeft: "3px solid var(--accent-primary)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, var(--accent-primary), #4F46E5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "white", fontSize: "var(--text-sm)"
                  }}>
                    {club.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{club.name}</div>
                    <span className="badge badge-progress" style={{ fontSize: "10px" }}>
                      {club.type === "departmental" ? "Departmental" : "Non-Departmental"}
                    </span>
                  </div>
                </div>
                {club.facultyCoordinator && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    FC: {club.facultyCoordinator.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coordinated Clubs Section (for Faculty Coordinators) */}
      {isFC && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Building2 size={18} style={{ color: "var(--accent-info)" }} />
              Clubs You Coordinate
              <span style={{
                background: "var(--accent-info-bg)",
                color: "var(--accent-info-text)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                marginLeft: "var(--space-2)"
              }}>
                {data.coordinatedClubs.length} club{data.coordinatedClubs.length !== 1 ? "s" : ""}
              </span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
            {data.coordinatedClubs.map((club) => (
              <div
                key={club.id}
                onClick={() => router.push("/clubs")}
                style={{
                  padding: "var(--space-4)",
                  background: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  borderLeft: "3px solid var(--accent-info)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, var(--accent-info), #3B82F6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "white", fontSize: "var(--text-sm)"
                  }}>
                    {club.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{club.name}</div>
                    <span className="badge badge-progress" style={{ fontSize: "10px" }}>
                      {club.type === "departmental" ? "Departmental" : "Non-Departmental"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  <span>Head: {club.head?.name || "Not assigned"}</span>
                  <span>{club.memberCount} members • {club.eventCount} events</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: isApprover || isDeptRole ? "1fr 1fr" : "1fr", gap: "var(--space-6)" }}>

        {/* Pending Approvals - Floating Card */}
        {isApprover && data.pendingApprovals?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <AlertTriangle size={18} style={{ color: "var(--accent-warning)" }} />
                Pending Approvals
                <span style={{
                  background: "var(--accent-warning-bg)",
                  color: "var(--accent-warning-text)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  marginLeft: "var(--space-2)"
                }}>
                  {data.pendingApprovals.length}
                </span>
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.pendingApprovals.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  style={{
                    padding: "var(--space-4)",
                    background: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    borderLeft: "3px solid var(--accent-warning)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-primary)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "var(--bg-muted)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{event.title}</span>
                    <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    <span>By {event.createdBy?.name}</span>
                    {event.club && <span>{event.club.name}</span>}
                    <span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(event.budgetEstimate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Alerts */}
        {isDeptRole && data.departmentAlerts?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Bell size={18} style={{ color: "var(--accent-info)" }} />
                Department Alerts
                <span style={{
                  background: "var(--accent-info-bg)",
                  color: "var(--accent-info-text)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  marginLeft: "var(--space-2)"
                }}>
                  {data.departmentAlerts.length}
                </span>
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.departmentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => router.push(`/events/${alert.event?.id}`)}
                  style={{
                    padding: "var(--space-4)",
                    background: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    borderLeft: "3px solid var(--accent-info)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-primary)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "var(--bg-muted)"}
                >
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>
                    {alert.event?.title}
                  </div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events - Timeline View */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Events</h2>
            <button className="btn btn-outline btn-sm" onClick={() => router.push("/events")}>
              View All
            </button>
          </div>
          {data.recentEvents?.length === 0 ? (
            <div className="empty-state">
              <Calendar size={56} />
              <h3>No events yet</h3>
              <p>Get started by creating your first event</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.recentEvents?.map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  style={{
                    padding: "var(--space-4)",
                    background: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    position: "relative",
                    paddingLeft: "var(--space-6)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-primary)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "var(--bg-muted)"}
                >
                  {/* Timeline dot */}
                  <div style={{
                    position: "absolute",
                    left: "var(--space-2)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: event.status === "APPROVED" ? "var(--accent-success)" :
                               event.status === "REJECTED" ? "var(--accent-danger)" :
                               "var(--accent-warning)"
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{event.title}</span>
                    <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    <span>{event.createdBy?.name}</span>
                    {event.club && <span>{event.club.name}</span>}
                    {event.eventDate && <span style={{ fontFamily: "var(--font-mono)" }}>{formatDate(event.eventDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        {data.myTasks?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <ListTodo size={18} />
                My Tasks
                <span style={{
                  background: "var(--bg-muted)",
                  color: "var(--text-muted)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  marginLeft: "var(--space-2)"
                }}>
                  {data.myTasks.length}
                </span>
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {data.myTasks.map((task) => (
                <div key={task.id} style={{
                  padding: "var(--space-3) var(--space-4)",
                  background: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-primary)" }}>{task.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      {task.event?.title} {task.deadline && (
                        <span style={{ fontFamily: "var(--font-mono)" }}>
                          {" "}• Due {formatDate(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${task.status === "delayed" ? "badge-rejected" : "badge-pending"}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Popout */}
      {showCalendar && (
        <div className="modal-overlay" onClick={() => setShowCalendar(false)} style={{ zIndex: 300 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: "0", maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "var(--space-3) var(--space-4)", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCalendar(false)}>
                <XCircle size={18} />
                Close
              </button>
            </div>
            <div style={{ padding: "var(--space-4)" }}>
              <EventCalendar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
