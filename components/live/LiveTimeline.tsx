import type { LivePhase } from "./TimerDial";
import type { LiveCookingStepState } from "./LiveCookingScreen";

const CURRENT_SEGMENT: Record<LivePhase, string> = {
  idle: "bg-zinc-400",
  active: "bg-orange-400",
  urgent: "bg-yellow-400",
  rest: "bg-indigo-400",
  complete: "bg-emerald-400",
};

type Props = {
  currentIndex: number;
  isEs: boolean;
  onGoToStep?: (index: number) => void;
  phase: LivePhase;
  steps: LiveCookingStepState[];
};

export default function LiveTimeline({
  currentIndex,
  isEs,
  onGoToStep,
  phase,
  steps,
}: Props) {
  const progressPct = Math.round(
    (currentIndex / Math.max(steps.length - 1, 1)) * 100,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[3px]">
        {steps.map((step, index) => {
          const barClass = step.isCompleted
            ? "bg-white/18"
            : step.isActive
              ? `${CURRENT_SEGMENT[phase]} shadow-sm`
              : step.isNext
                ? "bg-white/20"
                : "bg-white/10";
          const progressWidth = `${Math.round(step.progress * 100)}%`;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onGoToStep?.(index)}
              className={`group flex flex-1 flex-col items-center gap-1.5 py-1 ${
                step.isCompleted ? "opacity-45" : ""
              }`}
              title={step.name}
            >
              <div className={`h-[4px] w-full overflow-hidden rounded-full ${barClass}`}>
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    step.isActive ? "bg-white/55" : step.isCompleted ? "bg-white/35" : "bg-transparent"
                  }`}
                  style={{ width: progressWidth }}
                />
              </div>
              {(step.isActive || step.isNext) && (
                <p
                  className={`max-w-full truncate text-center text-[9px] font-bold leading-none ${
                    step.isActive ? "text-white/45" : "text-white/26"
                  }`}
                >
                  {step.name}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-0.5">
        <span className="text-[9px] font-semibold text-white/20">
          {isEs ? `Paso ${currentIndex + 1} de ${steps.length}` : `Step ${currentIndex + 1} of ${steps.length}`}
        </span>
        <span className="text-[9px] font-semibold text-white/20">{progressPct}%</span>
      </div>
    </div>
  );
}
