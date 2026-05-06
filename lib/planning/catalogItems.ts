import { generateCookingPlan, getCutForInput, type CookingInput } from "@/lib/cookingEngine";
import { getPlanPlanningMetadata } from "@/lib/cooking/planningMetadata";
import { singleCutPlanToPlannerInput } from "./adapters/cookingCatalogAdapter";
import type { PlannerCutInput } from "./types";

export type CatalogCandidate = {
  id: string;
  animal: string;
  cut: string;
  doneness: string;
  thicknessCm: string;
  weightGrams: number;
  priority: number;
  tier?: "standard" | "advanced";
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
  { id: "striploin", animal: "Beef", cut: "striploin", doneness: "medium_rare", thicknessCm: "3", weightGrams: 520, priority: 4 },
  { id: "tenderloin", animal: "Beef", cut: "tenderloin", doneness: "medium_rare", thicknessCm: "3", weightGrams: 450, priority: 4 },
  { id: "skirt_steak", animal: "Beef", cut: "skirt_steak", doneness: "medium_rare", thicknessCm: "2", weightGrams: 550, priority: 4 },
  { id: "flank_steak", animal: "Beef", cut: "flank_steak", doneness: "medium_rare", thicknessCm: "2", weightGrams: 650, priority: 4 },
  { id: "t_bone", animal: "Beef", cut: "t_bone", doneness: "medium_rare", thicknessCm: "4", weightGrams: 800, priority: 5 },
  { id: "tomahawk", animal: "Beef", cut: "tomahawk", doneness: "medium_rare", thicknessCm: "6", weightGrams: 1200, priority: 5 },
  { id: "iberian_secreto", animal: "Pork", cut: "iberian_secreto", doneness: "medium_safe", thicknessCm: "2", weightGrams: 450, priority: 4 },
  { id: "pork_loin", animal: "Pork", cut: "pork_loin", doneness: "medium_safe", thicknessCm: "3", weightGrams: 800, priority: 4 },
  { id: "iberian_presa", animal: "Pork", cut: "iberian_presa", doneness: "medium_safe", thicknessCm: "3", weightGrams: 650, priority: 4 },
  { id: "pork_collar", animal: "Pork", cut: "pork_collar", doneness: "medium_safe", thicknessCm: "4", weightGrams: 850, priority: 4 },
  { id: "chicken_breast", animal: "Chicken", cut: "chicken_breast", doneness: "safe", thicknessCm: "3", weightGrams: 600, priority: 3 },
  { id: "chicken_drumstick", animal: "Chicken", cut: "chicken_drumstick", doneness: "safe", thicknessCm: "3", weightGrams: 900, priority: 3 },
  { id: "chicken_leg_quarter", animal: "Chicken", cut: "chicken_leg_quarter", doneness: "safe", thicknessCm: "4", weightGrams: 1000, priority: 3 },
  { id: "chicken_wing", animal: "Chicken", cut: "chicken_wing", doneness: "safe", thicknessCm: "2", weightGrams: 800, priority: 3 },
  { id: "whole_chicken", animal: "Chicken", cut: "whole_chicken", doneness: "safe", thicknessCm: "8", weightGrams: 1700, priority: 4 },
  { id: "spatchcock_chicken", animal: "Chicken", cut: "spatchcock_chicken", doneness: "safe", thicknessCm: "4", weightGrams: 1400, priority: 4 },
  { id: "salmon", animal: "Fish", cut: "salmon", doneness: "medium", thicknessCm: "3", weightGrams: 450, priority: 3 },
  { id: "asparagus", animal: "Verduras", cut: "asparagus", doneness: "juicy", thicknessCm: "2", weightGrams: 300, priority: 1 },
  { id: "corn_on_cob", animal: "Verduras", cut: "corn_on_cob", doneness: "juicy", thicknessCm: "3", weightGrams: 350, priority: 1 },
  { id: "potato_halves", animal: "Verduras", cut: "potato_halves", doneness: "juicy", thicknessCm: "3", weightGrams: 700, priority: 1 },
  { id: "mushrooms", animal: "Verduras", cut: "mushrooms", doneness: "juicy", thicknessCm: "2", weightGrams: 350, priority: 1 },
  { id: "bell_peppers", animal: "Verduras", cut: "bell_peppers", doneness: "juicy", thicknessCm: "2", weightGrams: 450, priority: 1 },
  { id: "eggplant_slices", animal: "Verduras", cut: "eggplant_slices", doneness: "juicy", thicknessCm: "2", weightGrams: 500, priority: 1 },
  { id: "pork_tenderloin", animal: "Pork", cut: "pork_tenderloin", doneness: "medium_safe", thicknessCm: "3", weightGrams: 650, priority: 4 },
  { id: "pork_chop", animal: "Pork", cut: "pork_chop", doneness: "medium_safe", thicknessCm: "3", weightGrams: 500, priority: 4 },
  { id: "sausages", animal: "Pork", cut: "sausages", doneness: "safe", thicknessCm: "2", weightGrams: 650, priority: 2 },
  { id: "chorizo_criollo", animal: "Pork", cut: "chorizo_criollo", doneness: "safe", thicknessCm: "2", weightGrams: 650, priority: 2 },
  { id: "brisket", animal: "Beef", cut: "brisket", doneness: "medium", thicknessCm: "8", weightGrams: 2600, priority: 3, tier: "advanced" },
  { id: "short_ribs", animal: "Beef", cut: "short_ribs", doneness: "medium", thicknessCm: "5", weightGrams: 1600, priority: 3, tier: "advanced" },
  { id: "baby_back_ribs", animal: "Pork", cut: "baby_back_ribs", doneness: "medium_safe", thicknessCm: "4", weightGrams: 1400, priority: 3, tier: "advanced" },
  { id: "spare_ribs", animal: "Pork", cut: "spare_ribs", doneness: "medium_safe", thicknessCm: "5", weightGrams: 1800, priority: 3, tier: "advanced" },
  { id: "pork_belly", animal: "Pork", cut: "pork_belly", doneness: "medium_safe", thicknessCm: "4", weightGrams: 1400, priority: 3, tier: "advanced" },
  { id: "pork_belly_slices", animal: "Pork", cut: "pork_belly_slices", doneness: "medium_safe", thicknessCm: "2", weightGrams: 850, priority: 2, tier: "advanced" },
  { id: "chuck_roast", animal: "Beef", cut: "chuck_roast", doneness: "medium", thicknessCm: "6", weightGrams: 2200, priority: 3, tier: "advanced" },
];

export function getParrilladaCatalogCandidates(): readonly CatalogCandidate[] {
  return PARRILLADA_CATALOG_CANDIDATES;
}

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
    if (cut.id !== candidate.cut) {
      skipped.push({
        candidateId: candidate.id,
        reason: `resolved cut mismatch (${cut.id})`,
      });
      continue;
    }

    const metadata = getPlanPlanningMetadata(plan);
    if (candidate.tier === "advanced") {
      if (!metadata) {
        skipped.push({ candidateId: candidate.id, reason: "advanced item missing planningMetadata" });
        continue;
      }
      if (metadata.source !== "single-cut-engine" || metadata.confidence !== "high") {
        skipped.push({
          candidateId: candidate.id,
          reason: `advanced item metadata not safe (${metadata.source}/${metadata.confidence})`,
        });
        continue;
      }
      if (metadata.totalSessionMinutes < 90) {
        skipped.push({
          candidateId: candidate.id,
          reason: `advanced item session too short (${metadata.totalSessionMinutes}m)`,
        });
        continue;
      }
    }

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

