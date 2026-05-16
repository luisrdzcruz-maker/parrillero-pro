import type { LivePhase } from "./TimerDial";
import type { LiveCookingStepState } from "@/hooks/useLiveCooking";
import { ds } from "@/lib/design-system";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";

const ZONE_COLOR: Record<LivePhase, string> = {
  idle: "text-zinc-300",
  active: "text-orange-200",
  urgent: "text-yellow-200",
  rest: "text-blue-200",
  complete: "text-emerald-300",
};

type Props = {
  currentStep: LiveCookingStepState;
  lang: SurfaceLang;
  onBack?: () => void;
  phase: LivePhase;
  alertsEnabled?: boolean;
  onEnableAlerts?: () => Promise<void>;
};

export default function LiveHeader({
  currentStep,
  lang,
  onBack,
  phase,
  alertsEnabled,
  onEnableAlerts,
}: Props) {
  const text = getLiveText(lang);
  return (
    <header className="relative flex shrink-0 items-center gap-2 border-b border-white/[0.055] px-3.5 py-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={text.plan}
          /* allow-arbitrary: bg-white/[0.04] — non-subpanel back-button surface, no canonical token */
          className={`inline-flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 ${ds.text.body11} font-black ${ds.color.mutedClass.body} transition hover:bg-white/[0.08] active:scale-[0.97]`}
        >
          <span aria-hidden="true" className="text-base leading-none">‹</span>
          <span>{text.plan}</span>
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <span
          className={`truncate ${ds.text.body10} font-black uppercase tracking-[0.18em] ${ZONE_COLOR[phase]}`}
        >
          {currentStep.displayZone}
        </span>
      </div>

      <div className="flex shrink-0 items-center">
        {alertsEnabled !== undefined &&
          onEnableAlerts &&
          (alertsEnabled ? (
            <span className={`${ds.text.body9} font-black uppercase tracking-[0.16em] ${ZONE_COLOR[phase]}`}>
              {text.alerts}
            </span>
          ) : (
            <button
              type="button"
              onClick={onEnableAlerts}
              aria-label={text.alerts}
              className={`inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-orange-400/30 bg-orange-500/12 px-3 ${ds.text.body9} font-black uppercase tracking-[0.16em] text-orange-100 transition hover:bg-orange-500/20 active:scale-[0.97]`}
            >
              {text.alerts}
            </button>
          ))}
      </div>
    </header>
  );
}
