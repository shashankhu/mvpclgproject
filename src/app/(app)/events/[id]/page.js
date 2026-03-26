"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft, Send, CheckCircle, XCircle, Clock, Users,
  DollarSign, ListTodo, Plus, MessageSquare,
} from "lucide-react";
import { getStatusBadgeClass, getStatusLabel, formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

export default function EventDetailPage({ params }) {
  const { id } = use(params);
  const { user, apiFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [deptNotifs, setDeptNotifs] = useState([]);

  // Task form
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", deadline: "" });
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Expense form
  const [expenseForm, setExpenseForm] = useState({ amount: "", description: "", category: "other" });
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const fetchEvent = () => {
    apiFetch(`/api/events/${id}`)
      .then((data) => setEvent(data.event))
      .catch(() => showToast("Failed to load event", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchEvent();
  }, [id, user, authLoading]);

  const handleSubmitForApproval = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/events/${id}/submit`, { method: "POST" });
      showToast("Event submitted for approval!", "success");
      fetchEvent();
    } catch (err) {
      showToast(err.message, "error");
    }
    setActionLoading(false);
  };

  const handleApproval = async (action) => {
    if (action === "rejected" && !comment) {
      showToast("Comment required when rejecting", "error");
      return;
    }
    setActionLoading(true);
    try {
      await apiFetch(`/api/events/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ action, comment, notifyDepartments: deptNotifs }),
      });
      showToast(`Event ${action}!`, action === "approved" ? "success" : "info");
      fetchEvent();
      setComment("");
      setDeptNotifs([]);
    } catch (err) {
      showToast(err.message, "error");
    }
    setActionLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/events/${id}/tasks`, {
        method: "POST",
        body: JSON.stringify(taskForm),
      });
      showToast("Task created!", "success");
      setShowTaskForm(false);
      setTaskForm({ title: "", description: "", priority: "medium", deadline: "" });
      fetchEvent();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/events/${id}/expenses`, {
        method: "POST",
        body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) }),
      });
      showToast("Expense added!", "success");
      setShowExpenseForm(false);
      setExpenseForm({ amount: "", description: "", category: "other" });
      fetchEvent();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleJoinEvent = async (clubId) => {
    try {
      await apiFetch(`/api/events/${id}/join`, {
        method: "POST",
        body: JSON.stringify({ clubId }),
      });
      showToast("Club joined the event!", "success");
      fetchEvent();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const toggleDeptNotif = (dept) => {
    setDeptNotifs((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  if (authLoading || loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!event) return null;

  const isCreator = event.createdById === user?.id;
  const canSubmit = isCreator && event.status === "DRAFT";
  const canApprove = (() => {
    const roleStageMap = {
      faculty_coordinator: "WAITING_FOR_FACULTY",
      dean: "WAITING_FOR_DEAN",
      principal: "WAITING_FOR_PRINCIPAL",
      admin: "WAITING_FOR_ADMIN",
    };
    return roleStageMap[user?.role] === event.status;
  })();

  return (
    <div>
      {ToastComponent}
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: "var(--space-4)" }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Event Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 className="page-title">{event.title}</h1>
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
            <span className={`badge ${getStatusBadgeClass(event.status)}`}>{getStatusLabel(event.status)}</span>
            <span className="badge badge-draft" style={{ textTransform: "capitalize" }}>{event.type}</span>
            {event.eventType === "standard" && <span className="badge badge-progress">STANDARD</span>}
          </div>
        </div>
        {canSubmit && (
          <button className="btn btn-primary" onClick={handleSubmitForApproval} disabled={actionLoading}>
            <Send size={16} /> Submit for Approval
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["overview", "approvals", "budget", "tasks"].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
          <div>
            <div className="card" style={{ marginBottom: "var(--space-6)" }}>
              <h3 className="card-title" style={{ marginBottom: "var(--space-4)" }}>Description</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>{event.description}</p>

              {event.objectives && (
                <>
                  <h4 style={{ marginTop: "var(--space-5)", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600 }}>Objectives</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>{event.objectives}</p>
                </>
              )}
            </div>

            {/* Addons */}
            {(event.needsTransport || event.needsSecurity || event.needsResources) && (
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: "var(--space-4)" }}>Execution Requirements</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {event.needsTransport && (
                    <div style={{ padding: "var(--space-3)", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>🚌 Transport Required</span>
                      {event.transportNotes && <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>{event.transportNotes}</p>}
                    </div>
                  )}
                  {event.needsSecurity && (
                    <div style={{ padding: "var(--space-3)", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>🛡️ Security Required</span>
                      {event.securityNotes && <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>{event.securityNotes}</p>}
                    </div>
                  )}
                  {event.needsResources && (
                    <div style={{ padding: "var(--space-3)", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>📦 Special Resources</span>
                      {event.resourceNotes && <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>{event.resourceNotes}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="card" style={{ marginBottom: "var(--space-4)" }}>
              <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-3)" }}>Details</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                <div><span style={{ color: "var(--text-muted)" }}>Created by:</span> {event.createdBy?.name}</div>
                {event.club && <div><span style={{ color: "var(--text-muted)" }}>Club:</span> {event.club.name}</div>}
                <div><span style={{ color: "var(--text-muted)" }}>Budget:</span> {formatCurrency(event.budgetEstimate)}</div>
                {event.venue && <div><span style={{ color: "var(--text-muted)" }}>Venue:</span> {event.venue}</div>}
                {event.eventDate && <div><span style={{ color: "var(--text-muted)" }}>Date:</span> {formatDate(event.eventDate)}</div>}
                {event.targetAudience && <div><span style={{ color: "var(--text-muted)" }}>Audience:</span> {event.targetAudience}</div>}
                {event.expectedAttendance && <div><span style={{ color: "var(--text-muted)" }}>Expected:</span> {event.expectedAttendance} attendees</div>}
              </div>
            </div>

            {/* Participating Clubs */}
            {event.eventType === "standard" && (
              <div className="card">
                <div className="card-header">
                  <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                    <Users size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />
                    Participating Clubs ({event.participants?.length || 0})
                  </h4>
                </div>
                {event.participants?.map((p) => (
                  <div key={p.id} style={{ padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
                    {p.club.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {tab === "approvals" && (
        <div>
          {/* Approval Actions */}
          {canApprove && (
            <div className="approval-actions" style={{ flexDirection: "column" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "var(--space-3)" }}>
                Your Review
              </h3>
              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add your review comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ minHeight: 80 }}
                />
              </div>

              {/* Department notification checkboxes (Dean only) */}
              {user?.role === "dean" && (
                <div className="form-group">
                  <label className="form-label">Notify Departments (upon approval)</label>
                  <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
                    {[
                      { value: "transport", label: "🚌 Transport" },
                      { value: "security", label: "🛡️ Security" },
                      { value: "resource", label: "📦 Resources" },
                      { value: "finance", label: "💰 Finance" },
                    ].map((dept) => (
                      <div key={dept.value} className="form-checkbox-group">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={deptNotifs.includes(dept.value)}
                          onChange={() => toggleDeptNotif(dept.value)}
                        />
                        <label style={{ fontSize: "var(--text-sm)" }}>{dept.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button className="btn btn-success" onClick={() => handleApproval("approved")} disabled={actionLoading}>
                  <CheckCircle size={16} /> Approve
                </button>
                <button className="btn btn-danger" onClick={() => handleApproval("rejected")} disabled={actionLoading}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* Approval Timeline */}
          <div className="card" style={{ marginTop: "var(--space-6)" }}>
            <h3 className="card-title" style={{ marginBottom: "var(--space-5)" }}>Approval Timeline</h3>
            {event.approvalLogs?.length === 0 ? (
              <div className="empty-state">
                <Clock size={48} />
                <h3>No approval actions yet</h3>
              </div>
            ) : (
              <div className="timeline">
                {event.approvalLogs?.map((log) => (
                  <div key={log.id} className="timeline-item">
                    <div className={`timeline-dot ${log.action}`} />
                    <div className="timeline-content">
                      <h4>
                        {log.user?.name} ({log.stage?.replace("_", " ")}) — {log.action}
                      </h4>
                      <p>{formatDateTime(log.createdAt)}</p>
                      {log.comment && <div className="comment">{log.comment}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budget Tab */}
      {tab === "budget" && (
        <div>
          <div className="stats-grid" style={{ marginBottom: "var(--space-6)" }}>
            <div className="stat-card">
              <div className="stat-icon info"><DollarSign size={22} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.budgetEstimate)}</h3>
                <p>Estimated</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success"><DollarSign size={22} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.budgetAllocated)}</h3>
                <p>Allocated</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger"><DollarSign size={22} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.totalExpenses)}</h3>
                <p>Spent</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning"><DollarSign size={22} /></div>
              <div className="stat-content">
                <h3>{formatCurrency(event.budgetRemaining)}</h3>
                <p>Remaining</p>
              </div>
            </div>
          </div>

          {/* Add Expense */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Expenses</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowExpenseForm(!showExpenseForm)}>
                <Plus size={14} /> Add Expense
              </button>
            </div>

            {showExpenseForm && (
              <form onSubmit={handleAddExpense} style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input type="number" className="form-input" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                      {["venue", "catering", "equipment", "printing", "transport", "security", "other"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} required />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Save Expense</button>
              </form>
            )}

            {event.expenses?.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No expenses recorded</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Description</th><th>Category</th><th>Amount</th><th>Added By</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {event.expenses?.map((exp) => (
                      <tr key={exp.id}>
                        <td>{exp.description}</td>
                        <td><span className="badge badge-draft" style={{ textTransform: "capitalize" }}>{exp.category}</span></td>
                        <td>{formatCurrency(exp.amount)}</td>
                        <td>{exp.addedBy?.name}</td>
                        <td>{formatDate(exp.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><ListTodo size={20} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }} /> Tasks</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus size={14} /> Add Task
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleAddTask} style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}>
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input className="form-input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deadline</label>
                    <input type="datetime-local" className="form-input" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Create Task</button>
              </form>
            )}

            {event.tasks?.length === 0 ? (
              <div className="empty-state">
                <ListTodo size={48} />
                <h3>No tasks yet</h3>
                <p>Add tasks to track event execution</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {event.tasks?.map((task) => (
                  <div key={task.id} style={{
                    padding: "var(--space-4)",
                    background: "var(--bg-primary)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{task.title}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                        {task.assignee ? `Assigned to ${task.assignee.name}` : "Unassigned"}
                        {task.deadline && ` • Due ${formatDate(task.deadline)}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                      <span className={`badge ${task.priority === "urgent" ? "badge-rejected" : task.priority === "high" ? "badge-pending" : "badge-draft"}`}>
                        {task.priority}
                      </span>
                      <span className={`badge ${task.status === "completed" ? "badge-approved" : task.status === "delayed" ? "badge-rejected" : "badge-pending"}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
