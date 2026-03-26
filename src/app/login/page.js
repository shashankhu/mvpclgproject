"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Login failed", "error");
        setLoading(false);
        return;
      }

      localStorage.setItem("diganta_token", data.token);
      localStorage.setItem("diganta_user", JSON.stringify(data.user));
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
          <p>College Event Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{" "}
          <a href="/signup">Sign up</a>
        </div>
      </div>
    </div>
  );
}
