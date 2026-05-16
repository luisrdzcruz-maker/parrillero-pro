'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getParrilladaItemIcon, getZoneIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ds } from '@/lib/design-system';
import type { ParrilladaPlan, ParrilladaTimelineStep } from '@/lib/planning';

// Legacy compatibility card. Production Review UI uses ParrilladaTimelineFinal.

type ParrilladaTimelineCardProps = {
  plan: ParrilladaPlan;
  timeline: ParrilladaTimelineStep[];
};

export function ParrilladaTimelineCard({ plan, timeline }: ParrilladaTimelineCardProps) {
  return (
    /* allow-arbitrary: bg-white/[0.04] — rounded-3xl card (not subpanel chassis pattern), no canonical token */
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className={`${ds.text.body11} uppercase tracking-[0.18em] ${ds.color.mutedClass.faint}`}>Timeline</p>
      <h3 className="mt-1 text-base font-semibold text-white">Execution order</h3>

      <div className="mt-3 space-y-3">
        {timeline.map((step) => {
          const item = step.itemId ? plan.items.find((candidate) => candidate.id === step.itemId) : undefined;
          const iconSrc = item ? getParrilladaItemIcon(item.cutId) : getZoneIcon(step.zone ?? 'resting');

          return (
            <article key={step.id} className="flex items-start gap-3">
              <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30">
                <BrandImageIcon src={iconSrc ?? '/icons/ui/cooking-dashboard.webp'} alt="" size="sm" shape="plain" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                <p className="text-xs font-semibold text-orange-100">{step.timeLabel}</p>
                <p className="mt-0.5 text-sm font-medium text-white">{step.title}</p>
                <p className={`mt-1 text-xs ${ds.color.mutedClass.secondary}`}>
                  {step.zone ? `${step.zone} zone` : 'coordination'}
                  {step.durationMinutes ? ` · ${step.durationMinutes} min` : ''}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
