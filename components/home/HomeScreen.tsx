"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { Mode } from "@/components/navigation/AppHeader";
import type { Animal } from "@/lib/media/animalMedia";
import type { AppText, Lang } from "@/lib/i18n/texts";
import { type ReactNode, useLayoutEffect, useState } from "react";

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
  onStartCooking,
  onPlanSession,
}: {
  onStartCooking: () => void;
  onPlanSession: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#020617] px-6 pb-9 pt-9 shadow-2xl shadow-black/70 sm:px-8 sm:pb-12 sm:pt-12">
      {/* Animated fire blobs */}
      <div
        className="animate-fire-breathe pointer-events-none absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(234,88,12,0.22) 0%, transparent 65%)" }}
      />
      <div
        className="animate-fire-drift pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 60%)",
          animationDelay: "1.8s",
        }}
      />

      {/* Diagonal shimmer ray */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          background: "linear-gradient(115deg, transparent 30%, rgba(251,146,60,0.8) 50%, transparent 70%)",
        }}
      />
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
      {/* Bottom vignette */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#020617] to-transparent" />

      <div className="relative z-10">
        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/12 px-3.5 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.9)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
            Asistente IA
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-6 text-[clamp(3.2rem,13vw,5.5rem)] font-black leading-[0.86] tracking-[-0.06em] text-white">
          Parrillero
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 100%)" }}
          >
            Pro.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 max-w-[26ch] text-[15px] font-medium leading-[1.65] text-slate-400 sm:text-base">
          Tu chef en tiempo real para cada corte. Temporizadores, zonas y guía paso a paso.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {/* Primary */}
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-[22px] blur-xl"
              style={{ background: "rgba(234,88,12,0.30)" }}
            />
            <Button
              className="relative min-h-[54px] touch-manipulation rounded-2xl px-8 py-3.5 text-base font-black shadow-[0_10px_40px_rgba(234,88,12,0.50)] transition-all duration-200 active:scale-[0.97]"
              onClick={onStartCooking}
            >
              Empezar cocción <span aria-hidden className="ml-1.5">→</span>
            </Button>
          </div>

          {/* Secondary */}
          <button
            type="button"
            onClick={onPlanSession}
            className="min-h-[54px] touch-manipulation rounded-2xl border border-white/12 bg-white/[0.04] px-7 py-3.5 text-base font-bold text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-white/22 hover:bg-white/[0.07] hover:text-white active:scale-[0.97]"
          >
            Planificar parrillada
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Animal quick-pick shelf ───────────────────────────────────────────────────
// Horizontal scroll row — each card pre-selects protein and jumps to cut step.

type AnimalEntry = {
  animal: Animal;
  label: string;
  emoji: string;
  image: string;
  hint: string;
};

const ANIMAL_ENTRIES: AnimalEntry[] = [
  {
    animal: "Vacuno",
    label: "Vacuno",
    emoji: "🥩",
    image: "/images/vacuno/ribeye-cooked.webp",
    hint: "Chuletón, picanha…",
  },
  {
    animal: "Cerdo",
    label: "Cerdo",
    emoji: "🐷",
    image: "/images/cerdo/ribs-bbq.webp",
    hint: "Costillas, secreto…",
  },
  {
    animal: "Pollo",
    label: "Pollo",
    emoji: "🍗",
    image: "/images/pollo/muslos-cooked.webp",
    hint: "Muslos, alitas…",
  },
  {
    animal: "Verduras",
    label: "Verduras",
    emoji: "🌿",
    image: "/images/verduras/pimientos.webp",
    hint: "Pimientos, maíz…",
  },
];

function AnimalQuickCard({
  entry,
  onClick,
}: {
  entry: AnimalEntry;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-[42vw] max-w-[180px] shrink-0 touch-manipulation snap-start overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950 text-left transition-all duration-200 hover:border-orange-400/30 hover:shadow-[0_6px_32px_rgba(255,106,0,0.18)] active:scale-[0.95] sm:w-[160px]"
      style={{ minHeight: "120px" }}
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
      <div className="relative z-10 flex h-full min-h-[120px] flex-col justify-between p-3">
        {/* Emoji chip */}
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-base shadow-sm backdrop-blur-sm">
          {entry.emoji}
        </span>

        {/* Label */}
        <div>
          <p className="text-[15px] font-black tracking-[-0.02em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {entry.label}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {entry.hint}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Live feature card (full-width hero card) ─────────────────────────────────

function LiveFeatureCard({ onClick }: { onClick: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[260px] w-full touch-manipulation overflow-hidden rounded-3xl border border-orange-500/20 bg-zinc-950 text-left transition-all duration-300 hover:border-orange-400/45 hover:shadow-[0_0_90px_rgba(255,106,0,0.24)] active:scale-[0.99] sm:min-h-[300px]"
    >
      {/* Background image */}
      {!imgError ? (
        <Image
          src="/images/vacuno/tomahawk-cooked.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-zinc-950 to-black" />
      )}

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/74 to-black/18" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(255,106,0,0.30),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_88%_8%,rgba(255,60,0,0.12),transparent_45%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[260px] flex-col justify-between p-6 sm:min-h-[300px] sm:p-8">
        {/* Badge row */}
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400 shadow-[0_0_7px_rgba(248,113,113,0.85)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-red-200">Live</span>
          </span>
          <span className="rounded-full border border-white/10 bg-black/42 px-3 py-1.5 text-[10px] font-semibold text-slate-400 backdrop-blur-sm">
            Guía en tiempo real
          </span>
        </div>

        {/* Bottom: title + CTA */}
        <div>
          <h2 className="text-2xl font-black leading-[1.1] tracking-[-0.03em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)] sm:text-3xl">
            Cocina paso a paso
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #fdba74 0%, #fb923c 55%, #f97316 100%)",
              }}
            >
              con temporizador inteligente.
            </span>
          </h2>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">Cooking Mode</p>
            <span className="flex shrink-0 items-center gap-2 rounded-2xl border border-orange-400/38 bg-orange-500/18 px-5 py-2.5 text-sm font-black text-orange-100 backdrop-blur-sm transition-all duration-200 group-hover:border-orange-400/60 group-hover:bg-orange-500/28 group-hover:shadow-[0_4px_24px_rgba(234,88,12,0.30)]">
              Iniciar experiencia
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </span>
          </div>
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
  onClick,
}: {
  icon: string;
  image: string;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[180px] touch-manipulation select-none overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950 text-left transition-all duration-300 hover:border-orange-400/30 hover:shadow-[0_8px_48px_rgba(255,106,0,0.16)] active:scale-[0.96] sm:min-h-[210px]"
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/97 via-black/68 to-black/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,106,0,0.18),transparent_42%)]" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-orange-500/0 blur-3xl transition-all duration-500 group-hover:bg-orange-500/20" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-400/0 to-transparent transition-all duration-300 group-hover:via-orange-400/50" />

      <div className="relative z-10 flex min-h-[180px] flex-col justify-between p-4 sm:min-h-[210px] sm:p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/18 bg-black/58 text-[22px] shadow-[0_2px_16px_rgba(0,0,0,0.7)] backdrop-blur-md">
          {icon}
        </span>

        <div>
          <p className="text-[16px] font-black tracking-[-0.025em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            {label}
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-[1.4] text-slate-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {sub}
          </p>
          <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-orange-300/90">
            <span>Abrir</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Settings strip ───────────────────────────────────────────────────────────

function HomeSettingsStrip({
  lang,
  onLangChange,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
}) {
  return (
    <section className="mb-24 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 backdrop-blur sm:px-5 lg:mb-0">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
          IA Parrillero Pro
        </p>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
          Como un chef profesional, sin esfuerzo.
        </p>
      </div>

      <select
        value={lang}
        onChange={(e) => onLangChange(e.target.value as Lang)}
        className="min-h-9 shrink-0 rounded-xl border border-white/10 bg-black/40 px-2.5 text-xs font-bold text-slate-200 outline-none transition focus:border-orange-400/60"
      >
        <option value="es">🇪🇸 Español</option>
        <option value="en">🇬🇧 English</option>
        <option value="fi">🇫🇮 Suomi</option>
      </select>
    </section>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export function HomeScreen({
  lang,
  onLangChange,
  savedMenusCount,
  onModeChange,
  onStartCookingWith,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  savedMenusCount: number;
  onModeChange: (mode: Mode) => void;
  onStartCookingWith?: (animal: Animal) => void;
  // t accepted for API compatibility
  t: AppText;
}) {
  const router = useRouter();

  const quickActions: { icon: string; image: string; label: string; sub: string; mode: Mode }[] = [
    {
      icon: "🥩",
      image: "/images/vacuno/ribeye-cooked.webp",
      label: "Cocción",
      sub: "Plan + guía paso a paso",
      mode: "coccion",
    },
    {
      icon: "📋",
      image: "/images/verduras/pimientos.webp",
      label: "Menú",
      sub: "Para grupos y eventos",
      mode: "menu",
    },
    {
      icon: "🔥",
      image: "/images/cerdo/ribs-bbq.webp",
      label: "Parrillada",
      sub: "Múltiples piezas, timing claro",
      mode: "plan",
    },
    {
      icon: "📚",
      image: "/images/pollo/muslos-cooked.webp",
      label: "Guardados",
      sub:
        savedMenusCount > 0
          ? `${savedMenusCount} plan${savedMenusCount === 1 ? "" : "es"} guardados`
          : "Tu biblioteca",
      mode: "guardados",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 overflow-x-hidden sm:space-y-4 lg:max-w-3xl">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <FadeIn>
        <HeroSection
          onStartCooking={() => onModeChange("coccion")}
          onPlanSession={() => onModeChange("plan")}
        />
      </FadeIn>

      {/* ── Animal quick-pick shelf ────────────────────────────────────────── */}
      <FadeIn delay={60}>
        <section>
          <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.24em] text-white/22">
            ¿Qué vas a cocinar?
          </p>
          {/* Horizontal scroll — hides scrollbar visually but stays accessible */}
          <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ANIMAL_ENTRIES.map((entry) => (
              <AnimalQuickCard
                key={entry.animal}
                entry={entry}
                onClick={() =>
                  onStartCookingWith
                    ? onStartCookingWith(entry.animal)
                    : onModeChange("coccion")
                }
              />
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── Live Feature Card ─────────────────────────────────────────────── */}
      <FadeIn delay={120}>
        <LiveFeatureCard onClick={() => router.push("/coccion-live")} />
      </FadeIn>

      {/* ── Quick Actions 2×2 ─────────────────────────────────────────────── */}
      <FadeIn delay={200}>
        <section>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/22">
            Acciones rápidas
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.mode}
                icon={action.icon}
                image={action.image}
                label={action.label}
                sub={action.sub}
                onClick={() => onModeChange(action.mode)}
              />
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── Settings strip ─────────────────────────────────────────────────── */}
      <FadeIn delay={280}>
        <HomeSettingsStrip lang={lang} onLangChange={onLangChange} />
      </FadeIn>
    </div>
  );
}
