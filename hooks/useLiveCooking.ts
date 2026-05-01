"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LivePhase } from "@/components/live/TimerDial";

export type LiveZone = "direct" | "indirect" | "rest";
export type UrgencyLevel = "normal" | "attention" | "critical";

export type LiveStep = {
  id: string;
  label: string;
  zone: string;
  duration: number;
  tempTarget?: number | null;
  notes?: string | null;
};

export type LiveCookingStepState = {
  id: string;
  name: string;
  duration: number;
  zone: LiveZone;
  displayZone: string;
  instructions: string;
  tempTarget: number | null;
  isActive: boolean;
  isCompleted: boolean;
  isNext: boolean;
  remainingTime: number;
  progress: number;
};

type UseLiveCookingParams = {
  steps: LiveStep[];
  currentIndex: number;
  remaining: number;
  paused: boolean;
  started: boolean;
};

type CtaParams = {
  currentStep: LiveCookingStepState | null;
  nextStep: LiveCookingStepState | null;
  started: boolean;
  isComplete: boolean;
};

const FEEDBACK_HIDE_MS = 1800;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeLiveZone(zone?: string | null): LiveZone {
  const normalized = normalizeText(zone ?? "");
  if (normalized.includes("indirect")) return "indirect";
  if (normalized.includes("repos") || normalized.includes("rest") || normalized.includes("serv")) {
    return "rest";
  }
  return "direct";
}

function pickStepName(step: LiveStep) {
  return step.label.trim() || "Cooking step";
}

function pickInstructions(step: LiveStep) {
  return step.notes?.trim() || step.label.trim() || "Keep heat stable and move when this step is done.";
}

function safeDuration(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function clampIndex(index: number, stepsLength: number) {
  if (stepsLength <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(stepsLength - 1, Math.round(index)));
}

function includesAny(value: string, terms: string[]) {
  const normalized = normalizeText(value);
  return terms.some((term) => normalized.includes(term));
}

function buildLiveStepStates(
  steps: LiveStep[],
  currentIndex: number,
  remainingTime: number,
): LiveCookingStepState[] {
  const safeCurrentIndex = clampIndex(currentIndex, steps.length);

  return steps.map((step, index) => {
    const duration = safeDuration(step.duration);
    const isActive = index === safeCurrentIndex;
    const isCompleted = index < safeCurrentIndex;
    const isNext = index === safeCurrentIndex + 1;
    const activeRemaining = Math.max(0, Math.min(duration, Math.round(remainingTime)));
    const progress = isCompleted
      ? 1
      : isActive && duration > 0
        ? Math.max(0, Math.min(1, 1 - activeRemaining / duration))
        : 0;

    return {
      id: step.id || `live-step-${index + 1}`,
      name: pickStepName(step),
      duration,
      zone: normalizeLiveZone(step.zone),
      displayZone: step.zone?.trim() || "",
      instructions: pickInstructions(step),
      tempTarget: step.tempTarget ?? null,
      isActive,
      isCompleted,
      isNext,
      remainingTime: isActive ? activeRemaining : duration,
      progress,
    };
  });
}

function getPhase({
  currentStep,
  isComplete,
  paused,
  started,
  urgency,
}: {
  currentStep: LiveCookingStepState | null;
  isComplete: boolean;
  paused: boolean;
  started: boolean;
  urgency: UrgencyLevel;
}): LivePhase {
  if (isComplete) return "complete";
  if (!started || paused || !currentStep?.duration) return "idle";
  if (currentStep.zone === "rest") return "rest";
  if (urgency === "critical") return "urgent";
  return "active";
}

function getUrgency(
  currentStep: LiveCookingStepState | null,
  nextStep: LiveCookingStepState | null,
): UrgencyLevel {
  if (!currentStep) return "normal";
  if (currentStep.duration > 0 && currentStep.remainingTime <= 5) return "critical";
  if (currentStep.duration > 0 && currentStep.remainingTime <= 15) return "attention";

  const combinedText = `${currentStep.name} ${currentStep.instructions} ${nextStep?.name ?? ""} ${nextStep?.instructions ?? ""}`;
  if (
    includesAny(combinedText, [
      "flip",
      "turn",
      "remove",
      "pull",
      "off heat",
      "side 2",
      "lado 2",
      "voltea",
      "dar vuelta",
      "retira",
      "saca",
    ])
  ) {
    return "attention";
  }

  if (nextStep && nextStep.zone !== currentStep.zone) return "attention";
  return "normal";
}

export function getCurrentCTA({
  currentStep,
  nextStep,
  started,
  isComplete,
}: CtaParams) {
  if (!started) return "Start cooking";
  if (isComplete) return "Cooking complete";
  if (!currentStep) return "Next step";

  const combinedText = `${currentStep.name} ${currentStep.instructions} ${nextStep?.name ?? ""} ${nextStep?.instructions ?? ""}`;

  if (includesAny(combinedText, ["flip", "turn", "side 2", "lado 2", "voltea", "dar vuelta"])) {
    return "Flip now";
  }

  if (includesAny(combinedText, ["remove", "pull", "off heat", "retira", "saca"])) {
    return nextStep?.zone === "rest" ? "Rest now" : "Mark step done";
  }

  if (nextStep?.zone === "indirect" && currentStep.zone !== "indirect") {
    return "Move to indirect";
  }

  if (nextStep?.zone === "direct" && currentStep.zone !== "direct") {
    return "Move to direct";
  }

  if (nextStep?.zone === "rest") return "Rest now";
  return "Mark step done";
}

function getCompletionFeedback(
  step: LiveCookingStepState | null,
  nextStep: LiveCookingStepState | null,
) {
  if (!step) return null;
  const text = `${step.name} ${step.instructions}`;

  if (nextStep?.zone === "rest") return "Rest phase started.";
  if (step.zone === "rest") return "Good timing.";
  if (includesAny(text, ["sear", "sellad", "dorar", "crust", "browning"])) return "Perfect sear.";
  if (includesAny(text, ["flip", "turn", "side 2", "lado 2", "voltea"])) return "Now keep the heat steady.";
  return "Good timing.";
}

export function useLiveCooking({
  steps,
  currentIndex,
  remaining,
  paused,
  started,
}: UseLiveCookingParams) {
  const safeSteps = useMemo(
    () =>
      steps
        .filter(Boolean)
        .map((step, index) => ({
          ...step,
          id: step.id || `live-step-${index + 1}`,
          duration: safeDuration(step.duration),
        })),
    [steps],
  );
  const currentStepIndex = clampIndex(currentIndex, safeSteps.length);
  const liveSteps = useMemo(
    () => buildLiveStepStates(safeSteps, currentStepIndex, remaining),
    [safeSteps, currentStepIndex, remaining],
  );
  const currentStep = liveSteps[currentStepIndex] ?? null;
  const nextStep = liveSteps[currentStepIndex + 1] ?? null;
  const completedSteps = liveSteps.filter((step) => step.isCompleted);
  const isLast = safeSteps.length > 0 && currentStepIndex === safeSteps.length - 1;
  const isComplete = Boolean(
    safeSteps.length > 0 &&
      isLast &&
      (!currentStep?.duration || currentStep.remainingTime <= 0),
  );
  const urgency = getUrgency(currentStep, nextStep);
  const phase = getPhase({ currentStep, isComplete, paused, started, urgency });
  const ctaLabel = getCurrentCTA({ currentStep, nextStep, started, isComplete });
  const [feedback, setFeedback] = useState<string | null>(null);
  const previousIndexRef = useRef(currentStepIndex);

  useEffect(() => {
    const previousIndex = previousIndexRef.current;
    previousIndexRef.current = currentStepIndex;
    if (currentStepIndex <= previousIndex) return;

    const completedStep = liveSteps[previousIndex] ?? null;
    const message = getCompletionFeedback(completedStep, liveSteps[currentStepIndex] ?? null);
    if (!message) return;

    setFeedback(message);
    const id = window.setTimeout(() => setFeedback(null), FEEDBACK_HIDE_MS);
    return () => window.clearTimeout(id);
  }, [currentStepIndex, liveSteps]);

  return {
    currentStep,
    nextStep,
    completedSteps,
    allSteps: liveSteps,
    currentStepIndex,
    ctaLabel,
    feedback,
    hasTimer: Boolean(currentStep && currentStep.duration > 0),
    isComplete,
    phase,
    urgency,
  };
}
