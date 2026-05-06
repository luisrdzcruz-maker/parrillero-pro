"use client";

import { AppIcon, Button } from "@/components/ui";
import type { IconCategory } from "@/lib/assets/iconTypes";

type ResolvedSetupIcon = { category: IconCategory; key: string } | null;

export default function ResultHeader({
  doneness,
  equipment,
  equipmentIcon,
  eyebrow,
  method,
  methodIcon,
  onEdit,
  title,
  t,
}: {
  doneness?: string;
  equipment?: string;
  equipmentIcon?: ResolvedSetupIcon;
  eyebrow: string;
  method?: string;
  methodIcon?: ResolvedSetupIcon;
  onEdit?: () => void;
  title: string;
  t: {
    edit: string;
    fallbackSummary: string;
  };
}) {
  const setupItems = [
    method ? { icon: methodIcon, label: method } : null,
    equipment ? { icon: equipmentIcon, label: equipment } : null,
  ].filter(Boolean) as Array<{ icon: ResolvedSetupIcon; label: string }>;
  const compactDoneness = doneness?.trim() ?? "";
  const showDoneness =
    compactDoneness.length > 0 &&
    compactDoneness.length <= 22 &&
    !/[.;:]/.test(compactDoneness) &&
    compactDoneness.split(/\s+/).length <= 3;

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
          {showDoneness && (
            <span className="inline-flex max-w-full items-center rounded-full border border-orange-300/25 bg-orange-500/[0.12] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-orange-100 shadow-sm shadow-black/10">
              {compactDoneness}
            </span>
          )}
        </div>

        {setupItems.length > 0 ? (
          <p className="mt-1.5 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[11px] font-semibold leading-5 text-slate-500">
            {setupItems.map((item, index) => (
              <span key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1.5">
                {item.icon ? (
                  <AppIcon
                    category={item.icon.category}
                    iconKey={item.icon.key}
                    alt=""
                    size="sm"
                    aria-hidden="true"
                    className="h-3.5 w-3.5 opacity-70"
                  />
                ) : null}
                <span className="truncate">{item.label}</span>
                {index < setupItems.length - 1 ? <span className="text-slate-600">/</span> : null}
              </span>
            ))}
          </p>
        ) : null}
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
