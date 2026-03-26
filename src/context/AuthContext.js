"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("diganta_token");
    const storedUser = localStorage.getItem("diganta_user");
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback((tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem("diganta_token", tokenValue);
    localStorage.setItem("diganta_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("diganta_token");
    localStorage.removeItem("diganta_user");
  }, []);

  // Authenticated fetch wrapper
  const apiFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      const res = await fetch(url, { ...options, headers });
      const data = await res.json();

      if (res.status === 401) {
        logout();
        throw new Error("Session expired");
      }

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    },
    [token, logout]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
