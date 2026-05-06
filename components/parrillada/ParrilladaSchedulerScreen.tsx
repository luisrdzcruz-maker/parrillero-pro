'use client';

import { useMemo, useState } from 'react';
import type { PlannerResult } from '../../lib/planning';
import { NAPOLEON_ROGUE_525_LITE } from '../../lib/planning/fixtures/demoGrills';
import { DEMO_PARRILLADA_ITEMS } from '../../lib/planning/fixtures/demoItems';
import { scheduleParrillada, type PlannerCutInput, type SchedulerStrategy } from '../../lib/planning';
import { ParrilladaTimelineFinal } from './ParrilladaTimelineFinal';
import { ParrilladaWarningsFinal } from './ParrilladaWarningsFinal';

const MIN_ITEMS = 2;
const MAX_ITEMS = 4;

function localDateTimeToIso(value: string): string {
  return new Date(value).toISOString();
}

function formatLocalDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Select a valid serve time';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatClock(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function strategyLabel(strategy: SchedulerStrategy): string {
  if (strategy === 'serve_together') return 'Serve together';
  if (strategy === 'quality_first') return 'Quality first';
  if (strategy === 'low_stress') return 'Low stress';
  return 'Balanced';
}

function defaultServeAtLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 3, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function resolveNextStepMessage({
  selectedCount,
  startsInPast,
  result,
}: {
  selectedCount: number;
  startsInPast: boolean;
  result: PlannerResult | null;
}): string {
  if (selectedCount < MIN_ITEMS) return 'Select at least 2 items to generate a Parrillada Lite plan.';
  if (startsInPast) return 'Adjust serve time to keep setup and preheat in the future.';
  if (!result?.ok) return 'Review critical warnings before executing the plan.';
  return 'Plan looks good. Check warnings and start from the first timeline block.';
}

export function ParrilladaSchedulerScreen() {
  const [selectedItems, setSelectedItems] = useState<PlannerCutInput[]>(DEMO_PARRILLADA_ITEMS.slice(0, MAX_ITEMS));
  const [serveAtLocal, setServeAtLocal] = useState(defaultServeAtLocal());
  const [strategy, setStrategy] = useState<SchedulerStrategy>('balanced');
  const [sessionNowMs] = useState(() => Date.now());
  const selectedCount = selectedItems.length;
  const canBuildPlan = selectedCount >= MIN_ITEMS;

  const result = useMemo(() => {
    if (!canBuildPlan) return null;
    return (
      scheduleParrillada({
        items: selectedItems,
        serveAtIso: localDateTimeToIso(serveAtLocal),
        grillCapacity: NAPOLEON_ROGUE_525_LITE,
        strategy,
        allowHolding: true,
        nowIso: new Date().toISOString(),
        maxPlanLookbackMinutes: 480,
      })
    );
  }, [canBuildPlan, selectedItems, serveAtLocal, strategy]);

  const startsInPast = useMemo(() => {
    if (!result) return false;
    return new Date(result.summary.planStartIso).getTime() < sessionNowMs;
  }, [result, sessionNowMs]);

  function toggleItem(item: PlannerCutInput) {
    setSelectedItems((current) => {
      if (current.some((entry) => entry.id === item.id)) return current.filter((entry) => entry.id !== item.id);
      if (current.length >= MAX_ITEMS) return current;
      return [...current, item];
    });
  }

  return (
    <main className="min-h-screen bg-[#070707] px-3 py-3 text-white sm:px-4 sm:py-4">
      <section className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-orange-500/[0.07] p-4 shadow-xl sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-orange-200/70">Parrillero Pro</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Parrillada Lite v1</h1>
          <p className="mt-1 text-sm leading-5 text-white/70">
            Select 2-4 items, choose serve time and strategy, then follow the compact timeline.
          </p>
        </header>

        <section className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-white/75">Serve time</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-orange-300/60"
              type="datetime-local"
              value={serveAtLocal}
              onChange={(event) => setServeAtLocal(event.target.value)}
            />
            <p className="text-xs text-white/55">{formatLocalDateTime(serveAtLocal)}</p>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-white/75">Strategy</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-orange-300/60"
              value={strategy}
              onChange={(event) => setStrategy(event.target.value as SchedulerStrategy)}
            >
              <option value="balanced">Balanced</option>
              <option value="serve_together">Serve together</option>
              <option value="quality_first">Quality first</option>
              <option value="low_stress">Low stress</option>
            </select>
            <p className="text-xs text-white/55">Optimizes order and overlap for this demo menu.</p>
          </label>
        </section>

        <section className="grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-3 text-sm sm:grid-cols-3 sm:p-4">
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Items</p>
            <p className="mt-1 font-semibold">{selectedCount}/{MIN_ITEMS}-{MAX_ITEMS}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Strategy</p>
            <p className="mt-1 font-semibold">{strategyLabel(strategy)}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Confidence</p>
            <p className="mt-1 font-semibold capitalize">{result?.summary.confidence ?? 'pending'}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Plan starts</p>
            <p className="mt-1 font-semibold">{result ? formatClock(result.summary.planStartIso) : '--:--'}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Duration</p>
            <p className="mt-1 font-semibold">{result ? `${result.summary.totalDurationMinutes} min` : '--'}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Next step</p>
            <p className="mt-1 text-xs leading-5 text-white/80">
              {resolveNextStepMessage({ selectedCount, startsInPast, result })}
            </p>
          </article>
        </section>

        {startsInPast && (
          <section className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
            Current serve time places plan start in the past. Move serve time forward for an executable timeline.
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Menu items</h2>
            <p className="text-xs text-white/55">
              {selectedCount} selected · choose {MIN_ITEMS}-{MAX_ITEMS}
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {DEMO_PARRILLADA_ITEMS.map((item) => {
              const active = selectedItems.some((entry) => entry.id === item.id);
              const atLimit = !active && selectedCount >= MAX_ITEMS;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item)}
                  disabled={atLimit}
                  className={`rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-orange-300/60 bg-orange-500/15'
                      : atLimit
                        ? 'cursor-not-allowed border-white/10 bg-black/10 text-white/35'
                        : 'border-white/10 bg-black/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <p className="font-semibold text-white">{item.displayName}</p>
                  <p className="text-xs capitalize text-white/50">
                    {item.animal} · {item.weightGrams ?? '?'} g
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {!canBuildPlan && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80">
            Select at least {MIN_ITEMS} items to build a timeline. Lite v1 supports up to {MAX_ITEMS} items to keep execution reliable.
          </section>
        )}

        <ParrilladaWarningsFinal result={result} />
        <ParrilladaTimelineFinal result={result} />
      </section>
    </main>
  );
}
