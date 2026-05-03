"use client";

import ResultActions from "@/components/ResultActions";
import ResultHeader from "@/components/ResultHeader";
import { Panel } from "@/components/ui";
import type { ResultSummary } from "@/components/ResultGrid";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultHero({
  actions,
  animal,
  context,
  cut,
  doneness,
  hasResult,
  lang = "es",
  onEdit,
  saveMenuStatus,
  summary,
  t,
}: {
  actions: {
    onCopy: () => void;
    onSave?: () => Promise<void>;
    onShare?: () => void;
    onStartCooking?: () => void;
  };
  animal?: string;
  context?: string;
  cut?: string;
  doneness?: string;
  hasResult: boolean;
  lang?: "es" | "en" | "fi";
  onEdit?: () => void;
  saveMenuStatus?: SaveMenuStatus;
  summary?: ResultSummary;
  t: {
    copy: string;
    save: string;
    saving: string;
    share: string;
    startCooking: string;
  };
}) {
  const isEs = lang === "es";
  const isFi = lang === "fi";
  const eyebrow = animal || context || (isEs ? "Plan de coccion" : isFi ? "Kypsennyssuunnitelma" : "Cooking plan");
  const title = cut || (isEs ? "Resultado listo" : isFi ? "Tulos valmis" : "Result ready");
  const method = summary?.method || "";
  const target = summary?.temperature || summary?.doneness || doneness || "";

  const heroMetrics = [
    { label: isEs ? "Tiempo" : isFi ? "Aika" : "Time", value: summary?.time, tone: "orange" },
    { label: isEs ? "Objetivo" : isFi ? "Tavoite" : "Target", value: target, tone: "red" },
    { label: isEs ? "Reposo" : isFi ? "Lepuutus" : "Rest", value: summary?.rest, tone: "sky" },
  ].filter((item): item is { label: string; value: string; tone: "orange" | "red" | "sky" } => Boolean(item.value));

  function getMetricClass(tone: "orange" | "red" | "sky") {
    if (tone === "red") return "border-red-300/25 bg-red-500/[0.08] text-red-50 ring-red-200/[0.04]";
    if (tone === "sky") return "border-sky-300/20 bg-sky-500/[0.07] text-sky-50 ring-sky-200/[0.04]";
    return "border-orange-300/25 bg-orange-500/[0.09] text-orange-50 ring-orange-200/[0.05]";
  }

  return (
    <Panel as="section" className="relative mb-3 overflow-hidden p-4 sm:mb-5 sm:p-5" tone="hero">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-orange-500/[0.06] blur-2xl" />

      <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <ResultHeader
            eyebrow={eyebrow}
            method={method}
            onEdit={onEdit}
            safety={summary?.safety}
            title={title}
            t={{
              edit: isEs ? "Editar" : isFi ? "Muokkaa" : "Edit",
              fallbackSummary: isEs
                ? "Lo esencial para cocinar sin dudar."
                : isFi
                  ? "Oleellinen selkeaan ja varmaan kypsennykseen."
                  : "The essentials for confident cooking.",
              safety: isEs ? "Senal segura" : isFi ? "Turvasignaali" : "Safety signal",
            }}
          />

          {heroMetrics.length > 0 && (
            <div
              className={`grid gap-2 ${heroMetrics.length >= 3 ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-2"}`}
            >
              {heroMetrics.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-3 shadow-lg shadow-black/10 ring-1 ring-inset ${getMetricClass(item.tone)}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-current/70">
                    {item.label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-black leading-snug text-white sm:min-h-9">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <ResultActions
            actions={actions}
            compact
            hasResult={hasResult}
            lang={lang}
            secondary
            status={saveMenuStatus}
            t={{
              copy: t.copy,
              save: t.save,
              saving: t.saving,
              share: t.share,
              startCooking: t.startCooking,
            }}
          />
        </div>
      </div>
    </Panel>
  );
}
