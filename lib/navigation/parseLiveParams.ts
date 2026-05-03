import type { Animal, Doneness } from "@/lib/types/domain";
import type { Lang } from "@/lib/i18n/texts";

const VALID_ANIMALS: Animal[] = ["beef", "pork", "chicken", "fish", "vegetables"];

const VALID_DONENESS: Doneness[] = ["rare", "medium_rare", "medium", "medium_well", "well_done", "safe"];

export function parseLiveParams(search: string) {
  const params = new URLSearchParams(search);

  const animalRaw = params.get("animal");
  const donenessRaw = params.get("doneness");
  const thicknessRaw = params.get("thickness");

  const animal: Animal | undefined =
    animalRaw && VALID_ANIMALS.includes(animalRaw as Animal) ? (animalRaw as Animal) : undefined;

  const doneness: Doneness | undefined =
    donenessRaw && VALID_DONENESS.includes(donenessRaw as Doneness) ? (donenessRaw as Doneness) : undefined;

  const thicknessValue = thicknessRaw ? Number(thicknessRaw) : undefined;
  const thickness = thicknessValue !== undefined && Number.isFinite(thicknessValue) ? thicknessValue : undefined;
  const langRaw = params.get("lang");
  const lang: Lang | undefined =
    langRaw === "es" || langRaw === "en" || langRaw === "fi" ? langRaw : undefined;

  return {
    mode: params.get("mode"),
    animal,
    cutId: params.get("cutId") ?? undefined,
    doneness,
    thickness,
    lang,
  };
}
