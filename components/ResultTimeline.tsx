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

const headerButtonClass =
  "min-h-[44px] touch-manipulation px-4 transition-all duration-200 ease-out hover:brightness-[1.04] active:scale-[0.97] active:brightness-95 motion-reduce:transition-none motion-reduce:hover:brightness-100 motion-reduce:active:scale-100 sm:min-h-[40px] sm:px-5";

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
  const liveIsPrimarySession = live && !demoMode;
  const demoIsPrimarySession = live && demoMode;

  return (
    <div className="border-b border-white/5 p-4 transition-colors duration-200 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="group/hdr flex min-w-0 items-start gap-3">
          <div
            className={`${ds.media.iconBox} transition-all duration-200 ease-out group-hover/hdr:border-orange-500/25 group-hover/hdr:bg-orange-500/[0.07] motion-reduce:transition-none`}
          >
            ⏳
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400 transition-colors duration-200 group-hover/hdr:text-slate-300">
              Director de tiempos de la parrillada
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            aria-pressed={liveIsPrimarySession}
            className={`${headerButtonClass} ${demoIsPrimarySession ? "opacity-75 hover:opacity-100" : ""}`}
            onClick={onToggleLive}
            variant={liveIsPrimarySession ? "dangerSolid" : "primary"}
          >
            {liveIsPrimarySession ? "Pausar live" : "Iniciar live"}
          </Button>

          <Button
            aria-pressed={demoIsPrimarySession}
            className={`${headerButtonClass} ${liveIsPrimarySession ? "opacity-75 hover:opacity-100" : ""}`}
            onClick={onToggleDemo}
            variant={demoIsPrimarySession ? "dangerSolid" : "secondary"}
          >
            {demoIsPrimarySession ? "Pausar demo" : "Demo: empezar ahora"}
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
    <Panel
      className={`m-4 shadow-md shadow-black/10 transition-all duration-300 ease-out motion-reduce:transition-none sm:m-5 ${ds.effects.innerRing}`}
      tone="highlight"
    >
      <p className={ds.text.eyebrow}>
        {demoMode ? "Timeline Live · Demo" : "Timeline Live"}
      </p>

      {activeItem ? (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white transition-colors duration-200">Ahora: {activeItem.name}</h4>
          <p className={`mt-1 transition-colors duration-200 ${ds.text.body}`}>{activeItem.notes}</p>
        </>
      ) : nextItem ? (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white transition-colors duration-200">Próximo: {nextItem.name}</h4>
          <p className={`mt-1 transition-colors duration-200 ${ds.text.body}`}>Empieza en {secondsToClock(nextItem.secondsUntil)}</p>
        </>
      ) : (
        <>
          <h4 className="mt-2 text-xl font-semibold text-white transition-colors duration-200">Parrillada lista</h4>
          <p className={`mt-1 transition-colors duration-200 ${ds.text.body}`}>Todos los eventos del timeline han pasado.</p>
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
  const isIdle = !isActive && !isNext;

  const timeClass = isActive
    ? "z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-green-500/40 bg-green-500/15 text-xs font-semibold text-green-300 shadow-sm shadow-green-500/10 transition-all duration-200 ease-out motion-reduce:transition-none sm:h-16 sm:w-16 sm:text-sm"
    : isNext
      ? "z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/15 text-xs font-semibold text-orange-300 shadow-sm shadow-orange-500/15 transition-all duration-200 ease-out motion-reduce:transition-none sm:h-16 sm:w-16 sm:text-sm"
      : "z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/row:border-white/20 group-hover/row:bg-white/[0.07] sm:h-16 sm:w-16 sm:text-sm";

  const cardClass = isActive
    ? "flex-1 origin-left scale-[1.01] rounded-2xl border border-green-500/35 bg-green-500/10 p-4 shadow-md shadow-green-500/5 ring-1 ring-inset ring-green-500/10 ring-offset-0 transition-all duration-200 ease-out motion-reduce:scale-100 motion-reduce:transition-none sm:ring-2 sm:ring-green-500/15"
    : isNext
      ? "flex-1 origin-left scale-[1.01] rounded-2xl border border-orange-500/35 bg-orange-500/15 p-4 shadow-md shadow-orange-500/10 ring-1 ring-inset ring-orange-500/10 ring-offset-0 transition-all duration-200 ease-out motion-reduce:scale-100 motion-reduce:transition-none sm:ring-2 sm:ring-orange-500/15"
      : `flex-1 select-none rounded-2xl border p-4 ring-1 ring-inset ring-white/[0.03] transition-all duration-200 ease-out motion-reduce:transition-none hover:shadow-md hover:shadow-black/15 motion-reduce:hover:shadow-none ${getZoneClass(item.zone)}`;

  return (
    <div
      className={`group/row relative flex gap-4 motion-reduce:transform-none ${isIdle ? "transition-transform duration-200 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 motion-reduce:[@media(hover:hover)]:hover:translate-y-0" : ""}`}
      aria-current={isActive ? "step" : undefined}
      data-timeline-status={status}
    >
      <div className={timeClass}>{item.start}</div>

      <div className={cardClass} data-timeline-card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold tracking-wide text-white sm:text-base">{item.name}</h4>

          <div className="flex flex-wrap gap-2">
            {isActive && (
              <Badge className="transition-all duration-200 motion-reduce:transition-none" tone="success">
                Ahora
              </Badge>
            )}
            {isNext && (
              <Badge
                className="border-orange-400/45 bg-orange-500/20 font-semibold text-orange-100 shadow-sm shadow-orange-500/10 transition-all duration-200 motion-reduce:transition-none"
                tone="glass"
              >
                En {secondsToClock(item.secondsUntil)}
              </Badge>
            )}
            <Badge className="font-medium transition-all duration-200 motion-reduce:transition-none" tone="glass">
              {getZoneLabel(item.zone)}
            </Badge>
            {item.end !== "--" && (
              <Badge className="text-slate-400 transition-all duration-200 motion-reduce:transition-none" tone="glass">
                {item.start} → {item.end}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-300 transition-colors duration-200 motion-reduce:transition-none">{item.notes}</p>
        {item.duration && item.duration !== "0 min" && (
          <p className="mt-2 text-xs text-slate-400 transition-opacity duration-200 motion-reduce:transition-none">Duración aprox: {item.duration}</p>
        )}
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
      <div
        className={`pointer-events-none absolute bottom-8 left-[47px] top-8 w-px bg-gradient-to-b from-white/5 via-white/15 to-white/5 transition-opacity duration-300 motion-reduce:transition-none sm:left-[51px] ${live ? "opacity-100" : "opacity-50"}`}
        aria-hidden
      />

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
    <Panel
      as="section"
      className={`relative md:col-span-2 ${ds.effects.panelShadow} transition-shadow duration-300 ease-out motion-reduce:transition-none hover:shadow-2xl hover:shadow-black/25 focus-within:shadow-2xl focus-within:shadow-black/20 focus-within:ring-1 focus-within:ring-orange-500/15`}
      tone="result"
    >
      <div
        className={`absolute left-0 top-0 h-full w-[3px] rounded-l-2xl transition-all duration-300 ease-out motion-reduce:transition-none ${live ? "bg-orange-400/85 shadow-[2px_0_12px_rgba(249,115,22,0.25)]" : "bg-orange-400/55"}`}
        aria-hidden
      />

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
