"use client";

import { Button } from "@/components/ui";

export default function ResultHeader({
  eyebrow,
  method,
  onEdit,
  safety,
  title,
  t,
}: {
  eyebrow: string;
  method?: string;
  onEdit?: () => void;
  safety?: string;
  title: string;
  t: {
    edit: string;
    fallbackSummary: string;
    safety: string;
  };
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black uppercase tracking-[0.22em] text-orange-300/90">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
          {title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {method ? (
            <span className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold leading-5 text-slate-200">
              <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-300" />
              <span className="line-clamp-1">{method}</span>
            </span>
          ) : (
            <p className="max-w-xl text-sm leading-6 text-slate-400">{t.fallbackSummary}</p>
          )}

          {safety && (
            <span className="inline-flex max-w-full items-center rounded-full border border-emerald-300/20 bg-emerald-500/[0.08] px-3 py-1 text-xs font-semibold leading-5 text-emerald-100">
              <span className="mr-1.5 shrink-0 font-black uppercase tracking-[0.12em] text-emerald-300">
                {t.safety}
              </span>
              <span className="line-clamp-1">{safety}</span>
            </span>
          )}
        </div>
      </div>

      {onEdit && (
        <Button
          className="shrink-0 rounded-full px-3 py-1.5 text-xs"
          onClick={onEdit}
          variant="secondary"
        >
          {t.edit}
        </Button>
      )}
    </div>
  );
}
