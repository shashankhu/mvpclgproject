"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Users, Plus, Building2, GraduationCap } from "lucide-react";

export default function ClubsPage() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [clubs, setClubs] = useState([]);
  const [students, setStudents] = useState([]);
  const [facultyCoordinators, setFacultyCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    department: "",
    type: "departmental",
    headUserId: "",
    facultyCoordinatorId: "",
  });

  const fetchClubs = () => {
    apiFetch("/api/clubs")
      .then((data) => setClubs(data.clubs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchStudents = () => {
    apiFetch("/api/users/students")
      .then((data) => setStudents(data.students || []))
      .catch(() => {});
  };

  const fetchFacultyCoordinators = () => {
    apiFetch("/api/users/faculty-coordinators")
      .then((data) => setFacultyCoordinators(data.facultyCoordinators || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchClubs();
  }, [user, authLoading]);

  useEffect(() => {
    if (showForm && canCreate) {
      fetchStudents();
      fetchFacultyCoordinators();
    }
  }, [showForm]);

  const handleCreate = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.name.trim()) {
      showToast("Club name is required", "error");
      return;
    }
    if (!form.headUserId) {
      showToast("Please select a club head", "error");
      return;
    }
    if (!form.facultyCoordinatorId) {
      showToast("Please select a faculty coordinator", "error");
      return;
    }
    if (form.type === "departmental" && !form.department.trim()) {
      showToast("Department is required for departmental clubs", "error");
      return;
    }

    try {
      await apiFetch("/api/clubs", { method: "POST", body: JSON.stringify(form) });
      showToast("Club created successfully!", "success");
      setShowForm(false);
      setForm({
        name: "",
        description: "",
        department: "",
        type: "departmental",
        headUserId: "",
        facultyCoordinatorId: "",
      });
      fetchClubs();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const canCreate = ["admin", "dean", "faculty_coordinator"].includes(user?.role);

  const getClubHead = (club) => {
    const headMember = club.members?.find(m => m.role === "head");
    return headMember?.user;
  };

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

          {/* Club Type Toggle */}
          <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
            <label className="form-label">Club Type *</label>
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "departmental", department: "" })}
                className={`btn ${form.type === "departmental" ? "btn-primary" : "btn-outline"}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" }}
              >
                <Building2 size={16} /> Departmental
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "non_departmental", department: "" })}
                className={`btn ${form.type === "non_departmental" ? "btn-primary" : "btn-outline"}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" }}
              >
                <GraduationCap size={16} /> Non-Departmental
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Club Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter club name"
                required
              />
            </div>
            {form.type === "departmental" && (
              <div className="form-group">
                <label className="form-label">Department *</label>
                <input
                  className="form-input"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the club"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Club Head *</label>
              <select
                className="form-select"
                value={form.headUserId}
                onChange={(e) => setForm({ ...form, headUserId: e.target.value })}
                required
              >
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
              {students.length === 0 && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
                  No students registered yet
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Faculty Coordinator *</label>
              <select
                className="form-select"
                value={form.facultyCoordinatorId}
                onChange={(e) => setForm({ ...form, facultyCoordinatorId: e.target.value })}
                required
              >
                <option value="">Select a faculty coordinator</option>
                {facultyCoordinators.map((fc) => (
                  <option key={fc.id} value={fc.id}>
                    {fc.name} {fc.department ? `(${fc.department})` : ""} - {fc.email}
                  </option>
                ))}
              </select>
              {facultyCoordinators.length === 0 && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
                  No faculty coordinators registered yet
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <button type="submit" className="btn btn-primary btn-sm">Create Club</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="events-grid">
        {clubs.map((club) => {
          const head = getClubHead(club);
          return (
            <div key={club.id} className="event-card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--radius-md)",
                  background: club.type === "departmental"
                    ? "linear-gradient(135deg, var(--accent-primary), #4F46E5)"
                    : "linear-gradient(135deg, var(--accent-success), #10b981)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, color: "white", fontSize: "var(--text-lg)", flexShrink: 0,
                }}>
                  {club.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="event-card-title">{club.name}</div>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                    <span className={`badge ${club.type === "departmental" ? "badge-progress" : "badge-approved"}`} style={{ fontSize: "var(--text-xs)" }}>
                      {club.type === "departmental" ? "Departmental" : "Non-Departmental"}
                    </span>
                    {club.department && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{club.department}</span>
                    )}
                  </div>
                </div>
              </div>

              {club.description && (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: "var(--space-3)" }}>
                  {club.description}
                </p>
              )}

              <div style={{ marginTop: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                {head && (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Head:</span>
                    <span>{head.name}</span>
                  </div>
                )}
                {club.facultyCoordinator && (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ color: "var(--text-muted)" }}>FC:</span>
                    <span>{club.facultyCoordinator.name}</span>
                  </div>
                )}
              </div>

              <div className="event-card-meta">
                <span>👥 {club._count?.members || 0} members</span>
                <span>📅 {club._count?.events || 0} events</span>
              </div>
            </div>
          );
        })}
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
