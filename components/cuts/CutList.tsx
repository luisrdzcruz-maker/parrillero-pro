"use client";

import { ds } from "@/lib/design-system";
import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";
import { CutCard } from "./CutCard";
import type { CutGroup } from "./cutSelectionTypes";
import {
  getCategoryLabelUi,
  getNoCutsMessage,
  getNoCutsTitle,
  getResetFiltersLabel,
} from "./cutSelectionTypes";

type CutListProps = {
  groups: CutGroup[];
  lang: Lang;
  selectedCutId?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  onSelect: (profile: GeneratedCutProfile) => void;
  onViewDetails?: (profile: GeneratedCutProfile) => void;
};

export function CutList({
  groups,
  lang,
  selectedCutId,
  hasActiveFilters = false,
  onResetFilters,
  onSelect,
  onViewDetails,
}: CutListProps) {
  if (groups.length === 0) {
    return (
      /* allow-arbitrary: rounded-[1.5rem] + bg-white/[0.04] — no-cuts state chassis, no canonical token */
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center">
        <p className="text-lg font-black tracking-tight text-white">
          {getNoCutsTitle(lang)}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-zinc-500">
          {getNoCutsMessage(lang)}
        </p>
        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 rounded-full border border-orange-400/30 bg-orange-500/10 px-5 py-3 text-xs font-black text-orange-200 transition hover:bg-orange-500/15 active:scale-[0.97]"
          >
            {getResetFiltersLabel(lang)}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-3">
      {groups.map((group) => (
        <section
          key={group.id}
          /* allow-arbitrary: rounded-[1.35rem] + bg-white/[0.04] — cut group section chassis, no canonical token */
          className="min-w-0 max-w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-2.5 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <div className="mb-2.5 flex items-end justify-between gap-3 px-1">
            <div>
              <p className={`${ds.text.body10} font-black uppercase tracking-[0.18em] ${ds.color.mutedClass.faint}`}>
                {getCategoryLabelUi(lang)}
              </p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-white">{group.label}</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-zinc-400">
              {group.cuts.length}
            </span>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.cuts.map((profile) => (
              <CutCard
                key={profile.id}
                profile={profile}
                lang={lang}
                selected={selectedCutId === profile.id}
                onSelect={onSelect}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
