import type { LiveCookingStepState, LiveZone, UrgencyLevel } from "@/hooks/useLiveCooking";
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

// Fuego chip picks up phase-tied tone — heat setting changes character with zone.
const FIRE_CHIP_TONE: Record<LiveZone, string> = {
  direct: "border-red-300/45 bg-red-500/14 text-red-100",
  indirect: "border-orange-300/45 bg-orange-400/14 text-orange-100",
  rest: "border-blue-300/45 bg-blue-400/14 text-blue-100",
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

  return (
    <section
      /* allow-arbitrary: rounded-[1.5rem] — hero radius, no canonical ds.radius.* tier */
      className={`relative shrink-0 overflow-hidden rounded-[1.5rem] border px-4 py-4 transition-all duration-300 ${URGENCY_CHASSIS[urgency]} ${shouldPulse ? "animate-pulse" : ""}`}
    >
      {feedback && (
        <div
          /* allow-arbitrary: shadow-[...] feedback-toast lift — no canonical ds.shadow.* tier */
          className={`mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-center ${ds.text.body11} font-black text-emerald-200 shadow-[0_10px_34px_rgba(16,185,129,0.12)] ${reduceMotion ? "" : "animate-live-enter"}`}
        >
          {feedback}
        </div>
      )}

      {/* Group A — action + countdown + progress: the "what · how long · how far" unit */}
      <div>
        {/* allow-arbitrary: text-[clamp(...)] display-tier action label — stays inline per slice-d-tokens.md §1 */}
        <h1 className="overflow-hidden text-[clamp(1.5rem,6.5vw,2rem)] font-black leading-[1.02] tracking-[-0.035em] text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {actionLabel}
        </h1>

        {hasTimer && (
          <p
            /* allow-arbitrary: text-[clamp(5rem,22vw,6rem)] hero countdown — 80-96px range, the unambiguous visual hero, no canonical ds.text.* tier */
            className={`my-4 text-center font-mono font-black leading-none tabular-nums tracking-[-0.07em] text-[clamp(5rem,22vw,6rem)] ${COUNTDOWN_COLOR[phase]}`}
          >
            {formatCountdown(currentStep.remainingTime)}
          </p>
        )}
        {!hasTimer && (
          <p className="my-4 text-center">
            {/* allow-arbitrary: bg-white/[0.05] — non-subpanel manual-step chip surface, no canonical token */}
            <span className={`inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 ${ds.text.body10} font-black ${ds.color.mutedClass.secondary}`}>
              {text.noTimer}
            </span>
          </p>
        )}

        {hasTimer && (
          /* allow-arbitrary: bg-white/[0.08] — non-subpanel progress-bar track, no canonical token */
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden>
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-700 ease-linear ${BAR_COLOR[phase]}`}
              style={{ width: phase === "complete" ? "100%" : progressPct }}
            />
          </div>
        )}
      </div>

      {/* Group B — instructions: the pedagogical content. Bumped to 16-19px white-semibold
          so it reads as legitimate second-tier content, not faded chrome. */}
      <p
        /* allow-arbitrary: text-[clamp(...)] responsive instructions — bumped per /8b spec for mid-cook readability, no canonical ds.text.* tier */
        className="mt-5 overflow-hidden whitespace-pre-line text-[clamp(1rem,4.2vw,1.2rem)] font-semibold leading-snug text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
      >
        {currentStep.instructions}
      </p>

      {/* Group C — operational decisions: heat zone and target temperature as two
          distinct chips. Fuego phase-tinted; Objetivo neutral. Objetivo omitted
          entirely when no tempTarget is set (no placeholder). */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex min-h-[2rem] items-center rounded-full border px-3 py-1 ${ds.text.body11} font-semibold ${FIRE_CHIP_TONE[currentStep.zone]}`}
        >
          {getFireLabel(currentStep.zone, lang)}
        </span>
        {currentStep.tempTarget != null && (
          <span
            /* allow-arbitrary: bg-white/[0.04] — non-subpanel target-temp chip surface, no canonical token */
            className={`inline-flex min-h-[2rem] items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 ${ds.text.body11} font-semibold ${ds.color.mutedClass.body}`}
          >
            {formatTargetTemp(currentStep.tempTarget, lang)}
          </span>
        )}
      </div>

      {/* Group D — warning chip (conditional). When we can predict a known mistake
          for this step's action+zone combo, surface it here, distinct from the
          operational chips above. */}
      {mistakeHint && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-yellow-300/20 bg-yellow-400/[0.06] px-2.5 py-1.5">
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
