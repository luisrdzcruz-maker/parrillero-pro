'use client';

import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getZoneIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import type { GrillZoneType } from '@/lib/planning';

type GrillZoneStatus = {
  zone: GrillZoneType;
  activeCount: number;
  label: string;
};

type GrillZoneStatusCardProps = {
  zones: GrillZoneStatus[];
};

function zoneTone(zone: GrillZoneType): string {
  if (zone === 'direct') return 'border-orange-300/25 bg-orange-500/10';
  if (zone === 'indirect') return 'border-sky-300/25 bg-sky-500/10';
  return 'border-white/10 bg-black/20';
}

export function GrillZoneStatusCard({ zones }: GrillZoneStatusCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Zone Status</p>
      <h3 className="mt-1 text-base font-semibold text-white">Direct, indirect, resting</h3>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {zones.map((zoneStatus) => (
          <div key={zoneStatus.zone} className={`rounded-2xl border px-2 py-2 ${zoneTone(zoneStatus.zone)}`}>
            <div className="flex items-center gap-2">
              <BrandImageIcon
                src={getZoneIcon(zoneStatus.zone) ?? '/icons/ui/cooking-dashboard.webp'}
                alt=""
                size="sm"
                shape="plain"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-medium text-white">{zoneStatus.label}</p>
                <p className="text-[10px] text-white/65">{zoneStatus.activeCount} active</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
