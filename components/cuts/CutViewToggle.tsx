"use client";

import type { CutViewMode } from "./cutSelectionTypes";
import type { Lang } from "@/lib/i18n/texts";

type CutViewToggleProps = {
  lang: Lang;
  value: CutViewMode;
  onChange: (value: CutViewMode) => void;
};

export function CutViewToggle({ lang, value, onChange }: CutViewToggleProps) {
  return (
    <div className="w-full max-w-full rounded-[1.2rem] border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl">
      <div className="grid w-full min-w-0 grid-cols-2 gap-1">
        {(["list", "map"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`min-w-0 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition active:scale-[0.98] ${
              value === mode ? "bg-white text-black" : "text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
            }`}
            aria-pressed={value === mode}
          >
            {mode === "list"
              ? lang === "es"
                ? "Lista"
                : lang === "fi"
                  ? "Lista"
                  : "List"
              : lang === "es"
                ? "Mapa"
                : lang === "fi"
                  ? "Kartta"
                  : "Map"}
          </button>
        ))}
      </div>
    </div>
  );
}
