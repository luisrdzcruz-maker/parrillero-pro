'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getParrilladaItemIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import type { ParrilladaItem } from '@/lib/planning';

type ParrilladaItemRowProps = {
  item: ParrilladaItem;
};

function roleLabel(role: ParrilladaItem['role']) {
  if (role === 'main') return 'Main';
  if (role === 'secondary') return 'Secondary';
  if (role === 'finish_last') return 'Finish last';
  if (role === 'hold_warm') return 'Hold warm';
  return 'Side';
}

export function ParrilladaItemRow({ item }: ParrilladaItemRowProps) {
  const iconSrc = getParrilladaItemIcon(item.cutId);

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-left transition hover:border-white/20 active:scale-[0.99]"
    >
      <BrandImageIcon src={iconSrc ?? '/icons/ui/meat-selection.webp'} alt="" size="md" shape="soft" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{item.displayName}</p>
          <span className="rounded-full border border-orange-300/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-100">
            {roleLabel(item.role)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-white/55">{item.estimatedMinutes} min</p>
      </div>
      <span className="text-sm text-white/55">{'>'}</span>
    </button>
  );
}
