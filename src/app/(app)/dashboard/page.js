"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle, Clock, XCircle, Bell, ListTodo, AlertTriangle } from "lucide-react";
import { getStatusBadgeClass, getStatusLabel, formatDate, formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name}</h1>
          <p className="page-subtitle" style={{ textTransform: "capitalize" }}>
            {user?.role?.replace("_", " ")} Dashboard
          </p>
        </div>
        {data.unreadNotifications > 0 && (
          <button className="btn btn-outline" onClick={() => router.push("/notifications")}>
            <Bell size={16} />
            {data.unreadNotifications} unread
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><Calendar size={22} /></div>
          <div className="stat-content">
            <h3>{data.stats.totalEvents}</h3>
            <p>Total Events</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle size={22} /></div>
          <div className="stat-content">
            <h3>{data.stats.approvedEvents}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><Clock size={22} /></div>
          <div className="stat-content">
            <h3>{data.stats.pendingEvents}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><XCircle size={22} /></div>
          <div className="stat-content">
            <h3>{data.stats.rejectedEvents}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isApprover ? "1fr 1fr" : "1fr", gap: "var(--space-6)" }}>
        {/* Pending Approvals */}
        {isApprover && data.pendingApprovals?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={20} style={{ color: "var(--accent-warning)" }} />
                Pending Approvals ({data.pendingApprovals.length})
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.pendingApprovals.map((event) => (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => router.push(`/events/${event.id}`)}
                  style={{ padding: "var(--space-4)" }}
                >
                  <div className="event-card-header">
                    <span className="event-card-title">{event.title}</span>
                    <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <div className="event-card-meta">
                    <span>By {event.createdBy?.name}</span>
                    {event.club && <span>• {event.club.name}</span>}
                    <span>• {formatCurrency(event.budgetEstimate)}</span>
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
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={20} style={{ color: "var(--accent-info)" }} />
                Department Alerts ({data.departmentAlerts.length})
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.departmentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="event-card"
                  onClick={() => router.push(`/events/${alert.event?.id}`)}
                  style={{ padding: "var(--space-4)" }}
                >
                  <div className="event-card-title">{alert.event?.title}</div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Events</h2>
            <button className="btn btn-outline btn-sm" onClick={() => router.push("/events")}>
              View All
            </button>
          </div>
          {data.recentEvents?.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No events yet</h3>
              <p>Get started by creating your first event</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.recentEvents?.map((event) => (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => router.push(`/events/${event.id}`)}
                  style={{ padding: "var(--space-4)" }}
                >
                  <div className="event-card-header">
                    <span className="event-card-title">{event.title}</span>
                    <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <div className="event-card-meta">
                    <span>{event.createdBy?.name}</span>
                    {event.club && <span>• {event.club.name}</span>}
                    {event.eventDate && <span>• {formatDate(event.eventDate)}</span>}
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
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ListTodo size={20} />
                My Tasks ({data.myTasks.length})
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {data.myTasks.map((task) => (
                <div key={task.id} style={{
                  padding: "var(--space-3) var(--space-4)",
                  background: "var(--bg-primary)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{task.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      {task.event?.title} {task.deadline && `• Due ${formatDate(task.deadline)}`}
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
    </div>
  );
}
