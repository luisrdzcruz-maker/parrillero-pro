import type {
  GeneratedAnimalId,
  GeneratedCookingMethod,
  GeneratedCutProfile,
} from "@/lib/generated/cutProfiles";

export type CutIntent = "quick" | "premium" | "easy" | "slow" | "value" | "argentinian";
export type CutViewMode = "list" | "map";

export type CutGroup = {
  id: string;
  label: string;
  cuts: GeneratedCutProfile[];
};

export type CutSelectionScreenProps = {
  selectedAnimal: GeneratedAnimalId;
  intentFilter?: CutIntent | null;
  onStartCooking?: (profile: GeneratedCutProfile) => void;
  onAnimalChange?: (animal: GeneratedAnimalId) => void;
  isAnimalPreselected?: boolean;
};

export const animalLabels: Record<GeneratedAnimalId, string> = {
  beef: "Beef",
  pork: "Pork",
  chicken: "Chicken",
  fish: "Fish",
  vegetables: "Vegetables",
};

export const methodLabels: Record<GeneratedCookingMethod, string> = {
  grill_direct: "Direct grill",
  grill_indirect: "Indirect grill",
  reverse_sear: "Reverse sear",
  oven_pan: "Pan or oven",
  vegetables_grill: "Grilled vegetables",
};

export const intentLabels: Record<CutIntent, string> = {
  quick: "Quick",
  premium: "Premium",
  easy: "Easy",
  slow: "Slow cook",
  value: "Value",
  argentinian: "Argentine style",
};
