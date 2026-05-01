import type { LivePhase } from "./TimerDial";
import type { LiveCookingStepState } from "./LiveCookingScreen";

const STATUS_COLOR: Record<LivePhase, string> = {
  idle: "text-zinc-400",
  active: "text-orange-400",
  urgent: "text-yellow-400",
  rest: "text-indigo-400",
  complete: "text-emerald-400",
};

type Props = {
  currentStep: LiveCookingStepState;
  currentIndex: number;
  dotClass: string;
  isEs: boolean;
  onBack?: () => void;
  phase: LivePhase;
  stepCount: number;
  alertsEnabled?: boolean;
  onEnableAlerts?: () => Promise<void>;
};

export default function LiveHeader({
  currentStep,
  currentIndex,
  dotClass,
  isEs,
  onBack,
  phase,
  stepCount,
  alertsEnabled,
  onEnableAlerts,
}: Props) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-white/[0.055] px-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/50 transition active:scale-[0.97]"
        >
          {isEs ? "Plan" : "Plan"}
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {currentStep.tempTarget != null && (
          <>
            <span className="text-[10px] font-bold text-white/35">
              {currentStep.tempTarget}°C
            </span>
            <span className="text-[9px] text-white/20">·</span>
          </>
        )}
        <span
          className={`truncate text-[11px] font-black uppercase tracking-[0.16em] ${STATUS_COLOR[phase]}`}
        >
          {currentStep.displayZone}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
          Live
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {alertsEnabled !== undefined &&
          onEnableAlerts &&
          (alertsEnabled ? (
            <span className={`text-[9px] font-bold ${STATUS_COLOR[phase]}`}>
              {isEs ? "Avisos" : "Alerts"}
            </span>
          ) : (
            <button
              type="button"
              onClick={onEnableAlerts}
              className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[9px] font-black text-orange-200 transition active:scale-[0.97]"
            >
              {isEs ? "Avisos" : "Alerts"}
            </button>
          ))}
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] tabular-nums">
          <span className="font-semibold text-white/38">{isEs ? "Paso " : "Step "}</span>
          <span className="font-black text-white/75">{currentIndex + 1}</span>
          <span className="font-medium text-white/30">
            {isEs ? ` de ${stepCount}` : ` of ${stepCount}`}
          </span>
        </span>
      </div>
    </header>
  );
}
