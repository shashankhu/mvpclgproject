"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  Calendar,
  ClipboardCheck,
  Bell,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Create Event", href: "/events/new", icon: CalendarPlus, roles: ["student", "club_head", "dean", "admin"] },
  { label: "Approvals", href: "/approvals", icon: ClipboardCheck, roles: ["faculty_coordinator", "dean", "principal", "admin"] },
  { label: "Clubs", href: "/clubs", icon: Users },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export default function Sidebar() {
  const { user, logout, apiFetch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      apiFetch("/api/notifications?unread=true&limit=1")
        .then((data) => setUnreadCount(data.unreadCount || 0))
        .catch(() => {});
    }
  }, [user, apiFetch, pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const filteredNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: "fixed",
          top: 18,
          left: 16,
          zIndex: 200,
          display: "none",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          padding: "8px",
          color: "var(--text-primary)",
          cursor: "pointer",
        }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <h1>DIGANTA</h1>
          <span>College Event System</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {filteredNav.map((item) => (
            <button
              key={item.href}
              className={`nav-link ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
              onClick={() => {
                router.push(item.href);
                setMobileOpen(false);
              }}
            >
              <item.icon size={18} />
              {item.label}
              {item.label === "Notifications" && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User info + Logout */}
        <div style={{ padding: "0 var(--space-3)", borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", marginBottom: "var(--space-2)" }}>
            <div className="header-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="header-username">{user?.name}</div>
              <div className="header-role">{user?.role?.replace("_", " ")}</div>
            </div>
          </div>
          <button className="nav-link" onClick={handleLogout} style={{ color: "var(--accent-danger)" }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
