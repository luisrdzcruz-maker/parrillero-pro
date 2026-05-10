"use client";

import { useState, type ReactNode } from "react";

export type CompactDisclosureProps = {
  /** Eyebrow / label above the summary line. */
  label: string;
  /** Always-visible one-liner summary. */
  summary: string;
  /** "Show detail" affordance copy. */
  showLabel?: string;
  /** "Hide detail" affordance copy. */
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
 */
export function CompactDisclosure({
  label,
  summary,
  showLabel,
  hideLabel,
  defaultOpen = false,
  children,
  className,
}: CompactDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-[1.15rem] border border-orange-200/15 bg-slate-950/35 px-3.5 py-3 ring-1 ring-inset ring-white/5${
        className ? ` ${className}` : ""
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-100/55 sm:text-[10px]">
        {label}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-white/90 sm:text-sm">{summary}</p>
      {children ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-200/80 transition hover:text-orange-100"
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
