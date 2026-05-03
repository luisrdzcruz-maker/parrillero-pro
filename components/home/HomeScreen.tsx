"use client";

import { useRouter } from "next/navigation";
import type { Mode } from "@/components/navigation/AppHeader";
import { buildCookingDetailsUrl } from "@/lib/navigation/cookingNavigation";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";
import { readLiveCookingPayload } from "@/lib/liveCookingPlan";
import type { Animal } from "@/lib/types/domain";
import type { AppText, Lang } from "@/lib/i18n/texts";
import { type MouseEvent, type ReactNode, useLayoutEffect, useMemo, useState } from "react";

// ─── Entrance animation ───────────────────────────────────────────────────────

function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      const id = delay
        ? window.setTimeout(() => requestAnimationFrame(() => setEntered(true)), delay)
        : requestAnimationFrame(() => setEntered(true));
      return () => (delay ? window.clearTimeout(id as unknown as number) : cancelAnimationFrame(id as unknown as number));
    });
    return () => cancelAnimationFrame(raf);
  }, [delay]);

  return (
    <div
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        entered ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroSection({
  t,
  onStartCooking,
  onPlanBbq,
}: {
  t: AppText;
  onStartCooking: (e: MouseEvent<HTMLButtonElement>) => void;
  onPlanBbq: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909] px-5 py-6 shadow-[0_20px_56px_rgba(0,0,0,0.55)] sm:px-7 sm:py-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />

      <div className="relative z-10 max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
            {t.homeEyebrow}
          </span>
        </div>

        <h1 className="mt-4 text-[clamp(2rem,8.2vw,3.3rem)] font-black leading-[0.96] tracking-[-0.04em] text-white">
          {t.homeTitle}
        </h1>

        <p className="mt-3 max-w-[34rem] text-[14px] font-medium leading-[1.52] text-stone-300/82 sm:text-base">
          {t.homeSubtitle}
        </p>

        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.11em] text-slate-400">
          {t.homeHowItWorks}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{t.homeHowItWorksFlow}</p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onStartCooking}
            className="min-h-[56px] flex-1 touch-manipulation rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-black shadow-[0_10px_36px_rgba(234,88,12,0.42)] transition-all duration-200 hover:bg-orange-400 active:scale-[0.98] sm:text-base"
          >
            {t.homePrimaryCta} <span aria-hidden className="ml-1.5">→</span>
          </button>
          <button
            type="button"
            onClick={onPlanBbq}
            className="min-h-[56px] touch-manipulation rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-4 text-sm font-black text-white transition-all duration-200 hover:border-orange-300/35 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            {t.homeSecondaryCta}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Popular cuts ─────────────────────────────────────────────────────────────

type PopularCut = {
  label: string;
  animal: Animal;
  cutId: string;
  doneness?: string;
  thickness?: string;
};

function PopularCuts({
  cuts,
  title,
  onSelect,
}: {
  cuts: PopularCut[];
  title: string;
  onSelect: (cut: PopularCut, e: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <section className="rounded-[1.65rem] border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/32">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {cuts.map((cut) => (
          <button
            key={cut.cutId}
            type="button"
            onClick={(e) => onSelect(cut, e)}
            className="min-h-10 touch-manipulation rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-black text-stone-100 transition-all duration-200 hover:border-orange-300/40 hover:bg-orange-500/12 active:scale-[0.97]"
          >
            {cut.label}
          </button>
        ))}
      </div>
    </section>
  );
}

type QuickAction = {
  id: string;
  icon: string;
  title: string;
  description: string;
  emphasized?: boolean;
  onClick: () => void;
};

function HomeQuickActions({
  title,
  actions,
}: {
  title: string;
  actions: QuickAction[];
}) {
  return (
    <section className="rounded-[1.65rem] border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/32">{title}</p>
      <div className="mt-3 grid gap-2.5">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={`w-full touch-manipulation rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 active:scale-[0.98] ${
              action.emphasized
                ? "border-orange-300/30 bg-orange-500/8 hover:border-orange-300/45 hover:bg-orange-500/12"
                : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="pt-0.5 text-lg" aria-hidden>{action.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-black text-white">{action.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-300/90">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function HomeValueCards({ t }: { t: AppText }) {
  const cards = [
    { icon: "⏱️", title: t.homeChipTiming, description: t.homeValueTimingSub },
    { icon: "🔥", title: t.homeValueZonesTitle, description: t.homeValueZonesSub },
    { icon: "🛡️", title: t.homeValueMistakesTitle, description: t.homeValueMistakesSub },
    { icon: "📋", title: t.homeLiveCooking, description: t.homeValueLiveSub },
  ];

  return (
    <section className="rounded-[1.65rem] border border-white/[0.07] bg-white/[0.025] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">{t.homeValueTitle}</p>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200/90">
              <span aria-hidden>{card.icon}</span> {card.title}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300/90">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeTrustStrip({ t }: { t: AppText }) {
  const claims = [t.homeTrustClaimLocal, t.homeTrustClaimLive, t.homeTrustClaimNoGuesswork];

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {claims.map((claim) => (
          <span
            key={claim}
            className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] font-semibold text-slate-300"
          >
            {claim}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Settings strip ───────────────────────────────────────────────────────────

function HomeSettingsStrip({
  t,
  lang,
  onLangChange,
}: {
  t: AppText;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
}) {
  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-white/62">
          {t.homeSettingsKicker}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
          {t.homeSettingsSub}
        </p>
      </div>

      <select
        value={lang}
        onChange={(e) => onLangChange(e.target.value as Lang)}
        className="min-h-9 shrink-0 rounded-xl border border-white/10 bg-black/40 px-2.5 text-xs font-bold text-slate-200 outline-none transition focus:border-orange-400/60"
      >
        <option value="es">🇪🇸 {t.homeLangSpanish}</option>
        <option value="en">🇬🇧 {t.homeLangEnglish}</option>
        <option value="fi">🇫🇮 {t.homeLangFinnish}</option>
      </select>
    </section>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

// ─── Ripple transition state ──────────────────────────────────────────────────

type RippleState = { x: number; y: number; id: number } | null;

export function HomeScreen({
  lang,
  onLangChange,
  savedMenusCount,
  onModeChange,
  onPrimaryCtaClick,
  onPopularCutSelect,
  t,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  savedMenusCount: number;
  onModeChange: (mode: Mode) => void;
  onPrimaryCtaClick?: () => void;
  onPopularCutSelect?: (cut: {
    animal: Animal;
    cutId: string;
    doneness?: string;
    thickness?: string;
  }) => void;
  t: AppText;
}) {
  const router = useRouter();

  // Radial ripple that plays on tap then resolves into the cooking screen
  const [ripple, setRipple] = useState<RippleState>(null);
  const [hasActiveLivePlan] = useState(() => Boolean(readLiveCookingPayload()));

  function fireRipple(x: number, y: number, action: () => void) {
    setRipple({ x, y, id: Date.now() });
    // Fire the action mid-animation (feels instant to the user)
    setTimeout(action, 150);
  }

  const popularCuts: PopularCut[] = [
    {
      label: t.homePopularRibeye,
      animal: "beef",
      cutId: "ribeye",
      doneness: "medium_rare",
      thickness: "2",
    },
    {
      label: t.homePopularPicanha,
      animal: "beef",
      cutId: "picanha",
      doneness: "medium_rare",
      thickness: "2",
    },
    {
      label: t.homePopularChickenBreast,
      animal: "chicken",
      cutId: "chicken_breast",
      doneness: "safe",
      thickness: "2",
    },
    {
      label: t.homePopularSalmon,
      animal: "fish",
      cutId: "salmon_fillet",
      doneness: "medium",
      thickness: "2",
    },
    {
      label: t.homePopularAsparagus,
      animal: "vegetables",
      cutId: "asparagus",
    },
  ];

  function openPopularCut(cut: PopularCut) {
    if (onPopularCutSelect) {
      onPopularCutSelect({
        animal: cut.animal,
        cutId: cut.cutId,
        doneness: cut.doneness,
        thickness: cut.thickness,
      });
      return;
    }

    router.push(
      buildCookingDetailsUrl({
        animal: cut.animal,
        cutId: cut.cutId,
        doneness: cut.doneness,
        thickness: cut.thickness,
        lang,
      }),
    );
  }

  const savedPlansLabel = useMemo(() => {
    if (savedMenusCount === 1) return `1 ${t.homeSavedPlanSingular}`;
    return `${savedMenusCount} ${t.homeSavedPlanPlural}`;
  }, [savedMenusCount, t.homeSavedPlanPlural, t.homeSavedPlanSingular]);

  const quickActions = useMemo<QuickAction[]>(() => {
    const actions: QuickAction[] = [
      {
        id: "start-cooking",
        icon: "🥩",
        title: t.homeGuidedCooking,
        description: t.homeGuidedCookingSub,
        emphasized: true,
        onClick: () => onModeChange("coccion"),
      },
      {
        id: "plan-bbq",
        icon: "🧭",
        title: t.homeParrillada,
        description: t.homeParrilladaSub,
        onClick: () => onModeChange("plan"),
      },
    ];

    if (savedMenusCount > 0) {
      actions.push({
        id: "saved-plans",
        icon: "⭐",
        title: t.homeSaved,
        description: savedPlansLabel,
        onClick: () => onModeChange("guardados"),
      });
    }

    if (hasActiveLivePlan) {
      actions.push({
        id: "continue-live",
        icon: "⏱️",
        title: t.homeLiveCooking,
        description: t.homeLiveCookingSub,
        onClick: () => router.push(buildLiveUrl({ lang })),
      });
    }

    return actions;
  }, [
    hasActiveLivePlan,
    lang,
    onModeChange,
    router,
    savedMenusCount,
    savedPlansLabel,
    t.homeGuidedCooking,
    t.homeGuidedCookingSub,
    t.homeLiveCooking,
    t.homeLiveCookingSub,
    t.homeParrillada,
    t.homeParrilladaSub,
    t.homeSaved,
    onPopularCutSelect,
  ]);

  return (
    <>
      {/* ── Ignition transition overlay ────────────────────────────────────────
          Two layers anchored at tap origin:
            · spark  — bright white/amber inner flash (180ms, fast)
            · bloom  — warm orange fire spread  (280ms, slower)
          pointer-events-none: never blocks navigation or re-taps.
          onAnimationEnd on the bloom (longer layer) clears the state.      */}
      {ripple && (
        <div
          key={ripple.id}
          className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
          aria-hidden
        >
          {/* Inner spark — white/amber flash */}
          <div
            className="animate-ignition-spark absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 8,
              height: 8,
              background:
                "radial-gradient(circle, rgba(255,255,200,0.98) 0%, rgba(255,190,50,0.85) 35%, rgba(255,120,0,0.40) 70%, transparent 100%)",
            }}
          />
          {/* Outer bloom — orange fire spread */}
          <div
            className="animate-ignition-bloom absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 8,
              height: 8,
              background:
                "radial-gradient(circle, rgba(255,140,0,0.88) 0%, rgba(249,115,22,0.65) 30%, rgba(234,88,12,0.28) 65%, transparent 100%)",
            }}
            onAnimationEnd={() => setRipple(null)}
          />
        </div>
      )}

    <div className="mx-auto min-w-0 w-full max-w-2xl space-y-3 overflow-x-hidden pb-4 sm:space-y-4 sm:pb-6 lg:max-w-3xl lg:pb-6">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <FadeIn>
        <HeroSection
          t={t}
          onStartCooking={(e) =>
            fireRipple(e.clientX, e.clientY, () => (onPrimaryCtaClick ? onPrimaryCtaClick() : onModeChange("coccion")))
          }
          onPlanBbq={() => onModeChange("plan")}
        />
      </FadeIn>

      <FadeIn delay={40}>
        <HomeQuickActions title={t.homeActionsTitle} actions={quickActions} />
      </FadeIn>

      {/* ── Popular cuts ───────────────────────────────────────────────────── */}
      <FadeIn delay={80}>
        <PopularCuts
          cuts={popularCuts}
          title={t.homePopularCutsTitle}
          onSelect={(cut, e) => fireRipple(e.clientX, e.clientY, () => openPopularCut(cut))}
        />
      </FadeIn>

      <FadeIn delay={110}>
        <HomeValueCards t={t} />
      </FadeIn>

      <FadeIn delay={140}>
        <HomeTrustStrip t={t} />
      </FadeIn>

      {/* ── Settings strip ─────────────────────────────────────────────────── */}
      <FadeIn delay={170}>
        <HomeSettingsStrip t={t} lang={lang} onLangChange={onLangChange} />
      </FadeIn>
    </div>
    </>
  );
}
