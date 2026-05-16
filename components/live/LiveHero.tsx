import type { LiveCookingStepState, UrgencyLevel } from "@/hooks/useLiveCooking";
import type { LivePhase } from "./TimerDial";
import { ds } from "@/lib/design-system";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";
import {
  formatCountdown,
  formatTargetTemp,
  getActionLabel,
  getFireLabel,
  getMistakeHint,
  resolveCurrentActionKind,
} from "@/lib/live/actionResolver";

const URGENCY_CHASSIS: Record<UrgencyLevel, string> = {
  /* allow-arbitrary: bg-white/[0.035] — non-subpanel hero-normal tint, no canonical token */
  normal: "border-white/[0.08] bg-white/[0.035]",
  attention: "border-orange-300/45 bg-orange-500/[0.07]",
  /* allow-arbitrary: shadow-[...] critical-urgency hero glow — no canonical ds.shadow.* tier */
  critical: "border-yellow-300/60 bg-yellow-400/[0.08] shadow-[0_0_46px_rgba(250,204,21,0.22)]",
};

const COUNTDOWN_COLOR: Record<LivePhase, string> = {
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
  currentStep: LiveCookingStepState;
  feedback: string | null;
  lang: SurfaceLang;
  phase: LivePhase;
  reduceMotion: boolean;
  urgency: UrgencyLevel;
};

export default function LiveHero({
  currentStep,
  feedback,
  lang,
  phase,
  reduceMotion,
  urgency,
}: Props) {
  const text = getLiveText(lang);
  const actionKind = resolveCurrentActionKind(currentStep);
  const actionLabel = getActionLabel(actionKind, lang);
  const mistakeHint = getMistakeHint(currentStep.name, currentStep.instructions, currentStep.zone, lang);
  const hasTimer = currentStep.duration > 0;
  const isCritical = urgency === "critical";
  const isAttention = urgency === "attention";
  const shouldPulse = !reduceMotion && (isAttention || isCritical);
  const progressPct = `${Math.round(Math.max(0, Math.min(1, currentStep.progress)) * 100)}%`;
  const fireLine = `${getFireLabel(currentStep.zone, lang)} · ${formatTargetTemp(currentStep.tempTarget, lang)}`;

  return (
    <section
      /* allow-arbitrary: rounded-[1.5rem] — hero radius, no canonical ds.radius.* tier */
      className={`relative shrink-0 overflow-hidden rounded-[1.5rem] border px-4 py-4 transition-all duration-300 ${URGENCY_CHASSIS[urgency]} ${shouldPulse ? "animate-pulse" : ""}`}
    >
      {feedback && (
        <div
          /* allow-arbitrary: shadow-[...] feedback-toast lift — no canonical ds.shadow.* tier */
          className={`mb-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-center ${ds.text.body11} font-black text-emerald-200 shadow-[0_10px_34px_rgba(16,185,129,0.12)] ${reduceMotion ? "" : "animate-live-enter"}`}
        >
          {feedback}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`${ds.text.body9} font-black uppercase tracking-[0.22em] ${ds.color.mutedClass.secondary}`}>
            {text.nowEyebrow}
          </p>
          {/* allow-arbitrary: text-[clamp(...)] display-tier action label — stays inline per slice-d-tokens.md §1 */}
          <h1 className="mt-1 overflow-hidden text-[clamp(1.5rem,6.5vw,2rem)] font-black leading-[1.02] tracking-[-0.035em] text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {actionLabel}
          </h1>
        </div>
        {hasTimer && (
          <p
            /* allow-arbitrary: text-[clamp(2.75rem,12vw,3.5rem)] hero countdown — sized for grill-distance readability per /8 spec, no canonical ds.text.* tier */
            className={`shrink-0 font-mono font-black leading-none tabular-nums tracking-[-0.07em] text-[clamp(2.75rem,12vw,3.5rem)] ${COUNTDOWN_COLOR[phase]}`}
          >
            {formatCountdown(currentStep.remainingTime)}
          </p>
        )}
        {!hasTimer && (
          /* allow-arbitrary: bg-white/[0.05] — non-subpanel manual-step chip surface, no canonical token */
          <p className={`shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 ${ds.text.body10} font-black ${ds.color.mutedClass.secondary}`}>
            {text.noTimer}
          </p>
        )}
      </div>

      <p
        /* allow-arbitrary: text-[clamp(...)] responsive instructions — stays inline per slice-d-tokens.md §1 */
        className={`mt-3 overflow-hidden whitespace-pre-line text-[clamp(0.9rem,3.6vw,1.05rem)] font-semibold leading-snug ${ds.color.mutedClass.body} [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]`}
      >
        {currentStep.instructions}
      </p>

      {hasTimer && (
        /* allow-arbitrary: bg-white/[0.08] — non-subpanel progress-bar track, no canonical token */
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden>
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-700 ease-linear ${BAR_COLOR[phase]}`}
            style={{ width: phase === "complete" ? "100%" : progressPct }}
          />
        </div>
      )}

      <p className={`mt-3 truncate ${ds.text.body11} font-bold ${ds.color.mutedClass.secondary}`}>
        {fireLine}
      </p>

      {mistakeHint && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-yellow-300/20 bg-yellow-400/[0.06] px-2.5 py-1.5">
          <span className={`mt-px shrink-0 ${ds.text.body11} leading-none text-yellow-300/80`}>⚠</span>
          <div className="min-w-0">
            <p className={`${ds.text.body9} font-black uppercase tracking-[0.16em] text-yellow-200/70`}>
              {text.verifyBefore}
            </p>
            <p className={`mt-0.5 ${ds.text.body11} font-semibold leading-snug text-yellow-100/85`}>
              {mistakeHint}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
