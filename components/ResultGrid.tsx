"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge, Card, Grid } from "@/components/ui";
import { ds } from "@/lib/design-system";
import {
  detectSetupFromText,
  SETUP_VISUAL_FALLBACK,
  type SetupType,
} from "@/lib/setupVisualMap";
import { formatTitle, getGrillManagerLineClass, getShoppingItems } from "@/lib/uiHelpers";
import { localizeResultSurfaceCopy, sanitizeCriticalErrorCopy } from "@/lib/i18n/surfaceFallbacks";
import {
  buildResultSummary as buildResultSummaryHelper,
  sanitizeUserFacingGuidance,
  type ResultBlocks,
  type ResultLang,
  type ResultSummary,
} from "@/lib/results/resultSummary";
import { buildSetupVisualResult, getSetupOverlayChipClass } from "@/lib/results/setupVisualResult";
import ResultCard from "@/components/ResultCard";
import ResultTimeline from "./ResultTimeline";

type Blocks = ResultBlocks;
type ResultItem =
  | {
      key: string;
      title: string;
      content: string;
      setup?: SetupType;
      type: "card";
      variant?: "default" | "primary" | "summary" | "tip" | "setup";
    }
  | { key: string; title: string; content: string; type: "timeline" }
  | { key: string; title: string; content: string; type: "grill" }
  | { key: string; title: string; content: string; type: "shopping" };

// Spans the full 2-column grid on md+ and also on mobile (single-column grids ignore col-span)
const fullWidthPanel = `${ds.panel.result} transition-all duration-200 col-span-full`;
const inlineFallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='30%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%23f97316' stop-opacity='.45'/%3E%3Cstop offset='60%25' stop-color='%230f172a'/%3E%3Cstop offset='100%25' stop-color='%23020617'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='700' fill='url(%23g)'/%3E%3Cpath d='M280 470h640' stroke='%23fb923c' stroke-width='18' stroke-linecap='round' opacity='.55'/%3E%3Cpath d='M340 405h520' stroke='%23fed7aa' stroke-width='10' stroke-linecap='round' opacity='.38'/%3E%3Ccircle cx='600' cy='300' r='105' fill='%23f97316' opacity='.18'/%3E%3C/svg%3E";
export type { ResultSummary };

function SetupVisualImage({ src }: { src: string }) {
  const [fallbackStep, setFallbackStep] = useState<"none" | "asset" | "inline">("none");
  const imageSrc =
    fallbackStep === "inline"
      ? inlineFallbackImage
      : fallbackStep === "asset"
        ? SETUP_VISUAL_FALLBACK
        : src;

  function handleImageError() {
    setFallbackStep((current) =>
      current === "none" && src !== SETUP_VISUAL_FALLBACK ? "asset" : "inline",
    );
  }

  return (
    <Image
      src={imageSrc}
      alt=""
      fill
      sizes="(min-width: 768px) 896px, 100vw"
      className="object-cover"
      onError={handleImageError}
    />
  );
}

function SetupVisualAnchor({
  content,
  equipment,
  lang,
  setup,
}: {
  content?: string;
  equipment?: string;
  lang: ResultLang;
  setup?: SetupType;
}) {
  const setupVisual = buildSetupVisualResult({
    content,
    equipment,
    lang,
    setup,
  });
  if (!setupVisual) return null;
  const { setupImage, overlayChips, setupLine, setupVisualLabel } = setupVisual;

  return (
    <section className="relative col-span-full overflow-hidden rounded-[2rem] border border-orange-300/20 bg-slate-950 shadow-2xl shadow-black/30 ring-1 ring-inset ring-white/[0.04]">
      <div className="relative h-64 w-full sm:h-80">
        <SetupVisualImage key={setupImage} src={setupImage} />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_4%,rgba(251,146,60,0.22),transparent_28%),radial-gradient(circle_at_28%_0%,rgba(56,189,248,0.13),transparent_24%),linear-gradient(135deg,rgba(2,6,23,0.88)_0%,rgba(2,6,23,0.5)_26%,rgba(2,6,23,0.12)_48%,transparent_68%)]"
      />

      <div className="pointer-events-none absolute left-0 top-0 flex max-w-[82%] flex-wrap items-start gap-2 p-4 sm:max-w-[70%] sm:p-5">
        {overlayChips.map((chip) => (
          <span key={`${chip.tone}-${chip.label}`} className={getSetupOverlayChipClass(chip.tone)}>
            {chip.label}
          </span>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/82 to-transparent p-4 pt-16 sm:p-5 sm:pt-20">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">
          {setupVisualLabel}
        </p>
        <p className="mt-1 line-clamp-2 max-w-2xl text-sm font-semibold leading-relaxed text-white">
          {setupLine}
        </p>
      </div>
    </section>
  );
}

export function buildResultSummary(blocks: Blocks, keys: string[], lang: ResultLang = "es"): ResultSummary {
  const summary = buildResultSummaryHelper(blocks, keys, lang);
  const stepDurationTotal = getStepDurationTotal(blocks, keys);

  return {
    ...summary,
    time: stepDurationTotal || summary.time,
  };
}

function ShoppingListCard({
  title,
  content,
  checkedItems,
  lang,
  setCheckedItems,
}: {
  title: string;
  content: string;
  checkedItems: Record<string, boolean>;
  lang: "es" | "en" | "fi";
  setCheckedItems: (value: Record<string, boolean>) => void;
}) {
  const items = getShoppingItems(content);
  const checklistLabel = lang === "es" ? "Checklist" : lang === "fi" ? "Tarkistuslista" : "Checklist";
  const itemsLabel = lang === "es" ? "items" : lang === "fi" ? "tuotetta" : "items";

  return (
    <div
      className={`${fullWidthPanel} hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10`}
    >
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-emerald-400/70" />
      <div className="flex flex-col gap-3 border-b border-white/5 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className={ds.media.iconBox}>🛒</div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
              {checklistLabel}
            </p>
            <h3 className="mt-1 text-sm font-semibold tracking-wide text-white">{title}</h3>
          </div>
        </div>
        <Badge className="w-fit font-medium" tone="glass">
          {items.length} {itemsLabel}
        </Badge>
      </div>

      <div className="grid gap-2.5 p-4 sm:grid-cols-2 sm:p-5">
        {items.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-slate-300 transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
          >
            <input
              type="checkbox"
              checked={Boolean(checkedItems[item])}
              onChange={() => setCheckedItems({ ...checkedItems, [item]: !checkedItems[item] })}
              className="h-5 w-5 accent-emerald-500"
            />
            <span className={checkedItems[item] ? "text-slate-500 line-through" : ""}>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function GrillManagerCard({
  title,
  content,
  lang,
}: {
  title: string;
  content: string;
  lang: "es" | "en" | "fi";
}) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const subtitle =
    lang === "es"
      ? "Control inteligente de zonas y prioridades"
      : lang === "fi"
        ? "Alykas vyohykkeiden ja prioriteettien hallinta"
        : "Smart zone and priority control";

  return (
    <div
      className={`${fullWidthPanel} p-4 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/10 sm:p-5`}
    >
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-red-400/70" />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={ds.media.iconBox}>🎛️</div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{subtitle}</p>
          </div>
        </div>
        <Badge tone="danger">PRO</Badge>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2">
        {lines.map((line) => (
          <div key={line} className={getGrillManagerLineClass(line)}>
            <p className="text-sm font-medium leading-relaxed text-slate-100">{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultEmptyState({ text }: { text: string }) {
  return (
    <Card className="border-dashed bg-slate-900/60 p-8 text-center md:col-span-2">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl shadow-sm shadow-black/10">
        🍽️
      </div>
      <p className={ds.text.muted}>{text}</p>
    </Card>
  );
}

function ResultLoadingState({ text }: { text: string }) {
  return (
    <Card className="bg-slate-900/60 text-orange-200 md:col-span-2">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 animate-pulse rounded-xl border border-orange-400/20 bg-orange-400/20" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{text}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-orange-500" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function findBlockKey(keys: string[], candidates: string[]) {
  return keys.find((key) => candidates.includes(key.toUpperCase()));
}

function getStepDurationTotal(blocks: Blocks, keys: string[]) {
  const stepsKey = findBlockKey(keys, ["PASOS", "STEPS"]);
  if (!stepsKey) return "";

  const totalMinutes = Array.from(blocks[stepsKey].matchAll(/(\d{1,3})\s*min\b/gi)).reduce(
    (total, match) => total + Number(match[1] ?? 0),
    0,
  );

  return totalMinutes > 0 ? `${totalMinutes} min` : "";
}

function getLocalizedBlockTitle(key: string, lang: "es" | "en" | "fi") {
  const upperKey = key.toUpperCase();
  if (upperKey === "SETUP" || upperKey === "CONFIGURACION" || upperKey === "CONFIGURACIÓN") {
    return lang === "es" ? "🔥 Configuración" : lang === "fi" ? "🔥 Asetus" : "🔥 Setup";
  }
  if (upperKey === "TIMES" || upperKey === "TIEMPOS") {
    return lang === "es" ? "⏱️ Tiempos" : lang === "fi" ? "⏱️ Ajat" : "⏱️ Times";
  }
  if (upperKey === "TEMPERATURE" || upperKey === "TEMPERATURA") {
    return lang === "es" ? "🌡️ Temperatura" : lang === "fi" ? "🌡️ Lampotila" : "🌡️ Temperature";
  }
  if (upperKey === "STEPS" || upperKey === "PASOS") {
    return lang === "es" ? "🧠 Pasos" : lang === "fi" ? "🧠 Vaiheet" : "🧠 Steps";
  }
  if (upperKey === "SHOPPING" || upperKey === "COMPRA") {
    return lang === "es" ? "🛒 Lista de compra" : lang === "fi" ? "🛒 Ostoslista" : "🛒 Shopping list";
  }
  return formatTitle(key);
}

function getOrderedResultItems(blocks: Blocks, keys: string[], lang: "es" | "en" | "fi"): ResultItem[] {
  const setupKey = findBlockKey(keys, ["SETUP", "CONFIGURACION", "CONFIGURACIÓN"]);
  const timeKey = findBlockKey(keys, ["TIEMPOS", "TIMES"]);
  const tempKey = findBlockKey(keys, ["TEMPERATURA", "TEMPERATURE"]);
  const stepsKey = findBlockKey(keys, ["PASOS", "STEPS"]);
  const errorKey = findBlockKey(keys, ["ERROR", "ERROR CLAVE", "KEY ERROR"]);
  const usedKeys = new Set([setupKey, timeKey, tempKey, stepsKey, errorKey].filter(Boolean));
  const coreItems: ResultItem[] = [];
  const timelineItems: ResultItem[] = [];
  const grillManagerItems: ResultItem[] = [];
  const shoppingItems: ResultItem[] = [];
  const secondaryItems: ResultItem[] = [];

  if (errorKey) {
    const errorTitle =
      lang === "es"
        ? "Error que arruina este corte"
        : lang === "fi"
          ? "Virhe joka pilaa taman leikkauksen"
          : "Error that ruins this cut";
    coreItems.push({
      key: errorKey,
      title: errorTitle,
      content: localizeResultSurfaceCopy(
        sanitizeCriticalErrorCopy(sanitizeUserFacingGuidance(blocks[errorKey], lang), lang),
        lang,
      ),
      type: "card",
      variant: "tip",
    });
  }

  if (stepsKey) {
    coreItems.push({
      key: stepsKey,
      title: getLocalizedBlockTitle(stepsKey, lang),
      content: localizeResultSurfaceCopy(blocks[stepsKey], lang),
      type: "card",
      variant: "primary",
    });
  }

  keys.forEach((key) => {
    if (usedKeys.has(key)) return;

    if (key === "TIMELINE") {
      const timelineTitle =
        lang === "es" ? "⏱️ Timeline Parrillada" : lang === "fi" ? "⏱️ BBQ-aikajana" : "⏱️ BBQ Timeline";
      timelineItems.push({
        key,
        title: timelineTitle,
        content: blocks[key],
        type: "timeline",
      });
      return;
    }

    if (key === "GRILL_MANAGER") {
      const grillManagerTitle =
        lang === "es" ? "🔥 Grill Manager Pro" : lang === "fi" ? "🔥 Grill Manager Pro" : "🔥 Grill Manager Pro";
      grillManagerItems.push({
        key,
        title: grillManagerTitle,
        content: blocks[key],
        type: "grill",
      });
      return;
    }

    if (key === "COMPRA" || key === "SHOPPING") {
      shoppingItems.push({
        key,
        title: getLocalizedBlockTitle(key, lang),
        content: blocks[key],
        type: "shopping",
      });
      return;
    }

    secondaryItems.push({
      key,
      title: getLocalizedBlockTitle(key, lang),
      content: localizeResultSurfaceCopy(blocks[key], lang),
      type: "card",
    });
  });

  return [...coreItems, ...timelineItems, ...grillManagerItems, ...shoppingItems, ...secondaryItems];
}

export default function ResultGrid({
  blocks,
  checkedItems,
  equipment,
  keys,
  lang = "es",
  loading,
  setCheckedItems,
  t,
}: {
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  equipment?: string;
  keys: string[];
  lang?: "es" | "en" | "fi";
  loading: boolean;
  setCheckedItems: (value: Record<string, boolean>) => void;
  t: {
    generating: string;
    noResult: string;
  };
}) {
  const items = getOrderedResultItems(blocks, keys, lang);
  const setupKey = findBlockKey(keys, ["SETUP", "CONFIGURACION", "CONFIGURACIÓN"]);

  return (
    <Grid className="mx-auto max-w-5xl gap-4 md:gap-5" variant="cards">
      <SetupVisualAnchor
        content={setupKey ? blocks[setupKey] : undefined}
        equipment={equipment}
        lang={lang}
        setup={setupKey ? detectSetupFromText(blocks[setupKey]) : undefined}
      />

      {items.map((item) => {
        if (item.type === "timeline") {
          return <ResultTimeline key={item.key} title={item.title} content={item.content} />;
        }

        if (item.type === "grill") {
          return <GrillManagerCard key={item.key} title={item.title} content={item.content} lang={lang} />;
        }

        if (item.type === "shopping") {
          return (
            <ShoppingListCard
              key={item.key}
              title={item.title}
              content={item.content}
              checkedItems={checkedItems}
              lang={lang}
              setCheckedItems={setCheckedItems}
            />
          );
        }

        return (
          <div
            key={item.key}
            className={item.variant === "primary" ? "col-span-full" : undefined}
          >
            <ResultCard
              title={item.title}
              content={item.content}
              equipment={equipment}
              setup={item.setup}
              lang={lang}
              variant={item.variant}
            />
          </div>
        );
      })}

      {!loading && keys.length === 0 && <ResultEmptyState text={t.noResult} />}

      {loading && <ResultLoadingState text={t.generating} />}
    </Grid>
  );
}
