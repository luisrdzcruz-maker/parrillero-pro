'use client';

import { Panel } from '@/components/ui/Panel';
import { ds } from '@/lib/design-system';
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
  t,
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
      <h3 className="text-base font-semibold text-white">{t.parrilladaServeTime}</h3>

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
          {t.parrilladaServeASAP}
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
          {t.parrilladaServeAtTime}
        </button>
      </div>

      {strategy === 'time' ? (
        <label className="mt-3 block space-y-1.5">
          <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${ds.color.mutedClass.faint}`}>{t.parrilladaServeTime}</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-300/60"
            type="datetime-local"
            value={serveAtLocal}
            onChange={(event) => onServeAtLocalChange(event.target.value)}
          />
        </label>
      ) : null}

      {!hasValidServeTime ? (
        <p className="mt-2 text-xs text-amber-200">{t.parrilladaServeValidationHint}</p>
      ) : null}

      {startsInPast && onSetEarliestServeTime ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-100">
          <span className="min-w-0 flex-1">{t.parrilladaServeStartsInPast}</span>
          <button
            type="button"
            onClick={onSetEarliestServeTime}
            className={`shrink-0 rounded-md border border-amber-200/40 bg-amber-400/15 px-2 py-0.5 ${ds.text.body11} font-semibold text-amber-50`}
          >
            {t.parrilladaServeSetEarliest}
          </button>
        </div>
      ) : null}
    </Panel>
  );
}
