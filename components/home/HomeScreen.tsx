"use client";

import Image from "next/image";
import { AppIcon } from "@/components/ui/AppIcon";
import type { Mode } from "@/components/navigation/AppHeader";
import { ds } from "@/lib/design-system";
import type { IconCategory } from "@/lib/assets/iconTypes";
import type { AppText, Lang } from "@/lib/i18n/texts";
import { type MouseEvent, type ReactNode, useLayoutEffect, useState } from "react";

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
        <p className={`${ds.text.body10} font-black uppercase tracking-[0.28em] ${ds.color.mutedClass.helper}`}>
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
      <div className="flex flex-col gap-3.5 sm:gap-4">
        {actions.map((action) => (
          <PrimaryActionTile key={action.id} action={action} />
        ))}
      </div>
    </section>
  );
}

function PrimaryActionTile({ action }: { action: QuickAction }) {
  return (
    <button
      type="button"
      onClick={(e) => action.onClick(e)}
      /* allow-arbitrary: rounded-[1.5rem]/rounded-[1.7rem] + bg-[radial-gradient(...)] + shadow-[...] — primary action tile chassis, no canonical token */
      className="group relative min-h-[208px] w-full touch-manipulation overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_30%_-10%,rgba(249,115,22,0.55),transparent_55%),linear-gradient(155deg,rgba(234,88,12,0.32)_0%,rgba(120,53,15,0.28)_38%,rgba(15,11,8,0.92)_100%)] px-4 pb-5 pt-6 text-center shadow-[0_28px_56px_rgba(0,0,0,0.6),0_18px_44px_rgba(249,115,22,0.28)] ring-1 ring-inset ring-orange-200/[0.12] transition-all duration-200 hover:shadow-[0_30px_60px_rgba(0,0,0,0.65),0_22px_52px_rgba(249,115,22,0.42)] active:scale-[0.98] sm:min-h-[232px] sm:rounded-[1.7rem] sm:px-5 sm:pb-6 sm:pt-7"
    >
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/55 to-transparent" />
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-orange-400/30 blur-3xl transition group-hover:bg-orange-400/45" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-orange-700/24 blur-3xl" />
      <div className="relative flex h-full min-w-0 flex-col items-center justify-center gap-4 sm:gap-5">
        {action.registryIcon ? (
          <AppIcon
            category={action.registryIcon.category}
            iconKey={action.registryIcon.key}
            alt=""
            size="lg"
            aria-hidden="true"
            /* allow-arbitrary: rounded-[1.5rem] + shadow-[...] — primary action icon chassis (hero size), no canonical token */
            className="h-[6.25rem] w-[6.25rem] rounded-[1.5rem] border border-orange-300/40 bg-[#0a0503]/72 p-4 shadow-[0_14px_32px_rgba(249,115,22,0.36),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-inset ring-white/[0.08] transition-transform duration-200 group-hover:scale-[1.04] sm:h-[7.5rem] sm:w-[7.5rem] sm:p-5"
            fallback={<span className="text-4xl sm:text-5xl" aria-hidden>{action.icon}</span>}
          />
        ) : (
          /* allow-arbitrary: rounded-[1.5rem] + shadow-[...] — primary action icon chassis (emoji fallback, hero size), no canonical token */
          <span className="flex h-[6.25rem] w-[6.25rem] shrink-0 items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/40 text-4xl shadow-[0_10px_24px_rgba(0,0,0,0.36)] sm:h-[7.5rem] sm:w-[7.5rem] sm:text-5xl" aria-hidden>{action.icon}</span>
        )}
        {/* Single-word label — card identity, full-strength white */}
        <p className="text-xl font-black leading-none tracking-[-0.01em] text-white sm:text-2xl">
          {action.title}
        </p>
      </div>
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
        className="min-h-11 shrink-0 rounded-xl border border-white/[0.1] bg-[#050302]/70 px-3 text-xs font-bold text-slate-100 shadow-inner shadow-black/40 outline-none transition focus:border-orange-400/60 focus:ring-2 focus:ring-orange-500/15"
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
  onModeChange,
  onPrimaryCtaClick,
  t,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onModeChange: (mode: Mode) => void;
  onPrimaryCtaClick?: () => void;
  t: AppText;
}) {
  // Radial ripple that plays on tap then resolves into the cooking screen
  const [ripple, setRipple] = useState<RippleState>(null);

  function fireRipple(x: number, y: number, action: () => void) {
    setRipple({ x, y, id: Date.now() });
    // Fire the action mid-animation (feels instant to the user)
    setTimeout(action, 150);
  }

  const quickActions: QuickAction[] = [
    {
      id: "start-cooking",
      icon: "🥩",
      registryIcon: { category: "ui", key: "meat-selection" },
      title: t.homeStartCookTitle,
      onClick: (e) =>
        fireRipple(e.clientX, e.clientY, () => (onPrimaryCtaClick ? onPrimaryCtaClick() : onModeChange("coccion"))),
    },
    {
      id: "plan-bbq",
      icon: "🧭",
      registryIcon: { category: "ui", key: "cooking-dashboard" },
      title: t.homeStartParrilladaTitle,
      onClick: () => onModeChange("plan"),
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
