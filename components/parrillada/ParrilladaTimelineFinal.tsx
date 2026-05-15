'use client';

import { CompactDisclosure } from '@/components/ui/CompactDisclosure';
import { Panel } from '@/components/ui/Panel';
import type { AppText, Lang } from '@/lib/i18n/texts';
import type { ExecutionTimelineGroup, PlannerPhase, PlannerResult } from '../../lib/planning';
import { getShortGroupLabel } from './utils/parrilladaTimelineLabels';

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
  }
  return `${minutes}m`;
}

function zoneLabel(zone: PlannerPhase['zone']): string {
  return zone.replaceAll('_', ' ');
}

// Translation lookup keyed by stable PlannerPhase['type'] enum.
// lang stays out of lib/; the planner emits data, this file translates at render.
function phaseLabel(type: PlannerPhase['type'], t: AppText): string {
  switch (type) {
    case 'prep':
      return t.parrilladaPhasePrep;
    case 'preheat':
      return t.parrilladaPhasePreheat;
    case 'cook':
      return t.parrilladaPhaseCook;
    case 'sear':
      return t.parrilladaPhaseSear;
    case 'flip':
      return t.parrilladaPhaseFlip;
    case 'rest':
      return t.parrilladaPhaseRest;
    case 'hold':
      return t.parrilladaPhaseHold;
    case 'serve':
      return t.parrilladaServe;
    case 'check':
      return t.parrilladaPhaseCheck;
    case 'buffer':
      return t.parrilladaPhaseBuffer;
  }
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

function ensureFinalServeRow(phases: PlannerPhase[], result: PlannerResult, t: AppText): PlannerPhase[] {
  if (phases.some((phase) => phase.type === 'serve')) return phases;
  const serveTime = result.request.serveAtIso;
  return [
    ...phases,
    {
      id: 'global-serve-row',
      itemId: 'global',
      cutId: 'global',
      displayName: t.parrilladaServeAllItems,
      type: 'serve',
      zone: 'holding',
      startMinute: 0,
      endMinute: 1,
      startIso: serveTime,
      endIso: serveTime,
      durationMinutes: 1,
      isFlexible: false,
      notes: [t.parrilladaServeAllNote],
    },
  ];
}

function groupByStartTime(phases: PlannerPhase[]): Array<{ time: string; phases: PlannerPhase[] }> {
  const grouped = new Map<string, PlannerPhase[]>();
  phases.forEach((phase) => {
    const key = phase.startIso;
    grouped.set(key, [...(grouped.get(key) ?? []), phase]);
  });
  return [...grouped.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([time, groupedPhases]) => ({ time, phases: groupedPhases }));
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

  const phases = ensureFinalServeRow(result.phases, result, t);
  const groups = groupByStartTime(phases);
  const executionGroups = result.executionTimelineGroups ?? [];

  return (
    <Panel as="section" className="p-3 sm:p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{t.parrilladaTimelineTitle}</h2>
        {/* allow-arbitrary: text-white/55 — ds.color.muted exposes only 50/70/90 */}
        <div className="flex items-baseline gap-1.5 text-xs text-white/55">
          <span>{t.parrilladaServe}</span>
          <span className="text-sm font-semibold text-white tabular-nums">{formatTime(result.request.serveAtIso)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {executionGroups.length > 0 ? (
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            {/* allow-arbitrary: text-[11px] eyebrow + text-white/55 — ds.text scale lacks 11px; ds.color.muted exposes only 50/70/90 */}
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">{t.parrilladaTimelineActionsEyebrow}</p>
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
                  {/* allow-arbitrary: text-white/65 — ds.color.muted exposes only 50/70/90 */}
                  <div className="space-y-1 text-xs text-white/65">
                    <p>{formatActionMeta(group, t)}</p>
                    {itemQuantityLabel(group) ? (
                      <p className="text-orange-100/80">{itemQuantityLabel(group)}</p>
                    ) : null}
                    {/* allow-arbitrary: text-white/75 — ds.color.muted exposes only 50/70/90 */}
                    <p className="text-white/75">{compactExecutionInstruction(group)}</p>
                  </div>
                </CompactDisclosure>
              ))}
            </div>
          </article>
        ) : null}

        <CompactDisclosure
          label={t.parrilladaTimelineAllPhases}
          summary={`${groups.length} ${groups.length === 1 ? t.parrilladaTimelineTimeSlotsSingular : t.parrilladaTimelineTimeSlotsPlural}`}
          showLabel={t.parrilladaTimelineShowPhases}
          hideLabel={t.parrilladaTimelineHidePhases}
        >
          <div className="mt-2 space-y-2">
            {groups.map((group) => (
              /* allow-arbitrary: bg-white/[0.025] panel tint — ds.panel lacks this alpha */
              <article key={group.time} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-2">
                <div className="mb-1.5 flex items-center gap-2">
                  {/* allow-arbitrary: text-[12px] timestamp — ds.text scale lacks 12px */}
                  <span className="text-[12px] font-semibold tabular-nums text-orange-100/85">
                    {formatTime(group.time)}
                  </span>
                  {group.phases.length > 1 && (
                    /* allow-arbitrary: text-[11px] + text-white/45 — ds.text scale lacks 11px; ds.color.muted exposes only 50/70/90 */
                    <span className="text-[11px] text-white/45">{group.phases.length} {t.parrilladaParallelSuffix}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {group.phases.map((phase) => (
                    <div key={phase.id} className="rounded-lg border border-white/[0.06] bg-black/20 p-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* allow-arbitrary: text-[10px] phase chip — ds.text scale lacks 10px */}
                        <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-100">
                          {phaseLabel(phase.type, t)}
                        </span>
                        {/* allow-arbitrary: text-[13px] item name — ds.text scale lacks 13px */}
                        <span className="text-[13px] font-semibold text-white">{phase.displayName}</span>
                        {/* allow-arbitrary: text-[11px] + text-white/45 — ds.text scale lacks 11px; ds.color.muted exposes only 50/70/90 */}
                        <span className="text-[11px] text-white/45 tabular-nums">{formatDuration(phase.durationMinutes)}</span>
                      </div>
                      {/* allow-arbitrary: text-[11px] — ds.text scale lacks 11px (text-white/50 is canonical) */}
                      <p className="mt-0.5 text-[11px] text-white/50">
                        {zoneLabel(phase.zone)} · {t.parrilladaUntil} {formatTime(phase.endIso)}
                      </p>
                      {phase.notes && phase.notes.length > 0 ? (
                        /* allow-arbitrary: text-white/72 — ds.color.muted exposes only 50/70/90 */
                        <p className="mt-1 text-xs text-white/72">{phase.notes[0]}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </CompactDisclosure>
      </div>
    </Panel>
  );
}
