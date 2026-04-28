"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { CookingStep as CatalogCookingStep } from "@/lib/cookingCatalog";

type StepInput = Partial<CatalogCookingStep> &
  Record<string, string | number | string[] | undefined>;

type NormalizedStep = {
  title: string;
  instruction: string;
  durationSeconds: number | null;
  zone?: string;
  tip: string;
  image?: string;
};

type LiveCookingModeProps = {
  steps: StepInput[];
  title?: string;
  subtitle?: string;
  visualImage?: string;
  onExit?: () => void;
  onFinish?: () => void;
};

const prepChecklist = [
  { icon: "🔥", label: "Parrilla caliente" },
  { icon: "⌁", label: "Pinzas listas" },
  { icon: "🧂", label: "Sal a mano" },
  { icon: "🍽️", label: "Plato para reposo" },
];

const categoryImages = [
  { keywords: ["vacuno", "beef", "ribeye", "entrecote"], image: "/images/vacuno/ribeye-cooked.webp" },
  { keywords: ["cerdo", "pork", "secreto", "costilla"], image: "/images/cerdo/secreto-cooked.webp" },
  { keywords: ["pollo", "chicken", "muslo"], image: "/images/pollo/muslos-cooked.webp" },
  { keywords: ["pescado", "fish", "salmón", "salmon"], image: "/images/pescado/salmon-cooked.webp" },
  { keywords: ["verdura", "vegetable", "maíz", "pimiento"], image: "/images/verduras/verduras-asadas.webp" },
];

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${restSeconds.toString().padStart(2, "0")}`;
}

function parseDuration(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase().replace(",", ".");
  if (!normalized) return null;

  const numericValue = Number.parseFloat(normalized);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null;

  if (normalized.includes("h")) return Math.round(numericValue * 3600);
  if (normalized.includes("min") || normalized.includes("m")) return Math.round(numericValue * 60);
  if (normalized.includes("sec") || normalized.includes("seg") || normalized.includes("s")) {
    return Math.round(numericValue);
  }

  return Math.round(numericValue);
}

function inferZone(title: string, instruction: string) {
  const text = `${title} ${instruction}`.toLowerCase();

  if (text.includes("repos")) return "Reposo";
  if (text.includes("indirect")) return "Fuego indirecto";
  if (text.includes("precal")) return "Parrilla caliente";
  if (text.includes("dorar") || text.includes("sell") || text.includes("direct")) {
    return "Fuego directo";
  }

  return "Control suave";
}

function inferTip(title: string, instruction: string, explicitTip?: string) {
  if (explicitTip?.trim()) return explicitTip.trim();

  const text = `${title} ${instruction}`.toLowerCase();

  if (text.includes("dorar") || text.includes("sell")) {
    return "No muevas la pieza hasta que se despegue sola.";
  }
  if (text.includes("repos")) {
    return "El reposo redistribuye los jugos y mejora el resultado.";
  }
  if (text.includes("girar") || text.includes("vuelta")) {
    return "Gira una sola vez para mantener una buena costra.";
  }

  return "Sigue el paso sin complicarte; la app controla el ritmo.";
}

function getStringField(step: StepInput, keys: string[]) {
  for (const key of keys) {
    const value = step[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function normalizeStep(step: StepInput, index: number): NormalizedStep {
  const title = getStringField(step, ["title", "name"]) || `Paso ${index + 1}`;
  const instruction = getStringField(step, ["description", "instruction", "text"]);
  const durationSeconds =
    parseDuration(step.durationSeconds) ??
    parseDuration(step.duration) ??
    parseDuration(step.minutes) ??
    parseDuration(step.time);
  const tipValue = getStringField(step, ["tip"]) || (Array.isArray(step.tips) ? step.tips[0] : "");
  const zone = getStringField(step, ["zone"]) || inferZone(title, instruction);
  const image = getStringField(step, ["image"]);

  return {
    title,
    instruction,
    durationSeconds,
    zone,
    tip: inferTip(title, instruction, tipValue),
    image,
  };
}

function getTotalTime(steps: NormalizedStep[]) {
  const totalSeconds = steps.reduce((sum, step) => sum + (step.durationSeconds ?? 0), 0);
  if (totalSeconds <= 0) return "Manual";

  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function canUseNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

async function requestNotificationPermission() {
  if (!canUseNotifications()) return "unsupported" as const;
  if (Notification.permission !== "default") return Notification.permission;

  return Notification.requestPermission();
}

function sendLiveNotification(title: string, body: string) {
  if (!canUseNotifications() || Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, { body });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some browsers expose Notification but block construction in edge cases.
  }
}

function getNotificationBody(step: NormalizedStep) {
  const text = `${step.title} ${step.instruction}`.toLowerCase();

  if (text.includes("girar") || text.includes("vuelta")) return "Toca girar la pieza";
  if (text.includes("precal") || text.includes("parrilla")) return "La parrilla debería estar lista";
  if (text.includes("repos")) return "Reposo terminado";

  return "Siguiente paso listo";
}

function getVisualGuideForStep(step: NormalizedStep) {
  const text = `${step.title} ${step.instruction}`.toLowerCase();

  if (text.includes("precalentar") || text.includes("calentar") || text.includes("parrilla")) {
    return {
      title: "Parrilla caliente",
      bullets: [
        "La parrilla debe estar bien caliente antes de poner la pieza.",
        "Limpia la rejilla y engrasa si hace falta.",
        "Mantén la tapa cerrada si buscas temperatura estable.",
      ],
    };
  }

  if (text.includes("dorar") || text.includes("sellar") || text.includes("costra")) {
    return {
      title: "Dorado correcto",
      bullets: [
        "Coloca la pieza y no la muevas al principio.",
        "Busca una costra dorada y uniforme.",
        "Si se pega, espera unos segundos más.",
      ],
    };
  }

  if (text.includes("girar") || text.includes("dar la vuelta") || text.includes("vuelta")) {
    return {
      title: "Girar sin romper la costra",
      bullets: [
        "Usa pinzas, no pinches la carne.",
        "Gira una sola vez si es posible.",
        "Coloca la pieza sobre una zona caliente limpia.",
      ],
    };
  }

  if (text.includes("reposo") || text.includes("reposar")) {
    return {
      title: "Reposo",
      bullets: [
        "Deja la pieza en una zona templada.",
        "No cortes inmediatamente.",
        "El reposo ayuda a conservar jugos.",
      ],
    };
  }

  if (text.includes("cortar") || text.includes("filetear") || text.includes("servir")) {
    return {
      title: "Corte correcto",
      bullets: [
        "Localiza la dirección de la fibra.",
        "Corta en contra de la fibra.",
        "Usa cuchillo afilado y cortes limpios.",
      ],
    };
  }

  return {
    title: "Guía rápida",
    bullets: [
      "Sigue este paso sin complicarte.",
      "La app controla el ritmo.",
      "Pulsa Hecho cuando termines.",
    ],
  };
}

function isCuttingRelevantStep(step: NormalizedStep) {
  const text = `${step.title} ${step.instruction}`.toLowerCase();

  return ["reposo", "reposar", "servir", "cortar", "filetear"].some((value) => text.includes(value));
}

function inferVisualImage(step: NormalizedStep, title?: string, preferredImage?: string) {
  if (step.image) return step.image;
  if (preferredImage) return preferredImage;

  const text = `${title ?? ""} ${step.title} ${step.instruction}`.toLowerCase();
  return categoryImages.find((item) => item.keywords.some((keyword) => text.includes(keyword)))?.image;
}

export default function LiveCookingMode({
  steps,
  title = "Live Cooking",
  subtitle,
  visualImage,
  onExit,
  onFinish,
}: LiveCookingModeProps) {
  const normalizedSteps = useMemo(() => steps.map(normalizeStep), [steps]);
  const [phase, setPhase] = useState<"prep" | "active" | "finished">("prep");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [adjustMessage, setAdjustMessage] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [visualGuideOpen, setVisualGuideOpen] = useState(false);
  const [forceCuttingGuide, setForceCuttingGuide] = useState(false);

  const currentStep = normalizedSteps[currentStepIndex];
  const nextStep = normalizedSteps[currentStepIndex + 1];
  const hasTimer = typeof timeLeft === "number";
  const isTimeComplete = hasTimer && timeLeft === 0;
  const progress =
    currentStep?.durationSeconds && hasTimer
      ? Math.min(100, Math.max(0, ((currentStep.durationSeconds - timeLeft) / currentStep.durationSeconds) * 100))
      : 0;

  useEffect(() => {
    if (phase !== "active" || !isRunning || !hasTimer || timeLeft <= 0) return;

    const id = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current === null || current <= 1) {
          setIsRunning(false);
          if (currentStep) {
            sendLiveNotification("🔥 Parrillero Pro", getNotificationBody(currentStep));
          }
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [currentStep, hasTimer, isRunning, phase, timeLeft]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setNotificationPermission(canUseNotifications() ? Notification.permission : "unsupported");
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!adjustMessage) return;

    const id = window.setTimeout(() => setAdjustMessage(""), 1800);
    return () => window.clearTimeout(id);
  }, [adjustMessage]);

  function startCooking() {
    const firstStep = normalizedSteps[0];
    setCurrentStepIndex(0);
    setTimeLeft(firstStep?.durationSeconds ?? null);
    setIsRunning(Boolean(firstStep?.durationSeconds));
    setPhase("active");
  }

  function completeStep() {
    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= normalizedSteps.length) {
      setIsRunning(false);
      setPhase("finished");
      return;
    }

    const upcomingStep = normalizedSteps[nextIndex];
    setCurrentStepIndex(nextIndex);
    setTimeLeft(upcomingStep.durationSeconds);
    setIsRunning(Boolean(upcomingStep.durationSeconds));
  }

  function addTime() {
    if (!hasTimer) return;

    setTimeLeft((current) => (current ?? 0) + 60);
    setAdjustMessage("Tiempo ajustado +1 min");
    setIsRunning(true);
  }

  async function enableNotifications() {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  }

  function openVisualGuide(isCuttingGuide = false) {
    setForceCuttingGuide(isCuttingGuide);
    setVisualGuideOpen(true);
  }

  if (normalizedSteps.length === 0) {
    return (
      <main className="min-h-screen bg-[#070707] px-4 py-4 pb-28 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col justify-center">
          <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-6 text-center shadow-2xl shadow-black/50">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A00]">Live Cooking</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Aún no hay pasos live</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              Genera primero un plan de cocción para activar el modo Live.
            </p>
            <button
              type="button"
              onClick={onExit}
              className="mt-6 min-h-14 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-[#FF6A00] px-5 font-black text-black shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
            >
              Volver
            </button>
          </section>
        </div>
      </main>
    );
  }

  if (phase === "prep") {
    return (
      <main className="min-h-screen bg-[#070707] px-4 py-4 pb-28 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,106,0,0.18),transparent_34%),linear-gradient(180deg,#070707,#020202)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col">
          <Header title={title} onExit={onExit} />

          <section className="mt-4 flex flex-1 flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-5 shadow-2xl shadow-black/50">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A00]">
                Preparación
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">
                Antes de empezar
              </h1>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                {subtitle || "Ten todo listo para cocinar sin pensar."}
              </p>

              <div className="mt-6 grid gap-3">
                {prepChecklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FF6A00]/15 text-lg">
                      {item.icon}
                    </span>
                    <p className="text-sm font-bold">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold leading-5 text-neutral-200">
                  Activa avisos para no estar pendiente de la pantalla.
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Los avisos funcionan mientras la app está abierta o permitida por el navegador.
                </p>
                {notificationPermission === "granted" ? (
                  <p className="mt-3 text-sm font-bold text-orange-200">Avisos activados</p>
                ) : notificationPermission === "denied" ? (
                  <p className="mt-3 text-sm font-bold text-neutral-400">
                    Puedes seguir usando el modo Live sin avisos.
                  </p>
                ) : notificationPermission === "unsupported" ? (
                  <p className="mt-3 text-sm font-bold text-neutral-400">
                    Este navegador no permite avisos.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={enableNotifications}
                    className="mt-3 min-h-11 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 text-sm font-black text-orange-100 transition active:scale-[0.98]"
                  >
                    Activar avisos
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-400">Tiempo estimado</span>
                <span className="text-xl font-black text-white">{getTotalTime(normalizedSteps)}</span>
              </div>
              <button
                type="button"
                onClick={startCooking}
                className="mt-5 min-h-14 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-[#FF6A00] px-5 font-black text-black shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
              >
                Empezar cocción
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (phase === "finished") {
    return (
      <main className="min-h-screen bg-[#070707] px-4 py-4 pb-28 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,106,0,0.20),transparent_34%),#070707]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col justify-center">
          <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-6 text-center shadow-2xl shadow-black/50">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A00]">Terminado</p>
            <h1 className="mt-4 text-5xl font-black tracking-tight">Listo para servir</h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-neutral-300">
              Deja que el último reposo haga su trabajo. Corta, sirve y disfruta.
            </p>
            <button
              type="button"
              onClick={onFinish ?? onExit}
              className="mt-7 min-h-14 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-[#FF6A00] px-5 font-black text-black shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
            >
              Terminar
            </button>
          </section>
        </div>
      </main>
    );
  }

  const showLongTimerPrompt = hasTimer && timeLeft > 300;
  const activeGuide = forceCuttingGuide
    ? {
        title: "Corte correcto",
        bullets: [
          "Localiza la dirección de la fibra.",
          "Corta en contra de la fibra.",
          "Usa cuchillo afilado y cortes limpios.",
        ],
      }
    : getVisualGuideForStep(currentStep);
  const activeVisualImage = inferVisualImage(currentStep, title, visualImage);

  return (
    <main className="min-h-screen bg-[#070707] px-4 py-4 pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,106,0,0.22),transparent_32%),linear-gradient(180deg,#070707,#030303)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col">
        <Header title={title} onExit={onExit} />

        <section
          key={currentStepIndex}
          className="mt-4 flex flex-1 animate-[fadeIn_220ms_ease-out] flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-5 shadow-2xl shadow-black/50 transition"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A00]">Ahora</p>
              <p className="text-xs font-semibold text-neutral-500">
                Paso {currentStepIndex + 1} de {normalizedSteps.length}
              </p>
            </div>

            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              {currentStep.title}
            </h1>
            <p className="mt-3 line-clamp-2 text-base leading-6 text-neutral-300">
              {currentStep.instruction || "Sigue este paso y confirma cuando esté listo."}
            </p>
            <button
              type="button"
              onClick={() => openVisualGuide(false)}
              className="mt-4 inline-flex min-h-10 items-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-black text-neutral-100 transition hover:bg-white/[0.08] active:scale-[0.98]"
            >
              👁 Ver cómo
            </button>
          </div>

          <div className="my-7 text-center">
            {hasTimer ? (
              <>
                <p className="font-mono text-7xl font-black tabular-nums tracking-tighter text-white">
                  {formatTime(timeLeft)}
                </p>
                <p className="mt-2 text-sm font-bold text-[#FF6A00]">
                  {isTimeComplete ? "Tiempo completado" : isRunning ? "En marcha" : "Pausado"}
                </p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-300 to-[#FF6A00] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-[24px] bg-white/[0.04] py-8">
                <p className="text-3xl font-black text-white">Sin temporizador</p>
                <p className="mt-2 text-sm text-neutral-400">Confirma manualmente cuando esté listo.</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">🧠</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                    Consejo pro
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-neutral-200">{currentStep.tip}</p>
                </div>
              </div>
            </div>

            {showLongTimerPrompt && (
              <div className="rounded-2xl border border-orange-400/15 bg-orange-500/10 p-3">
                <p className="text-sm font-bold text-orange-100">
                  Te avisamos cuando toque el siguiente paso.
                </p>
                {notificationPermission === "granted" ? (
                  <p className="mt-1 text-xs font-semibold text-orange-200/75">Avisos activados</p>
                ) : (
                  <button
                    type="button"
                    onClick={enableNotifications}
                    className="mt-2 text-xs font-black text-orange-200 underline decoration-orange-300/50 underline-offset-4"
                  >
                    Activar avisos
                  </button>
                )}
              </div>
            )}

            {isCuttingRelevantStep(currentStep) && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm font-black text-white">🔪 Consejo de corte</p>
                <p className="mt-1 text-sm leading-5 text-neutral-300">
                  Para una textura más tierna, corta en contra de la fibra.
                </p>
                <button
                  type="button"
                  onClick={() => openVisualGuide(true)}
                  className="mt-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-neutral-100 transition active:scale-[0.98]"
                >
                  Ver guía de corte
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {currentStep.zone && <InfoPill>{currentStep.zone}</InfoPill>}
              {hasTimer && <InfoPill>{formatTime(timeLeft)}</InfoPill>}
              {isTimeComplete && <InfoPill>Listo para confirmar</InfoPill>}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-xs font-black uppercase tracking-[0.20em] text-neutral-500">Siguiente</p>
              <p className="mt-2 line-clamp-1 text-sm font-bold text-neutral-200">
                {nextStep?.title || "Listo para servir"}
              </p>
            </div>

            {adjustMessage && (
              <p className="text-center text-sm font-bold text-orange-200">{adjustMessage}</p>
            )}

            <button
              type="button"
              onClick={completeStep}
              className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-[#FF6A00] px-5 text-base font-black text-black shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
            >
              Hecho
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsRunning((current) => !current)}
                disabled={!hasTimer}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-neutral-200 transition active:scale-[0.98] disabled:opacity-45"
              >
                {isRunning ? "Pausar" : "Reanudar"}
              </button>
              <button
                type="button"
                onClick={addTime}
                disabled={!hasTimer}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-neutral-200 transition active:scale-[0.98] disabled:opacity-45"
              >
                Voy tarde
              </button>
            </div>
          </div>
        </section>
      </div>
      {visualGuideOpen && (
        <VisualGuideSheet
          guide={activeGuide}
          image={activeVisualImage}
          onClose={() => setVisualGuideOpen(false)}
        />
      )}
    </main>
  );
}

function Header({ title, onExit }: { title: string; onExit?: () => void }) {
  return (
    <header className="flex h-12 items-center justify-between gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6A00]" />
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white">Live</span>
      </div>
      <p className="min-w-0 flex-1 truncate text-center text-sm font-black text-neutral-200">{title}</p>
      <button
        type="button"
        onClick={onExit}
        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-neutral-300 transition active:scale-[0.98]"
      >
        Salir
      </button>
    </header>
  );
}

function InfoPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-neutral-200">
      {children}
    </span>
  );
}

function VisualGuideSheet({
  guide,
  image,
  onClose,
}: {
  guide: { title: string; bullets: string[] };
  image?: string;
  onClose: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(image) && !imageFailed;

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/70 p-3 backdrop-blur-md sm:items-center sm:justify-center">
      <section className="w-full max-w-lg animate-[fadeIn_180ms_ease-out] overflow-hidden rounded-t-[2rem] border border-white/10 bg-neutral-950 shadow-2xl shadow-black/60 sm:rounded-[2rem]">
        <div className="relative h-64 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(255,106,0,0.30),transparent_34%),linear-gradient(145deg,#18181b,#000)]">
          {showImage && image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 640px) 512px, 100vw"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/45 to-transparent" />
          {!showImage && (
            <div className="absolute inset-0 flex items-center justify-center text-6xl">🔥</div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-black text-white backdrop-blur transition active:scale-[0.98]"
          >
            Cerrar
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF6A00]">Ver cómo</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{guide.title}</h2>
          <div className="mt-5 space-y-3">
            {guide.bullets.slice(0, 3).map((bullet) => (
              <div key={bullet} className="flex gap-3 rounded-2xl bg-white/[0.05] p-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6A00] text-xs font-black text-black">
                  ✓
                </span>
                <p className="text-sm font-semibold leading-5 text-neutral-200">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
