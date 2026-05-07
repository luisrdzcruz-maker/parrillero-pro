'use client';

import type { ParrilladaItem } from '@/lib/planning';
import { ParrilladaItemRow } from './ParrilladaItemRow';

type ParrilladaMenuBuilderCardProps = {
  items: ParrilladaItem[];
};

export function ParrilladaMenuBuilderCard({ items }: ParrilladaMenuBuilderCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Menu Builder</p>
          <h3 className="mt-1 text-base font-semibold text-white">Selected items</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-semibold text-white/70">
          {items.length} items
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <ParrilladaItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
