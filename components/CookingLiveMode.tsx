"use client";

import LiveCookingScreen, { type LiveStep } from "@/components/live/LiveCookingScreen";

// ─── Types (unchanged — preserves existing contract) ──────────────────────────

type CookingStep = {
  title: string;
  duration: number;
  description: string;
  tips?: string[];
};

type Lang = "es" | "en" | "fi";

type CookingLiveModeProps = {
  context?: string;
  cookSteps: CookingStep[];
  currentStep: number;
  hasCookingPlan: boolean;
  lang: Lang;
  onBackToPlan: () => void;
  onCompleteStep: () => void;
  onEnableAlerts: () => Promise<void>;
  onGoToStep: (stepIndex: number) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onReset: () => void;
  setTimerRunning: (value: boolean) => void;
  timeLeft: number;
  timerRunning: boolean;
  cookingAlertsEnabled: boolean;
  cookingAlertMessage: string;
  notificationPermission: NotificationPermission | "unsupported";
};

// ─── Normalization helpers ────────────────────────────────────────────────────

function getCookingZone(step: CookingStep): string {
  const value = `${step.title} ${step.description}`.toLowerCase();
  if (value.includes("repos") || value.includes("rest")) return "Reposo";
  if (value.includes("serv") || value.includes("serve")) return "Servir";
  if (value.includes("indirect") || value.includes("indirecto") || value.includes("horno"))
    return "Indirecto";
  return "Directo";
}

function normalizeSteps(cookSteps: CookingStep[]): LiveStep[] {
  return cookSteps.map((s, i) => ({
    id: `step-${i}`,
    label: s.title,
    zone: getCookingZone(s),
    duration: s.duration,
    notes: s.description || null,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CookingLiveMode({
  context,
  cookSteps,
  currentStep,
  hasCookingPlan,
  lang,
  onBackToPlan,
  onCompleteStep,
  onEnableAlerts,
  onGoToStep,
  onPreviousStep,
  onReset,
  setTimerRunning,
  timeLeft,
  timerRunning,
  cookingAlertsEnabled,
  cookingAlertMessage,
}: CookingLiveModeProps) {
  const isSpanish = lang === "es";

  // ── Empty / no-plan state ───────────────────────────────────────────────────
  if (!hasCookingPlan || cookSteps.length === 0) {
    return (
      <section className="flex min-h-screen flex-col bg-[#030303] px-4 pb-28 pt-5 text-white">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-between">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToPlan}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition active:scale-[0.98]"
            >
              ← {isSpanish ? "Plan" : "Plan"}
            </button>
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                Live
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">
              {isSpanish ? "Modo cocina" : "Cooking mode"}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
              {isSpanish
                ? "Tu sesión empieza con un plan."
                : "Your session starts with a plan."}
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {isSpanish
                ? "Genera un plan de cocción para activar pasos, temporizador y progreso en vivo."
                : "Generate a cooking plan to unlock steps, timer and live progress."}
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToPlan}
            className="min-h-14 w-full rounded-2xl bg-orange-500 px-5 font-black text-black shadow-lg shadow-orange-500/25 transition hover:bg-orange-400 active:scale-[0.98]"
          >
            {isSpanish ? "Crear plan de cocción" : "Create cooking plan"}
          </button>
        </div>
      </section>
    );
  }

  // ── Active mode — delegate entirely to LiveCookingScreen ────────────────────
  const liveSteps = normalizeSteps(cookSteps);

  return (
    <section className="flex min-h-screen flex-col">
      <LiveCookingScreen
        steps={liveSteps}
        currentIndex={currentStep}
        remaining={timeLeft}
        paused={!timerRunning}
        context={context}
        lang={lang}
        onBack={onBackToPlan}
        onReset={onReset}
        onPause={() => setTimerRunning(!timerRunning)}
        onCompleteStep={onCompleteStep}
        onPreviousStep={onPreviousStep}
        onGoToStep={onGoToStep}
        alertMessage={cookingAlertMessage || undefined}
        alertsEnabled={cookingAlertsEnabled}
        onEnableAlerts={onEnableAlerts}
      />
    </section>
  );
}
