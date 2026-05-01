import type { LivePhase } from "./TimerDial";
import LiveVisualGuideCard from "./LiveVisualGuideCard";
import { getLiveVisualGuide } from "./liveVisualGuide";
import type { LiveCookingStepState } from "./LiveCookingScreen";

const CARD_BORDER: Record<LivePhase, string> = {
  idle: "border-zinc-600/25",
  active: "border-orange-500/40",
  urgent: "border-yellow-400/65",
  rest: "border-indigo-400/45",
  complete: "border-emerald-500/45",
};

const CARD_BG: Record<LivePhase, string> = {
  idle: "rgba(255,255,255,0.025)",
  active: "rgba(249,115,22,0.055)",
  urgent: "rgba(234,179,8,0.048)",
  rest: "rgba(129,140,248,0.032)",
  complete: "rgba(16,185,129,0.038)",
};

const CARD_GLOW: Record<LivePhase, string> = {
  idle: "none",
  active: "0 0 0 1px rgba(249,115,22,0.24), 0 8px 52px rgba(249,115,22,0.20)",
  urgent: "0 0 0 1px rgba(234,179,8,0.30), 0 8px 40px rgba(234,179,8,0.18)",
  rest: "0 0 0 1px rgba(129,140,248,0.18), 0 8px 24px rgba(129,140,248,0.10)",
  complete: "0 0 0 1px rgba(16,185,129,0.22), 0 8px 32px rgba(16,185,129,0.12)",
};

const ZONE_CHIP_BORDER: Record<LivePhase, string> = {
  idle: "border-zinc-500/25  bg-zinc-500/8   text-zinc-400",
  active: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  urgent: "border-yellow-400/55 bg-yellow-400/12 text-yellow-300",
  rest: "border-indigo-400/40 bg-indigo-400/10 text-indigo-300",
  complete: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

const TEMP_COLOR: Record<LivePhase, string> = {
  idle: "text-zinc-400",
  active: "text-orange-300",
  urgent: "text-yellow-300",
  rest: "text-indigo-300",
  complete: "text-emerald-300",
};

const NOW_STYLE: Record<LivePhase, string> = {
  idle: "border-zinc-600/20  bg-zinc-500/6",
  active: "border-orange-500/22 bg-orange-500/7",
  urgent: "border-yellow-500/32 bg-yellow-500/8",
  rest: "border-indigo-500/22 bg-indigo-500/7",
  complete: "border-emerald-500/22 bg-emerald-500/7",
};

const NOW_LABEL: Record<LivePhase, string> = {
  idle: "text-zinc-500",
  active: "text-orange-500/70",
  urgent: "text-yellow-500/80",
  rest: "text-indigo-400/70",
  complete: "text-emerald-500/70",
};

const PREP_HINT: Record<string, Record<"es" | "en", string>> = {
  direct: {
    es: "Asegura calor directo en la parrilla",
    en: "Keep direct heat ready",
  },
  indirect: {
    es: "Prepara la zona sin llama directa",
    en: "Prepare the indirect zone",
  },
  rest: {
    es: "Ten tabla, cuchillo y plato listos",
    en: "Have the board, knife, and plate ready",
  },
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type Props = {
  context?: string;
  currentStep: LiveCookingStepState;
  guidanceOpen: boolean;
  isEs: boolean;
  nextStep: LiveCookingStepState | null;
  onToggleGuidance: () => void;
  phase: LivePhase;
};

export default function LiveStepCard({
  context,
  currentStep,
  guidanceOpen,
  isEs,
  nextStep,
  onToggleGuidance,
  phase,
}: Props) {
  const visualGuide = getLiveVisualGuide(
    {
      label: currentStep.name,
      zone: currentStep.displayZone,
      notes: currentStep.instructions,
    },
    context,
  );
  const prepHint = nextStep ? PREP_HINT[nextStep.zone]?.[isEs ? "es" : "en"] : null;

  return (
    <div className="space-y-2">
      <section
        className={`rounded-2xl border ${CARD_BORDER[phase]} p-5 transition-[background-color,box-shadow,border-color] duration-700`}
        style={{ backgroundColor: CARD_BG[phase], boxShadow: CARD_GLOW[phase] }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] transition-colors duration-500 ${ZONE_CHIP_BORDER[phase]}`}
          >
            {currentStep.displayZone}
          </span>

          {currentStep.duration > 0 && (
            <span className="text-[11px] font-semibold tabular-nums text-white/30">
              {formatDuration(currentStep.duration)}
            </span>
          )}
        </div>

        <p className="mt-3 whitespace-pre-line text-[32px] font-black leading-[1.12] tracking-[-0.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          {currentStep.name}
        </p>

        {currentStep.tempTarget !== null && (
          <p className={`mt-2 text-[14px] font-black ${TEMP_COLOR[phase]}`}>
            {currentStep.tempTarget}°C
            <span className="ml-1.5 text-[11px] font-semibold text-white/30">
              {isEs ? "objetivo" : "target"}
            </span>
          </p>
        )}

        <div className={`mt-3.5 overflow-hidden rounded-xl border ${NOW_STYLE[phase]}`}>
          {guidanceOpen && (
            <div className="px-3.5 pb-2.5 pt-3">
              <p
                className={`mb-1.5 text-[9px] font-black uppercase tracking-[0.22em] ${NOW_LABEL[phase]}`}
              >
                {isEs ? "Ahora" : "Now"}
              </p>
              <p className="text-[12.5px] font-semibold leading-[1.55] text-white/65">
                {currentStep.instructions}
              </p>
              <LiveVisualGuideCard guide={visualGuide} />
            </div>
          )}

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
              <path
                d="M1 3l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{guidanceOpen ? (isEs ? "Ocultar guía" : "Hide guide") : isEs ? "Ver guía" : "Show guide"}</span>
          </button>
        </div>
      </section>

      {nextStep && (
        <section className="flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018] px-4 py-3">
          <div
            className={`h-full w-[3px] self-stretch rounded-full opacity-60 ${
              phase === "urgent"
                ? "bg-yellow-400"
                : phase === "rest"
                  ? "bg-indigo-400"
                  : phase === "complete"
                    ? "bg-emerald-400"
                    : "bg-orange-400"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/28">
              {isEs ? "Siguiente" : "Next"}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[13px] font-bold text-white/52">
              {nextStep.name}
            </p>
            {prepHint && (
              <p className="mt-1 text-[10.5px] leading-snug text-white/32">
                <span className="font-black uppercase tracking-[0.14em] text-white/22">
                  {isEs ? "Prepara" : "Prep"}
                </span>
                {" · "}
                {prepHint}
              </p>
            )}
          </div>
          <span className="shrink-0 self-start font-mono text-[11px] font-semibold tabular-nums text-white/28">
            {nextStep.duration ? formatTime(nextStep.duration) : "-"}
          </span>
        </section>
      )}
    </div>
  );
}
