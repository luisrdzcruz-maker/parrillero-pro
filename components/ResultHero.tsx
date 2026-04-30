"use client";

import ResultActions from "@/components/ResultActions";
import { Button, Panel } from "@/components/ui";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";

export default function ResultHero({
  actions,
  context,
  hasResult,
  lang = "es",
  onEdit,
  saveMenuStatus,
  t,
}: {
  actions: {
    onCopy: () => void;
    onSave?: () => Promise<void>;
    onShare?: () => void;
    onStartCooking?: () => void;
  };
  context?: string;
  hasResult: boolean;
  lang?: "es" | "en" | "fi";
  onEdit?: () => void;
  saveMenuStatus?: SaveMenuStatus;
  t: {
    copy: string;
    result: string;
    save: string;
    saving: string;
    share: string;
    startCooking: string;
  };
}) {
  const isEs = lang === "es";
  return (
    <Panel as="section" className="relative mb-3 overflow-hidden p-3 sm:mb-5 sm:p-5" tone="hero">
      {/* Top shimmer */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-orange-500/[0.06] blur-2xl" />

      <div className="relative z-10 space-y-4">
        {/* ── Header row ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.2em] text-orange-300/90">
              {context || (isEs ? "Plan de cocción" : "Cooking plan")}
            </p>
            <h2 className="mt-0.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isEs ? "Resultado listo 🔥" : "Result ready 🔥"}
            </h2>
          </div>

          {onEdit && (
            <Button
              className="shrink-0 rounded-full px-3 py-1.5 text-xs"
              onClick={onEdit}
              variant="secondary"
            >
              {isEs ? "← Editar" : "← Edit"}
            </Button>
          )}
        </div>

        {/* ── Live Cooking CTA — primary action ─────────────────────────────── */}
        {actions.onStartCooking && (
          <div className="relative">
            {/* Soft glow halo */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-[17px] bg-gradient-to-r from-orange-500/45 via-orange-400/25 to-orange-500/45 blur-sm"
            />
            <button
              type="button"
              onClick={actions.onStartCooking}
              className="relative flex w-full items-center gap-4 rounded-2xl border border-orange-400/45 bg-gradient-to-br from-orange-500/18 to-orange-400/8 px-4 py-3.5 transition-all duration-200 hover:border-orange-400/65 hover:from-orange-500/28 hover:to-orange-400/14 active:scale-[0.99] sm:px-5 sm:py-4"
            >
              {/* Icon */}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/30 bg-orange-500/20 text-xl shadow-sm shadow-orange-500/10">
                ⚡
              </span>

              {/* Labels */}
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                  {isEs ? "Listo para cocinar" : "Ready to cook"}
                </p>
                <p className="mt-0.5 truncate text-base font-black text-white">
                  {t.startCooking}
                </p>
              </div>

              {/* LIVE badge */}
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/15 px-2.5 py-1 shadow-sm shadow-orange-500/10">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                  {isEs ? "En vivo" : "Live"}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* ── Secondary actions ─────────────────────────────────────────────── */}
        <ResultActions
          actions={{ ...actions, onStartCooking: undefined }}
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
            startCooking: t.startCooking,
          }}
        />
      </div>
    </Panel>
  );
}
