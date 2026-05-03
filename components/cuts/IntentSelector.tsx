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
    <section className="min-w-0 max-w-full rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-2 shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-1.5 px-1">
        <h2 className="text-[12px] font-black tracking-tight text-white">
          {lang === "es" ? "¿Qué buscas?" : lang === "fi" ? "Mitä etsit?" : "What are you looking for?"}
        </h2>
      </div>
      <div
        className="flex max-w-full min-w-0 gap-1 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible"
        style={{ msOverflowStyle: "none" }}
      >
        {intents.map((intent) => {
          const isActive = selectedIntent === intent;
          return (
            <button
              key={intent}
              type="button"
              onClick={() => onIntentChange(isActive ? null : intent)}
              className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-black transition active:scale-[0.97] ${
                isActive
                  ? "border-orange-400 bg-orange-500 text-black shadow-[0_8px_24px_rgba(249,115,22,0.22)]"
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
