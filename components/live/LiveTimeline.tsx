import type { LivePhase } from "./TimerDial";
import type { LiveCookingStepState } from "./LiveCookingScreen";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";

const CURRENT_SEGMENT: Record<LivePhase, string> = {
  idle: "bg-zinc-400",
  active: "bg-orange-400",
  urgent: "bg-yellow-400",
  rest: "bg-indigo-400",
  complete: "bg-emerald-400",
};

type Props = {
  currentIndex: number;
  lang: SurfaceLang;
  onGoToStep?: (index: number) => void;
  phase: LivePhase;
  steps: LiveCookingStepState[];
};

export default function LiveTimeline({
  currentIndex,
  lang,
  onGoToStep,
  phase,
  steps,
}: Props) {
  const text = getLiveText(lang);
  const progressPct = Math.round(
    (currentIndex / Math.max(steps.length - 1, 1)) * 100,
  );

  return (
    <div>
      <div className="flex items-center gap-[3px]" aria-label={text.progressAria}>
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
              className={`group flex min-h-5 flex-1 items-center py-1 ${
                step.isCompleted ? "opacity-45" : ""
              }`}
              aria-label={`${text.goToStep} ${index + 1}`}
              title={step.name}
            >
              <div className={`h-[5px] w-full overflow-hidden rounded-full ${barClass}`}>
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    step.isActive ? "bg-white/55" : step.isCompleted ? "bg-white/35" : "bg-transparent"
                  }`}
                  style={{ width: progressWidth }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-0.5 flex items-center justify-between px-0.5">
        <span className="text-[9px] font-semibold text-white/20">
          {`${text.step} ${currentIndex + 1} ${text.of} ${steps.length}`}
        </span>
        <span className="text-[9px] font-semibold text-white/20">{progressPct}%</span>
      </div>
    </div>
  );
}
