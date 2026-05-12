"use client";

import type { ReactNode } from "react";
import { BrandImageIcon } from "@/components/ui/BrandImageIcon";

type CutIconSlotProps = {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function CutIconSlot({ src, alt, size = "md", className = "" }: CutIconSlotProps) {
  if (!src) {
    return (
      <span
        aria-hidden="true"
        className={[
          "inline-flex shrink-0 items-center justify-center rounded-2xl border border-orange-300/15 bg-orange-500/10 text-orange-200 shadow-inner shadow-black/20",
          size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className={size === "sm" ? "h-2 w-2 rounded-full bg-orange-300" : "h-2.5 w-2.5 rounded-full bg-orange-300"} />
      </span>
    );
  }

  return (
    <BrandImageIcon
      src={src}
      alt={alt}
      size={size === "lg" ? "lg" : size === "sm" ? "sm" : "md"}
      shape="soft"
      className={className}
      fallback={
        /* allow-arbitrary: pre-slice-a */
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-orange-300 shadow-[0_0_14px_rgba(251,146,60,0.32)]" />
      }
    />
  );
}

export function CutMetaChip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      className={
        tone === "accent"
          /* allow-arbitrary: pre-slice-a */
          ? "inline-flex items-center rounded-full border border-orange-300/25 bg-orange-500/12 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-200"
          /* allow-arbitrary: pre-slice-a */
          : "inline-flex items-center rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-400"
      }
    >
      {children}
    </span>
  );
}

type CutIdentityHeaderProps = {
  title: string;
  eyebrow: string;
  description?: string;
  iconSrc?: string | null;
  chips?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
};

export function CutIdentityHeader({
  title,
  eyebrow,
  description,
  iconSrc,
  chips,
  action,
  compact = false,
}: CutIdentityHeaderProps) {
  return (
    <div
      className={[
        /* allow-arbitrary: pre-slice-a */
        "relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(249,115,22,0.14),transparent_34%),linear-gradient(145deg,rgba(12,10,9,0.98),rgba(2,6,23,0.96))] shadow-[0_16px_48px_rgba(0,0,0,0.30)] ring-1 ring-inset ring-white/[0.035]",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <CutIconSlot src={iconSrc} alt="" size={compact ? "md" : "lg"} className={compact ? "mt-0.5" : ""} />
          <div className="min-w-0">
            {/* allow-arbitrary: pre-slice-a */}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/80">{eyebrow}</p>
            <h2
              className={
                compact
                  ? "mt-1 truncate text-xl font-black leading-tight tracking-tight text-white sm:text-2xl"
                  : "mt-1 truncate text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl"
              }
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-zinc-400 sm:text-sm">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {chips ? <div className="mt-3 flex flex-wrap gap-1.5">{chips}</div> : null}
    </div>
  );
}

export function CutInfoModule({
  title,
  value,
  icon,
  tone = "default",
}: {
  title: string;
  value: string;
  icon?: ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={[
        /* allow-arbitrary: pre-slice-a */
        "flex min-w-0 gap-3 rounded-[1.1rem] border p-3",
        /* allow-arbitrary: pre-slice-a */
        tone === "warning" ? "border-red-300/18 bg-red-500/8" : "border-white/10 bg-white/[0.035]",
      ].join(" ")}
    >
      {icon ? <span className="mt-0.5 inline-flex shrink-0 text-orange-200">{icon}</span> : null}
      <div className="min-w-0">
        {/* allow-arbitrary: pre-slice-a */}
        <p className={tone === "warning" ? "text-[10px] font-black uppercase tracking-[0.16em] text-red-200" : "text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500"}>
          {title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
