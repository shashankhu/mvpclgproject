"use client";

import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
    </AuthProvider>
  );
}
