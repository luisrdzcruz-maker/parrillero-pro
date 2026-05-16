"use client";

import { useState, type ReactNode } from "react";
import { ds } from "@/lib/design-system";

export type CompactDisclosureProps = {
  /** Eyebrow / label above the summary line. In compact mode, rendered inline before summary. */
  label: string;
  /** Always-visible one-liner summary. */
  summary: string;
  /** "Show detail" affordance copy. In compact mode, used as aria-label only. */
  showLabel?: string;
  /** "Hide detail" affordance copy. In compact mode, used as aria-label only. */
  hideLabel?: string;
  /** Initial open state. */
  defaultOpen?: boolean;
  /**
   * Optional disclosed content. When omitted, the toggle is not rendered and
   * the disclosure collapses to a static eyebrow + summary card.
   */
  children?: ReactNode;
  /** Extra wrapper className (e.g., for surrounding spacing). */
  className?: string;
  /**
   * Render in single-line compact mode: label + summary on one row, chevron-only
   * trigger (the entire row is tappable), no chassis. Use for dense list
   * disclosures inside an outer panel. Defaults to false (existing card layout).
   */
  compact?: boolean;
};

/**
 * Eyebrow + always-visible summary + opt-in detail body.
 *
 * Codifies the "Why this plan?" disclosure pattern that has lived inline in
 * components/ResultHero.tsx since Phase A. Per
 * docs/design/hybrid-premium-ui-spec.md §6 "CompactDisclosure":
 * "An eyebrow label + always-visible one-liner + a small Show detail / Hide
 * pill button. Tight; never more than 3 detail lines."
 *
 * Visual classes mirror the current ResultHero implementation byte-for-byte;
 * the only behavior change is open-state ownership moves into this component.
 *
 * `compact` mode added 2026-05-15 for dense timeline list usage (Slice B-FU-IA);
 * existing callers keep their default-mode rendering unchanged.
 */
export function CompactDisclosure({
  label,
  summary,
  showLabel,
  hideLabel,
  defaultOpen = false,
  children,
  className,
  compact = false,
}: CompactDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (compact) {
    const wrapperClass = className ? className : undefined;
    return (
      <div className={wrapperClass}>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={open ? hideLabel : showLabel}
          disabled={!children}
          className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left transition hover:bg-white/5 disabled:hover:bg-transparent"
        >
          <span className="font-semibold tabular-nums text-orange-100">{label}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-white/90">{summary}</span>
          {children ? (
            <span
              className={`shrink-0 text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              ▾
            </span>
          ) : null}
        </button>
        {children && open ? <div className="mt-1.5 pl-2">{children}</div> : null}
      </div>
    );
  }

  return (
    <div
      /* allow-arbitrary: rounded-[1.15rem] — disclosure card radius, no canonical ds.radius.* tier */
      className={`rounded-[1.15rem] border border-orange-200/15 bg-slate-950/35 px-3.5 py-3 ring-1 ring-inset ring-white/5${
        className ? ` ${className}` : ""
      }`}
    >
      {/* allow-arbitrary: sm:text-[10px] — breakpoint-prefixed text size, ds.text.body{N} lacks breakpoint variants (deferred to PR D-primitives/B) */}
      <p className={`${ds.text.body9} font-black uppercase tracking-[0.16em] text-orange-100/55 sm:text-[10px]`}>
        {label}
      </p>
      <p className={`mt-1 ${ds.text.body13} leading-snug ${ds.color.mutedClass.strong} sm:text-sm`}>{summary}</p>
      {children ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            className={`mt-2 inline-flex items-center gap-1 ${ds.text.body11} font-semibold uppercase tracking-[0.12em] text-orange-200/80 transition hover:text-orange-100`}
          >
            {open ? hideLabel : showLabel}
            <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
              {"▾"}
            </span>
          </button>
          {open && children}
        </>
      ) : null}
    </div>
  );
}
