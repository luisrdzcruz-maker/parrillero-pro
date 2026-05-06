import { generateCookingPlan, getCutForInput, type CookingInput } from "@/lib/cookingEngine";
import { getPlanPlanningMetadata } from "@/lib/cooking/planningMetadata";
import { singleCutPlanToPlannerInput } from "./adapters/cookingCatalogAdapter";
import type { PlannerCutInput } from "./types";

type CatalogCandidate = {
  id: string;
  animal: string;
  cut: string;
  doneness: string;
  thicknessCm: string;
  weightGrams: number;
  priority: number;
};

export type CatalogBackedItemSkip = {
  candidateId: string;
  reason: string;
};

export type CatalogBackedItemBuildResult = {
  items: PlannerCutInput[];
  skipped: CatalogBackedItemSkip[];
};

const PARRILLADA_CATALOG_CANDIDATES: CatalogCandidate[] = [
  { id: "ribeye", animal: "Beef", cut: "ribeye", doneness: "medium_rare", thicknessCm: "3", weightGrams: 500, priority: 5 },
  { id: "bone_in_ribeye", animal: "Beef", cut: "bone_in_ribeye", doneness: "medium_rare", thicknessCm: "5", weightGrams: 1000, priority: 5 },
  { id: "picanha", animal: "Beef", cut: "picanha", doneness: "medium_rare", thicknessCm: "4", weightGrams: 950, priority: 5 },
  { id: "iberian_secreto", animal: "Pork", cut: "iberian_secreto", doneness: "medium_safe", thicknessCm: "2", weightGrams: 450, priority: 4 },
  { id: "chicken_wing", animal: "Chicken", cut: "chicken_wing", doneness: "safe", thicknessCm: "2", weightGrams: 800, priority: 3 },
  { id: "salmon", animal: "Fish", cut: "salmon", doneness: "medium", thicknessCm: "3", weightGrams: 450, priority: 3 },
  { id: "asparagus", animal: "Verduras", cut: "asparagus", doneness: "juicy", thicknessCm: "2", weightGrams: 300, priority: 1 },
  { id: "corn_on_cob", animal: "Verduras", cut: "corn_on_cob", doneness: "juicy", thicknessCm: "3", weightGrams: 350, priority: 1 },
  { id: "pork_tenderloin", animal: "Pork", cut: "pork_tenderloin", doneness: "medium_safe", thicknessCm: "3", weightGrams: 650, priority: 4 },
  { id: "pork_chop", animal: "Pork", cut: "pork_chop", doneness: "medium_safe", thicknessCm: "3", weightGrams: 500, priority: 4 },
  { id: "sausages", animal: "Pork", cut: "sausages", doneness: "safe", thicknessCm: "2", weightGrams: 650, priority: 2 },
  { id: "chorizo_criollo", animal: "Pork", cut: "chorizo_criollo", doneness: "safe", thicknessCm: "2", weightGrams: 650, priority: 2 },
];

function makeInput(candidate: CatalogCandidate): CookingInput {
  return {
    animal: candidate.animal,
    cut: candidate.cut,
    doneness: candidate.doneness,
    thicknessCm: candidate.thicknessCm,
    weightKg: "1",
    equipment: "parrilla gas",
    language: "es",
  };
}

export function buildCatalogBackedParrilladaLiteItems(): CatalogBackedItemBuildResult {
  const items: PlannerCutInput[] = [];
  const skipped: CatalogBackedItemSkip[] = [];

  for (const candidate of PARRILLADA_CATALOG_CANDIDATES) {
    const input = makeInput(candidate);
    const plan = generateCookingPlan(input);
    if (!plan) {
      skipped.push({ candidateId: candidate.id, reason: "single-cut plan generation failed" });
      continue;
    }

    const cut = getCutForInput(input);
    if (!cut) {
      skipped.push({ candidateId: candidate.id, reason: "single-cut cut resolution failed" });
      continue;
    }

    const metadata = getPlanPlanningMetadata(plan);
    const plannerItem = singleCutPlanToPlannerInput({
      id: `catalog-${candidate.id}`,
      cut,
      plan,
      thicknessCm: Number(candidate.thicknessCm),
      weightGrams: candidate.weightGrams,
      priority: candidate.priority,
    });

    if (!metadata) {
      plannerItem.notes = [...(plannerItem.notes ?? []), "fallback: planningMetadata missing"];
    }

    items.push(plannerItem);
  }

  const uniqueItems = items.filter(
    (item, index, all) => all.findIndex((candidate) => candidate.cutId === item.cutId) === index,
  );
  return { items: uniqueItems, skipped };
}

