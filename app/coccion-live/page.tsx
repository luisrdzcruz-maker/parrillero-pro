"use client";

import { useEffect, useRef, useState } from "react";
import LiveCookingScreen, { type LiveStep } from "@/components/live/LiveCookingScreen";
import {
  buildLiveStepsFromPayload,
  buildLiveStepsSignature,
  hasDistinctLiveSteps,
  readLiveCookingPayload,
} from "@/lib/liveCookingPlan";

// ─── Mock cooking plan (fallback only — used after mount if no real plan) ─────

const MOCK_STEPS: LiveStep[] = [
  {
    id: "preheat",
    label: "Calienta la parrilla.\nMáxima potencia.",
    duration: 300,
    zone: "Directo",
    tempTarget: 230,
    notes: "Tapa cerrada. Espera a que alcance temperatura.",
  },
  {
    id: "sear1",
    label: "Sella.\nLado 1.",
    duration: 240,
    zone: "Directo",
    tempTarget: 230,
    notes: "No la muevas. Déjala hasta que se despegue sola.",
  },
  {
    id: "sear2",
    label: "Sella.\nLado 2.",
    duration: 240,
    zone: "Directo",
    tempTarget: 230,
    notes: "Busca costra dorada y uniforme en toda la superficie.",
  },
  {
    id: "indirect",
    label: "Cocción indirecta.\nFuego bajo.",
    duration: 420,
    zone: "Indirecto",
    tempTarget: 150,
    notes: "Tapa cerrada. Deja que el calor circule sin llama directa.",
  },
  {
    id: "rest",
    label: "Reposa.\nNo cortes aún.",
    duration: 360,
    zone: "Reposo",
    tempTarget: null,
    notes: "Los jugos se redistribuyen. Vale la pena esperar.",
  },
  {
    id: "serve",
    label: "Listo.\nSirve ahora.",
    duration: 0,
    zone: "Servir",
    tempTarget: null,
    notes: null,
  },
];

// ─── Save-cook storage ────────────────────────────────────────────────────────

const SAVED_COOKS_KEY = "parrillero_saved_cooks_v1";

type SavedCook = {
  id: string;
  savedAt: string;
  context: string;
  steps: LiveStep[];
};

function persistCook(steps: LiveStep[], context: string | undefined) {
  if (typeof window === "undefined") return;
  try {
    const existing: SavedCook[] = JSON.parse(
      localStorage.getItem(SAVED_COOKS_KEY) ?? "[]",
    );
    const entry: SavedCook = {
      id: `cook_${Date.now()}`,
      savedAt: new Date().toISOString(),
      context: context ?? "",
      steps,
    };
    // Keep the 20 most recent saves
    localStorage.setItem(
      SAVED_COOKS_KEY,
      JSON.stringify([entry, ...existing].slice(0, 20)),
    );
  } catch {
    // localStorage unavailable or quota exceeded — silently skip
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
//
// Hydration-safe pattern:
//   · All sessionStorage reads happen in useEffect (never during render/SSR).
//   · clientReady starts as false — server and initial client render are identical
//     (both show the stable dark shell, zero plan-specific values).
//   · After mount the effect reads the payload, resolves steps, and sets
//     clientReady = true to swap in LiveCookingScreen.

export default function CoccionLivePage() {
  // ── Hydration gate ────────────────────────────────────────────────────────
  const [clientReady, setClientReady] = useState(false);

  // ── Session state (all initialized to plan-neutral values) ────────────────
  const [steps, setSteps] = useState<LiveStep[]>(MOCK_STEPS);
  const [context, setContext] = useState<string | undefined>(undefined);

  // ── Playback state ────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0); // set to real duration after mount
  const [paused, setPaused] = useState(false);
  const advancing = useRef(false);

  // ── Step shortcuts (safe to derive from state at all times) ──────────────
  const step = steps[currentIndex] ?? steps[0];
  const isLast = currentIndex === steps.length - 1;
  const hasTimer = step.duration > 0;

  // ── Mount: read sessionStorage, resolve plan, enable UI ──────────────────
  // State updates are deferred to the next animation frame so they are never
  // synchronous inside the effect body (satisfies react-hooks/set-state-in-effect).
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const payload = readLiveCookingPayload();
      const built = buildLiveStepsFromPayload(payload, MOCK_STEPS);

      if (!built.usedFallback) {
        if (!hasDistinctLiveSteps(built.steps, MOCK_STEPS)) {
          console.warn("[live-cooking] Live steps match mock signature unexpectedly", {
            payloadSignature: payload?.signature ?? "",
            liveSignature: built.signature,
            mockSignature: buildLiveStepsSignature(MOCK_STEPS),
          });
        }
      }

      setSteps(built.steps);
      setContext(built.usedFallback ? undefined : built.context);
      setRemaining((built.steps[0] ?? MOCK_STEPS[0]).duration);
      setCurrentIndex(0);
      setPaused(false);
      setClientReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []); // runs once, after first paint

  // ── Countdown (only active after clientReady) ────────────────────────────
  useEffect(() => {
    if (!clientReady || paused || !hasTimer) return;

    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [clientReady, paused, hasTimer, currentIndex]);

  // ── Auto-advance when timer hits 0 (only after clientReady) ──────────────
  useEffect(() => {
    if (!clientReady || remaining > 0 || !hasTimer || isLast || advancing.current) return;

    advancing.current = true;
    const id = setTimeout(() => {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setRemaining((steps[next] ?? steps[steps.length - 1]).duration);
      setPaused(false);
      advancing.current = false;
    }, 1200);

    return () => {
      clearTimeout(id);
      advancing.current = false;
    };
  }, [clientReady, remaining, hasTimer, isLast, currentIndex, steps]);

  // ── Controls ──────────────────────────────────────────────────────────────
  function completeStep() {
    if (isLast) return;
    const next = currentIndex + 1;
    setCurrentIndex(next);
    setRemaining((steps[next] ?? steps[steps.length - 1]).duration);
    setPaused(false);
  }

  function goToStep(index: number) {
    setCurrentIndex(index);
    setRemaining((steps[index] ?? steps[steps.length - 1]).duration);
    setPaused(false);
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  // On mobile: full-screen shell (h-screen, overflow-hidden)
  // On desktop: dark canvas + centered phone shell (390×844)
  return (
    <div className="bg-[#0a0a0a] md:flex md:min-h-screen md:items-start md:justify-center md:py-8">
      {/*
       * h-screen gives the shell an explicit height so flex-1 children inside
       * LiveCookingScreen can reliably expand to fill it.
       */}
      <div className="flex h-screen w-full flex-col overflow-hidden md:h-[844px] md:w-[390px] md:rounded-[3rem] md:border md:border-white/10 md:shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
        {!clientReady ? (
          // ── Stable SSR shell ──────────────────────────────────────────────
          // Identical on server and client; contains zero plan-specific values.
          // Replaced by LiveCookingScreen once the mount effect resolves steps.
          <div className="flex flex-1 flex-col items-center justify-center bg-[#020202]">
            <div className="h-[3px] w-14 rounded-full bg-orange-500/35" />
          </div>
        ) : (
          <LiveCookingScreen
            steps={steps}
            currentIndex={currentIndex}
            remaining={remaining}
            paused={paused}
            context={context}
            onPause={() => setPaused((v) => !v)}
            onCompleteStep={completeStep}
            onGoToStep={goToStep}
            onSaveCook={() => persistCook(steps, context)}
          />
        )}
      </div>
    </div>
  );
}
