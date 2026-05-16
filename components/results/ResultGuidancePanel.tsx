"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/ui";
import { resolveMethodIconKey } from "@/lib/assets/equipmentMethodIconResolver";
import { ds } from "@/lib/design-system";
import { SETUP_VISUAL_FALLBACK, type SetupType } from "@/lib/setupVisualMap";
import { buildSetupVisualResult, getSetupOverlayChipClass } from "@/lib/results/setupVisualResult";
import type { ResultLang } from "@/lib/results/resultSummary";

type ResultGuidancePanelProps = {
  avoidContent?: string;
  lang: ResultLang;
  prepGuidanceLine?: string;
};

type SetupDetailSurfaceProps = {
  equipment?: string;
  lang: ResultLang;
  onClose: () => void;
  open: boolean;
  setup?: SetupType;
  setupContent?: string;
};

const inlineFallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='30%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%23f97316' stop-opacity='.45'/%3E%3Cstop offset='60%25' stop-color='%230f172a'/%3E%3Cstop offset='100%25' stop-color='%23020617'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='700' fill='url(%23g)'/%3E%3Cpath d='M280 470h640' stroke='%23fb923c' stroke-width='18' stroke-linecap='round' opacity='.55'/%3E%3Cpath d='M340 405h520' stroke='%23fed7aa' stroke-width='10' stroke-linecap='round' opacity='.38'/%3E%3Ccircle cx='600' cy='300' r='105' fill='%23f97316' opacity='.18'/%3E%3C/svg%3E";

function getCopy(lang: ResultLang) {
  if (lang === "es") {
    return {
      avoid: "Evita",
      close: "Cerrar",
      prep: "Prep",
      prepNote: "No suma al tiempo de sesion",
      setup: "Plan de fuego",
      setupKicker: "Fuego",
    };
  }
  return {
    avoid: "Avoid",
    close: "Close",
    prep: "Prep",
    prepNote: "Not added to session time",
    setup: "Fire plan",
    setupKicker: "Fire",
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

function dotClass(tone: "avoid" | "prep" | "setup") {
  /* allow-arbitrary: shadow-[...] tone-colored dot glow — no canonical ds.shadow.* tier */
  if (tone === "avoid") return "bg-red-300 shadow-[0_0_12px_rgba(252,165,165,0.42)]";
  /* allow-arbitrary: shadow-[...] tone-colored dot glow — no canonical ds.shadow.* tier */
  if (tone === "prep") return "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.36)]";
  /* allow-arbitrary: shadow-[...] tone-colored dot glow — no canonical ds.shadow.* tier */
  return "bg-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.4)]";
}

export function pushResultOverlayHistory(overlayId: string) {
  if (typeof window === "undefined") return;

  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.get("step") !== "result") {
    currentUrl.searchParams.set("step", "result");
  }
  currentUrl.searchParams.delete("resultOverlay");
  window.history.replaceState(window.history.state ?? {}, "", currentUrl.toString());

  const overlayUrl = new URL(currentUrl.toString());
  overlayUrl.searchParams.set("resultOverlay", overlayId);

  window.history.pushState(
    { ...(window.history.state ?? {}), resultOverlay: overlayId },
    "",
    overlayUrl.toString(),
  );
}

export function useResultOverlayBackBehavior(open: boolean, onClose: () => void) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    pushedRef.current = true;

    function handlePopState() {
      pushedRef.current = false;
      const resultUrl = new URL(window.location.href);
      resultUrl.searchParams.set("step", "result");
      resultUrl.searchParams.delete("resultOverlay");
      window.history.replaceState(window.history.state ?? {}, "", resultUrl.toString());
      onClose();
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onClose, open]);

  return function closeWithHistory() {
    if (typeof window !== "undefined" && pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
      return;
    }

    onClose();
  };
}

function SetupDetailContent({ equipment, lang, setup, setupContent }: Omit<SetupDetailSurfaceProps, "onClose" | "open">) {
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
    <div className="grid gap-3 sm:grid-cols-[minmax(240px,0.85fr)_minmax(0,1fr)] sm:items-stretch">
      {/* allow-arbitrary: rounded-[1.2rem] — setup visual frame radius, no canonical ds.radius.* tier */}
      <div className="relative h-56 overflow-hidden rounded-[1.2rem] border border-orange-200/15 bg-slate-950 sm:h-[22rem]">
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 640px) 420px, 100vw"
          className="object-cover"
          onError={() =>
            setFallbackStep((current) =>
              current === "none" && setupVisual.setupImage !== SETUP_VISUAL_FALLBACK ? "asset" : "inline",
            )
          }
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/72 via-slate-950/20 to-transparent" />
        <div className="absolute left-3 top-3 flex max-w-[92%] flex-wrap gap-1.5">
          {setupVisual.overlayChips.map((chip) => {
            const chipIcon = resolveMethodIconKey(chip.label);

            return (
              <span
                key={`${chip.tone}-${chip.label}`}
                className={`${getSetupOverlayChipClass(chip.tone)} inline-flex items-center gap-1.5 px-2.5 py-1.5 ${ds.text.body10}`}
              >
                {chipIcon ? (
                  <AppIcon
                    category={chipIcon.category}
                    iconKey={chipIcon.key}
                    alt=""
                    size="sm"
                    aria-hidden="true"
                    className="h-3.5 w-3.5 opacity-85"
                  />
                ) : null}
                {chip.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-orange-300/15 bg-orange-500/[0.055] p-4">
        <p className={`${ds.text.body10} font-black uppercase tracking-[0.16em] text-orange-300/85`}>
          {setupVisual.setupVisualLabel}
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-100">
          {setupVisual.setupLine}
        </p>
      </div>
    </div>
  );
}

export function SetupDetailSurface({
  equipment,
  lang,
  onClose,
  open,
  setup,
  setupContent,
}: SetupDetailSurfaceProps) {
  const copy = getCopy(lang);
  const closeWithHistory = useResultOverlayBackBehavior(open, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/74 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 backdrop-blur-sm sm:items-center sm:p-6"
      aria-modal="true"
      role="dialog"
    >
      {/* allow-arbitrary: rounded-[1.65rem] — setup detail dialog radius, no canonical ds.radius.* tier */}
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.65rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/45 ring-1 ring-inset ring-white/[0.05]">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
          <div className="min-w-0">
            <p className={`${ds.text.body10} font-black uppercase tracking-[0.18em] text-orange-300/75`}>
              {copy.setupKicker}
            </p>
            <h3 className="mt-0.5 truncate text-lg font-black tracking-tight text-white">
              {copy.setup}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeWithHistory}
            /* allow-arbitrary: bg-white/[0.06] — non-subpanel close-button surface, no canonical token */
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-slate-200 transition hover:bg-white/[0.1] active:scale-[0.98]"
          >
            {copy.close}
          </button>
        </div>

        <div className="overflow-y-auto p-3.5 sm:p-4">
          <SetupDetailContent equipment={equipment} lang={lang} setup={setup} setupContent={setupContent} />
        </div>
      </div>
    </div>
  );
}

export default function ResultGuidancePanel({ avoidContent, lang, prepGuidanceLine }: ResultGuidancePanelProps) {
  const copy = getCopy(lang);
  const avoidLines = getCompactLines(avoidContent, 2);
  const prepLines = getCompactLines(prepGuidanceLine, 1);

  if (avoidLines.length === 0 && prepLines.length === 0) return null;

  return (
    <section className="col-span-full grid gap-2.5 sm:grid-cols-2" aria-label="Result guidance">
      {avoidLines.length > 0 ? (
        /* allow-arbitrary: rounded-[1.25rem] — avoid-tone article radius, no canonical ds.radius.* tier */
        <article className="rounded-[1.25rem] border border-red-300/22 bg-red-500/[0.07] p-3 ring-1 ring-inset ring-red-200/[0.04]">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dotClass("avoid")}`} />
            <p className={`${ds.text.body10} font-black uppercase tracking-[0.16em] text-red-200/85`}>
              {copy.avoid}
            </p>
          </div>
          <div className="grid gap-1.5">
            {avoidLines.map((line) => (
              <p key={line} className="text-sm font-bold leading-relaxed text-red-50">
                {line}
              </p>
            ))}
          </div>
        </article>
      ) : null}

      {prepLines.length > 0 ? (
        /* allow-arbitrary: rounded-[1.25rem] — prep-tone article radius, no canonical ds.radius.* tier */
        <article className="rounded-[1.25rem] border border-amber-300/20 bg-amber-500/[0.07] p-3 ring-1 ring-inset ring-amber-200/[0.035]">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`h-2 w-2 rounded-full ${dotClass("prep")}`} />
            <p className={`${ds.text.body10} font-black uppercase tracking-[0.16em] text-amber-200/90`}>
              {copy.prep}
            </p>
            <span className={`${ds.text.body10} font-black uppercase tracking-[0.12em] text-amber-100/45`}>
              {copy.prepNote}
            </span>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-amber-50">
            {prepLines[0]}
          </p>
        </article>
      ) : null}
    </section>
  );
}
