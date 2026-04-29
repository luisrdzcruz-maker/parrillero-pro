"use client";

import { useRef, type TouchEvent } from "react";
import TimerDial, { type LivePhase } from "./TimerDial";
import StepCard from "./StepCard";
import Timeline from "./Timeline";

// ─── Shared step contract ─────────────────────────────────────────────────────

export type LiveStep = {
  id: string;
  label: string;
  zone: string;
  duration: number;
  tempTarget?: number | null;
  notes?: string | null;
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  // Data
  steps: LiveStep[];
  currentIndex: number;
  remaining: number;
  paused: boolean;
  // UI metadata
  context?: string;
  lang?: "es" | "en" | "fi";
  // Navigation
  onBack?: () => void;
  onReset?: () => void;
  // Step controls
  onPause: () => void;
  onCompleteStep: () => void;
  onPreviousStep?: () => void;
  onGoToStep?: (index: number) => void;
  // Alerts (optional — embedded mode only)
  alertMessage?: string;
  alertsEnabled?: boolean;
  onEnableAlerts?: () => Promise<void>;
};

type TouchPoint = { x: number; y: number };

// ─── Phase derivation ─────────────────────────────────────────────────────────

function getPhase(
  step: LiveStep,
  remaining: number,
  paused: boolean,
  isLast: boolean,
): LivePhase {
  const complete = isLast && (step.duration === 0 || remaining === 0);
  if (complete) return "complete";
  if (step.zone === "Reposo" || step.zone === "Servir") return "rest";
  if (!step.duration || paused) return "idle";
  if (step.duration > 0 && remaining / step.duration <= 0.2) return "urgent";
  return "active";
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<LivePhase, string> = {
  idle: "text-zinc-400",
  active: "text-orange-400",
  urgent: "text-yellow-400",
  rest: "text-indigo-400",
  complete: "text-emerald-400",
};

const AMBIENT_COLOR: Record<LivePhase, string> = {
  idle: "",
  active: "rgba(249,115,22,0.10)",
  urgent: "rgba(234,179,8,0.09)",
  rest: "rgba(129,140,248,0.08)",
  complete: "rgba(16,185,129,0.09)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveCookingScreen({
  steps,
  currentIndex,
  remaining,
  paused,
  context,
  lang = "es",
  onBack,
  onReset,
  onPause,
  onCompleteStep,
  onPreviousStep,
  onGoToStep,
  alertMessage,
  alertsEnabled,
  onEnableAlerts,
}: Props) {
  const touchRef = useRef<TouchPoint | null>(null);
  const isEs = lang !== "en";

  const step = steps[currentIndex];
  if (!step) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;
  const hasTimer = step.duration > 0;
  const nextStep = steps[currentIndex + 1] ?? null;
  const phase = getPhase(step, remaining, paused, isLast);

  // Ambient background shifts by phase
  const ambientColor = AMBIENT_COLOR[phase];
  const bgStyle = ambientColor
    ? {
        backgroundImage: `radial-gradient(circle at 50% 0%, ${ambientColor}, transparent 50%), linear-gradient(180deg, #030303, #050505)`,
      }
    : { backgroundColor: "#030303" };

  // ── Derived labels ──────────────────────────────────────────────────────────
  const pauseLabel = paused ? (isEs ? "Reanudar" : "Resume") : (isEs ? "Pausar" : "Pause");
  const completeLabel =
    phase === "complete"
      ? isEs
        ? "¡Listo!"
        : "Done!"
      : isEs
        ? "Completar paso"
        : "Complete step";

  // ── LIVE dot class ──────────────────────────────────────────────────────────
  const dotClass =
    phase === "complete"
      ? "bg-emerald-400"
      : phase === "urgent"
        ? "animate-pulse bg-yellow-400"
        : phase === "rest"
          ? "bg-indigo-400"
          : paused
            ? "bg-zinc-500"
            : "animate-pulse bg-red-500";

  // ── Swipe ───────────────────────────────────────────────────────────────────
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
    if (dx < 0 && !isLast) onCompleteStep();
    if (dx > 0 && !isFirst) onPreviousStep?.();
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col text-white"
      style={bgStyle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Zone 1: Status Bar (~44px) ──────────────────────────────────────── */}
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-white/[0.055] px-4">
        {/* Optional back button — shown in embedded mode only */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/50 transition active:scale-[0.97]"
          >
            ← {isEs ? "Plan" : "Plan"}
          </button>
        )}

        {/* Zone + temp */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {step.tempTarget != null && (
            <>
              <span className="text-[10px] font-bold text-white/35">{step.tempTarget}°C</span>
              <span className="text-[9px] text-white/20">·</span>
            </>
          )}
          <span
            className={`truncate text-[11px] font-black uppercase tracking-[0.16em] ${STATUS_COLOR[phase]}`}
          >
            {step.zone}
          </span>
        </div>

        {/* LIVE badge */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
            Live
          </span>
        </div>

        {/* Right cluster: alerts + step count */}
        <div className="flex shrink-0 items-center gap-2">
          {alertsEnabled !== undefined && onEnableAlerts && (
            alertsEnabled ? (
              <span className={`text-[9px] font-bold ${STATUS_COLOR[phase]}`}>
                {isEs ? "Avisos" : "Alerts"}
              </span>
            ) : (
              <button
                type="button"
                onClick={onEnableAlerts}
                className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[9px] font-black text-orange-200 transition active:scale-[0.97]"
              >
                {isEs ? "Avisos" : "Alerts"}
              </button>
            )
          )}
          <span className="text-[10px] font-semibold text-white/22">
            {currentIndex + 1}/{steps.length}
          </span>
        </div>
      </header>

      {/* ── Scrollable content (Zones 2–5) ─────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Alert banner */}
        {alertMessage && (
          <div className="mx-4 mt-3 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-2.5 text-sm font-bold text-orange-100">
            {alertMessage}
          </div>
        )}

        {/* ── Zone 2: Timer Dial (~200px) ────────────────────────────────── */}
        <div className="flex justify-center py-7">
          <TimerDial total={step.duration} remaining={remaining} phase={phase} />
        </div>

        {/* ── Zone 3: Current Step Card (~140px) ─────────────────────────── */}
        <div className="px-4">
          <StepCard
            step={{
              id: step.id,
              label: step.label,
              duration: step.duration,
              zone: step.zone,
              tempTarget: step.tempTarget ?? null,
              notes: step.notes ?? null,
            }}
            phase={phase}
          />
        </div>

        {/* ── Zone 4: Next Step Preview (~60px) ──────────────────────────── */}
        {nextStep && (
          <div className="mx-4 mt-2 flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.012] px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25">
                {isEs ? "Siguiente" : "Next"}
              </p>
              <p className="mt-0.5 line-clamp-1 text-sm font-bold text-white/45">
                {nextStep.label}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-white/25">
              {nextStep.duration ? formatTime(nextStep.duration) : "—"}
            </span>
          </div>
        )}

        {/* ── Zone 5: Timeline Scrubber (~52px) ──────────────────────────── */}
        <div className="px-4 pt-4">
          <Timeline
            steps={steps}
            currentIndex={currentIndex}
            phase={phase}
            onGoToStep={onGoToStep}
          />
        </div>

        {/* Complete state */}
        {phase === "complete" && (
          <div className="mx-4 mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400">
              {isEs ? "Cocción completada" : "Cooking complete"}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-white/60">
              {isEs ? "Corta, sirve y disfruta." : "Slice, serve, enjoy."}
            </p>
          </div>
        )}

        {/* Context / reset (minimal) */}
        {(context || onReset) && (
          <div className="flex items-center justify-center gap-3 px-4 py-4">
            {context && (
              <span className="text-[10px] font-semibold text-white/18">{context}</span>
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

      {/* ── Zone 6: Bottom Nav — exactly 2 actions ─────────────────────────── */}
      <nav className="shrink-0 border-t border-white/[0.065] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPause}
            disabled={!hasTimer || phase === "complete"}
            className="min-h-[3.5rem] flex-none rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-black text-white/75 transition active:scale-[0.97] disabled:opacity-35"
          >
            {pauseLabel}
          </button>

          <button
            type="button"
            onClick={onCompleteStep}
            disabled={phase === "complete"}
            className={`min-h-[3.5rem] flex-1 rounded-2xl text-base font-black transition active:scale-[0.97] disabled:opacity-35 ${
              phase === "complete"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                : phase === "urgent"
                  ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/25 hover:bg-yellow-300"
                  : "bg-orange-500 text-black shadow-lg shadow-orange-500/20 hover:bg-orange-400"
            }`}
          >
            {completeLabel}
          </button>
        </div>
      </nav>
    </div>
  );
}
