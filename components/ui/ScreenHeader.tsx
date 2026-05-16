"use client";

import type { ReactNode } from "react";
import { ds } from "@/lib/design-system";

export type ScreenHeaderProps = {
  /** Optional small label above the title (e.g., "STEP 2 OF 4"). */
  eyebrow?: string;
  /** Screen title. */
  title: string;
  /** Optional one-liner subtitle / context. */
  subtitle?: string;
  /** Optional left-side element (typically a back button). */
  leading?: ReactNode;
  /** Optional right-side element (typically one icon-only action). */
  trailing?: ReactNode;
  /** Extra wrapper className for layout adjustments. */
  className?: string;
};

/**
 * Compact top bar with title + back/close + at most one action.
 *
 * Per docs/design/hybrid-premium-ui-spec.md §6 "ScreenHeader":
 * - ~52 px tall (excluding safe-area top)
 * - hairline bottom optional; usually transparent
 * - never used on Home (uses the logo-led launcher instead)
 *
 * Phase Visual 1 ships this component but defers broad adoption to
 * follow-up slices that touch each screen's header markup individually.
 */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  leading,
  trailing,
  className,
}: ScreenHeaderProps) {
  return (
    <header
      className={`relative flex items-center gap-3 px-1 py-3 sm:py-4${className ? ` ${className}` : ""}`}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          /* allow-arbitrary: sm:text-[11px] — breakpoint-prefixed text size, ds.text.body{N} lacks breakpoint variants (deferred to PR D-primitives/B) */
          <p className={`${ds.text.body10} font-black uppercase tracking-[0.18em] ${ds.color.mutedClass.secondary} sm:text-[11px]`}>
            {eyebrow}
          </p>
        ) : null}
        <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-slate-400 sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </header>
  );
}
