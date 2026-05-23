"use client";

import React from "react";
import { useChamber } from "@/context/ChamberContext";
import type { Chamber as ChamberType } from "@/types/doctor";

export default function ChamberDropdown({ chambers }: { chambers?: ChamberType[] }) {
  const { activeChamber, setActiveChamber } = useChamber();

  if (!chambers || chambers.length === 0) return null;

  return (
    <div className="relative">
      <label className="sr-only">Select chamber</label>
      <select
        aria-label="Select active chamber"
        value={activeChamber?.id ?? chambers[0].id}
        onChange={(e) => {
          const selected = chambers.find((c) => c.id === e.target.value) ?? null;
          setActiveChamber(selected);
        }}
        className="rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
      >
        {chambers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
