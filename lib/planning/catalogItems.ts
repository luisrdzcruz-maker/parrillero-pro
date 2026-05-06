import { generateCookingPlan, getCutForInput, type CookingInput } from "@/lib/cookingEngine";
import { getPlanPlanningMetadata } from "@/lib/cooking/planningMetadata";
import { singleCutPlanToPlannerInput } from "./adapters/cookingCatalogAdapter";
import { NAPOLEON_ROGUE_525_LITE } from "./fixtures/demoGrills";
import { scheduleParrillada } from "./scheduler";
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

const ADVANCED_MIN_SESSION_MINUTES = 90;
const ADVANCED_MAX_SESSION_MINUTES = 720;
const ADVANCED_SANITY_SERVE_AT_ISO = "2030-05-01T18:00:00.000Z";
const ADVANCED_SANITY_NOW_ISO = "2030-05-01T12:00:00.000Z";
const ADVANCED_SAFETY_GATE_CUT_IDS = new Set([
  "brisket",
  "short_ribs",
  "baby_back_ribs",
  "spare_ribs",
  "pork_belly",
  "chuck_roast",
  "whole_chicken",
]);

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
  { id: "pork_belly_slices", animal: "Pork", cut: "pork_belly_slices", doneness: "medium_safe", thicknessCm: "2", weightGrams: 850, priority: 2 },
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

function isSortedByStartMinute(phases: ReturnType<typeof scheduleParrillada>["phases"]): boolean {
  for (let i = 1; i < phases.length; i += 1) {
    const prev = phases[i - 1];
    const curr = phases[i];
    if (curr.startMinute < prev.startMinute) return false;
    if (curr.startMinute === prev.startMinute && curr.endMinute < prev.endMinute) return false;
  }
  return true;
}

function buildAdvancedSaneCompanion(itemCutId: string): PlannerCutInput {
  return {
    id: `advanced-sanity-companion-${itemCutId}`,
    cutId: "asparagus",
    displayName: "Asparagus",
    animal: "vegetable",
    weightGrams: 320,
    thicknessCm: 2,
    priority: 1,
  };
}

function validateAdvancedTimeline(item: PlannerCutInput): string | null {
  const sanityPlan = scheduleParrillada({
    items: [item, buildAdvancedSaneCompanion(item.cutId)],
    serveAtIso: ADVANCED_SANITY_SERVE_AT_ISO,
    nowIso: ADVANCED_SANITY_NOW_ISO,
    strategy: "balanced",
    grillCapacity: NAPOLEON_ROGUE_525_LITE,
    allowHolding: true,
    maxPlanLookbackMinutes: 720,
  });
  if (sanityPlan.phases.length === 0) return "timeline has no actions";
  if (!isSortedByStartMinute(sanityPlan.phases)) return "timeline ordering invalid";
  const firstCook = sanityPlan.phases.find((phase) => phase.type === "cook" || phase.type === "sear");
  if (!firstCook) return "timeline missing cook/sear phases";
  const servePhases = sanityPlan.phases.filter((phase) => phase.type === "serve");
  if (servePhases.length === 0) return "timeline missing serve phases";
  const serveAtMs = new Date(ADVANCED_SANITY_SERVE_AT_ISO).getTime();
  const maxServeDelta = Math.max(
    ...servePhases.map((phase) => Math.abs(Math.round((new Date(phase.startIso).getTime() - serveAtMs) / 60000))),
  );
  if (maxServeDelta > 5) return `serve drift too high (${maxServeDelta}m)`;
  return null;
}

function validateAdvancedCutSafety(item: PlannerCutInput): string | null {
  const metadata = item.planningMetadata;
  if (!metadata) return "advanced item missing planningMetadata";
  if (metadata.source !== "single-cut-engine") {
    return `advanced item metadata source not safe (${metadata.source})`;
  }
  if (metadata.confidence !== "high") {
    return `advanced item confidence not safe (${metadata.confidence})`;
  }
  if (metadata.totalSessionMinutes < ADVANCED_MIN_SESSION_MINUTES) {
    return `advanced item session too short (${metadata.totalSessionMinutes}m)`;
  }
  if (metadata.totalSessionMinutes > ADVANCED_MAX_SESSION_MINUTES) {
    return `advanced item session too long (${metadata.totalSessionMinutes}m)`;
  }
  if (metadata.requiredZones.length === 0 && metadata.preferredZones.length === 0) {
    return "advanced item metadata has no usable zones";
  }
  const timelineIssue = validateAdvancedTimeline(item);
  if (timelineIssue) return `advanced item timeline not sane (${timelineIssue})`;
  return null;
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

    const requiresAdvancedGate = ADVANCED_SAFETY_GATE_CUT_IDS.has(candidate.cut);
    if (requiresAdvancedGate) {
      const unsafeReason = validateAdvancedCutSafety(plannerItem);
      if (unsafeReason) {
        skipped.push({ candidateId: candidate.id, reason: unsafeReason });
        continue;
      }
    }

    items.push(plannerItem);
  }

  const uniqueItems = items.filter(
    (item, index, all) => all.findIndex((candidate) => candidate.cutId === item.cutId) === index,
  );
  return { items: uniqueItems, skipped };
}

