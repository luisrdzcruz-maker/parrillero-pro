"use client";

import Image from "next/image";
import { AppIcon } from "@/components/ui/AppIcon";
import { useRouter } from "next/navigation";
import type { Mode } from "@/components/navigation/AppHeader";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";
import type { IconCategory } from "@/lib/assets/iconTypes";
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

const HOME_LOGO_SRC = "/brand/parrillero-pro-shield-home.webp";

function HeroSection({ t }: { t: AppText }) {
  return (
    <section className="relative isolate overflow-hidden px-3 pb-1 pt-2 text-center sm:pt-4">
      <div className="absolute left-1/2 top-2 -z-10 h-36 w-36 -translate-x-1/2 rounded-full bg-orange-500/12 blur-3xl" />
      <div className="absolute inset-x-8 top-12 -z-10 h-px bg-gradient-to-r from-transparent via-orange-300/45 to-transparent" />

      <span className="relative mx-auto block h-[clamp(5.75rem,25vw,7rem)] w-[clamp(5.75rem,25vw,7rem)] rounded-full shadow-[0_0_44px_rgba(249,115,22,0.16)]">
        <Image
          src={HOME_LOGO_SRC}
          alt="Parrillero Pro"
          fill
          priority
          sizes="(max-width: 640px) 28vw, 112px"
          className="object-contain"
        />
      </span>

      <div className="mt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300/90">
          {t.homeEyebrow}
        </p>
        <h1 className="mt-1 text-[2rem] font-black leading-none tracking-[-0.045em] text-white sm:text-[2.6rem]">
          Parrillero Pro
        </h1>
        <p className="mx-auto mt-2 max-w-[20rem] text-[13px] font-medium leading-[1.42] text-stone-300/78 sm:hidden">
          {t.homeSubtitleShort}
        </p>
        <p className="mx-auto mt-2 hidden max-w-[28rem] text-sm font-medium leading-[1.5] text-stone-300/78 sm:block">
          {t.homeSubtitleShort}
        </p>
      </div>
    </section>
  );
}

type QuickAction = {
  id: string;
  icon: string;
  registryIcon?: {
    category: IconCategory;
    key: string;
  };
  title: string;
  description: string;
  emphasized?: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
};

function HomeQuickActions({
  title,
  actions,
}: {
  title: string;
  actions: QuickAction[];
}) {
  return (
    <section className="relative">
      <p className="sr-only">{title}</p>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={(e) => action.onClick(e)}
            className={`group relative min-h-[142px] w-full touch-manipulation overflow-hidden rounded-[1.65rem] border px-3.5 py-4 text-left transition-all duration-200 active:scale-[0.98] sm:min-h-[168px] sm:rounded-[1.9rem] sm:px-5 sm:py-5 ${
              action.emphasized
                ? "border-orange-300/34 bg-[radial-gradient(circle_at_25%_0%,rgba(249,115,22,0.24),transparent_44%),linear-gradient(145deg,rgba(249,115,22,0.12),rgba(255,255,255,0.045))] shadow-[0_18px_42px_rgba(249,115,22,0.11)] ring-1 ring-inset ring-orange-200/[0.04] hover:border-orange-300/50"
                : "border-white/[0.09] bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] shadow-[0_14px_34px_rgba(0,0,0,0.26)] ring-1 ring-inset ring-white/[0.035] hover:border-white/18 hover:bg-white/[0.06]"
            }`}
          >
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent" />
            <div className="flex h-full flex-col justify-between gap-4">
              {action.registryIcon ? (
                <AppIcon
                  category={action.registryIcon.category}
                  iconKey={action.registryIcon.key}
                  alt=""
                  size="lg"
                  aria-hidden="true"
                  className={`h-16 w-16 rounded-[1.35rem] border p-3 transition-transform duration-200 group-hover:scale-[1.03] sm:h-[4.5rem] sm:w-[4.5rem] ${
                    action.emphasized
                      ? "border-orange-300/22 bg-black/32 shadow-[0_12px_30px_rgba(249,115,22,0.18)] ring-1 ring-inset ring-white/[0.05]"
                      : "border-white/10 bg-black/24 shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
                  }`}
                  fallback={<span className="text-xl" aria-hidden>{action.icon}</span>}
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-white/10 bg-black/24 text-3xl shadow-[0_10px_24px_rgba(0,0,0,0.24)]" aria-hidden>{action.icon}</span>
              )}
              <div className="min-w-0">
                <p className="text-[15px] font-black leading-tight tracking-[-0.02em] text-white sm:text-lg">{action.title}</p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-slate-300/78 sm:text-sm sm:leading-relaxed">{action.description}</p>
              </div>
            </div>
          </button>
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
  t,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  savedMenusCount: number;
  onModeChange: (mode: Mode) => void;
  onPrimaryCtaClick?: () => void;
  t: AppText;
}) {
  const router = useRouter();

  // Radial ripple that plays on tap then resolves into the cooking screen
  const [ripple, setRipple] = useState<RippleState>(null);

  function fireRipple(x: number, y: number, action: () => void) {
    setRipple({ x, y, id: Date.now() });
    // Fire the action mid-animation (feels instant to the user)
    setTimeout(action, 150);
  }

  const savedPlansLabel = useMemo(() => {
    if (savedMenusCount === 1) return `1 ${t.homeSavedPlanSingular}`;
    return `${savedMenusCount} ${t.homeSavedPlanPlural}`;
  }, [savedMenusCount, t.homeSavedPlanPlural, t.homeSavedPlanSingular]);

  const quickActions: QuickAction[] = [
    {
      id: "start-cooking",
      icon: "🥩",
      registryIcon: { category: "ui", key: "meat-selection" },
      title: t.homePrimaryCta,
      description: t.homeGuidedCookingSub,
      emphasized: true,
      onClick: (e) =>
        fireRipple(e.clientX, e.clientY, () => (onPrimaryCtaClick ? onPrimaryCtaClick() : onModeChange("coccion"))),
    },
    {
      id: "plan-bbq",
      icon: "🧭",
      registryIcon: { category: "ui", key: "cooking-dashboard" },
      title: t.homeParrillada,
      description: t.homeParrilladaSub,
      onClick: () => onModeChange("plan"),
    },
    {
      id: "saved-plans",
      icon: "⭐",
      registryIcon: { category: "ui", key: "shopping-list" },
      title: t.homeSaved,
      description: savedMenusCount > 0 ? savedPlansLabel : t.homeSavedSubEmpty,
      onClick: () => onModeChange("guardados"),
    },
    {
      id: "continue-live",
      icon: "⏱️",
      registryIcon: { category: "live", key: "place-food" },
      title: t.homeLiveCooking,
      description: t.homeLiveCookingSub,
      onClick: () => router.push(buildLiveUrl({ lang })),
    },
  ];

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

    <div className="relative mx-auto min-w-0 w-full max-w-2xl overflow-x-hidden pb-4 sm:pb-6 lg:max-w-3xl lg:pb-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] rounded-[3rem] bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.12),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0))]" />
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <FadeIn>
        <HeroSection t={t} />
      </FadeIn>

      <FadeIn delay={40}>
        <HomeQuickActions title={t.homeActionsTitle} actions={quickActions} />
      </FadeIn>

      {/* ── Settings strip ─────────────────────────────────────────────────── */}
      <div className="mt-3 sm:mt-4">
      <FadeIn delay={80}>
        <HomeSettingsStrip t={t} lang={lang} onLangChange={onLangChange} />
      </FadeIn>
      </div>
    </div>
    </>
  );
}
