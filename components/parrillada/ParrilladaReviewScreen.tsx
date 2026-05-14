'use client';

import { Button } from '@/components/ui/Button';
import { CompactDisclosure } from '@/components/ui/CompactDisclosure';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { plannerResultToReviewZoneStatus } from '@/components/parrillada/adapters/parrilladaPlannerViewAdapter';
import { ParrilladaHeroCard } from '@/components/parrillada/cards/ParrilladaHeroCard';
import { GrillZoneStatusCard } from '@/components/parrillada/cards/GrillZoneStatusCard';
import { ParrilladaTimelineFinal } from '@/components/parrillada/ParrilladaTimelineFinal';
import { ParrilladaWarningsFinal } from '@/components/parrillada/ParrilladaWarningsFinal';
import type { AppText, Lang } from '@/lib/i18n/texts';
import type { ParrilladaPlan, PlannerResult } from '@/lib/planning';

type ParrilladaReviewScreenProps = {
  lang: Lang;
  t: AppText;
  plan: ParrilladaPlan;
  plannerResult: PlannerResult;
  ctaLabel: string;
  onBack: () => void;
  onStartLive: () => void;
};

export function ParrilladaReviewScreen({ lang, t, plan, plannerResult, ctaLabel, onBack, onStartLive }: ParrilladaReviewScreenProps) {
  const zoneStatus = plannerResultToReviewZoneStatus(plannerResult);

  return (
    <section className="space-y-3">
      <ScreenHeader title={t.parrilladaReviewTitle} subtitle={t.parrilladaReviewSubtitle} />
      <ParrilladaHeroCard lang={lang} t={t} plan={plan} />

      <ParrilladaTimelineFinal lang={lang} t={t} result={plannerResult} />

      <CompactDisclosure
        label={t.parrilladaZoneStatus}
        summary={`${zoneStatus.length} ${zoneStatus.length === 1 ? t.parrilladaZonesConfiguredSingular : t.parrilladaZonesConfiguredPlural}`}
        showLabel={t.parrilladaShowDetail}
        hideLabel={t.parrilladaHideDetail}
      >
        <div className="mt-2">
          <GrillZoneStatusCard zones={zoneStatus} />
        </div>
      </CompactDisclosure>

      <CompactDisclosure
        label={t.parrilladaWarnings}
        summary={`${plan.warnings.length} ${plan.warnings.length === 1 ? t.parrilladaWarningSingular : t.parrilladaWarningPlural}`}
        showLabel={t.parrilladaShowDetail}
        hideLabel={t.parrilladaHideDetail}
      >
        <div className="mt-2">
          <ParrilladaWarningsFinal result={plannerResult} />
        </div>
      </CompactDisclosure>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onBack}>
          {t.parrilladaBack}
        </Button>
        <Button variant="primary" onClick={onStartLive}>
          {ctaLabel}
        </Button>
      </div>
    </section>
  );
}
