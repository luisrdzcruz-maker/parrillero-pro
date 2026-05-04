"use client";

import { Button } from "@/components/ui";

export default function ResultHeader({
  doneness,
  equipment,
  eyebrow,
  method,
  onEdit,
  title,
  t,
}: {
  doneness?: string;
  equipment?: string;
  eyebrow: string;
  method?: string;
  onEdit?: () => void;
  title: string;
  t: {
    edit: string;
    fallbackSummary: string;
  };
}) {
  const setupLabel = [method, equipment].filter(Boolean).join(" / ");

  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">
          {eyebrow}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            {title}
          </h2>
          {doneness && (
            <span className="inline-flex max-w-full items-center rounded-full border border-orange-300/25 bg-orange-500/[0.12] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-orange-100 shadow-sm shadow-black/10">
              {doneness}
            </span>
          )}
        </div>

        {setupLabel ? (
          <p className="mt-2 line-clamp-1 text-sm font-medium leading-6 text-slate-400">{setupLabel}</p>
        ) : (
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{t.fallbackSummary}</p>
        )}
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
