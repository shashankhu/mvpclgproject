"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "club_head", label: "Club Head" },
  { value: "faculty_coordinator", label: "Faculty Coordinator" },
  { value: "dean", label: "Dean" },
  { value: "principal", label: "Principal" },
  { value: "admin", label: "Administrator" },
  { value: "transport", label: "Transport Dept" },
  { value: "security", label: "Security Dept" },
  { value: "resource", label: "Resource Dept" },
  { value: "finance", label: "Finance Dept" },
];

export default function SignupPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Signup failed", "error");
        setLoading(false);
        return;
      }

      localStorage.setItem("diganta_token", data.token);
      localStorage.setItem("diganta_user", JSON.stringify(data.user));
      showToast("Account created!", "success");
      router.push("/dashboard");
    } catch {
      showToast("Network error", "error");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {ToastComponent}
      <div className="auth-card">
        <div className="auth-logo">
          <h1>DIGANTA</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              className="form-input"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <select
                id="role"
                className="form-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="department">Department</label>
              <input
                id="department"
                className="form-input"
                placeholder="e.g. CSE"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <a href="/login">Sign in</a>
        </div>
      </div>
    </div>
  );
}
