import type { LivePhase } from "./TimerDial";

// Minimal structural type — compatible with both Step and LiveStep
type StepSegment = {
  id: string;
  label: string;
};

const CURRENT_SEGMENT: Record<LivePhase, string> = {
  idle: "bg-zinc-400",
  active: "bg-orange-400",
  urgent: "bg-yellow-400",
  rest: "bg-indigo-400",
  complete: "bg-emerald-400",
};

type Props = {
  steps: StepSegment[];
  currentIndex: number;
  phase: LivePhase;
  onGoToStep?: (index: number) => void;
};

export default function Timeline({ steps, currentIndex, phase, onGoToStep }: Props) {
  const progressPct = Math.round(
    (currentIndex / Math.max(steps.length - 1, 1)) * 100,
  );

  return (
    <div className="space-y-2">
      {/* Segment bar */}
      <div className="flex items-end gap-[3px]">
        {steps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onGoToStep?.(index)}
              className="group flex flex-1 flex-col items-center gap-1.5 py-1"
              title={step.label}
            >
              <div
                className={`h-[3px] w-full rounded-full transition-all duration-500 ${
                  isPast
                    ? "bg-orange-500/55"
                    : isCurrent
                      ? `${CURRENT_SEGMENT[phase]} shadow-sm`
                      : "bg-white/10 group-hover:bg-white/20"
                }`}
              />
              {isCurrent && (
                <p className="max-w-full truncate text-center text-[9px] font-bold leading-none text-white/38">
                  {step.label}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[9px] font-semibold text-white/20">
          Paso {currentIndex + 1} de {steps.length}
        </span>
        <span className="text-[9px] font-semibold text-white/20">{progressPct}%</span>
      </div>
    </div>
  );
}
