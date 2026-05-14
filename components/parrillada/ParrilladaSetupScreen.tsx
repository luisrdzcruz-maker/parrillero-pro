'use client';

import { Button } from '@/components/ui/Button';
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
      <header className="flex items-center justify-between gap-3 px-1">
        <h2 className="min-w-0 truncate text-lg font-semibold text-white">
          {title} {mode === 'pro' ? 'Pro' : 'Lite'}
        </h2>
        {/* allow-arbitrary: pre-slice-a */}
        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] font-semibold text-white/65 tabular-nums">
          {liteMinItems}–{liteMaxItems} items
        </span>
      </header>

      <ParrilladaMenuBuilderCard
        items={selectedItems}
        availableItems={availableItems}
        selectedItemIds={selectedItemIds}
        maxItems={liteMaxItems}
        onToggleCatalogItem={onToggleCatalogItem}
      />
      <ServeStrategyCard
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
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" disabled={!canGenerate} onClick={onGenerate}>
          {ctaLabel}
        </Button>
      </div>
    </section>
  );
}
