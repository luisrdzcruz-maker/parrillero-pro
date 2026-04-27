import type { AnimalId, CookingMethod } from "./cookingCatalog";

export type CookingStepType = "preheat" | "sear" | "indirect" | "rest" | "serve" | "default";

export type CookingStepImageInput = {
  animalId?: AnimalId;
  cutId?: string;
  method?: CookingMethod;
  stepTitle?: string;
  stepType?: CookingStepType;
};

export const DEFAULT_COOKING_STEP_IMAGE = "/visuals/cooking/default-grill.webp";

const cookingStepImages: Record<AnimalId, Record<CookingStepType, string>> = {
  beef: {
    preheat: "/visuals/cooking/beef-preheat.webp",
    sear: "/visuals/cooking/beef-sear.webp",
    indirect: "/visuals/cooking/beef-indirect.webp",
    rest: "/visuals/cooking/beef-rest.webp",
    serve: "/visuals/cooking/beef-serve.webp",
    default: "/visuals/cooking/beef-sear.webp",
  },
  pork: {
    preheat: "/visuals/cooking/pork-preheat.webp",
    sear: "/visuals/cooking/pork-sear.webp",
    indirect: "/visuals/cooking/pork-indirect.webp",
    rest: "/visuals/cooking/pork-rest.webp",
    serve: "/visuals/cooking/pork-serve.webp",
    default: "/visuals/cooking/pork-sear.webp",
  },
  chicken: {
    preheat: "/visuals/cooking/chicken-preheat.webp",
    sear: "/visuals/cooking/chicken-sear.webp",
    indirect: "/visuals/cooking/chicken-indirect.webp",
    rest: "/visuals/cooking/chicken-rest.webp",
    serve: "/visuals/cooking/chicken-serve.webp",
    default: "/visuals/cooking/chicken-indirect.webp",
  },
  fish: {
    preheat: "/visuals/cooking/fish-preheat.webp",
    sear: "/visuals/cooking/fish-sear.webp",
    indirect: "/visuals/cooking/fish-indirect.webp",
    rest: "/visuals/cooking/fish-rest.webp",
    serve: "/visuals/cooking/fish-serve.webp",
    default: "/visuals/cooking/fish-sear.webp",
  },
  vegetables: {
    preheat: "/visuals/cooking/vegetables-preheat.webp",
    sear: "/visuals/cooking/vegetables-sear.webp",
    indirect: "/visuals/cooking/vegetables-indirect.webp",
    rest: "/visuals/cooking/vegetables-rest.webp",
    serve: "/visuals/cooking/vegetables-serve.webp",
    default: "/visuals/cooking/vegetables-sear.webp",
  },
};

const cutStepImageOverrides: Partial<Record<string, Partial<Record<CookingStepType, string>>>> = {
  costillas: {
    indirect: "/visuals/cooking/pork-indirect.webp",
    serve: "/visuals/cooking/pork-serve.webp",
  },
  panceta: {
    sear: "/visuals/cooking/pork-sear.webp",
    indirect: "/visuals/cooking/pork-indirect.webp",
  },
  pollo_entero: {
    indirect: "/visuals/cooking/chicken-indirect.webp",
    serve: "/visuals/cooking/chicken-serve.webp",
  },
  patata: {
    indirect: "/visuals/cooking/vegetables-indirect.webp",
  },
};

const methodFallbackImages: Record<CookingMethod, string> = {
  grill_direct: DEFAULT_COOKING_STEP_IMAGE,
  grill_indirect: "/visuals/cooking/default-indirect.webp",
  reverse_sear: "/visuals/cooking/default-reverse-sear.webp",
  oven_pan: "/visuals/cooking/default-oven-pan.webp",
  vegetables_grill: "/visuals/cooking/vegetables-sear.webp",
};

export function detectCookingStepType(value = ""): CookingStepType {
  const text = normalizeStepText(value);

  if (matchesAny(text, ["rest", "reposo", "reposar", "reposa"])) return "rest";
  if (matchesAny(text, ["serve", "servir", "sirve", "emplatar", "plating"])) return "serve";
  if (matchesAny(text, ["preheat", "precalentar", "precalienta", "precalienta", "calentar parrilla", "preheat grill"])) return "preheat";
  if (matchesAny(text, ["indirect", "indirecto", "oven", "horno", "slow cook", "coccion lenta", "cocina suave", "cook through", "cocinar interior", "render fat", "fundir grasa"])) return "indirect";
  if (matchesAny(text, ["sear", "sellar", "sella", "sellado", "dorar", "dorado", "brown", "crisp", "crujiente", "glaze", "glaseado", "direct", "directo", "grill direct", "parrilla directa"])) return "sear";
  if (matchesAny(text, ["finish", "terminar", "final"])) return "serve";

  return "default";
}

function normalizeStepText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function getCutStepImage(cutId: string | undefined, stepType: CookingStepType) {
  return cutId ? cutStepImageOverrides[cutId]?.[stepType] : undefined;
}

export function getCookingStepImage({
  animalId,
  cutId,
  method,
  stepTitle,
  stepType,
}: CookingStepImageInput) {
  const resolvedStepType = stepType ?? detectCookingStepType(stepTitle);
  const cutImage = getCutStepImage(cutId, resolvedStepType);
  if (cutImage) return cutImage;

  if (method === "vegetables_grill" || animalId === "vegetables") {
    return cookingStepImages.vegetables[resolvedStepType] ?? cookingStepImages.vegetables.default;
  }

  const animalImage = animalId ? cookingStepImages[animalId][resolvedStepType] ?? cookingStepImages[animalId].default : undefined;
  if (animalImage) return animalImage;

  return (method ? methodFallbackImages[method] : undefined) ?? DEFAULT_COOKING_STEP_IMAGE;
}
