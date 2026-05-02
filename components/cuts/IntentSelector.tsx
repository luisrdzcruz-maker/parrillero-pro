"use client";

import type { CutIntent } from "./cutSelectionTypes";
import type { Lang } from "@/lib/i18n/texts";
import { getIntentLabel } from "./cutSelectionTypes";

const intents: CutIntent[] = ["quick", "premium", "easy", "slow", "value", "argentinian"];

type IntentSelectorProps = {
  lang: Lang;
  selectedIntent: CutIntent | null;
  onIntentChange: (intent: CutIntent | null) => void;
};

export function IntentSelector({ lang, selectedIntent, onIntentChange }: IntentSelectorProps) {
  return (
    <section className="min-w-0 max-w-full rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-black text-white">
            {lang === "es" ? "Objetivo de cocción" : lang === "fi" ? "Kypsennystavoite" : "Cooking goal"}
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold text-zinc-500">
            {lang === "es"
              ? "Filtra por el resultado que buscas"
              : lang === "fi"
                ? "Suodata halutun lopputuloksen mukaan"
                : "Filter by the result you want"}
          </p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
          {lang === "es" ? "Filtro" : lang === "fi" ? "Suodatin" : "Filter"}
        </span>
      </div>
      <div className="flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {intents.map((intent) => {
          const isActive = selectedIntent === intent;
          return (
            <button
              key={intent}
              type="button"
              onClick={() => onIntentChange(isActive ? null : intent)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-black transition active:scale-[0.97] ${
                isActive
                  ? "border-orange-400 bg-orange-500 text-black shadow-[0_12px_36px_rgba(249,115,22,0.25)]"
                  : "border-white/10 bg-black/25 text-zinc-300 hover:border-orange-400/45 hover:bg-white/[0.07]"
              }`}
              aria-pressed={isActive}
            >
              {getIntentLabel(intent, lang)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
