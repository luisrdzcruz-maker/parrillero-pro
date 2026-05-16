'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getLiveActionIcon, getZoneIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ds } from '@/lib/design-system';
import type { ParrilladaLiveAction } from '@/lib/planning';

type LiveCommandCardProps = {
  action: ParrilladaLiveAction;
  ctaLabel: string;
  onMarkDone: () => void;
};

export function LiveCommandCard({ action, ctaLabel, onMarkDone }: LiveCommandCardProps) {
  const iconSrc = getLiveActionIcon(action.actionType ?? 'move');
  const zoneIcon = action.zone ? getZoneIcon(action.zone) : undefined;

  return (
    /* allow-arbitrary: shadow-[0_20px_45px_...] ember-glow command-card chassis — no canonical ds.shadow.* tier */
    <section className="rounded-3xl border border-orange-300/30 bg-gradient-to-br from-orange-500/22 to-white/[0.06] p-4 shadow-[0_20px_45px_rgba(249,115,22,0.2)]">
      <p className={`${ds.text.body11} uppercase tracking-[0.18em] ${ds.color.mutedClass.faint}`}>{action.statusLabel}</p>
      <div className="mt-2 flex items-start gap-3">
        <BrandImageIcon src={iconSrc ?? '/icons/live/turn-food.webp'} alt="" size="md" shape="soft" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold text-white">{action.instruction}</h3>
          <p className={`mt-1 text-sm ${ds.color.mutedClass.base}`}>
            {action.zone ? `${action.zone} zone` : 'coordination'}
            {action.durationLabel ? ` · ${action.durationLabel}` : ''}
          </p>
        </div>
      </div>

      {zoneIcon ? (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-2.5 py-1">
          <BrandImageIcon src={zoneIcon} alt="" size="sm" shape="plain" aria-hidden="true" />
          <span className={`text-xs font-semibold ${ds.color.mutedClass.body}`}>Zone ready</span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onMarkDone}
        className="mt-3 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-black transition hover:brightness-105 active:scale-[0.99]"
      >
        {ctaLabel}
      </button>
    </section>
  );
}
