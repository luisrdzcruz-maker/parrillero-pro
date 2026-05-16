'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getParrilladaItemIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ds } from '@/lib/design-system';
import type { ParrilladaItem } from '@/lib/planning';

type ParrilladaItemRowProps = {
  item: ParrilladaItem;
};

export function ParrilladaItemRow({ item }: ParrilladaItemRowProps) {
  const iconSrc = getParrilladaItemIcon(item.cutId);

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-1.5 text-left">
      <BrandImageIcon src={iconSrc ?? '/icons/ui/meat-selection.webp'} alt="" size="md" shape="soft" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{item.displayName}</p>
        {item.category ? <p className={`mt-0.5 ${ds.text.body11} ${ds.color.mutedClass.helper}`}>{item.category}</p> : null}
      </div>
    </div>
  );
}
