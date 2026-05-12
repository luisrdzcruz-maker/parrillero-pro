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
import LiveExecutionGuide from "./LiveExecutionGuide";
import LiveHeader from "./LiveHeader";
import LiveNextStepPreview from "./LiveNextStepPreview";
import LiveStepCard from "./LiveStepCard";
import LiveTimeline from "./LiveTimeline";
import LiveTimer from "./LiveTimer";
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
  lang?: "es" | "en" | "fi";
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
  /* allow-arbitrary: pre-slice-a */
  normal: "bg-orange-500 text-black shadow-[0_10px_36px_rgba(249,115,22,0.34)] hover:bg-orange-400",
  /* allow-arbitrary: pre-slice-a */
  attention: "bg-orange-300 text-black shadow-[0_14px_46px_rgba(253,186,116,0.46)] hover:bg-orange-200",
  /* allow-arbitrary: pre-slice-a */
  critical: "bg-yellow-300 text-black shadow-[0_0_54px_rgba(250,204,21,0.58)] hover:bg-yellow-200",
  /* allow-arbitrary: pre-slice-a */
  complete: "bg-emerald-500 text-black shadow-[0_10px_36px_rgba(16,185,129,0.34)]",
};

const DOT_CLASS: Record<LivePhase, string> = {
  idle: "bg-zinc-500",
  active: "animate-pulse bg-orange-500",
  urgent: "animate-pulse bg-yellow-400",
  rest: "bg-blue-400",
  complete: "bg-emerald-400",
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
  onGoToStep,
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
  const overallProgress = isComplete
    ? 1
    : allSteps.length > 0
      ? Math.max(0, Math.min(1, (currentStepIndex + (currentStep?.progress ?? 0)) / allSteps.length))
      : 0;
  const overallProgressPct = `${Math.round(overallProgress * 100)}%`;
  const ctaUrgency = ctaLabel === liveText.markDone && urgency === "normal" ? "normal" : urgency;
  const shouldPulseCta = !reduceMotion && (urgency === "attention" || urgency === "critical");
  const dotClass = reduceMotion ? DOT_CLASS[phase].replace("animate-pulse ", "") : DOT_CLASS[phase];

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

  function handleGoToStep(index: number) {
    if (!hasStarted) return;
    onGoToStep?.(index);
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
        {/* allow-arbitrary: pre-slice-a */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_0%,rgba(249,115,22,0.13),transparent_58%),rgba(255,255,255,0.025)] px-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
          {/* allow-arbitrary: pre-slice-a */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            {liveText.live}
          </div>
          {/* allow-arbitrary: pre-slice-a */}
          <p className="max-w-[18rem] text-[clamp(1.75rem,8vw,2.45rem)] font-black leading-none tracking-[-0.05em]">
            {liveText.noStepsTitle}
          </p>
          {/* allow-arbitrary: pre-slice-a */}
          <p className="mt-3 max-w-[19rem] text-sm font-semibold leading-snug text-white/52">
            {liveText.noStepsBody}
          </p>
          {resolvedContext && (
            /* allow-arbitrary: pre-slice-a */
            <p className="mt-4 max-w-[17rem] truncate rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white/38">
              {resolvedContext}
            </p>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              /* allow-arbitrary: pre-slice-a */
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
        currentIndex={currentStepIndex}
        currentStep={currentStep}
        dotClass={dotClass}
        lang={resolvedLang}
        onBack={onBack ? handleBack : undefined}
        onEnableAlerts={onEnableAlerts}
        overallProgressPct={overallProgressPct}
        phase={phase}
        stepCount={allSteps.length}
      />

      <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3.5 py-2">
        {alertMessage && (
          <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 px-3.5 py-2 text-xs font-bold text-orange-100">
            {alertMessage}
          </div>
        )}

        <div className="shrink-0 rounded-2xl border border-white/[0.035] bg-black/[0.32] px-2.5 py-1.5 opacity-82 backdrop-blur-md">
          <LiveTimeline
            currentIndex={currentStepIndex}
            lang={resolvedLang}
            onGoToStep={handleGoToStep}
            phase={phase}
            steps={allSteps}
          />
        </div>

        {/* allow-arbitrary: pre-slice-a */}
        <div className="relative min-h-0 shrink overflow-hidden rounded-[1.5rem] border border-white/[0.09] bg-[linear-gradient(160deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.025)_45%,rgba(0,0,0,0.32)_100%)] shadow-[0_28px_56px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />
          <LiveStepCard
            currentStep={currentStep}
            feedback={feedback}
            lang={resolvedLang}
            reduceMotion={reduceMotion}
            transitionState="idle"
            urgency={urgency}
          />
        </div>

        {!isComplete && (
          /* allow-arbitrary: pre-slice-a */
          <div className="relative shrink-0 overflow-hidden rounded-[1.5rem] border border-orange-300/[0.18] bg-[radial-gradient(ellipse_at_50%_-20%,rgba(249,115,22,0.18),transparent_60%),linear-gradient(160deg,rgba(255,255,255,0.04)_0%,rgba(0,0,0,0.4)_100%)] shadow-[0_24px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-inset ring-orange-200/[0.08] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/40 to-transparent" />
            <LiveTimer
              duration={currentStep.duration}
              remainingTime={currentStep.remainingTime}
              progress={currentStep.progress}
              phase={phase}
              lang={resolvedLang}
              reduceMotion={reduceMotion}
              urgency={urgency}
            />
          </div>
        )}

        <div className="shrink-0 opacity-92">
          <LiveExecutionGuide
            currentStep={currentStep}
            lang={resolvedLang}
            urgency={urgency}
          />
        </div>

        {!isComplete && nextStep && (
          <div className="shrink-0 opacity-78">
            <LiveNextStepPreview nextStep={nextStep} lang={resolvedLang} />
          </div>
        )}

        {isComplete && (
          <div className="shrink-0 space-y-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
              {/* allow-arbitrary: pre-slice-a */}
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
                {liveText.cookingComplete}
              </p>
              {/* allow-arbitrary: pre-slice-a */}
              <p className="mt-1 text-xs font-semibold text-white/60">
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
                className={`min-h-11 w-full rounded-2xl text-sm font-black transition-all duration-300 active:scale-[0.98] ${
                  saveState === "saved"
                    ? "border border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
                    /* allow-arbitrary: pre-slice-a */
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

        {(resolvedContext || onReset) && (
          <div className="mt-auto flex min-h-6 shrink-0 items-center justify-center gap-3">
            {resolvedContext && (
              /* allow-arbitrary: pre-slice-a */
              <span className="truncate text-[10px] font-semibold text-white/18">{resolvedContext}</span>
            )}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                /* allow-arbitrary: pre-slice-a */
                className="shrink-0 px-2 py-1 text-[10px] font-bold text-white/18 transition hover:text-white/38 active:scale-[0.98]"
              >
                {liveText.reset}
              </button>
            )}
          </div>
        )}
      </main>

      {/* allow-arbitrary: pre-slice-a */}
      <nav className="shrink-0 border-t border-white/[0.07] bg-black/[0.78] px-3.5 py-2 shadow-[0_-12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* allow-arbitrary: pre-slice-a */}
        <p className="mb-1 text-center text-[9px] font-black uppercase tracking-[0.2em] text-white/28">
          {liveText.nextAction}
        </p>
        <div className="flex items-center gap-2">
          {hasStarted && hasTimer && !isComplete && (
            <button
              type="button"
              onClick={handlePauseToggle}
              /* allow-arbitrary: pre-slice-a */
              className="min-h-14 w-[4.9rem] shrink-0 rounded-[1.25rem] border border-white/14 bg-white/[0.075] px-2 text-[11px] font-black text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition active:scale-[0.98]"
            >
              {paused ? liveText.resumeTimer : liveText.pauseTimer}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isComplete}
            /* allow-arbitrary: pre-slice-a */
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
