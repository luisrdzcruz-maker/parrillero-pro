"use client";

import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import { getDisplayName, getEstimatedTimeLabel, getQuickPicksByAnimal, getShortAlias } from "./cutProfileSelectors";
import type { CutIntent } from "./cutSelectionTypes";

type QuickPicksProps = {
  animal: GeneratedAnimalId;
  intent: CutIntent | null;
  selectedCutId?: string;
  onSelect: (profile: GeneratedCutProfile) => void;
};

export function QuickPicks({ animal, intent, selectedCutId, onSelect }: QuickPicksProps) {
  const picks = getQuickPicksByAnimal(animal, intent);

  if (picks.length === 0) return null;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-black text-white">Quick picks</h2>
        <span className="text-xs font-bold text-zinc-500">{picks.length}</span>
      </div>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {picks.map((profile) => {
          const isActive = selectedCutId === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(profile)}
              className={`min-w-[150px] snap-start rounded-2xl border p-3 text-left transition active:scale-[0.97] ${
                isActive
                  ? "border-orange-400 bg-orange-500/20"
                  : "border-white/10 bg-black/25 hover:border-orange-400/45 hover:bg-white/[0.07]"
              }`}
            >
              <span className="block truncate text-sm font-black text-white">{getDisplayName(profile)}</span>
              <span className="mt-1 block truncate text-[11px] text-zinc-500">{getShortAlias(profile)}</span>
              <span className="mt-2 inline-flex rounded-full bg-orange-500/10 px-2 py-1 text-[10px] font-black text-orange-300">
                {getEstimatedTimeLabel(profile)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
