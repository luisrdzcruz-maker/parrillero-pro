"use client";

import { useRouter } from "next/navigation";
import type { Mode } from "@/components/navigation/AppHeader";
import { buildCookingDetailsUrl } from "@/lib/navigation/cookingNavigation";
import type { Animal } from "@/lib/types/domain";
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

function HeroSection({
  t,
  onStartCooking,
  onPlanBbq,
  onUnknown,
}: {
  t: AppText;
  onStartCooking: (e: MouseEvent<HTMLButtonElement>) => void;
  onPlanBbq: () => void;
  onUnknown: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-orange-300/12 bg-[#050301] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.72)] sm:px-7 sm:py-8">
      <div
        className="animate-fire-breathe pointer-events-none absolute -left-28 -top-32 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(234,88,12,0.28) 0%, transparent 66%)" }}
      />
      <div
        className="animate-fire-drift pointer-events-none absolute -bottom-28 right-[-5rem] h-72 w-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251,146,60,0.18) 0%, transparent 62%)",
          animationDelay: "1.8s",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 32%, transparent 68%, rgba(251,146,60,0.18) 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="relative z-10 max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/12 px-3 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.9)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
            {t.homeEyebrow}
          </span>
        </div>

        <h1 className="mt-4 text-[clamp(2.15rem,9.2vw,4rem)] font-black leading-[0.95] tracking-[-0.055em] text-white">
          {t.homeTitle}
        </h1>

        <p className="mt-3 max-w-[34rem] text-[14px] font-medium leading-[1.55] text-stone-300/78 sm:text-base">
          {t.homeSubtitle}
        </p>

        <div className="mt-6 grid gap-2.5">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-[24px] bg-orange-500/30 blur-xl"
            />
            <button
              type="button"
              onClick={onStartCooking}
              className="relative min-h-[56px] w-full touch-manipulation rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-black shadow-[0_10px_40px_rgba(234,88,12,0.45)] transition-all duration-200 hover:bg-orange-400 active:scale-[0.98] sm:text-base"
            >
              {t.homePrimaryCta} <span aria-hidden className="ml-1.5">→</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onPlanBbq}
              className="min-h-[48px] touch-manipulation rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-black text-white transition-all duration-200 hover:border-orange-300/30 hover:bg-white/[0.08] active:scale-[0.98]"
            >
              {t.homeSecondaryCta}
            </button>
            <button
              type="button"
              onClick={onUnknown}
              className="min-h-[48px] touch-manipulation rounded-2xl border border-orange-300/18 bg-orange-500/10 px-4 py-3 text-sm font-black text-orange-100 transition-all duration-200 hover:border-orange-300/40 hover:bg-orange-500/14 active:scale-[0.98]"
            >
              {t.homeUnknownCta}
            </button>
          </div>
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
    <section className="mb-24 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 backdrop-blur sm:px-5 lg:mb-0">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
          {t.homeSettingsKicker}
        </p>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
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
  onModeChange,
  t,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  savedMenusCount: number;
  onModeChange: (mode: Mode) => void;
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
    router.push(
      buildCookingDetailsUrl({
        animal: cut.animal,
        cutId: cut.cutId,
        doneness: cut.doneness,
        thickness: cut.thickness,
      }),
    );
  }

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

    <div className="mx-auto w-full max-w-2xl space-y-3 overflow-x-hidden sm:space-y-4 lg:max-w-3xl">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <FadeIn>
        <HeroSection
          t={t}
          onStartCooking={(e) =>
            fireRipple(e.clientX, e.clientY, () => router.push("/?mode=coccion&step=cut&animal=beef"))
          }
          onPlanBbq={() => onModeChange("plan")}
          onUnknown={() => onModeChange("plan")}
        />
      </FadeIn>

      {/* ── Popular cuts ───────────────────────────────────────────────────── */}
      <FadeIn delay={60}>
        <PopularCuts
          cuts={popularCuts}
          title={t.homePopularCutsTitle}
          onSelect={(cut, e) => fireRipple(e.clientX, e.clientY, () => openPopularCut(cut))}
        />
      </FadeIn>

      {/* ── Settings strip ─────────────────────────────────────────────────── */}
      <FadeIn delay={120}>
        <HomeSettingsStrip t={t} lang={lang} onLangChange={onLangChange} />
      </FadeIn>
    </div>
    </>
  );
}
