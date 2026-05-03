import type { LiveCookingStepState, LiveZone } from "@/hooks/useLiveCooking";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";

const ZONE_BADGE: Record<LiveZone, string> = {
  direct: "border-red-300/50 bg-red-500/15 text-red-200",
  indirect: "border-orange-300/45 bg-orange-400/12 text-orange-200",
  rest: "border-blue-300/45 bg-blue-400/15 text-blue-200",
};

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  if (secs === 0) return `${minutes}m`;
  return `${minutes}m ${secs}s`;
}

type Props = {
  nextStep: LiveCookingStepState;
  lang?: SurfaceLang;
};

export default function LiveNextStepPreview({ nextStep, lang = "en" }: Props) {
  const text = getLiveText(lang);
  const zoneLabel =
    nextStep.zone === "direct"
      ? text.zoneDirect
      : nextStep.zone === "indirect"
        ? text.zoneIndirect
        : text.zoneRest;
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-2.5">
      <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.2em] text-white/28">
        {text.upNext}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white/55">
        {nextStep.name}
      </span>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${ZONE_BADGE[nextStep.zone]}`}
      >
        {zoneLabel}
      </span>
      {nextStep.duration > 0 && (
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-white/35">
          {formatDuration(nextStep.duration)}
        </span>
      )}
    </div>
  );
}
