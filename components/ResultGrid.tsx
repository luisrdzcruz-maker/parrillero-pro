"use client";

import { formatTitle, getGrillManagerLineClass, getShoppingItems } from "@/lib/uiHelpers";
import ResultCard from "./ResultCard";
import ResultTimeline from "./ResultTimeline";

type Blocks = Record<string, string>;

const fullWidthPanel =
  "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-900/65 shadow-lg shadow-black/20 ring-1 ring-inset ring-white/[0.03] transition-all duration-200 md:col-span-2";

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
    <div className={`${fullWidthPanel} hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10`}>
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-emerald-400/70" />
      <div className="flex flex-col gap-3 border-b border-white/5 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base">
            🛒
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Checklist</p>
            <h3 className="mt-1 text-sm font-semibold tracking-wide text-white">{title}</h3>
          </div>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
          {items.length} items
        </span>
      </div>

      <div className="grid gap-2.5 p-4 sm:grid-cols-2 sm:p-5">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-slate-300 transition hover:border-emerald-400/40 hover:bg-white/[0.06]">
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
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <div className={`${fullWidthPanel} p-4 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/10 sm:p-5`}>
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-red-400/70" />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base">
            🎛️
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">Control inteligente de zonas y prioridades</p>
          </div>
        </div>
        <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-200">PRO</span>
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
    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-8 text-center text-sm leading-relaxed text-slate-400 shadow-lg shadow-black/10 ring-1 ring-inset ring-white/[0.03] md:col-span-2">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl shadow-sm shadow-black/10">
        🍽️
      </div>
      <p>{text}</p>
    </div>
  );
}

function ResultLoadingState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-orange-200 shadow-lg shadow-black/10 ring-1 ring-inset ring-white/[0.03] md:col-span-2">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 animate-pulse rounded-xl border border-orange-400/20 bg-orange-400/20" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{text}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
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
  return (
    <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 md:gap-5">
      {keys.map((key) =>
        key === "TIMELINE" ? (
          <ResultTimeline key={key} title="⏱️ Timeline Parrillada" content={blocks[key]} />
        ) : key === "GRILL_MANAGER" ? (
          <GrillManagerCard key={key} title="🔥 Grill Manager Pro" content={blocks[key]} />
        ) : key === "COMPRA" || key === "SHOPPING" ? (
          <ShoppingListCard key={key} title={formatTitle(key)} content={blocks[key]} checkedItems={checkedItems} setCheckedItems={setCheckedItems} />
        ) : (
          <ResultCard key={key} title={formatTitle(key)} content={blocks[key]} />
        )
      )}

      {!loading && keys.length === 0 && <ResultEmptyState text={t.noResult} />}

      {loading && <ResultLoadingState text={t.generating} />}
    </div>
  );
}
