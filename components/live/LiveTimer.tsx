import type { UrgencyLevel } from "@/hooks/useLiveCooking";
import type { LivePhase } from "./TimerDial";

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const TIMER_COLOR: Record<LivePhase, string> = {
  idle: "text-zinc-300",
  active: "text-orange-300",
  urgent: "text-yellow-200",
  rest: "text-blue-200",
  complete: "text-emerald-300",
};

const BAR_COLOR: Record<LivePhase, string> = {
  idle: "bg-zinc-500",
  active: "bg-orange-400",
  urgent: "bg-yellow-300",
  rest: "bg-blue-400",
  complete: "bg-emerald-400",
};

type Props = {
  duration: number;
  remainingTime: number;
  progress: number;
  phase: LivePhase;
  reduceMotion?: boolean;
  urgency: UrgencyLevel;
};

export default function LiveTimer({
  duration,
  remainingTime,
  progress,
  phase,
  reduceMotion = false,
  urgency,
}: Props) {
  const hasTimer = duration > 0;
  const isAttention = hasTimer && remainingTime <= 15 && phase !== "idle" && phase !== "complete";
  const isCritical = hasTimer && remainingTime <= 5 && phase !== "idle" && phase !== "complete";
  const progressPct = `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;

  if (!hasTimer) {
    return (
      <section className="rounded-[2rem] border border-white/[0.07] bg-white/[0.035] px-5 py-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/30">Manual step</p>
        <p className="mt-2 text-3xl font-black text-white">Follow the action</p>
        <p className="mt-1 text-sm font-semibold text-white/42">Advance when this step is done.</p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[2rem] border px-5 py-6 text-center transition-all duration-500 ${
        urgency === "critical"
          ? "border-yellow-200/75 bg-yellow-300/[0.11] shadow-[0_0_52px_rgba(250,204,21,0.30)]"
          : urgency === "attention"
            ? "border-orange-300/45 bg-orange-500/[0.06]"
            : "border-white/[0.07] bg-white/[0.035]"
      } ${isAttention && !reduceMotion ? "animate-pulse" : ""}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/32">
        {phase === "complete" ? "Done" : "Time remaining"}
      </p>
      <p
        className={`mt-2 font-mono font-black leading-none tabular-nums tracking-[-0.08em] transition-all duration-200 ${
          isCritical ? "text-[clamp(5.25rem,26vw,7.75rem)]" : "text-[clamp(4.5rem,23vw,7rem)]"
        } ${TIMER_COLOR[phase]}`}
      >
        {formatTime(remainingTime)}
      </p>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-700 ease-linear ${BAR_COLOR[phase]}`}
          style={{ width: phase === "complete" ? "100%" : progressPct }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-white/30">
        <span>{formatTime(duration)}</span>
        <span>{Math.round(Math.max(0, Math.min(1, progress)) * 100)}%</span>
      </div>
    </section>
  );
}
