"use client";

import { useEffect, useState } from "react";

// ─── Storage contract (mirrors app/coccion-live/page.tsx) ────────────────────

const SAVED_COOKS_KEY = "parrillero_saved_cooks_v1";

type SavedStep = {
  id: string;
  label: string;
  zone: string;
  duration: number;
  tempTarget?: number | null;
};

type SavedCook = {
  id: string;
  savedAt: string;
  context: string;
  steps: SavedStep[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readSavedCooks(): SavedCook[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_COOKS_KEY) ?? "[]") as SavedCook[];
  } catch {
    return [];
  }
}

function deleteSavedCook(id: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = readSavedCooks().filter((c) => c.id !== id);
    localStorage.setItem(SAVED_COOKS_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({ step }: { step: SavedStep }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {/* Zone dot */}
      <span
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
          step.zone === "Reposo"
            ? "bg-indigo-400"
            : step.zone === "Servir"
              ? "bg-emerald-400"
              : step.zone === "Indirecto"
                ? "bg-blue-400"
                : "bg-orange-400"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-line text-[13px] font-bold leading-[1.3] text-white/80">
          {step.label}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[10px] font-semibold text-white/30">{step.zone}</span>
          {step.duration > 0 && (
            <>
              <span className="text-[9px] text-white/20">·</span>
              <span className="text-[10px] font-semibold tabular-nums text-white/30">
                {formatDuration(step.duration)}
              </span>
            </>
          )}
          {step.tempTarget != null && (
            <>
              <span className="text-[9px] text-white/20">·</span>
              <span className="text-[10px] font-semibold text-orange-400/70">
                {step.tempTarget}°C
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CookCard({
  cook,
  onCookAgain,
  onDelete,
}: {
  cook: SavedCook;
  onCookAgain: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] transition-colors duration-300">
      {/* Header row — always visible, tap to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-white/[0.04]"
      >
        {/* Flame icon */}
        <span className="mt-0.5 shrink-0 text-[18px]">🔥</span>

        <div className="min-w-0 flex-1">
          {cook.context ? (
            <p className="text-[13px] font-black leading-tight text-white/85">
              {cook.context}
            </p>
          ) : (
            <p className="text-[13px] font-black text-white/45">Cocción guardada</p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-white/35">
              {formatDate(cook.savedAt)}
            </span>
            <span className="text-[9px] text-white/20">·</span>
            <span className="text-[10px] font-semibold text-white/35">
              {cook.steps.length} paso{cook.steps.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <span
          className={`shrink-0 text-[10px] text-white/25 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-4">
          {/* Step list */}
          <div className="mt-1 divide-y divide-white/[0.04]">
            {cook.steps.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onCookAgain}
              className="flex-1 min-h-[2.75rem] rounded-xl bg-orange-500 text-sm font-black text-black shadow-[0_4px_20px_rgba(249,115,22,0.35)] transition active:scale-[0.98] active:bg-orange-600 hover:bg-orange-400"
            >
              Cocinar de nuevo →
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="min-h-[2.75rem] rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm font-bold text-white/40 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 active:scale-[0.98]"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = {
  onStartCooking: () => void;
};

export function SavedCooksScreen({ onStartCooking }: Props) {
  const [cooks, setCooks] = useState<SavedCook[]>([]);
  const [ready, setReady] = useState(false);

  // Read after mount — avoid SSR mismatch with localStorage
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCooks(readSavedCooks());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handleDelete(id: string) {
    deleteSavedCook(id);
    setCooks((prev) => prev.filter((c) => c.id !== id));
  }

  // Skeleton while localStorage hasn't been read yet
  if (!ready) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className="h-16 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (cooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 px-4 py-16 text-center">
        <span className="text-[52px]">🍖</span>
        <div>
          <p className="text-[17px] font-black text-white/75">
            Aún no hay cocciones guardadas
          </p>
          <p className="mt-1.5 text-sm font-semibold text-white/40">
            Cuando termines una cocción live, guárdala con un toque.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartCooking}
          className="min-h-[3rem] w-full max-w-[280px] rounded-2xl bg-orange-500 text-sm font-black text-black shadow-[0_4px_28px_rgba(249,115,22,0.35)] transition active:scale-[0.98] hover:bg-orange-400"
        >
          Empezar cocción →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/28">
          {cooks.length} cocción{cooks.length !== 1 ? "es" : ""} guardada{cooks.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Cook list */}
      {cooks.map((cook) => (
        <CookCard
          key={cook.id}
          cook={cook}
          onCookAgain={onStartCooking}
          onDelete={() => handleDelete(cook.id)}
        />
      ))}
    </div>
  );
}
