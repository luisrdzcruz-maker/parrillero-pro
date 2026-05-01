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

type Props = {
  currentStep: LiveCookingStepState;
  feedback: string | null;
  reduceMotion?: boolean;
  transitionState?: "idle" | "exit" | "enter";
  urgency: UrgencyLevel;
};

export default function LiveStepCard({
  currentStep,
  feedback,
  reduceMotion = false,
  transitionState = "idle",
  urgency,
}: Props) {
  const transitionClass = reduceMotion
    ? ""
    : transitionState === "exit"
      ? "opacity-0 translate-y-2"
      : transitionState === "enter"
        ? "opacity-0 -translate-y-2"
        : "opacity-100 translate-y-0";

  return (
    <div className="space-y-2">
      {feedback && (
        <div className={`rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2 text-center text-xs font-black text-emerald-200 shadow-[0_10px_34px_rgba(16,185,129,0.12)] ${reduceMotion ? "" : "animate-live-enter"}`}>
          {feedback}
        </div>
      )}

      <section
        className={`rounded-[1.35rem] border p-4 transition-all duration-200 ease-out ${URGENCY_STYLES[urgency]} ${transitionClass}`}
      >
        <div className="flex items-center justify-between gap-3">
          {currentStep.displayZone && (
            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${ZONE_STYLES[currentStep.zone]}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
              {ZONE_LABEL[currentStep.zone]}
            </span>
          )}
          {currentStep.tempTarget !== null && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-black text-white/70">
              {currentStep.tempTarget} C target
            </span>
          )}
        </div>

        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/32">
          Current step
        </p>
        <h1 className="mt-1.5 overflow-hidden text-[clamp(1.75rem,8vw,2.85rem)] font-black leading-[0.98] tracking-[-0.055em] text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {currentStep.name}
        </h1>
        <p className="mt-2.5 overflow-hidden whitespace-pre-line text-[clamp(0.92rem,3.6vw,1rem)] font-semibold leading-snug text-white/72 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
          {currentStep.instructions}
        </p>
      </section>
    </div>
  );
}
