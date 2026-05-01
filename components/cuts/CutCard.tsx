"use client";

import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import {
  getDifficultyLabel,
  getDisplayName,
  getEstimatedTimeLabel,
  getShortAlias,
  getStyleLabel,
  getTemperatureLabel,
} from "./cutProfileSelectors";

type CutCardProps = {
  profile: GeneratedCutProfile;
  selected?: boolean;
  onSelect: (profile: GeneratedCutProfile) => void;
};

export function CutCard({ profile, selected = false, onSelect }: CutCardProps) {
  const temperature = getTemperatureLabel(profile);

  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      className={`group min-h-[148px] rounded-[1.45rem] border p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? "border-orange-400/70 bg-orange-500/20 shadow-[0_18px_60px_rgba(249,115,22,0.18)]"
          : "border-white/10 bg-[#080604]/80 hover:border-orange-400/45 hover:bg-white/[0.065]"
      }`}
    >
      <div className="flex h-full flex-col justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black tracking-tight text-white">{getDisplayName(profile)}</h3>
              <p className="mt-1 truncate text-xs font-semibold text-zinc-500">{getShortAlias(profile)}</p>
            </div>
            <span className="shrink-0 rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black text-orange-300">
              {getDifficultyLabel(profile)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <CardMeta label="Tiempo" value={getEstimatedTimeLabel(profile)} />
          <CardMeta label="Estilo" value={getStyleLabel(profile)} />
          <CardMeta label="Temp" value={temperature ?? "Visual"} muted={!temperature} />
        </div>
      </div>
    </button>
  );
}

function CardMeta({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <span className="rounded-2xl border border-white/10 bg-black/30 p-2">
      <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">{label}</span>
      <span className={`mt-1 block truncate text-[11px] font-black ${muted ? "text-zinc-400" : "text-orange-300"}`}>
        {value}
      </span>
    </span>
  );
}
