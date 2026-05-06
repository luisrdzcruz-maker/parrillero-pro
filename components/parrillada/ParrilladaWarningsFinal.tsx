'use client';

import type { PlannerResult } from '../../lib/planning';

const severityOrder = { critical: 0, warning: 1, info: 2 } as const;

function severityTone(severity: 'critical' | 'warning' | 'info'): string {
  if (severity === 'critical') return 'border-red-300/30 bg-red-500/10 text-red-50';
  if (severity === 'warning') return 'border-amber-300/25 bg-amber-500/10 text-amber-50';
  return 'border-sky-300/20 bg-sky-500/10 text-sky-50';
}

function severityLabel(severity: 'critical' | 'warning' | 'info'): string {
  if (severity === 'critical') return 'Critical';
  if (severity === 'warning') return 'Warning';
  return 'Info';
}

function toFriendlyMessage(message: string): string {
  return message
    .replace('STARTS_IN_PAST', 'Plan starts before now')
    .replace('ZONE_CONFLICT', 'Grill zone overlap detected')
    .replace('HOLD_TOO_LONG', 'Holding time may hurt quality')
    .trim();
}

export function ParrilladaWarningsFinal({ result }: { result: PlannerResult | null }) {
  if (!result) return null;

  const prioritized = [...result.warnings].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  if (prioritized.length === 0) {
    return (
      <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-100">
        No critical issues. Keep checking real temperatures during execution.
      </section>
    );
  }

  return (
    <section className="space-y-2">
      {prioritized.map((warning) => (
        <article key={warning.id} className={`rounded-2xl border px-3 py-2.5 ${severityTone(warning.severity)}`}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold">{warning.title}</h3>
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/80">
              {severityLabel(warning.severity)}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/80">{toFriendlyMessage(warning.message)}</p>
        </article>
      ))}
    </section>
  );
}
