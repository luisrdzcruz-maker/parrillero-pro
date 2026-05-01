"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import { getSetupVisual } from "@/lib/setup/getSetupVisual";
import { SETUP_VISUAL_FALLBACK } from "@/lib/setupVisualMap";
import {
  getCutDescriptor,
  getDisplayName,
  getDifficultyLabel,
  getEstimatedTimeLabel,
  getHelpfulAlias,
  getSafetyNote,
  getStyleLabel,
  getTemperatureLabel,
  getWhyChooseLabel,
} from "./cutProfileSelectors";
import { animalLabels, methodLabels } from "./cutSelectionTypes";

type CutBottomSheetProps = {
  profile: GeneratedCutProfile | null;
  onClose: () => void;
  onStartCooking?: (profile: GeneratedCutProfile) => void;
};

export function CutBottomSheet({ profile, onClose, onStartCooking }: CutBottomSheetProps) {
  const [visualFallbackStep, setVisualFallbackStep] = useState<"none" | "fallback">("none");
  const setupVisualSrc = useMemo(() => (profile ? getSetupVisual(profile.id) : null), [profile]);
  const visualSrc = visualFallbackStep === "fallback" ? SETUP_VISUAL_FALLBACK : setupVisualSrc;
  if (!profile) return null;

  const temperature = getTemperatureLabel(profile);
  const helpfulAlias = getHelpfulAlias(profile);
  const bestMethod = methodLabels[profile.defaultMethod] ?? getStyleLabel(profile);
  const methodValue = temperature ? `${bestMethod} · ${temperature}` : bestMethod;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl px-3 pb-3">
      <div className="rounded-t-[2rem] border border-white/10 bg-[#070503]/95 p-4 shadow-[0_-28px_110px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-5">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
              {animalLabels[profile.animalId]}
            </p>
            <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white">{getDisplayName(profile)}</h2>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-zinc-500">
              {helpfulAlias ? `Also known as ${helpfulAlias}.` : getCutDescriptor(profile)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-zinc-300 transition hover:bg-white/10 active:scale-[0.97]"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SheetPanel title="Why choose it" value={getWhyChooseLabel(profile)} />
          <SheetPanel title="Best method" value={methodValue} />
          <SheetPanel
            title="Time and difficulty"
            value={`${getEstimatedTimeLabel(profile)} · ${getDifficultyLabel(profile)} · rest ${profile.restingMinutes} min`}
          />
        </div>

        <div className="mt-3 overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950 shadow-lg shadow-black/25 ring-1 ring-inset ring-white/[0.04]">
          <div className="relative aspect-[16/10] w-full">
            {visualSrc ? (
              <Image
                src={visualSrc}
                alt={`Setup visual for ${getDisplayName(profile)}`}
                fill
                loading="lazy"
                sizes="(min-width: 640px) 560px, 100vw"
                className="object-cover"
                onError={() => {
                  if (visualFallbackStep === "none" && visualSrc !== SETUP_VISUAL_FALLBACK) {
                    setVisualFallbackStep("fallback");
                  }
                }}
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.22),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_56%,rgba(2,6,23,0.78)_100%)]" />
            <p className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur-md">
              Setup visual
            </p>
          </div>
        </div>

        <div className="mt-3">
          <SheetPanel title="Safety note" value={getSafetyNote(profile)} tone="danger" />
        </div>

        <button
          type="button"
          onClick={() => onStartCooking?.(profile)}
          className="mt-4 w-full rounded-[1.35rem] bg-gradient-to-r from-orange-400 to-red-500 px-5 py-4 text-sm font-black text-black shadow-[0_20px_70px_rgba(249,115,22,0.25)] transition active:scale-[0.98]"
        >
          Start cooking
        </button>
      </div>
    </aside>
  );
}

function SheetPanel({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={`rounded-[1.35rem] border p-4 ${
        tone === "danger" ? "border-red-400/20 bg-red-500/10" : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
          tone === "danger" ? "text-red-200" : "text-zinc-500"
        }`}
      >
        {title}
      </p>
      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-zinc-100">{value}</p>
    </div>
  );
}
