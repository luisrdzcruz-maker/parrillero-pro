"use client";

import {
  buildTimelineView,
  getZoneClass,
  getZoneLabel,
  secondsToClock,
} from "@/lib/uiHelpers";
import { useEffect, useState } from "react";

const primaryButton =
  "rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 active:scale-[0.98]";

const secondaryButton =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-orange-200 backdrop-blur transition hover:bg-white/10 active:scale-[0.98]";

const dangerButton =
  "rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 active:scale-[0.98]";

type TimelineItem = ReturnType<typeof buildTimelineView>["enriched"][number];
type TimelineRowStatus = "active" | "next" | "idle";

function getTimelineRowStatus({
  item,
  live,
  nextItem,
}: {
  item: TimelineItem;
  live: boolean;
  nextItem?: TimelineItem;
}): TimelineRowStatus {
  if (!live) return "idle";
  if (item.isActive) return "active";
  if (nextItem?.start === item.start && nextItem?.name === item.name) return "next";
  return "idle";
}

function TimelineHeader({
  demoMode,
  live,
  onToggleDemo,
  onToggleLive,
  title,
}: {
  demoMode: boolean;
  live: boolean;
  onToggleDemo: () => void;
  onToggleLive: () => void;
  title: string;
}) {
  return (
    <div className="border-b border-white/5 p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base">
            ⏳
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">Director de tiempos de la parrillada</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onToggleLive}
            className={live && !demoMode ? dangerButton : primaryButton}
          >
            {live && !demoMode ? "Pausar live" : "Iniciar live"}
          </button>

          <button
            onClick={onToggleDemo}
            className={live && demoMode ? dangerButton : secondaryButton}
          >
            {live && demoMode ? "Pausar demo" : "Demo: empezar ahora"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveStatusPanel({
  activeItem,
  demoMode,
  nextItem,
}: {
  activeItem?: TimelineItem;
  demoMode: boolean;
  nextItem?: TimelineItem;
}) {
  return (
    <div className="m-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 sm:m-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
        {demoMode ? "Timeline Live · Demo" : "Timeline Live"}
      </p>

      {activeItem ? (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white">Ahora: {activeItem.name}</h4>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{activeItem.notes}</p>
        </>
      ) : nextItem ? (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white">Próximo: {nextItem.name}</h4>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">Empieza en {secondsToClock(nextItem.secondsUntil)}</p>
        </>
      ) : (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white">Parrillada lista</h4>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">Todos los eventos del timeline han pasado.</p>
        </>
      )}
    </div>
  );
}

function TimelineRow({
  item,
  status,
}: {
  item: TimelineItem;
  status: TimelineRowStatus;
}) {
  const isActive = status === "active";
  const isNext = status === "next";

  const timeClass = isActive
    ? "z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-green-500/40 bg-green-500/15 text-xs font-semibold text-green-300 sm:h-16 sm:w-16 sm:text-sm"
    : isNext
      ? "z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/15 text-xs font-semibold text-orange-300 sm:h-16 sm:w-16 sm:text-sm"
      : "z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 sm:h-16 sm:w-16 sm:text-sm";

  const cardClass = isActive
    ? "flex-1 scale-[1.01] rounded-2xl border border-green-500/30 bg-green-500/10 p-4 ring-1 ring-inset ring-green-500/10"
    : isNext
      ? "flex-1 scale-[1.01] rounded-2xl border border-orange-500/30 bg-orange-500/15 p-4 ring-1 ring-inset ring-orange-500/10"
      : `flex-1 rounded-2xl border p-4 ring-1 ring-inset ring-white/[0.03] ${getZoneClass(item.zone)}`;

  return (
    <div className="relative flex gap-4">
      <div className={timeClass}>{item.start}</div>

      <div className={cardClass}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold tracking-wide text-white sm:text-base">{item.name}</h4>

          <div className="flex flex-wrap gap-2">
            {isActive && <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-200">Ahora</span>}
            {isNext && <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-200">En {secondsToClock(item.secondsUntil)}</span>}
            <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-slate-300">{getZoneLabel(item.zone)}</span>
            {item.end !== "--" && <span className="rounded-full bg-black/20 px-3 py-1 text-xs text-slate-400">{item.start} → {item.end}</span>}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-300">{item.notes}</p>
        {item.duration && item.duration !== "0 min" && <p className="mt-2 text-xs text-slate-400">Duración aprox: {item.duration}</p>}
      </div>
    </div>
  );
}

function TimelineList({
  items,
  live,
  nextItem,
}: {
  items: TimelineItem[];
  live: boolean;
  nextItem?: TimelineItem;
}) {
  return (
    <div className="relative space-y-3 p-4 sm:p-5">
      <div className="absolute bottom-8 left-[47px] top-8 w-px bg-white/10 sm:left-[51px]" />

      {items.map((item, index) => (
        <TimelineRow
          key={`${item.start}-${item.name}-${index}`}
          item={item}
          status={getTimelineRowStatus({ item, live, nextItem })}
        />
      ))}
    </div>
  );
}

export default function ResultTimeline({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const [live, setLive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStart, setDemoStart] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!live) return;

    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [live]);

  function startLive() {
    setDemoMode(false);
    setDemoStart(null);
    setLive(true);
    setNow(new Date());
  }

  function startDemo() {
    setDemoMode(true);
    setDemoStart(new Date());
    setLive(true);
    setNow(new Date());
  }

  const { enriched, activeItem, nextItem } = buildTimelineView(content, now, demoMode, demoStart);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-900/65 shadow-lg shadow-black/20 ring-1 ring-inset ring-white/[0.03] md:col-span-2">
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-orange-400/70" />

      <TimelineHeader
        demoMode={demoMode}
        live={live}
        onToggleDemo={() => (live && demoMode ? setLive(false) : startDemo())}
        onToggleLive={() => (live && !demoMode ? setLive(false) : startLive())}
        title={title}
      />

      {live && <LiveStatusPanel activeItem={activeItem} demoMode={demoMode} nextItem={nextItem} />}

      <TimelineList items={enriched} live={live} nextItem={nextItem} />
    </section>
  );
}
