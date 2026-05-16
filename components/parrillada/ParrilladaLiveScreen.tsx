'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { LiveCommandCard } from '@/components/parrillada/cards/LiveCommandCard';
import { GrillZoneStatusCard } from '@/components/parrillada/cards/GrillZoneStatusCard';
import { getParrilladaItemIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ds } from '@/lib/design-system';
import type { ParrilladaLivePlan } from '@/lib/planning';

type ParrilladaLiveScreenProps = {
  title: string;
  markDoneLabel: string;
  adjustPlanLabel: string;
  livePlan: ParrilladaLivePlan;
  onMarkDone: () => void;
};

export function ParrilladaLiveScreen({
  title,
  markDoneLabel,
  adjustPlanLabel,
  livePlan,
  onMarkDone,
}: ParrilladaLiveScreenProps) {
  const currentAction = { ...livePlan.currentAction, statusLabel: 'Now' };

  return (
    <section className="space-y-3">
      {/* allow-arbitrary: bg-white/[0.04] — rounded-3xl card (not subpanel chassis pattern), no canonical token */}
      <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className={`${ds.text.body11} uppercase tracking-[0.18em] text-orange-200/70`}>Live</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
        <p className={`mt-1 text-sm ${ds.color.mutedClass.secondary}`}>Focus on the next action. Keep execution calm and precise.</p>
        <p className="mt-1 text-xs text-white/50">Preview projection from grouped planner timeline (read-only foundation).</p>
      </header>

      <LiveCommandCard action={currentAction} ctaLabel={markDoneLabel} onMarkDone={onMarkDone} />

      {livePlan.upNextAction ? (
        /* allow-arbitrary: bg-white/[0.04] — rounded-3xl card (not subpanel chassis pattern), no canonical token */
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className={`${ds.text.body11} uppercase tracking-[0.18em] ${ds.color.mutedClass.faint}`}>Up Next</p>
          <p className="mt-1 text-sm font-semibold text-white">{livePlan.upNextAction.instruction}</p>
          <p className={`mt-1 text-xs ${ds.color.mutedClass.secondary}`}>
            {livePlan.upNextAction.zone ? `${livePlan.upNextAction.zone} zone` : 'coordination'}
            {livePlan.upNextAction.durationLabel ? ` · ${livePlan.upNextAction.durationLabel}` : ''}
          </p>
        </section>
      ) : null}

      <GrillZoneStatusCard zones={livePlan.zoneStatus} />

      {/* allow-arbitrary: bg-white/[0.04] — rounded-3xl card (not subpanel chassis pattern), no canonical token */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className={`${ds.text.body11} uppercase tracking-[0.18em] ${ds.color.mutedClass.faint}`}>Active Items</p>
        <div className="mt-3 space-y-2">
          {livePlan.activeItems.map((item) => (
            <article key={item.itemId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
              <BrandImageIcon
                src={getParrilladaItemIcon(item.cutId) ?? '/icons/ui/meat-selection.webp'}
                alt=""
                size="sm"
                shape="plain"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{item.displayName}</p>
                <p className={`text-xs ${ds.color.mutedClass.secondary}`}>{item.phase}</p>
              </div>
              <span className={`rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-semibold ${ds.color.mutedClass.body}`}>
                {item.timeRemainingLabel}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* allow-arbitrary: bg-white/[0.02] — dashed-border placeholder card, no canonical token */}
      <section className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3">
        <p className={`text-sm font-semibold ${ds.color.mutedClass.body}`}>{adjustPlanLabel}</p>
        <p className={`mt-1 text-xs ${ds.color.mutedClass.secondary}`}>Reserved for future Pro optimizer adjustments.</p>
      </section>
    </section>
  );
}
