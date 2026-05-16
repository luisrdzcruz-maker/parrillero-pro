"use client";

import { ds } from "@/lib/design-system";
import { activatePro } from "@/lib/proStatus";
import { texts, type AppText, type Lang } from "@/lib/i18n/texts";

// ─── Benefit rows ─────────────────────────────────────────────────────────────

// ─── Props ────────────────────────────────────────────────────────────────────

export type ProTrigger = "cook_complete" | "planning" | "alerts";

type Props = {
  lang: Lang;
  trigger?: ProTrigger;
  onUpgrade: () => void;
  onDismiss: () => void;
};

// ─── Trigger-specific copy ────────────────────────────────────────────────────

function getSubtitle(
  trigger: ProTrigger | undefined,
  t: AppText,
): string {
  if (trigger === "cook_complete") return t.proModalSubtitleCookComplete;
  if (trigger === "planning") return t.proModalSubtitlePlanning;
  if (trigger === "alerts") return t.proModalSubtitleAlerts;
  return t.proModalSubtitleDefault;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProModal({ lang, trigger, onUpgrade, onDismiss }: Props) {
  const t = texts[lang];
  const benefits = [
    {
      icon: "⏱️",
      title: t.proModalBenefitTimelineTitle,
      sub: t.proModalBenefitTimelineSub,
    },
    {
      icon: "🔔",
      title: t.proModalBenefitAlertsTitle,
      sub: t.proModalBenefitAlertsSub,
    },
    {
      icon: "🗂️",
      title: t.proModalBenefitPlannerTitle,
      sub: t.proModalBenefitPlannerSub,
    },
    {
      icon: "📊",
      title: t.proModalBenefitHistoryTitle,
      sub: t.proModalBenefitHistorySub,
    },
  ];

  function handleUpgrade() {
    activatePro();
    onUpgrade();
  }

  return (
    // Full-screen backdrop — click outside to dismiss
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Translucent backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDismiss}
        aria-label={t.proModalCloseAria}
      />

      {/* Card — slides up on mobile, centered on desktop */}
      {/* allow-arbitrary: sm:rounded-[2rem] + shadow-[0_-24px_80px_...] — modal card chassis, no canonical token */}
      <div className="relative z-10 w-full max-w-sm rounded-t-[2rem] border border-white/[0.08] bg-[#0c0c0e] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-24px_80px_rgba(0,0,0,0.7)] sm:rounded-[2rem] sm:pb-8">

        {/* Top glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.60), transparent)",
          }}
        />

        {/* Close pill */}
        <button
          type="button"
          onClick={onDismiss}
          /* allow-arbitrary: bg-white/[0.06] non-subpanel + hover:text-white/85 mutedClass hover variant deferred to PR D-primitives/B */
          className={`absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.06] p-1.5 ${ds.text.body10} font-bold ${ds.color.mutedClass.secondary} transition hover:text-white/85 active:scale-[0.96]`}
          aria-label={t.proModalCloseAria}
        >
          ✕
        </button>

        {/* Icon + headline */}
        <div className="mb-6 text-center">
          <div className="relative mx-auto mb-4 inline-flex">
            {/* Glow behind icon */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(249,115,22,0.28) 0%, transparent 70%)",
                transform: "scale(2.2)",
              }}
            />
            {/* allow-arbitrary: text-[42px] display-tier glyph — stays inline per slice-d-tokens.md §1 */}
            <span className="relative text-[42px]">🔥</span>
          </div>
          {/* allow-arbitrary: text-[22px] display-tier title — stays inline per slice-d-tokens.md §1 */}
          <h2 className="text-[22px] font-black leading-tight text-white">
            {t.proModalTitle}
          </h2>
          <p className={`mt-2 ${ds.text.body13} font-semibold leading-relaxed ${ds.color.mutedClass.helper}`}>
            {getSubtitle(trigger, t)}
          </p>
        </div>

        {/* Benefits */}
        <ul className="mb-7 space-y-3">
          {benefits.map((b) => (
            <li key={b.title} className="flex items-start gap-3">
              {/* Icon chip */}
              {/* allow-arbitrary: bg-white/[0.04] — non-subpanel benefit-icon chassis, no canonical token */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-base">
                {b.icon}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`${ds.text.body13} font-black ${ds.color.mutedClass.strong}`}>{b.title}</p>
                <p className={`text-[11.5px] font-semibold ${ds.color.mutedClass.secondary}`}>{b.sub}</p>
              </div>
              {/* Check */}
              <span className={`ml-auto shrink-0 ${ds.text.body13} font-black text-emerald-400`}>✓</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <button
          type="button"
          onClick={handleUpgrade}
          /* allow-arbitrary: text-[15px] (between body14 and 22+ display tier) + shadow-[...] phase-colored CTA glow — no canonical tokens */
          className="w-full min-h-[3.25rem] rounded-2xl bg-orange-500 text-[15px] font-black text-black shadow-[0_6px_32px_rgba(249,115,22,0.45)] transition active:scale-[0.97] active:bg-orange-600 hover:bg-orange-400"
        >
          {t.proModalPrimaryCta}
        </button>

        <button
          type="button"
          onClick={onDismiss}
          /* allow-arbitrary: hover:text-white/85 — mutedClass hover variant deferred to PR D-primitives/B */
          className={`mt-3 w-full py-2.5 ${ds.text.body13} font-semibold ${ds.color.mutedClass.secondary} transition hover:text-white/85 active:scale-[0.98]`}
        >
          {t.proModalSecondaryCta}
        </button>
      </div>
    </div>
  );
}
