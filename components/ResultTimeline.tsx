"use client";

import { Badge, Button, Panel } from "@/components/ui";
import { ds } from "@/lib/design-system";
import {
  buildTimelineView,
  getZoneClass,
  getZoneLabel,
  secondsToClock,
} from "@/lib/uiHelpers";
import { useEffect, useState } from "react";

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
          <div className={ds.media.iconBox}>
            ⏳
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">Director de tiempos de la parrillada</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onToggleLive}
            variant={live && !demoMode ? "dangerSolid" : "primary"}
          >
            {live && !demoMode ? "Pausar live" : "Iniciar live"}
          </Button>

          <Button
            onClick={onToggleDemo}
            variant={live && demoMode ? "dangerSolid" : "secondary"}
          >
            {live && demoMode ? "Pausar demo" : "Demo: empezar ahora"}
          </Button>
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
    <Panel className="m-4 sm:m-5" tone="highlight">
      <p className={ds.text.eyebrow}>
        {demoMode ? "Timeline Live · Demo" : "Timeline Live"}
      </p>

      {activeItem ? (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white">Ahora: {activeItem.name}</h4>
          <p className={`mt-1 ${ds.text.body}`}>{activeItem.notes}</p>
        </>
      ) : nextItem ? (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white">Próximo: {nextItem.name}</h4>
          <p className={`mt-1 ${ds.text.body}`}>Empieza en {secondsToClock(nextItem.secondsUntil)}</p>
        </>
      ) : (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white">Parrillada lista</h4>
          <p className={`mt-1 ${ds.text.body}`}>Todos los eventos del timeline han pasado.</p>
        </>
      )}
    </Panel>
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
            {isActive && <Badge tone="success">Ahora</Badge>}
            {isNext && <Badge>En {secondsToClock(item.secondsUntil)}</Badge>}
            <Badge className="font-medium" tone="glass">{getZoneLabel(item.zone)}</Badge>
            {item.end !== "--" && <Badge className="text-slate-400" tone="glass">{item.start} → {item.end}</Badge>}
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
    <Panel as="section" className="md:col-span-2" tone="result">
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
    </Panel>
  );
}
