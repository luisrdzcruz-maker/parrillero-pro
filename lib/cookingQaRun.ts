import { animalCatalog, type AnimalId, type CookingInput } from "./cookingCatalog";
import {
  generateCookingPlan,
  generateCookingSteps,
  getCutForInput,
  getCutsByAnimal,
  getDonenessOptions,
} from "./cookingEngine";
import { computeCookingQualityScore } from "./cookingQualityScore";
import { validateCookingEngineOutput } from "./cookingOutputValidation";

const THICKNESS_CM = { thin: "2", medium: "5", thick: "8" } as const;
const EQUIPMENT = ["parrilla gas", "parrilla carbón", "kamado", "cocina interior"] as const;
const LANGUAGE = "es" as const;
const WEIGHT_KG = "1";

const PASS_SCORE_MIN = 50;

export type CookingQaFailure = {
  animal: string;
  cut: string;
  doneness: string;
  thickness: number;
  equipment: string;
  error: string;
  score: number;
};

export type CookingQaResult = {
  total: number;
  passed: number;
  failed: number;
  avgScore: number;
  failures: CookingQaFailure[];
};

function donenessListForAnimal(animalId: AnimalId): string[] {
  const options = getDonenessOptions(animalId);
  if (options.length > 0) return options.map((d) => d.id);
  return ["medium"];
}

function thicknessToNumber(s: string): number {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Full-grid local QA: same matrix as `scripts/cooking-engine-qa.ts` + validation + quality score.
 * Does not call OpenAI or modify the engine.
 */
export function runCookingQA(): CookingQaResult {
  const failures: CookingQaFailure[] = [];
  let total = 0;
  let passCount = 0;
  let scoreAcc = 0;

  for (const animal of animalCatalog) {
    const animalLabel = animal.names.es;
    for (const co of getCutsByAnimal(animal.id)) {
      for (const doneness of donenessListForAnimal(animal.id)) {
        for (const th of Object.values(THICKNESS_CM)) {
          for (const equipment of EQUIPMENT) {
            total += 1;
            const input: CookingInput = {
              animal: animalLabel,
              cut: co.id,
              weightKg: WEIGHT_KG,
              thicknessCm: th,
              doneness,
              equipment,
              language: LANGUAGE,
            };

            const cut = getCutForInput(input);
            if (!cut) {
              failures.push({
                animal: animalLabel,
                cut: co.id,
                doneness,
                thickness: thicknessToNumber(th),
                equipment,
                error: "Catalog mismatch (animal / cut)",
                score: 0,
              });
              continue;
            }

            const plan = generateCookingPlan(input);
            const steps = generateCookingSteps(input);
            const v = validateCookingEngineOutput(plan, steps, { input });
            const score = computeCookingQualityScore(input, plan, steps, cut);
            scoreAcc += score;

            const validationOk = v.ok;
            const scoreOk = score >= PASS_SCORE_MIN;
            if (validationOk && scoreOk) {
              passCount += 1;
            } else {
              let error: string;
              if (!validationOk) {
                error = v.warnings.map((w) => w.message).join(" · ");
              } else {
                error = `Quality score below threshold (${score} < ${PASS_SCORE_MIN})`;
              }
              failures.push({
                animal: animalLabel,
                cut: co.id,
                doneness,
                thickness: thicknessToNumber(th),
                equipment,
                error,
                score,
              });
            }
          }
        }
      }
    }
  }

  return {
    total,
    passed: passCount,
    failed: total - passCount,
    avgScore: total > 0 ? scoreAcc / total : 0,
    failures,
  };
}

export function getMockCookingQaResult(): CookingQaResult {
  return {
    total: 4,
    passed: 2,
    failed: 2,
    avgScore: 72.5,
    failures: [
      {
        animal: "Vacuno",
        cut: "entrecote",
        doneness: "rare",
        thickness: 2,
        equipment: "parrilla gas",
        error: "Example validation message (mock)",
        score: 35,
      },
      {
        animal: "Pescado",
        cut: "salmon",
        doneness: "well_done",
        thickness: 8,
        equipment: "cocina interior",
        error: "Quality score below threshold (45 < 50) (mock)",
        score: 45,
      },
    ],
  };
}
