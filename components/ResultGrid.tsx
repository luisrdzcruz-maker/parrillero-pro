"use client";

import { Badge, Card, Grid } from "@/components/ui";
import { ds } from "@/lib/design-system";
import { detectSetupFromText, type SetupType } from "@/lib/setupVisualMap";
import { formatTitle, getGrillManagerLineClass, getShoppingItems } from "@/lib/uiHelpers";
import ResultCard from "@/components/ResultCard";
import ResultTimeline from "./ResultTimeline";

type Blocks = Record<string, string>;
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

type SummaryLabels = {
  badge: string;
  title: string;
  subtitle: string;
  method: string;
  time: string;
  temperature: string;
  doneness: string;
};

function getSummaryLabels(lang: "es" | "en" | "fi"): SummaryLabels {
  if (lang === "en") {
    return {
      badge: "Result ready",
      title: "Premium cook summary",
      subtitle: "The key plan details, ready to follow at the grill.",
      method: "Method",
      time: "Time",
      temperature: "Temperature",
      doneness: "Doneness",
    };
  }

  if (lang === "fi") {
    return {
      badge: "Tulos valmis",
      title: "Premium-yhteenveto",
      subtitle: "Tärkeimmät tiedot selkeästi ennen grilliä.",
      method: "Menetelmä",
      time: "Aika",
      temperature: "Lämpötila",
      doneness: "Kypsyys",
    };
  }

  return {
    badge: "Resultado listo",
    title: "Resumen premium de cocción",
    subtitle: "Lo esencial del plan, claro y listo para la parrilla.",
    method: "Método",
    time: "Tiempo",
    temperature: "Temperatura",
    doneness: "Punto",
  };
}

function getFirstUsefulLine(value = "") {
  return (
    value
      .split("\n")
      .map((line) => line.trim().replace(/^[-•]\s*/, ""))
      .find(Boolean) ?? ""
  );
}

function compactSummaryValue(value: string) {
  const clean = getFirstUsefulLine(value);
  return clean.length > 78 ? `${clean.slice(0, 75).trim()}...` : clean;
}

function extractDonenessValue(blocks: Blocks, keys: string[]) {
  const explicitKey = findBlockKey(keys, ["PUNTO", "DONENESS", "POINT", "KYPSYYS"]);
  if (explicitKey) return compactSummaryValue(blocks[explicitKey]);

  const candidateText = keys
    .map((key) => blocks[key])
    .filter(Boolean)
    .join("\n");
  const line = candidateText
    .split("\n")
    .map((value) => value.trim())
    .find((value) =>
      /(^|\b)(punto|doneness|point|t[eé]rmino|termino|kypsyys)(\b|:)/i.test(value),
    );

  if (!line) return "";

  const [, value = ""] = line.split(/:\s+(.+)/);
  return compactSummaryValue(value || line);
}

function SummaryMetric({
  label,
  value,
  featured = false,
}: {
  label: string;
  value: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 shadow-lg shadow-black/10 ring-1 ring-inset ${
        featured
          ? "border-orange-300/25 bg-orange-500/[0.09] ring-orange-200/[0.05]"
          : "border-white/10 bg-white/[0.045] ring-white/[0.03]"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/90">
        {label}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-black leading-snug text-white">{value}</p>
    </div>
  );
}

function PremiumResultSummaryCard({
  blocks,
  keys,
  lang,
}: {
  blocks: Blocks;
  keys: string[];
  lang: "es" | "en" | "fi";
}) {
  const labels = getSummaryLabels(lang);
  const setupKey = findBlockKey(keys, ["SETUP", "CONFIGURACION", "CONFIGURACIÓN"]);
  const timeKey = findBlockKey(keys, ["TIEMPOS", "TIMES"]);
  const tempKey = findBlockKey(keys, ["TEMPERATURA", "TEMPERATURE"]);
  const method = setupKey ? compactSummaryValue(blocks[setupKey]) : "";
  const time = timeKey ? compactSummaryValue(blocks[timeKey]) : "";
  const temperature = tempKey ? compactSummaryValue(blocks[tempKey]) : "";
  const doneness = extractDonenessValue(blocks, keys);

  if (!method && !time && !temperature && !doneness) return null;

  return (
    <section className="col-span-full overflow-hidden rounded-[2rem] border border-orange-300/25 bg-[radial-gradient(circle_at_12%_0%,rgba(251,146,60,0.26),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96)_58%,rgba(67,20,7,0.72))] shadow-2xl shadow-orange-950/25 ring-1 ring-inset ring-white/[0.05]">
      <div className="relative p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-28 w-28 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex rounded-full border border-orange-300/25 bg-orange-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-200">
                {labels.badge}
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {labels.title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{labels.subtitle}</p>
            </div>
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-orange-300/20 bg-orange-500/15 text-2xl shadow-xl shadow-orange-950/30 sm:flex">
              🔥
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {method && <SummaryMetric featured label={labels.method} value={method} />}
            {time && <SummaryMetric label={labels.time} value={time} />}
            {temperature && <SummaryMetric label={labels.temperature} value={temperature} />}
            {doneness && <SummaryMetric label={labels.doneness} value={doneness} />}
          </div>
        </div>
      </div>
    </section>
  );
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
  const isEnglish = lang === "en";

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
              {isEnglish ? "Checklist" : "Checklist"}
            </p>
            <h3 className="mt-1 text-sm font-semibold tracking-wide text-white">{title}</h3>
          </div>
        </div>
        <Badge className="w-fit font-medium" tone="glass">
          {items.length} {isEnglish ? "items" : "items"}
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

  const isEnglish = lang === "en";

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
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {isEnglish
                ? "Smart zone and priority control"
                : "Control inteligente de zonas y prioridades"}
            </p>
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

function combineBlocks(blocks: Blocks, keys: string[]) {
  return keys
    .map((key) => blocks[key])
    .filter(Boolean)
    .join("\n");
}

function getOrderedResultItems(blocks: Blocks, keys: string[]): ResultItem[] {
  const hasEnglishCookingBlocks = Boolean(blocks.TIMES || blocks.TEMPERATURE || blocks.STEPS);
  const hasEnglishMenuBlocks = Boolean(blocks.ORDER || blocks.SHOPPING || blocks.QUANTITIES);
  const useEnglish = hasEnglishCookingBlocks || hasEnglishMenuBlocks;
  const setupKey = findBlockKey(keys, ["SETUP", "CONFIGURACION", "CONFIGURACIÓN"]);
  const timeKey = findBlockKey(keys, ["TIEMPOS", "TIMES"]);
  const tempKey = findBlockKey(keys, ["TEMPERATURA", "TEMPERATURE"]);
  const stepsKey = findBlockKey(keys, ["PASOS", "STEPS"]);
  const errorKey = findBlockKey(keys, ["ERROR", "ERROR CLAVE", "KEY ERROR"]);
  const usedKeys = new Set([setupKey, timeKey, tempKey, stepsKey, errorKey].filter(Boolean));
  const items: ResultItem[] = [];

  if (setupKey) {
    items.push({
      key: setupKey,
      title: formatTitle(setupKey),
      content: blocks[setupKey],
      setup: detectSetupFromText(blocks[setupKey]),
      type: "card",
      variant: "setup",
    });
  }

  if (timeKey || tempKey) {
    const mergedKeys = [timeKey, tempKey].filter(Boolean) as string[];
    items.push({
      key: mergedKeys.join("-"),
      title: useEnglish ? "Times + Temperature" : "Tiempos + Temperatura",
      content: combineBlocks(blocks, mergedKeys),
      type: "card",
      variant: "summary",
    });
  }

  if (stepsKey) {
    items.push({
      key: stepsKey,
      title: formatTitle(stepsKey),
      content: blocks[stepsKey],
      type: "card",
      variant: "primary",
    });
  }

  if (errorKey) {
    items.push({
      key: errorKey,
      title: useEnglish ? "Key error" : "Error clave",
      content: blocks[errorKey],
      type: "card",
      variant: "tip",
    });
  }

  keys.forEach((key) => {
    if (usedKeys.has(key)) return;

    if (key === "TIMELINE") {
      items.push({
        key,
        title: useEnglish ? "⏱️ BBQ Timeline" : "⏱️ Timeline Parrillada",
        content: blocks[key],
        type: "timeline",
      });
      return;
    }

    if (key === "GRILL_MANAGER") {
      items.push({
        key,
        title: useEnglish ? "🔥 Grill Manager Pro" : "🔥 Grill Manager Pro",
        content: blocks[key],
        type: "grill",
      });
      return;
    }

    if (key === "COMPRA" || key === "SHOPPING") {
      items.push({ key, title: formatTitle(key), content: blocks[key], type: "shopping" });
      return;
    }

    items.push({ key, title: formatTitle(key), content: blocks[key], type: "card" });
  });

  return items;
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
  const items = getOrderedResultItems(blocks, keys);

  return (
    <Grid className="mx-auto max-w-5xl gap-4 md:gap-5" variant="cards">
      <PremiumResultSummaryCard blocks={blocks} keys={keys} lang={lang} />

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
