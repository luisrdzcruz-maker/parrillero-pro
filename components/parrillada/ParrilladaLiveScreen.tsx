'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { LiveCommandCard } from '@/components/parrillada/cards/LiveCommandCard';
import { GrillZoneStatusCard } from '@/components/parrillada/cards/GrillZoneStatusCard';
import { getParrilladaItemIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
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
      <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-orange-200/70">Live</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/65">Focus on the next action. Keep execution calm and precise.</p>
        <p className="mt-1 text-xs text-white/50">Preview projection from grouped planner timeline (read-only foundation).</p>
      </header>

      <LiveCommandCard action={currentAction} ctaLabel={markDoneLabel} onMarkDone={onMarkDone} />

      {livePlan.upNextAction ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Up Next</p>
          <p className="mt-1 text-sm font-semibold text-white">{livePlan.upNextAction.instruction}</p>
          <p className="mt-1 text-xs text-white/55">
            {livePlan.upNextAction.zone ? `${livePlan.upNextAction.zone} zone` : 'coordination'}
            {livePlan.upNextAction.durationLabel ? ` · ${livePlan.upNextAction.durationLabel}` : ''}
          </p>
        </section>
      ) : null}

      <GrillZoneStatusCard zones={livePlan.zoneStatus} />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Active Items</p>
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
                <p className="text-xs text-white/55">{item.phase}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-semibold text-white/75">
                {item.timeRemainingLabel}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3">
        <p className="text-sm font-semibold text-white/80">{adjustPlanLabel}</p>
        <p className="mt-1 text-xs text-white/55">Reserved for future Pro optimizer adjustments.</p>
      </section>
    </section>
  );
}
