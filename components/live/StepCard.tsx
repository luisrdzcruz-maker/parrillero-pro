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
  active:   "rgba(249,115,22,0.042)",
  urgent:   "rgba(234,179,8,0.048)",
  rest:     "rgba(129,140,248,0.032)",
  complete: "rgba(16,185,129,0.038)",
};

// Warm glow behind the card — makes the active step feel alive
const CARD_GLOW: Record<LivePhase, string> = {
  idle:     "none",
  active:   "0 0 0 1px rgba(249,115,22,0.18), 0 8px 40px rgba(249,115,22,0.14)",
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

// Notes hint strip
const HINT_STYLE: Record<LivePhase, string> = {
  idle:     "border-zinc-600/20  bg-zinc-500/6",
  active:   "border-orange-500/20 bg-orange-500/7",
  urgent:   "border-yellow-500/30 bg-yellow-500/8",
  rest:     "border-indigo-500/20 bg-indigo-500/7",
  complete: "border-emerald-500/20 bg-emerald-500/7",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

type Props = {
  step: Step;
  phase: LivePhase;
};

export default function StepCard({ step, phase }: Props) {
  return (
    <div
      className={`rounded-2xl border ${CARD_BORDER[phase]} p-5 transition-[background-color,box-shadow,border-color] duration-700`}
      style={{ backgroundColor: CARD_BG[phase], boxShadow: CARD_GLOW[phase] }}
    >
      {/* Header row: zone chip + duration */}
      <div className="flex items-center justify-between gap-2">
        {/* Zone as pill chip */}
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

      {/* Primary command — multi-line rhythm via whitespace-pre-line */}
      <p className="mt-3 whitespace-pre-line text-[32px] font-black leading-[1.12] tracking-[-0.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
        {step.label}
      </p>

      {/* Temperature target — badge style */}
      {step.tempTarget !== null && (
        <p className={`mt-2 text-[14px] font-black ${TEMP_COLOR[phase]}`}>
          {step.tempTarget}°C
          <span className="ml-1.5 text-[11px] font-semibold text-white/30">objetivo</span>
        </p>
      )}

      {/* Contextual hint strip */}
      {step.notes && (
        <div className={`mt-3.5 rounded-xl border px-3.5 py-2.5 ${HINT_STYLE[phase]}`}>
          <p className="line-clamp-2 text-[12px] font-semibold leading-[1.5] text-white/58">
            {step.notes}
          </p>
        </div>
      )}
    </div>
  );
}
