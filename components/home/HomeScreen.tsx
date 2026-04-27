"use client";

import { Badge, Button, Panel } from "@/components/ui";
import type { Mode } from "@/components/navigation/AppHeader";
import { ds } from "@/lib/design-system";
import type { AppText } from "@/lib/i18n/texts";
import { type ReactNode, useLayoutEffect, useState } from "react";

function FadeInSection({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        entered ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
      } transition-[opacity,transform] duration-300 ease-out`}
    >
      {children}
    </div>
  );
}

export function HomeScreen({
  savedMenusCount,
  onModeChange,
  t,
}: {
  savedMenusCount: number;
  onModeChange: (mode: Mode) => void;
  t: AppText;
}) {
  const featureCards = [
    {
      description: "Cantidades y compra para eventos.",
      emoji: "🍽️",
      mode: "menu" as const,
      priority: "Menú",
      stat: "Menú completo",
      title: t.createMenu,
    },
    {
      description: "Zonas y tiempos para grupos.",
      emoji: "🔥",
      mode: "parrillada" as const,
      priority: "Parrillada",
      stat: "Timeline + zonas",
      title: t.parrilladaPro,
    },
    {
      description: "Temporizador del plan activo.",
      emoji: "⏱️",
      mode: "cocina" as const,
      priority: "En vivo",
      stat: "Live cooking",
      title: t.liveMode,
    },
    {
      description: "Repite tus planes favoritos.",
      emoji: "⭐",
      mode: "guardados" as const,
      priority: "Biblioteca",
      stat: `${savedMenusCount} ${t.saved}`,
      title: t.savedMenus,
    },
  ];

  return (
    <div className="space-y-2 sm:space-y-7">
      <section className="grid gap-2 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <Panel className="relative p-2 sm:p-7 lg:min-h-[360px]" tone="hero">
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-8 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />

          <FadeInSection>
            <div className="relative z-10 flex h-full flex-col justify-between gap-2 sm:gap-7">
              <div>
                <div className="hidden flex-wrap items-center gap-2 sm:flex">
                  <Badge className="uppercase tracking-[0.16em] sm:tracking-[0.2em]">
                    Parrillero Pro
                  </Badge>
                  <Badge
                    className="border-orange-400/20 bg-black/25 text-[11px] text-orange-200"
                    tone="glass"
                  >
                    Corte → Fuego → Pasos
                  </Badge>
                </div>

                <h1 className="mt-0 max-w-2xl text-[1.45rem] font-black leading-[1.05] tracking-[-0.045em] text-white sm:mt-5 sm:text-5xl lg:text-6xl">
                  {t.title}
                </h1>
                <p className="mt-1 max-w-xl text-[12px] leading-snug text-slate-300 sm:mt-4 sm:text-lg sm:leading-7">
                  {t.subtitle}
                </p>

                <div className="mt-2 grid gap-2 sm:mt-7 sm:flex sm:gap-3">
                  <Button
                    className="touch-manipulation px-5 py-2.5 text-sm font-black shadow-orange-500/30 transition-all duration-200 active:scale-[0.97] active:brightness-95 sm:px-7 sm:py-4 sm:text-base"
                    fullWidth
                    onClick={() => onModeChange("coccion")}
                  >
                    {t.planCooking} <span aria-hidden="true">→</span>
                  </Button>
                </div>
              </div>

              <HomeFlowPreview />

              <div className="hidden grid-cols-3 gap-2 text-sm text-slate-300 sm:grid sm:gap-3">
                <TrustItem label={t.localEngine} value="Cortes premium" />
                <TrustItem label="Timeline live" value={t.liveMode} />
                <TrustItem label={t.savedMenus} value={`${savedMenusCount} ${t.saved}`} />
              </div>
            </div>
          </FadeInSection>
        </Panel>

        <div className="hidden lg:block">
          <HomePreviewPanel
            onOpenSaved={() => onModeChange("guardados")}
            savedMenusCount={savedMenusCount}
            t={t}
          />
        </div>
      </section>

      <section className="space-y-2 sm:space-y-4">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
          <div>
            <p className={`${ds.text.eyebrow} hidden sm:block`}>Modos secundarios</p>
            <h2 className="text-[13px] font-black tracking-tight text-slate-300 sm:mt-2 sm:text-2xl sm:text-white">
              Más herramientas
            </h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-6 text-slate-400 sm:block">
            Herramientas extra para menús, grupos, cocina en vivo y planes guardados.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {featureCards.map((card) => (
            <HomeCard
              key={card.mode}
              active={false}
              description={card.description}
              emoji={card.emoji}
              onClick={() => onModeChange(card.mode)}
              priority={card.priority}
              stat={card.stat}
              title={card.title}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function HomeFlowPreview() {
  const steps = [
    { label: "Corte", n: 1 },
    { label: "Punto", n: 2 },
    { label: "Fuego", n: 3 },
    { label: "Pasos", n: 4 },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-1 ring-1 ring-inset ring-white/[0.04] sm:rounded-xl sm:p-1.5">
      <p className="mb-0.5 px-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[9px]">
        Tu flujo
      </p>
      <div className="grid grid-cols-4 gap-px rounded-md bg-white/10 p-px sm:gap-0.5 sm:rounded-lg sm:p-px">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={
              index === 0
                ? "rounded-[5px] bg-orange-500 px-1 py-1.5 text-center sm:rounded-md sm:py-2"
                : "rounded-[5px] bg-slate-950/90 px-1 py-1.5 text-center sm:rounded-md sm:py-2"
            }
          >
            <span
              className={
                index === 0
                  ? "block text-[8px] font-black text-black/70"
                  : "block text-[8px] font-black text-slate-500"
              }
            >
              {step.n}
            </span>
            <span
              className={
                index === 0
                  ? "mt-0.5 block text-[9px] font-bold leading-tight text-black sm:text-[10px]"
                  : "mt-0.5 block text-[9px] font-semibold leading-tight text-slate-400 sm:text-[10px]"
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.03] sm:p-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-300 sm:text-xs sm:tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-white sm:text-sm">{value}</p>
    </div>
  );
}

function HomePreviewPanel({
  onOpenSaved,
  savedMenusCount,
  t,
}: {
  onOpenSaved: () => void;
  savedMenusCount: number;
  t: AppText;
}) {
  const timeline = [
    { time: "17:10", title: "Sellado fuerte", zone: "Directo" },
    { time: "17:22", title: "Indirecto controlado", zone: "Zona media" },
    { time: "17:45", title: "Reposo y servicio", zone: "Mesa" },
  ];

  return (
    <Panel className="relative overflow-hidden p-5 sm:p-6" tone="result">
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge>Plan inteligente</Badge>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
              Vista previa del servicio
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Un plan accionable con tiempos, zonas y próximos pasos antes de encender la parrilla.
            </p>
          </div>
          <div className={ds.media.iconBox}>🔥</div>
        </div>

        <div className="mt-6 space-y-3">
          {timeline.map((item, index) => (
            <div
              key={item.time}
              className="relative flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
            >
              <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-sm font-bold text-orange-200">
                {item.time}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.zone}</p>
              </div>
              {index === 0 && (
                <Badge className="ml-auto h-fit" tone="success">
                  Ahora
                </Badge>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-3xl font-black text-white">{savedMenusCount}</p>
            <p className="mt-1 text-sm text-slate-400">{t.savedMenus}</p>
          </div>
          <button
            onClick={onOpenSaved}
            className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-left transition hover:bg-orange-500/15 active:scale-[0.99]"
          >
            <p className="font-semibold text-orange-200">{t.savedMenus}</p>
            <p className="mt-1 text-sm text-slate-400">Abrir biblioteca</p>
          </button>
        </div>
      </div>
    </Panel>
  );
}

function HomeCard({
  active = false,
  description,
  emoji,
  onClick,
  priority,
  stat,
  title,
}: {
  active?: boolean;
  description: string;
  emoji: string;
  onClick: () => void;
  priority: string;
  stat: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? `group ${ds.panel.homeCard} relative touch-manipulation overflow-hidden border-orange-500/55 bg-gradient-to-br from-orange-500/15 via-slate-900/90 to-slate-950 p-3 shadow-orange-500/20 ring-2 ring-orange-400/25 transition-all duration-200 active:scale-[0.97] active:brightness-[0.98] sm:p-6`
          : `group ${ds.panel.homeCard} relative touch-manipulation overflow-hidden rounded-2xl border-white/5 bg-white/[0.025] p-2.5 opacity-90 transition-all duration-200 hover:border-white/12 active:scale-[0.97] active:brightness-[0.98] sm:rounded-3xl sm:p-5`
      }
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-orange-500/0 blur-2xl transition-all duration-200 group-hover:bg-orange-500/10 sm:h-28 sm:w-28" />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div
          className={
            active
              ? `${ds.media.iconTile} h-10 w-10 rounded-xl border-orange-400/40 bg-orange-500/15 text-2xl sm:h-12 sm:w-12 sm:rounded-2xl sm:text-3xl`
              : `${ds.media.iconTile} h-8 w-8 rounded-lg bg-white/[0.04] text-lg opacity-80 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-2xl`
          }
        >
          {emoji}
        </div>
        <Badge
          className="hidden max-w-[132px] shrink-0 truncate sm:inline-flex"
          tone={active ? "accent" : "glass"}
        >
          {stat}
        </Badge>
      </div>

      <div className="relative z-10 mt-2 sm:mt-6">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300/90 sm:text-[11px] sm:tracking-[0.18em]">
          {priority}
        </p>
        <h2 className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-tight tracking-tight text-white sm:mt-2 sm:text-xl">
          {title}
        </h2>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-400 sm:mt-3 sm:line-clamp-none sm:text-sm sm:leading-6">
          {description}
        </p>
      </div>

      <div
        className={`relative z-10 mt-2 flex items-center justify-between text-[11px] font-semibold sm:mt-5 sm:text-sm ${active ? "text-orange-300" : "text-slate-400"}`}
      >
        <span>Abrir</span>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 group-hover:translate-x-1 sm:h-8 sm:w-8 ${active ? "border-orange-400/20 bg-orange-500/10 group-hover:bg-orange-500/15" : "border-white/10 bg-white/[0.03] group-hover:bg-white/[0.06]"}`}
        >
          →
        </span>
      </div>
    </button>
  );
}
