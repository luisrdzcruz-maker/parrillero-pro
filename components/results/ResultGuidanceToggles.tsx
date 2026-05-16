"use client";

import Image from "next/image";
import { useState } from "react";
import { AppIcon } from "@/components/ui";
import { resolveMethodIconKey } from "@/lib/assets/equipmentMethodIconResolver";
import { ds } from "@/lib/design-system";
import {
  SETUP_VISUAL_FALLBACK,
  type SetupType,
} from "@/lib/setupVisualMap";
import {
  buildSetupVisualResult,
  getSetupOverlayChipClass,
} from "@/lib/results/setupVisualResult";
import type { ResultLang } from "@/lib/results/resultSummary";

type GuidanceKey = "setup" | "avoid" | "prep";

type GuidanceItem = {
  key: GuidanceKey;
  label: string;
  kicker: string;
  tone: "setup" | "avoid" | "prep";
  hasContent: boolean;
};

type ResultGuidanceTogglesProps = {
  avoidContent?: string;
  equipment?: string;
  lang: ResultLang;
  prepGuidanceLine?: string;
  setupContent?: string;
  setup?: SetupType;
};

const inlineFallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='30%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%23f97316' stop-opacity='.45'/%3E%3Cstop offset='60%25' stop-color='%230f172a'/%3E%3Cstop offset='100%25' stop-color='%23020617'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='700' fill='url(%23g)'/%3E%3Cpath d='M280 470h640' stroke='%23fb923c' stroke-width='18' stroke-linecap='round' opacity='.55'/%3E%3Cpath d='M340 405h520' stroke='%23fed7aa' stroke-width='10' stroke-linecap='round' opacity='.38'/%3E%3Ccircle cx='600' cy='300' r='105' fill='%23f97316' opacity='.18'/%3E%3C/svg%3E";

function getCopy(lang: ResultLang) {
  if (lang === "es") {
    return {
      setup: "Setup",
      setupKicker: "Fuego",
      avoid: "Evita",
      avoidKicker: "Riesgo",
      prep: "Prep",
      prepKicker: "Antes",
      prepNote: "No suma al tiempo de sesion",
      setupFallback: "Plan de fuego",
      avoidFallback: "Revisa el error principal antes de cocinar.",
      close: "Cerrar",
    };
  }
  return {
    setup: "Setup",
    setupKicker: "Fire",
    avoid: "Avoid",
    avoidKicker: "Risk",
    prep: "Prep",
    prepKicker: "Before",
    prepNote: "Not added to session time",
    setupFallback: "Fire plan",
    avoidFallback: "Check the main mistake before cooking.",
    close: "Close",
  };
}

function stripLinePrefix(line: string) {
  return line.replace(/^(?:[-•*]\s+|\d+[.)]\s+)/, "").trim();
}

function getCompactLines(value = "", maxLines = 2) {
  return value
    .split("\n")
    .map((line) => stripLinePrefix(line.trim()))
    .filter(Boolean)
    .slice(0, maxLines);
}

function toneClass(tone: GuidanceItem["tone"], active: boolean) {
  const base =
    "min-w-0 rounded-2xl border px-2.5 py-2.5 text-left transition active:scale-[0.98] ring-1 ring-inset";

  if (tone === "avoid") {
    return active
      ? `${base} border-red-300/45 bg-red-500/[0.14] text-red-50 ring-red-200/[0.08]`
      : `${base} border-red-300/18 bg-red-500/[0.055] text-red-100/85 ring-red-200/[0.035]`;
  }

  if (tone === "prep") {
    return active
      ? `${base} border-amber-300/40 bg-amber-500/[0.13] text-amber-50 ring-amber-200/[0.07]`
      : `${base} border-amber-300/16 bg-amber-500/[0.05] text-amber-100/85 ring-amber-200/[0.03]`;
  }

  return active
    ? `${base} border-orange-300/40 bg-orange-500/[0.13] text-orange-50 ring-orange-200/[0.07]`
    : `${base} border-orange-300/16 bg-orange-500/[0.05] text-orange-100/85 ring-orange-200/[0.03]`;
}

function dotClass(tone: GuidanceItem["tone"]) {
  /* allow-arbitrary: shadow-[...] tone-colored dot glow — no canonical ds.shadow.* tier */
  if (tone === "avoid") return "bg-red-300 shadow-[0_0_12px_rgba(252,165,165,0.42)]";
  /* allow-arbitrary: shadow-[...] tone-colored dot glow — no canonical ds.shadow.* tier */
  if (tone === "prep") return "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.36)]";
  /* allow-arbitrary: shadow-[...] tone-colored dot glow — no canonical ds.shadow.* tier */
  return "bg-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.4)]";
}

function SetupPanel({
  equipment,
  lang,
  setup,
  setupContent,
}: {
  equipment?: string;
  lang: ResultLang;
  setup?: SetupType;
  setupContent?: string;
}) {
  const [fallbackStep, setFallbackStep] = useState<"none" | "asset" | "inline">("none");
  const setupVisual = buildSetupVisualResult({
    content: setupContent,
    equipment,
    lang,
    setup,
  });

  if (!setupVisual) return null;

  const imageSrc =
    fallbackStep === "inline"
      ? inlineFallbackImage
      : fallbackStep === "asset"
        ? SETUP_VISUAL_FALLBACK
        : setupVisual.setupImage;

  return (
    <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-stretch">
      {/* allow-arbitrary: rounded-[1.1rem] — compact setup-visual frame radius, no canonical ds.radius.* tier */}
      <div className="relative h-32 overflow-hidden rounded-[1.1rem] border border-orange-200/15 bg-slate-950 sm:h-40">
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 640px) 180px, 100vw"
          className="object-cover"
          onError={() =>
            setFallbackStep((current) =>
              current === "none" && setupVisual.setupImage !== SETUP_VISUAL_FALLBACK ? "asset" : "inline",
            )
          }
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/20 to-transparent" />
        <div className="absolute left-2 top-2 flex max-w-[90%] flex-wrap gap-1.5">
          {setupVisual.overlayChips.slice(0, 2).map((chip) => {
            const chipIcon = resolveMethodIconKey(chip.label);

            return (
              <span
                key={`${chip.tone}-${chip.label}`}
                className={`${getSetupOverlayChipClass(chip.tone)} inline-flex items-center gap-1 px-2 py-1 ${ds.text.body10}`}
              >
                {chipIcon ? (
                  <AppIcon
                    category={chipIcon.category}
                    iconKey={chipIcon.key}
                    alt=""
                    size="sm"
                    aria-hidden="true"
                    className="h-3 w-3 opacity-85"
                  />
                ) : null}
                {chip.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-orange-300/15 bg-orange-500/[0.055] p-3">
        <p className={`${ds.text.body10} font-black uppercase tracking-[0.16em] ${ds.color.mutedClass.faint}`}>
          {setupVisual.setupVisualLabel}
        </p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-100">
          {setupVisual.setupLine}
        </p>
      </div>
    </div>
  );
}

export default function ResultGuidanceToggles({
  avoidContent,
  equipment,
  lang,
  prepGuidanceLine,
  setup,
  setupContent,
}: ResultGuidanceTogglesProps) {
  const copy = getCopy(lang);
  const setupVisual = buildSetupVisualResult({
    content: setupContent,
    equipment,
    lang,
    setup,
  });
  const avoidLines = getCompactLines(avoidContent, 2);
  const prepLines = getCompactLines(prepGuidanceLine, 1);
  const guidanceItems: GuidanceItem[] = [
    {
      key: "setup",
      label: copy.setup,
      kicker: copy.setupKicker,
      tone: "setup",
      hasContent: Boolean(setupVisual),
    },
    {
      key: "avoid",
      label: copy.avoid,
      kicker: copy.avoidKicker,
      tone: "avoid",
      hasContent: avoidLines.length > 0,
    },
    {
      key: "prep",
      label: copy.prep,
      kicker: copy.prepKicker,
      tone: "prep",
      hasContent: prepLines.length > 0,
    },
  ];
  const items = guidanceItems.filter((item) => item.hasContent);
  const [activeKey, setActiveKey] = useState<GuidanceKey | null>(null);
  const activeItem = items.find((item) => item.key === activeKey);

  if (items.length === 0) return null;

  return (
    <section className="col-span-full grid gap-2.5" aria-label="Result guidance">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const active = activeKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              aria-expanded={active}
              onClick={() => setActiveKey(active ? null : item.key)}
              className={toneClass(item.tone, active)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass(item.tone)}`} />
                <span className="min-w-0">
                  <span className={`block truncate ${ds.text.body9} font-black uppercase tracking-[0.16em] text-current/60`}>
                    {item.kicker}
                  </span>
                  <span className={`mt-0.5 block truncate ${ds.text.body13} font-black leading-tight text-white`}>
                    {item.label}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 backdrop-blur-sm sm:items-center sm:p-6">
          {/* allow-arbitrary: rounded-[1.65rem] — guidance modal radius, no canonical ds.radius.* tier */}
          <div className="w-full max-w-2xl overflow-hidden rounded-[1.65rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/45 ring-1 ring-inset ring-white/[0.05]">
            <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
              <div className="min-w-0">
                <p className={`${ds.text.body10} font-black uppercase tracking-[0.18em] ${ds.color.mutedClass.faint}`}>
                  {activeItem.kicker}
                </p>
                <h3 className="mt-0.5 truncate text-lg font-black tracking-tight text-white">
                  {activeItem.key === "setup" ? copy.setupFallback : activeItem.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveKey(null)}
                /* allow-arbitrary: bg-white/[0.06] — non-subpanel close-button surface, no canonical token */
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-slate-200 transition hover:bg-white/[0.1] active:scale-[0.98]"
              >
                {copy.close}
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto p-3.5 sm:max-h-[70vh] sm:p-4">
              {activeKey === "setup" ? (
                <SetupPanel equipment={equipment} lang={lang} setup={setup} setupContent={setupContent} />
              ) : activeKey === "avoid" ? (
                <div className="grid gap-2">
                  {(avoidLines.length ? avoidLines : [copy.avoidFallback]).map((line) => (
                    <div
                      key={line}
                      className="flex items-start gap-2.5 rounded-2xl border border-red-300/25 bg-red-500/[0.08] px-3 py-2.5 text-sm font-bold leading-relaxed text-red-50"
                    >
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass("avoid")}`} />
                      <p>{line}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-500/[0.07] px-3 py-2.5">
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${dotClass("prep")}`} />
                    <p className={`${ds.text.body10} font-black uppercase tracking-[0.16em] text-amber-200/90`}>
                      {copy.prepNote}
                    </p>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed text-amber-50">
                    {prepLines[0]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
