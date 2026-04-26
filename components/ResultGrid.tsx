"use client";

import { formatTitle, getGrillManagerLineClass, getShoppingItems } from "@/lib/uiHelpers";
import ResultCard from "./ResultCard";
import ResultTimeline from "./ResultTimeline";

type Blocks = Record<string, string>;

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
    <div className="rounded-3xl border border-orange-500/40 bg-slate-900 p-5 md:col-span-2">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>

      <div className="space-y-3">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-950 p-3 text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(checkedItems[item])}
              onChange={() => setCheckedItems({ ...checkedItems, [item]: !checkedItems[item] })}
              className="h-5 w-5 accent-orange-500"
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
    <div className="rounded-3xl border border-red-500/40 bg-slate-900 p-5 md:col-span-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">Control inteligente de zonas y prioridades</p>
        </div>
        <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">PRO</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {lines.map((line) => (
          <div key={line} className={getGrillManagerLineClass(line)}>
            <p className="text-sm font-semibold text-slate-100">{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400 md:col-span-2">
      {text}
    </div>
  );
}

function ResultLoadingState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-orange-400 md:col-span-2">
      {text}
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
    <div className="grid gap-4 md:grid-cols-2">
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
