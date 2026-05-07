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
    <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left">
      <BrandImageIcon src={iconSrc ?? '/icons/ui/meat-selection.webp'} alt="" size="md" shape="soft" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-white">{item.displayName}</p>
          <span className="rounded-full border border-orange-300/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-100">
            {roleLabel(item.role)}
          </span>
          {item.role === 'hold_warm' ? (
            <span className="rounded-full border border-sky-300/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
              Hold warm
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-white/55">{item.estimatedMinutes}m active</p>
      </div>
    </div>
  );
}
