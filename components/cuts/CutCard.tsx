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
  const timeLabel = lang === "es" ? "Tiempo" : lang === "fi" ? "Aika" : "Time";
  const methodLabel = lang === "es" ? "Método" : lang === "fi" ? "Menetelmä" : "Method";
  const targetLabel = lang === "es" ? "Objetivo" : lang === "fi" ? "Tavoite" : "Target";
  const metaChips = [
    `${timeLabel}: ${getEstimatedTimeLabel(profile, lang)}`,
    `${methodLabel}: ${getStyleLabel(profile, lang)}`,
    ...(temperature ? [`${targetLabel}: ${temperature}`] : []),
  ];

  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      className={`group min-h-[110px] w-full max-w-full overflow-hidden rounded-[1.1rem] border p-2.5 text-left transition hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? "border-orange-400/70 bg-orange-500/20 shadow-[0_18px_60px_rgba(249,115,22,0.18)]"
          : "border-white/10 bg-[#080604]/80 hover:border-orange-400/45 hover:bg-white/[0.065]"
      }`}
    >
      <div className="flex h-full min-w-0 flex-col justify-between gap-2">
        <div>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-black tracking-tight text-white">{getDisplayName(profile, lang)}</h3>
              <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold leading-4 text-zinc-400">
                {getCutDescriptor(profile, lang)}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black text-orange-300">
              {getDifficultyLabel(profile, lang)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {metaChips.map((item) => (
            <CardMeta key={item} value={item} />
          ))}
        </div>
      </div>
    </button>
  );
}

function CardMeta({ value }: { value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black leading-4 text-orange-300">
      {value}
    </span>
  );
}
