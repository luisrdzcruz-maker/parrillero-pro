'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getZoneIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import type { GrillZoneType } from '@/lib/planning';

const zones: Array<{ zone: GrillZoneType; label: string; detail: string }> = [
  { zone: 'direct', label: 'Direct', detail: 'Sear and fast finish' },
  { zone: 'indirect', label: 'Indirect', detail: 'Controlled cooking' },
  { zone: 'resting', label: 'Resting', detail: 'Hold and serve prep' },
];

export function GrillSetupCard() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Grill Setup</p>
      <h3 className="mt-1 text-base font-semibold text-white">Zone layout</h3>

      <div className="mt-3 space-y-2">
        {zones.map(({ zone, label, detail }) => (
          <div key={zone} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
            <BrandImageIcon src={getZoneIcon(zone) ?? '/icons/ui/cooking-dashboard.webp'} alt="" size="sm" shape="soft" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-white/55">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
