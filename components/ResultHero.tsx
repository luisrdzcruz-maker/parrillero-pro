"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import ResultActions from "@/components/ResultActions";
import { Button, Panel } from "@/components/ui";
import type { ResultSummary } from "@/components/ResultGrid";
import { getSetupVisual } from "@/lib/setup/getSetupVisual";
import { SETUP_VISUAL_FALLBACK } from "@/lib/setupVisualMap";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultHero({
  actions,
  context,
  cutId,
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
  context?: string;
  cutId?: string;
  hasResult: boolean;
  lang?: "es" | "en" | "fi";
  onEdit?: () => void;
  saveMenuStatus?: SaveMenuStatus;
  summary?: ResultSummary;
  t: {
    copy: string;
    result: string;
    save: string;
    saving: string;
    share: string;
    startCooking: string;
  };
}) {
  const isEs = lang === "es";
  const [visualFallbackStep, setVisualFallbackStep] = useState<"none" | "fallback">("none");
  const risk = summary?.criticalError || summary?.safety || "";
  const setupVisualSrc = useMemo(() => getSetupVisual(cutId ?? ""), [cutId]);
  const visualSrc = visualFallbackStep === "fallback" ? SETUP_VISUAL_FALLBACK : setupVisualSrc;
  const heroMetrics = [
    { label: isEs ? "Tiempo" : "Time", value: summary?.time, tone: "orange" },
    { label: isEs ? "Temperatura" : "Temperature", value: summary?.temperature, tone: "red" },
    { label: isEs ? "Reposo" : "Rest", value: summary?.rest, tone: "sky" },
    { label: isEs ? "Riesgo principal" : "Main risk", value: risk, tone: "danger" },
  ].filter((item): item is { label: string; value: string; tone: string } => Boolean(item.value));
  const heroChecks = isEs
    ? ["Tiempo claro", "Temperatura visible", "Riesgo arriba"]
    : ["Clear timing", "Visible temperature", "Risk up front"];

  function getMetricClass(tone: string) {
    if (tone === "red") {
      return "border-red-300/25 bg-red-500/[0.08] text-red-50 ring-red-200/[0.04]";
    }

    if (tone === "sky") {
      return "border-sky-300/20 bg-sky-500/[0.07] text-sky-50 ring-sky-200/[0.04]";
    }

    if (tone === "danger") {
      return "border-red-300/35 bg-[linear-gradient(135deg,rgba(239,68,68,0.16),rgba(127,29,29,0.18))] text-red-50 ring-red-200/[0.06]";
    }

    return "border-orange-300/25 bg-orange-500/[0.09] text-orange-50 ring-orange-200/[0.05]";
  }

  return (
    <Panel as="section" className="relative mb-3 overflow-hidden p-4 sm:mb-5 sm:p-5" tone="hero">
      {/* Top shimmer */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-orange-500/[0.06] blur-2xl" />

      <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
        {/* ── Header row ────────────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase tracking-[0.2em] text-orange-300/90">
                {context || (isEs ? "Plan de cocción" : "Cooking plan")}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {isEs ? "Resultado listo" : "Result ready"}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">
                {isEs
                  ? "Lo esencial para cocinar sin dudar: tiempo, temperatura, reposo y riesgo principal."
                  : "The essentials for cooking without guessing: time, temperature, rest, and main risk."}
              </p>
            </div>

            {onEdit && (
              <Button
                className="shrink-0 rounded-full px-3 py-1.5 text-xs"
                onClick={onEdit}
                variant="secondary"
              >
                {isEs ? "Editar" : "Edit"}
              </Button>
            )}
          </div>

          {heroMetrics.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {heroMetrics.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-3 shadow-lg shadow-black/10 ring-1 ring-inset ${getMetricClass(item.tone)}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-current/70">
                    {item.label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-black leading-snug text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {heroChecks.map((check) => (
                <div
                  key={check}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-center shadow-sm shadow-black/10 ring-1 ring-inset ring-white/[0.03]"
                >
                  <p className="text-[10px] font-black uppercase leading-snug tracking-[0.14em] text-orange-200">
                    {check}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-[1.35rem] border border-orange-300/20 bg-slate-950/80 shadow-xl shadow-black/20 ring-1 ring-inset ring-white/[0.04]">
            <div className="relative aspect-[16/9] w-full">
              {visualSrc ? (
                <Image
                  src={visualSrc}
                  alt={isEs ? "Visual del setup para este corte" : "Setup visual for this cut"}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 720px, 100vw"
                  className="object-cover"
                  onError={() => {
                    if (visualFallbackStep === "none" && visualSrc !== SETUP_VISUAL_FALLBACK) {
                      setVisualFallbackStep("fallback");
                    }
                  }}
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.22),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_52%,rgba(2,6,23,0.8)_100%)]" />
              <p className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur-md">
                {isEs ? "Setup visual" : "Setup visual"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* ── Live Cooking CTA — primary action ─────────────────────────────── */}
          {actions.onStartCooking && (
            <div className="relative">
              <button
                type="button"
                onClick={actions.onStartCooking}
                className="relative flex w-full items-center gap-4 rounded-[1.35rem] border border-orange-300/35 bg-gradient-to-br from-orange-500/[0.16] to-white/[0.035] px-4 py-4 text-left shadow-xl shadow-orange-950/10 ring-1 ring-inset ring-white/[0.04] transition-all duration-200 hover:border-orange-300/55 hover:from-orange-500/[0.2] active:scale-[0.99] sm:px-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-500/15 text-xl shadow-sm shadow-orange-500/10">
                  ⚡
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                    {isEs ? "Siguiente acción" : "Next action"}
                  </p>
                  <p className="mt-0.5 text-base font-black leading-tight text-white">
                    {t.startCooking}
                  </p>
                  <p className="mt-1 text-xs font-medium text-orange-100/80">
                    {isEs ? "Abrir guía en vivo con este plan" : "Open the live guide with this plan"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-orange-400/25 bg-orange-500/12 px-2.5 py-1 shadow-sm shadow-orange-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                    {isEs ? "Live" : "Live"}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* ── Secondary actions ─────────────────────────────────────────────── */}
          <ResultActions
            actions={{ ...actions, onStartCooking: undefined }}
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
