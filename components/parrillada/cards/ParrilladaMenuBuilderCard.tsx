'use client';

import { useEffect, useMemo, useState } from 'react';
import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getParrilladaItemIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import type { ParrilladaItem } from '@/lib/planning';
import type { PlannerCutInput } from '@/lib/planning';
import { ParrilladaItemRow } from './ParrilladaItemRow';

type ParrilladaMenuBuilderCardProps = {
  items: ParrilladaItem[];
  availableItems: PlannerCutInput[];
  selectedItemIds: Set<string>;
  maxItems: number;
  onToggleCatalogItem: (item: PlannerCutInput) => void;
};

type MenuFilter = 'all' | 'beef' | 'pork' | 'chicken' | 'fish' | 'vegetable';

function animalLabel(value: PlannerCutInput['animal']): string {
  if (value === 'beef') return 'Beef';
  if (value === 'pork') return 'Pork';
  if (value === 'chicken') return 'Chicken';
  if (value === 'fish') return 'Fish';
  if (value === 'seafood') return 'Seafood';
  if (value === 'lamb') return 'Lamb';
  if (value === 'vegetable') return 'Vegetables';
  return 'Other';
}

const MENU_FILTERS: Array<{ id: MenuFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'beef', label: 'Beef' },
  { id: 'pork', label: 'Pork' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'fish', label: 'Fish' },
  { id: 'vegetable', label: 'Vegetable' },
];

function matchesFilter(item: PlannerCutInput, filter: MenuFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'fish') return item.animal === 'fish' || item.animal === 'seafood';
  return item.animal === filter;
}

export function ParrilladaMenuBuilderCard({
  items,
  availableItems,
  selectedItemIds,
  maxItems,
  onToggleCatalogItem,
}: ParrilladaMenuBuilderCardProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<MenuFilter>('all');
  const itemLimitReached = items.length >= maxItems;

  useEffect(() => {
    if (!selectorOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectorOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectorOpen]);

  const groupedItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const byFilter = availableItems.filter((item) => matchesFilter(item, activeFilter));
    const filtered = query ? byFilter.filter((item) => item.displayName.toLowerCase().includes(query)) : byFilter;
    const grouped = new Map<string, PlannerCutInput[]>();
    filtered.forEach((item) => {
      const key = animalLabel(item.animal);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [availableItems, search, activeFilter]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">Choose cuts</h3>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${
            itemLimitReached
              ? 'border-amber-300/30 bg-amber-500/15 text-amber-100'
              : 'border-white/10 bg-black/25 text-white/70'
          }`}
        >
          {items.length}/{maxItems}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setSelectorOpen(true)}
        className="rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/25"
      >
        Add cuts
      </button>

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <ParrilladaItemRow key={item.id} item={item} />
        ))}
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-2 text-xs text-white/60">
            Pick at least 2 items to build a valid parrillada plan.
          </p>
        ) : null}
      </div>

      {selectorOpen ? (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px]">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col bg-[#070707] px-3 py-3 sm:px-4 sm:py-4">
            <div className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Cut selector</p>
                <h4 className="text-sm font-semibold text-white">Choose cuts</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-semibold text-white/75">
                  {items.length}/{maxItems}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectorOpen(false)}
                  className="rounded-lg border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/25"
                >
                  Done
                </button>
              </div>
            </div>

            <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search cut"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-300/50"
              />
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                {MENU_FILTERS.map((filter) => {
                  const selected = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                        selected
                          ? 'border-orange-300/50 bg-orange-500/15 text-orange-100'
                          : 'border-white/10 bg-black/25 text-white/70 hover:border-white/20'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {groupedItems.map(([groupLabel, groupItems]) => (
                  <section key={groupLabel} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">{groupLabel}</p>
                      <span className="text-[10px] text-white/45">{groupItems.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {groupItems.map((item) => {
                        const selected = selectedItemIds.has(item.id);
                        const disabled = !selected && itemLimitReached;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => onToggleCatalogItem(item)}
                            className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                              selected
                                ? 'border-orange-300/50 bg-orange-500/15 text-orange-100'
                                : disabled
                                  ? 'cursor-not-allowed border-white/10 bg-black/20 text-white/35'
                                  : 'border-white/10 bg-black/20 text-white/85 hover:border-white/25'
                            }`}
                          >
                            <BrandImageIcon
                              src={getParrilladaItemIcon(item.cutId) ?? '/icons/ui/meat-selection.webp'}
                              alt=""
                              size="sm"
                              shape="soft"
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{item.displayName}</p>
                              <p className="text-[11px] text-white/55">{animalLabel(item.animal)}</p>
                            </div>
                            <span className="text-xs font-semibold">{selected ? 'Selected' : 'Add'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
                {groupedItems.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
                    No cuts match this search.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </section>
  );
}
