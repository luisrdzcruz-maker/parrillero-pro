'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { Panel } from '@/components/ui/Panel';
import { getParrilladaItemIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ds } from '@/lib/design-system';
import type { AppText, Lang } from '@/lib/i18n/texts';
import type { ParrilladaItem } from '@/lib/planning';
import type { PlannerCutInput } from '@/lib/planning';
import { ParrilladaItemRow } from './ParrilladaItemRow';

type ParrilladaMenuBuilderCardProps = {
  lang: Lang;
  t: AppText;
  items: ParrilladaItem[];
  availableItems: PlannerCutInput[];
  selectedItemIds: Set<string>;
  maxItems: number;
  onToggleCatalogItem: (item: PlannerCutInput) => void;
};

type MenuFilter = 'all' | 'beef' | 'pork' | 'chicken' | 'fish' | 'vegetable';

const FILTER_IDS: ReadonlyArray<MenuFilter> = ['all', 'beef', 'pork', 'chicken', 'fish', 'vegetable'];

// Translation lookups keyed by stable data values; lang stays out of lib/.
function animalLabel(value: PlannerCutInput['animal'], t: AppText): string {
  if (value === 'beef') return t.parrilladaAnimalBeef;
  if (value === 'pork') return t.parrilladaAnimalPork;
  if (value === 'chicken') return t.parrilladaAnimalChicken;
  if (value === 'fish') return t.parrilladaAnimalFish;
  if (value === 'seafood') return t.parrilladaAnimalSeafood;
  if (value === 'lamb') return t.parrilladaAnimalLamb;
  if (value === 'vegetable') return t.parrilladaAnimalVegetables;
  return t.parrilladaAnimalOther;
}

function filterLabel(id: MenuFilter, t: AppText): string {
  if (id === 'all') return t.parrilladaMenuFilterAll;
  if (id === 'beef') return t.parrilladaAnimalBeef;
  if (id === 'pork') return t.parrilladaAnimalPork;
  if (id === 'chicken') return t.parrilladaAnimalChicken;
  if (id === 'fish') return t.parrilladaAnimalFish;
  return t.parrilladaMenuFilterVegetable;
}

function matchesFilter(item: PlannerCutInput, filter: MenuFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'fish') return item.animal === 'fish' || item.animal === 'seafood';
  return item.animal === filter;
}

export function ParrilladaMenuBuilderCard({
  t,
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
      const key = animalLabel(item.animal, t);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [availableItems, search, activeFilter, t]);

  return (
    <Panel as="section" className="p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{t.parrilladaMenuChooseCuts}</h3>
        {/* TODO(slice-d): Migrate this pill to <Badge> once an "amber" tone
            is added to the shared primitive. The orange/neutral pill below
            (in the modal header) was migrated to Badge in Slice B; this
            call site stays inline because its warning state needs amber,
            and red (Badge tone="danger") would read as "broken" rather
            than "heads up." */}
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
        className={`rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-semibold ${ds.color.mutedClass.body} transition hover:border-white/25`}
      >
        {t.parrilladaMenuAddCuts}
      </button>

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <ParrilladaItemRow key={item.id} item={item} />
        ))}
        {items.length === 0 ? (
          <p className={`rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-2 text-xs ${ds.color.mutedClass.secondary}`}>
            {t.parrilladaMenuEmptyPrompt}
          </p>
        ) : null}
      </div>

      {selectorOpen ? (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px]">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col bg-[#070707] px-3 py-3 sm:px-4 sm:py-4">
            <Panel className="mb-2 flex items-center justify-between gap-2 px-3 py-2">
              <div>
                <p className={`${ds.text.body11} uppercase tracking-[0.16em] ${ds.color.mutedClass.secondary}`}>{t.parrilladaMenuCutSelectorEyebrow}</p>
                <h4 className="text-sm font-semibold text-white">{t.parrilladaMenuChooseCuts}</h4>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="glass" className="tabular-nums">
                  {items.length}/{maxItems}
                </Badge>
                <button
                  type="button"
                  onClick={() => setSelectorOpen(false)}
                  className={`rounded-lg border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-semibold ${ds.color.mutedClass.body} transition hover:border-white/25`}
                >
                  {t.parrilladaMenuModalDone}
                </button>
              </div>
            </Panel>

            <Panel as="section" className="flex min-h-0 flex-1 flex-col p-2.5">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.parrilladaMenuSearchPlaceholder}
                /* allow-arbitrary: placeholder:text-white/35 — mutedClass prefix variant deferred to PR D-primitives/B (same shape gap as hover:text-white/<n>) */
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-300/50"
              />
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                {FILTER_IDS.map((filterId) => {
                  const selected = activeFilter === filterId;
                  return (
                    <button
                      key={filterId}
                      type="button"
                      onClick={() => setActiveFilter(filterId)}
                      className={`shrink-0 rounded-full border px-2.5 py-1 ${ds.text.body11} font-semibold transition ${
                        selected
                          ? 'border-orange-300/50 bg-orange-500/15 text-orange-100'
                          : 'border-white/10 bg-black/25 text-white/70 hover:border-white/20'
                      }`}
                    >
                      {filterLabel(filterId, t)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {groupedItems.map(([groupLabel, groupItems]) => (
                  /* allow-arbitrary: bg-white/[0.03] — non-subpanel group panel tint (rounded-xl, not rounded-2xl), no canonical token */
                  <section key={groupLabel} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className={`${ds.text.body10} font-semibold uppercase tracking-[0.14em] ${ds.color.mutedClass.helper}`}>{groupLabel}</p>
                      <span className={`${ds.text.body10} ${ds.color.mutedClass.faint}`}>{groupItems.length}</span>
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
                                  ? `cursor-not-allowed border-white/10 bg-black/20 ${ds.color.mutedClass.disabled}`
                                  : `border-white/10 bg-black/20 ${ds.color.mutedClass.body} hover:border-white/25`
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
                              <p className={`${ds.text.body11} ${ds.color.mutedClass.secondary}`}>{animalLabel(item.animal, t)}</p>
                            </div>
                            <span className="text-xs font-semibold">{selected ? t.parrilladaMenuItemSelected : t.parrilladaMenuItemAdd}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
                {groupedItems.length === 0 ? (
                  <p className={`rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs ${ds.color.mutedClass.secondary}`}>
                    {t.parrilladaMenuNoResults}
                  </p>
                ) : null}
              </div>
            </Panel>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
