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
  const meta = [
    {
      label: lang === "es" ? "Tiempo" : lang === "fi" ? "Aika" : "Time",
      value: getEstimatedTimeLabel(profile, lang),
    },
    {
      label: lang === "es" ? "Método" : lang === "fi" ? "Menetelmä" : "Method",
      value: getStyleLabel(profile, lang),
    },
    ...(temperature
      ? [{ label: lang === "es" ? "Objetivo" : lang === "fi" ? "Tavoite" : "Target", value: temperature }]
      : []),
  ];

  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      className={`group min-h-[156px] w-full max-w-full overflow-hidden rounded-[1.45rem] border p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? "border-orange-400/70 bg-orange-500/20 shadow-[0_18px_60px_rgba(249,115,22,0.18)]"
          : "border-white/10 bg-[#080604]/80 hover:border-orange-400/45 hover:bg-white/[0.065]"
      }`}
    >
      <div className="flex h-full min-w-0 flex-col justify-between gap-4">
        <div>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black tracking-tight text-white">{getDisplayName(profile, lang)}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-zinc-400">
                {getCutDescriptor(profile, lang)}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black text-orange-300">
              {getDifficultyLabel(profile, lang)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {meta.map((item) => (
            <CardMeta key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </div>
    </button>
  );
}

function CardMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-2xl border border-white/10 bg-black/30 p-2">
      <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">{label}</span>
      <span className="mt-1 block break-words text-[11px] font-black leading-4 text-orange-300">{value}</span>
    </span>
  );
}
