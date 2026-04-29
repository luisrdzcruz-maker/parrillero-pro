"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cutImages } from "@/lib/media/cutImages";

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
  context: string; // "Vacuno · Chuletón · parrilla gas"
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

// Parse "Vacuno · Chuletón · parrilla gas" → { animal, cut, equipment }
function parseContext(context: string) {
  const parts = context.split(" · ");
  return {
    animal: parts[0]?.trim() ?? "",
    cut: parts[1]?.trim() ?? "",
    equipment: parts[2]?.trim() ?? "",
  };
}

// Normalize a string to match cutImages keys
function normalizeCutKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// Resolve a cut image from context — fuzzy match then animal fallback
function resolveCutImage(context: string): string | null {
  if (!context) return null;
  const { animal, cut } = parseContext(context);

  // Try direct and partial cut-key match
  const key = normalizeCutKey(cut);
  if (cutImages[key]) return cutImages[key];
  for (const [k, img] of Object.entries(cutImages)) {
    if (key.includes(k) || k.includes(key)) return img;
  }

  // Animal fallback
  const a = animal.toLowerCase();
  if (a.includes("vacuno") || a.includes("ternera")) return "/images/vacuno/ribeye-cooked.webp";
  if (a.includes("cerdo") || a.includes("ibérico")) return "/images/cerdo/lomo-cooked.webp";
  if (a.includes("pollo")) return "/images/pollo/muslos-cooked.webp";
  if (a.includes("pescado") || a.includes("mariscos")) return "/images/pescado/lubina-cooked.webp";
  if (a.includes("verduras")) return "/images/verduras/pimientos.webp";

  return null;
}

// Animal emoji fallback when no image resolves
function animalEmoji(context: string): string {
  const a = parseContext(context).animal.toLowerCase();
  if (a.includes("pollo")) return "🐓";
  if (a.includes("cerdo")) return "🐷";
  if (a.includes("verduras")) return "🌿";
  if (a.includes("pescado")) return "🐟";
  return "🥩";
}

// Derive an emotional label — makes each entry feel personal
type LabelStyle = { text: string; cls: string };

function getLabel(cook: SavedCook, index: number): LabelStyle {
  if (index === 0) {
    return { text: "Tu última cocción", cls: "border-orange-500/40 bg-orange-500/15 text-orange-300" };
  }
  const day = new Date(cook.savedAt).getDay();
  if (day === 0 || day === 6) {
    return { text: "Fin de semana", cls: "border-amber-400/35 bg-amber-400/10 text-amber-300" };
  }
  const hasRest = cook.steps.some((s) => s.zone === "Reposo");
  if (hasRest && cook.steps.length >= 5) {
    return { text: "Cocción completa", cls: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300" };
  }
  if (hasRest) {
    return { text: "Bien reposado", cls: "border-indigo-400/35 bg-indigo-400/10 text-indigo-300" };
  }
  if (cook.steps.length <= 2) {
    return { text: "Cocción rápida", cls: "border-blue-400/30 bg-blue-400/8 text-blue-300" };
  }
  return { text: "Guardado", cls: "border-white/15 bg-white/5 text-white/45" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({ step }: { step: SavedStep }) {
  const dotCls =
    step.zone === "Reposo"
      ? "bg-indigo-400"
      : step.zone === "Servir"
        ? "bg-emerald-400"
        : step.zone === "Indirecto"
          ? "bg-blue-400"
          : "bg-orange-400";

  return (
    <div className="flex items-start gap-2.5 py-2">
      <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${dotCls}`} />
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-line text-[12.5px] font-bold leading-[1.3] text-white/75">
          {step.label}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-white/28">
          <span>{step.zone}</span>
          {step.duration > 0 && (
            <>
              <span className="opacity-50">·</span>
              <span className="tabular-nums">{formatDuration(step.duration)}</span>
            </>
          )}
          {step.tempTarget != null && (
            <>
              <span className="opacity-50">·</span>
              <span className="text-orange-400/60">{step.tempTarget}°C</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CookCard({
  cook,
  index,
  onCookAgain,
  onDelete,
}: {
  cook: SavedCook;
  index: number;
  onCookAgain: () => void;
  onDelete: () => void;
}) {
  const [showSteps, setShowSteps] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { cut, equipment } = parseContext(cook.context);
  const img = resolveCutImage(cook.context);
  const label = getLabel(cook, index);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      {/* ── Card body ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 p-3.5">
        {/* Thumbnail */}
        <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
          {img && !imgError ? (
            <Image
              src={img}
              alt={cut || "Corte"}
              fill
              sizes="60px"
              className="object-cover object-center"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[26px]">
              {animalEmoji(cook.context)}
            </div>
          )}
          {/* Vignette */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          {/* Emotional label */}
          <span
            className={`inline-block rounded-full border px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.18em] ${label.cls}`}
          >
            {label.text}
          </span>

          {/* Cut name */}
          <p className="mt-1 truncate text-[14px] font-black leading-tight text-white/88">
            {cut || "Cocción guardada"}
          </p>

          {/* Meta row */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-white/32">
            {equipment && <span>{equipment}</span>}
            {equipment && <span className="opacity-50">·</span>}
            <span>{formatDate(cook.savedAt)}</span>
            <span className="opacity-50">·</span>
            <span>{cook.steps.length} pasos</span>
          </div>
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 self-start rounded-lg p-1.5 text-[11px] font-bold text-white/20 transition hover:bg-red-500/10 hover:text-red-400 active:scale-[0.96]"
          aria-label="Eliminar"
        >
          ✕
        </button>
      </div>

      {/* ── Actions (always visible) ────────────────────────────────────── */}
      <div className="flex gap-2 border-t border-white/[0.055] px-3.5 py-3">
        <button
          type="button"
          onClick={onCookAgain}
          className="min-h-[2.5rem] flex-1 rounded-xl bg-orange-500 text-[13px] font-black text-black shadow-[0_3px_16px_rgba(249,115,22,0.32)] transition active:scale-[0.97] active:bg-orange-600 hover:bg-orange-400"
        >
          Cocinar de nuevo →
        </button>
        <button
          type="button"
          onClick={() => setShowSteps((v) => !v)}
          className={`min-h-[2.5rem] rounded-xl border px-4 text-[13px] font-black transition active:scale-[0.97] ${
            showSteps
              ? "border-white/20 bg-white/[0.08] text-white/75"
              : "border-white/[0.08] bg-white/[0.04] text-white/45 hover:text-white/65"
          }`}
        >
          {showSteps ? "Ocultar" : "Ver pasos"}
        </button>
      </div>

      {/* ── Step detail (collapsible) ───────────────────────────────────── */}
      {showSteps && (
        <div className="divide-y divide-white/[0.04] border-t border-white/[0.055] px-4 pb-3">
          {cook.steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
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

  // Skeleton
  if (!ready) {
    return (
      <div className="space-y-3 py-2">
        {[0, 1].map((n) => (
          <div
            key={n}
            className="h-[110px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  // Empty state — motivating, not flat
  if (cooks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 px-4 py-16 text-center">
        {/* Glow behind icon */}
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
              transform: "scale(2.5)",
            }}
          />
          <span className="relative text-[56px]">🔥</span>
        </div>

        <div>
          <p className="text-[18px] font-black text-white/80">
            Tu historial te espera
          </p>
          <p className="mt-2 text-[14px] font-semibold leading-relaxed text-white/42">
            Termina una cocción live y guárdala.{"\n"}
            Aquí construirás tu biblioteca personal.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartCooking}
          className="min-h-[3rem] w-full max-w-[260px] rounded-2xl bg-orange-500 text-[14px] font-black text-black shadow-[0_4px_28px_rgba(249,115,22,0.38)] transition active:scale-[0.97] hover:bg-orange-400"
        >
          Empezar cocción →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Count header */}
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
        {cooks.length} cocción{cooks.length !== 1 ? "es" : ""} en tu historial
      </p>

      {/* List */}
      {cooks.map((cook, i) => (
        <CookCard
          key={cook.id}
          cook={cook}
          index={i}
          onCookAgain={onStartCooking}
          onDelete={() => handleDelete(cook.id)}
        />
      ))}
    </div>
  );
}
