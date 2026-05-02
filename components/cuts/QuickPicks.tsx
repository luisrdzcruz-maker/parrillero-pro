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
    <section className="min-w-0 max-w-full rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-black text-white">
            {lang === "es" ? "Selecciones rápidas" : lang === "fi" ? "Pikavalinnat" : "Quick picks"}
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold text-zinc-500">
            {lang === "es"
              ? "Opciones rápidas para este filtro"
              : lang === "fi"
                ? "Nopeat valinnat tälle suodattimelle"
                : "Fast choices for this filter"}
          </p>
        </div>
        <span className="text-xs font-bold text-zinc-500">{picks.length}</span>
      </div>
      <div className="flex max-w-full min-w-0 snap-x gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1">
        {picks.map((profile) => {
          const isActive = selectedCutId === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(profile)}
              className={`min-w-[150px] shrink-0 snap-start rounded-2xl border p-3 text-left transition active:scale-[0.97] ${
                isActive
                  ? "border-orange-400 bg-orange-500/20"
                  : "border-white/10 bg-black/25 hover:border-orange-400/45 hover:bg-white/[0.07]"
              }`}
            >
              <span className="block truncate text-sm font-black text-white">{getDisplayName(profile, lang)}</span>
              <span className="mt-1 block truncate text-[11px] text-zinc-500">{getCutDescriptor(profile, lang)}</span>
              <span className="mt-2 inline-flex rounded-full bg-orange-500/10 px-2 py-1 text-[10px] font-black text-orange-300">
                {getEstimatedTimeLabel(profile, lang)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
