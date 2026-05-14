'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { Panel } from '@/components/ui/Panel';
import { getModeIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ParrilladaModeCard } from '@/components/parrillada/cards/ParrilladaModeCard';
import type { ParrilladaMode } from '@/lib/planning';

type RecentPlan = {
  id: string;
  title: string;
  mode: ParrilladaMode;
  updatedLabel: string;
};

type ParrilladaEntryScreenProps = {
  quickTitle: string;
  quickDescription: string;
  proTitle: string;
  proDescription: string;
  recentTitle: string;
  recentPlans: RecentPlan[];
  onSelectMode: (mode: ParrilladaMode) => void;
};

export function ParrilladaEntryScreen({
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
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-black/25 p-4">
        {/* allow-arbitrary: pre-slice-a */}
        <p className="text-[11px] uppercase tracking-[0.18em] text-orange-200/70">Parrillada</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Start simple. Reveal power when needed.</h1>
        {/* allow-arbitrary: pre-slice-a */}
        <p className="mt-1 text-sm text-white/65">Build menu, validate timeline, then execute with a calm command-center flow.</p>
      </header>

      <ParrilladaModeCard
        mode="lite"
        title={quickTitle}
        description={quickDescription}
        emphasized
        onClick={onSelectMode}
      />
      <ParrilladaModeCard mode="pro" title={proTitle} description={proDescription} onClick={onSelectMode} />

      <Panel as="section" className="p-4">
        {/* allow-arbitrary: pre-slice-a */}
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{recentTitle}</p>
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
                  {/* allow-arbitrary: pre-slice-a */}
                  <p className="text-xs text-white/55">{plan.updatedLabel}</p>
                </div>
              </div>
              {/* allow-arbitrary: pre-slice-a */}
              <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-semibold uppercase text-white/70">
                {plan.mode}
              </span>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}
