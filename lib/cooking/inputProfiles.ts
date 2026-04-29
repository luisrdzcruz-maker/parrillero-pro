import type { AnimalId, CookingStyle } from "@/lib/cookingCatalog";

export type InputProfileId =
  | "beef-large"
  | "beef-steak"
  | "pork-fast"
  | "chicken-breast"
  | "poultry-whole"
  | "fish-fillet"
  | "fish-whole"
  | "vegetable-format"
  | "default";

export type SizePreset = "small" | "medium" | "large";
export type WeightPreset = "light" | "medium" | "large";
export type VegetableFormat = "whole" | "halved" | "slices";
export type WeightOptionLabelKey = "weightRangeLight" | "weightRangeMedium" | "weightRangeLarge";

export type WeightOption = {
  id: WeightPreset;
  labelKey: WeightOptionLabelKey;
  rangeLabel: string;
};

export type InputProfile = {
  id: InputProfileId;
  title: string;
  showSizePreset: boolean;
  showWeightPreset: boolean;
  showWeightRange: boolean;
  showVegetableFormat: boolean;
  showDoneness: boolean;
  allowAdvancedExactThickness: boolean;
  weightOptions?: WeightOption[];
  defaults: {
    sizePreset: SizePreset;
    weightPreset: WeightPreset;
    weightRange: WeightPreset;
    vegetableFormat: VegetableFormat;
  };
};

export type InputProfileCutContext = {
  cutId: string;
  animalId: AnimalId;
  style: CookingStyle;
  inputProfileId?: string;
};

export const inputProfiles: Record<InputProfileId, InputProfile> = {
  "beef-large": {
    id: "beef-large",
    title: "Beef large cut",
    showSizePreset: true,
    showWeightPreset: true,
    showWeightRange: false,
    showVegetableFormat: false,
    showDoneness: true,
    allowAdvancedExactThickness: true,
    weightOptions: [
      { id: "light", labelKey: "weightRangeLight", rangeLabel: "~0.8-1kg" },
      { id: "medium", labelKey: "weightRangeMedium", rangeLabel: "~1-1.4kg" },
      { id: "large", labelKey: "weightRangeLarge", rangeLabel: "~1.5kg+" },
    ],
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
  "beef-steak": {
    id: "beef-steak",
    title: "Beef steak",
    showSizePreset: true,
    showWeightPreset: false,
    showWeightRange: false,
    showVegetableFormat: false,
    showDoneness: true,
    allowAdvancedExactThickness: false,
    weightOptions: [
      { id: "light", labelKey: "weightRangeLight", rangeLabel: "~0.8-1kg" },
      { id: "medium", labelKey: "weightRangeMedium", rangeLabel: "~1-1.4kg" },
      { id: "large", labelKey: "weightRangeLarge", rangeLabel: "~1.5kg+" },
    ],
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
  "pork-fast": {
    id: "pork-fast",
    title: "Pork fast cut",
    showSizePreset: true,
    showWeightPreset: false,
    showWeightRange: false,
    showVegetableFormat: false,
    showDoneness: true,
    allowAdvancedExactThickness: false,
    weightOptions: [
      { id: "light", labelKey: "weightRangeLight", rangeLabel: "~0.8-1kg" },
      { id: "medium", labelKey: "weightRangeMedium", rangeLabel: "~1-1.4kg" },
      { id: "large", labelKey: "weightRangeLarge", rangeLabel: "~1.5kg+" },
    ],
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
  "chicken-breast": {
    id: "chicken-breast",
    title: "Chicken breast",
    showSizePreset: true,
    showWeightPreset: false,
    showWeightRange: false,
    showVegetableFormat: false,
    showDoneness: true,
    allowAdvancedExactThickness: false,
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
  "poultry-whole": {
    id: "poultry-whole",
    title: "Whole poultry",
    showSizePreset: false,
    showWeightPreset: false,
    showWeightRange: true,
    showVegetableFormat: false,
    showDoneness: true,
    allowAdvancedExactThickness: false,
    weightOptions: [
      { id: "light", labelKey: "weightRangeLight", rangeLabel: "~1-1.3kg" },
      { id: "medium", labelKey: "weightRangeMedium", rangeLabel: "~1.4-1.8kg" },
      { id: "large", labelKey: "weightRangeLarge", rangeLabel: "~1.9kg+" },
    ],
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
  "fish-fillet": {
    id: "fish-fillet",
    title: "Fish fillet",
    showSizePreset: true,
    showWeightPreset: false,
    showWeightRange: false,
    showVegetableFormat: false,
    showDoneness: true,
    allowAdvancedExactThickness: false,
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
  "fish-whole": {
    id: "fish-whole",
    title: "Whole fish",
    showSizePreset: false,
    showWeightPreset: false,
    showWeightRange: true,
    showVegetableFormat: false,
    showDoneness: true,
    allowAdvancedExactThickness: false,
    weightOptions: [
      { id: "light", labelKey: "weightRangeLight", rangeLabel: "~0.6-0.9kg" },
      { id: "medium", labelKey: "weightRangeMedium", rangeLabel: "~0.9-1.4kg" },
      { id: "large", labelKey: "weightRangeLarge", rangeLabel: "~1.5kg+" },
    ],
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
  "vegetable-format": {
    id: "vegetable-format",
    title: "Vegetable format",
    showSizePreset: false,
    showWeightPreset: false,
    showWeightRange: false,
    showVegetableFormat: true,
    showDoneness: false,
    allowAdvancedExactThickness: false,
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
  default: {
    id: "default",
    title: "Default profile",
    showSizePreset: false,
    showWeightPreset: false,
    showWeightRange: false,
    showVegetableFormat: false,
    showDoneness: true,
    allowAdvancedExactThickness: false,
    defaults: {
      sizePreset: "medium",
      weightPreset: "medium",
      weightRange: "medium",
      vegetableFormat: "halved",
    },
  },
};

export function isInputProfileId(value: string): value is InputProfileId {
  return value in inputProfiles;
}

function deriveProfileId(context: InputProfileCutContext): InputProfileId {
  if (context.inputProfileId && isInputProfileId(context.inputProfileId)) {
    return context.inputProfileId;
  }

  if (context.animalId === "vegetables") return "vegetable-format";
  if (context.cutId === "pollo_entero") return "poultry-whole";
  if (context.cutId === "pechuga") return "chicken-breast";
  if (context.cutId === "salmon") return "fish-fillet";
  if (["lubina", "dorada", "rodaballo"].includes(context.cutId)) return "fish-whole";
  if (["tomahawk", "lomo_alto", "picanha"].includes(context.cutId)) return "beef-large";
  if (context.cutId === "entrecote") return "beef-steak";
  if (["secreto_iberico", "presa_iberica", "panceta", "aguja"].includes(context.cutId)) {
    return "pork-fast";
  }
  if (context.animalId === "beef" && context.style === "thick") return "beef-steak";
  if (context.animalId === "fish" && context.style === "fish") return "fish-fillet";

  return "default";
}

export function getInputProfileForCut(context: InputProfileCutContext): InputProfile {
  return inputProfiles[deriveProfileId(context)];
}
