"use client";

import { Badge, Card, Grid } from "@/components/ui";
import { ds } from "@/lib/design-system";
import { formatTitle, getGrillManagerLineClass, getShoppingItems } from "@/lib/uiHelpers";
import ResultCard from "@/components/ResultCard";
import ResultTimeline from "./ResultTimeline";

type Blocks = Record<string, string>;
type ResultItem =
  | {
      key: string;
      title: string;
      content: string;
      type: "card";
      variant?: "default" | "primary" | "summary" | "tip" | "setup";
    }
  | { key: string; title: string; content: string; type: "timeline" }
  | { key: string; title: string; content: string; type: "grill" }
  | { key: string; title: string; content: string; type: "shopping" };

const fullWidthPanel = `${ds.panel.result} transition-all duration-200 md:col-span-2`;

function ShoppingListCard({
  title,
  content,
  checkedItems,
  setCheckedItems,
}: {
  title: string;
  content: string;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
}) {
  const items = getShoppingItems(content);

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
              Checklist
            </p>
            <h3 className="mt-1 text-sm font-semibold tracking-wide text-white">{title}</h3>
          </div>
        </div>
        <Badge className="w-fit font-medium" tone="glass">
          {items.length} items
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

function GrillManagerCard({ title, content }: { title: string; content: string }) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

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
              Control inteligente de zonas y prioridades
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
      type: "card",
      variant: "setup",
    });
  }

  if (timeKey || tempKey) {
    const mergedKeys = [timeKey, tempKey].filter(Boolean) as string[];
    items.push({
      key: mergedKeys.join("-"),
      title: "Tiempos + Temperatura",
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
      title: "Error clave",
      content: blocks[errorKey],
      type: "card",
      variant: "tip",
    });
  }

  keys.forEach((key) => {
    if (usedKeys.has(key)) return;

    if (key === "TIMELINE") {
      items.push({ key, title: "⏱️ Timeline Parrillada", content: blocks[key], type: "timeline" });
      return;
    }

    if (key === "GRILL_MANAGER") {
      items.push({ key, title: "🔥 Grill Manager Pro", content: blocks[key], type: "grill" });
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
  keys,
  loading,
  setCheckedItems,
  t,
}: {
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  keys: string[];
  loading: boolean;
  setCheckedItems: (value: Record<string, boolean>) => void;
  t: {
    generating: string;
    noResult: string;
  };
}) {
  const items = getOrderedResultItems(blocks, keys);

  return (
    <Grid className="mx-auto max-w-5xl md:gap-5" variant="cards">
      {items.map((item) => {
        if (item.type === "timeline") {
          return <ResultTimeline key={item.key} title={item.title} content={item.content} />;
        }

        if (item.type === "grill") {
          return <GrillManagerCard key={item.key} title={item.title} content={item.content} />;
        }

        if (item.type === "shopping") {
          return (
            <ShoppingListCard
              key={item.key}
              title={item.title}
              content={item.content}
              checkedItems={checkedItems}
              setCheckedItems={setCheckedItems}
            />
          );
        }

        return (
          <ResultCard
            key={item.key}
            title={item.title}
            content={item.content}
            variant={item.variant}
          />
        );
      })}

      {!loading && keys.length === 0 && <ResultEmptyState text={t.noResult} />}

      {loading && <ResultLoadingState text={t.generating} />}
    </Grid>
  );
}
