/**
 * Performance benchmark for the local cooking engine (no API).
 * Run: npx tsx scripts/cooking-benchmark.ts
 *
 * Dataset matches scripts/cooking-engine-qa.ts (full catalog grid).
 */

import { performance } from "node:perf_hooks";

import { animalCatalog, type AnimalId, type CookingInput } from "../lib/cookingCatalog";
import { generateCookingPlan, generateCookingSteps, getCutsByAnimal, getDonenessOptions } from "../lib/cookingEngine";

const THICKNESS_CM = { thin: "2", medium: "5", thick: "8" } as const;
const EQUIPMENT = ["parrilla gas", "parrilla carbón", "kamado", "cocina interior"] as const;
const LANGUAGE: "es" = "es";
const WEIGHT_KG = "1";

function donenessListForAnimal(animalId: AnimalId): string[] {
  const options = getDonenessOptions(animalId);
  if (options.length > 0) return options.map((d) => d.id);
  return ["medium"];
}

function buildInput(
  animalLabel: string,
  cutId: string,
  thickness: string,
  doneness: string,
  equipment: string,
): CookingInput {
  return {
    animal: animalLabel,
    cut: cutId,
    weightKg: WEIGHT_KG,
    thicknessCm: thickness,
    doneness,
    equipment,
    language: LANGUAGE,
  };
}

function main() {
  let n = 0;
  let sumPlanMs = 0;
  let sumStepsMs = 0;

  const tFullStart = performance.now();
  for (const animal of animalCatalog) {
    const animalLabel = animal.names.es;
    for (const cut of getCutsByAnimal(animal.id)) {
      for (const doneness of donenessListForAnimal(animal.id)) {
        for (const thickness of Object.values(THICKNESS_CM)) {
          for (const equipment of EQUIPMENT) {
            n += 1;
            const input = buildInput(animalLabel, cut.id, thickness, doneness, equipment);

            const t0 = performance.now();
            generateCookingPlan(input);
            sumPlanMs += performance.now() - t0;

            const t1 = performance.now();
            generateCookingSteps(input);
            sumStepsMs += performance.now() - t1;
          }
        }
      }
    }
  }
  const totalFullDatasetMs = performance.now() - tFullStart;

  const avgPlanMs = n > 0 ? sumPlanMs / n : 0;
  const avgStepsMs = n > 0 ? sumStepsMs / n : 0;

  console.log("Cooking engine benchmark");
  console.log("========================");
  console.log(`Combinations:              ${n}`);
  console.log("");
  console.log(`Avg generateCookingPlan:   ${avgPlanMs.toFixed(4)} ms`);
  console.log(`Avg generateCookingSteps:  ${avgStepsMs.toFixed(4)} ms`);
  console.log("");
  console.log(`Total (full dataset):      ${totalFullDatasetMs.toFixed(2)} ms`);
  console.log(`  (sum of all plan calls):  ${sumPlanMs.toFixed(2)} ms`);
  console.log(`  (sum of all steps calls): ${sumStepsMs.toFixed(2)} ms`);
  console.log(`  (sum plan + sum steps):   ${(sumPlanMs + sumStepsMs).toFixed(2)} ms`);
}

main();
