// apps/admin/components/store-context.tsx

"use client";

import { createContext, useContext } from "react";

export type StoreContextType = {
  id: string;
  name: string;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({
  children,
  store,
}: {
  children: React.ReactNode;
  store: StoreContextType;
}) {
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);

  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return ctx;
}