"use client";

import { AppIcon, Badge, Card, Grid } from "@/components/ui";
import { ds } from "@/lib/design-system";
import type { SetupType } from "@/lib/setupVisualMap";
import { formatTitle, getGrillManagerLineClass, getShoppingItems } from "@/lib/uiHelpers";
import { localizeResultSurfaceCopy, sanitizeCriticalErrorCopy } from "@/lib/i18n/surfaceFallbacks";
import type { Lang } from "@/lib/i18n/texts";
import {
  buildResultSummary as buildResultSummaryHelper,
  sanitizeUserFacingGuidance,
  type ResultBlocks,
  type ResultLang,
  type ResultSummary,
} from "@/lib/results/resultSummary";
import ResultCard from "@/components/ResultCard";
import ResultGuidancePanel from "@/components/results/ResultGuidancePanel";
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
export type { ResultSummary };

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
  lang: Lang;
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
          <div className={ds.media.iconBox}>
            <AppIcon
              category="ui"
              iconKey="shopping-list"
              alt=""
              size="md"
              aria-hidden="true"
              fallback={<span aria-hidden>🛒</span>}
            />
          </div>
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
            /* allow-arbitrary: pre-slice-a */
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
  lang: Lang;
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
          <div className={ds.media.iconBox}>
            <AppIcon
              category="ui"
              iconKey="cooking-dashboard"
              alt=""
              size="md"
              aria-hidden="true"
              fallback={<span aria-hidden>🎛️</span>}
            />
          </div>
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

function getAvoidGuidanceContent(blocks: Blocks, keys: string[], lang: ResultLang) {
  const errorKey = findBlockKey(keys, ["ERROR", "ERROR CLAVE", "KEY ERROR"]);
  if (!errorKey) return "";

  return localizeResultSurfaceCopy(
    sanitizeCriticalErrorCopy(sanitizeUserFacingGuidance(blocks[errorKey], lang), lang),
    lang,
  );
}

function getLocalizedBlockTitle(key: string, lang: Lang) {
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

function getOrderedResultItems(blocks: Blocks, keys: string[], lang: Lang): ResultItem[] {
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
  prepGuidanceLine,
  setCheckedItems,
  t,
}: {
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  equipment?: string;
  keys: string[];
  lang?: Lang;
  loading: boolean;
  prepGuidanceLine?: string;
  setCheckedItems: (value: Record<string, boolean>) => void;
  t: {
    generating: string;
    noResult: string;
  };
}) {
  const items = getOrderedResultItems(blocks, keys, lang);
  const avoidContent = getAvoidGuidanceContent(blocks, keys, lang);

  return (
    <Grid className="mx-auto max-w-5xl gap-4 md:gap-5" variant="cards">
      <ResultGuidancePanel
        avoidContent={avoidContent}
        lang={lang}
        prepGuidanceLine={prepGuidanceLine}
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

        const card = (
          <div
            key={item.key}
            className={item.variant === "primary" ? "col-span-full" : undefined}
            id={item.variant === "primary" ? "result-steps" : undefined}
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

        return card;
      })}

      {!loading && keys.length === 0 && <ResultEmptyState text={t.noResult} />}

      {loading && <ResultLoadingState text={t.generating} />}
    </Grid>
  );
}
