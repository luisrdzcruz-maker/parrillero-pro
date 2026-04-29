import type { LivePhase } from "./TimerDial";

export type Step = {
  id: string;
  label: string;
  duration: number;
  zone: string;
  tempTarget: number | null;
  notes: string | null;
};

const CARD_BORDER: Record<LivePhase, string> = {
  idle: "border-zinc-500/20",
  active: "border-orange-500/30",
  urgent: "border-yellow-500/55",
  rest: "border-indigo-400/35",
  complete: "border-emerald-500/35",
};

const ZONE_COLOR: Record<LivePhase, string> = {
  idle: "text-zinc-500",
  active: "text-orange-400",
  urgent: "text-yellow-400",
  rest: "text-indigo-400",
  complete: "text-emerald-400",
};

const HINT_BG: Record<LivePhase, string> = {
  idle: "bg-zinc-500/8",
  active: "bg-orange-500/8",
  urgent: "bg-yellow-500/10",
  rest: "bg-indigo-500/10",
  complete: "bg-emerald-500/10",
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
      className={`rounded-2xl border ${CARD_BORDER[phase]} bg-white/[0.022] p-5 transition-colors duration-700`}
    >
      {/* Header row: zone chip + duration */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-black uppercase tracking-[0.26em] ${ZONE_COLOR[phase]}`}
        >
          {step.zone}
        </span>
        {step.duration > 0 && (
          <span className="text-[10px] font-bold text-white/25">
            {formatDuration(step.duration)}
          </span>
        )}
      </div>

      {/* Primary command — the ONE thing to do */}
      <p className="mt-2.5 text-[28px] font-extrabold leading-[1.1] tracking-tight text-white">
        {step.label}
      </p>

      {/* Temperature target */}
      {step.tempTarget !== null && (
        <p className={`mt-1.5 text-[13px] font-bold ${ZONE_COLOR[phase]}`}>
          {step.tempTarget}°C
        </p>
      )}

      {/* Contextual hint */}
      {step.notes && (
        <div className={`mt-3 rounded-xl px-3 py-2 ${HINT_BG[phase]}`}>
          <p className="line-clamp-1 text-[12px] font-semibold leading-5 text-white/50">
            {step.notes}
          </p>
        </div>
      )}
    </div>
  );
}
