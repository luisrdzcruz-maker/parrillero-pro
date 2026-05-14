'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
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
      <ScreenHeader
        title={`${title} ${mode === 'pro' ? 'Pro' : 'Lite'}`}
        trailing={
          <Badge tone="glass" className="tabular-nums">
            {liteMinItems}–{liteMaxItems} items
          </Badge>
        }
      />

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
