"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import {
  useLiveCooking,
  type LiveStep,
  type LiveZone,
  type UrgencyLevel,
} from "@/hooks/useLiveCooking";
import { ds } from "@/lib/design-system";
import { parseLiveParams } from "@/lib/navigation/parseLiveParams";
import type { Lang } from "@/lib/i18n/texts";
import LiveHeader from "./LiveHeader";
import LiveHero from "./LiveHero";
import LiveUpNext from "./LiveUpNext";
import type { LivePhase } from "./TimerDial";
import { getAnimalSurfaceLabel, getDonenessSurfaceLabel, getLiveText } from "@/lib/i18n/surfaceFallbacks";

export type { LiveCookingStepState, LiveStep, LiveZone } from "@/hooks/useLiveCooking";

type Props = {
  steps: LiveStep[];
  currentIndex: number;
  remaining: number;
  paused: boolean;
  started?: boolean;
  context?: string;
  lang?: Lang;
  onBack?: () => void;
  onReset?: () => void;
  onPause: () => void;
  onCompleteStep: () => void;
  onPreviousStep?: () => void;
  onGoToStep?: (index: number) => void;
  alertMessage?: string;
  alertsEnabled?: boolean;
  onEnableAlerts?: () => Promise<void>;
  onSaveCook?: () => void;
};

type TouchPoint = { x: number; y: number };

const CTA_STYLE: Record<UrgencyLevel | "complete", string> = {
  /* allow-arbitrary: shadow-[...] phase-colored CTA glow — no canonical ds.shadow.* tier */
  normal: "bg-orange-500 text-black shadow-[0_10px_36px_rgba(249,115,22,0.34)] hover:bg-orange-400",
  /* allow-arbitrary: shadow-[...] phase-colored CTA glow — no canonical ds.shadow.* tier */
  attention: "bg-orange-300 text-black shadow-[0_14px_46px_rgba(253,186,116,0.46)] hover:bg-orange-200",
  /* allow-arbitrary: shadow-[...] phase-colored CTA glow — no canonical ds.shadow.* tier */
  critical: "bg-yellow-300 text-black shadow-[0_0_54px_rgba(250,204,21,0.58)] hover:bg-yellow-200",
  /* allow-arbitrary: shadow-[...] phase-colored CTA glow — no canonical ds.shadow.* tier */
  complete: "bg-emerald-500 text-black shadow-[0_10px_36px_rgba(16,185,129,0.34)]",
};

function getBgStyle(phase: LivePhase, zone?: LiveZone | null): CSSProperties {
  // Phase tints centralized in ds.liveBg.* (lib/design-system.ts) per
  // docs/design/hybrid-premium-ui-spec.md §11. Inline gradients used to live
  // here; consolidating reduces drift between Live and any future surfaces
  // that need the same phase-aware background.
  if (phase === "complete") {
    return { backgroundImage: ds.liveBg.complete };
  }
  if (phase === "urgent") {
    return { backgroundImage: ds.liveBg.urgent };
  }
  if (zone === "rest") {
    return { backgroundImage: ds.liveBg.rest };
  }
  if (zone === "indirect") {
    return { backgroundImage: ds.liveBg.indirect };
  }
  return { backgroundImage: ds.liveBg.direct };
}

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", syncPreference);

    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  return reduceMotion;
}

export default function LiveCookingScreen({
  steps,
  currentIndex,
  remaining,
  paused,
  started,
  context,
  lang,
  onBack,
  onReset,
  onPause,
  onCompleteStep,
  onPreviousStep,
  alertMessage,
  alertsEnabled,
  onEnableAlerts,
  onSaveCook,
}: Props) {
  const resolvedLang = lang ?? "es";
  const hasStarted = started ?? false;
  const reduceMotion = usePrefersReducedMotion();
  const liveUrlState = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        animal: undefined,
        cutId: undefined,
        doneness: undefined,
        thickness: undefined,
      };
    }

    const { animal, cutId, doneness, thickness } = parseLiveParams(window.location.search);
    return {
      animal: animal?.trim() || undefined,
      cutId: cutId?.trim() || undefined,
      doneness: doneness?.trim() || undefined,
      thickness: thickness !== undefined ? String(thickness) : undefined,
    };
  }, []);

  const touchRef = useRef<TouchPoint | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const {
    allSteps,
    currentStep,
    nextStep,
    currentStepIndex,
    ctaLabel,
    feedback,
    hasTimer,
    isComplete,
    phase,
    urgency,
  } = useLiveCooking({
    steps,
    currentIndex,
    remaining,
    paused,
    started: hasStarted,
    lang: resolvedLang,
  });
  const liveText = getLiveText(resolvedLang);
  const fallbackContext = useMemo(() => {
    const parts = [
      liveUrlState.animal ? getAnimalSurfaceLabel(liveUrlState.animal, resolvedLang) : null,
      liveUrlState.cutId,
      liveUrlState.doneness ? getDonenessSurfaceLabel(liveUrlState.doneness, resolvedLang) : null,
      liveUrlState.thickness ? `${liveUrlState.thickness}cm` : null,
    ].filter(Boolean) as string[];
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }, [liveUrlState, resolvedLang]);
  const resolvedContext = context ?? fallbackContext;

  const bgStyle = getBgStyle(phase, currentStep?.zone);
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === allSteps.length - 1;
  const ctaUrgency = ctaLabel === liveText.markDone && urgency === "normal" ? "normal" : urgency;
  const shouldPulseCta = !reduceMotion && (urgency === "attention" || urgency === "critical");
  const stepAfterNext = allSteps[currentStepIndex + 2] ?? null;

  function handleBack() {
    if (hasStarted && hasTimer && !paused && !isComplete && !window.confirm(liveText.leaveConfirm)) {
      return;
    }
    onBack?.();
  }

  function handlePrimaryAction() {
    if (!hasStarted) {
      if (paused) onPause();
      return;
    }

    if (!isComplete) {
      onCompleteStep();
    }
  }

  function handlePauseToggle() {
    onPause();
  }

  function handleTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: TouchEvent) {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) <= Math.abs(dy)) return;
    if (!hasStarted) return;
    if (dx < 0 && !isLast) onCompleteStep();
    if (dx > 0 && !isFirst) onPreviousStep?.();
  }

  if (!currentStep) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#020202] px-5 py-6 text-white">
        {/* allow-arbitrary: rounded-[2rem] + bg-[radial-gradient(...)] + shadow-[...] — no-steps hero chassis, no canonical token */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_0%,rgba(249,115,22,0.13),transparent_58%),rgba(255,255,255,0.025)] px-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
          <div className={`mb-4 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 ${ds.text.body10} font-black uppercase tracking-[0.2em] text-orange-200`}>
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            {liveText.live}
          </div>
          {/* allow-arbitrary: text-[clamp(...)] display-tier heading — stays inline per slice-d-tokens.md §1 */}
          <p className="max-w-[18rem] text-[clamp(1.75rem,8vw,2.45rem)] font-black leading-none tracking-[-0.05em]">
            {liveText.noStepsTitle}
          </p>
          <p className={`mt-3 max-w-[19rem] text-sm font-semibold leading-snug ${ds.color.mutedClass.secondary}`}>
            {liveText.noStepsBody}
          </p>
          {resolvedContext && (
            /* allow-arbitrary: bg-white/[0.04] — non-subpanel chip surface, no canonical token */
            <p className={`mt-4 max-w-[17rem] truncate rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 ${ds.text.body11} font-bold ${ds.color.mutedClass.secondary}`}>
              {resolvedContext}
            </p>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              /* allow-arbitrary: shadow-[...] phase-colored CTA glow — no canonical ds.shadow.* tier */
              className="mt-6 min-h-12 w-full max-w-[18rem] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-black shadow-[0_10px_36px_rgba(249,115,22,0.32)] transition active:scale-[0.98]"
            >
              {liveText.backToPlan}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="animate-live-enter flex h-dvh max-h-dvh min-h-0 flex-1 flex-col overflow-hidden text-white"
      style={bgStyle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <LiveHeader
        alertsEnabled={alertsEnabled}
        currentStep={currentStep}
        lang={resolvedLang}
        onBack={onBack ? handleBack : undefined}
        onEnableAlerts={onEnableAlerts}
        phase={phase}
      />

      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3.5 py-3">
        {alertMessage && (
          <div className={`shrink-0 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-3.5 py-2 ${ds.text.body11} font-bold text-orange-100`}>
            {alertMessage}
          </div>
        )}

        <LiveHero
          currentStep={currentStep}
          feedback={feedback}
          lang={resolvedLang}
          phase={phase}
          reduceMotion={reduceMotion}
          urgency={urgency}
        />

        {/* Up-next sits directly below the hero so the relationship "this step
            → next steps" reads naturally. The mt-auto previously wrapped this
            block alongside context/reset and pushed both to the bottom; at
            375×812 that produced ~210px of dead space between hero and
            up-next. Tightened to flow-from-hero in /8b. */}
        {!isComplete && (nextStep || stepAfterNext) && (
          <LiveUpNext
            nextStep={nextStep}
            stepAfterNext={stepAfterNext}
            lang={resolvedLang}
          />
        )}

        {isComplete && (
          <div className="shrink-0 space-y-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
              <p className={`${ds.text.body10} font-black uppercase tracking-[0.22em] text-emerald-400`}>
                {liveText.cookingComplete}
              </p>
              <p className={`mt-1 ${ds.text.body11} font-semibold ${ds.color.mutedClass.secondary}`}>
                {liveText.cookingCompleteBody}
              </p>
            </div>

            {onSaveCook && (
              <button
                type="button"
                onClick={() => {
                  if (saveState === "saved") return;
                  onSaveCook();
                  setSaveState("saved");
                }}
                className={`min-h-11 w-full rounded-2xl ${ds.text.body13} font-black transition-all duration-300 active:scale-[0.98] ${
                  saveState === "saved"
                    ? "border border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
                    /* allow-arbitrary: shadow-[...] phase-colored CTA glow — no canonical ds.shadow.* tier */
                    : "bg-emerald-500 text-black shadow-[0_4px_28px_rgba(16,185,129,0.38)] hover:bg-emerald-400 active:bg-emerald-600"
                }`}
              >
                {saveState === "saved"
                  ? liveText.savedCook
                  : liveText.saveCook}
              </button>
            )}
          </div>
        )}

        {/* Context + reset float at the bottom of the main area, just above the
            sticky footer. mt-auto consumes any remaining vertical space so the
            other content above flows from the top rather than collecting at
            the bottom. */}
        {(resolvedContext || onReset) && (
          <div className="mt-auto flex min-h-6 shrink-0 items-center justify-center gap-3">
            {resolvedContext && (
              <span className={`truncate ${ds.text.body10} font-semibold ${ds.color.mutedClass.secondary}`}>{resolvedContext}</span>
            )}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className={`shrink-0 px-2 py-1 ${ds.text.body10} font-bold ${ds.color.mutedClass.secondary} transition active:scale-[0.98]`}
              >
                {liveText.reset}
              </button>
            )}
          </div>
        )}
      </main>

      {/* allow-arbitrary: shadow-[0_-12px_...] bottom-nav lift — no canonical ds.shadow.* tier */}
      <nav className="shrink-0 border-t border-white/[0.07] bg-black/[0.78] px-3.5 py-2.5 shadow-[0_-12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          {hasStarted && hasTimer && !isComplete && (
            <button
              type="button"
              onClick={handlePauseToggle}
              /* allow-arbitrary: rounded-[1.25rem] + bg-white/[0.075] non-subpanel + shadow-[inset_...] — pause button chassis, no canonical token */
              className={`min-h-14 w-[5.5rem] shrink-0 rounded-[1.25rem] border border-white/14 bg-white/[0.075] px-2 ${ds.text.body11} font-black ${ds.color.mutedClass.body} shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition active:scale-[0.98]`}
            >
              {paused ? liveText.resumeTimer : liveText.pauseTimer}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isComplete}
            /* allow-arbitrary: rounded-[1.25rem] — primary CTA radius, no canonical ds.radius.* tier */
            className={`min-h-14 min-w-0 flex-1 rounded-[1.25rem] px-4 text-lg font-black tracking-[-0.02em] transition-all duration-200 active:scale-[0.98] disabled:opacity-80 ${
              shouldPulseCta ? "animate-pulse" : ""
            } ${
              isComplete ? CTA_STYLE.complete : CTA_STYLE[ctaUrgency]
            }`}
          >
            {ctaLabel}
          </button>
        </div>
      </nav>
    </div>
  );
}
