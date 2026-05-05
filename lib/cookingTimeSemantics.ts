import type { CookingStep } from "@/lib/cookingCatalog";

export type CookingTimeSemanticsSource = "legacy-engine-derived" | "catalog-v2" | "mixed";

export type CookingTimeSemantics = {
  setupMinutes: number;
  activeCookMinutes: number;
  restMinutes: number;
  cutPlanMinutes: number;
  sessionTotalMinutes: number;
  prepLeadTimeMinutes?: number | null;
  source: CookingTimeSemanticsSource;
};

type StepPhase = "setup" | "active" | "rest";

function secondsToMinutes(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.round(seconds / 60);
}

function normalizeStepText(step: CookingStep) {
  return `${step.title} ${step.description} ${step.image ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function classifyStep(step: CookingStep): StepPhase {
  const text = normalizeStepText(step);

  if (/\b(rest|reposo|reposar|reposa|descanso)\b/.test(text)) {
    return "rest";
  }

  if (
    /\b(preheat|precalentar|precalienta|stabilize|estabilizar|estabiliza|heat pan|calentar sarten|prepare charcoal|preparar zonas|prep vegetables|preparar verduras)\b/.test(
      text,
    )
  ) {
    return "setup";
  }

  return "active";
}

export function deriveCookingTimeSemanticsFromSteps(
  steps: CookingStep[],
  source: CookingTimeSemanticsSource = "legacy-engine-derived",
): CookingTimeSemantics {
  let setupSeconds = 0;
  let activeSeconds = 0;
  let restSeconds = 0;

  for (const step of steps) {
    const duration = Number.isFinite(step.duration) && step.duration > 0 ? step.duration : 0;
    const phase = classifyStep(step);

    if (phase === "setup") {
      setupSeconds += duration;
      continue;
    }

    if (phase === "rest") {
      restSeconds += duration;
      continue;
    }

    activeSeconds += duration;
  }

  const setupMinutes = secondsToMinutes(setupSeconds);
  const activeCookMinutes = secondsToMinutes(activeSeconds);
  const restMinutes = secondsToMinutes(restSeconds);
  const cutPlanMinutes = activeCookMinutes + restMinutes;
  const sessionTotalMinutes = setupMinutes + cutPlanMinutes;

  return {
    setupMinutes,
    activeCookMinutes,
    restMinutes,
    cutPlanMinutes,
    sessionTotalMinutes,
    prepLeadTimeMinutes: null,
    source,
  };
}

export function attachCookingTimeSemantics<T extends Record<string, string>>(
  plan: T,
  timeSemantics: CookingTimeSemantics,
): T {
  Object.defineProperty(plan, "timeSemantics", {
    value: timeSemantics,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return plan;
}
