"use client";

import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import { CutCard } from "./CutCard";
import type { CutGroup } from "./cutSelectionTypes";

type CutListProps = {
  groups: CutGroup[];
  selectedCutId?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  onSelect: (profile: GeneratedCutProfile) => void;
};

export function CutList({
  groups,
  selectedCutId,
  hasActiveFilters = false,
  onResetFilters,
  onSelect,
}: CutListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-lg font-black tracking-tight text-white">No cuts match your current filters.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-zinc-500">
          Try a different cooking goal or clear the current filters to see every option.
        </p>
        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 rounded-full border border-orange-400/30 bg-orange-500/10 px-5 py-3 text-xs font-black text-orange-200 transition hover:bg-orange-500/15 active:scale-[0.97]"
          >
            Reset filters
          </button>
        )}
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Category</p>
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
