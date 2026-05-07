'use client';

import { ParrilladaMenuBuilderCard } from '@/components/parrillada/cards/ParrilladaMenuBuilderCard';
import { ServeStrategyCard } from '@/components/parrillada/cards/ServeStrategyCard';
import { GrillSetupCard } from '@/components/parrillada/cards/GrillSetupCard';
import type { ParrilladaItem, ParrilladaMode, PlannerCutInput, SchedulerStrategy } from '@/lib/planning';

type ParrilladaSetupScreenProps = {
  mode: ParrilladaMode;
  selectedItems: ParrilladaItem[];
  availableItems: PlannerCutInput[];
  selectedItemIds: Set<string>;
  liteMinItems: number;
  liteMaxItems: number;
  serveAtLocal: string;
  hasValidServeTime: boolean;
  strategy: SchedulerStrategy;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onServeAtLocalChange: (value: string) => void;
  onStrategyChange: (value: SchedulerStrategy) => void;
  onToggleCatalogItem: (item: PlannerCutInput) => void;
  onSetEarliestServeTime?: () => void;
  startsInPast: boolean;
  canGenerate: boolean;
  onBack: () => void;
  onGenerate: () => void;
};

export function ParrilladaSetupScreen({
  mode,
  selectedItems,
  availableItems,
  selectedItemIds,
  liteMinItems,
  liteMaxItems,
  serveAtLocal,
  hasValidServeTime,
  strategy,
  title,
  subtitle,
  ctaLabel,
  onServeAtLocalChange,
  onStrategyChange,
  onToggleCatalogItem,
  onSetEarliestServeTime,
  startsInPast,
  canGenerate,
  onBack,
  onGenerate,
}: ParrilladaSetupScreenProps) {
  const itemLimitReached = selectedItems.length >= liteMaxItems;
  const strategyValue = strategy === 'serve_together' ? 'time' : 'asap';

  return (
    <section className="space-y-3">
      <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Setup</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/65">{subtitle}</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Serve time</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-300/60"
              type="datetime-local"
              value={serveAtLocal}
              onChange={(event) => onServeAtLocalChange(event.target.value)}
            />
          </label>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Lite limits</p>
            <p className="mt-1 text-sm text-white/80">
              Select {liteMinItems}-{liteMaxItems} items ({selectedItems.length} selected)
            </p>
          </div>
        </div>
        {!hasValidServeTime ? (
          <p className="mt-2 text-xs text-amber-200">Choose a valid serve time to generate a plan.</p>
        ) : null}
      </section>

      <ParrilladaMenuBuilderCard items={selectedItems} />
      <ServeStrategyCard
        mode={mode}
        strategy={strategyValue}
        onChange={(value) => onStrategyChange(value === 'time' ? 'serve_together' : 'balanced')}
      />
      <GrillSetupCard />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Catalog-backed items</h3>
          <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/65">
            {selectedItems.length}/{liteMaxItems}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {availableItems.map((item) => {
            const selected = selectedItemIds.has(item.id);
            const disabled = !selected && itemLimitReached;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onToggleCatalogItem(item)}
                className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                  selected
                    ? 'border-orange-300/55 bg-orange-500/15 text-orange-100'
                    : disabled
                      ? 'cursor-not-allowed border-white/10 bg-black/10 text-white/40'
                      : 'border-white/10 bg-black/20 text-white/80 hover:border-white/25'
                }`}
              >
                <p className="font-semibold">{item.displayName}</p>
                <p className="mt-0.5 text-xs text-white/55">{item.cutId}</p>
              </button>
            );
          })}
        </div>
        {itemLimitReached ? (
          <p className="mt-2 text-xs text-amber-100">Lite allows up to {liteMaxItems} selected items.</p>
        ) : null}
      </section>

      {startsInPast && onSetEarliestServeTime ? (
        <section className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
          <p>Current serve time places plan start in the past.</p>
          <button
            type="button"
            onClick={onSetEarliestServeTime}
            className="mt-2 rounded-xl border border-amber-200/40 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-50"
          >
            Set earliest serve time
          </button>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!canGenerate}
          onClick={onGenerate}
          className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
            canGenerate
              ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-black hover:brightness-105'
              : 'cursor-not-allowed border border-white/10 bg-black/20 text-white/45'
          }`}
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
