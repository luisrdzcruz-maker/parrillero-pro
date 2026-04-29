"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { Mode } from "@/components/navigation/AppHeader";
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
      className={`transition-[opacity,transform] duration-500 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

// ─── Live feature card (full-width, large) ────────────────────────────────────

function LiveFeatureCard({ onClick }: { onClick: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[220px] w-full touch-manipulation overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-left transition-all duration-300 hover:border-orange-400/30 hover:shadow-[0_0_64px_rgba(255,106,0,0.18)] active:scale-[0.99] sm:min-h-[260px]"
    >
      {/* Background image */}
      {!imgError ? (
        <Image
          src="/images/vacuno/tomahawk-cooked.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-zinc-950 to-black" />
      )}

      {/* Heavy bottom gradient so text pops */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/68 to-black/10" />
      {/* Left warm glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(255,106,0,0.24),transparent_55%)]" />
      {/* Top shimmer on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[220px] flex-col justify-between p-5 sm:min-h-[260px] sm:p-7">
        {/* Top badges */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/15 px-2.5 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Live</span>
          </span>
          <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-slate-400 backdrop-blur-sm">
            Cooking Mode
          </span>
        </div>

        {/* Bottom: title + CTA row */}
        <div>
          <h2 className="text-xl font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-2xl">
            Cocina paso a paso con
            <br />
            <span className="text-orange-300">temporizador inteligente.</span>
          </h2>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-slate-400">Guía en tiempo real</p>
            <span className="flex shrink-0 items-center gap-2 rounded-2xl border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-[13px] font-black text-orange-200 backdrop-blur-sm transition-all duration-200 group-hover:border-orange-400/45 group-hover:bg-orange-500/22">
              Iniciar experiencia
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Quick action card (2×2 grid) ────────────────────────────────────────────

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
      className="group relative min-h-[148px] touch-manipulation select-none overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 text-left transition-all duration-200 hover:border-orange-400/25 hover:shadow-[0_4px_28px_rgba(255,106,0,0.12)] active:scale-[0.97] sm:min-h-[168px]"
    >
      {/* Background image */}
      {!imgError ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 640px) 50vw, 50vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.06]"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,106,0,0.2),transparent_45%),linear-gradient(145deg,#18181b,#030303)]" />
      )}

      {/* Bottom-heavy gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/94 via-black/60 to-black/12" />
      {/* Warm top-corner tint */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,106,0,0.15),transparent_42%)]" />
      {/* Hover glow blob */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-500/0 blur-2xl transition-all duration-300 group-hover:bg-orange-500/14" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[148px] flex-col justify-between p-4 sm:min-h-[168px] sm:p-5">
        {/* Icon chip */}
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-lg shadow-sm backdrop-blur-sm">
          {icon}
        </span>

        {/* Label + hint */}
        <div>
          <p className="text-[15px] font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {label}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[12px] font-medium leading-[1.35] text-slate-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {sub}
          </p>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-orange-300/85">
            <span>Abrir</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
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
    <section className="mb-24 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 backdrop-blur sm:px-4 lg:mb-0">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
          IA Parrillero Pro
        </p>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
          Como un chef profesional, sin esfuerzo.
        </p>
      </div>

      <select
        value={lang}
        onChange={(e) => onLangChange(e.target.value as Lang)}
        className="min-h-9 shrink-0 rounded-xl border border-white/10 bg-black/35 px-2.5 text-xs font-bold text-slate-200 outline-none transition focus:border-orange-400/60"
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
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  savedMenusCount: number;
  onModeChange: (mode: Mode) => void;
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
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#020617] px-6 pb-8 pt-8 shadow-2xl shadow-black/60 sm:px-8 sm:pb-10 sm:pt-10">
          {/* Ambient orange blobs */}
          <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-orange-400/8 blur-3xl" />
          {/* Top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />

          <div className="relative z-10">
            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/22 bg-orange-500/10 px-3 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                Asistente de cocción
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-5 text-[clamp(2.8rem,11vw,5rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">
              Parrillero
              <br />
              <span className="text-orange-400">Pro</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 max-w-[28ch] text-[15px] font-medium leading-[1.6] text-slate-400 sm:text-base">
              Tu asistente en tiempo real para cocinar mejor.
            </p>

            {/* CTA with glow halo */}
            <div className="relative mt-7 inline-block">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-2 rounded-[20px] bg-orange-500/22 blur-xl"
              />
              <Button
                className="relative min-h-[52px] touch-manipulation rounded-2xl px-8 py-3.5 text-base font-black shadow-[0_8px_36px_rgba(255,106,0,0.40)] transition-all duration-200 active:scale-[0.97] sm:px-10"
                onClick={() => onModeChange("coccion")}
              >
                Empezar cocción <span aria-hidden="true" className="ml-1">→</span>
              </Button>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Live Feature Card ─────────────────────────────────────────────── */}
      <FadeIn delay={80}>
        <LiveFeatureCard onClick={() => router.push("/coccion-live")} />
      </FadeIn>

      {/* ── Quick Actions 2×2 ─────────────────────────────────────────────── */}
      <FadeIn delay={160}>
        <section>
          <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
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
      <HomeSettingsStrip lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
