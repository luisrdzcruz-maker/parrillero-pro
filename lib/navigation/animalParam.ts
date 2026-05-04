import type { Animal } from "@/lib/types/domain";

const CANONICAL_ANIMALS: ReadonlySet<Animal> = new Set([
  "beef",
  "pork",
  "chicken",
  "fish",
  "vegetables",
]);

const ANIMAL_ID_BY_LABEL: Record<string, Animal> = {
  vacuno: "beef",
  cerdo: "pork",
  pollo: "chicken",
  pescado: "fish",
  verduras: "vegetables",
};

export function toAnimalId(labelOrId: string | null | undefined): Animal | undefined {
  const normalized = labelOrId?.trim().toLowerCase();
  if (!normalized) return undefined;

  if (CANONICAL_ANIMALS.has(normalized as Animal)) {
    return normalized as Animal;
  }

  return ANIMAL_ID_BY_LABEL[normalized];
}
