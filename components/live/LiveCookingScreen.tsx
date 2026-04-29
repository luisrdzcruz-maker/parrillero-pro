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
  idle:     "text-zinc-400",
  active:   "text-orange-400",
  urgent:   "text-yellow-400",
  rest:     "text-indigo-400",
  complete: "text-emerald-400",
};

// CTA button shadow by phase (the "complete step" primary button)
const CTA_SHADOW: Record<LivePhase, string> = {
  idle:     "shadow-none",
  active:   "shadow-[0_8px_32px_rgba(249,115,22,0.40)]",
  urgent:   "shadow-[0_8px_32px_rgba(234,179,8,0.45)]",
  rest:     "shadow-none",
  complete: "shadow-[0_8px_32px_rgba(16,185,129,0.40)]",
};

// ─── Zone-aware background glow ───────────────────────────────────────────────
// direct heat → warm orange; indirect → cool indigo; rest/serve → soft purple

function getBgStyle(phase: LivePhase, zone: string): React.CSSProperties {
  const z = zone.toLowerCase();

  if (phase === "complete") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.18), transparent 58%), linear-gradient(180deg, #020202, #040404)",
    };
  }
  if (phase === "urgent") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 15%, rgba(234,179,8,0.20), transparent 58%), radial-gradient(ellipse at 50% 100%, rgba(234,179,8,0.10), transparent 45%), linear-gradient(180deg, #020202, #040404)",
    };
  }
  if (phase === "rest" || z === "reposo" || z === "servir") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 0%, rgba(129,140,248,0.14), transparent 55%), linear-gradient(180deg, #020202, #040404)",
    };
  }
  // active / idle — distinguish by zone heat
  if (z.includes("directo") || z === "directo") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 20%, rgba(249,115,22,0.22), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(234,88,12,0.10), transparent 45%), linear-gradient(180deg, #020202, #040404)",
    };
  }
  if (z.includes("indirecto") || z === "indirecto") {
    return {
      backgroundImage:
        "radial-gradient(ellipse at 50% 18%, rgba(99,102,241,0.13), transparent 55%), linear-gradient(180deg, #020202, #040404)",
    };
  }
  // fallback (idle / unknown zone)
  return { backgroundColor: "#020202" };
}

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

  // Zone-aware background glow (direct = orange, indirect = indigo, rest = purple)
  const bgStyle = getBgStyle(phase, step.zone);

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
          {/* Step counter — prominent so user feels orientation immediately */}
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-black tabular-nums text-white/70">
            {currentIndex + 1}
            <span className="font-medium text-white/30"> / {steps.length}</span>
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

        {/* ── Zone 2: Timer Dial ──────────────────────────────────────────── */}
        <div className="flex justify-center py-5">
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

        {/* ── Zone 4: Next Step Preview ────────────────────────────────────── */}
        {nextStep && (
          <div className="mx-4 mt-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018] px-4 py-3">
            {/* Phase-colored left accent bar */}
            <div
              className={`h-full w-[3px] self-stretch rounded-full opacity-60 ${
                phase === "urgent"  ? "bg-yellow-400" :
                phase === "rest"    ? "bg-indigo-400" :
                phase === "complete"? "bg-emerald-400" :
                                     "bg-orange-400"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/28">
                {isEs ? "Siguiente" : "Next"}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[13px] font-bold text-white/52">
                {nextStep.label}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-white/28">
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
            className={`min-h-[3.5rem] flex-1 rounded-2xl text-base font-black transition-all duration-200 active:scale-[0.97] disabled:opacity-35 ${CTA_SHADOW[phase]} ${
              phase === "complete"
                ? "bg-emerald-500 text-black"
                : phase === "urgent"
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : "bg-orange-500 text-black hover:bg-orange-400"
            }`}
          >
            {completeLabel}
          </button>
        </div>
      </nav>
    </div>
  );
}
