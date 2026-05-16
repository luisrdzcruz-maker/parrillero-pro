import type { LivePhase } from "./TimerDial";
import type { LiveCookingStepState } from "./LiveCookingScreen";
import { ds } from "@/lib/design-system";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";

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
  lang: SurfaceLang;
  onBack?: () => void;
  overallProgressPct: string;
  phase: LivePhase;
  stepCount: number;
  alertsEnabled?: boolean;
  onEnableAlerts?: () => Promise<void>;
};

export default function LiveHeader({
  currentStep,
  currentIndex,
  dotClass,
  lang,
  onBack,
  overallProgressPct,
  phase,
  stepCount,
  alertsEnabled,
  onEnableAlerts,
}: Props) {
  const text = getLiveText(lang);
  return (
    <header className="relative flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.055] px-3.5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          /* allow-arbitrary: bg-white/[0.04] — non-subpanel chip surface, no canonical token */
          className={`shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 ${ds.text.body10} font-bold ${ds.color.mutedClass.secondary} transition active:scale-[0.97]`}
        >
          {text.plan}
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {currentStep.tempTarget != null && (
          <>
            <span className={`${ds.text.body10} font-bold ${ds.color.mutedClass.disabled}`}>
              {currentStep.tempTarget}°C
            </span>
            <span className={`${ds.text.body9} ${ds.color.mutedClass.disabled}`}>·</span>
          </>
        )}
        <span
          className={`truncate ${ds.text.body10} font-black uppercase tracking-[0.14em] ${STATUS_COLOR[phase]}`}
        >
          {currentStep.displayZone}
        </span>
      </div>

      {/* allow-arbitrary: bg-white/[0.04] — non-subpanel chip surface, no canonical token */}
      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        <span className={`${ds.text.body9} font-black uppercase tracking-[0.18em] ${ds.color.mutedClass.body}`}>
            {text.live}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {alertsEnabled !== undefined &&
          onEnableAlerts &&
          (alertsEnabled ? (
            <span className={`${ds.text.body9} font-bold ${STATUS_COLOR[phase]}`}>
              {text.alerts}
            </span>
          ) : (
            <button
              type="button"
              onClick={onEnableAlerts}
              className={`rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 ${ds.text.body9} font-black text-orange-200 transition active:scale-[0.97]`}
            >
              {text.alerts}
            </button>
          ))}
        {/* allow-arbitrary: bg-white/[0.05] — non-subpanel chip surface, no canonical token */}
        <span className={`rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 ${ds.text.body10} tabular-nums`}>
          <span className={`font-semibold ${ds.color.mutedClass.disabled}`}>{`${text.step} `}</span>
          <span className={`font-black ${ds.color.mutedClass.body}`}>{currentIndex + 1}</span>
          <span className={`font-medium ${ds.color.mutedClass.disabled}`}>
            {` ${text.of} ${stepCount}`}
          </span>
        </span>
      </div>
      {/* allow-arbitrary: bg-white/[0.05] — progress bar surface, no canonical token */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/[0.05]" aria-hidden>
        <div
          className="h-full bg-orange-300 transition-[width] duration-300 ease-out"
          style={{ width: overallProgressPct }}
        />
      </div>
    </header>
  );
}
