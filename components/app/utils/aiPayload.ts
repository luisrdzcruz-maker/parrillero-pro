import type { PlanMode } from "@/components/planning/PlanHub";
import type { Lang } from "@/lib/i18n/texts";
import type { AnimalLabel } from "@/lib/media/animalMedia";

import { engineLang } from "./i18n";

export type CookingPlanPromptArgs = {
  animal: AnimalLabel;
  cutName: string;
  resolvedWeightKg: string;
  resolvedThicknessCm: string;
  isVegetableCut: boolean;
  vegetableFormat: string;
  doneness: string;
  equipment: string;
  lang: Lang;
};

export function buildCookingPlanPrompt(args: CookingPlanPromptArgs): string {
  return `
Language: ${engineLang(args.lang) === "es" ? "Spanish" : "English"}.
Animal: ${args.animal}
Cut: ${args.cutName}
Weight: ${args.resolvedWeightKg} kg
Thickness: ${args.resolvedThicknessCm} cm
Format: ${args.isVegetableCut ? args.vegetableFormat : "not relevant"}
Doneness: ${args.doneness}
Equipment: ${args.equipment}

Return exact block titles:
SETUP
TIEMPOS
TEMPERATURA
PASOS
ERROR
`;
}

export type MenuPromptArgs = {
  people: string;
  eventType: string;
  menuMeats: string;
  sides: string;
  budget: string;
  difficulty: string;
  equipment: string;
  lang: Lang;
};

export function buildMenuPrompt(args: MenuPromptArgs): string {
  return `
Language: ${engineLang(args.lang) === "es" ? "Spanish" : "English"}.

Personas / People: ${args.people}
Tipo de evento / Event type: ${args.eventType}
Carnes/productos / Products: ${args.menuMeats}
Acompañamientos / Sides: ${args.sides}
Presupuesto / Budget: ${args.budget} €
Nivel / Difficulty: ${args.difficulty}
Equipo / Equipment: ${args.equipment}

If Spanish:
MENU
CANTIDADES
TIMING
ORDEN
COMPRA
ERROR

If English:
MENU
QUANTITIES
TIMING
ORDER
SHOPPING
ERROR
`;
}

export type PlanPromptArgs = {
  planMode: PlanMode;
  people: string;
  eventType: string;
  productInput: string;
  sidesInput: string;
  budget: string;
  difficultyInput: string;
  equipment: string;
  lang: Lang;
};

export function buildPlanPrompt(args: PlanPromptArgs): string {
  return `
Language: ${engineLang(args.lang) === "es" ? "Spanish" : "English"}.

Plan mode: ${args.planMode}
Personas / People: ${args.people}
Tipo de evento / Event type: ${args.planMode === "rapido" ? "plan rápido" : args.eventType}
Carnes/productos / Products: ${args.productInput}
Acompañamientos / Sides: ${args.sidesInput}
Presupuesto / Budget: ${args.budget} €
Nivel / Difficulty: ${args.difficultyInput}
Equipo / Equipment: ${args.equipment}

If Spanish:
MENU
CANTIDADES
TIMING
ORDEN
COMPRA
ERROR

If English:
MENU
QUANTITIES
TIMING
ORDER
SHOPPING
ERROR
`;
}
