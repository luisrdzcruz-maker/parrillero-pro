"use client";

import type { GeneratedAnimalId } from "@/lib/generated/cutProfiles";
import { getAvailableCategories, getCategoryLabel } from "./cutProfileSelectors";

type CutMapProps = {
  animal: GeneratedAnimalId;
  selectedZone: string | null;
  onZoneChange: (zone: string | null) => void;
};

export function CutMap({ animal, selectedZone, onZoneChange }: CutMapProps) {
  const zones = getAvailableCategories(animal);

  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Zone filter</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Filter by area</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Choose a cut category to narrow the list without changing your cooking path.
          </p>
        </div>
        {selectedZone && (
          <button
            type="button"
            onClick={() => onZoneChange(null)}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-zinc-200 transition active:scale-[0.97]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {zones.map((zone) => {
          const isActive = selectedZone === zone;
          return (
            <button
              key={zone}
              type="button"
              onClick={() => onZoneChange(isActive ? null : zone)}
              className={`rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
                isActive
                  ? "border-orange-400 bg-orange-500 text-black shadow-[0_16px_50px_rgba(249,115,22,0.24)]"
                  : "border-white/10 bg-black/25 text-zinc-200 hover:border-orange-400/45 hover:bg-white/[0.07]"
              }`}
            >
              <span className="block text-sm font-black">{getCategoryLabel(zone)}</span>
              <span className={`mt-1 block text-[11px] ${isActive ? "text-black/60" : "text-zinc-500"}`}>
                Tap to filter
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
