import { animalCatalog, type AnimalId, type CookingInput } from "@/lib/cookingCatalog";
import {
  generateCookingPlan,
  generateCookingSteps,
  getCutForInput,
  getCutsByAnimal,
  getDonenessOptions,
} from "@/lib/cookingEngine";
import { computeCookingQualityScore } from "@/lib/cookingQualityScore";
import { validateCookingEngineOutput } from "@/lib/cookingOutputValidation";

const THICKNESS_CM = { thin: "2", medium: "5", thick: "8" } as const;
const EQUIPMENT = ["parrilla gas", "parrilla carbón", "kamado", "cocina interior"] as const;
const LANGUAGE = "es" as const;
const WEIGHT_KG = "1";
const PASS_SCORE_MIN = 50;

export type AdminQaCase = {
  id: string;
  animal: string;
  cut: string;
  doneness: string;
  thickness: number;
  equipment: string;
  status: "passed" | "failed";
  error: string;
  score: number;
};

export type AdminQaResult = {
  total: number;
  passed: number;
  failed: number;
  avgScore: number;
  failures: AdminQaCase[];
  cases: AdminQaCase[];
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

function createCaseId(
  input: Pick<AdminQaCase, "animal" | "cut" | "doneness" | "thickness" | "equipment">,
) {
  return [input.animal, input.cut, input.doneness, input.thickness, input.equipment].join("__");
}

export function runAdminCookingQA(): AdminQaResult {
  const cases: AdminQaCase[] = [];
  let scoreAcc = 0;

  for (const animal of animalCatalog) {
    const animalLabel = animal.names.es;

    for (const co of getCutsByAnimal(animal.id)) {
      for (const doneness of donenessListForAnimal(animal.id)) {
        for (const th of Object.values(THICKNESS_CM)) {
          for (const equipment of EQUIPMENT) {
            const thickness = thicknessToNumber(th);
            const base = {
              animal: animalLabel,
              cut: co.id,
              doneness,
              thickness,
              equipment,
            };
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
              cases.push({
                ...base,
                id: createCaseId(base),
                status: "failed",
                error: "Catalog mismatch (animal / cut)",
                score: 0,
              });
              continue;
            }

            const plan = generateCookingPlan(input);
            const steps = generateCookingSteps(input);
            const validation = validateCookingEngineOutput(plan, steps, { input });
            const score = computeCookingQualityScore(input, plan, steps, cut);
            scoreAcc += score;

            const validationOk = validation.ok;
            const scoreOk = score >= PASS_SCORE_MIN;
            const status = validationOk && scoreOk ? "passed" : "failed";
            const error = validationOk
              ? scoreOk
                ? ""
                : `Quality score below threshold (${score} < ${PASS_SCORE_MIN})`
              : validation.warnings.map((w) => w.message).join(" · ");

            cases.push({
              ...base,
              id: createCaseId(base),
              status,
              error,
              score,
            });
          }
        }
      }
    }
  }

  const failures = cases.filter((item) => item.status === "failed");

  return {
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    avgScore: cases.length > 0 ? scoreAcc / cases.length : 0,
    failures,
    cases,
  };
}
