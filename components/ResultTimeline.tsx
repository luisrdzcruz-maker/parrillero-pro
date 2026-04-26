"use client";

import {
  buildTimelineView,
  getZoneClass,
  getZoneLabel,
  secondsToClock,
} from "@/lib/uiHelpers";
import { useEffect, useState } from "react";

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
    <div className="rounded-3xl border border-orange-500/40 bg-slate-900 p-5 md:col-span-2">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">Director de tiempos de la parrillada</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => (live && !demoMode ? setLive(false) : startLive())}
            className={live && !demoMode ? "rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white" : "rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white"}
          >
            {live && !demoMode ? "Pausar live" : "Iniciar live"}
          </button>

          <button
            onClick={() => (live && demoMode ? setLive(false) : startDemo())}
            className={live && demoMode ? "rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white" : "rounded-2xl border border-orange-500 px-4 py-3 text-sm font-black text-orange-300"}
          >
            {live && demoMode ? "Pausar demo" : "Demo: empezar ahora"}
          </button>
        </div>
      </div>

      {live && (
        <div className="mb-5 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-300">
            {demoMode ? "Timeline Live · Demo" : "Timeline Live"}
          </p>

          {activeItem ? (
            <>
              <h4 className="mt-2 text-2xl font-black">Ahora: {activeItem.name}</h4>
              <p className="mt-1 text-sm text-slate-300">{activeItem.notes}</p>
            </>
          ) : nextItem ? (
            <>
              <h4 className="mt-2 text-2xl font-black">Próximo: {nextItem.name}</h4>
              <p className="mt-1 text-sm text-slate-300">Empieza en {secondsToClock(nextItem.secondsUntil)}</p>
            </>
          ) : (
            <>
              <h4 className="mt-2 text-2xl font-black">Parrillada lista</h4>
              <p className="mt-1 text-sm text-slate-300">Todos los eventos del timeline han pasado.</p>
            </>
          )}
        </div>
      )}

      <div className="relative space-y-4">
        <div className="absolute bottom-4 left-[31px] top-4 w-px bg-slate-700" />

        {enriched.map((item, index) => {
          const isNextVisual = live && nextItem?.start === item.start && nextItem?.name === item.name;
          const isActiveVisual = live && item.isActive;

          return (
            <div key={`${item.start}-${item.name}-${index}`} className="relative flex gap-4">
              <div
                className={
                  isActiveVisual
                    ? "z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-green-500 bg-green-500/20 text-sm font-black text-green-300"
                    : isNextVisual
                      ? "z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-orange-500 bg-orange-500/20 text-sm font-black text-orange-300"
                      : "z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-sm font-black text-slate-300"
                }
              >
                {item.start}
              </div>

              <div className={isActiveVisual ? "flex-1 scale-[1.01] rounded-2xl border border-green-500 bg-green-500/10 p-4 shadow-lg" : isNextVisual ? "flex-1 scale-[1.01] rounded-2xl border border-orange-500 bg-orange-500/15 p-4 shadow-lg" : `flex-1 rounded-2xl border p-4 ${getZoneClass(item.zone)}`}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-black">{item.name}</h4>

                  <div className="flex flex-wrap gap-2">
                    {isActiveVisual && <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-black text-white">Ahora</span>}
                    {isNextVisual && <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">En {secondsToClock(item.secondsUntil)}</span>}
                    <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">{getZoneLabel(item.zone)}</span>
                    {item.end !== "--" && <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-slate-300">{item.start} → {item.end}</span>}
                  </div>
                </div>

                <p className="text-sm text-slate-300">{item.notes}</p>
                {item.duration && item.duration !== "0 min" && <p className="mt-2 text-xs text-slate-400">Duración aprox: {item.duration}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
