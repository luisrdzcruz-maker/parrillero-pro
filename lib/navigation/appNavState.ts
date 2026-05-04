import type { CookingWizardStep } from "@/components/cooking/CookingWizard";
import type { Mode } from "@/components/navigation/AppHeader";
import {
  getCutById,
  getDonenessOptions,
  shouldShowThickness,
} from "@/lib/cookingRules";
import type { Lang } from "@/lib/i18n/texts";
import { animalIdsByLabel, type AnimalLabel } from "@/lib/media/animalMedia";
import { toAnimalId } from "@/lib/navigation/animalParam";
import { canonicalizeCutId } from "@/lib/navigation/canonicalCutId";
import { parseLiveParams } from "@/lib/navigation/parseLiveParams";

export type CookingNavContext = {
  animal?: AnimalLabel;
  cut?: string;
  doneness?: string;
  thickness?: string;
};

export type ParsedNav = {
  mode: Mode;
  cookingStep: CookingWizardStep;
  cookingContext: CookingNavContext;
};

const ALLOWED_MODES: readonly Mode[] = [
  "inicio",
  "coccion",
  "plan",
  "menu",
  "parrillada",
  "cocina",
  "guardados",
];

const ALLOWED_COOKING_STEPS: readonly CookingWizardStep[] = [
  "animal",
  "cut",
  "details",
  "result",
];

const animalLabelsById: Record<string, AnimalLabel> = Object.fromEntries(
  Object.entries(animalIdsByLabel).map(([label, id]) => [id, label]),
) as Record<string, AnimalLabel>;

function parseLangParam(value: string | null | undefined): Lang | null {
  if (value === "en" || value === "fi" || value === "es") return value;
  return null;
}

export function isAllowedMode(value: string | null): value is Mode {
  return value != null && ALLOWED_MODES.includes(value as Mode);
}

export function isAllowedCookingStep(
  value: string | null,
): value is CookingWizardStep {
  return value != null && ALLOWED_COOKING_STEPS.includes(value as CookingWizardStep);
}

export function parseCookingAnimal(value: string | null): AnimalLabel | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed in animalIdsByLabel) return trimmed as AnimalLabel;

  return animalLabelsById[trimmed.toLowerCase()];
}

export function parsePositiveNumberParam(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? trimmed : undefined;
}

export function normalizeCookingContextValue(value: string | undefined) {
  return value?.trim() ?? "";
}

export function isVegetableContextAnimal(animal: AnimalLabel | undefined) {
  return animal === "Verduras";
}

export function isSameCookingContext(a: CookingNavContext, b: CookingNavContext) {
  const animalA = normalizeCookingContextValue(a.animal);
  const animalB = normalizeCookingContextValue(b.animal);
  if (animalA !== animalB) return false;

  const cutA = normalizeCookingContextValue(a.cut);
  const cutB = normalizeCookingContextValue(b.cut);
  if (cutA !== cutB) return false;

  if (isVegetableContextAnimal(a.animal) || isVegetableContextAnimal(b.animal)) {
    return true;
  }

  const donenessA = normalizeCookingContextValue(a.doneness);
  const donenessB = normalizeCookingContextValue(b.doneness);
  if (donenessA !== donenessB) return false;

  const referenceCut = cutA || cutB;
  if (!referenceCut) {
    return normalizeCookingContextValue(a.thickness) === normalizeCookingContextValue(b.thickness);
  }
  if (!shouldShowThickness(referenceCut)) return true;

  return normalizeCookingContextValue(a.thickness) === normalizeCookingContextValue(b.thickness);
}

function parseCookingContext(params: URLSearchParams, mode: Mode): CookingNavContext {
  const liveParams = mode === "cocina" ? parseLiveParams(params.toString()) : null;
  const animalSource = mode === "cocina" ? liveParams?.animal ?? null : params.get("animal");
  const animalFromParam = parseCookingAnimal(animalSource);
  const canonicalCutParam = canonicalizeCutId(
    mode === "cocina" ? liveParams?.cutId : params.get("cut") ?? params.get("cutId"),
    animalFromParam ? animalIdsByLabel[animalFromParam] : undefined,
  );
  const cutMeta = canonicalCutParam ? getCutById(canonicalCutParam) : undefined;
  const animal = animalFromParam ?? (cutMeta ? animalLabelsById[cutMeta.animalId] : undefined);
  const cut =
    canonicalizeCutId(cutMeta?.id, animal ? animalIdsByLabel[animal] : undefined) ?? cutMeta?.id;
  const donenessParam = mode === "cocina" ? liveParams?.doneness?.trim() : params.get("doneness")?.trim();
  const shouldUseDoneness = animal ? !isVegetableContextAnimal(animal) : true;
  const doneness =
    shouldUseDoneness &&
    animal &&
    donenessParam &&
    getDonenessOptions(animalIdsByLabel[animal]).some((option) => option.id === donenessParam)
      ? donenessParam
      : undefined;
  const rawThickness = parsePositiveNumberParam(
    mode === "cocina"
      ? liveParams?.thickness != null
        ? String(liveParams.thickness)
        : null
      : params.get("thickness"),
  );
  const thickness = cut && shouldShowThickness(cut) ? rawThickness : undefined;

  return {
    ...(animal ? { animal } : {}),
    ...(cut ? { cut } : {}),
    ...(doneness ? { doneness } : {}),
    ...(thickness ? { thickness } : {}),
  };
}

export function parseNavFromSearch(search: string): ParsedNav {
  const params = new URLSearchParams(search);
  const modeParam = params.get("mode");
  const stepParam = params.get("step");

  const mode: Mode = isAllowedMode(modeParam) ? modeParam : "inicio";
  const cookingContext = mode === "coccion" || mode === "cocina" ? parseCookingContext(params, mode) : {};
  const inferredStep: CookingWizardStep = cookingContext.cut ? "details" : cookingContext.animal ? "cut" : "animal";
  const invalidStepFallback: CookingWizardStep = cookingContext.cut ? "details" : "animal";
  const cookingStep: CookingWizardStep =
    mode === "coccion"
      ? stepParam == null
        ? inferredStep
        : isAllowedCookingStep(stepParam)
          ? stepParam
          : invalidStepFallback
      : inferredStep;

  return { mode, cookingStep, cookingContext };
}

export function isCutSelectionFilterContextChangeOnly(
  currentContext: CookingNavContext,
  nextContext: CookingNavContext,
) {
  const currentAnimal = normalizeCookingContextValue(currentContext.animal);
  const nextAnimal = normalizeCookingContextValue(nextContext.animal);
  const currentCut = normalizeCookingContextValue(currentContext.cut);
  const nextCut = normalizeCookingContextValue(nextContext.cut);
  const currentDoneness = normalizeCookingContextValue(currentContext.doneness);
  const nextDoneness = normalizeCookingContextValue(nextContext.doneness);
  const currentThickness = normalizeCookingContextValue(currentContext.thickness);
  const nextThickness = normalizeCookingContextValue(nextContext.thickness);

  return (
    currentAnimal !== nextAnimal &&
    currentCut === nextCut &&
    currentDoneness === nextDoneness &&
    currentThickness === nextThickness
  );
}

export function buildSearchFromNav(
  mode: Mode,
  cookingStep: CookingWizardStep,
  cookingContext: CookingNavContext = {},
  lang?: Lang,
): string {
  const params = new URLSearchParams();
  params.set("mode", mode);
  const safeLang = parseLangParam(lang);
  if (safeLang) params.set("lang", safeLang);
  if (mode === "coccion") {
    params.set("step", cookingStep);
    if (cookingContext.animal && (cookingStep !== "cut" || Boolean(cookingContext.cut))) {
      params.set("animal", animalIdsByLabel[cookingContext.animal]);
    }
    if (cookingContext.cut) {
      const canonicalCut = canonicalizeCutId(
        cookingContext.cut,
        cookingContext.animal ? animalIdsByLabel[cookingContext.animal] : undefined,
      );
      if (canonicalCut) params.set("cutId", canonicalCut);
    }
    if (cookingContext.doneness && !isVegetableContextAnimal(cookingContext.animal)) {
      params.set("doneness", cookingContext.doneness);
    }
    if (cookingContext.cut && cookingContext.thickness && shouldShowThickness(cookingContext.cut)) {
      params.set("thickness", cookingContext.thickness);
    }
  } else if (mode === "cocina") {
    const animalId = toAnimalId(cookingContext.animal);
    if (animalId) params.set("animal", animalId);
    if (cookingContext.cut) {
      const canonicalCut = canonicalizeCutId(cookingContext.cut, animalId);
      if (canonicalCut) params.set("cutId", canonicalCut);
    }
    if (cookingContext.doneness && !isVegetableContextAnimal(cookingContext.animal)) {
      params.set("doneness", cookingContext.doneness);
    }
    if (cookingContext.cut && cookingContext.thickness && shouldShowThickness(cookingContext.cut)) {
      params.set("thickness", cookingContext.thickness);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
