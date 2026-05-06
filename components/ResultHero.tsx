"use client";

import { useCallback, useState } from "react";
import ResultHeader from "@/components/ResultHeader";
import { BrandImageIcon, Panel } from "@/components/ui";
import { resolveEquipmentIconKey, resolveMethodIconKey } from "@/lib/assets/equipmentMethodIconResolver";
import { brandIconAssets } from "@/lib/brand/iconAssets";
import { pushResultOverlayHistory, SetupDetailSurface } from "@/components/results/ResultGuidancePanel";
import { detectSetupFromText } from "@/lib/setupVisualMap";
import {
  buildResultHeroMetrics,
  getResultHeroSessionTotalMetric,
  type MetricTone,
} from "@/lib/results/resultMetrics";
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
  const equipmentIcon = resolveEquipmentIconKey(equipmentLabel);
  const methodIcon = resolveMethodIconKey(summary?.method ?? method);
  const timeFallback =
    resultBlocks && resultKeys
      ? getResultStepDurationTotal(resultBlocks, resultKeys) || getDirectStepDurationTotal(resultBlocks)
      : getDirectStepDurationTotal(resultBlocks);
  // TIMES/TIEMPOS can stay cut-plan-like; the hero total prefers structured full-session time.
  const heroTotalTime = getResultHeroSessionTotalMetric(resultBlocks);
  const heroMetrics = buildResultHeroMetrics({ doneness, heroTotalTime, lang, summary, timeFallback });
  const fireSetupItems = getFireSetupItems(summary?.method, lang);
  const heroMetricItems = fireSetupItems.length
    ? [
        ...heroMetrics,
        {
          label: copy.resultHeroFireSetup,
          value: fireSetupItems.join(" / "),
          tone: "orange" as const,
        },
      ]
    : heroMetrics;
  const timeMetric = heroMetricItems.find((item) => item.label === copy.resultHeroMetricTime);
  const tempMetric =
    heroMetricItems.find((item) => item.label === copy.resultHeroMetricTargetTemp) ??
    heroMetricItems.find((item) => item.tone === "red");
  const fireMetric = heroMetricItems.find((item) => item.label === copy.resultHeroFireSetup);
  const setupKey = resultKeys?.find((key) =>
    ["SETUP", "CONFIGURACION", "CONFIGURACIÓN"].includes(key.toUpperCase()),
  );
  const setupContent = setupKey ? resultBlocks?.[setupKey] : undefined;
  const setup = setupContent ? detectSetupFromText(setupContent) : undefined;
  const [setupOpen, setSetupOpen] = useState(false);
  const closeSetup = useCallback(() => setSetupOpen(false), []);

  function getMetricClass(tone: MetricTone) {
    if (tone === "red") return "border-red-300/25 bg-red-500/[0.08] text-red-50 ring-red-200/[0.04]";
    if (tone === "sky") return "border-sky-300/20 bg-sky-500/[0.07] text-sky-50 ring-sky-200/[0.04]";
    return "border-orange-300/25 bg-orange-500/[0.09] text-orange-50 ring-orange-200/[0.05]";
  }

  function renderControlMetric(item: { label: string; value: string; tone: MetricTone } | undefined, compact = false) {
    if (!item?.value) return null;

    return (
      <div
        className={`min-w-0 rounded-[1.15rem] border px-3 py-2.5 shadow-lg shadow-black/10 ring-1 ring-inset ${getMetricClass(item.tone)}`}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-current/58 sm:text-[10px]">
          {item.label}
        </p>
        <p
          className={`mt-1 font-black tracking-[-0.04em] text-white ${
            compact
              ? "truncate text-[clamp(0.95rem,3.6vw,1.2rem)] leading-tight"
              : "text-[clamp(1.55rem,7vw,2rem)] leading-none sm:text-3xl"
          }`}
          title={item.value}
        >
          {item.value}
        </p>
      </div>
    );
  }

  function renderFireSetupButton() {
    if (!setupContent && !fireMetric?.value) return null;

    return (
      <button
        type="button"
        onClick={() => {
          pushResultOverlayHistory("setup");
          setSetupOpen(true);
        }}
        className={`col-span-2 min-w-0 rounded-[1.15rem] border px-3 py-2.5 text-left shadow-lg shadow-black/10 ring-1 ring-inset transition hover:border-orange-200/45 hover:bg-orange-500/[0.13] active:scale-[0.99] xl:col-span-2 ${getMetricClass("orange")}`}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-current/58 sm:text-[10px]">
          {copy.resultHeroFireSetup}
        </p>
        <p
          className="mt-1 truncate text-[clamp(1rem,4vw,1.28rem)] font-black leading-tight tracking-[-0.04em] text-white"
          title={fireMetric?.value ?? copy.resultHeroFireSetup}
        >
          {fireMetric?.value ?? copy.resultHeroFireSetup}
        </p>
      </button>
    );
  }

  return (
    <>
      <Panel as="section" className="relative mb-3 overflow-hidden p-3.5 sm:mb-5 sm:p-5" tone="hero">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-orange-500/[0.06] blur-2xl" />

        <div className="relative z-10 grid gap-3.5 sm:gap-4">
          <div className="min-w-0 space-y-3">
            <ResultHeader
              doneness={summary?.doneness || doneness}
              equipment={equipmentLabel}
              equipmentIcon={equipmentIcon}
              eyebrow={eyebrow}
              method={method}
              methodIcon={methodIcon}
              onEdit={onEdit}
              title={title}
              t={{
                edit: copy.resultHeroEdit,
                fallbackSummary: copy.resultHeroFallbackSummary,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4 xl:grid-rows-2">
            {renderControlMetric(timeMetric)}
            {renderControlMetric(tempMetric)}

            {actions.onStartCooking && (
              <button
                type="button"
                onClick={actions.onStartCooking}
                className="group col-span-2 flex min-h-[66px] w-full items-center justify-between gap-3 rounded-[1.35rem] border border-orange-200/45 bg-gradient-to-br from-orange-200 via-orange-500 to-orange-600 px-3.5 py-3.5 text-left text-slate-950 shadow-[0_18px_38px_rgba(234,88,12,0.34)] ring-1 ring-inset ring-white/25 transition-all duration-200 hover:border-orange-100/70 hover:brightness-105 active:scale-[0.99] xl:row-span-2 xl:min-h-[132px] xl:flex-col xl:items-start xl:justify-between xl:p-4"
              >
                <span className="flex min-w-0 items-center gap-3 xl:block">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-950/15 bg-slate-950/18 shadow-inner ring-1 ring-white/20 xl:h-12 xl:w-12">
                    <BrandImageIcon
                      src={brandIconAssets.navLive}
                      alt=""
                      size="sm"
                      shape="plain"
                      aria-hidden="true"
                      className="h-7 w-7 rounded-md drop-shadow-[0_0_10px_rgba(0,0,0,0.24)]"
                    />
                  </span>
                  <span className="min-w-0 text-[15px] font-black leading-tight xl:mt-3 xl:block xl:text-xl">
                    {copy.resultActionsLiveCta || t.startCooking}
                  </span>
                </span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950/13 text-slate-950 ring-1 ring-inset ring-slate-950/12 transition-transform duration-200 group-hover:translate-x-0.5 xl:self-end"
                  aria-hidden="true"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7.5 4.75L12.75 10L7.5 15.25"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              </button>
            )}

            {renderFireSetupButton()}
          </div>
        </div>
      </Panel>

      <SetupDetailSurface
        equipment={equipmentLabel}
        lang={lang}
        onClose={closeSetup}
        open={setupOpen}
        setup={setup}
        setupContent={setupContent}
      />
    </>
  );
}
