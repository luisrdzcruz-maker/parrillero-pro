'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { CompactDisclosure } from '@/components/ui/CompactDisclosure';
import { Panel } from '@/components/ui/Panel';
import {
  plannerResultToCriticalStep,
  plannerResultToReviewZoneStatus,
} from '@/components/parrillada/adapters/parrilladaPlannerViewAdapter';
import { ParrilladaHeroCard } from '@/components/parrillada/cards/ParrilladaHeroCard';
import { GrillZoneStatusCard } from '@/components/parrillada/cards/GrillZoneStatusCard';
import { getParrilladaItemIcon, getZoneIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ParrilladaTimelineFinal } from '@/components/parrillada/ParrilladaTimelineFinal';
import { ParrilladaWarningsFinal } from '@/components/parrillada/ParrilladaWarningsFinal';
import type { ParrilladaPlan, PlannerResult } from '@/lib/planning';

type ParrilladaReviewScreenProps = {
  plan: ParrilladaPlan;
  plannerResult: PlannerResult;
  ctaLabel: string;
  onBack: () => void;
  onStartLive: () => void;
};

export function ParrilladaReviewScreen({ plan, plannerResult, ctaLabel, onBack, onStartLive }: ParrilladaReviewScreenProps) {
  const criticalStep = plannerResultToCriticalStep(plannerResult);
  const zoneStatus = plannerResultToReviewZoneStatus(plannerResult);

  const criticalItem = criticalStep?.itemId ? plan.items.find((item) => item.id === criticalStep.itemId) : undefined;
  const keyExecutionHint = criticalItem
    ? `First · ${criticalItem.displayName}`
    : criticalStep
      ? `First · ${criticalStep.title}`
      : undefined;

  return (
    <section className="space-y-3">
      <ParrilladaHeroCard plan={plan} keyExecutionHint={keyExecutionHint} />

      <Panel as="section" className="p-4">
        {/* allow-arbitrary: pre-slice-a */}
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Main sequence</p>
        {criticalStep ? (
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
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
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{criticalStep.title}</p>
              {/* allow-arbitrary: pre-slice-a */}
              <p className="text-xs text-white/55">
                {criticalStep.timeLabel}
                {criticalStep.zone ? ` · ${criticalStep.zone}` : ''}
              </p>
            </div>
          </div>
        ) : null}
      </Panel>

      <ParrilladaTimelineFinal result={plannerResult} />

      <CompactDisclosure
        label="Zone status"
        summary={`${zoneStatus.length} ${zoneStatus.length === 1 ? 'zone' : 'zones'} configured`}
        showLabel="Show detail"
        hideLabel="Hide detail"
      >
        <div className="mt-2">
          <GrillZoneStatusCard zones={zoneStatus} />
        </div>
      </CompactDisclosure>

      <CompactDisclosure
        label="Warnings"
        summary={`${plan.warnings.length} ${plan.warnings.length === 1 ? 'warning' : 'warnings'}`}
        showLabel="Show detail"
        hideLabel="Hide detail"
      >
        <div className="mt-2">
          <ParrilladaWarningsFinal result={plannerResult} />
        </div>
      </CompactDisclosure>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onBack}
          /* allow-arbitrary: pre-slice-a */
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
