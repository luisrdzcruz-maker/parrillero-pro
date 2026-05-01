"use client";

import type { CutViewMode } from "./cutSelectionTypes";

type CutViewToggleProps = {
  value: CutViewMode;
  onChange: (value: CutViewMode) => void;
};

export function CutViewToggle({ value, onChange }: CutViewToggleProps) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-1.5">
        {(["list", "map"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition active:scale-[0.98] ${
              value === mode ? "bg-white text-black" : "text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
            }`}
            aria-pressed={value === mode}
          >
            {mode === "list" ? "Lista" : "Mapa"}
          </button>
        ))}
      </div>
    </div>
  );
}
