"use client";

import { useLayoutEffect, useRef, useState, type TouchEvent } from "react";
import { ONBOARDING_STORAGE_KEY } from "@/lib/storageKeys";

// ─── Constants ───────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 50;

// ─── Slide data ───────────────────────────────────────────────────────────────

type SlideData = {
  icon: string;
  headline: string;
  body: string;
};

const SLIDES: SlideData[] = [
  {
    icon: "🔥",
    headline: "Cook like\na pro",
    body: "Real-time guidance,\nnot recipes",
  },
  {
    icon: "⏱",
    headline: "Never miss\ntiming",
    body: "Live cooking assistant\nwith timers",
  },
  {
    icon: "🎯",
    headline: "Feel in\ncontrol",
    body: "Step-by-step\nguidance",
  },
];

// ─── Animated slide content ───────────────────────────────────────────────────

function SlideView({ slide, direction }: { slide: SlideData; direction: 1 | -1 }) {
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    const outer = requestAnimationFrame(() => {
      const inner = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(inner);
    });
    return () => cancelAnimationFrame(outer);
  }, []);

  const startClass = direction > 0 ? "translate-x-10 opacity-0" : "-translate-x-10 opacity-0";

  return (
    <div
      className={`flex flex-col items-center text-center transition-[opacity,transform] duration-500 ease-out ${
        entered ? "translate-x-0 opacity-100" : startClass
      }`}
    >
      {/* Icon tile */}
      <div className="mb-10 flex h-24 w-24 items-center justify-center rounded-3xl border border-orange-500/20 bg-orange-500/10 text-5xl shadow-[0_0_64px_rgba(249,115,22,0.20)]">
        {slide.icon}
      </div>

      {/* Headline — intentional whitespace-pre-line for line control */}
      <h1 className="whitespace-pre-line text-[clamp(2.8rem,13vw,5.5rem)] font-black leading-[0.88] tracking-[-0.05em] text-white">
        {slide.headline}
      </h1>

      {/* Supporting text */}
      <p className="mt-5 whitespace-pre-line text-[15px] font-medium leading-[1.65] text-slate-400">
        {slide.body}
      </p>
    </div>
  );
}

// ─── OnboardingSlides ─────────────────────────────────────────────────────────

export function OnboardingSlides({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);

  const isLast = index === SLIDES.length - 1;

  function dismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    }
    onDone();
  }

  function goTo(next: number) {
    if (next < 0 || next >= SLIDES.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function advance() {
    if (isLast) {
      dismiss();
      return;
    }
    goTo(index + 1);
  }

  function retreat() {
    goTo(index - 1);
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) advance();
    else retreat();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex select-none flex-col overflow-hidden bg-[#020617]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Ambient background ──────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-orange-500/12 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-orange-400/8 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
      </div>

      {/* ── Top bar: progress pills + skip ──────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-[max(48px,env(safe-area-inset-top))]">
        {/* Progress pills — tappable for direct navigation */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-[3px] rounded-full transition-all duration-300 ease-out ${
                i === index
                  ? "w-8 bg-orange-400"
                  : i < index
                    ? "w-3 bg-orange-500/40"
                    : "w-3 bg-white/[0.12]"
              }`}
            />
          ))}
        </div>

        {/* Skip */}
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-300 active:scale-95"
        >
          Skip
        </button>
      </div>

      {/* ── Slide content — keyed for remount on index change ────────────────── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8">
        <SlideView key={index} slide={SLIDES[index]} direction={direction} />
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 space-y-3 px-6 pb-[max(40px,env(safe-area-inset-bottom))]">
        {isLast ? (
          /* Final CTA — glowing primary */
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-[20px] bg-orange-500/25 blur-xl"
            />
            <button
              type="button"
              onClick={dismiss}
              className="relative w-full rounded-2xl bg-orange-500 py-5 text-base font-black text-black shadow-[0_8px_36px_rgba(249,115,22,0.42)] transition-all duration-200 hover:bg-orange-400 active:scale-[0.97]"
            >
              Start your first cook →
            </button>
          </div>
        ) : (
          /* Continue — ghost, stays out of spotlight */
          <button
            type="button"
            onClick={advance}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-5 text-base font-black text-white backdrop-blur transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.08] active:scale-[0.97]"
          >
            Continue
          </button>
        )}

        {/* Swipe hint — only on first slide */}
        {index === 0 && (
          <p className="text-center text-[11px] font-medium tracking-wide text-slate-600">
            Swipe to explore
          </p>
        )}
      </div>
    </div>
  );
}
