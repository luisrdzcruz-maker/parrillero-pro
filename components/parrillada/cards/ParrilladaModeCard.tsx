'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getModeIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import type { ParrilladaMode } from '@/lib/planning';

type ParrilladaModeCardProps = {
  mode: ParrilladaMode;
  title: string;
  description: string;
  emphasized?: boolean;
  onClick: (mode: ParrilladaMode) => void;
};

export function ParrilladaModeCard({ mode, title, description, emphasized = false, onClick }: ParrilladaModeCardProps) {
  const iconSrc = getModeIcon(mode);

  return (
    <button
      type="button"
      onClick={() => onClick(mode)}
      className={`w-full rounded-3xl border p-4 text-left transition active:scale-[0.99] ${
        emphasized
          ? 'border-orange-300/45 bg-gradient-to-br from-orange-500/18 to-white/[0.04] shadow-[0_18px_45px_rgba(249,115,22,0.16)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <BrandImageIcon
          src={iconSrc ?? '/icons/ui/cooking-dashboard.webp'}
          alt=""
          size="lg"
          shape="soft"
          aria-hidden="true"
          className="rounded-2xl"
        />
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-white/68">{description}</p>
        </div>
      </div>
    </button>
  );
}
