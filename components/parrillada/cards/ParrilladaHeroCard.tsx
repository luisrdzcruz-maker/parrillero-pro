'use client';

import { Badge } from '@/components/ui/Badge';
import type { ParrilladaPlan } from '@/lib/planning';

type ParrilladaHeroCardProps = {
  plan: ParrilladaPlan;
  keyExecutionHint?: string;
};

type MetricTone = 'default' | 'amber';

export function ParrilladaHeroCard({ plan, keyExecutionHint }: ParrilladaHeroCardProps) {
  const isPro = plan.mode === 'pro';
  const warningsCount = plan.warnings.length;
  const holdsCount = plan.items.filter((item) => item.canHoldWarm === true).length;
  const zonesCount = countUniqueZones(plan);

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-orange-500/[0.07] p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-white">Parrillada Plan</h2>
        {/* allow-arbitrary: pre-slice-a */}
        <span className="shrink-0 rounded-full border border-orange-300/35 bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em] text-orange-100">
          {isPro ? 'Pro' : 'Lite'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1">
        <Metric label="Items" value={`${plan.items.length}`} />
        <Metric label="Serve" value={plan.serveTargetLabel} />
        <Metric label="Complexity" value={plan.complexity} />
        <Metric
          label="Warnings"
          value={`${warningsCount}`}
          tone={warningsCount > 0 ? 'amber' : 'default'}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {keyExecutionHint ? (
          <Badge tone="accent">{keyExecutionHint}</Badge>
        ) : null}
        {isPro && zonesCount > 0 ? <Badge tone="glass">{zonesCount} zones</Badge> : null}
        {isPro && holdsCount > 0 ? <Badge tone="glass">{holdsCount} holds</Badge> : null}
      </div>
    </section>
  );
}

function countUniqueZones(plan: ParrilladaPlan): number {
  const zones = new Set<string>();
  plan.items.forEach((item) => {
    item.zonePreference?.forEach((zone) => zones.add(zone));
  });
  return zones.size;
}

// TODO(slice-d): Replace local Metric with <MetricTile> once neutral
// and amber tones are added to the shared primitive. Current local
// implementation has 4 callers: 3 use the default (neutral) tone, 1
// uses amber for warnings >0. See Slice B prompt for context.
function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: MetricTone }) {
  const className =
    tone === 'amber'
      ? 'min-w-0 rounded-xl border border-amber-300/30 bg-amber-500/10 px-1.5 py-1.5'
      : 'min-w-0 rounded-xl border border-white/10 bg-black/20 px-1.5 py-1.5';
  /* allow-arbitrary: pre-slice-a */
  const labelClass = tone === 'amber' ? 'truncate text-[9px] uppercase tracking-wide text-amber-200/85' : 'truncate text-[9px] uppercase tracking-wide text-white/50';
  /* allow-arbitrary: pre-slice-a */
  const valueClass = tone === 'amber' ? 'mt-0.5 truncate text-[13px] font-semibold text-amber-100' : 'mt-0.5 truncate text-[13px] font-semibold text-white';

  return (
    <article className={className}>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value}</p>
    </article>
  );
}
