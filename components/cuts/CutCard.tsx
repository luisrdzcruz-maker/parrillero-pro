"use client";

import { BrandImageIcon } from "@/components/ui/BrandImageIcon";
import { cutIconAssets } from "@/lib/brand/cutIconAssets";
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

type CutCardProps = {
  profile: GeneratedCutProfile;
  lang: Lang;
  selected?: boolean;
  onSelect: (profile: GeneratedCutProfile) => void;
  onViewDetails?: (profile: GeneratedCutProfile) => void;
};

function getDetailsLabel(lang: Lang) {
  if (lang === "es") return "Ver detalles";
  if (lang === "fi") return "Näytä tiedot";
  return "View details";
}

function getCutIconAsset(cutId: string) {
  return cutId in cutIconAssets ? cutIconAssets[cutId as keyof typeof cutIconAssets] : undefined;
}

export function CutCard({ profile, lang, selected = false, onSelect, onViewDetails }: CutCardProps) {
  const temperature = getTemperatureLabel(profile);
  const metaSummary = [getEstimatedTimeLabel(profile, lang), getStyleLabel(profile, lang), temperature]
    .filter(Boolean)
    .join(" · ");
  const cutIcon = getCutIconAsset(profile.id);

  return (
    <article
      className={`group w-full max-w-full overflow-hidden rounded-[1rem] border px-2.5 py-2 text-left transition hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? "border-orange-400/70 bg-orange-500/20 shadow-[0_18px_60px_rgba(249,115,22,0.18)]"
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
                />
              )}
              <h3 className="truncate text-[14px] font-black tracking-tight text-white">{getDisplayName(profile, lang)}</h3>
            </div>
            <span className="shrink-0 rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-black text-orange-300">
              {getDifficultyLabel(profile, lang)}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold leading-4 text-zinc-400">{getCutDescriptor(profile, lang)}</p>
          <p className="mt-1 truncate text-[11px] font-black leading-4 text-orange-200">{metaSummary}</p>
        </button>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-zinc-600">
            {lang === "es" ? "Abrir formulario" : lang === "fi" ? "Avaa lomake" : "Open form"}
          </span>
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(profile)}
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
