"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import {
  useLiveCooking,
  type LiveStep,
  type LiveZone,
  type UrgencyLevel,
} from "@/hooks/useLiveCooking";
import { parseLiveParams } from "@/lib/navigation/parseLiveParams";
import LiveHeader from "./LiveHeader";
import LiveStepCard from "./LiveStepCard";
import LiveTimeline from "./LiveTimeline";
import LiveTimer from "./LiveTimer";
import type { LivePhase } from "./TimerDial";

export type { LiveCookingStepState, LiveStep, LiveZone } from "@/hooks/useLiveCooking";

type Props = {
  steps: LiveStep[];
  currentIndex: number;
  remaining: number;
  paused: boolean;
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
  normal: "bg-orange-500 text-black shadow-[0_10px_36px_rgba(249,115,22,0.34)] hover:bg-orange-400",
  attention: "bg-orange-300 text-black shadow-[0_14px_46px_rgba(253,186,116,0.46)] hover:bg-orange-200",
  critical: "bg-yellow-300 text-black shadow-[0_0_54px_rgba(250,204,21,0.58)] hover:bg-yellow-200",
  complete: "bg-emerald-500 text-black shadow-[0_10px_36px_rgba(16,185,129,0.34)]",
};

const ZONE_BAR_STYLE: Record<LiveZone, string> = {
  direct:
    "border-red-300/20 bg-[linear-gradient(90deg,rgba(239,68,68,0.20),rgba(249,115,22,0.08))] text-red-100",
  indirect:
    "border-orange-300/16 bg-[linear-gradient(90deg,rgba(251,146,60,0.13),rgba(251,191,36,0.05))] text-orange-100",
  rest:
    "border-blue-300/16 bg-[linear-gradient(90deg,rgba(96,165,250,0.12),rgba(14,165,233,0.04))] text-blue-100",
};

const DOT_CLASS: Record<LivePhase, string> = {
  idle: "bg-zinc-500",
  active: "animate-pulse bg-orange-500",
  urgent: "animate-pulse bg-yellow-400",
  rest: "bg-blue-400",
  complete: "bg-emerald-400",
};

function getBgStyle(phase: LivePhase, zone?: LiveZone | null): CSSProperties {
  if (phase === "complete") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.18), transparent 58%), linear-gradient(180deg, #020202, #040404)",
    };
  }

  if (phase === "urgent") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 16%, rgba(234,179,8,0.22), transparent 58%), linear-gradient(180deg, #020202, #040404)",
    };
  }

  if (zone === "rest") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.16), transparent 58%), linear-gradient(180deg, #020202, #040404)",
    };
  }

  if (zone === "indirect") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 12%, rgba(249,115,22,0.15), transparent 55%), linear-gradient(180deg, #020202, #040404)",
    };
  }

  return {
    backgroundImage:
      "radial-gradient(ellipse at 50% 16%, rgba(239,68,68,0.18), transparent 58%), radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.10), transparent 44%), linear-gradient(180deg, #020202, #040404)",
  };
}

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(mediaQuery.matches);
    syncPreference();
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
  context,
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
  const [hasStarted, setHasStarted] = useState(false);
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
  const [displayedStepId, setDisplayedStepId] = useState<string | null>(null);
  const displayedStepIdRef = useRef<string | null>(null);
  const [stepTransition, setStepTransition] = useState<"idle" | "exit" | "enter">("idle");
  const {
    allSteps,
    completedSteps,
    currentStep,
    currentStepIndex,
    ctaLabel,
    feedback,
    hasTimer,
    isComplete,
    nextStep,
    phase,
    urgency,
  } = useLiveCooking({
    steps,
    currentIndex,
    remaining,
    paused,
    started: hasStarted,
  });
  const fallbackContext = useMemo(() => {
    const safeAnimal = liveUrlState.animal || "Vacuno";
    const parts = [
      safeAnimal,
      liveUrlState.cutId,
      liveUrlState.doneness,
      liveUrlState.thickness ? `${liveUrlState.thickness}cm` : null,
    ].filter(Boolean) as string[];
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }, [liveUrlState]);
  const resolvedContext = context ?? fallbackContext;

  const bgStyle = getBgStyle(phase, currentStep?.zone);
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === allSteps.length - 1;
  const displayedIndex = allSteps.findIndex((step) => step.id === displayedStepId);
  const visualStepIndex = displayedIndex >= 0 ? displayedIndex : currentStepIndex;
  const visualStep = allSteps[visualStepIndex] ?? currentStep;
  const visualNextStep = allSteps[visualStepIndex + 1] ?? null;
  const visualCompletedSteps = allSteps.filter((_, index) => index < visualStepIndex);
  const overallProgress = isComplete
    ? 1
    : allSteps.length > 0
      ? Math.max(0, Math.min(1, (currentStepIndex + (currentStep?.progress ?? 0)) / allSteps.length))
      : 0;
  const overallProgressPct = `${Math.round(overallProgress * 100)}%`;
  const ctaUrgency = ctaLabel === "Mark step done" && urgency === "normal" ? "normal" : urgency;
  const shouldPulseCta = !reduceMotion && (urgency === "attention" || urgency === "critical");
  const dotClass = reduceMotion ? DOT_CLASS[phase].replace("animate-pulse ", "") : DOT_CLASS[phase];

  useEffect(() => {
    if (!currentStep) return;

    const displayed = displayedStepIdRef.current;
    if (displayed === null) {
      displayedStepIdRef.current = currentStep.id;
      setDisplayedStepId(currentStep.id);
      return;
    }

    if (displayed === currentStep.id) return;

    if (reduceMotion) {
      displayedStepIdRef.current = currentStep.id;
      setDisplayedStepId(currentStep.id);
      setStepTransition("idle");
      return;
    }

    let enterTimer: number | undefined;
    setStepTransition("exit");
    const exitTimer = window.setTimeout(() => {
      displayedStepIdRef.current = currentStep.id;
      setDisplayedStepId(currentStep.id);
      setStepTransition("enter");
      enterTimer = window.setTimeout(() => setStepTransition("idle"), 25);
    }, 100);

    return () => {
      window.clearTimeout(exitTimer);
      if (enterTimer !== undefined) window.clearTimeout(enterTimer);
    };
  }, [currentStep, reduceMotion]);

  function handleBack() {
    if (hasStarted && hasTimer && !paused && !isComplete && !window.confirm("Cooking in progress - leave?")) {
      return;
    }
    onBack?.();
  }

  function handlePrimaryAction() {
    if (!hasStarted) {
      setHasStarted(true);
      if (paused) onPause();
      return;
    }

    if (!isComplete) {
      onCompleteStep();
    }
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
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#020202] px-6 text-center text-white">
        <p className="text-2xl font-black">No live steps available</p>
        <p className="mt-2 text-sm font-semibold text-white/45">Return to the plan and start again.</p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-6 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-black"
          >
            Back to plan
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="animate-live-enter flex min-h-0 flex-1 flex-col text-white"
      style={bgStyle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <LiveHeader
        alertsEnabled={alertsEnabled}
        currentIndex={currentStepIndex}
        currentStep={currentStep}
        dotClass={dotClass}
        isEs={false}
        onBack={onBack ? handleBack : undefined}
        onEnableAlerts={onEnableAlerts}
        phase={phase}
        stepCount={allSteps.length}
      />

      {!hasStarted && (
        <div className="border-b border-white/[0.055] px-4 py-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-orange-300/80">
            Ready to start cooking?
          </p>
          <p className="mt-1 text-sm font-semibold text-white/45">
            The assistant will guide one action at a time.
          </p>
        </div>
      )}

      {currentStep.displayZone && (
        <div className={`flex shrink-0 items-center justify-center gap-2 border-b py-2.5 ${ZONE_BAR_STYLE[currentStep.zone]}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${dotClass} shadow-[0_0_16px_currentColor]`} />
          <span className="text-[11px] font-black uppercase tracking-[0.22em] opacity-80">
            {currentStep.displayZone}
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {alertMessage && (
          <div className="mx-4 mt-3 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-2.5 text-sm font-bold text-orange-100">
            {alertMessage}
          </div>
        )}

        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">
                Step {currentStepIndex + 1} of {allSteps.length}
              </p>
              <p className="font-mono text-[10px] font-bold text-white/28">{overallProgressPct}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-orange-300 transition-[width] duration-300 ease-out"
                style={{ width: overallProgressPct }}
              />
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <LiveTimer
            duration={currentStep.duration}
            remainingTime={currentStep.remainingTime}
            progress={currentStep.progress}
            phase={phase}
            reduceMotion={reduceMotion}
            urgency={urgency}
          />
        </div>

        <div className="px-4 pt-4">
          <LiveStepCard
            completedSteps={visualCompletedSteps.length > 0 ? visualCompletedSteps : completedSteps}
            currentStep={visualStep}
            feedback={feedback}
            nextStep={visualNextStep ?? nextStep}
            reduceMotion={reduceMotion}
            transitionState={stepTransition}
            urgency={urgency}
          />
        </div>

        <div className="px-4 pt-4">
          <LiveTimeline
            currentIndex={currentStepIndex}
            isEs={false}
            onGoToStep={handleGoToStep}
            phase={phase}
            steps={allSteps}
          />
        </div>

        {isComplete && (
          <div className="mx-4 mt-4 space-y-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400">
                Cooking complete
              </p>
              <p className="mt-1.5 text-sm font-semibold text-white/60">
                Slice, serve, enjoy.
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
                className={`w-full min-h-[3rem] rounded-2xl text-sm font-black transition-all duration-300 active:scale-[0.98] ${
                  saveState === "saved"
                    ? "border border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
                    : "bg-emerald-500 text-black shadow-[0_4px_28px_rgba(16,185,129,0.38)] hover:bg-emerald-400 active:bg-emerald-600"
                }`}
              >
                {saveState === "saved"
                  ? "Saved"
                  : "Save this cook"}
              </button>
            )}
          </div>
        )}

        {(resolvedContext || onReset) && (
          <div className="flex items-center justify-center gap-3 px-4 py-4">
            {resolvedContext && (
              <span className="text-[10px] font-semibold text-white/18">{resolvedContext}</span>
            )}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="px-3 py-2 text-[10px] font-bold text-white/18 transition hover:text-white/38 active:scale-[0.98]"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      <nav className="shrink-0 border-t border-white/[0.08] bg-black/[0.72] px-4 py-3 shadow-[0_-18px_42px_rgba(0,0,0,0.38)] backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={isComplete}
          className={`min-h-[4.5rem] w-full rounded-[1.55rem] px-5 text-xl font-black tracking-[-0.02em] transition-all duration-200 active:scale-[0.98] disabled:opacity-80 ${
            shouldPulseCta ? "animate-pulse" : ""
          } ${
            isComplete ? CTA_STYLE.complete : CTA_STYLE[ctaUrgency]
          }`}
        >
          {ctaLabel}
        </button>
      </nav>
    </div>
  );
}
