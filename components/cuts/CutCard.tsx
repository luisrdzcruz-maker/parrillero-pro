"use client";

import { BrandImageIcon } from "@/components/ui/BrandImageIcon";
import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";
import {
  getCutDescriptor,
  getDifficultyLabel,
  getDisplayName,
  getEstimatedTimeLabel,
  getStyleLabel,
  getTemperatureLabel,
} from "./cutProfileSelectors";
import { getCutSelectionIconPath } from "./cutSelectionIconResolver";

type CutCardProps = {
  profile: GeneratedCutProfile;
  lang: Lang;
  selected?: boolean;
  onSelect: (profile: GeneratedCutProfile) => void;
  onViewDetails?: (profile: GeneratedCutProfile) => void;
};

function getDetailsLabel(lang: Lang) {
  if (lang === "es") return "Ver detalles";

  return "View details";
}

export function CutCard({ profile, lang, selected = false, onSelect, onViewDetails }: CutCardProps) {
  const temperature = getTemperatureLabel(profile);
  const metaSummary = [getEstimatedTimeLabel(profile, lang), getStyleLabel(profile, lang), temperature]
    .filter(Boolean)
    .join(" · ");
  const cutIcon = getCutSelectionIconPath(profile);

  return (
    <article
      /* allow-arbitrary: pre-slice-a */
      className={`group w-full max-w-full overflow-hidden rounded-[1rem] border px-2.5 py-2 text-left transition hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          /* allow-arbitrary: pre-slice-a */
          ? "border-orange-400/70 bg-orange-500/20 shadow-[0_18px_60px_rgba(249,115,22,0.18)]"
          /* allow-arbitrary: pre-slice-a */
          : "border-white/10 bg-[#080604]/80 hover:border-orange-400/45 hover:bg-white/[0.065]"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <button type="button" onClick={() => onSelect(profile)} className="min-w-0 text-left">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {cutIcon && (
                <BrandImageIcon
                  src={cutIcon}
                  alt=""
                  size="sm"
                  shape="plain"
                  aria-hidden="true"
                  className="h-7 w-7 rounded-lg"
                  /* allow-arbitrary: pre-slice-a */
                  fallback={<span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange-300/80 shadow-[0_0_14px_rgba(251,146,60,0.32)]" />}
                />
              )}
              {/* allow-arbitrary: pre-slice-a */}
              <h3 className="truncate text-[14px] font-black tracking-tight text-white">{getDisplayName(profile, lang)}</h3>
            </div>
            {/* allow-arbitrary: pre-slice-a */}
            <span className="shrink-0 rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-black text-orange-300">
              {getDifficultyLabel(profile, lang)}
            </span>
          </div>
          {/* allow-arbitrary: pre-slice-a */}
          <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold leading-4 text-zinc-400">{getCutDescriptor(profile, lang)}</p>
          {/* allow-arbitrary: pre-slice-a */}
          <p className="mt-1 truncate text-[11px] font-black leading-4 text-orange-200">{metaSummary}</p>
        </button>
        <div className="flex items-center justify-between gap-2">
          {/* allow-arbitrary: pre-slice-a */}
          <span className="text-[10px] font-bold text-zinc-600">
            {lang === "es" ? "Abrir formulario" : "Open form"}
          </span>
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(profile)}
              /* allow-arbitrary: pre-slice-a */
              className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[10px] font-black text-zinc-300 transition hover:border-orange-300/35 hover:bg-orange-500/10 hover:text-orange-200 active:scale-[0.97]"
            >
              {getDetailsLabel(lang)}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
