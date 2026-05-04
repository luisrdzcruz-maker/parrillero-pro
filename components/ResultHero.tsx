"use client";

import ResultHeader from "@/components/ResultHeader";
import { Button, Panel } from "@/components/ui";
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

function getCompactMethod(value = "") {
  const firstSentence = value.split(/[.;]/).map((part) => part.trim()).find(Boolean) ?? "";
  return firstSentence.length > 42 ? `${firstSentence.slice(0, 39).trim()}...` : firstSentence;
}

function getFireSetupItems(value: string | undefined, lang: "es" | "en" | "fi") {
  const copy = texts[lang];
  const normalized = value?.toLowerCase() ?? "";
  const items: string[] = [];

  if (/\b(direct|directo|directa|suora)\b/.test(normalized)) items.push(copy.resultHeroFireDirect);
  if (/\b(indirect|indirecto|indirecta|epasuora)\b/.test(normalized)) items.push(copy.resultHeroFireIndirect);
  if (/\b(low|bajo|baja|matala)\b/.test(normalized)) items.push(copy.resultHeroFireLow);
  if (/\b(medium|medio|media|keskitaso)\b/.test(normalized)) items.push(copy.resultHeroFireMedium);
  if (/\b(high|alto|alta|korkea)\b/.test(normalized)) items.push(copy.resultHeroFireHigh);

  return Array.from(new Set(items));
}

export default function ResultHero({
  actions,
  animal,
  context,
  cut,
  doneness,
  resultBlocks,
  resultKeys,
  lang = "es",
  onEdit,
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
  const method = getCompactMethod(summary?.method);
  const equipmentLabel = context?.split("·").slice(1).join(" / ").trim() ?? "";
  const timeFallback =
    resultBlocks && resultKeys
      ? getResultStepDurationTotal(resultBlocks, resultKeys) || getDirectStepDurationTotal(resultBlocks)
      : getDirectStepDurationTotal(resultBlocks);
  const heroMetrics = buildResultHeroMetrics({ doneness, lang, summary, timeFallback });
  const fireSetupItems = getFireSetupItems(summary?.method, lang);
  const canViewSteps = Boolean(resultBlocks?.PASOS || resultBlocks?.STEPS);

  function getMetricClass(tone: MetricTone) {
    if (tone === "red") return "border-red-300/25 bg-red-500/[0.08] text-red-50 ring-red-200/[0.04]";
    if (tone === "sky") return "border-sky-300/20 bg-sky-500/[0.07] text-sky-50 ring-sky-200/[0.04]";
    return "border-orange-300/25 bg-orange-500/[0.09] text-orange-50 ring-orange-200/[0.05]";
  }

  function handleViewSteps() {
    if (typeof document === "undefined") return;
    document.getElementById("result-steps")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <Panel as="section" className="relative mb-3 overflow-hidden p-4 sm:mb-5 sm:p-5" tone="hero">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-orange-500/[0.06] blur-2xl" />

      <div className="relative z-10 grid gap-4">
        <div className="min-w-0 space-y-3">
          <ResultHeader
            doneness={summary?.doneness || doneness}
            equipment={equipmentLabel}
            eyebrow={eyebrow}
            method={method}
            onEdit={onEdit}
            title={title}
            t={{
              edit: copy.resultHeroEdit,
              fallbackSummary: copy.resultHeroFallbackSummary,
            }}
          />

          {heroMetrics.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {heroMetrics.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-3 shadow-lg shadow-black/10 ring-1 ring-inset ${getMetricClass(item.tone)}`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-current/70 sm:text-[10px]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-black leading-none tracking-[-0.04em] text-white sm:text-3xl">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] sm:items-end">
          {fireSetupItems.length > 0 && (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.03]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                {copy.resultHeroFireSetup}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {fireSetupItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-orange-300/20 bg-orange-500/[0.08] px-3 py-1.5 text-xs font-black text-orange-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            {actions.onStartCooking && (
              <button
                type="button"
                onClick={actions.onStartCooking}
                className="group relative flex min-h-[58px] w-full items-center justify-between overflow-hidden rounded-[1.5rem] border border-orange-300/45 bg-orange-500 px-5 py-4 text-left text-slate-950 shadow-2xl shadow-orange-950/25 ring-1 ring-inset ring-white/20 transition-all duration-200 hover:bg-orange-400 active:scale-[0.99]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/20 to-transparent opacity-80"
                />
                <span className="relative text-base font-black leading-tight">
                  {copy.resultActionsLiveCta || t.startCooking}
                </span>
                <span className="relative text-xl font-black" aria-hidden="true">
                  -&gt;
                </span>
              </button>
            )}

            {canViewSteps && (
              <Button
                className="min-h-[46px] rounded-[1.25rem] text-sm font-black"
                fullWidth
                onClick={handleViewSteps}
                variant="secondary"
              >
                {copy.resultHeroViewSteps}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
