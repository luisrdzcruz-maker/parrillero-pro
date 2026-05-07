'use client';

import type { ExecutionTimelineGroup, PlannerPhase, PlannerResult } from '../../lib/planning';

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

function compactInstruction(phase: PlannerPhase): string {
  return phase.notes?.[0] ?? 'Follow this phase as scheduled.';
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
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-xl sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-orange-200/70">Execution</p>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Timeline</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-2.5 py-2 text-right">
          <p className="text-[11px] text-white/50">Serve</p>
          <p className="text-sm font-semibold text-white">{formatTime(result.request.serveAtIso)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {executionGroups.length > 0 && (
          <article className="rounded-2xl border border-orange-300/20 bg-orange-500/10 p-2.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-100/80">
              Grouped execution actions
            </p>
            <div className="space-y-2">
              {executionGroups.map((group) => (
                <div key={group.id} className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-medium text-orange-100">
                      {formatTime(group.startIso)}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/70">
                      {group.groupType.replaceAll('_', ' ')}
                    </span>
                    <span className="text-sm font-semibold text-white">{group.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/55">
                    {executionZoneLabel(group)} · {executionHeatLabel(group)} · until {formatTime(group.endIso)}
                  </p>
                  {itemQuantityLabel(group) && (
                    <p className="mt-1 text-xs text-orange-100/85">{itemQuantityLabel(group)}</p>
                  )}
                  <p className="mt-1.5 text-sm text-white/80">{compactExecutionInstruction(group)}</p>
                </div>
              ))}
            </div>
          </article>
        )}

        {groups.map((group) => (
          <article key={group.time} className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-orange-500/15 px-2 py-1 text-xs font-semibold text-orange-100">
                {formatTime(group.time)}
              </span>
              {group.phases.length > 1 && (
                <span className="text-[11px] text-white/50">{group.phases.length} parallel actions</span>
              )}
            </div>
            <div className="space-y-2">
              {group.phases.map((phase) => (
                <div key={phase.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-medium text-orange-100">
                      {phaseLabel(phase.type)}
                    </span>
                    <span className="text-sm font-semibold text-white">{phase.displayName}</span>
                    <span className="text-xs text-white/50">{formatDuration(phase.durationMinutes)}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/55">
                    {zoneLabel(phase.zone)} · until {formatTime(phase.endIso)}
                  </p>
                  <p className="mt-1.5 text-sm text-white/80">{compactInstruction(phase)}</p>
                  {phase.notes && phase.notes.length > 1 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-white/55">More details</summary>
                      <ul className="mt-1 space-y-1 text-xs text-white/70">
                        {phase.notes.slice(1).map((note) => (
                          <li key={note}>- {note}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
