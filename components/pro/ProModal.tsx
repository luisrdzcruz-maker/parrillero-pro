"use client";

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
      {/* allow-arbitrary: pre-slice-a */}
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
          /* allow-arbitrary: pre-slice-a */
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.06] p-1.5 text-[10px] font-bold text-white/40 transition hover:text-white/65 active:scale-[0.96]"
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
            {/* allow-arbitrary: pre-slice-a */}
            <span className="relative text-[42px]">🔥</span>
          </div>
          {/* allow-arbitrary: pre-slice-a */}
          <h2 className="text-[22px] font-black leading-tight text-white">
            {t.proModalTitle}
          </h2>
          {/* allow-arbitrary: pre-slice-a */}
          <p className="mt-2 text-[13px] font-semibold leading-relaxed text-white/50">
            {getSubtitle(trigger, t)}
          </p>
        </div>

        {/* Benefits */}
        <ul className="mb-7 space-y-3">
          {benefits.map((b) => (
            <li key={b.title} className="flex items-start gap-3">
              {/* Icon chip */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-base">
                {b.icon}
              </span>
              <div className="min-w-0 pt-0.5">
                {/* allow-arbitrary: pre-slice-a */}
                <p className="text-[13px] font-black text-white/90">{b.title}</p>
                {/* allow-arbitrary: pre-slice-a */}
                <p className="text-[11.5px] font-semibold text-white/40">{b.sub}</p>
              </div>
              {/* Check */}
              {/* allow-arbitrary: pre-slice-a */}
              <span className="ml-auto shrink-0 text-[13px] font-black text-emerald-400">✓</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <button
          type="button"
          onClick={handleUpgrade}
          /* allow-arbitrary: pre-slice-a */
          className="w-full min-h-[3.25rem] rounded-2xl bg-orange-500 text-[15px] font-black text-black shadow-[0_6px_32px_rgba(249,115,22,0.45)] transition active:scale-[0.97] active:bg-orange-600 hover:bg-orange-400"
        >
          {t.proModalPrimaryCta}
        </button>

        <button
          type="button"
          onClick={onDismiss}
          /* allow-arbitrary: pre-slice-a */
          className="mt-3 w-full py-2.5 text-[13px] font-semibold text-white/35 transition hover:text-white/55 active:scale-[0.98]"
        >
          {t.proModalSecondaryCta}
        </button>
      </div>
    </div>
  );
}
