"use client";

import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import { CutCard } from "./CutCard";
import type { CutGroup } from "./cutSelectionTypes";

type CutListProps = {
  groups: CutGroup[];
  selectedCutId?: string;
  onSelect: (profile: GeneratedCutProfile) => void;
};

export function CutList({ groups, selectedCutId, onSelect }: CutListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-sm font-semibold text-zinc-500">
        No hay cortes para este filtro.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section
          key={group.id}
          className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Categoria</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-white">{group.label}</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-zinc-400">
              {group.cuts.length}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.cuts.map((profile) => (
              <CutCard
                key={profile.id}
                profile={profile}
                selected={selectedCutId === profile.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
