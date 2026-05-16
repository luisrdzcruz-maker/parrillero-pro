'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { Panel } from '@/components/ui/Panel';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getModeIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ParrilladaModeCard } from '@/components/parrillada/cards/ParrilladaModeCard';
import { ds } from '@/lib/design-system';
import type { AppText, Lang } from '@/lib/i18n/texts';
import type { ParrilladaMode } from '@/lib/planning';

type RecentPlan = {
  id: string;
  title: string;
  mode: ParrilladaMode;
  updatedLabel: string;
};

type ParrilladaEntryScreenProps = {
  lang: Lang;
  t: AppText;
  quickTitle: string;
  quickDescription: string;
  proTitle: string;
  proDescription: string;
  recentTitle: string;
  recentPlans: RecentPlan[];
  onSelectMode: (mode: ParrilladaMode) => void;
};

export function ParrilladaEntryScreen({
  t,
  quickTitle,
  quickDescription,
  proTitle,
  proDescription,
  recentTitle,
  recentPlans,
  onSelectMode,
}: ParrilladaEntryScreenProps) {
  return (
    <section className="space-y-3">
      <ScreenHeader
        eyebrow={t.parrilladaEntryEyebrow}
        title={t.parrilladaEntryTitle}
        subtitle={t.parrilladaEntrySubtitle}
      />

      <ParrilladaModeCard
        mode="lite"
        title={quickTitle}
        description={quickDescription}
        emphasized
        onClick={onSelectMode}
      />
      <ParrilladaModeCard mode="pro" title={proTitle} description={proDescription} onClick={onSelectMode} />

      <Panel as="section" className="p-4">
        <p className={`${ds.text.body11} uppercase tracking-[0.18em] ${ds.color.mutedClass.faint}`}>{recentTitle}</p>
        <div className="mt-3 space-y-2">
          {recentPlans.map((plan) => (
            <article key={plan.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <BrandImageIcon
                  src={getModeIcon(plan.mode) ?? '/icons/ui/cooking-dashboard.webp'}
                  alt=""
                  size="sm"
                  shape="plain"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-white">{plan.title}</p>
                  <p className={`text-xs ${ds.color.mutedClass.secondary}`}>{plan.updatedLabel}</p>
                </div>
              </div>
              <span className={`rounded-full border border-white/10 bg-black/25 px-2.5 py-1 ${ds.text.body11} font-semibold uppercase ${ds.color.mutedClass.base}`}>
                {plan.mode}
              </span>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}
