"use client";

import { useRef, useState, type TouchEvent } from "react";
import { Badge, Button, Panel } from "@/components/ui";

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

type TouchPoint = {
  x: number;
  y: number;
};

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function getCookingZone(step: CookingStep) {
  const value = `${step.title} ${step.description}`.toLowerCase();

  if (value.includes("repos") || value.includes("rest")) return "Reposo";
  if (value.includes("serv") || value.includes("serve")) return "Servir";
  if (value.includes("indirect") || value.includes("indirecto") || value.includes("horno")) return "Indirecto";

  return "Directo";
}

function getShortContext(step: CookingStep) {
  return step.description.replace(/\s+/g, " ").trim();
}

function getSessionProgress(currentStep: number, totalSteps: number) {
  if (totalSteps <= 1) return 100;
  return Math.round((currentStep / (totalSteps - 1)) * 100);
}

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
  onNextStep,
  onPreviousStep,
  onReset,
  setTimerRunning,
  timeLeft,
  timerRunning,
  cookingAlertsEnabled,
  cookingAlertMessage,
  notificationPermission,
}: CookingLiveModeProps) {
  const touchStartRef = useRef<TouchPoint | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const isSpanish = lang === "es";
  const completeLabel = isSpanish ? "Completar paso" : "Complete step";
  const stepLabel = isSpanish ? "Paso" : "Step";
  const nextLabel = isSpanish ? "Siguiente" : "Next";
  const alertsLabel = isSpanish ? "Activar avisos" : "Enable alerts";
  const alertsActiveLabel =
    notificationPermission === "denied"
      ? isSpanish
        ? "Avisos en app"
        : "In-app alerts"
      : notificationPermission === "unsupported"
        ? isSpanish
          ? "Sonido activo"
          : "Sound active"
        : isSpanish
          ? "Avisos activados"
          : "Alerts enabled";

  if (!hasCookingPlan || cookSteps.length === 0) {
    return (
      <section className="min-h-[calc(100vh-2rem)] overflow-hidden pb-28 md:pb-6">
        <Panel className="flex min-h-[calc(100vh-2rem)] flex-col justify-between p-5" tone="hero">
          <div className="flex items-center justify-between">
            <Button className="rounded-full px-3 py-2 text-xs" onClick={onBackToPlan} variant="secondary">
              ← {isSpanish ? "Plan" : "Plan"}
            </Button>
            <Badge className="uppercase tracking-[0.2em]">Live</Badge>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">
              {isSpanish ? "Modo cocina" : "Cooking mode"}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
              {isSpanish ? "Tu sesión empieza con un plan." : "Your session starts with a plan."}
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {isSpanish
                ? "Genera un plan de cocción para activar pasos, temporizador y progreso en vivo."
                : "Generate a cooking plan to unlock steps, timer and live progress."}
            </p>
          </div>

          <Button className="py-4 text-base font-black" fullWidth onClick={onBackToPlan}>
            {isSpanish ? "Crear plan de cocción" : "Create cooking plan"}
          </Button>
        </Panel>
      </section>
    );
  }

  const step = cookSteps[currentStep];
  const nextStep = cookSteps[currentStep + 1];
  const totalSteps = cookSteps.length;
  const hasTimer = Number.isFinite(step.duration) && step.duration > 0;
  const stepProgress = hasTimer ? Math.min(100, Math.max(0, ((step.duration - timeLeft) / step.duration) * 100)) : 0;
  const sessionProgress = getSessionProgress(currentStep, totalSteps);
  const shortContext = getShortContext(step);
  const zone = getCookingZone(step);
  const isFinishing = hasTimer && timeLeft > 0 && timeLeft <= 10;
  const pauseLabel = timerRunning
    ? isSpanish
      ? "Pausar"
      : "Pause"
    : timeLeft === step.duration
      ? isSpanish
        ? "Iniciar"
        : "Start"
      : isSpanish
        ? "Reanudar"
        : "Resume";

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < 70 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX > 0) onPreviousStep();
    if (deltaX < 0) onCompleteStep();
  }

  return (
    <section
      className="min-h-[calc(100vh-2rem)] overflow-x-hidden pb-32 md:pb-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-2xl flex-col">
        <header className="sticky top-3 z-20 mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2.5 shadow-xl shadow-black/30 backdrop-blur">
          <Button className="rounded-full px-3 py-2 text-xs" onClick={onBackToPlan} variant="secondary">
            ← {isSpanish ? "Plan" : "Plan"}
          </Button>
          <div className="text-center">
            <p className="text-sm font-black text-white">{isSpanish ? "Cocinando" : "Cooking"}</p>
            <p className="max-w-[160px] truncate text-[11px] font-semibold text-slate-500">
              {context || `${stepLabel} ${currentStep + 1} / ${totalSteps}`}
            </p>
          </div>
          <Button className="rounded-full px-3 py-2 text-xs" onClick={onReset} variant="ghost">
            Reset
          </Button>
        </header>

        <main className="flex flex-1 flex-col justify-between rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-950 to-black p-4 shadow-2xl shadow-black/30 ring-1 ring-inset ring-white/[0.03]">
          <div className="space-y-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-300 via-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${sessionProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className="uppercase tracking-[0.18em]">{zone}</Badge>
                <span className="text-xs font-bold text-slate-500">
                  {stepLabel} {currentStep + 1} / {totalSteps}
                </span>
              </div>
              {cookingAlertsEnabled ? (
                <Badge tone="success">{alertsActiveLabel}</Badge>
              ) : (
                <Button className="rounded-full px-3 py-2 text-xs" onClick={onEnableAlerts} variant="outlineAccent">
                  {alertsLabel}
                </Button>
              )}
            </div>

            {cookingAlertMessage && (
              <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-100">
                {cookingAlertMessage}
              </div>
            )}
          </div>

          <div className="py-8 text-center sm:py-12">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-orange-300">
              {stepLabel} {currentStep + 1}
            </p>
            <h1 className="mx-auto mt-3 max-w-xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              {step.title}
            </h1>
            <p className="mx-auto mt-4 line-clamp-1 max-w-lg text-sm font-medium text-slate-400">
              {shortContext}
            </p>

            <div className="mt-8 rounded-[2rem] border border-orange-400/20 bg-black/35 p-5 shadow-2xl shadow-black/30">
              {hasTimer ? (
                <>
                  <p className={`font-mono text-8xl font-black tracking-tighter text-orange-300 transition-all duration-200 sm:text-9xl ${isFinishing ? "animate-pulse text-red-300" : ""}`}>
                    {formatTime(timeLeft)}
                  </p>
                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-300 via-orange-500 to-red-500 transition-all duration-500"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="py-7">
                  <p className="text-3xl font-black tracking-tight text-orange-300">
                    {isSpanish ? "Sin temporizador" : "Manual mode"}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {isSpanish ? "Completa el paso cuando esté listo." : "Complete this step when ready."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                {nextLabel}
              </p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="line-clamp-1 font-bold text-white">
                  {nextStep?.title ?? (isSpanish ? "Servir y disfrutar" : "Serve and enjoy")}
                </p>
                <span className="shrink-0 text-sm font-bold text-orange-200">
                  {nextStep?.duration ? formatTime(nextStep.duration) : isSpanish ? "manual" : "manual"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button onClick={onPreviousStep} disabled={currentStep === 0} variant="secondary">
                {isSpanish ? "Anterior" : "Previous"}
              </Button>
              <Button disabled={!hasTimer} onClick={() => setTimerRunning(!timerRunning)} variant="secondary">
                {pauseLabel}
              </Button>
              <Button onClick={onNextStep} disabled={currentStep === totalSteps - 1} variant="secondary">
                {nextLabel}
              </Button>
            </div>

            <button
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-300 transition-all duration-200 active:scale-[0.98]"
              onClick={() => setShowTimeline((current) => !current)}
              type="button"
            >
              {showTimeline
                ? isSpanish
                  ? "Ocultar pasos"
                  : "Hide all steps"
                : isSpanish
                  ? "Ver todos los pasos"
                  : "View all steps"}
            </button>
          </div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl md:static md:mt-4 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <div className="mx-auto max-w-2xl">
          <Button className="py-4 text-base font-black" fullWidth onClick={onCompleteStep}>
            {completeLabel}
          </Button>
        </div>
      </div>

      <div
        className={
          showTimeline
            ? "mx-auto mt-4 grid max-w-2xl grid-cols-1 gap-2 md:grid-cols-4"
            : "mx-auto mt-4 hidden max-w-2xl grid-cols-4 gap-2 md:grid"
        }
      >
        {cookSteps.map((item, index) => (
          <button
            key={`${item.title}-${index}`}
            className={
              index === currentStep
                ? "rounded-2xl border border-orange-400/50 bg-orange-500/15 px-3 py-3 text-left text-sm font-bold text-white"
                : index < currentStep
                  ? "rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-3 text-left text-sm font-medium text-slate-500 transition-all duration-200 hover:text-slate-300"
                  : "rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm font-medium text-slate-400 transition-all duration-200 hover:border-orange-400/30 hover:text-white"
            }
            onClick={() => onGoToStep(index)}
          >
            <span className="block text-[10px] uppercase tracking-[0.18em] text-orange-300">
              {index < currentStep ? "✓" : index + 1}
            </span>
            <span className="mt-1 line-clamp-1 block">{item.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
