'use client';

import type { PlannerPhase, PlannerResult } from '../../lib/planning';

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
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

export function ParrilladaTimelineFinal({ result }: { result: PlannerResult }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-orange-200/70">Live plan</p>
          <h2 className="text-xl font-semibold text-white">Parrillada timeline</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
          <p className="text-xs text-white/50">Confidence</p>
          <p className="text-sm font-semibold capitalize text-white">{result.summary.confidence}</p>
        </div>
      </div>

      <div className="space-y-3">
        {result.phases.map((phase) => (
          <article key={phase.id} className="grid grid-cols-[64px_1fr] gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm font-semibold text-orange-100">{formatTime(phase.startIso)}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-orange-500/15 px-2 py-1 text-xs font-medium text-orange-100">{phaseLabel(phase.type)}</span>
                <span className="text-sm font-semibold text-white">{phase.displayName}</span>
                <span className="text-xs text-white/45">{phase.durationMinutes} min</span>
              </div>
              <p className="mt-1 text-xs text-white/50">{phase.zone.replaceAll('_', ' ')} · until {formatTime(phase.endIso)}</p>
              {phase.notes?.map((note) => (
                <p key={note} className="mt-2 text-sm text-white/70">{note}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
