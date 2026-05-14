'use client';

import { Panel } from '@/components/ui/Panel';
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

function phaseLabel(type: PlannerPhase['type']): string {
  const map: Record<PlannerPhase['type'], string> = {
    prep: 'Prep',
    preheat: 'Preheat',
    cook: 'Cook',
    sear: 'Sear',
    flip: 'Flip',
    rest: 'Rest',
    hold: 'Hold',
    serve: 'Serve',
    check: 'Check',
    buffer: 'Buffer',
  };
  return map[type];
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

function formatActionMeta(group: ExecutionTimelineGroup): string {
  return `${executionZoneLabel(group)} · ${executionHeatLabel(group)} · until ${formatTime(group.endIso)}`;
}

function ensureFinalServeRow(phases: PlannerPhase[], result: PlannerResult): PlannerPhase[] {
  if (phases.some((phase) => phase.type === 'serve')) return phases;
  const serveTime = result.request.serveAtIso;
  return [
    ...phases,
    {
      id: 'global-serve-row',
      itemId: 'global',
      cutId: 'global',
      displayName: 'Serve all items',
      type: 'serve',
      zone: 'holding',
      startMinute: 0,
      endMinute: 1,
      startIso: serveTime,
      endIso: serveTime,
      durationMinutes: 1,
      isFlexible: false,
      notes: ['Plate and serve the full parrillada.'],
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

export function ParrilladaTimelineFinal({ result }: { result: PlannerResult | null }) {
  if (!result) return null;

  const phases = ensureFinalServeRow(result.phases, result);
  const groups = groupByStartTime(phases);
  const executionGroups = result.executionTimelineGroups ?? [];

  return (
    <Panel as="section" className="p-3 sm:p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Timeline</h2>
        {/* allow-arbitrary: pre-slice-a */}
        <div className="flex items-baseline gap-1.5 text-xs text-white/55">
          <span>Serve</span>
          <span className="text-sm font-semibold text-white tabular-nums">{formatTime(result.request.serveAtIso)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {executionGroups.length > 0 ? (
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            {/* allow-arbitrary: pre-slice-a */}
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Actions</p>
            <div className="space-y-1.5">
              {executionGroups.map((group) => (
                <details
                  key={group.id}
                  className="group rounded-xl border border-white/[0.08] bg-black/25 transition open:border-orange-300/25 open:bg-orange-500/[0.06]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-2.5 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {/* allow-arbitrary: pre-slice-a */}
                      <span className="shrink-0 text-[12px] font-semibold tabular-nums text-orange-100/85">
                        {formatTime(group.startIso)}
                      </span>
                      <span className="truncate text-sm font-semibold text-white">{getShortGroupLabel(group)}</span>
                    </div>
                    <span
                      aria-hidden="true"
                      /* allow-arbitrary: pre-slice-a */
                      className="shrink-0 text-base font-black text-white/30 transition-transform duration-200 group-open:rotate-90 group-open:text-orange-200/75"
                    >
                      ›
                    </span>
                  </summary>
                  {/* allow-arbitrary: pre-slice-a */}
                  <div className="space-y-1 border-t border-white/[0.06] px-2.5 pb-2 pt-1.5 text-xs text-white/65">
                    <p>{formatActionMeta(group)}</p>
                    {itemQuantityLabel(group) ? (
                      <p className="text-orange-100/80">{itemQuantityLabel(group)}</p>
                    ) : null}
                    {/* allow-arbitrary: pre-slice-a */}
                    <p className="text-white/75">{compactExecutionInstruction(group)}</p>
                  </div>
                </details>
              ))}
            </div>
          </article>
        ) : null}

        <details className="group rounded-2xl border border-white/10 bg-black/20 transition open:bg-black/30">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-2.5 py-2">
            {/* allow-arbitrary: pre-slice-a */}
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">All phases</span>
            <span
              aria-hidden="true"
              /* allow-arbitrary: pre-slice-a */
              className="text-base font-black text-white/30 transition-transform duration-200 group-open:rotate-90 group-open:text-orange-200/70"
            >
              ›
            </span>
          </summary>
          <div className="space-y-2 border-t border-white/[0.06] px-2.5 pb-2 pt-2">
            {groups.map((group) => (
              /* allow-arbitrary: pre-slice-a */
              <article key={group.time} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-2">
                <div className="mb-1.5 flex items-center gap-2">
                  {/* allow-arbitrary: pre-slice-a */}
                  <span className="text-[12px] font-semibold tabular-nums text-orange-100/85">
                    {formatTime(group.time)}
                  </span>
                  {group.phases.length > 1 && (
                    /* allow-arbitrary: pre-slice-a */
                    <span className="text-[11px] text-white/45">{group.phases.length} parallel</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {group.phases.map((phase) => (
                    <div key={phase.id} className="rounded-lg border border-white/[0.06] bg-black/20 p-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* allow-arbitrary: pre-slice-a */}
                        <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-100">
                          {phaseLabel(phase.type)}
                        </span>
                        {/* allow-arbitrary: pre-slice-a */}
                        <span className="text-[13px] font-semibold text-white">{phase.displayName}</span>
                        {/* allow-arbitrary: pre-slice-a */}
                        <span className="text-[11px] text-white/45 tabular-nums">{formatDuration(phase.durationMinutes)}</span>
                      </div>
                      {/* allow-arbitrary: pre-slice-a */}
                      <p className="mt-0.5 text-[11px] text-white/50">
                        {zoneLabel(phase.zone)} · until {formatTime(phase.endIso)}
                      </p>
                      {phase.notes && phase.notes.length > 0 ? (
                        /* allow-arbitrary: pre-slice-a */
                        <p className="mt-1 text-xs text-white/72">{phase.notes[0]}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </details>
      </div>
    </Panel>
  );
}
