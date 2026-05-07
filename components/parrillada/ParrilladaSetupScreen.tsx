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
  const strategyValue = strategy === 'serve_together' ? 'time' : 'asap';

  return (
    <section className="space-y-3">
      <header className="px-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Setup</p>
        <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-white/55">
          Select {liteMinItems}-{liteMaxItems} items. {subtitle}
        </p>
      </header>

      <ParrilladaMenuBuilderCard
        items={selectedItems}
        availableItems={availableItems}
        selectedItemIds={selectedItemIds}
        maxItems={liteMaxItems}
        onToggleCatalogItem={onToggleCatalogItem}
      />
      <ServeStrategyCard
        mode={mode}
        strategy={strategyValue}
        serveAtLocal={serveAtLocal}
        hasValidServeTime={hasValidServeTime}
        startsInPast={startsInPast}
        onServeAtLocalChange={onServeAtLocalChange}
        onSetEarliestServeTime={onSetEarliestServeTime}
        onChange={(value) => onStrategyChange(value === 'time' ? 'serve_together' : 'balanced')}
      />
      <GrillSetupCard />

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
