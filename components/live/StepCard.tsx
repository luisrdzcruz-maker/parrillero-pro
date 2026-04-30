import type { LivePhase } from "./TimerDial";

export type Step = {
  id: string;
  label: string;
  duration: number;
  zone: string;
  tempTarget: number | null;
  notes: string | null;
};

// Card border — phase-aware, higher contrast than before
const CARD_BORDER: Record<LivePhase, string> = {
  idle:     "border-zinc-600/25",
  active:   "border-orange-500/40",
  urgent:   "border-yellow-400/65",
  rest:     "border-indigo-400/45",
  complete: "border-emerald-500/45",
};

// Card background tint — subtle but present
const CARD_BG: Record<LivePhase, string> = {
  idle:     "rgba(255,255,255,0.025)",
  active:   "rgba(249,115,22,0.055)",
  urgent:   "rgba(234,179,8,0.048)",
  rest:     "rgba(129,140,248,0.032)",
  complete: "rgba(16,185,129,0.038)",
};

// Warm glow behind the card — makes the active step feel alive
const CARD_GLOW: Record<LivePhase, string> = {
  idle:     "none",
  active:   "0 0 0 1px rgba(249,115,22,0.24), 0 8px 52px rgba(249,115,22,0.20)",
  urgent:   "0 0 0 1px rgba(234,179,8,0.30), 0 8px 40px rgba(234,179,8,0.18)",
  rest:     "0 0 0 1px rgba(129,140,248,0.18), 0 8px 24px rgba(129,140,248,0.10)",
  complete: "0 0 0 1px rgba(16,185,129,0.22), 0 8px 32px rgba(16,185,129,0.12)",
};

// Zone chip colors
const ZONE_CHIP_BORDER: Record<LivePhase, string> = {
  idle:     "border-zinc-500/25  bg-zinc-500/8   text-zinc-400",
  active:   "border-orange-500/35 bg-orange-500/10 text-orange-300",
  urgent:   "border-yellow-400/55 bg-yellow-400/12 text-yellow-300",
  rest:     "border-indigo-400/40 bg-indigo-400/10 text-indigo-300",
  complete: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

// Temp badge
const TEMP_COLOR: Record<LivePhase, string> = {
  idle:     "text-zinc-400",
  active:   "text-orange-300",
  urgent:   "text-yellow-300",
  rest:     "text-indigo-300",
  complete: "text-emerald-300",
};

// AHORA block border + background tint
const AHORA_STYLE: Record<LivePhase, string> = {
  idle:     "border-zinc-600/20  bg-zinc-500/6",
  active:   "border-orange-500/22 bg-orange-500/7",
  urgent:   "border-yellow-500/32 bg-yellow-500/8",
  rest:     "border-indigo-500/22 bg-indigo-500/7",
  complete: "border-emerald-500/22 bg-emerald-500/7",
};

// AHORA label color
const AHORA_LABEL: Record<LivePhase, string> = {
  idle:     "text-zinc-500",
  active:   "text-orange-500/70",
  urgent:   "text-yellow-500/80",
  rest:     "text-indigo-400/70",
  complete: "text-emerald-500/70",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

type Props = {
  step: Step;
  phase: LivePhase;
  guidanceOpen: boolean;
  onToggleGuidance: () => void;
};

export default function StepCard({ step, phase, guidanceOpen, onToggleGuidance }: Props) {
  return (
    <div
      className={`rounded-2xl border ${CARD_BORDER[phase]} p-5 transition-[background-color,box-shadow,border-color] duration-700`}
      style={{ backgroundColor: CARD_BG[phase], boxShadow: CARD_GLOW[phase] }}
    >
      {/* Header row: zone chip + duration */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] transition-colors duration-500 ${ZONE_CHIP_BORDER[phase]}`}
        >
          {step.zone}
        </span>

        {step.duration > 0 && (
          <span className="text-[11px] font-semibold tabular-nums text-white/30">
            {formatDuration(step.duration)}
          </span>
        )}
      </div>

      {/* Primary command */}
      <p className="mt-3 whitespace-pre-line text-[32px] font-black leading-[1.12] tracking-[-0.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
        {step.label}
      </p>

      {/* Temperature target */}
      {step.tempTarget !== null && (
        <p className={`mt-2 text-[14px] font-black ${TEMP_COLOR[phase]}`}>
          {step.tempTarget}°C
          <span className="ml-1.5 text-[11px] font-semibold text-white/30">objetivo</span>
        </p>
      )}

      {/* Guidance block — AHORA section + collapsible toggle */}
      {step.notes && (
        <div className={`mt-3.5 rounded-xl border ${AHORA_STYLE[phase]} overflow-hidden`}>
          {guidanceOpen && (
            <div className="px-3.5 pt-3 pb-2.5">
              <p className={`mb-1.5 text-[9px] font-black uppercase tracking-[0.22em] ${AHORA_LABEL[phase]}`}>
                Ahora
              </p>
              <p className="text-[12.5px] font-semibold leading-[1.55] text-white/65">
                {step.notes}
              </p>
            </div>
          )}

          {/* Toggle row */}
          <button
            type="button"
            onClick={onToggleGuidance}
            className={`flex w-full items-center justify-center gap-1.5 px-3.5 py-2 text-[10px] font-bold text-white/30 transition-colors hover:text-white/50 active:scale-[0.98] ${guidanceOpen ? "border-t border-white/[0.06]" : ""}`}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className={`shrink-0 transition-transform duration-200 ${guidanceOpen ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{guidanceOpen ? "Ocultar guía" : "Ver guía"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
