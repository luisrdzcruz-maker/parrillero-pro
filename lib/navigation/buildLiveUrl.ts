import type { Animal, Doneness } from "@/lib/types/domain";

const VALID_ANIMALS: Animal[] = ["beef", "pork", "chicken", "fish", "vegetables"];
const VALID_DONENESS: Doneness[] = ["rare", "medium_rare", "medium", "medium_well", "well_done", "safe"];

export type LiveParams = {
  animal?: Animal;
  cutId?: string;
  doneness?: Doneness;
  thickness?: number;
};

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

  return `/?${search.toString()}`;
}
