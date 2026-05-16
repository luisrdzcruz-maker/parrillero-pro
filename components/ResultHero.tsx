"use client";

import { useCallback, useState } from "react";
import ResultHeader from "@/components/ResultHeader";
import {
  BrandImageIcon,
  CompactDisclosure,
  getMetricToneClass,
  MetricTile,
  Panel,
} from "@/components/ui";
import { resolveEquipmentIconKey, resolveMethodIconKey } from "@/lib/assets/equipmentMethodIconResolver";
import { brandIconAssets } from "@/lib/brand/iconAssets";
import { ds } from "@/lib/design-system";
import type { Lang } from "@/lib/i18n/texts";
import { pushResultOverlayHistory, SetupDetailSurface } from "@/components/results/ResultGuidancePanel";
import { detectSetupFromText } from "@/lib/setupVisualMap";
import {
  buildResultHeroMetrics,
  getResultHeroSessionTotalMetric,
  type MetricTone,
} from "@/lib/results/resultMetrics";
import {
  formatResultRationale,
  getResultRationale,
  getResultRationaleHideLabel,
  getResultRationaleLabel,
  getResultRationaleShowLabel,
} from "@/lib/results/resultRationale";
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

function getFireSetupItems(value: string | undefined, lang: Lang) {
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
  lang?: Lang;
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
  const rationaleIntent = getResultRationale({
    summary,
    blocks: resultBlocks,
    doneness: summary?.doneness || doneness,
  });
  const rationale = formatResultRationale(rationaleIntent, lang);
  const rationaleLabel = getResultRationaleLabel(lang);
  const rationaleShowLabel = getResultRationaleShowLabel(lang);
  const rationaleHideLabel = getResultRationaleHideLabel(lang);

  function renderControlMetric(item: { label: string; value: string; tone: MetricTone } | undefined, compact = false) {
    if (!item?.value) return null;

    return (
      <MetricTile
        label={item.label}
        value={item.value}
        tone={item.tone}
        compact={compact}
      />
    );
  }

  /**
   * Time metric tile with inline Save + Share icon-only buttons on the right.
   * Replaces the standalone Save/Share button row that previously sat below
   * the metrics grid. Each icon button is a 44px touch target with aria-label
   * for screen reader accessibility (Decision: icon-only with aria-label, not
   * overflow menu).
   */
  function renderTimeMetricWithActions() {
    if (!timeMetric?.value) return null;
    const hasActions = Boolean(actions.onSave || actions.onShare);
    if (!hasActions) {
      return renderControlMetric(timeMetric);
    }
    return (
      <div
        className={`col-span-2 xl:col-span-1 ${ds.panel.metric} ${getMetricToneClass(timeMetric.tone)} flex items-center justify-between gap-3`}
      >
        <div className="min-w-0 flex-1">
          <p className={`${ds.text.metricEyebrow} text-current/58`}>{timeMetric.label}</p>
          <p className={ds.text.metricLarge} title={timeMetric.value}>
            {timeMetric.value}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions.onSave && (
            <button
              type="button"
              onClick={() => {
                void actions.onSave?.();
              }}
              disabled={saveMenuStatus === "saving"}
              aria-label={saveMenuStatus === "saving" ? t.saving : t.save}
              /* allow-arbitrary: bg-white/[0.04] + hover:bg-white/[0.08] — non-subpanel inline icon-action surface, no canonical token */
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-slate-200 transition hover:border-orange-400/40 hover:bg-white/[0.08] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 4.5h8.5L16 7v8.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 4.5v3.25h6V4.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {actions.onShare && (
            <button
              type="button"
              onClick={actions.onShare}
              aria-label={t.share}
              /* allow-arbitrary: bg-white/[0.04] + hover:bg-white/[0.08] — non-subpanel inline icon-action surface, no canonical token */
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-slate-200 transition hover:border-orange-400/40 hover:bg-white/[0.08] active:scale-[0.96]"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M13.5 6.5a2 2 0 1 0-1.94-2.5L7.7 6.1a2 2 0 1 0 0 3.8l3.86 2.1a2 2 0 1 0 .57-1.05L8.27 8.85a2.01 2.01 0 0 0 0-1.7l3.86-2.1c.34.28.79.45 1.37.45Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
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
        // Spec §3: only one solid ember CTA per screen. Start Live Cooking is
        // the dominant ember below; this Fire/Setup affordance is a quieter
        // secondary tile (neutral surface + warm eyebrow) so it does not
        // compete with the primary action.
        /* allow-arbitrary: rounded-[1.15rem] + bg-white/[0.035] — fire-setup neutral tile chassis, no canonical token */
        className="col-span-2 min-w-0 rounded-[1.15rem] border border-white/[0.09] bg-white/[0.035] px-3 py-2.5 text-left shadow-lg shadow-black/10 ring-1 ring-inset ring-white/[0.025] transition hover:border-orange-300/35 hover:bg-orange-500/[0.06] active:scale-[0.99] xl:col-span-2"
      >
        {/* allow-arbitrary: sm:text-[10px] — breakpoint-prefixed text size, ds.text.body{N} lacks breakpoint variants (deferred to PR D-primitives/B) */}
        <p className={`${ds.text.body9} font-black uppercase tracking-[0.16em] ${ds.color.mutedClass.faint} sm:text-[10px]`}>
          {copy.resultHeroFireSetup}
        </p>
        <p
          /* allow-arbitrary: text-[clamp(...)] responsive display-tier value — stays inline per slice-d-tokens.md §1 */
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
      <Panel as="section" className="relative mb-3 overflow-hidden p-4 sm:mb-5 sm:p-6" tone="hero">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-300/85 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-500/[0.28] blur-3xl" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-40 w-40 rounded-full bg-orange-700/[0.18] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

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
            {renderTimeMetricWithActions()}
            {/* When time is widened to col-span-2 by inline actions, temp also widens
               to col-span-2 so it doesn't orphan a single-column cell on mobile. */}
            {tempMetric?.value && (
              <div className={(actions.onSave || actions.onShare) ? "col-span-2 xl:col-span-1" : ""}>
                {renderControlMetric(tempMetric)}
              </div>
            )}

            {actions.onStartCooking && (
              <button
                type="button"
                onClick={actions.onStartCooking}
                /* allow-arbitrary: rounded-[1.45rem] + shadow-[...] — primary Live CTA chassis, no canonical token */
                className="group col-span-2 flex min-h-[78px] w-full items-center justify-between gap-3 rounded-[1.45rem] border border-orange-200/55 bg-gradient-to-br from-orange-200 via-orange-500 to-orange-600 px-4 py-4 text-left text-slate-950 shadow-[0_24px_52px_rgba(234,88,12,0.5)] ring-1 ring-inset ring-white/30 transition-all duration-200 hover:border-orange-100/80 hover:shadow-[0_28px_60px_rgba(234,88,12,0.62)] hover:brightness-105 active:scale-[0.99] xl:row-span-2 xl:min-h-[148px] xl:flex-col xl:items-start xl:justify-between xl:p-5"
              >
                <span className="flex min-w-0 items-center gap-3 xl:block">
                  {/* allow-arbitrary: shadow-[inset_...] CTA icon-box inset highlight — no canonical ds.shadow.* tier */}
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-950/20 bg-slate-950/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-white/25 xl:h-14 xl:w-14">
                    <BrandImageIcon
                      src={brandIconAssets.navLive}
                      alt=""
                      size="sm"
                      shape="plain"
                      aria-hidden="true"
                      /* allow-arbitrary: drop-shadow-[...] — CTA icon depth shadow, no canonical ds.shadow.* tier */
                      className="h-7 w-7 rounded-md drop-shadow-[0_0_10px_rgba(0,0,0,0.28)] xl:h-8 xl:w-8"
                    />
                  </span>
                  {/* allow-arbitrary: text-[17px]/xl:text-[26px] — between body14 and 22+ display tier, no canonical token */}
                  <span className="min-w-0 text-[17px] font-black leading-[1.05] tracking-[-0.02em] xl:mt-4 xl:block xl:text-[26px]">
                    {copy.resultActionsLiveCta || t.startCooking}
                  </span>
                </span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950/18 text-slate-950 ring-1 ring-inset ring-slate-950/15 transition-transform duration-200 group-hover:translate-x-0.5 xl:self-end"
                  aria-hidden="true"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7.5 4.75L12.75 10L7.5 15.25"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.4"
                    />
                  </svg>
                </span>
              </button>
            )}

            {renderFireSetupButton()}
          </div>

          <CompactDisclosure
            label={rationaleLabel}
            summary={rationale.headline}
            showLabel={rationaleShowLabel}
            hideLabel={rationaleHideLabel}
          >
            {rationale.details.length > 0 ? (
              /* allow-arbitrary: sm:text-[13px] — breakpoint-prefixed text size, ds.text.body{N} lacks breakpoint variants (deferred to PR D-primitives/B) */
              <ul className={`mt-2 space-y-1 ${ds.text.body12} leading-snug ${ds.color.mutedClass.body} sm:text-[13px]`}>
                {rationale.details.map((detail, index) => (
                  <li key={index} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1 h-1 w-1 shrink-0 rounded-full bg-orange-300/70" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CompactDisclosure>
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
