import type { LiveCookingStepState } from "@/hooks/useLiveCooking";
import { ds } from "@/lib/design-system";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";
import { formatDurationShort } from "@/lib/live/actionResolver";

type Props = {
  nextStep: LiveCookingStepState | null;
  stepAfterNext: LiveCookingStepState | null;
  lang: SurfaceLang;
};

function Row({ eyebrow, name, duration }: { eyebrow: string; name: string; duration: number }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${ds.text.body11}`}>
      <span className={`shrink-0 ${ds.text.body9} font-black uppercase tracking-[0.18em] ${ds.color.mutedClass.secondary}`}>
        {eyebrow}
      </span>
      <span className={`min-w-0 flex-1 truncate font-bold ${ds.color.mutedClass.body}`}>
        {name}
      </span>
      {duration > 0 && (
        <span className={`shrink-0 tabular-nums font-bold ${ds.color.mutedClass.secondary}`}>
          {formatDurationShort(duration)}
        </span>
      )}
    </div>
  );
}

export default function LiveUpNext({ nextStep, stepAfterNext, lang }: Props) {
  const text = getLiveText(lang);
  if (!nextStep && !stepAfterNext) return null;

  return (
    /* allow-arbitrary: rounded-2xl + border-white/[0.06] + bg-white/[0.025] — near-subpanel pattern but no ring; adding subpanel chassis would introduce visible ring */
    <div className="shrink-0 space-y-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-2.5">
      {nextStep && (
        <Row eyebrow={text.upNextEyebrow} name={nextStep.name} duration={nextStep.duration} />
      )}
      {stepAfterNext && (
        <Row eyebrow={text.upNextAfterEyebrow} name={stepAfterNext.name} duration={stepAfterNext.duration} />
      )}
    </div>
  );
}
