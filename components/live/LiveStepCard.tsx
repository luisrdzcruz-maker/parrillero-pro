import type { LiveCookingStepState, LiveZone, UrgencyLevel } from "@/hooks/useLiveCooking";

const ZONE_STYLES: Record<LiveZone, string> = {
  direct: "border-red-300/60 bg-red-500/20 text-red-100 shadow-[0_0_24px_rgba(248,113,113,0.16)]",
  indirect: "border-orange-300/45 bg-orange-400/12 text-orange-100 shadow-[0_0_18px_rgba(251,146,60,0.10)]",
  rest: "border-blue-300/45 bg-blue-400/12 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.10)]",
};

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  normal: "border-white/[0.08] bg-white/[0.035]",
  attention: "border-orange-300/45 bg-orange-500/[0.07]",
  critical: "border-yellow-300/60 bg-yellow-400/[0.08] shadow-[0_0_46px_rgba(250,204,21,0.22)]",
};

const ZONE_LABEL: Record<LiveZone, string> = {
  direct: "Direct heat",
  indirect: "Indirect heat",
  rest: "Rest",
};

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

type Props = {
  completedSteps: LiveCookingStepState[];
  currentStep: LiveCookingStepState;
  feedback: string | null;
  nextStep: LiveCookingStepState | null;
  reduceMotion?: boolean;
  transitionState?: "idle" | "exit" | "enter";
  urgency: UrgencyLevel;
};

export default function LiveStepCard({
  completedSteps,
  currentStep,
  feedback,
  nextStep,
  reduceMotion = false,
  transitionState = "idle",
  urgency,
}: Props) {
  const completedPreview = completedSteps.slice(-2);
  const transitionClass = reduceMotion
    ? ""
    : transitionState === "exit"
      ? "opacity-0 translate-y-2"
      : transitionState === "enter"
        ? "opacity-0 -translate-y-2"
        : "opacity-100 translate-y-0";

  return (
    <div className="space-y-3">
      {feedback && (
        <div className={`rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-200 shadow-[0_10px_34px_rgba(16,185,129,0.12)] ${reduceMotion ? "" : "animate-live-enter"}`}>
          {feedback}
        </div>
      )}

      <section
        className={`rounded-[2rem] border p-5 transition-all duration-200 ease-out ${URGENCY_STYLES[urgency]} ${transitionClass}`}
      >
        <div className="flex items-center justify-between gap-3">
          {currentStep.displayZone && (
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${ZONE_STYLES[currentStep.zone]}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
              {ZONE_LABEL[currentStep.zone]}
            </span>
          )}
          {currentStep.tempTarget !== null && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-black text-white/70">
              {currentStep.tempTarget} C target
            </span>
          )}
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.26em] text-white/32">
          Current step
        </p>
        <h1 className="mt-2 text-[clamp(2.5rem,12vw,4.5rem)] font-black leading-[0.94] tracking-[-0.07em] text-white">
          {currentStep.name}
        </h1>
        <p className="mt-4 whitespace-pre-line text-base font-semibold leading-relaxed text-white/70">
          {currentStep.instructions}
        </p>
      </section>

      {nextStep && (
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/28">
                Next step
              </p>
              <p className="mt-1 truncate text-lg font-black text-white/62">{nextStep.name}</p>
            </div>
            <div className="shrink-0 text-right">
              {nextStep.displayZone && (
                <p className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${ZONE_STYLES[nextStep.zone]}`}>
                  {ZONE_LABEL[nextStep.zone]}
                </p>
              )}
              <p className="mt-1 font-mono text-xs font-bold text-white/32">
                {nextStep.duration ? formatTime(nextStep.duration) : "Manual"}
              </p>
            </div>
          </div>
        </section>
      )}

      {completedPreview.length > 0 && (
        <section className="rounded-2xl border border-emerald-400/[0.12] bg-emerald-500/[0.035] px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/22">
            Completed
          </p>
          <div className="mt-2 space-y-1">
            {completedPreview.map((step) => (
              <p key={step.id} className="flex items-center gap-2 truncate text-xs font-semibold text-emerald-100/58">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400/18 text-[10px] text-emerald-200">
                  OK
                </span>
                <span className="truncate">{step.name}</span>
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
