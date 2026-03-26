"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Users, Plus } from "lucide-react";

export default function ClubsPage() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", department: "" });

  const fetchClubs = () => {
    apiFetch("/api/clubs")
      .then((data) => setClubs(data.clubs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchClubs();
  }, [user, authLoading]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/clubs", { method: "POST", body: JSON.stringify(form) });
      showToast("Club created!", "success");
      setShowForm(false);
      setForm({ name: "", description: "", department: "" });
      fetchClubs();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const canCreate = ["admin", "dean", "faculty_coordinator"].includes(user?.role);

  if (authLoading || loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  return (
    <div>
      {ToastComponent}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clubs</h1>
          <p className="page-subtitle">{clubs.length} active clubs</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> New Club
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)", fontWeight: 600 }}>Create Club</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Club Name *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Create</button>
        </form>
      )}

      <div className="events-grid">
        {clubs.map((club) => (
          <div key={club.id} className="event-card" style={{ cursor: "default" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, var(--accent-primary), #a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: "white", fontSize: "var(--text-lg)", flexShrink: 0,
              }}>
                {club.name.charAt(0)}
              </div>
              <div>
                <div className="event-card-title">{club.name}</div>
                {club.department && <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{club.department}</div>}
              </div>
            </div>
            {club.description && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: "var(--space-3)" }}>
                {club.description}
              </p>
            )}
            <div className="event-card-meta">
              <span>👥 {club._count?.members || 0} members</span>
              <span>📅 {club._count?.events || 0} events</span>
            </div>
          </div>
        ))}
      </div>

      {clubs.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No clubs yet</h3>
          <p>Create the first club to get started</p>
        </div>
      )}
    </div>
  );
}
