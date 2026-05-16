'use client';

import { useState } from 'react';
import { BrandImageIcon } from '@/components/ui/BrandImageIcon';
import { getZoneIcon } from '@/components/parrillada/icons/parrilladaIconResolver';
import { ds } from '@/lib/design-system';
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
  const [open, setOpen] = useState(false);
  return (
    /* allow-arbitrary: bg-white/[0.04] — rounded-3xl card (not subpanel chassis pattern), no canonical token */
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${ds.color.mutedClass.secondary}`}>Zones</p>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="mt-1 flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-semibold text-white">
          {zones.map((z) => z.label).join(' · ')}
        </span>
        <span
          className={`shrink-0 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open ? (
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
                  <p className={`truncate ${ds.text.body10} ${ds.color.mutedClass.secondary}`}>{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
