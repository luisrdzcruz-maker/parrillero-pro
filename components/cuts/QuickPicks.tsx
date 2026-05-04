"use client";

import { BrandImageIcon } from "@/components/ui/BrandImageIcon";
import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";
import {
  getCutDescriptor,
  getDisplayName,
  getEstimatedTimeLabel,
  getRecommendedCuts,
} from "./cutProfileSelectors";
import { getCutSelectionIconPath } from "./cutSelectionIconResolver";
import type { CutIntent } from "./cutSelectionTypes";

type QuickPicksProps = {
  profiles: GeneratedCutProfile[];
  intent: CutIntent | null;
  lang: Lang;
  limit?: number;
  selectedCutId?: string;
  fillAvailable?: boolean;
  onSelect: (profile: GeneratedCutProfile) => void;
  onViewDetails?: (profile: GeneratedCutProfile) => void;
};

function getDetailsLabel(lang: Lang) {
  if (lang === "es") return "Detalles";
  if (lang === "fi") return "Tiedot";
  return "Details";
}

export function QuickPicks({
  profiles,
  intent,
  lang,
  limit = 4,
  selectedCutId,
  fillAvailable = false,
  onSelect,
  onViewDetails,
}: QuickPicksProps) {
  const picks = getRecommendedCuts(profiles, intent, limit);

  if (picks.length === 0) return null;

  return (
    <section
      className={`min-w-0 max-w-full rounded-[1.05rem] border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl sm:rounded-[1.2rem] sm:p-2 ${
        fillAvailable ? "flex min-h-0 flex-1 flex-col" : ""
      }`}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
            {lang === "es" ? "Recomendados" : lang === "fi" ? "Suositukset" : "Recommended"}
          </h2>
        </div>
        <span className="text-xs font-bold text-zinc-500">{picks.length}</span>
      </div>
      <div
        className={`grid max-w-full min-w-0 content-start gap-1.5 overflow-y-auto px-0.5 pb-0.5 touch-pan-y [scrollbar-width:none] sm:grid-cols-2 sm:overflow-visible sm:px-1 [&::-webkit-scrollbar]:hidden ${
          fillAvailable ? "min-h-0 flex-1" : "sm:max-h-none"
        }`}
      >
        {picks.map((profile) => {
          const isActive = selectedCutId === profile.id;
          const cutIcon = getCutSelectionIconPath(profile);
          return (
            <article
              key={profile.id}
              className={`flex min-w-0 items-center gap-2 rounded-xl border p-1.5 text-left transition active:scale-[0.97] sm:p-2 ${
                isActive
                  ? "border-orange-400 bg-orange-500/20 shadow-[0_12px_30px_rgba(249,115,22,0.12)]"
                  : "border-white/10 bg-black/25 hover:border-orange-400/45 hover:bg-white/[0.07]"
              }`}
            >
              <button type="button" onClick={() => onSelect(profile)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 sm:h-11 sm:w-11">
                  {cutIcon ? (
                    <BrandImageIcon
                      src={cutIcon}
                      alt=""
                      size="sm"
                      shape="plain"
                      aria-hidden="true"
                      className="h-8 w-8 rounded-lg"
                      fallback={<span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-orange-300/80 shadow-[0_0_16px_rgba(251,146,60,0.35)]" />}
                    />
                  ) : (
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-orange-300/80 shadow-[0_0_16px_rgba(251,146,60,0.35)]" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-black text-white sm:text-sm">{getDisplayName(profile, lang)}</span>
                  <span className="mt-0.5 block truncate text-[10px] font-semibold text-zinc-500 sm:text-[11px]">{getCutDescriptor(profile, lang)}</span>
                  <span className="mt-0.5 block truncate text-[10px] font-black text-orange-300">{getEstimatedTimeLabel(profile, lang)}</span>
                </span>
              </button>
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(profile)}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black text-zinc-400 transition hover:border-orange-300/35 hover:text-orange-200 active:scale-[0.97]"
                >
                  {getDetailsLabel(lang)}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
