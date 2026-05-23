"use client";

import React, { createContext, useContext, useState } from "react";
import type { Chamber } from "@/types/doctor";

type ChamberContextValue = {
  activeChamber: Chamber | null;
  setActiveChamber: (c: Chamber | null) => void;
};

const ChamberContext = createContext<ChamberContextValue | undefined>(undefined);

export const ChamberProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeChamber, setActiveChamber] = useState<Chamber | null>(null);

  return (
    <ChamberContext.Provider value={{ activeChamber, setActiveChamber }}>
      {children}
    </ChamberContext.Provider>
  );
};

export const useChamber = () => {
  const ctx = useContext(ChamberContext);
  if (!ctx) throw new Error("useChamber must be used within a ChamberProvider");
  return ctx;
};

export default ChamberContext;
