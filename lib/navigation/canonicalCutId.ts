import type { Animal } from "@/lib/types/domain";

const CANONICAL_BEEF_ALIASES: Record<string, string> = {
  entrecote: "ribeye",
  entrecot: "ribeye",
};

export function canonicalizeCutId(
  cutId: string | null | undefined,
  animalId?: Animal,
): string | undefined {
  const trimmed = cutId?.trim();
  if (!trimmed) return undefined;

  if (animalId === "beef") {
    const normalized = trimmed.toLowerCase();
    return CANONICAL_BEEF_ALIASES[normalized] ?? trimmed;
  }

  return trimmed;
}
