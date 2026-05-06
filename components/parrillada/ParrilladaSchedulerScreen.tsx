'use client';

import { useMemo, useState } from 'react';
import { NAPOLEON_ROGUE_525_LITE } from '../../lib/planning/fixtures/demoGrills';
import { DEMO_PARRILLADA_ITEMS } from '../../lib/planning/fixtures/demoItems';
import { scheduleParrillada, type PlannerCutInput, type SchedulerStrategy } from '../../lib/planning';
import { ParrilladaTimelineFinal } from './ParrilladaTimelineFinal';
import { ParrilladaWarningsFinal } from './ParrilladaWarningsFinal';

function localDateTimeToIso(value: string): string {
  return new Date(value).toISOString();
}

function defaultServeAtLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 3, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function ParrilladaSchedulerScreen() {
  const [selectedItems, setSelectedItems] = useState<PlannerCutInput[]>(DEMO_PARRILLADA_ITEMS.slice(0, 4));
  const [serveAtLocal, setServeAtLocal] = useState(defaultServeAtLocal());
  const [strategy, setStrategy] = useState<SchedulerStrategy>('balanced');

  const result = useMemo(
    () =>
      scheduleParrillada({
        items: selectedItems,
        serveAtIso: localDateTimeToIso(serveAtLocal),
        grillCapacity: NAPOLEON_ROGUE_525_LITE,
        strategy,
        allowHolding: true,
        nowIso: new Date().toISOString(),
        maxPlanLookbackMinutes: 480,
      }),
    [selectedItems, serveAtLocal, strategy],
  );

  function toggleItem(item: PlannerCutInput) {
    setSelectedItems((current) => {
      if (current.some((entry) => entry.id === item.id)) return current.filter((entry) => entry.id !== item.id);
      if (current.length >= 6) return current;
      return [...current, item];
    });
  }

  return (
    <main className="min-h-screen bg-[#070707] px-4 py-5 text-white">
      <section className="mx-auto max-w-3xl space-y-5">
        <header className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-orange-500/[0.08] p-5 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-orange-200/70">Parrillero Pro</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Parrillada Scheduler</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
            Multi-cut timing plan with grill-zone capacity, rest, hold, serve windows, and warnings.
          </p>
        </header>

        <section className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/75">Serve time</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-orange-300/60"
              type="datetime-local"
              value={serveAtLocal}
              onChange={(event) => setServeAtLocal(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-white/75">Strategy</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-orange-300/60"
              value={strategy}
              onChange={(event) => setStrategy(event.target.value as SchedulerStrategy)}
            >
              <option value="balanced">Balanced</option>
              <option value="serve_together">Serve together</option>
              <option value="quality_first">Quality first</option>
              <option value="low_stress">Low stress</option>
            </select>
          </label>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Menu items</h2>
            <p className="text-xs text-white/50">{selectedItems.length}/6 selected</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {DEMO_PARRILLADA_ITEMS.map((item) => {
              const active = selectedItems.some((entry) => entry.id === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    active ? 'border-orange-300/60 bg-orange-500/15' : 'border-white/10 bg-black/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <p className="font-semibold text-white">{item.displayName}</p>
                  <p className="text-xs capitalize text-white/50">{item.animal} · {item.weightGrams ?? '?'} g</p>
                </button>
              );
            })}
          </div>
        </section>

        <ParrilladaWarningsFinal result={result} />
        <ParrilladaTimelineFinal result={result} />
      </section>
    </main>
  );
}
