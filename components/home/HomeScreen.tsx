"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Mode } from "@/components/navigation/AppHeader";
import type { AnimalLabel } from "@/lib/media/animalMedia";
import type { AppText, Lang } from "@/lib/i18n/texts";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";
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
}: {
  t: AppText;
  onStartCooking: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const chips = [t.homeChipDoneness, t.homeChipTiming, t.homeChipNoGuesswork];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-orange-300/12 bg-[#050301] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.72)] sm:px-7 sm:py-7">
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

        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-bold text-stone-200/82 backdrop-blur-sm"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="relative mt-5 inline-flex">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-[22px] bg-orange-500/30 blur-xl"
          />
          <button
            type="button"
            onClick={onStartCooking}
            className="relative min-h-[50px] touch-manipulation rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-black shadow-[0_10px_40px_rgba(234,88,12,0.45)] transition-all duration-200 hover:bg-orange-400 active:scale-[0.97] sm:text-base"
          >
            {t.homePrimaryCta} <span aria-hidden className="ml-1.5">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Animal quick-pick shelf ───────────────────────────────────────────────────
// Horizontal scroll row — each card pre-selects protein and jumps to cut step.

type HomeAnimal = Exclude<AnimalLabel, "Pescado">;

type AnimalEntry = {
  animal: HomeAnimal;
  emoji: string;
  image: string;
};

const ANIMAL_ENTRIES: AnimalEntry[] = [
  {
    animal: "Vacuno",
    emoji: "🥩",
    image: "/images/vacuno/ribeye-cooked.webp",
  },
  {
    animal: "Cerdo",
    emoji: "🐷",
    image: "/images/cerdo/ribs-bbq.webp",
  },
  {
    animal: "Pollo",
    emoji: "🍗",
    image: "/images/pollo/muslos-cooked.webp",
  },
  {
    animal: "Verduras",
    emoji: "🌿",
    image: "/images/verduras/pimientos.webp",
  },
];

function getAnimalCopy(t: AppText, animal: HomeAnimal) {
  switch (animal) {
    case "Vacuno":
      return { label: t.homeAnimalBeef, hint: t.homeAnimalBeefHint };
    case "Cerdo":
      return { label: t.homeAnimalPork, hint: t.homeAnimalPorkHint };
    case "Pollo":
      return { label: t.homeAnimalChicken, hint: t.homeAnimalChickenHint };
    case "Verduras":
      return { label: t.homeAnimalVegetables, hint: t.homeAnimalVegetablesHint };
  }
}

function AnimalQuickCard({
  entry,
  t,
  onClick,
}: {
  entry: AnimalEntry;
  t: AppText;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const copy = getAnimalCopy(t, entry.animal);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-[40vw] max-w-[172px] shrink-0 touch-manipulation snap-start overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950 text-left transition-all duration-200 hover:border-orange-400/30 hover:shadow-[0_6px_32px_rgba(255,106,0,0.18)] active:scale-[0.95] sm:w-[160px]"
      style={{ minHeight: "112px" }}
    >
      {/* Background image */}
      {!imgError ? (
        <Image
          src={entry.image}
          alt=""
          fill
          sizes="180px"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.10]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/60 via-zinc-900 to-black" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/08" />
      {/* Warm tint */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,106,0,0.16),transparent_45%)]" />
      {/* Hover border glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-400/0 to-transparent transition-all duration-300 group-hover:via-orange-400/55" />

      {/* Content */}
      <div className="relative z-10 flex h-full min-h-[112px] flex-col justify-between p-3">
        {/* Emoji chip */}
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-base shadow-sm backdrop-blur-sm">
          {entry.emoji}
        </span>

        {/* Label */}
        <div>
          <p className="text-[15px] font-black tracking-[-0.02em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {copy.label}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {copy.hint}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Quick action card (2 × 2 grid) ──────────────────────────────────────────

function QuickActionCard({
  icon,
  image,
  label,
  sub,
  accent = "orange",
  onClick,
}: {
  icon: string;
  image: string;
  label: string;
  sub: string;
  accent?: "orange" | "red";
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const accentClass =
    accent === "red"
      ? "border-red-400/35 bg-red-500/14 text-red-100"
      : "border-orange-400/35 bg-orange-500/14 text-orange-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[118px] touch-manipulation select-none overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 text-left transition-all duration-300 hover:border-orange-400/30 hover:shadow-[0_8px_48px_rgba(255,106,0,0.16)] active:scale-[0.96] sm:min-h-[150px]"
    >
      {!imgError ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 640px) 50vw, 50vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.08]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,106,0,0.22),transparent_48%),linear-gradient(145deg,#18181b,#030303)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/76 to-black/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,106,0,0.18),transparent_42%)]" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-orange-500/0 blur-3xl transition-all duration-500 group-hover:bg-orange-500/20" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-400/0 to-transparent transition-all duration-300 group-hover:via-orange-400/50" />

      <div className="relative z-10 flex min-h-[118px] flex-col justify-between p-3.5 sm:min-h-[150px] sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/18 bg-black/60 text-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.7)] backdrop-blur-md">
            {icon}
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur-sm ${accentClass}`}>
            <span aria-hidden>→</span>
          </span>
        </div>

        <div>
          <p className="text-[15px] font-black leading-tight tracking-[-0.025em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] sm:text-[16px]">
            {label}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-[1.35] text-stone-300/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:text-[12px]">
            {sub}
          </p>
        </div>
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
  savedMenusCount,
  onModeChange,
  onStartCookingWith,
  t,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  savedMenusCount: number;
  onModeChange: (mode: Mode) => void;
  onStartCookingWith?: (animal: AnimalLabel) => void;
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

  const savedSub =
    savedMenusCount > 0
      ? `${savedMenusCount} ${savedMenusCount === 1 ? t.homeSavedPlanSingular : t.homeSavedPlanPlural}`
      : t.homeSavedSubEmpty;

  const quickActions: {
    icon: string;
    image: string;
    label: string;
    sub: string;
    accent?: "orange" | "red";
    onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  }[] = [
    {
      icon: "🥩",
      image: "/images/vacuno/ribeye-cooked.webp",
      label: t.homeGuidedCooking,
      sub: t.homeGuidedCookingSub,
      onClick: (e) => fireRipple(e.clientX, e.clientY, () => onModeChange("coccion")),
    },
    {
      icon: "🍖",
      image: "/images/cerdo/ribs-bbq.webp",
      label: t.homeParrillada,
      sub: t.homeParrilladaSub,
      onClick: () => onModeChange("plan"),
    },
    {
      icon: "🔥",
      image: "/images/vacuno/tomahawk-cooked.webp",
      label: t.homeLiveCooking,
      sub: t.homeLiveCookingSub,
      accent: "red",
      onClick: () => {
        router.push(buildLiveUrl({}));
      },
    },
    {
      icon: "📚",
      image: "/images/pollo/muslos-cooked.webp",
      label: t.homeSaved,
      sub: savedSub,
      onClick: () => onModeChange("guardados"),
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

    <div className="mx-auto w-full max-w-2xl space-y-3 overflow-x-hidden sm:space-y-4 lg:max-w-3xl">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <FadeIn>
        <HeroSection
          t={t}
          onStartCooking={(e) => fireRipple(e.clientX, e.clientY, () => onModeChange("coccion"))}
        />
      </FadeIn>

      {/* ── Primary Actions 2×2 ───────────────────────────────────────────── */}
      <FadeIn delay={60}>
        <section>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/28">
            {t.homeActionsTitle}
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.label}
                icon={action.icon}
                image={action.image}
                label={action.label}
                sub={action.sub}
                accent={action.accent}
                onClick={action.onClick}
              />
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── Animal quick-pick shelf ────────────────────────────────────────── */}
      <FadeIn delay={120}>
        <section>
          <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.24em] text-white/22">
            {t.homeAnimalTitle}
          </p>
          {/* Horizontal scroll — hides scrollbar visually but stays accessible */}
          <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ANIMAL_ENTRIES.map((entry) => (
              <AnimalQuickCard
                key={entry.animal}
                entry={entry}
                t={t}
                onClick={(e) =>
                  fireRipple(e.clientX, e.clientY, () =>
                    onStartCookingWith
                      ? onStartCookingWith(entry.animal)
                      : onModeChange("coccion"),
                  )
                }
              />
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── Settings strip ─────────────────────────────────────────────────── */}
      <FadeIn delay={200}>
        <HomeSettingsStrip t={t} lang={lang} onLangChange={onLangChange} />
      </FadeIn>
    </div>
    </>
  );
}
