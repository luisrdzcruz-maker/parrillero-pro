import type { PlanMode } from "@/components/planning/PlanHub";
import type { Mode } from "@/components/navigation/AppHeader";
import type { SavedMenuType } from "@/components/results/CookingResultScreen";
import type { Lang } from "@/lib/i18n/texts";
import type { AnimalLabel } from "@/lib/media/animalMedia";

import { localeForLang } from "./i18n";
import { parsePositiveInt } from "./text";

export type SavedMenuInputs =
  | {
      animal: AnimalLabel;
      cut: string;
      cutName: string;
      weight: string;
      thickness: string;
      doneness: string;
      equipment: string;
    }
  | {
      parrilladaPeople: string;
      serveTime: string;
      parrilladaProducts: string;
      parrilladaSides: string;
      equipment: string;
    }
  | {
      people: string;
      eventType: string;
      planMode: PlanMode;
      products: string;
      menuMeats: string;
      sides: string;
      budget: string;
      difficulty: string;
      equipment: string;
    };

export type SavedMenuPayload = {
  savedType: SavedMenuType;
  menuName: string;
  peopleValue: number | null;
  inputs: SavedMenuInputs;
};

export type BuildSavedMenuPayloadArgs = {
  mode: Mode;
  planMode: PlanMode;
  animal: AnimalLabel;
  cut: string;
  cutName: string;
  weight: string;
  thickness: string;
  doneness: string;
  equipment: string;
  parrilladaPeople: string;
  serveTime: string;
  parrilladaProducts: string;
  parrilladaSides: string;
  people: string;
  eventType: string;
  menuMeats: string;
  sides: string;
  budget: string;
  difficulty: string;
  planProduct: string;
  lang: Lang;
  now: Date;
};

export function buildSavedMenuPayload(args: BuildSavedMenuPayloadArgs): SavedMenuPayload {
  const dateLabel = args.now.toLocaleDateString(localeForLang(args.lang));
  const savedType: SavedMenuType =
    args.mode === "coccion"
      ? "cooking_plan"
      : args.mode === "parrillada" || (args.mode === "plan" && args.planMode === "evento")
        ? "parrillada_plan"
        : "generated_menu";

  const menuName =
    savedType === "cooking_plan"
      ? `Cocción - ${args.animal} ${args.cutName} - ${dateLabel}`
      : savedType === "parrillada_plan"
        ? `Parrillada - ${args.parrilladaPeople} personas - ${dateLabel}`
        : `Menú BBQ - ${args.people} personas - ${dateLabel}`;

  const peopleValue =
    savedType === "cooking_plan"
      ? null
      : parsePositiveInt(savedType === "parrillada_plan" ? args.parrilladaPeople : args.people);

  const planProducts = args.planMode === "rapido" ? args.planProduct : args.menuMeats;

  const inputs: SavedMenuInputs =
    savedType === "cooking_plan"
      ? {
          animal: args.animal,
          cut: args.cut,
          cutName: args.cutName,
          weight: args.weight,
          thickness: args.thickness,
          doneness: args.doneness,
          equipment: args.equipment,
        }
      : savedType === "parrillada_plan"
        ? {
            parrilladaPeople: args.parrilladaPeople,
            serveTime: args.serveTime,
            parrilladaProducts: args.parrilladaProducts,
            parrilladaSides: args.parrilladaSides,
            equipment: args.equipment,
          }
        : {
            people: args.people,
            eventType: args.eventType,
            planMode: args.planMode,
            products: planProducts,
            menuMeats: planProducts,
            sides: args.planMode === "rapido" ? "guarnición simple" : args.sides,
            budget: args.budget,
            difficulty: args.planMode === "rapido" ? "fácil" : args.difficulty,
            equipment: args.equipment,
          };

  return {
    savedType,
    menuName,
    peopleValue,
    inputs,
  };
}
