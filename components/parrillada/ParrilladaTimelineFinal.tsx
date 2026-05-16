'use client';

import { CompactDisclosure } from '@/components/ui/CompactDisclosure';
import { Panel } from '@/components/ui/Panel';
import { ds } from '@/lib/design-system';
import type { AppText, Lang } from '@/lib/i18n/texts';
import type { ExecutionTimelineGroup, PlannerResult } from '../../lib/planning';
import { getShortGroupLabel } from './utils/parrilladaTimelineLabels';

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function zoneLabel(zone: ExecutionTimelineGroup['zone']): string {
  return zone.replaceAll('_', ' ');
}

function compactExecutionInstruction(group: ExecutionTimelineGroup): string {
  if (group.safetyNotes.length > 0) return `${group.instruction} ${group.safetyNotes[0]}`;
  return group.instruction;
}

function executionZoneLabel(group: ExecutionTimelineGroup): string {
  if (group.zone === 'mixed') return 'mixed zones';
  return zoneLabel(group.zone);
}

function executionHeatLabel(group: ExecutionTimelineGroup): string {
  return group.heat === 'mixed' ? 'mixed heat' : `${group.heat} heat`;
}

function itemQuantityLabel(group: ExecutionTimelineGroup): string | null {
  if (group.items.length === 0) return null;
  return group.items
    .map((item) => {
      const qty = item.quantity > 1 ? `x${item.quantity}` : null;
      return qty ? `${item.displayName} ${qty}` : item.displayName;
    })
    .join(' + ');
}

function formatActionMeta(group: ExecutionTimelineGroup, t: AppText): string {
  // executionZoneLabel / executionHeatLabel still emit data-derived English
  // (e.g., 'high heat', 'holding'); deeper i18n belongs alongside planner
  // surface-fallback work, not Slice B.
  return `${executionZoneLabel(group)} · ${executionHeatLabel(group)} · ${t.parrilladaUntil} ${formatTime(group.endIso)}`;
}

export function ParrilladaTimelineFinal({
  t,
  result,
}: {
  lang: Lang;
  t: AppText;
  result: PlannerResult | null;
}) {
  if (!result) return null;

  const executionGroups = result.executionTimelineGroups ?? [];

  return (
    <Panel as="section" className="p-3 sm:p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{t.parrilladaTimelineTitle}</h2>
        <div className={`flex items-baseline gap-1.5 text-xs ${ds.color.mutedClass.secondary}`}>
          <span>{t.parrilladaServe}</span>
          <span className="text-sm font-semibold text-white tabular-nums">{formatTime(result.request.serveAtIso)}</span>
        </div>
      </div>

      {executionGroups.length > 0 ? (
        <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
          <p className={`mb-2 ${ds.text.body11} font-semibold uppercase tracking-[0.16em] ${ds.color.mutedClass.secondary}`}>{t.parrilladaTimelineActionsEyebrow}</p>
          <div className="space-y-1.5">
            {executionGroups.map((group) => (
              <CompactDisclosure
                key={group.id}
                compact
                label={formatTime(group.startIso)}
                summary={getShortGroupLabel(group)}
                showLabel={t.parrilladaShowDetail}
                hideLabel={t.parrilladaHideDetail}
              >
                <div className={`space-y-1 text-xs ${ds.color.mutedClass.secondary}`}>
                  <p>{formatActionMeta(group, t)}</p>
                  {itemQuantityLabel(group) ? (
                    <p className={ds.color.mutedClass.body}>{itemQuantityLabel(group)}</p>
                  ) : null}
                  <p className={ds.color.mutedClass.body}>{compactExecutionInstruction(group)}</p>
                </div>
              </CompactDisclosure>
            ))}
          </div>
        </article>
      ) : null}
    </Panel>
  );
}
