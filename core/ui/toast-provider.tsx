// packages/ui/src/toast-provider.tsx
"use client";

import * as React from "react";
import type { ToastPayload, ToastType } from "@/core/types";
import { ToastContainer } from "./toast";

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastPayload[]>([]);

  const showToast = React.useCallback((type: ToastType, message: string) => {
    const id = Date.now();

    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 9000);
  }, []);

  const value = React.useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}
