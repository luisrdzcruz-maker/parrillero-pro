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
    <div className="w-full max-w-full rounded-[1.35rem] border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl">
      <div className="grid w-full min-w-0 grid-cols-2 gap-1.5">
        {(["list", "map"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`min-w-0 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition active:scale-[0.98] ${
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
