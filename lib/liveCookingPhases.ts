import type { CookingTimeSemantics } from "@/lib/cookingTimeSemantics";

export type LiveCookingPhaseType =
  | "setup"
  | "active_cook"
  | "sear"
  | "indirect"
  | "rest"
  | "serve"
  | "prep"
  | "unknown";

export type LiveCookingPhaseMetadata = {
  phaseType: LiveCookingPhaseType;
  contributesToSessionTotal: boolean;
  contributesToCutPlan: boolean;
  isSetupPhase: boolean;
  isRestPhase: boolean;
  isActiveCookingPhase: boolean;
};

type LiveCookingPhaseInput = {
  label?: string | null;
  zone?: string | null;
  notes?: string | null;
  duration?: number | null;
  phaseType?: string | null;
  index?: number;
  totalSteps?: number;
  timeSemantics?: CookingTimeSemantics | null;
};

const LIVE_COOKING_PHASE_TYPES = new Set<LiveCookingPhaseType>([
  "setup",
  "active_cook",
  "sear",
  "indirect",
  "rest",
  "serve",
  "prep",
  "unknown",
]);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isLiveCookingPhaseType(value: string | null | undefined): value is LiveCookingPhaseType {
  return Boolean(value && LIVE_COOKING_PHASE_TYPES.has(value as LiveCookingPhaseType));
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function inferPhaseFromText({
  duration,
  index,
  label,
  notes,
  timeSemantics,
  totalSteps,
  zone,
}: LiveCookingPhaseInput): LiveCookingPhaseType {
  const text = normalizeText(`${label ?? ""} ${zone ?? ""} ${notes ?? ""}`);
  const safeDuration = Number.isFinite(duration ?? NaN) ? Number(duration) : null;
  const isLastStep =
    Number.isFinite(index ?? NaN) &&
    Number.isFinite(totalSteps ?? NaN) &&
    Number(index) === Number(totalSteps) - 1;

  if (/\b(rest|reposo|reposar|reposa|descanso|lepuut)\b/.test(text)) return "rest";

  if (
    includesAny(text, [
      "serve",
      "servir",
      "listo",
      "slice",
      "cortar",
      "grain",
      "fibra",
      "emplatar",
      "finish",
      "terminar",
    ]) ||
    (isLastStep && safeDuration === 0)
  ) {
    return "serve";
  }

  if (
    includesAny(text, [
      "dry brine",
      "brine",
      "salt ahead",
      "salar antes",
      "salmuera",
      "marinar",
      "marinade",
    ])
  ) {
    return "prep";
  }

  if (
    includesAny(text, [
      "preheat",
      "precalent",
      "stabilize",
      "estabiliza",
      "setup",
      "prepare charcoal",
      "preparar zonas",
      "prep vegetables",
      "preparar verduras",
      "heat pan",
      "calentar sarten",
      "zona",
    ])
  ) {
    return "setup";
  }

  if (includesAny(text, ["indirect", "indirecto", "oven", "horno", "core", "centro"])) {
    return "indirect";
  }

  if (
    includesAny(text, [
      "sear",
      "sell",
      "dorar",
      "browning",
      "crust",
      "costra",
      "mark",
      "lado 1",
      "lado 2",
      "side 1",
      "side 2",
      "flip",
      "turn",
      "voltea",
      "dar vuelta",
    ])
  ) {
    return "sear";
  }

  if (
    includesAny(text, [
      "cook",
      "cocina",
      "asar",
      "grill",
      "parrilla",
      "direct",
      "directo",
      "fuego",
      "heat",
    ])
  ) {
    return "active_cook";
  }

  if (timeSemantics?.activeCookMinutes && safeDuration && safeDuration > 0) {
    return "active_cook";
  }

  return "unknown";
}

export function getLiveCookingPhaseMetadata(input: LiveCookingPhaseInput): LiveCookingPhaseMetadata {
  const phaseType = isLiveCookingPhaseType(input.phaseType)
    ? input.phaseType
    : inferPhaseFromText(input);
  const safeDuration = Number.isFinite(input.duration ?? NaN) && Number(input.duration) > 0
    ? Number(input.duration)
    : 0;
  const isSetupPhase = phaseType === "setup";
  const isRestPhase = phaseType === "rest";
  const isActiveCookingPhase =
    phaseType === "active_cook" || phaseType === "sear" || phaseType === "indirect";
  const isUnknownTimedPhase = phaseType === "unknown" && safeDuration > 0;
  const contributesToSessionTotal =
    isSetupPhase || isRestPhase || isActiveCookingPhase || isUnknownTimedPhase || (phaseType === "serve" && safeDuration > 0);
  const contributesToCutPlan = isRestPhase || isActiveCookingPhase || isUnknownTimedPhase;

  return {
    phaseType,
    contributesToSessionTotal,
    contributesToCutPlan,
    isSetupPhase,
    isRestPhase,
    isActiveCookingPhase,
  };
}
