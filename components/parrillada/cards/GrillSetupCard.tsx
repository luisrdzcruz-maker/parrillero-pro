'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getZoneIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import type { GrillZoneType } from '@/lib/planning';

const zones: Array<{ zone: GrillZoneType; label: string; detail: string }> = [
  { zone: 'direct', label: 'Direct', detail: 'Sear and fast finish' },
  { zone: 'indirect', label: 'Indirect', detail: 'Controlled cooking' },
  { zone: 'resting', label: 'Resting', detail: 'Hold and serve prep' },
];

function zoneTone(zone: GrillZoneType): string {
  if (zone === 'direct') return 'border-orange-300/25 bg-orange-500/10';
  if (zone === 'indirect') return 'border-sky-300/25 bg-sky-500/10';
  return 'border-white/10 bg-black/20';
}

export function GrillSetupCard() {
  return (
    /* allow-arbitrary: pre-slice-a */
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="text-base font-semibold text-white">Zones</h3>

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {zones.map(({ zone, label, detail }) => (
          <div key={zone} className={`rounded-2xl border px-2 py-2 ${zoneTone(zone)}`}>
            <div className="flex items-center gap-2">
              <BrandImageIcon
                src={getZoneIcon(zone) ?? '/icons/ui/cooking-dashboard.webp'}
                alt=""
                size="sm"
                shape="soft"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">{label}</p>
                {/* allow-arbitrary: pre-slice-a */}
                <p className="truncate text-[10px] text-white/55">{detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
