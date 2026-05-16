import type { ReactNode } from "react";
import type { UrgencyLevel } from "@/hooks/useLiveCooking";
import type { LivePhase } from "./TimerDial";
import { ds } from "@/lib/design-system";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";

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
  lang?: SurfaceLang;
  reduceMotion?: boolean;
  urgency: UrgencyLevel;
  children?: ReactNode;
};

export default function LiveTimer({
  duration,
  remainingTime,
  progress,
  phase,
  lang = "en",
  reduceMotion = false,
  urgency,
  children,
}: Props) {
  const liveText = getLiveText(lang);
  const hasTimer = duration > 0;
  const isAttention = hasTimer && remainingTime <= 15 && phase !== "idle" && phase !== "complete";
  const isCritical = hasTimer && remainingTime <= 5 && phase !== "idle" && phase !== "complete";
  const progressPct = `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;

  if (!hasTimer) {
    return (
      /* allow-arbitrary: rounded-[1.15rem] + bg-white/[0.032] — manual-step section chassis, no canonical token */
      <section className="rounded-[1.15rem] border border-white/[0.07] bg-white/[0.032] px-3.5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`${ds.text.body9} font-black uppercase tracking-[0.22em] ${ds.color.mutedClass.disabled}`}>{liveText.manualStep}</p>
            <p className="mt-0.5 truncate text-lg font-black leading-none text-white">{liveText.followAction}</p>
          </div>
          {/* allow-arbitrary: bg-white/[0.04] — non-subpanel no-timer chip surface, no canonical token */}
          <p className={`shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 ${ds.text.body10} font-black ${ds.color.mutedClass.faint}`}>
            {liveText.noTimer}
          </p>
        </div>
        <p className={`mt-2 text-xs font-semibold ${ds.color.mutedClass.faint}`}>{liveText.advanceWhenDone}</p>
        {children && <div className="mt-2">{children}</div>}
      </section>
    );
  }

  return (
    <section
      /* allow-arbitrary: rounded-[1.15rem] — timer section radius, no canonical ds.radius.* tier */
      className={`rounded-[1.15rem] border px-3.5 py-3 transition-all duration-500 ${
        urgency === "critical"
          /* allow-arbitrary: shadow-[0_0_52px_...] critical-urgency yellow glow — no canonical ds.shadow.* tier */
          ? "border-yellow-200/75 bg-yellow-300/[0.11] shadow-[0_0_52px_rgba(250,204,21,0.30)]"
          : urgency === "attention"
            ? "border-orange-300/45 bg-orange-500/[0.06]"
            /* allow-arbitrary: bg-white/[0.035] — non-subpanel normal-urgency tint, no canonical token */
            : "border-white/[0.07] bg-white/[0.035]"
      } ${isAttention && !reduceMotion ? "animate-pulse" : ""}`}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={`${ds.text.body9} font-black uppercase tracking-[0.22em] ${ds.color.mutedClass.disabled}`}>
            {phase === "complete" ? liveText.done : liveText.timeRemaining}
          </p>
          <p
            className={`mt-0.5 font-mono font-black leading-none tabular-nums tracking-[-0.08em] transition-all duration-200 ${
              isCritical ? "text-[2.85rem]" : "text-[2.45rem]"
            } ${TIMER_COLOR[phase]}`}
          >
            {formatTime(remainingTime)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`${ds.text.body9} font-bold uppercase tracking-[0.16em] ${ds.color.mutedClass.disabled}`}>
            {liveText.stepDuration}
          </p>
          <p className={`mt-1 text-sm font-black tabular-nums ${ds.color.mutedClass.secondary}`}>{formatTime(duration)}</p>
        </div>
      </div>
      {/* allow-arbitrary: bg-white/[0.08] — non-subpanel progress-bar track, no canonical token */}
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-700 ease-linear ${BAR_COLOR[phase]}`}
          style={{ width: phase === "complete" ? "100%" : progressPct }}
        />
      </div>
      <div className={`mt-1.5 flex items-center justify-between ${ds.text.body9} font-bold ${ds.color.mutedClass.disabled}`}>
        <span>{liveText.timeRemaining}</span>
        <span>{Math.round(Math.max(0, Math.min(1, progress)) * 100)}%</span>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </section>
  );
}
