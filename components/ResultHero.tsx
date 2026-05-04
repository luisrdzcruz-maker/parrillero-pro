"use client";

import ResultActions from "@/components/ResultActions";
import ResultHeader from "@/components/ResultHeader";
import { Panel } from "@/components/ui";
import { buildResultHeroMetrics, type MetricTone } from "@/lib/results/resultMetrics";
import { getResultStepDurationTotal, type ResultSummary } from "@/lib/results/resultSummary";
import { texts } from "@/lib/i18n/texts";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

function getDirectStepDurationTotal(blocks?: Record<string, string>) {
  const steps = blocks?.STEPS ?? blocks?.PASOS ?? "";
  const totalMinutes = Array.from(steps.matchAll(/(\d{1,3})\s*min\b/gi)).reduce(
    (total, match) => total + Number(match[1] ?? 0),
    0,
  );

  return totalMinutes > 0 ? `${totalMinutes} min` : "";
}

export default function ResultHero({
  actions,
  animal,
  context,
  cut,
  doneness,
  resultBlocks,
  resultKeys,
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
  resultBlocks?: Record<string, string>;
  resultKeys?: string[];
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
  const copy = texts[lang];
  const eyebrow = animal || context || copy.resultHeroEyebrowFallback;
  const title = cut || copy.resultHeroTitleFallback;
  const method = summary?.method || "";
  const timeFallback =
    resultBlocks && resultKeys
      ? getResultStepDurationTotal(resultBlocks, resultKeys) || getDirectStepDurationTotal(resultBlocks)
      : getDirectStepDurationTotal(resultBlocks);
  const heroMetrics = buildResultHeroMetrics({ doneness, lang, summary, timeFallback });
  const liveFeatures = [
    copy.resultHeroLiveFeatureTimers,
    copy.resultHeroLiveFeatureCheckpoints,
    copy.resultHeroLiveFeatureSteps,
  ];

  function getMetricClass(tone: MetricTone) {
    if (tone === "red") return "border-red-300/25 bg-red-500/[0.08] text-red-50 ring-red-200/[0.04]";
    if (tone === "sky") return "border-sky-300/20 bg-sky-500/[0.07] text-sky-50 ring-sky-200/[0.04]";
    return "border-orange-300/25 bg-orange-500/[0.09] text-orange-50 ring-orange-200/[0.05]";
  }

  return (
    <Panel as="section" className="relative mb-3 overflow-hidden p-4 sm:mb-5 sm:p-5" tone="hero">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-orange-500/[0.06] blur-2xl" />

      <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <ResultHeader
            eyebrow={eyebrow}
            method={method}
            onEdit={onEdit}
            safety={summary?.safety}
            title={title}
            t={{
              edit: copy.resultHeroEdit,
              fallbackSummary: copy.resultHeroFallbackSummary,
              safety: copy.resultHeroSafety,
            }}
          />

          {heroMetrics.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-3">
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

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-3 shadow-2xl shadow-black/20 ring-1 ring-inset ring-white/[0.04] sm:p-4">
          {actions.onStartCooking && (
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">
                {copy.resultHeroLiveTitle}
              </p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-300">
                {copy.resultHeroLiveSupport}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {liveFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-slate-200"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
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
              startCooking: copy.resultActionsLiveCta || t.startCooking,
            }}
          />
        </div>
      </div>
    </Panel>
  );
}
