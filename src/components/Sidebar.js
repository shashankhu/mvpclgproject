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
  ShieldAlert,
  FileText,
  Receipt,
  Building2,
} from "lucide-react";

// Main navigation items
const MAIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: Calendar, roles: ["student", "club_head", "faculty_coordinator", "dean", "principal", "admin", "super_admin"] },
  { label: "Create Event", href: "/events/new", icon: CalendarPlus, roles: ["student", "club_head", "dean", "admin", "super_admin"] },
  { label: "Approvals", href: "/approvals", icon: ClipboardCheck, roles: ["faculty_coordinator", "dean", "principal", "admin", "super_admin"] },
  { label: "Clubs", href: "/clubs", icon: Users, roles: ["student", "club_head", "faculty_coordinator", "dean", "principal", "admin", "super_admin"] },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

// Vendor management section — grouped under a single section label
const VENDOR_NAV = [
  { label: "Quotation Requests", href: "/quotation-requests", icon: FileText, roles: ["vendor", "dean", "admin", "super_admin", "finance"] },
  { label: "Vendor Bills", href: "/vendor-bills", icon: Receipt, roles: ["vendor", "finance", "dean", "admin", "super_admin"] },
  { label: "Vendor Registry", href: "/vendors", icon: Building2, roles: ["dean", "admin", "super_admin", "finance"] },
];

// System items
const SYSTEM_NAV = [
  { label: "Admin Panel", href: "/admin", icon: ShieldAlert, roles: ["admin", "super_admin"] },
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

  const filterByRole = (items) =>
    items.filter((item) => !item.roles || item.roles.includes(user?.role));

  const filteredMain = filterByRole(MAIN_NAV);
  const filteredVendor = filterByRole(VENDOR_NAV);
  const filteredSystem = filterByRole(SYSTEM_NAV);

  const renderNavItem = (item) => (
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
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <h1>DIGANTA</h1>
          <span>Execution OS for Students</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {filteredMain.map(renderNavItem)}

          {filteredVendor.length > 0 && (
            <>
              <div className="nav-section-label">Vendor Management</div>
              {filteredVendor.map(renderNavItem)}
            </>
          )}

          {filteredSystem.length > 0 && (
            <>
              <div className="nav-section-label">System</div>
              {filteredSystem.map(renderNavItem)}
            </>
          )}
        </nav>

        {/* User info + Logout */}
        <div style={{
          padding: "0 var(--space-4)",
          borderTop: "1px solid var(--border-default)",
          paddingTop: "var(--space-5)",
          marginTop: "auto"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3)",
            marginBottom: "var(--space-3)",
            background: "var(--bg-muted)",
            borderRadius: "var(--radius-md)"
          }}>
            <div className="header-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {user?.name}
              </div>
              <div style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
                textTransform: "capitalize"
              }}>
                {user?.role?.replace("_", " ")}
              </div>
            </div>
          </div>
          <button
            className="nav-link"
            onClick={handleLogout}
            style={{ color: "var(--accent-danger)" }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 99,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
