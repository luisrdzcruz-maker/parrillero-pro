"use client";

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
};

export function CutCard({ profile, lang, selected = false, onSelect }: CutCardProps) {
  const temperature = getTemperatureLabel(profile);
  const metaSummary = [getEstimatedTimeLabel(profile, lang), getStyleLabel(profile, lang), temperature]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      className={`group w-full max-w-full overflow-hidden rounded-[1rem] border px-2.5 py-2 text-left transition hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? "border-orange-400/70 bg-orange-500/20 shadow-[0_18px_60px_rgba(249,115,22,0.18)]"
          : "border-white/10 bg-[#080604]/80 hover:border-orange-400/45 hover:bg-white/[0.065]"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="truncate text-[14px] font-black tracking-tight text-white">{getDisplayName(profile, lang)}</h3>
          <span className="shrink-0 rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-black text-orange-300">
            {getDifficultyLabel(profile, lang)}
          </span>
        </div>
        <p className="line-clamp-1 text-[11px] font-semibold leading-4 text-zinc-400">{getCutDescriptor(profile, lang)}</p>
        <p className="truncate text-[11px] font-black leading-4 text-orange-200">{metaSummary}</p>
      </div>
    </button>
  );
}
