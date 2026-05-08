"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    apiFetch("/api/notifications")
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchNotifications();
  }, [user, authLoading]);

  const markAllRead = async () => {
    try {
      await apiFetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ markAllRead: true }) });
      fetchNotifications();
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await apiFetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ notificationId: id }) });
      fetchNotifications();
    } catch {}
  };

  if (authLoading || loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  const typeIcons = {
    approval_required: "📋",
    event_approved: "✅",
    event_rejected: "❌",
    task_assigned: "📌",
    dept_alert: "🚨",
    general: "📢",
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{notifications.filter((n) => !n.isRead).length} unread</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={markAllRead}>
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>No notifications</h3>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markRead(n.id);
                if (n.event) router.push(`/events/${n.event.id}`);
              }}
              style={{
                padding: "var(--space-4)",
                background: n.isRead ? "var(--bg-surface)" : "var(--accent-primary-light)",
                borderLeft: `3px solid ${n.isRead ? "transparent" : "var(--accent-primary)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                boxShadow: n.isRead ? "none" : "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <span style={{ fontSize: "var(--text-lg)" }}>{typeIcons[n.type] || "📢"}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{n.title}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2 }}>{n.message}</div>
                    {n.event && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--accent-primary)", marginTop: 4 }}>
                        📅 {n.event.title}
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
