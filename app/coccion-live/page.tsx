"use client";

import { useEffect, useRef, useState } from "react";
import LiveCookingScreen, { type LiveStep } from "@/components/live/LiveCookingScreen";

// ─── Mock cooking plan ────────────────────────────────────────────────────────

const STEPS: LiveStep[] = [
  {
    id: "preheat",
    label: "Precalienta la parrilla",
    duration: 300,
    zone: "Directo",
    tempTarget: 230,
    notes: "Tapa cerrada, máxima potencia.",
  },
  {
    id: "sear1",
    label: "Sella lado 1",
    duration: 240,
    zone: "Directo",
    tempTarget: 230,
    notes: "No muevas la pieza hasta que se despegue sola.",
  },
  {
    id: "sear2",
    label: "Sella lado 2",
    duration: 240,
    zone: "Directo",
    tempTarget: 230,
    notes: "Busca costra dorada y uniforme.",
  },
  {
    id: "indirect",
    label: "Cocción indirecta",
    duration: 420,
    zone: "Indirecto",
    tempTarget: 150,
    notes: "Tapa cerrada, fuego medio-bajo.",
  },
  {
    id: "rest",
    label: "Reposo",
    duration: 360,
    zone: "Reposo",
    tempTarget: null,
    notes: "No cortes todavía. Los jugos se redistribuyen.",
  },
  {
    id: "serve",
    label: "Servir",
    duration: 0,
    zone: "Servir",
    tempTarget: null,
    notes: null,
  },
];

// ─── Page (state + countdown logic only) ──────────────────────────────────────

export default function CoccionLivePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(STEPS[0].duration);
  const [paused, setPaused] = useState(false);
  const advancing = useRef(false);

  const step = STEPS[currentIndex];
  const isLast = currentIndex === STEPS.length - 1;
  const hasTimer = step.duration > 0;

  // ── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused || !hasTimer) return;

    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
    // `remaining` intentionally excluded — interval runs continuously
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, hasTimer, currentIndex]);

  // ── Auto-advance when timer hits 0 ───────────────────────────────────────
  useEffect(() => {
    if (remaining > 0 || !hasTimer || isLast || advancing.current) return;

    advancing.current = true;
    const id = setTimeout(() => {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setRemaining(STEPS[next].duration);
      setPaused(false);
      advancing.current = false;
    }, 1200);

    return () => {
      clearTimeout(id);
      advancing.current = false;
    };
  }, [remaining, hasTimer, isLast, currentIndex]);

  // ── Controls ─────────────────────────────────────────────────────────────
  function completeStep() {
    if (isLast) return;
    const next = currentIndex + 1;
    setCurrentIndex(next);
    setRemaining(STEPS[next].duration);
    setPaused(false);
  }

  function goToStep(index: number) {
    setCurrentIndex(index);
    setRemaining(STEPS[index].duration);
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
          steps={STEPS}
          currentIndex={currentIndex}
          remaining={remaining}
          paused={paused}
          onPause={() => setPaused((v) => !v)}
          onCompleteStep={completeStep}
          onGoToStep={goToStep}
        />
      </div>
    </div>
  );
}
