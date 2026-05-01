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
};

export const animalLabels: Record<GeneratedAnimalId, string> = {
  beef: "Vacuno",
  pork: "Cerdo",
  chicken: "Pollo",
  fish: "Pescado",
  vegetables: "Verduras",
};

export const methodLabels: Record<GeneratedCookingMethod, string> = {
  grill_direct: "Parrilla directa",
  grill_indirect: "Parrilla indirecta",
  reverse_sear: "Reverse sear",
  oven_pan: "Sarten / horno",
  vegetables_grill: "Verduras a la parrilla",
};

export const intentLabels: Record<CutIntent, string> = {
  quick: "Quick",
  premium: "Premium",
  easy: "Easy",
  slow: "Slow",
  value: "Value",
  argentinian: "Argentinian",
};
