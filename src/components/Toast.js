"use client";

import { useState, useEffect, useCallback } from "react";

export default function Toast({ message, type = "info", onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
}

// Toast hook for easy usage
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const ToastComponent = toast ? (
    <Toast
      key={toast.key}
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null;

  return { showToast, ToastComponent };
}
