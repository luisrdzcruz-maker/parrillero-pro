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
  const primaryCard = {
    description: "Elige corte, punto y equipo. El plan sale listo para ejecutar.",
    emoji: "🥩",
    mode: "coccion" as const,
    priority: "Cocción",
    stat: "Plan paso a paso",
    title: t.planCooking,
  };

  const featureCards = [
    {
      description: "Menú rápido o parrillada detallada desde un solo lugar.",
      emoji: "🧭",
      mode: "plan" as const,
      priority: "Plan",
      stat: "Menú o timeline",
      title: "Planificar",
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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      <section className="grid gap-3 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
        <Panel
          className="relative overflow-hidden p-5 shadow-2xl shadow-orange-950/20 sm:p-7 lg:min-h-[300px]"
          tone="hero"
        >
          <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-orange-500/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-8 h-56 w-56 rounded-full bg-red-500/12 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]" />

          <FadeInSection>
            <div className="relative z-10 flex h-full flex-col justify-between gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="uppercase tracking-[0.16em] sm:tracking-[0.2em]">
                    Parrillero Pro
                  </Badge>
                </div>

                <h1 className="mt-4 max-w-xl text-[clamp(2.1rem,10vw,4.2rem)] font-black leading-[0.94] tracking-[-0.065em] text-white sm:mt-5 sm:text-5xl lg:text-6xl">
                  <span className="block">Cocina mejor,</span>
                  <span className="block text-orange-300">sin improvisar</span>
                </h1>
                <p className="mt-3 max-w-md text-[15px] font-medium leading-6 text-slate-200 sm:max-w-lg sm:text-base sm:leading-7">
                  Controla cortes, fuego y tiempos con una guía clara y precisa.
                </p>

                <div className="mt-5 grid gap-2 sm:flex sm:gap-3">
                  <Button
                    className="min-h-[46px] touch-manipulation rounded-2xl px-5 py-3 text-sm font-black shadow-xl shadow-orange-500/25 transition-all duration-200 active:scale-[0.97] active:brightness-95 sm:min-h-[50px] sm:px-6 sm:text-base"
                    onClick={() => onModeChange("coccion")}
                  >
                    Empezar <span aria-hidden="true">→</span>
                  </Button>
                </div>
              </div>

              <div className="hidden grid-cols-3 gap-2 text-sm text-slate-300 sm:grid">
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

      <section className="space-y-3 sm:space-y-4">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
          <div>
            <p className={`${ds.text.eyebrow} hidden sm:block`}>Modos secundarios</p>
            <h2 className="text-lg font-black tracking-tight text-white sm:mt-2 sm:text-2xl">
              Elige cómo quieres cocinar
            </h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-6 text-slate-400 sm:block">
            Herramientas extra para planificar, cocinar en vivo y repetir planes guardados.
          </p>
        </div>

        <HomeCard
          active
          description={primaryCard.description}
          emoji={primaryCard.emoji}
          onClick={() => onModeChange(primaryCard.mode)}
          priority={primaryCard.priority}
          stat={primaryCard.stat}
          title={primaryCard.title}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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
          ? `group ${ds.panel.homeCard} relative min-h-[132px] touch-manipulation overflow-hidden border-orange-500/60 bg-gradient-to-br from-orange-500/20 via-slate-900/95 to-slate-950 p-5 shadow-2xl shadow-orange-500/20 ring-2 ring-orange-400/25 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300/70 active:scale-[0.98] active:brightness-[0.98] sm:p-6`
          : `group ${ds.panel.homeCard} relative min-h-[140px] touch-manipulation overflow-hidden rounded-3xl border-white/10 bg-white/[0.045] p-3.5 shadow-xl shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300/25 hover:bg-white/[0.065] active:scale-[0.97] active:brightness-[0.98] sm:p-5`
      }
    >
      <div
        className={
          active
            ? "pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-orange-400/25 blur-3xl"
            : "pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-orange-500/0 blur-2xl transition-all duration-200 group-hover:bg-orange-500/10"
        }
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div
          className={
            active
              ? `${ds.media.iconTile} h-12 w-12 rounded-2xl border-orange-400/40 bg-orange-500/20 text-3xl shadow-lg shadow-orange-500/20 sm:h-14 sm:w-14`
              : `${ds.media.iconTile} h-10 w-10 rounded-2xl bg-white/[0.06] text-2xl opacity-90 sm:h-11 sm:w-11`
          }
        >
          {emoji}
        </div>
        <Badge
          className={active ? "max-w-[150px] shrink-0 truncate" : "hidden max-w-[132px] shrink-0 truncate sm:inline-flex"}
          tone={active ? "accent" : "glass"}
        >
          {stat}
        </Badge>
      </div>

      <div className="relative z-10 mt-4 sm:mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/90 sm:text-[11px] sm:tracking-[0.18em]">
          {priority}
        </p>
        <h2
          className={
            active
              ? "mt-1 line-clamp-2 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl"
              : "mt-1 line-clamp-2 text-[15px] font-black leading-tight tracking-tight text-white sm:mt-2 sm:text-xl"
          }
        >
          {title}
        </h2>
        <p
          className={
            active
              ? "mt-2 max-w-xl text-sm font-medium leading-6 text-slate-200"
              : "mt-1 line-clamp-2 text-xs leading-5 text-slate-400 sm:mt-3 sm:line-clamp-none sm:text-sm sm:leading-6"
          }
        >
          {description}
        </p>
      </div>

      <div
        className={`relative z-10 mt-4 flex items-center justify-between text-sm font-black sm:mt-5 ${active ? "text-orange-200" : "text-slate-400"}`}
      >
        <span>{active ? "Empezar" : "Abrir"}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 group-hover:translate-x-1 ${active ? "border-orange-300/30 bg-orange-500/20 shadow-lg shadow-orange-500/20 group-hover:bg-orange-500/25" : "border-white/10 bg-white/[0.04] group-hover:bg-white/[0.08]"}`}
        >
          →
        </span>
      </div>
    </button>
  );
}
