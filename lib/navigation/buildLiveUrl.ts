import type { Animal } from "@/lib/types/domain";
import type { DonenessId } from "@/lib/cookingCatalog";
import type { Lang } from "@/lib/i18n/texts";

const VALID_ANIMALS: Animal[] = ["beef", "pork", "chicken", "fish", "vegetables"];
const VALID_DONENESS: DonenessId[] = [
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

export type LiveParams = {
  animal?: Animal;
  cutId?: string;
  doneness?: DonenessId;
  thickness?: number;
  lang?: Lang;
};

function normalizeLang(value: string | undefined) {
  if (value === "es" || value === "en" || value === "fi") return value;
  return undefined;
}

export function buildLiveUrl(params: LiveParams): string {
  const search = new URLSearchParams();

  search.set("mode", "cocina");

  if (params.animal && VALID_ANIMALS.includes(params.animal)) {
    search.set("animal", params.animal);
  }
  if (params.cutId) search.set("cutId", params.cutId);
  if (params.doneness && VALID_DONENESS.includes(params.doneness)) {
    search.set("doneness", params.doneness);
  }
  if (params.thickness !== undefined && Number.isFinite(params.thickness)) {
    search.set("thickness", String(params.thickness));
  }
  const lang = normalizeLang(params.lang);
  if (lang) search.set("lang", lang);

  return `/?${search.toString()}`;
}
