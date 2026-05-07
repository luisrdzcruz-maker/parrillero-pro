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

export function GrillZoneStatusCard({ zones }: GrillZoneStatusCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Zone Status</p>
      <h3 className="mt-1 text-base font-semibold text-white">Direct, indirect, resting</h3>

      <div className="mt-3 space-y-2">
        {zones.map((zoneStatus) => (
          <div key={zoneStatus.zone} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <BrandImageIcon
                src={getZoneIcon(zoneStatus.zone) ?? '/icons/ui/cooking-dashboard.webp'}
                alt=""
                size="sm"
                shape="plain"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-white">{zoneStatus.label}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/75">
              {zoneStatus.activeCount} active
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
