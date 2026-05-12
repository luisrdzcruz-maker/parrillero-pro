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
    /* allow-arbitrary: pre-slice-a */
    <section className="min-w-0 max-w-full rounded-[1.05rem] border border-white/10 bg-white/[0.03] px-2 py-1.5 shadow-xl shadow-black/20 backdrop-blur-xl sm:rounded-[1.2rem] sm:p-2">
      <div className="flex max-w-full min-w-0 gap-1 overflow-x-auto px-0.5 py-0.5 touch-pan-x [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0.5 [&::-webkit-scrollbar]:hidden">
        {intents.map((intent) => {
          const isActive = selectedIntent === intent;
          return (
            <button
              key={intent}
              type="button"
              onClick={() => onIntentChange(isActive ? null : intent)}
              /* allow-arbitrary: pre-slice-a */
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-black leading-tight tracking-[-0.01em] transition active:scale-[0.97] sm:min-w-0 sm:text-sm ${
                isActive
                  /* allow-arbitrary: pre-slice-a */
                  ? "border-orange-400 bg-orange-500 text-black shadow-[0_8px_24px_rgba(249,115,22,0.22)]"
                  /* allow-arbitrary: pre-slice-a */
                  : "border-white/10 bg-black/25 text-zinc-300 hover:border-orange-400/45 hover:bg-white/[0.07]"
              }`}
              aria-pressed={isActive}
            >
              <span className="block truncate">{getIntentLabel(intent, lang)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
