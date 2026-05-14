'use client';

import { Panel } from '@/components/ui/Panel';
import type { AppText, Lang } from '@/lib/i18n/texts';

type ServeStrategyCardProps = {
  lang: Lang;
  t: AppText;
  strategy: 'asap' | 'time';
  serveAtLocal: string;
  hasValidServeTime: boolean;
  startsInPast: boolean;
  onServeAtLocalChange: (value: string) => void;
  onSetEarliestServeTime?: () => void;
  onChange: (strategy: 'asap' | 'time') => void;
};

export function ServeStrategyCard({
  strategy,
  serveAtLocal,
  hasValidServeTime,
  startsInPast,
  onServeAtLocalChange,
  onSetEarliestServeTime,
  onChange,
}: ServeStrategyCardProps) {
  return (
    <Panel as="section" className="p-4">
      <h3 className="text-base font-semibold text-white">Serve time</h3>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
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

      {strategy === 'time' ? (
        <label className="mt-3 block space-y-1.5">
          {/* allow-arbitrary: pre-slice-a */}
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Serve time</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-300/60"
            type="datetime-local"
            value={serveAtLocal}
            onChange={(event) => onServeAtLocalChange(event.target.value)}
          />
        </label>
      ) : null}

      {!hasValidServeTime ? (
        <p className="mt-2 text-xs text-amber-200">Choose a valid serve time to generate a plan.</p>
      ) : null}

      {startsInPast && onSetEarliestServeTime ? (
        <div className="mt-2.5 rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <p>Current serve target starts in the past.</p>
          <button
            type="button"
            onClick={onSetEarliestServeTime}
            /* allow-arbitrary: pre-slice-a */
            className="mt-2 rounded-lg border border-amber-200/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-50"
          >
            Set earliest valid time
          </button>
        </div>
      ) : null}
    </Panel>
  );
}
