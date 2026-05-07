'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getWarningIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import type { ParrilladaWarning } from '@/lib/planning';

type ParrilladaWarningsCardProps = {
  warnings: ParrilladaWarning[];
};

function severityClasses(severity: ParrilladaWarning['severity']) {
  if (severity === 'critical') return 'border-red-300/30 bg-red-500/10 text-red-100';
  if (severity === 'warning') return 'border-orange-300/30 bg-orange-500/12 text-orange-100';
  if (severity === 'watch') return 'border-amber-300/30 bg-amber-500/10 text-amber-100';
  return 'border-blue-300/30 bg-blue-500/10 text-blue-100';
}

export function ParrilladaWarningsCard({ warnings }: ParrilladaWarningsCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Warnings</p>
      <h3 className="mt-1 text-base font-semibold text-white">Actionable checks</h3>

      <div className="mt-3 space-y-2">
        {warnings.map((warning) => (
          <article
            key={warning.id}
            className={`rounded-2xl border px-3 py-2.5 ${severityClasses(warning.severity)}`}
          >
            <div className="flex items-start gap-2">
              <BrandImageIcon
                src={getWarningIcon(warning.severity) ?? '/icons/warnings/flare-up-risk.webp'}
                alt=""
                size="sm"
                shape="plain"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">{warning.title}</p>
                <p className="mt-0.5 text-xs opacity-90">{warning.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
