import type { SelectOption } from "@/components/cooking/CookingWizard";
import type { SavedMenu } from "@/components/results/CookingResultScreen";
import {
  getCutById,
  getCutsByAnimal,
  getDonenessOptions,
} from "@/lib/cookingRules";
import type { DonenessId, ProductCut } from "@/lib/cookingCatalog";
import { sanitizeCriticalErrorCopy } from "@/lib/i18n/surfaceFallbacks";
import type { Lang } from "@/lib/i18n/texts";
import { animalIdsByLabel, type AnimalLabel } from "@/lib/media/animalMedia";
import { cutImages } from "@/lib/media/cutImages";
import {
  getAllowedDonenessForCut,
  getDefaultDonenessForCut,
} from "@/lib/temperatureModeProfiles";

import { catalogLang, engineLang, parseSavedLang } from "./i18n";
import { asRecord, asText } from "./text";

export type CutItem = {
  id: string;
  name: string;
  image: string;
  description: string;
};

export type SavedCookConfig = {
  animal: AnimalLabel;
  cut: string;
  weight: string;
  thickness: string;
  doneness: string;
  equipment: string;
  lang: Lang;
};

export const LIVE_DONENESS_VALUES: DonenessId[] = [
  "rare",
  "medium_rare",
  "medium",
  "medium_well",
  "well_done",
  "juicy_safe",
  "medium_safe",
  "safe",
  "juicy",
];

export const animalLabelsById: Record<string, AnimalLabel> = Object.fromEntries(
  Object.entries(animalIdsByLabel).map(([label, id]) => [id, label]),
) as Record<string, AnimalLabel>;

export function parseSavedAnimal(value: unknown, fallback: AnimalLabel): AnimalLabel {
  const text = asText(value);
  if (text && text in animalIdsByLabel) return text as AnimalLabel;
  return fallback;
}

export function toLiveDoneness(value: string): DonenessId | undefined {
  return LIVE_DONENESS_VALUES.includes(value as DonenessId) ? (value as DonenessId) : undefined;
}

export function getInitialDoneness(animal: AnimalLabel, cutId?: string) {
  const cut = cutId ? getCutById(cutId) : undefined;
  if (cut) return getDefaultDonenessForCut(cut);

  return getDonenessOptions(animalIdsByLabel[animal])[0]?.id ?? "";
}

export function getDonenessSelectOptions(animal: AnimalLabel, lang: Lang, cutId?: string): SelectOption[] {
  const cut = cutId ? getCutById(cutId) : undefined;
  const allowed = cut ? getAllowedDonenessForCut(cut) : getDonenessOptions(animalIdsByLabel[animal]).map((option) => option.id);
  const optionsById = new Map(getDonenessOptions(animalIdsByLabel[animal]).map((option) => [option.id, option]));

  return allowed.flatMap((id) => {
    const option = optionsById.get(id);
    if (!option) return [];
    return {
    value: option.id,
    label: option.names[lang],
    };
  });
}

export function getCutName(cut: ProductCut, lang: Lang) {
  return cut.names[catalogLang(lang)] ?? cut.names.es;
}

export function getCutDescription(cut: ProductCut, lang: Lang) {
  const localizedNote = cut.notes?.[catalogLang(lang)];
  if (localizedNote) return sanitizeCriticalErrorCopy(localizedNote, lang);
  return sanitizeCriticalErrorCopy(cut.error[engineLang(lang)] ?? "", lang);
}

export function getCutItems(animal: AnimalLabel, lang: Lang): CutItem[] {
  return getCutsByAnimal(animalIdsByLabel[animal]).map((cut) => ({
    id: cut.id,
    name: getCutName(cut, lang),
    image: cutImages[cut.id] ?? "/images/vacuno/ribeye-cooked.webp",
    description: getCutDescription(cut, lang),
  }));
}

export function getAnimalPreview(animal: AnimalLabel, lang: Lang) {
  return getCutItems(animal, lang)
    .slice(0, 2)
    .map((cut) => cut.name)
    .join(", ");
}

export function parseSavedCookConfig(
  menu: SavedMenu,
  fallback: {
    animal: AnimalLabel;
    equipment: string;
    doneness: string;
    weight: string;
    thickness: string;
    lang: Lang;
  },
): SavedCookConfig | null {
  const data = asRecord(menu.data);
  if (!data) return null;
  const inputs = asRecord(data.inputs) ?? data;
  const cut = asText(inputs.cut);
  if (!cut) return null;

  return {
    animal: parseSavedAnimal(inputs.animal, fallback.animal),
    cut,
    weight: asText(inputs.weight) || fallback.weight,
    thickness: asText(inputs.thickness) || fallback.thickness,
    doneness: asText(inputs.doneness) || fallback.doneness,
    equipment: asText(inputs.equipment) || fallback.equipment,
    lang: parseSavedLang(data.lang ?? inputs.lang ?? fallback.lang),
  };
}
