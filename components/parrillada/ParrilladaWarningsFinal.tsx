'use client';

import type { PlannerResult } from '../../lib/planning';

export function ParrilladaWarningsFinal({ result }: { result: PlannerResult }) {
  if (result.warnings.length === 0) {
    return (
      <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
        No major warnings. Validate real temperatures during cooking.
      </section>
    );
  }

  return (
    <section className="space-y-2">
      {result.warnings.map((warning) => (
        <article key={warning.id} className="rounded-2xl border border-orange-300/15 bg-orange-500/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-orange-50">{warning.title}</h3>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-wide text-white/60">
              {warning.severity}
            </span>
          </div>
          <p className="mt-1 text-sm text-orange-50/75">{warning.message}</p>
        </article>
      ))}
    </section>
  );
}
