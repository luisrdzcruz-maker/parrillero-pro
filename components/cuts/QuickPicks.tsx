"use client";

import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";
import {
  getCutDescriptor,
  getDisplayName,
  getEstimatedTimeLabel,
  getQuickPicksByAnimal,
} from "./cutProfileSelectors";
import type { CutIntent } from "./cutSelectionTypes";

type QuickPicksProps = {
  animal: GeneratedAnimalId;
  intent: CutIntent | null;
  lang: Lang;
  selectedCutId?: string;
  onSelect: (profile: GeneratedCutProfile) => void;
};

export function QuickPicks({ animal, intent, lang, selectedCutId, onSelect }: QuickPicksProps) {
  const picks = getQuickPicksByAnimal(animal, intent);

  if (picks.length === 0) return null;

  return (
    <section className="min-w-0 max-w-full rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
            {lang === "es" ? "Selecciones rápidas" : lang === "fi" ? "Pikavalinnat" : "Quick picks"}
          </h2>
        </div>
        <span className="text-xs font-bold text-zinc-500">{picks.length}</span>
      </div>
      <div
        className="flex max-w-full min-w-0 snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ msOverflowStyle: "none" }}
      >
        {picks.map((profile) => {
          const isActive = selectedCutId === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(profile)}
              className={`min-w-[136px] shrink-0 snap-start rounded-xl border p-2 text-left transition active:scale-[0.97] ${
                isActive
                  ? "border-orange-400 bg-orange-500/20"
                  : "border-white/10 bg-black/25 hover:border-orange-400/45 hover:bg-white/[0.07]"
              }`}
            >
              <span className="block truncate text-[13px] font-black text-white">{getDisplayName(profile, lang)}</span>
              <span className="mt-1 block truncate text-[10px] text-zinc-500">{getCutDescriptor(profile, lang)}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-orange-300">
                <span className="inline-flex rounded-full bg-orange-500/10 px-2 py-0.5">{getEstimatedTimeLabel(profile, lang)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
