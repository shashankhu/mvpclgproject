"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { ArrowLeft } from "lucide-react";

const EVENT_TYPES = [
  { value: "tech", label: "Technical" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
];

export default function CreateEventPage() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);

  const isDecanOrAdmin = user?.role === "dean" || user?.role === "admin";

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "tech",
    eventType: isDecanOrAdmin ? "club" : "club",
    objectives: "",
    targetAudience: "",
    expectedAttendance: "",
    venue: "",
    eventDate: "",
    eventEndDate: "",
    budgetEstimate: "",
    clubId: "",
    needsTransport: false,
    needsSecurity: false,
    needsResources: false,
    transportNotes: "",
    securityNotes: "",
    resourceNotes: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    // Fetch only clubs the user can create events for
    apiFetch("/api/clubs/my").then((data) => setClubs(data.clubs || [])).catch(() => {});
  }, [user, apiFetch, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        expectedAttendance: form.expectedAttendance ? parseInt(form.expectedAttendance) : null,
        budgetEstimate: form.budgetEstimate ? parseFloat(form.budgetEstimate) : 0,
      };

      const data = await apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showToast("Event created!", "success");
      setTimeout(() => router.push(`/events/${data.event.id}`), 500);
    } catch (err) {
      showToast(err.message, "error");
      setLoading(false);
    }
  };

  const updateForm = (field, value) => setForm({ ...form, [field]: value });

  if (authLoading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {ToastComponent}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 8 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="page-title">Create New Event</h1>
          <p className="page-subtitle">Submit an event proposal for approval</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-5)", fontSize: "var(--text-base)", fontWeight: 600 }}>
            Basic Information
          </h3>

          {/* Event type toggle for Dean/Admin */}
          {isDecanOrAdmin && (
            <div className="form-group">
              <label className="form-label">Event Category</label>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button
                  type="button"
                  className={`btn ${form.eventType === "club" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => updateForm("eventType", "club")}
                >
                  Club Event
                </button>
                <button
                  type="button"
                  className={`btn ${form.eventType === "standard" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => updateForm("eventType", "standard")}
                >
                  Standard Event
                </button>
              </div>
              {form.eventType === "standard" && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--accent-info)", marginTop: 4 }}>
                  Standard events are auto-approved. All clubs can join.
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="title">Event Title *</label>
            <input
              id="title"
              className="form-input"
              placeholder="e.g. Tech Fest 2026"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="desc">Description *</label>
            <textarea
              id="desc"
              className="form-textarea"
              placeholder="Describe your event in detail..."
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="type">Event Type *</label>
              <select id="type" className="form-select" value={form.type} onChange={(e) => updateForm("type", e.target.value)}>
                {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {form.eventType === "club" && (
              <div className="form-group">
                <label className="form-label" htmlFor="club">Club *</label>
                <select id="club" className="form-select" value={form.clubId} onChange={(e) => updateForm("clubId", e.target.value)} required={form.eventType === "club"}>
                  <option value="">Select club</option>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Proposal Details */}
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-5)", fontSize: "var(--text-base)", fontWeight: 600 }}>
            Proposal Details
          </h3>

          <div className="form-group">
            <label className="form-label" htmlFor="objectives">Objectives</label>
            <textarea id="objectives" className="form-textarea" placeholder="What do you aim to achieve?" value={form.objectives} onChange={(e) => updateForm("objectives", e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="audience">Target Audience</label>
              <input id="audience" className="form-input" placeholder="e.g. CS students, all departments" value={form.targetAudience} onChange={(e) => updateForm("targetAudience", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="attendance">Expected Attendance</label>
              <input id="attendance" type="number" className="form-input" placeholder="e.g. 200" value={form.expectedAttendance} onChange={(e) => updateForm("expectedAttendance", e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="venue">Venue</label>
              <input id="venue" className="form-input" placeholder="e.g. Main Auditorium" value={form.venue} onChange={(e) => updateForm("venue", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="budget">Budget Estimate (₹)</label>
              <input id="budget" type="number" className="form-input" placeholder="e.g. 75000" value={form.budgetEstimate} onChange={(e) => updateForm("budgetEstimate", e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="start">Event Start Date</label>
              <input id="start" type="datetime-local" className="form-input" value={form.eventDate} onChange={(e) => updateForm("eventDate", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="end">Event End Date</label>
              <input id="end" type="datetime-local" className="form-input" value={form.eventEndDate} onChange={(e) => updateForm("eventEndDate", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Addons */}
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-5)", fontSize: "var(--text-base)", fontWeight: 600 }}>
            Addons (Execution Requirements)
          </h3>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
            Specify if your event needs transport, security, or special resources. Approvers will act on these.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <div className="form-checkbox-group">
                <input type="checkbox" className="form-checkbox" id="transport" checked={form.needsTransport} onChange={(e) => updateForm("needsTransport", e.target.checked)} />
                <label htmlFor="transport" style={{ fontSize: "var(--text-sm)" }}>🚌 Needs Transport</label>
              </div>
              {form.needsTransport && (
                <input className="form-input" placeholder="Transport details..." value={form.transportNotes} onChange={(e) => updateForm("transportNotes", e.target.value)} style={{ marginTop: 8 }} />
              )}
            </div>

            <div>
              <div className="form-checkbox-group">
                <input type="checkbox" className="form-checkbox" id="security" checked={form.needsSecurity} onChange={(e) => updateForm("needsSecurity", e.target.checked)} />
                <label htmlFor="security" style={{ fontSize: "var(--text-sm)" }}>🛡️ Needs Security</label>
              </div>
              {form.needsSecurity && (
                <input className="form-input" placeholder="Security details..." value={form.securityNotes} onChange={(e) => updateForm("securityNotes", e.target.value)} style={{ marginTop: 8 }} />
              )}
            </div>

            <div>
              <div className="form-checkbox-group">
                <input type="checkbox" className="form-checkbox" id="resources" checked={form.needsResources} onChange={(e) => updateForm("needsResources", e.target.checked)} />
                <label htmlFor="resources" style={{ fontSize: "var(--text-sm)" }}>📦 Needs Special Resources</label>
              </div>
              {form.needsResources && (
                <input className="form-input" placeholder="Resource details..." value={form.resourceNotes} onChange={(e) => updateForm("resourceNotes", e.target.value)} style={{ marginTop: 8 }} />
              )}
            </div>
          </div>
        </div>

        {parseFloat(form.budgetEstimate) > 50000 && (
          <div style={{
            padding: "var(--space-4)",
            background: "var(--accent-warning-bg)",
            border: "1px solid var(--accent-warning)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-6)",
            fontSize: "var(--text-sm)",
            color: "var(--accent-warning)",
          }}>
            ⚠️ Budget exceeds ₹50,000 — this event will require Principal &amp; Administrator approval in addition to Faculty &amp; Dean.
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
          {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : "Create Event"}
        </button>
      </form>
    </div>
  );
}
