import type { AnimalId, CookingMethod } from "./cookingEngine";

export type CookingStepType = "preheat" | "sear" | "indirect" | "rest" | "serve" | "default";

export type CookingStepImageInput = {
  animalId?: AnimalId;
  cutId?: string;
  method?: CookingMethod;
  stepTitle?: string;
  stepType?: CookingStepType;
};

export const DEFAULT_COOKING_STEP_IMAGE = "/visuals/cooking/default-grill.webp";

// TODO: Add these reusable WebP assets under public/visuals/cooking:
// beef-grill-preheat.webp, beef-grill-sear.webp, beef-grill-rest.webp,
// pork-grill-sear.webp, chicken-indirect.webp, fish-grill.webp,
// vegetables-grill.webp, default-grill.webp.
// The UI falls back to default-grill.webp if a referenced image is missing.

const directMethodImages: Partial<Record<AnimalId, Partial<Record<CookingStepType, string>>>> = {
  beef: {
    preheat: "/visuals/cooking/beef-grill-preheat.webp",
    sear: "/visuals/cooking/beef-grill-sear.webp",
    indirect: "/visuals/cooking/beef-grill-indirect.webp",
    rest: "/visuals/cooking/beef-grill-rest.webp",
    serve: "/visuals/cooking/beef-grill-rest.webp",
    default: "/visuals/cooking/beef-grill.webp",
  },
  pork: {
    preheat: "/visuals/cooking/pork-grill-preheat.webp",
    sear: "/visuals/cooking/pork-grill-sear.webp",
    indirect: "/visuals/cooking/pork-grill-indirect.webp",
    rest: "/visuals/cooking/pork-grill-rest.webp",
    serve: "/visuals/cooking/pork-grill-rest.webp",
    default: "/visuals/cooking/pork-grill.webp",
  },
  chicken: {
    preheat: "/visuals/cooking/chicken-grill-preheat.webp",
    sear: "/visuals/cooking/chicken-grill-sear.webp",
    indirect: "/visuals/cooking/chicken-indirect.webp",
    rest: "/visuals/cooking/chicken-grill-rest.webp",
    serve: "/visuals/cooking/chicken-grill-rest.webp",
    default: "/visuals/cooking/chicken-indirect.webp",
  },
  fish: {
    preheat: "/visuals/cooking/fish-grill.webp",
    sear: "/visuals/cooking/fish-grill.webp",
    rest: "/visuals/cooking/fish-grill.webp",
    serve: "/visuals/cooking/fish-grill.webp",
    default: "/visuals/cooking/fish-grill.webp",
  },
  vegetables: {
    preheat: "/visuals/cooking/vegetables-grill.webp",
    sear: "/visuals/cooking/vegetables-grill.webp",
    rest: "/visuals/cooking/vegetables-grill.webp",
    serve: "/visuals/cooking/vegetables-grill.webp",
    default: "/visuals/cooking/vegetables-grill.webp",
  },
};

const methodFallbackImages: Partial<Record<CookingMethod, string>> = {
  grill_direct: "/visuals/cooking/default-grill.webp",
  grill_indirect: "/visuals/cooking/default-indirect.webp",
  reverse_sear: "/visuals/cooking/default-reverse-sear.webp",
  oven_pan: "/visuals/cooking/default-oven-pan.webp",
  vegetables_grill: "/visuals/cooking/vegetables-grill.webp",
};

export function detectCookingStepType(value = ""): CookingStepType {
  const text = value.toLowerCase();

  if (text.includes("preheat") || text.includes("precalentar") || text.includes("precalienta")) return "preheat";
  if (text.includes("sear") || text.includes("sellar") || text.includes("sella") || text.includes("dorar")) return "sear";
  if (text.includes("indirect") || text.includes("indirecto") || text.includes("horno")) return "indirect";
  if (text.includes("rest") || text.includes("reposar") || text.includes("reposo") || text.includes("reposa")) return "rest";
  if (text.includes("serve") || text.includes("servir") || text.includes("sirve")) return "serve";

  return "default";
}

export function getCookingStepImage({
  animalId,
  method,
  stepTitle,
  stepType,
}: CookingStepImageInput) {
  const resolvedStepType = stepType ?? detectCookingStepType(stepTitle);

  if (method === "vegetables_grill" || animalId === "vegetables") {
    return directMethodImages.vegetables?.[resolvedStepType] ?? directMethodImages.vegetables?.default ?? DEFAULT_COOKING_STEP_IMAGE;
  }

  const animalImage = animalId ? directMethodImages[animalId]?.[resolvedStepType] ?? directMethodImages[animalId]?.default : undefined;
  if (animalImage) return animalImage;

  return (method ? methodFallbackImages[method] : undefined) ?? DEFAULT_COOKING_STEP_IMAGE;
}
