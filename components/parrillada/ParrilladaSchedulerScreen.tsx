'use client';

import { useMemo, useState } from 'react';
import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import type { PlannerResult } from '../../lib/planning';
import { NAPOLEON_ROGUE_525_LITE } from '../../lib/planning/fixtures/demoGrills';
import { DEMO_PARRILLADA_ITEMS } from '../../lib/planning/fixtures/demoItems';
import {
  buildCatalogBackedParrilladaLiteItems,
  getParrilladaItemPresentation,
  scheduleParrillada,
  type PlannerCutInput,
  type ParrilladaItemCategory,
  type SchedulerStrategy,
} from '../../lib/planning';
import { getCutSelectionIconPath } from '../cuts/cutSelectionIconResolver';
import { ParrilladaTimelineFinal } from './ParrilladaTimelineFinal';
import { ParrilladaWarningsFinal } from './ParrilladaWarningsFinal';

const MIN_ITEMS = 2;
const MAX_ITEMS = 4;

type CategoryFilter = 'recommended' | ParrilladaItemCategory;

const CATEGORY_FILTERS: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'beef', label: 'Beef' },
  { id: 'pork', label: 'Pork' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'fish', label: 'Fish' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'sausages', label: 'Sausages' },
];

function toLocalInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function tryLocalDateTimeToIso(value: string): string | null {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    Number.isNaN(localDate.getTime()) ||
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day ||
    localDate.getHours() !== hour ||
    localDate.getMinutes() !== minute
  ) {
    return null;
  }

  return localDate.toISOString();
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

function formatAnimal(value: string): string {
  if (value === 'beef') return 'Beef';
  if (value === 'pork') return 'Pork';
  if (value === 'chicken') return 'Chicken';
  if (value === 'fish') return 'Fish';
  if (value === 'seafood') return 'Seafood';
  if (value === 'vegetable') return 'Vegetables';
  return 'Other';
}

function formatMinutes(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
  }
  return `${minutes}m`;
}

function timingHint(item: PlannerCutInput): string {
  const metadata = item.planningMetadata;
  const active = formatMinutes(metadata?.activeCookMinutes);
  const rest = formatMinutes(metadata?.restMinutes);
  const hold = metadata?.canHoldWarm ? formatMinutes(metadata.maxHoldMinutes) : null;
  if (active && rest) return `${active} cook · ${rest} rest`;
  if (active) return `${active} cook`;
  if (hold) return `Can hold ${hold}`;
  if (item.weightGrams) return `${item.weightGrams} g`;
  return 'Timing pending';
}

function itemIconPath(item: PlannerCutInput): string | undefined {
  return getCutSelectionIconPath({ id: item.cutId });
}

function ItemIcon({ item, className = '' }: { item: PlannerCutInput; className?: string }) {
  const iconPath = itemIconPath(item);
  const fallback = (
    <span
      aria-hidden="true"
      className="h-2.5 w-2.5 rounded-full bg-orange-300/85 shadow-[0_0_18px_rgba(251,146,60,0.38)]"
    />
  );

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 shadow-inner shadow-black/30 ${className}`}
    >
      {iconPath ? (
        <BrandImageIcon
          src={iconPath}
          alt=""
          size="sm"
          shape="plain"
          aria-hidden="true"
          className="h-8 w-8 rounded-xl"
          fallback={fallback}
        />
      ) : (
        fallback
      )}
    </span>
  );
}

function defaultServeAtLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 3, 0, 0, 0);
  return toLocalInputValue(d);
}

function suggestedEarliestServeLocal(result: PlannerResult, nowMs: number): string {
  const planStartMs = new Date(result.summary.planStartIso).getTime();
  const currentServeMs = new Date(result.request.serveAtIso).getTime();
  const latenessMinutes = Math.max(0, Math.ceil((nowMs - planStartMs) / 60000));
  const bufferMinutes = 10;
  const shiftedServeMs = currentServeMs + (latenessMinutes + bufferMinutes) * 60000;
  return toLocalInputValue(new Date(shiftedServeMs));
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
  if (selectedCount < MIN_ITEMS) return 'Choose at least 2 items';
  if (startsInPast) return 'Adjust serve time to keep setup and preheat in the future.';
  if (!result?.ok) return 'Review critical warnings before executing the plan.';
  return 'Plan looks good. Check warnings and start from the first timeline block.';
}

function SelectedMenuModule({
  selectedItems,
  onRemove,
  onOpenBrowser,
}: {
  selectedItems: PlannerCutInput[];
  onRemove: (item: PlannerCutInput) => void;
  onOpenBrowser: () => void;
}) {
  const selectedCount = selectedItems.length;
  const needsMoreItems = selectedCount < MIN_ITEMS;

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.065] to-white/[0.025] p-3 shadow-xl shadow-black/20 ring-1 ring-inset ring-white/[0.035] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200/75">Your menu</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Selected parrillada · {selectedCount} item{selectedCount === 1 ? '' : 's'}
          </h2>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
            needsMoreItems
              ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
              : 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
          }`}
        >
          {selectedCount >= MAX_ITEMS ? `${selectedCount} of ${MAX_ITEMS}` : `${selectedCount} selected`}
        </span>
      </div>

      {needsMoreItems && (
        <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Choose at least 2 items
        </div>
      )}

      <div className="mt-3 space-y-2">
        {selectedItems.map((item) => {
          const presentation = getParrilladaItemPresentation(item);
          return (
            <article key={item.id} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-black/25 p-2.5">
              <ItemIcon item={item} />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">{item.displayName}</h3>
                  <span className="shrink-0 rounded-full bg-orange-500/12 px-2 py-0.5 text-[10px] font-semibold text-orange-100">
                    {presentation.roleLabel}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-white/50">
                  {presentation.categoryLabel} · {formatAnimal(item.animal)}
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-white/72">{timingHint(item)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/65 transition hover:border-red-300/35 hover:bg-red-500/10 hover:text-red-100 active:scale-[0.97]"
                aria-label={`Remove ${item.displayName}`}
              >
                Remove
              </button>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenBrowser}
        className="mt-3 w-full rounded-2xl border border-orange-300/35 bg-orange-500/12 px-4 py-3 text-sm font-bold text-orange-100 transition hover:bg-orange-500/18 active:scale-[0.98]"
      >
        + Add item
      </button>
    </section>
  );
}

function ParrilladaItemBrowser({
  availableItems,
  selectedItems,
  selectedCount,
  isOpen,
  activeFilter,
  searchQuery,
  onToggleOpen,
  onFilterChange,
  onSearchChange,
  onToggleItem,
}: {
  availableItems: PlannerCutInput[];
  selectedItems: PlannerCutInput[];
  selectedCount: number;
  isOpen: boolean;
  activeFilter: CategoryFilter;
  searchQuery: string;
  onToggleOpen: () => void;
  onFilterChange: (filter: CategoryFilter) => void;
  onSearchChange: (query: string) => void;
  onToggleItem: (item: PlannerCutInput) => void;
}) {
  const selectedIds = new Set(selectedItems.map((item) => item.id));
  const limitReached = selectedCount >= MAX_ITEMS;
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredItems = availableItems.filter((item) => {
    const presentation = getParrilladaItemPresentation(item);
    const matchesFilter =
      activeFilter === 'recommended'
        ? presentation.visibility === 'recommended'
        : presentation.category === activeFilter;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      item.displayName.toLowerCase().includes(normalizedSearch) ||
      item.cutId.toLowerCase().includes(normalizedSearch) ||
      presentation.categoryLabel.toLowerCase().includes(normalizedSearch) ||
      presentation.planningHint.toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  const recommendedItems = filteredItems.filter(
    (item) => getParrilladaItemPresentation(item).visibility === 'recommended',
  );
  const standardItems = filteredItems.filter(
    (item) => getParrilladaItemPresentation(item).visibility !== 'recommended',
  );
  const standardVisible = standardItems.filter(
    (item) => getParrilladaItemPresentation(item).visibility !== 'advanced',
  );
  const advancedItems = standardItems.filter(
    (item) => getParrilladaItemPresentation(item).visibility === 'advanced',
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-xl shadow-black/15 sm:p-4">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={isOpen}
      >
        <span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200/70">Add item</span>
          <span className="mt-1 block text-lg font-semibold text-white">
            {isOpen ? 'Choose from catalog' : 'Browse recommendations and categories'}
          </span>
        </span>
        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white/70">
          {isOpen ? 'Close' : 'Open'}
        </span>
      </button>

      {!isOpen && (
        <p className="mt-2 text-sm leading-5 text-white/60">
          Add from recommendations first, then open categories or search when the catalog grows.
        </p>
      )}

      {isOpen && (
        <div className="mt-3 space-y-3">
          {limitReached && (
            <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Lite limit reached. Maximum 4 items in Lite.
            </div>
          )}

          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === filter.id
                    ? 'border-orange-300/60 bg-orange-500/20 text-orange-100'
                    : 'border-white/10 bg-black/25 text-white/55 hover:border-orange-300/30 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="sr-only">Search catalog items</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search cuts, sides, or hints"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-orange-300/60"
            />
          </label>

          <div className="space-y-3">
            {recommendedItems.length > 0 && (
              <CatalogItemGroup
                title={activeFilter === 'recommended' ? 'Recommended first' : 'Recommended in this category'}
                items={recommendedItems}
                selectedIds={selectedIds}
                limitReached={limitReached}
                onToggleItem={onToggleItem}
              />
            )}
            {standardVisible.length > 0 && (
              <CatalogItemGroup
                title="More choices"
                items={standardVisible}
                selectedIds={selectedIds}
                limitReached={limitReached}
                onToggleItem={onToggleItem}
              />
            )}
            {advancedItems.length > 0 && (
              <CatalogItemGroup
                title="Advanced / early start"
                items={advancedItems}
                selectedIds={selectedIds}
                limitReached={limitReached}
                onToggleItem={onToggleItem}
              />
            )}
            {filteredItems.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/60">
                No catalog items match this filter yet.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CatalogItemGroup({
  title,
  items,
  selectedIds,
  limitReached,
  onToggleItem,
}: {
  title: string;
  items: PlannerCutInput[];
  selectedIds: Set<string>;
  limitReached: boolean;
  onToggleItem: (item: PlannerCutInput) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">{title}</h3>
        <span className="text-xs font-semibold text-white/35">{items.length}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => {
          const active = selectedIds.has(item.id);
          const disabled = !active && limitReached;
          const presentation = getParrilladaItemPresentation(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleItem(item)}
              disabled={disabled}
              className={`flex min-w-0 items-center gap-2.5 rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${
                active
                  ? 'border-orange-300/60 bg-orange-500/16 shadow-[0_14px_34px_rgba(249,115,22,0.12)]'
                  : disabled
                    ? 'cursor-not-allowed border-white/10 bg-black/10 opacity-45'
                    : 'border-white/10 bg-black/24 hover:border-orange-300/35 hover:bg-white/[0.06]'
              }`}
            >
              <ItemIcon item={item} />
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{item.displayName}</span>
                  {presentation.requiresEarlyStart && (
                    <span className="shrink-0 rounded-full bg-amber-400/12 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                      Early
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-white/48">
                  {presentation.categoryLabel} · {formatAnimal(item.animal)}
                </span>
                <span className="mt-0.5 block truncate text-xs font-medium text-orange-100/85">
                  {presentation.planningHint}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  active
                    ? 'bg-orange-400 text-black'
                    : disabled
                      ? 'border border-white/10 text-white/45'
                      : 'border border-white/10 bg-white/[0.04] text-white/70'
                }`}
              >
                {active ? 'Added' : 'Add'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ParrilladaSchedulerScreen() {
  const catalogSource = useMemo(() => buildCatalogBackedParrilladaLiteItems(), []);
  const availableItems = catalogSource.items.length >= MIN_ITEMS ? catalogSource.items : DEMO_PARRILLADA_ITEMS;
  const usingFallbackItems = catalogSource.items.length < MIN_ITEMS;
  const [selectedItems, setSelectedItems] = useState<PlannerCutInput[]>(availableItems.slice(0, MAX_ITEMS));
  const [isItemBrowserOpen, setIsItemBrowserOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [serveAtLocal, setServeAtLocal] = useState(defaultServeAtLocal());
  const [strategy, setStrategy] = useState<SchedulerStrategy>('balanced');
  const [sessionNowMs] = useState(() => Date.now());
  const selectedCount = selectedItems.length;
  const canBuildPlan = selectedCount >= MIN_ITEMS;
  const serveAtIso = useMemo(() => tryLocalDateTimeToIso(serveAtLocal), [serveAtLocal]);
  const hasValidServeTime = Boolean(serveAtIso);

  const result = useMemo(() => {
    if (!canBuildPlan || !serveAtIso) return null;
    return (
      scheduleParrillada({
        items: selectedItems,
        serveAtIso,
        grillCapacity: NAPOLEON_ROGUE_525_LITE,
        strategy,
        allowHolding: true,
        nowIso: new Date().toISOString(),
        maxPlanLookbackMinutes: 480,
      })
    );
  }, [canBuildPlan, selectedItems, serveAtIso, strategy]);

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

  function removeItem(item: PlannerCutInput) {
    setSelectedItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  function applyEarliestServeTime() {
    if (!result) return;
    setServeAtLocal(suggestedEarliestServeLocal(result, Date.now()));
  }

  return (
    <main className="min-h-screen bg-[#070707] px-3 py-3 text-white sm:px-4 sm:py-4">
      <section className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-orange-500/[0.07] p-4 shadow-xl sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-orange-200/70">Parrillero Pro</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Parrillada Lite v1</h1>
          <p className="mt-1 text-sm leading-5 text-white/70">Lite supports 2-4 items. Choose serve time and strategy, then follow the compact timeline.</p>
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
            {!hasValidServeTime && (
              <p className="text-xs text-amber-200">Choose a valid serve time.</p>
            )}
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
            <p className="text-xs text-white/55">Optimizes order and overlap for this menu.</p>
          </label>
        </section>

        {usingFallbackItems && (
          <section className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
            Catalog-backed items are temporarily unavailable. Showing demo fallback items.
          </section>
        )}

        <section className="grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-3 text-sm sm:grid-cols-3 sm:p-4">
          <article className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Items</p>
            <p className="mt-1 font-semibold">
              {selectedCount} selected{selectedCount >= MAX_ITEMS ? ` · ${selectedCount} of ${MAX_ITEMS}` : ''}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-white/50">Lite supports 2-4 items.</p>
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
            <p className="mt-1 text-[11px] leading-4 text-white/50">
              Calculated from selected items and serve time.
            </p>
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

        <SelectedMenuModule
          selectedItems={selectedItems}
          onRemove={removeItem}
          onOpenBrowser={() => setIsItemBrowserOpen(true)}
        />

        {startsInPast && (
          <section className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
            <p>Current serve time places plan start in the past.</p>
            <div className="mt-2">
              <button
                type="button"
                onClick={applyEarliestServeTime}
                className="rounded-xl border border-amber-200/40 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-400/25"
              >
                Set earliest serve time
              </button>
            </div>
          </section>
        )}

        <ParrilladaItemBrowser
          availableItems={availableItems}
          selectedItems={selectedItems}
          selectedCount={selectedCount}
          isOpen={isItemBrowserOpen}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          onToggleOpen={() => setIsItemBrowserOpen((current) => !current)}
          onFilterChange={setActiveFilter}
          onSearchChange={setSearchQuery}
          onToggleItem={toggleItem}
        />

        {!canBuildPlan && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80">
            Choose at least 2 items. Lite supports up to 4 items.
          </section>
        )}

        <ParrilladaWarningsFinal result={result} />
        <ParrilladaTimelineFinal result={result} />
      </section>
    </main>
  );
}
