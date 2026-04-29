"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LiveCookingScreen, { type LiveStep } from "@/components/live/LiveCookingScreen";
import {
  buildLiveStepsFromPayload,
  buildLiveStepsSignature,
  hasDistinctLiveSteps,
  readLiveCookingPayload,
} from "@/lib/liveCookingPlan";

// ─── Mock cooking plan ────────────────────────────────────────────────────────

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

// ─── Page (state + countdown logic only) ──────────────────────────────────────

export default function CoccionLivePage() {
  const liveSession = useMemo(() => {
    const payload = readLiveCookingPayload();
    const built = buildLiveStepsFromPayload(payload, MOCK_STEPS);

    if (!built.usedFallback) {
      const mockSignature = buildLiveStepsSignature(MOCK_STEPS);
      if (!hasDistinctLiveSteps(built.steps, MOCK_STEPS)) {
        console.warn("[live-cooking] Live steps match mock signature unexpectedly", {
          payloadSignature: payload?.signature ?? "",
          liveSignature: built.signature,
          mockSignature,
        });
      }
    }

    return built;
  }, []);

  const steps = liveSession.steps;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState((liveSession.steps[0] ?? MOCK_STEPS[0]).duration);
  const [paused, setPaused] = useState(false);
  const advancing = useRef(false);

  const step = steps[currentIndex] ?? steps[0];
  const isLast = currentIndex === steps.length - 1;
  const hasTimer = step.duration > 0;

  // ── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused || !hasTimer) return;

    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [paused, hasTimer, currentIndex]); // `remaining` intentionally excluded — interval runs continuously

  // ── Auto-advance when timer hits 0 ───────────────────────────────────────
  useEffect(() => {
    if (remaining > 0 || !hasTimer || isLast || advancing.current) return;

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
  }, [remaining, hasTimer, isLast, currentIndex, steps]);

  // ── Controls ─────────────────────────────────────────────────────────────
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
       * h-screen gives the shell an explicit height so that flex-1 children
       * inside LiveCookingScreen can reliably expand to fill it.
       * (min-h-screen alone does NOT give flex-1 a reference height in all browsers.)
       */}
      <div className="flex h-screen w-full flex-col overflow-hidden md:h-[844px] md:w-[390px] md:rounded-[3rem] md:border md:border-white/10 md:shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
        <LiveCookingScreen
          steps={steps}
          currentIndex={currentIndex}
          remaining={remaining}
          paused={paused}
          context={liveSession.usedFallback ? undefined : liveSession.context}
          onPause={() => setPaused((v) => !v)}
          onCompleteStep={completeStep}
          onGoToStep={goToStep}
        />
      </div>
    </div>
  );
}
