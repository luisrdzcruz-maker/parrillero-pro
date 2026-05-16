"use client";

import Image from "next/image";
import { AppIcon } from "@/components/ui/AppIcon";
import { useRouter } from "next/navigation";
import type { Mode } from "@/components/navigation/AppHeader";
import { ds } from "@/lib/design-system";
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

      {/* allow-arbitrary: shadow-[0_0_44px_...] ember-glow halo around hero logo — no canonical ds.shadow.* tier */}
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
        <p className={`${ds.text.body10} font-black uppercase tracking-[0.28em] text-orange-300/90`}>
          {t.homeEyebrow}
        </p>
        <h1 className="mt-1 text-[2rem] font-black leading-none tracking-[-0.045em] text-white sm:text-[2.6rem]">
          Parrillero Pro
        </h1>
        <p className={`mx-auto mt-2 max-w-[20rem] ${ds.text.body13} font-medium leading-[1.42] text-stone-300/78 sm:hidden`}>
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
  // Spec §7.1: 2 main actions (Start Cooking, Plan Parrillada/Menu) +
  // 2 secondary actions (Saved, Live). Partition by `emphasized` to render
  // a clear visual hierarchy: primary tiles dominate at the top; secondary
  // tiles below, visually quieter and shorter.
  const primary = actions.filter((action) => action.emphasized);
  const secondary = actions.filter((action) => !action.emphasized);

  return (
    <section className="relative space-y-2.5 sm:space-y-3">
      <p className="sr-only">{title}</p>
      {primary.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {primary.map((action) => (
            <PrimaryActionTile key={action.id} action={action} />
          ))}
        </div>
      )}
      {secondary.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {secondary.map((action) => (
            <SecondaryActionTile key={action.id} action={action} />
          ))}
        </div>
      )}
    </section>
  );
}

function PrimaryActionTile({ action }: { action: QuickAction }) {
  return (
    <button
      type="button"
      onClick={(e) => action.onClick(e)}
      /* allow-arbitrary: rounded-[1.5rem]/rounded-[1.7rem] + bg-[radial-gradient(...)] + shadow-[...] — primary action tile chassis, no canonical token */
      className="group relative min-h-[176px] w-full touch-manipulation overflow-hidden rounded-[1.5rem] border border-orange-300/55 bg-[radial-gradient(circle_at_30%_-10%,rgba(249,115,22,0.55),transparent_55%),linear-gradient(155deg,rgba(234,88,12,0.32)_0%,rgba(120,53,15,0.28)_38%,rgba(15,11,8,0.92)_100%)] px-4 pb-4 pt-5 text-left shadow-[0_28px_56px_rgba(0,0,0,0.6),0_18px_44px_rgba(249,115,22,0.28)] ring-1 ring-inset ring-orange-200/[0.12] transition-all duration-200 hover:border-orange-200/75 hover:shadow-[0_30px_60px_rgba(0,0,0,0.65),0_22px_52px_rgba(249,115,22,0.42)] active:scale-[0.98] sm:min-h-[208px] sm:rounded-[1.7rem] sm:px-5 sm:pb-5 sm:pt-6"
    >
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/55 to-transparent" />
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-orange-400/30 blur-3xl transition group-hover:bg-orange-400/45" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-orange-700/24 blur-3xl" />
      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          {action.registryIcon ? (
            <AppIcon
              category={action.registryIcon.category}
              iconKey={action.registryIcon.key}
              alt=""
              size="lg"
              aria-hidden="true"
              /* allow-arbitrary: rounded-[1.35rem] + shadow-[...] — primary action icon chassis, no canonical token */
              className="h-[4.25rem] w-[4.25rem] rounded-[1.35rem] border border-orange-300/40 bg-[#0a0503]/72 p-3 shadow-[0_14px_32px_rgba(249,115,22,0.36),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-inset ring-white/[0.08] transition-transform duration-200 group-hover:scale-[1.04] sm:h-[5rem] sm:w-[5rem]"
              fallback={<span className="text-xl" aria-hidden>{action.icon}</span>}
            />
          ) : (
            /* allow-arbitrary: rounded-[1.35rem] + shadow-[...] — primary action icon chassis (emoji fallback), no canonical token */
            <span className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-[1.35rem] border border-white/10 bg-black/40 text-3xl shadow-[0_10px_24px_rgba(0,0,0,0.36)]" aria-hidden>{action.icon}</span>
          )}
          {/* allow-arbitrary: shadow-[inset_0_1px_0_...] — arrow chip inset highlight, no canonical token */}
          <span aria-hidden="true" className={`mt-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 ${ds.text.body11} font-black ${ds.color.mutedClass.body} shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:border-orange-200/55 group-hover:text-orange-100`}>→</span>
        </div>
        <div className="min-w-0">
          {/* allow-arbitrary: text-[17px]/sm:text-[22px] — between body14 and 22+ display tier, no canonical token */}
          <p className="text-[17px] font-black leading-[1.05] tracking-[-0.025em] text-white sm:text-[22px]">{action.title}</p>
          {/* allow-arbitrary: sm:text-[13px] — breakpoint-prefixed text size, ds.text.body{N} lacks breakpoint variants (deferred to PR D-primitives/B) */}
          <p className={`mt-1.5 line-clamp-2 ${ds.text.body11} font-medium leading-snug text-orange-100/72 sm:text-[13px] sm:leading-relaxed`}>{action.description}</p>
        </div>
      </div>
    </button>
  );
}

function SecondaryActionTile({ action }: { action: QuickAction }) {
  return (
    <button
      type="button"
      onClick={(e) => action.onClick(e)}
      /* allow-arbitrary: shadow-[0_14px_32px_...] — secondary tile lift, no canonical ds.shadow.* tier */
      className="group relative flex min-h-[88px] w-full touch-manipulation items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0807]/72 px-3.5 py-3 text-left shadow-[0_14px_32px_rgba(0,0,0,0.42)] ring-1 ring-inset ring-white/[0.04] backdrop-blur-xl transition-all duration-200 hover:border-orange-300/35 hover:bg-[#0d0a08]/82 active:scale-[0.98] sm:min-h-[100px] sm:px-4 sm:py-3.5"
    >
      <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      {action.registryIcon ? (
        <AppIcon
          category={action.registryIcon.category}
          iconKey={action.registryIcon.key}
          alt=""
          size="md"
          aria-hidden="true"
          /* allow-arbitrary: shadow-[inset_...,...] — secondary icon inset+lift, no canonical token */
          className="h-12 w-12 shrink-0 rounded-xl border border-white/[0.08] bg-black/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_18px_rgba(0,0,0,0.32)] transition group-hover:border-orange-300/30 sm:h-[3.25rem] sm:w-[3.25rem]"
          fallback={<span className="text-lg" aria-hidden>{action.icon}</span>}
        />
      ) : (
        /* allow-arbitrary: shadow-[inset_...,...] — secondary icon inset+lift (emoji fallback), no canonical token */
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/40 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_18px_rgba(0,0,0,0.32)] sm:h-[3.25rem] sm:w-[3.25rem]" aria-hidden>{action.icon}</span>
      )}
      <div className="min-w-0 flex-1">
        {/* allow-arbitrary: sm:text-[15px] — breakpoint-prefixed text size, ds.text.body{N} lacks breakpoint variants (deferred to PR D-primitives/B) */}
        <p className={`${ds.text.body14} font-black leading-tight tracking-[-0.015em] text-white sm:text-[15px]`}>{action.title}</p>
        <p className={`mt-0.5 line-clamp-1 ${ds.text.body11} font-medium leading-snug text-slate-400 sm:text-xs`}>{action.description}</p>
      </div>
      <span aria-hidden="true" className={`ml-1 shrink-0 text-base font-black ${ds.color.mutedClass.disabled} transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-orange-200/55`}>→</span>
    </button>
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
    <section className={`${ds.panel.subpanel} relative flex items-center justify-between gap-3 overflow-hidden px-4 py-3 backdrop-blur-xl sm:px-5`}>
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="min-w-0">
        <p className={`truncate ${ds.text.body10} font-black uppercase tracking-[0.18em] ${ds.color.mutedClass.secondary}`}>
          {t.homeSettingsKicker}
        </p>
        <p className={`mt-0.5 truncate ${ds.text.body11} font-medium text-slate-500`}>
          {t.homeSettingsSub}
        </p>
      </div>

      <select
        value={lang}
        onChange={(e) => onLangChange(e.target.value as Lang)}
        className="min-h-9 shrink-0 rounded-xl border border-white/[0.1] bg-[#050302]/70 px-3 text-xs font-bold text-slate-100 shadow-inner shadow-black/40 outline-none transition focus:border-orange-400/60 focus:ring-2 focus:ring-orange-500/15"
      >
        <option value="es">🇪🇸 {t.homeLangSpanish}</option>
        <option value="en">🇬🇧 {t.homeLangEnglish}</option>
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
      emphasized: true,
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
