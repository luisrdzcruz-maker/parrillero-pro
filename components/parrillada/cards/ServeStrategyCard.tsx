'use client';

import type { ParrilladaMode } from '@/lib/planning';

type ServeStrategyCardProps = {
  mode: ParrilladaMode;
  strategy: 'asap' | 'time';
  onChange: (strategy: 'asap' | 'time') => void;
};

export function ServeStrategyCard({ mode, strategy, onChange }: ServeStrategyCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Serve Strategy</p>
      <h3 className="mt-1 text-base font-semibold text-white">Lite by default, Pro metadata ready</h3>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('asap')}
          className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
            strategy === 'asap'
              ? 'border-orange-300/55 bg-orange-500/20 text-orange-100'
              : 'border-white/10 bg-black/20 text-white/70'
          }`}
        >
          Serve ASAP
        </button>
        <button
          type="button"
          onClick={() => onChange('time')}
          className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
            strategy === 'time'
              ? 'border-orange-300/55 bg-orange-500/20 text-orange-100'
              : 'border-white/10 bg-black/20 text-white/70'
          }`}
        >
          Serve at time
        </button>
      </div>

      <p className="mt-3 text-xs text-white/55">
        {mode === 'pro'
          ? 'Advanced serve window controls are available in Pro and remain collapsed by default.'
          : 'Pro serve window metadata is preserved in contracts, while Lite keeps controls compact.'}
      </p>
    </section>
  );
}
