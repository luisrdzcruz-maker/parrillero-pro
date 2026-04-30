"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
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
  // Save-cook CTA (optional — shown on completion)
  onSaveCook?: () => void;
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

// Phase Identity Strip styles
const STRIP_BG: Record<LivePhase, string> = {
  idle:     "rgba(82,82,91,0.10)",
  active:   "rgba(249,115,22,0.10)",
  urgent:   "rgba(234,179,8,0.12)",
  rest:     "rgba(129,140,248,0.10)",
  complete: "rgba(16,185,129,0.10)",
};

const STRIP_BORDER: Record<LivePhase, string> = {
  idle:     "border-zinc-600/18",
  active:   "border-orange-500/22",
  urgent:   "border-yellow-400/30",
  rest:     "border-indigo-400/22",
  complete: "border-emerald-500/22",
};

const STRIP_DOT: Record<LivePhase, string> = {
  idle:     "bg-zinc-500",
  active:   "animate-pulse bg-orange-500",
  urgent:   "animate-pulse bg-yellow-400",
  rest:     "bg-indigo-400",
  complete: "bg-emerald-400",
};

// Static prep hints per next-step zone
const PREP_HINT: Record<string, string> = {
  Directo:   "Asegura calor directo en la parrilla",
  Indirecto: "Ve bajando el fuego a temperatura baja",
  Reposo:    "Ten una tabla y cuchillo a mano",
  Servir:    "Ten el plato listo para servir",
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
        "radial-gradient(ellipse at 50% 18%, rgba(249,115,22,0.30), transparent 58%), radial-gradient(ellipse at 50% 100%, rgba(234,88,12,0.14), transparent 45%), linear-gradient(180deg, #020202, #040404)",
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

// ─── Confidence ───────────────────────────────────────────────────────────────

type Confidence = { label: string; dotCls: string; textCls: string };

function fmtDelta(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

// Pure function — called only inside useEffect (no refs or Date.now in render).
function computeConfidence({
  hasTimer,
  phase,
  cookStart,
  accPause,
  pauseBegan,
  paused,
  steps,
  currentIndex,
  remaining,
  isEs,
}: {
  hasTimer: boolean;
  phase: LivePhase;
  cookStart: number | null;
  accPause: number;
  pauseBegan: number | null;
  paused: boolean;
  steps: LiveStep[];
  currentIndex: number;
  remaining: number;
  isEs: boolean;
}): Confidence | null {
  if (!hasTimer || phase === "complete" || phase === "idle" || cookStart === null) {
    return null;
  }
  const step = steps[currentIndex];
  if (!step) return null;

  const completedDuration = steps
    .slice(0, currentIndex)
    .reduce((sum, s) => sum + s.duration, 0);
  const expectedTotalElapsed = completedDuration + Math.max(0, step.duration - remaining);

  const nowMs = Date.now();
  const currentPauseMs = paused && pauseBegan !== null ? nowMs - pauseBegan : 0;
  const totalPauseMs = accPause + currentPauseMs;
  const actualTotalElapsed = (nowMs - cookStart - totalPauseMs) / 1000;

  const delta = Math.round(actualTotalElapsed - expectedTotalElapsed);
  const abs = Math.abs(delta);

  if (delta <= -20) return { label: isEs ? `Adelantado ${fmtDelta(abs)}` : `Ahead ${fmtDelta(abs)}`, dotCls: "bg-amber-400", textCls: "text-amber-300" };
  if (delta <= 20)  return { label: isEs ? "En tiempo" : "On track", dotCls: "bg-emerald-400", textCls: "text-emerald-300" };
  if (delta <= 60)  return { label: isEs ? "Ligero retraso" : "Slightly late", dotCls: "bg-amber-400", textCls: "text-amber-300" };
  return { label: isEs ? `Retrasado ${fmtDelta(abs)}` : `Late ${fmtDelta(abs)}`, dotCls: "bg-red-400", textCls: "text-red-300" };
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
  onSaveCook,
}: Props) {
  const touchRef = useRef<TouchPoint | null>(null);
  // "idle" → button shown; "saved" → confirmation shown; stays "saved" permanently
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  // Guidance panel: collapsed by default so experienced users can ignore it.
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  // ── Confidence timing refs ────────────────────────────────────────────────
  // All refs are read only inside effects — never during render.
  const cookStartRef   = useRef<number | null>(null);
  const accPauseRef    = useRef(0);
  const pauseBeganRef  = useRef<number | null>(null);

  // Initialize cook start once, after mount
  useEffect(() => {
    if (cookStartRef.current === null) cookStartRef.current = Date.now();
  }, []);

  // Accumulate paused time on each pause/resume transition
  useEffect(() => {
    if (paused) {
      pauseBeganRef.current = Date.now();
    } else if (pauseBeganRef.current !== null) {
      accPauseRef.current += Date.now() - pauseBeganRef.current;
      pauseBeganRef.current = null;
    }
  }, [paused]);

  // Keep guidance opt-in on each new step so it does not clutter the live screen.
  // State update is deferred to next animation frame — satisfies react-hooks/set-state-in-effect.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setGuidanceOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentIndex]);

  const isEs = lang !== "en";

  // Derive values that hooks below depend on — use safe fallbacks before early return
  const step = steps[currentIndex] ?? steps[0];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;
  const hasTimer = step ? step.duration > 0 : false;
  const nextStep = steps[currentIndex + 1] ?? null;
  const phase = step ? getPhase(step, remaining, paused, isLast) : ("idle" as LivePhase);

  // ── Confidence state (updated every second via effect — no refs in render) ──
  // All hooks must be called before early returns to satisfy rules-of-hooks.
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  useEffect(() => {
    function tick() {
      setConfidence(
        computeConfidence({
          hasTimer,
          phase,
          cookStart: cookStartRef.current,
          accPause: accPauseRef.current,
          pauseBegan: pauseBeganRef.current,
          paused,
          steps,
          currentIndex,
          remaining,
          isEs: lang !== "en",
        })
      );
    }
    tick(); // immediate first update
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hasTimer, phase, paused, steps, currentIndex, remaining, lang]);

  // ── Early return after all hooks ──────────────────────────────────────────
  if (!steps[currentIndex]) return null;

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
      className="animate-live-enter flex min-h-0 flex-1 flex-col text-white"
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
          {/* Step counter — "Paso 1 de 5" gives instant orientation */}
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] tabular-nums">
            <span className="font-semibold text-white/38">{isEs ? "Paso " : "Step "}</span>
            <span className="font-black text-white/75">{currentIndex + 1}</span>
            <span className="font-medium text-white/30">{isEs ? ` de ${steps.length}` : ` of ${steps.length}`}</span>
          </span>
        </div>
      </header>

      {/* ── Confidence strip ────────────────────────────────────────────────── */}
      {/* Thin 28px band between the status bar and the timer zone.           */}
      {/* Updates every second (re-renders with `remaining`). Hidden when      */}
      {/* cook hasn't started, step is complete, or step has no timer.        */}
      {confidence && (
        <div className="flex h-7 shrink-0 items-center justify-center gap-1.5 border-b border-white/[0.04] px-4">
          <span className={`h-1.5 w-1.5 rounded-full ${confidence.dotCls}`} />
          <span className={`text-[10.5px] font-bold tracking-[0.04em] ${confidence.textCls}`}>
            {confidence.label}
          </span>
        </div>
      )}

      {/* ── Phase Identity Strip ────────────────────────────────────────────── */}
      {/* Always visible between header and scrollable area — instant phase read */}
      <div
        className={`flex shrink-0 items-center justify-center gap-2.5 border-b py-2.5 transition-colors duration-700 ${STRIP_BORDER[phase]}`}
        style={{ backgroundColor: STRIP_BG[phase] }}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${STRIP_DOT[phase]}`} />
        <span className={`text-[13px] font-black uppercase tracking-[0.20em] transition-colors duration-700 ${STATUS_COLOR[phase]}`}>
          {step.zone}
        </span>
        {step.tempTarget != null && (
          <>
            <span className="text-[10px] text-white/22">·</span>
            <span className={`text-[12px] font-black tabular-nums transition-colors duration-700 ${STATUS_COLOR[phase]}`}>
              {step.tempTarget}°C
            </span>
          </>
        )}
      </div>

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

        {/* ── Zone 3: Current Step Card ───────────────────────────────────── */}
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
            context={context}
            guidanceOpen={guidanceOpen}
            onToggleGuidance={() => setGuidanceOpen((v) => !v)}
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
              {/* PREPARA hint — static zone-based prep cue */}
              {PREP_HINT[nextStep.zone] && (
                <p className="mt-1 text-[10.5px] leading-snug text-white/32">
                  <span className="font-black uppercase tracking-[0.14em] text-white/22">
                    {isEs ? "Prepara" : "Prep"}
                  </span>
                  {" · "}
                  {PREP_HINT[nextStep.zone]}
                </p>
              )}
            </div>
            <span className="shrink-0 self-start font-mono text-[11px] font-semibold tabular-nums text-white/28">
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
          <div className="mx-4 mt-4 space-y-3">
            {/* Completion message */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400">
                {isEs ? "Cocción completada" : "Cooking complete"}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-white/60">
                {isEs ? "Corta, sirve y disfruta." : "Slice, serve, enjoy."}
              </p>
            </div>

            {/* Save-cook CTA — only shown when the page provides a save handler */}
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
                  ? (isEs ? "✓ Guardado" : "✓ Saved")
                  : (isEs ? "Guardar cocción" : "Save this cook")}
              </button>
            )}
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
