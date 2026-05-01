// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\cuts\parrillero_pro_input_profiles_en.csv

import type { Animal } from "@/lib/types/domain";

export type GeneratedAnimalId = Animal;
export type GeneratedCookingMethod =
  | "grill_direct"
  | "grill_indirect"
  | "reverse_sear"
  | "oven_pan"
  | "vegetables_grill";
export type GeneratedDonenessId =
  | "blue"
  | "rare"
  | "medium_rare"
  | "medium"
  | "medium_well"
  | "well_done"
  | "juicy_safe"
  | "medium_safe"
  | "safe"
  | "juicy";
export type GeneratedCookingStyle =
  | "fast"
  | "thick"
  | "reverse"
  | "fatcap"
  | "lowSlow"
  | "crispy"
  | "poultry"
  | "fish"
  | "vegetable";
export type GeneratedFireZone = "direct" | "indirect" | "mixed";
export type GeneratedTimeType = "total" | "per_cm" | "hybrid";
export type GeneratedConfidenceLevel = "high" | "medium" | "low";

export type GeneratedCutProfile = {
  id: string;
  animalId: GeneratedAnimalId;
  category: string;
  canonicalNameEn: string;
  inputProfileId?: string;
  defaultThicknessCm: number;
  showThickness: boolean;
  allowedMethods: GeneratedCookingMethod[];
  defaultMethod: GeneratedCookingMethod;
  allowedDoneness: GeneratedDonenessId[];
  style: GeneratedCookingStyle;
  cookingStyle?: string;
  fireZone?: string;
  timeType?: string;
  defaultDoneness?: string;
  confidenceLevel?: string;
  restingMinutes: number;
  estimatedTimeMinPerCm?: number;
  estimatedTotalTimeMin?: number;
  cookingMinutes?: number;
  targetTempC?: number;
  safetyNoteEn?: string;
  errorEn: string;
  aliasesEn: string[];
  notesEn?: string;
  tipsEn: string[];
  criticalMistakeEn?: string;
  cuttingDirectionEn?: string;
  proTipEn?: string;
  textureResultEn?: string;
  setupVisualKeyEn?: string;
};

export const generatedCutProfiles = [
  {
    "id": "ribeye",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Ribeye",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "high",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 54,
    "errorEn": "Fatty premium steak.",
    "aliasesEn": [
      "ribeye",
      "rib eye",
      "cube roll",
      "ojo de bife",
      "entrecot"
    ],
    "notesEn": "Fatty premium steak.",
    "tipsEn": [
      "premium",
      "quick",
      "easy",
      "slice against the grain in 1 cm strips"
    ],
    "criticalMistakeEn": "failing to render the cap fat side first",
    "cuttingDirectionEn": "slice against the grain in 1 cm strips",
    "proTipEn": "flip every 45 to 60 seconds for even browning",
    "textureResultEn": "juicy center with a deep crust and rendered edge",
    "setupVisualKeyEn": "two zone fire and cast iron grate at high heat"
  },
  {
    "id": "striploin",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Striploin",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 54,
    "errorEn": "Classic steakhouse cut.",
    "aliasesEn": [
      "striploin",
      "New York strip",
      "sirloin steak UK",
      "bife de chorizo"
    ],
    "notesEn": "Classic steakhouse cut.",
    "tipsEn": [
      "premium",
      "quick",
      "slice against the grain on a slight bias"
    ],
    "criticalMistakeEn": "overcooking the lean eye before fat renders",
    "cuttingDirectionEn": "slice against the grain on a slight bias",
    "proTipEn": "start fat edge down then turn frequently",
    "textureResultEn": "firm beef bite with pink core and crisp fat rim",
    "setupVisualKeyEn": "fully preheated direct zone plus warm resting area"
  },
  {
    "id": "tenderloin",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Tenderloin",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "rare",
      "medium_rare"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 3,
    "targetTempC": 52,
    "errorEn": "Very tender and lean.",
    "aliasesEn": [
      "tenderloin",
      "filet",
      "fillet",
      "filet mignon",
      "solomillo"
    ],
    "notesEn": "Very tender and lean.",
    "tipsEn": [
      "premium",
      "easy",
      "slice medallions against the grain"
    ],
    "criticalMistakeEn": "using aggressive heat too long on lean meat",
    "cuttingDirectionEn": "slice medallions against the grain",
    "proTipEn": "sear hard then finish gently to target temp",
    "textureResultEn": "buttery soft bite with thin crust and low chew",
    "setupVisualKeyEn": "hot sear zone and cooler finishing zone with probe ready"
  },
  {
    "id": "picanha",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Picanha",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "fatcap",
    "cookingStyle": "fatcap",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "high",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 54,
    "errorEn": "Keep fat cap intact.",
    "aliasesEn": [
      "picanha",
      "rump cap",
      "sirloin cap",
      "coulotte",
      "tapa de cuadril"
    ],
    "notesEn": "Keep fat cap intact.",
    "tipsEn": [
      "premium",
      "grill",
      "slice with grain into steaks then serve against grain"
    ],
    "criticalMistakeEn": "scoring too deep and losing fat cap juices",
    "cuttingDirectionEn": "slice with grain into steaks then serve against grain",
    "proTipEn": "render fat cap slowly then finish on direct heat",
    "textureResultEn": "rich slices with rendered cap and springy bite",
    "setupVisualKeyEn": "mixed setup with indirect rendering side and direct finish side"
  },
  {
    "id": "bavette",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Bavette / Flap Steak",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 3,
    "targetTempC": 54,
    "errorEn": "Fibrous and flavorful.",
    "aliasesEn": [
      "bavette",
      "vacío",
      "flap steak",
      "flap meat",
      "sirloin flap"
    ],
    "notesEn": "Fibrous and flavorful.",
    "tipsEn": [
      "argentinian",
      "quick",
      "slice sharply against the grain on a bias"
    ],
    "criticalMistakeEn": "cutting with the grain and making long chewy fibers",
    "cuttingDirectionEn": "slice sharply against the grain on a bias",
    "proTipEn": "rest then slice thin angled strips under 1 cm",
    "textureResultEn": "loose fibrous texture that stays juicy when cut right",
    "setupVisualKeyEn": "very hot direct zone and short cook only"
  },
  {
    "id": "skirt_steak",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Skirt Steak",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 3,
    "targetTempC": 54,
    "errorEn": "Fast hot sear.",
    "aliasesEn": [
      "entraña",
      "skirt steak",
      "outside skirt",
      "inside skirt",
      "falda"
    ],
    "notesEn": "Fast hot sear.",
    "tipsEn": [
      "argentinian",
      "quick",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "flank_steak",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Flank Steak",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 54,
    "errorEn": "Marinade helps tenderness.",
    "aliasesEn": [
      "flank steak",
      "falda",
      "London broil"
    ],
    "notesEn": "Marinade helps tenderness.",
    "tipsEn": [
      "quick",
      "lean",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "flat_iron",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Flat Iron",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 54,
    "errorEn": "Tender if cleaned well.",
    "aliasesEn": [
      "flat iron",
      "top blade steak",
      "marucha"
    ],
    "notesEn": "Tender if cleaned well.",
    "tipsEn": [
      "quick",
      "value",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "tri_tip",
    "animalId": "beef",
    "category": "roast",
    "canonicalNameEn": "Tri-Tip",
    "inputProfileId": "beef-large",
    "defaultThicknessCm": 5,
    "showThickness": true,
    "allowedMethods": [
      "reverse_sear",
      "grill_direct",
      "grill_indirect"
    ],
    "defaultMethod": "reverse_sear",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 10,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 56,
    "errorEn": "Great for indirect grilling.",
    "aliasesEn": [
      "tri-tip",
      "maminha",
      "colita de cuadril"
    ],
    "notesEn": "Great for indirect grilling.",
    "tipsEn": [
      "bbq",
      "value",
      "grain changes direction",
      "slice accordingly"
    ],
    "cuttingDirectionEn": "grain changes direction; slice accordingly"
  },
  {
    "id": "hanger_steak",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Hanger Steak",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 3,
    "targetTempC": 54,
    "errorEn": "Strong beef flavor.",
    "aliasesEn": [
      "hanger steak",
      "onglet",
      "butcher's steak"
    ],
    "notesEn": "Strong beef flavor.",
    "tipsEn": [
      "quick",
      "bold",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "denver_steak",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Denver Steak",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 54,
    "errorEn": "Modern chuck steak.",
    "aliasesEn": [
      "Denver steak",
      "under blade steak"
    ],
    "notesEn": "Modern chuck steak.",
    "tipsEn": [
      "premium",
      "value",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "chuck_eye",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Chuck Eye",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 54,
    "errorEn": "Ribeye-like but less consistent.",
    "aliasesEn": [
      "chuck eye",
      "poor man's ribeye"
    ],
    "notesEn": "Ribeye-like but less consistent.",
    "tipsEn": [
      "value",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "top_sirloin",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Top Sirloin",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 56,
    "errorEn": "Lean and versatile.",
    "aliasesEn": [
      "top sirloin",
      "cuadril"
    ],
    "notesEn": "Lean and versatile.",
    "tipsEn": [
      "lean",
      "value",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "rump_steak",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Rump Steak",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 56,
    "errorEn": "Do not overcook.",
    "aliasesEn": [
      "rump steak",
      "cuadril",
      "cadera"
    ],
    "notesEn": "Do not overcook.",
    "tipsEn": [
      "lean",
      "value",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "t_bone",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "T-Bone",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "reverse",
    "cookingStyle": "reverse",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 54,
    "errorEn": "Bone causes uneven cooking.",
    "aliasesEn": [
      "T-bone",
      "porterhouse"
    ],
    "notesEn": "Bone causes uneven cooking.",
    "tipsEn": [
      "premium",
      "separate muscles then slice against grain"
    ],
    "cuttingDirectionEn": "separate muscles then slice against grain"
  },
  {
    "id": "porterhouse",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Porterhouse",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "reverse",
    "cookingStyle": "reverse",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 54,
    "errorEn": "Large tenderloin side.",
    "aliasesEn": [
      "porterhouse",
      "large T-bone"
    ],
    "notesEn": "Large tenderloin side.",
    "tipsEn": [
      "premium",
      "separate muscles then slice against grain"
    ],
    "cuttingDirectionEn": "separate muscles then slice against grain"
  },
  {
    "id": "tomahawk",
    "animalId": "beef",
    "category": "steak",
    "canonicalNameEn": "Tomahawk",
    "inputProfileId": "beef-steak",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "reverse_sear",
      "grill_direct",
      "grill_indirect"
    ],
    "defaultMethod": "reverse_sear",
    "allowedDoneness": [
      "medium_rare",
      "medium"
    ],
    "style": "reverse",
    "cookingStyle": "reverse",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "medium_rare",
    "confidenceLevel": "medium",
    "restingMinutes": 10,
    "estimatedTimeMinPerCm": 6,
    "targetTempC": 54,
    "errorEn": "Very thick bone-in ribeye.",
    "aliasesEn": [
      "tomahawk",
      "bone-in ribeye",
      "cowboy steak"
    ],
    "notesEn": "Very thick bone-in ribeye.",
    "tipsEn": [
      "premium",
      "wow",
      "separate eye and cap then slice against the grain"
    ],
    "criticalMistakeEn": "trying to cook only over direct heat and burning outside",
    "cuttingDirectionEn": "separate eye and cap then slice against the grain",
    "proTipEn": "reverse sear to 46 to 48C then finish over intense heat",
    "textureResultEn": "thick rosy center with pronounced crust contrast",
    "setupVisualKeyEn": "stable two zone setup with lid for controlled indirect phase"
  },
  {
    "id": "brisket",
    "animalId": "beef",
    "category": "bbq",
    "canonicalNameEn": "Brisket",
    "inputProfileId": "beef-large",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 30,
    "estimatedTotalTimeMin": 600,
    "cookingMinutes": 600,
    "targetTempC": 93,
    "errorEn": "Cook until tender, not by steak doneness.",
    "aliasesEn": [
      "brisket",
      "pecho"
    ],
    "notesEn": "Cook until tender, not by steak doneness.",
    "tipsEn": [
      "slow",
      "bbq",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "short_ribs",
    "animalId": "beef",
    "category": "bbq",
    "canonicalNameEn": "Short Ribs",
    "inputProfileId": "beef-large",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 15,
    "estimatedTotalTimeMin": 270,
    "cookingMinutes": 270,
    "targetTempC": 90,
    "errorEn": "Collagen-rich.",
    "aliasesEn": [
      "short ribs",
      "asado de tira",
      "flanken ribs"
    ],
    "notesEn": "Collagen-rich.",
    "tipsEn": [
      "slow",
      "argentinian",
      "between bones or against grain"
    ],
    "cuttingDirectionEn": "between bones or against grain"
  },
  {
    "id": "chuck_roast",
    "animalId": "beef",
    "category": "bbq",
    "canonicalNameEn": "Chuck Roast",
    "inputProfileId": "beef-large",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 20,
    "estimatedTotalTimeMin": 330,
    "cookingMinutes": 330,
    "targetTempC": 92,
    "errorEn": "Good pulled beef.",
    "aliasesEn": [
      "chuck",
      "aguja",
      "shoulder roast"
    ],
    "notesEn": "Good pulled beef.",
    "tipsEn": [
      "slow",
      "value",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "ground_beef",
    "animalId": "beef",
    "category": "ground",
    "canonicalNameEn": "Ground Beef",
    "inputProfileId": "default",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "oven_pan",
      "grill_direct"
    ],
    "defaultMethod": "oven_pan",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 2,
    "estimatedTimeMinPerCm": 3,
    "targetTempC": 65,
    "safetyNoteEn": "Ground beef must be cooked to 71°C / 160°F. Medium carries food safety risk.",
    "errorEn": "Ground beef must be cooked to 71°C / 160°F. Medium carries food safety risk.",
    "aliasesEn": [
      "ground beef",
      "minced beef",
      "carne molida"
    ],
    "notesEn": "Cook fully to 71°C / 160°F for safety. Ground beef must be cooked to 71°C / 160°F. Medium carries food safety risk.",
    "tipsEn": [
      "burger",
      "quick",
      "not applicable"
    ],
    "cuttingDirectionEn": "not applicable"
  },
  {
    "id": "pork_tenderloin",
    "animalId": "pork",
    "category": "steak",
    "canonicalNameEn": "Pork Tenderloin",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 64,
    "safetyNoteEn": "Cook to safe pork temperature.",
    "errorEn": "Cook to safe pork temperature.",
    "aliasesEn": [
      "pork tenderloin",
      "pork fillet"
    ],
    "notesEn": "Lean and tender. Cook to safe pork temperature.",
    "tipsEn": [
      "quick",
      "lean",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "pork_loin",
    "animalId": "pork",
    "category": "roast",
    "canonicalNameEn": "Pork Loin",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 5,
    "showThickness": true,
    "allowedMethods": [
      "oven_pan",
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "oven_pan",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "per_cm",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 66,
    "safetyNoteEn": "Cook to safe pork temperature.",
    "errorEn": "Cook to safe pork temperature.",
    "aliasesEn": [
      "pork loin",
      "boneless loin"
    ],
    "notesEn": "Brine recommended. Cook to safe pork temperature.",
    "tipsEn": [
      "lean",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "pork_chop",
    "animalId": "pork",
    "category": "steak",
    "canonicalNameEn": "Pork Chop",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 66,
    "safetyNoteEn": "Cook to safe pork temperature.",
    "errorEn": "Cook to safe pork temperature.",
    "aliasesEn": [
      "pork chop",
      "cutlet"
    ],
    "notesEn": "Bone-in is juicier. Cook to safe pork temperature.",
    "tipsEn": [
      "quick",
      "slice against the grain and avoid bone curve"
    ],
    "criticalMistakeEn": "pulling too late and overshooting safe juicy range",
    "cuttingDirectionEn": "slice against the grain and avoid bone curve",
    "proTipEn": "pull at 61 to 62C and rest to finish at safe temp",
    "textureResultEn": "juicy interior with lightly crisp browned exterior",
    "setupVisualKeyEn": "two zone grill with direct sear and covered finish"
  },
  {
    "id": "iberian_secreto",
    "animalId": "pork",
    "category": "steak",
    "canonicalNameEn": "Iberian Secreto",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 66,
    "safetyNoteEn": "Cook to safe pork temperature.",
    "errorEn": "Cook to safe pork temperature.",
    "aliasesEn": [
      "secreto",
      "iberian secreto"
    ],
    "notesEn": "Fatty Iberian cut. Cook to safe pork temperature.",
    "tipsEn": [
      "premium",
      "quick",
      "slice against the grain into thin strips"
    ],
    "criticalMistakeEn": "cooking too cool and leaving fat under rendered",
    "cuttingDirectionEn": "slice against the grain into thin strips",
    "proTipEn": "use hard heat and keep turning until edges caramelize",
    "textureResultEn": "succulent fatty bite with crisp caramelized edges",
    "setupVisualKeyEn": "intense direct heat surface with short rest tray"
  },
  {
    "id": "iberian_presa",
    "animalId": "pork",
    "category": "steak",
    "canonicalNameEn": "Iberian Presa",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 66,
    "safetyNoteEn": "Cook to safe pork temperature.",
    "errorEn": "Cook to safe pork temperature.",
    "aliasesEn": [
      "presa",
      "iberian presa"
    ],
    "notesEn": "Premium Iberian shoulder cut. Cook to safe pork temperature.",
    "tipsEn": [
      "premium",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "iberian_pluma",
    "animalId": "pork",
    "category": "steak",
    "canonicalNameEn": "Iberian Pluma",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "juicy_safe",
      "medium_safe"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 66,
    "safetyNoteEn": "Cook to safe pork temperature.",
    "errorEn": "Cook to safe pork temperature.",
    "aliasesEn": [
      "pluma",
      "iberian pluma",
      "feather cut"
    ],
    "notesEn": "Thin premium Iberian cut. Cook to safe pork temperature.",
    "tipsEn": [
      "premium",
      "quick",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "pork_collar",
    "animalId": "pork",
    "category": "steak",
    "canonicalNameEn": "Pork Collar",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 72,
    "safetyNoteEn": "Cook to safe pork temperature.",
    "errorEn": "Cook to safe pork temperature.",
    "aliasesEn": [
      "pork collar",
      "pork neck",
      "coppa",
      "bondiola",
      "kassler"
    ],
    "notesEn": "Fatty and forgiving. Cook to safe pork temperature.",
    "tipsEn": [
      "easy",
      "value",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "pork_shoulder",
    "animalId": "pork",
    "category": "bbq",
    "canonicalNameEn": "Pork Shoulder",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "medium_safe",
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 20,
    "estimatedTotalTimeMin": 480,
    "cookingMinutes": 480,
    "targetTempC": 93,
    "safetyNoteEn": "Cook until tender and safe.",
    "errorEn": "Cook until tender and safe.",
    "aliasesEn": [
      "pork shoulder",
      "picnic shoulder",
      "paleta"
    ],
    "notesEn": "Great for pulled pork. Cook until tender and safe.",
    "tipsEn": [
      "slow",
      "bbq",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "pork_butt",
    "animalId": "pork",
    "category": "bbq",
    "canonicalNameEn": "Boston Butt",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "medium_safe",
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 20,
    "estimatedTotalTimeMin": 480,
    "cookingMinutes": 480,
    "targetTempC": 93,
    "safetyNoteEn": "Cook until tender and safe.",
    "errorEn": "Cook until tender and safe.",
    "aliasesEn": [
      "Boston butt",
      "pork butt",
      "shoulder butt"
    ],
    "notesEn": "US BBQ cut. Cook until tender and safe.",
    "tipsEn": [
      "slow",
      "bbq",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "baby_back_ribs",
    "animalId": "pork",
    "category": "ribs",
    "canonicalNameEn": "Baby Back Ribs",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 10,
    "estimatedTotalTimeMin": 180,
    "cookingMinutes": 180,
    "targetTempC": 90,
    "safetyNoteEn": "Cook until tender and safe.",
    "errorEn": "Cook until tender and safe.",
    "aliasesEn": [
      "baby back ribs",
      "loin ribs"
    ],
    "notesEn": "Tender loin ribs. Cook until tender and safe.",
    "tipsEn": [
      "bbq",
      "cut between bones after resting"
    ],
    "criticalMistakeEn": "cooking by time only and skipping tenderness checks",
    "cuttingDirectionEn": "cut between bones after resting",
    "proTipEn": "glaze only at the end and confirm bend test",
    "textureResultEn": "tender bite with slight pull from bone",
    "setupVisualKeyEn": "indirect setup with drip pan and stable lid temperature"
  },
  {
    "id": "spare_ribs",
    "animalId": "pork",
    "category": "ribs",
    "canonicalNameEn": "Spare Ribs",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 10,
    "estimatedTotalTimeMin": 240,
    "cookingMinutes": 240,
    "targetTempC": 90,
    "safetyNoteEn": "Cook until tender and safe.",
    "errorEn": "Cook until tender and safe.",
    "aliasesEn": [
      "spare ribs",
      "costillar",
      "pechito"
    ],
    "notesEn": "Fattier ribs. Cook until tender and safe.",
    "tipsEn": [
      "bbq",
      "slow",
      "between bones"
    ],
    "cuttingDirectionEn": "between bones"
  },
  {
    "id": "pork_belly",
    "animalId": "pork",
    "category": "bbq",
    "canonicalNameEn": "Pork Belly",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "oven_pan",
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "oven_pan",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 10,
    "estimatedTotalTimeMin": 135,
    "cookingMinutes": 135,
    "targetTempC": 85,
    "safetyNoteEn": "Cook until rendered and safe.",
    "errorEn": "Cook until rendered and safe.",
    "aliasesEn": [
      "pork belly",
      "panceta",
      "belly"
    ],
    "notesEn": "Very fatty. Cook until rendered and safe.",
    "tipsEn": [
      "slow",
      "crispy",
      "slice perpendicular"
    ],
    "cuttingDirectionEn": "slice perpendicular"
  },
  {
    "id": "pork_belly_slices",
    "animalId": "pork",
    "category": "steak",
    "canonicalNameEn": "Pork Belly Slices",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 75,
    "safetyNoteEn": "Cook to safe pork temperature.",
    "errorEn": "Cook to safe pork temperature.",
    "aliasesEn": [
      "belly slices",
      "pork belly strips"
    ],
    "notesEn": "Good for fast grilling. Cook to safe pork temperature.",
    "tipsEn": [
      "quick",
      "not critical"
    ],
    "cuttingDirectionEn": "not critical"
  },
  {
    "id": "pork_hock",
    "animalId": "pork",
    "category": "bbq",
    "canonicalNameEn": "Pork Hock",
    "inputProfileId": "pork-fast",
    "defaultThicknessCm": 5,
    "showThickness": false,
    "allowedMethods": [
      "oven_pan",
      "grill_indirect"
    ],
    "defaultMethod": "oven_pan",
    "allowedDoneness": [
      "medium_safe",
      "well_done"
    ],
    "style": "lowSlow",
    "cookingStyle": "low_slow",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "medium_safe",
    "confidenceLevel": "medium",
    "restingMinutes": 15,
    "estimatedTotalTimeMin": 270,
    "cookingMinutes": 270,
    "targetTempC": 93,
    "safetyNoteEn": "Cook until tender and safe.",
    "errorEn": "Cook until tender and safe.",
    "aliasesEn": [
      "pork hock",
      "knuckle",
      "codillo"
    ],
    "notesEn": "Collagen-rich. Cook until tender and safe.",
    "tipsEn": [
      "slow",
      "around bone"
    ],
    "cuttingDirectionEn": "around bone"
  },
  {
    "id": "ground_pork",
    "animalId": "pork",
    "category": "ground",
    "canonicalNameEn": "Ground Pork",
    "inputProfileId": "default",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "oven_pan"
    ],
    "defaultMethod": "oven_pan",
    "allowedDoneness": [
      "well_done"
    ],
    "style": "fast",
    "cookingStyle": "fast",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "well_done",
    "confidenceLevel": "medium",
    "restingMinutes": 2,
    "estimatedTimeMinPerCm": 3,
    "targetTempC": 71,
    "safetyNoteEn": "Ground pork must be cooked safely.",
    "errorEn": "Ground pork must be cooked safely.",
    "aliasesEn": [
      "ground pork",
      "minced pork"
    ],
    "notesEn": "For burgers and sausages. Ground pork must be cooked safely.",
    "tipsEn": [
      "burger",
      "quick",
      "not applicable"
    ],
    "cuttingDirectionEn": "not applicable"
  },
  {
    "id": "chicken_breast",
    "animalId": "chicken",
    "category": "breast",
    "canonicalNameEn": "Chicken Breast",
    "inputProfileId": "chicken-breast",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan",
      "reverse_sear"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "safe",
    "confidenceLevel": "high",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 73,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "chicken breast",
      "breast fillet"
    ],
    "notesEn": "Easy to dry out. Chicken must be fully cooked.",
    "tipsEn": [
      "quick",
      "lean",
      "slice across the grain into even strips"
    ],
    "criticalMistakeEn": "pulling late and drying the lean center",
    "cuttingDirectionEn": "slice across the grain into even strips",
    "proTipEn": "dry brine then pull at 70 to 71C for carryover",
    "textureResultEn": "moist white meat with light spring and clean fibers",
    "setupVisualKeyEn": "medium direct zone with optional cooler finishing side"
  },
  {
    "id": "chicken_tenderloin",
    "animalId": "chicken",
    "category": "breast",
    "canonicalNameEn": "Chicken Tenderloin",
    "inputProfileId": "chicken-breast",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 73,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "chicken tender",
      "inner fillet"
    ],
    "notesEn": "Very fast. Chicken must be fully cooked.",
    "tipsEn": [
      "quick",
      "easy",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "chicken_thigh",
    "animalId": "chicken",
    "category": "thigh",
    "canonicalNameEn": "Chicken Thigh",
    "inputProfileId": "poultry-whole",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 6,
    "targetTempC": 78,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "chicken thigh",
      "boneless thigh"
    ],
    "notesEn": "Forgiving and juicy. Chicken must be fully cooked.",
    "tipsEn": [
      "easy",
      "juicy",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "bone_in_chicken_thigh",
    "animalId": "chicken",
    "category": "thigh",
    "canonicalNameEn": "Bone-in Chicken Thigh",
    "inputProfileId": "poultry-whole",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 6,
    "targetTempC": 80,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "bone-in chicken thigh"
    ],
    "notesEn": "Needs more time near bone. Chicken must be fully cooked.",
    "tipsEn": [
      "easy",
      "juicy",
      "around bone"
    ],
    "cuttingDirectionEn": "around bone"
  },
  {
    "id": "chicken_drumstick",
    "animalId": "chicken",
    "category": "leg",
    "canonicalNameEn": "Chicken Drumstick",
    "inputProfileId": "poultry-whole",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 6,
    "targetTempC": 80,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "drumstick",
      "koipi"
    ],
    "notesEn": "Popular BBQ piece. Chicken must be fully cooked.",
    "tipsEn": [
      "easy",
      "around bone"
    ],
    "cuttingDirectionEn": "around bone"
  },
  {
    "id": "chicken_leg_quarter",
    "animalId": "chicken",
    "category": "leg",
    "canonicalNameEn": "Chicken Leg Quarter",
    "inputProfileId": "poultry-whole",
    "defaultThicknessCm": 3,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 10,
    "estimatedTotalTimeMin": 45,
    "cookingMinutes": 45,
    "targetTempC": 80,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "leg quarter",
      "koipireisi"
    ],
    "notesEn": "Common Finnish cut. Chicken must be fully cooked.",
    "tipsEn": [
      "value",
      "separate joints"
    ],
    "cuttingDirectionEn": "separate joints"
  },
  {
    "id": "chicken_wing",
    "animalId": "chicken",
    "category": "wing",
    "canonicalNameEn": "Chicken Wing",
    "inputProfileId": "poultry-whole",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "grill_direct",
      "grill_indirect"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "safe",
      "well_done"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 83,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "wing",
      "siipi",
      "buffalo wing"
    ],
    "notesEn": "Cook higher for crisp skin. Chicken must be fully cooked.",
    "tipsEn": [
      "snack",
      "crispy",
      "not applicable"
    ],
    "cuttingDirectionEn": "not applicable"
  },
  {
    "id": "whole_chicken",
    "animalId": "chicken",
    "category": "whole",
    "canonicalNameEn": "Whole Chicken",
    "inputProfileId": "poultry-whole",
    "defaultThicknessCm": 6,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 10,
    "estimatedTotalTimeMin": 75,
    "cookingMinutes": 75,
    "targetTempC": 78,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "whole chicken",
      "broiler"
    ],
    "notesEn": "Check breast and thigh. Chicken must be fully cooked.",
    "tipsEn": [
      "family",
      "bbq",
      "carve joints first then slice breast against grain"
    ],
    "criticalMistakeEn": "ignoring thigh temp while chasing breast doneness",
    "cuttingDirectionEn": "carve joints first then slice breast against grain",
    "proTipEn": "target 75C breast and 78 to 82C thigh for balance",
    "textureResultEn": "crisp skin with juicy breast and tender dark meat",
    "setupVisualKeyEn": "indirect roasting zone around 180 to 200C with optional crisp finish"
  },
  {
    "id": "spatchcock_chicken",
    "animalId": "chicken",
    "category": "whole",
    "canonicalNameEn": "Spatchcock Chicken",
    "inputProfileId": "poultry-whole",
    "defaultThicknessCm": 6,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "mixed",
    "timeType": "total",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 10,
    "estimatedTotalTimeMin": 48,
    "cookingMinutes": 48,
    "targetTempC": 78,
    "safetyNoteEn": "Chicken must be fully cooked.",
    "errorEn": "Chicken must be fully cooked.",
    "aliasesEn": [
      "spatchcock",
      "butterflied chicken"
    ],
    "notesEn": "Best whole chicken format for grill. Chicken must be fully cooked.",
    "tipsEn": [
      "family",
      "easy",
      "carve by joints"
    ],
    "cuttingDirectionEn": "carve by joints"
  },
  {
    "id": "ground_chicken",
    "animalId": "chicken",
    "category": "ground",
    "canonicalNameEn": "Ground Chicken",
    "inputProfileId": "default",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "oven_pan"
    ],
    "defaultMethod": "oven_pan",
    "allowedDoneness": [
      "safe"
    ],
    "style": "poultry",
    "cookingStyle": "poultry",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "safe",
    "confidenceLevel": "medium",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 75,
    "safetyNoteEn": "Ground chicken must be fully cooked.",
    "errorEn": "Ground chicken must be fully cooked.",
    "aliasesEn": [
      "ground chicken",
      "minced chicken"
    ],
    "notesEn": "Safety-first. Ground chicken must be fully cooked.",
    "tipsEn": [
      "burger",
      "quick",
      "not applicable"
    ],
    "cuttingDirectionEn": "not applicable"
  },
  {
    "id": "salmon_fillet",
    "animalId": "fish",
    "category": "fillet",
    "canonicalNameEn": "Salmon Fillet",
    "inputProfileId": "fish-fillet",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium",
    "confidenceLevel": "high",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 55,
    "safetyNoteEn": "Use very fresh fish; cook higher for vulnerable guests.",
    "errorEn": "Use very fresh fish; cook higher for vulnerable guests.",
    "aliasesEn": [
      "salmon",
      "lohi"
    ],
    "notesEn": "Fatty and forgiving. Use very fresh fish; cook higher for vulnerable guests.",
    "tipsEn": [
      "quick",
      "fatty",
      "portion with grain and separate flakes for service"
    ],
    "criticalMistakeEn": "overcooking until albumin leaks heavily and flesh chalks",
    "cuttingDirectionEn": "portion with grain and separate flakes for service",
    "proTipEn": "cook skin side first and pull at 48 to 50C",
    "textureResultEn": "silky flakes with moist translucent center",
    "setupVisualKeyEn": "clean oiled grate and medium direct heat"
  },
  {
    "id": "salmon_steak",
    "animalId": "fish",
    "category": "steak",
    "canonicalNameEn": "Salmon Steak",
    "inputProfileId": "fish-fillet",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium",
    "confidenceLevel": "high",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 55,
    "safetyNoteEn": "Use very fresh fish; cook higher for vulnerable guests.",
    "errorEn": "Use very fresh fish; cook higher for vulnerable guests.",
    "aliasesEn": [
      "salmon steak",
      "lohikiekko"
    ],
    "notesEn": "Bone-in cross cut. Use very fresh fish; cook higher for vulnerable guests.",
    "tipsEn": [
      "quick",
      "around bone"
    ],
    "cuttingDirectionEn": "around bone"
  },
  {
    "id": "tuna_steak",
    "animalId": "fish",
    "category": "steak",
    "canonicalNameEn": "Tuna Steak",
    "inputProfileId": "fish-fillet",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "rare",
      "medium_rare"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "rare",
    "confidenceLevel": "medium",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 3,
    "targetTempC": 49,
    "safetyNoteEn": "Low final temp is only appropriate for sushi-grade fish.",
    "errorEn": "Low final temp is only appropriate for sushi-grade fish.",
    "aliasesEn": [
      "tuna steak",
      "yellowfin",
      "bluefin"
    ],
    "notesEn": "Best seared outside, red center. Low final temp is only appropriate for sushi-grade fish.",
    "tipsEn": [
      "premium",
      "quick",
      "slice against the grain into 1 cm pieces"
    ],
    "criticalMistakeEn": "leaving too long and turning center dry gray",
    "cuttingDirectionEn": "slice against the grain into 1 cm pieces",
    "proTipEn": "pat dry and sear 30 to 45 seconds per side",
    "textureResultEn": "thin seared crust with cool ruby center",
    "setupVisualKeyEn": "extremely hot direct zone and no indirect stage"
  },
  {
    "id": "sea_bass_whole",
    "animalId": "fish",
    "category": "whole",
    "canonicalNameEn": "Whole Sea Bass",
    "inputProfileId": "fish-whole",
    "defaultThicknessCm": 6,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "medium",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTotalTimeMin": 24,
    "cookingMinutes": 24,
    "targetTempC": 59,
    "safetyNoteEn": "Cook until flesh flakes easily.",
    "errorEn": "Cook until flesh flakes easily.",
    "aliasesEn": [
      "sea bass",
      "branzino",
      "lubina"
    ],
    "notesEn": "Great whole grilled fish. Cook until flesh flakes easily.",
    "tipsEn": [
      "whole fish",
      "lift fillets from bone"
    ],
    "cuttingDirectionEn": "lift fillets from bone"
  },
  {
    "id": "sea_bream_whole",
    "animalId": "fish",
    "category": "whole",
    "canonicalNameEn": "Whole Sea Bream",
    "inputProfileId": "fish-whole",
    "defaultThicknessCm": 6,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "medium",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTotalTimeMin": 24,
    "cookingMinutes": 24,
    "targetTempC": 59,
    "safetyNoteEn": "Cook until flesh flakes easily.",
    "errorEn": "Cook until flesh flakes easily.",
    "aliasesEn": [
      "sea bream",
      "dorada",
      "gilt-head bream"
    ],
    "notesEn": "Mediterranean classic. Cook until flesh flakes easily.",
    "tipsEn": [
      "whole fish",
      "lift fillets from bone"
    ],
    "cuttingDirectionEn": "lift fillets from bone"
  },
  {
    "id": "turbot_whole",
    "animalId": "fish",
    "category": "whole",
    "canonicalNameEn": "Whole Turbot",
    "inputProfileId": "fish-whole",
    "defaultThicknessCm": 6,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "indirect",
    "timeType": "total",
    "defaultDoneness": "medium",
    "confidenceLevel": "low",
    "restingMinutes": 5,
    "estimatedTotalTimeMin": 35,
    "cookingMinutes": 35,
    "targetTempC": 58,
    "safetyNoteEn": "Cook until flesh releases from bone.",
    "errorEn": "Cook until flesh releases from bone.",
    "aliasesEn": [
      "turbot",
      "rodaballo",
      "piikkikampela"
    ],
    "notesEn": "Premium flatfish. Cook until flesh releases from bone.",
    "tipsEn": [
      "premium",
      "whole fish",
      "serve along fillet seams"
    ],
    "cuttingDirectionEn": "serve along fillet seams"
  },
  {
    "id": "monkfish_tail",
    "animalId": "fish",
    "category": "tail",
    "canonicalNameEn": "Monkfish Tail",
    "inputProfileId": "fish-fillet",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium",
    "confidenceLevel": "medium",
    "restingMinutes": 5,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 58,
    "safetyNoteEn": "Cook until opaque and firm.",
    "errorEn": "Cook until opaque and firm.",
    "aliasesEn": [
      "monkfish",
      "lotte",
      "rape"
    ],
    "notesEn": "Meaty texture. Cook until opaque and firm.",
    "tipsEn": [
      "premium",
      "firm",
      "crosswise medallions"
    ],
    "cuttingDirectionEn": "crosswise medallions"
  },
  {
    "id": "cod_loin",
    "animalId": "fish",
    "category": "loin",
    "canonicalNameEn": "Cod Loin",
    "inputProfileId": "fish-fillet",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "mixed",
    "timeType": "per_cm",
    "defaultDoneness": "medium",
    "confidenceLevel": "medium",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 55,
    "safetyNoteEn": "Cook gently; flakes easily.",
    "errorEn": "Cook gently; flakes easily.",
    "aliasesEn": [
      "cod loin",
      "turska"
    ],
    "notesEn": "Delicate lean fish. Cook gently; flakes easily.",
    "tipsEn": [
      "lean",
      "serve in flakes"
    ],
    "cuttingDirectionEn": "serve in flakes"
  },
  {
    "id": "halibut_steak",
    "animalId": "fish",
    "category": "steak",
    "canonicalNameEn": "Halibut Steak",
    "inputProfileId": "fish-fillet",
    "defaultThicknessCm": 3,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium",
    "confidenceLevel": "medium",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 5,
    "targetTempC": 55,
    "safetyNoteEn": "Do not overcook lean fish.",
    "errorEn": "Do not overcook lean fish.",
    "aliasesEn": [
      "halibut",
      "pallas"
    ],
    "notesEn": "Lean and firm. Do not overcook lean fish.",
    "tipsEn": [
      "premium",
      "lean",
      "against grain if portioned"
    ],
    "cuttingDirectionEn": "against grain if portioned"
  },
  {
    "id": "swordfish_steak",
    "animalId": "fish",
    "category": "steak",
    "canonicalNameEn": "Swordfish Steak",
    "inputProfileId": "fish-fillet",
    "defaultThicknessCm": 2,
    "showThickness": true,
    "allowedMethods": [
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_direct",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "direct",
    "timeType": "per_cm",
    "defaultDoneness": "medium",
    "confidenceLevel": "medium",
    "restingMinutes": 3,
    "estimatedTimeMinPerCm": 4,
    "targetTempC": 58,
    "safetyNoteEn": "Cook to firm opaque texture.",
    "errorEn": "Cook to firm opaque texture.",
    "aliasesEn": [
      "swordfish",
      "emperador"
    ],
    "notesEn": "Meaty fish steak. Cook to firm opaque texture.",
    "tipsEn": [
      "firm",
      "quick",
      "against the grain"
    ],
    "cuttingDirectionEn": "against the grain"
  },
  {
    "id": "kingfish_beryx",
    "animalId": "fish",
    "category": "whole",
    "canonicalNameEn": "Alfonsino / Beryx",
    "inputProfileId": "fish-whole",
    "defaultThicknessCm": 6,
    "showThickness": false,
    "allowedMethods": [
      "grill_indirect",
      "grill_direct",
      "oven_pan"
    ],
    "defaultMethod": "grill_indirect",
    "allowedDoneness": [
      "medium"
    ],
    "style": "fish",
    "cookingStyle": "fish",
    "fireZone": "mixed",
    "timeType": "total",
    "defaultDoneness": "medium",
    "confidenceLevel": "low",
    "restingMinutes": 5,
    "estimatedTotalTimeMin": 27,
    "cookingMinutes": 27,
    "targetTempC": 58,
    "safetyNoteEn": "Cook until opaque and flaky; exact market name varies.",
    "errorEn": "Cook until opaque and flaky; exact market name varies.",
    "aliasesEn": [
      "virrey",
      "Beryx decadactylus",
      "alfonsino",
      "red bream"
    ],
    "notesEn": "Virrey added as requested; scientific name Beryx decadactylus. Cook until opaque and flaky; exact market name varies.",
    "tipsEn": [
      "premium",
      "whole fish",
      "lift fillets then portion across grain lines"
    ],
    "criticalMistakeEn": "treating it like lean fish and overcooking the loin",
    "cuttingDirectionEn": "lift fillets then portion across grain lines",
    "proTipEn": "pull when opaque edges move halfway inward",
    "textureResultEn": "delicate flaky flesh with juicy center near spine",
    "setupVisualKeyEn": "whole fish basket or plancha over moderate heat"
  },
  {
    "id": "corn_on_cob",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Corn on the Cob",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "mixed",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 2,
    "estimatedTotalTimeMin": 14,
    "cookingMinutes": 14,
    "errorEn": "Turn often.",
    "aliasesEn": [
      "corn",
      "sweet corn",
      "choclo"
    ],
    "notesEn": "Turn often.",
    "tipsEn": [
      "quick",
      "easy",
      "not applicable"
    ],
    "cuttingDirectionEn": "not applicable"
  },
  {
    "id": "eggplant_slices",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Eggplant Slices",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "direct",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 2,
    "estimatedTotalTimeMin": 11,
    "cookingMinutes": 11,
    "errorEn": "Salt beforehand if desired.",
    "aliasesEn": [
      "eggplant",
      "aubergine",
      "munakoiso"
    ],
    "notesEn": "Salt beforehand if desired.",
    "tipsEn": [
      "vegetarian",
      "quick",
      "slice lengthwise or rounds"
    ],
    "cuttingDirectionEn": "slice lengthwise or rounds"
  },
  {
    "id": "asparagus",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Asparagus",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "direct",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 1,
    "estimatedTotalTimeMin": 7,
    "cookingMinutes": 7,
    "errorEn": "Fast cooking.",
    "aliasesEn": [
      "asparagus",
      "parsa"
    ],
    "notesEn": "Fast cooking.",
    "tipsEn": [
      "quick",
      "easy",
      "no slicing needed trim woody ends"
    ],
    "criticalMistakeEn": "skipping oil and salt then drying before browning",
    "cuttingDirectionEn": "no slicing needed trim woody ends",
    "proTipEn": "light oil coat and roll every 20 to 30 seconds",
    "textureResultEn": "tender crisp stalks with charred tips",
    "setupVisualKeyEn": "hot direct zone with fine grate or perforated tray"
  },
  {
    "id": "bell_peppers",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Bell Peppers",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "direct",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 2,
    "estimatedTotalTimeMin": 12,
    "cookingMinutes": 12,
    "errorEn": "Can peel after charring.",
    "aliasesEn": [
      "bell pepper",
      "capsicum",
      "morrón"
    ],
    "notesEn": "Can peel after charring.",
    "tipsEn": [
      "quick",
      "easy",
      "slice strips after cooking"
    ],
    "cuttingDirectionEn": "slice strips after cooking"
  },
  {
    "id": "potato_halves",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Potato Halves",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "indirect",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 3,
    "estimatedTotalTimeMin": 30,
    "cookingMinutes": 30,
    "errorEn": "Parboiling improves result.",
    "aliasesEn": [
      "potato",
      "papa",
      "peruna"
    ],
    "notesEn": "Parboiling improves result.",
    "tipsEn": [
      "side",
      "family",
      "halve lengthwise before parboil"
    ],
    "criticalMistakeEn": "grilling raw halves and leaving centers undercooked",
    "cuttingDirectionEn": "halve lengthwise before parboil",
    "proTipEn": "parboil then steam dry before cut side sear",
    "textureResultEn": "crisp crust with fluffy interior",
    "setupVisualKeyEn": "indirect preheat zone and direct browning zone"
  },
  {
    "id": "mushrooms",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Mushrooms",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "direct",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 2,
    "estimatedTotalTimeMin": 9,
    "cookingMinutes": 9,
    "errorEn": "Avoid overcrowding.",
    "aliasesEn": [
      "mushrooms",
      "champignons",
      "sieni"
    ],
    "notesEn": "Avoid overcrowding.",
    "tipsEn": [
      "quick",
      "easy",
      "not applicable"
    ],
    "cuttingDirectionEn": "not applicable"
  },
  {
    "id": "onion_halves",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Onion Halves",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "mixed",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 2,
    "estimatedTotalTimeMin": 19,
    "cookingMinutes": 19,
    "errorEn": "Keep root for structure.",
    "aliasesEn": [
      "onion",
      "sipuli"
    ],
    "notesEn": "Keep root for structure.",
    "tipsEn": [
      "side",
      "easy",
      "halve through root"
    ],
    "cuttingDirectionEn": "halve through root"
  },
  {
    "id": "carrots",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Carrots",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "direct",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 2,
    "estimatedTotalTimeMin": 15,
    "cookingMinutes": 15,
    "errorEn": "Glaze works well.",
    "aliasesEn": [
      "carrot",
      "porkkana"
    ],
    "notesEn": "Glaze works well.",
    "tipsEn": [
      "side",
      "lengthwise halves"
    ],
    "cuttingDirectionEn": "lengthwise halves"
  },
  {
    "id": "zucchini",
    "animalId": "vegetables",
    "category": "vegetable",
    "canonicalNameEn": "Zucchini",
    "inputProfileId": "vegetable-format",
    "defaultThicknessCm": 2,
    "showThickness": false,
    "allowedMethods": [
      "vegetables_grill"
    ],
    "defaultMethod": "vegetables_grill",
    "allowedDoneness": [],
    "style": "vegetable",
    "cookingStyle": "vegetable",
    "fireZone": "direct",
    "timeType": "total",
    "confidenceLevel": "medium",
    "restingMinutes": 1,
    "estimatedTotalTimeMin": 8,
    "cookingMinutes": 8,
    "errorEn": "Do not overcook.",
    "aliasesEn": [
      "zucchini",
      "courgette",
      "kesäkurpitsa"
    ],
    "notesEn": "Do not overcook.",
    "tipsEn": [
      "quick",
      "easy",
      "lengthwise slices"
    ],
    "cuttingDirectionEn": "lengthwise slices"
  }
] satisfies GeneratedCutProfile[];

export const generatedCutProfilesById: Record<string, GeneratedCutProfile> = Object.fromEntries(
  generatedCutProfiles.map((profile) => [profile.id, profile]),
);

export function getGeneratedCutProfile(id: string): GeneratedCutProfile | undefined {
  return generatedCutProfilesById[id];
}
