'use client';

import type { ParrilladaPlan } from '@/lib/planning';

type ParrilladaHeroCardProps = {
  plan: ParrilladaPlan;
  keyExecutionHint?: string;
};

export function ParrilladaHeroCard({ plan, keyExecutionHint }: ParrilladaHeroCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-orange-500/[0.07] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-orange-200/75">Parrillada</p>
      <h2 className="mt-1 text-xl font-semibold text-white">Your Parrillada Plan</h2>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Metric label="Items" value={`${plan.items.length}`} />
        <Metric label="Serve target" value={plan.serveTargetLabel} />
        <Metric label="Complexity" value={plan.complexity} />
        <Metric label="Warnings" value={`${plan.warnings.length}`} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex rounded-full border border-orange-300/30 bg-orange-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-orange-100">
          {plan.mode} variant
        </span>
        {keyExecutionHint ? (
          <span className="inline-flex rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/85">
            {keyExecutionHint}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 px-2.5 py-2">
      <p className="text-[11px] uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </article>
  );
}
