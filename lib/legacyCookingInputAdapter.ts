import {
  animalCatalog,
  animalDoneness,
  productCatalog,
  type AnimalId,
  type CookingInput,
  type DonenessId,
  type ProductCut,
} from "./cookingCatalog";

export type AdaptedCookingInput = CookingInput & {
  animalId?: AnimalId;
  cutId?: string;
  requestedDonenessId: DonenessId;
  donenessId: DonenessId;
};

const legacyAnimalAliases: Record<string, AnimalId> = {
  vacuno: "beef",
  carne: "beef",
  res: "beef",
  ternera: "beef",
  beef: "beef",
  cerdo: "pork",
  porcino: "pork",
  pork: "pork",
  pollo: "chicken",
  ave: "chicken",
  chicken: "chicken",
  pescado: "fish",
  fish: "fish",
  verduras: "vegetables",
  vegetales: "vegetables",
  vegetables: "vegetables",
};

const legacyDonenessAliases: Record<string, DonenessId> = {
  blue: "blue",
  azul: "blue",
  rare: "rare",
  poco: "rare",
  "poco hecho": "rare",
  sangrante: "rare",
  "medium rare": "medium_rare",
  medium_rare: "medium_rare",
  "punto menos": "medium_rare",
  medium: "medium",
  medio: "medium",
  "al punto": "medium",
  hecho: "medium_well",
  medium_well: "medium_well",
  "medium well": "medium_well",
  "punto mas": "medium_well",
  well_done: "well_done",
  "well done": "well_done",
  "muy hecho": "well_done",
  "bien hecho": "well_done",
  juicy_safe: "juicy_safe",
  "jugoso seguro": "juicy_safe",
  medium_safe: "medium_safe",
  "medio seguro": "medium_safe",
  safe: "safe",
  seguro: "safe",
  juicy: "juicy",
  jugoso: "juicy",
};

const animalNameToId = new Map<string, AnimalId>();
const cutAliasToId = new Map<string, string>();

for (const animal of animalCatalog) {
  animalNameToId.set(normalizeLegacyKey(animal.id), animal.id);
  Object.values(animal.names).forEach((name) => animalNameToId.set(normalizeLegacyKey(name), animal.id));
}

for (const [alias, animalId] of Object.entries(legacyAnimalAliases)) {
  animalNameToId.set(normalizeLegacyKey(alias), animalId);
}

for (const cut of productCatalog) {
  cutAliasToId.set(normalizeLegacyKey(cut.id), cut.id);
  Object.values(cut.names).forEach((name) => cutAliasToId.set(normalizeLegacyKey(name), cut.id));
  cut.aliases?.forEach((alias) => cutAliasToId.set(normalizeLegacyKey(alias), cut.id));
}

export function normalizeLegacyKey(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function resolveLegacyAnimalId(value: string): AnimalId | undefined {
  return animalNameToId.get(normalizeLegacyKey(value));
}

export function resolveLegacyCutId(value: string): string | undefined {
  return cutAliasToId.get(normalizeLegacyKey(value)) ?? value.trim();
}

export function registerLegacyCutAliases(cuts: readonly Pick<ProductCut, "id" | "aliases">[]) {
  for (const cut of cuts) {
    cutAliasToId.set(normalizeLegacyKey(cut.id), cut.id);
    cut.aliases?.forEach((alias) => cutAliasToId.set(normalizeLegacyKey(alias), cut.id));
  }
}

export function resolveLegacyDonenessId(value: string): DonenessId {
  const normalized = normalizeLegacyKey(value);
  return legacyDonenessAliases[normalized] ?? (normalized as DonenessId);
}

export function applyCookingSafetyRules(
  animalId: AnimalId | undefined,
  requested: DonenessId,
  allowed: readonly DonenessId[],
): DonenessId {
  if (!animalId) return requested;
  if (allowed.includes(requested)) return requested;

  if (animalId === "chicken") {
    return allowed.includes("safe") ? "safe" : (allowed[0] ?? "safe");
  }

  if (animalId === "pork") {
    if (requested === "well_done" && allowed.includes("well_done")) return "well_done";
    if (
      (requested === "medium" || requested === "medium_well" || requested === "medium_safe") &&
      allowed.includes("medium_safe")
    ) {
      return "medium_safe";
    }
    if (allowed.includes("juicy_safe")) return "juicy_safe";
    return allowed[0] ?? "juicy_safe";
  }

  if (allowed.length > 0) return allowed[0];
  return animalDoneness[animalId][0] ?? requested;
}

export function adaptLegacyCookingInput(input: CookingInput, allowedDoneness?: readonly DonenessId[]): AdaptedCookingInput {
  const animalId = resolveLegacyAnimalId(input.animal);
  const cutId = resolveLegacyCutId(input.cut);
  const requestedDonenessId = resolveLegacyDonenessId(input.doneness);
  const safeAllowed = allowedDoneness ?? (animalId ? animalDoneness[animalId] : []);
  const donenessId = applyCookingSafetyRules(animalId, requestedDonenessId, safeAllowed);

  return {
    ...input,
    animalId,
    cutId,
    requestedDonenessId,
    donenessId,
  };
}
