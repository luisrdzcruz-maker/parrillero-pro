"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// ─── Narrated messages ────────────────────────────────────────────────────────

const MESSAGES_ES = [
  "Analizando el corte…",
  "Configurando zonas de calor…",
  "Calculando el reposo…",
  "Construyendo tu timeline…",
];

const MESSAGES_EN = [
  "Analyzing your cut…",
  "Setting heat zones…",
  "Calculating rest time…",
  "Building your timeline…",
];

// Progress bar checkpoints — feel like real computation stages, not fake %
// Each value is the width% the bar reaches after reaching that message index.
const PROGRESS_STEPS = [8, 28, 52, 74, 90];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  cutImage: string;
  cutName: string;
  lang?: string;
};

export function CookingLoadingScreen({ cutImage, cutName, lang = "es" }: Props) {
  const messages = lang === "es" ? MESSAGES_ES : MESSAGES_EN;
  const [step, setStep] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Advance the message + progress every 1200ms, stop at the last step
  useEffect(() => {
    if (step >= messages.length - 1) return;
    const id = setTimeout(() => setStep((s) => s + 1), 1200);
    return () => clearTimeout(id);
  }, [step, messages.length]);

  const progressPct = PROGRESS_STEPS[Math.min(step, PROGRESS_STEPS.length - 1)];

  return (
    // Fixed overlay — covers the entire screen including bottom nav
    <div className="fixed inset-0 z-40 flex flex-col bg-[#020202] text-white">
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />

      {/* ── Centered image + glow ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Ambient glow behind image */}
        <div
          className="animate-fire-breathe pointer-events-none absolute rounded-full"
          style={{
            width: 320,
            height: 320,
            background:
              "radial-gradient(circle, rgba(249,115,22,0.22) 0%, rgba(234,88,12,0.10) 40%, transparent 70%)",
          }}
        />

        {/* Cut image */}
        <div className="relative z-10 overflow-hidden rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.8)]"
          style={{ width: 220, height: 220 }}
        >
          {!imgError ? (
            <Image
              src={cutImage}
              alt={cutName}
              fill
              priority
              sizes="220px"
              className="object-cover object-center"
              onError={() => setImgError(true)}
            />
          ) : (
            // Fallback gradient when image fails
            <div
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(circle at 40% 35%, rgba(249,115,22,0.35), rgba(0,0,0,0.8) 70%)",
              }}
            />
          )}

          {/* Subtle vignette bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
        </div>

        {/* Cut name — small label below image */}
        <p className="relative z-10 mt-5 text-[13px] font-bold tracking-wide text-white/40">
          {cutName}
        </p>
      </div>

      {/* ── Bottom status strip ───────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pb-[max(3rem,env(safe-area-inset-bottom))] pt-2">
        {/* Animated message — key forces remount → re-runs CSS animation */}
        <div className="mb-5 min-h-[1.6rem] text-center">
          <p
            key={step}
            className="animate-msg-in text-[15px] font-semibold text-white/75"
          >
            {messages[step]}
          </p>
        </div>

        {/* Stepped progress bar */}
        <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/[0.07]">
          {/* Fill — CSS transition creates smooth glide between steps */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-orange-500 transition-[width] duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
          {/* Bright leading edge */}
          <div
            className="absolute inset-y-0 w-6 rounded-full blur-sm transition-[left] duration-700 ease-out"
            style={{
              left: `calc(${progressPct}% - 1.25rem)`,
              background:
                "linear-gradient(90deg, transparent, rgba(251,146,60,0.8))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
