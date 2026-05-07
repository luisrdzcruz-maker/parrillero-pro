'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { ParrilladaHeroCard } from '@/components/parrillada/cards/ParrilladaHeroCard';
import { GrillZoneStatusCard } from '@/components/parrillada/cards/GrillZoneStatusCard';
import { getParrilladaItemIcon, getZoneIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ParrilladaTimelineFinal } from '@/components/parrillada/ParrilladaTimelineFinal';
import { ParrilladaWarningsFinal } from '@/components/parrillada/ParrilladaWarningsFinal';
import { buildParrilladaTimeline, getParrilladaCriticalStep } from '@/lib/planning';
import type { GrillZoneType, ParrilladaPlan, PlannerResult } from '@/lib/planning';

type ParrilladaReviewScreenProps = {
  plan: ParrilladaPlan;
  plannerResult: PlannerResult;
  ctaLabel: string;
  onBack: () => void;
  onStartLive: () => void;
};

const reviewZones: GrillZoneType[] = ['direct', 'indirect', 'resting'];

export function ParrilladaReviewScreen({ plan, plannerResult, ctaLabel, onBack, onStartLive }: ParrilladaReviewScreenProps) {
  const timeline = buildParrilladaTimeline(plan);
  const criticalStep = getParrilladaCriticalStep(plan);

  const zoneStatus = reviewZones.map((zone) => ({
    zone,
    label: zone,
    activeCount: timeline.filter((step) => step.zone === zone).length,
  }));

  const criticalItem = criticalStep?.itemId ? plan.items.find((item) => item.id === criticalStep.itemId) : undefined;

  return (
    <section className="space-y-3">
      <ParrilladaHeroCard plan={plan} />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Critical Path</p>
        <h3 className="mt-1 text-base font-semibold text-white">Start first</h3>
        {criticalStep ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
            <BrandImageIcon
              src={
                criticalItem
                  ? getParrilladaItemIcon(criticalItem.cutId) ?? '/icons/ui/meat-selection.webp'
                  : getZoneIcon(criticalStep.zone ?? 'resting') ?? '/icons/ui/cooking-dashboard.webp'
              }
              alt=""
              size="md"
              shape="soft"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-white">{criticalStep.title}</p>
              <p className="text-xs text-white/55">
                {criticalStep.timeLabel}
                {criticalStep.zone ? ` · ${criticalStep.zone}` : ''}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <ParrilladaTimelineFinal result={plannerResult} />
      <GrillZoneStatusCard zones={zoneStatus} />
      <ParrilladaWarningsFinal result={plannerResult} />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm font-semibold text-white/80"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onStartLive}
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-3 text-sm font-bold text-black"
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
