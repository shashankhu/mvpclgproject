"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ShieldAlert, Plus, Users as UsersIcon, Search, UserCheck, Shield, KeyRound, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

const ALL_ROLES = [
  "student", "club_head", "faculty_coordinator", "dean", 
  "principal", "admin", "super_admin", "transport", 
  "security", "resource", "finance"
];

export default function AdminDashboardPage() {
  const { user, loading: authLoading, apiFetch, login } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorError, setError] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "student", department: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    // Strict redirect: only super_admin or admin can access
    if (!user || !["super_admin", "admin"].includes(user.role)) {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [user, authLoading, router, apiFetch]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ name: "", email: "", password: "", role: "student", department: "" });
      fetchUsers(); // refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async (targetUserId) => {
    try {
      // Show loading state by using the global setLoading
      setLoading(true);
      const data = await apiFetch("/api/admin/impersonate", {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
      });
      
      // Update AuthContext to instantly log the user in as the target
      login(data.token, data.user);
      window.location.href = "/dashboard"; // force full reload to clear any stale state
    } catch (err) {
      setLoading(false);
      setError("Impersonation failed: " + err.message);
    }
  };

  if (authLoading || loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--accent-warning)", fontWeight: 600, marginBottom: "var(--space-1)" }}>
            RESTRICTED ACCESS
          </p>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <ShieldAlert size={28} /> System Administration
          </h1>
          <p className="page-subtitle">Manage authoritative roles and system accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Create Account
        </button>
      </div>

      {errorError && (
        <div style={{ background: "var(--accent-danger-bg)", color: "var(--accent-danger-text)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-6)" }}>
          {errorError}
        </div>
      )}

      {/* Info Banner */}
      <div className="card" style={{ marginBottom: "var(--space-6)", background: "linear-gradient(to right, var(--bg-muted), var(--bg-primary))", borderLeft: "4px solid var(--accent-info)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)" }}>
          <div style={{ background: "var(--accent-info-bg)", padding: "var(--space-3)", borderRadius: "var(--radius-full)", color: "var(--accent-info)" }}>
             <KeyRound size={24} />
          </div>
          <div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Super Admin Privileges</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.5 }}>
              You are viewing this portal because you hold an administrative role. You can create accounts bypassing self-registration (which is locked to students). Using the <strong>Impersonate</strong> feature, you can temporarily assume control of any user's session for troubleshooting without needing their password.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-header" style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-default)" }}>
          <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <UsersIcon size={18} /> Registered Users ({users.length})
          </h2>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-muted)", color: "var(--text-muted)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600 }}>Email</th>
                <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600 }}>Role</th>
                <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600 }}>Joined</th>
                <th style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-default)", ':lastChild': { borderBottom: "none" } }}>
                  <td style={{ padding: "var(--space-4)", fontWeight: 500, color: "var(--text-primary)" }}>{u.name}</td>
                  <td style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{u.email}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span style={{ 
                      padding: "2px 8px", 
                      borderRadius: "var(--radius-full)", 
                      fontSize: "11px", 
                      fontWeight: 600,
                      background: ["super_admin", "admin"].includes(u.role) ? "var(--accent-warning-bg)" : "var(--bg-muted)",
                      color: ["super_admin", "admin"].includes(u.role) ? "var(--accent-warning)" : "var(--text-secondary)",
                      textTransform: "uppercase"
                    }}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: u.isActive ? "var(--accent-success)" : "var(--text-muted)" }} />
                      {u.isActive ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td style={{ padding: "var(--space-4)", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td style={{ padding: "var(--space-4)", textAlign: "right" }}>
                    {u.id !== user.id && (
                      <button 
                        onClick={() => handleImpersonate(u.id)}
                        className="btn btn-outline btn-sm"
                        style={{ display: "inline-flex", gap: "var(--space-2)" }}
                        title="Log in as this user"
                      >
                        <UserCheck size={14} /> Impersonate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-muted)" }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          padding: "var(--space-4)"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 500, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "var(--space-5)", borderBottom: "1px solid var(--border-default)", background: "var(--bg-muted)" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>Create Authoritative Account</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                Bypass public registration to provision institutional roles.
              </p>
            </div>
            
            <form onSubmit={handleCreateUser} style={{ padding: "var(--space-5)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Dr. Jane Smith" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Institutional Email</label>
                  <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane.smith@college.edu" />
                </div>
                
                <div style={{ display: "flex", gap: "var(--space-4)" }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Initial Password</label>
                    <input required type="password" minLength={6} className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">System Role</label>
                    <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      {ALL_ROLES.map(r => (
                        <option key={r} value={r}>{r.replace("_", " ").toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Provisioning..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
