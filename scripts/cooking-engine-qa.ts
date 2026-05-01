/**
 * Local QA: exercise generateCookingPlan / generateCookingSteps for all catalog cuts
 * (no API, no OpenAI). See package.json: npm run qa:cooking
 */

import {
  animalCatalog,
  type AnimalId,
  type CookingInput,
  type CookingPlan,
  type CookingStep,
} from "../lib/cookingCatalog";
import {
  generateCookingPlan,
  generateCookingSteps,
  getCutsByAnimal,
  getDonenessOptions,
} from "../lib/cookingEngine";
import { normalizeCookingOutput } from "../lib/normalization/normalizeCookingOutput";

const THICKNESS_CM = {
  thin: "2",
  medium: "5",
  thick: "8",
} as const;

const EQUIPMENT: readonly string[] = [
  "parrilla gas",
  "parrilla carbón",
  "kamado",
  "cocina interior",
];

const LANGUAGE = "es" as const;
const WEIGHT_KG = "1";

type Failure = {
  animal: string;
  cut: string;
  doneness: string;
  thickness: string;
  equipment: string;
  reason: string;
};

function validatePlan(plan: CookingPlan | null): string | null {
  if (plan == null) return "plan is null";
  const normalized = normalizeCookingOutput(plan);

  if (!("SETUP" in normalized) || !String(normalized.SETUP).trim()) {
    return "missing or empty SETUP";
  }

  const times = normalized.TIEMPOS ?? normalized.TIMES ?? normalized.times;
  if (!times || !String(times).trim()) {
    return "missing or empty TIEMPOS/TIMES";
  }

  const temp = normalized.TEMPERATURA ?? normalized.TEMPERATURE ?? normalized.temperature;
  if (!temp || !String(temp).trim()) {
    return "missing or empty TEMPERATURA/TEMPERATURE";
  }

  const stepsText = normalized.PASOS ?? normalized.STEPS ?? normalized.steps;
  if (!stepsText || !String(stepsText).trim()) {
    return "missing or empty PASOS/STEPS";
  }

  return null;
}

function validateSteps(steps: CookingStep[] | null): string | null {
  if (steps == null) return "steps is null";
  if (steps.length === 0) return "steps is empty";

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];

    if (!step.title?.trim()) {
      return `step ${i}: missing title`;
    }

    if (!step.description?.trim()) {
      return `step ${i}: missing description`;
    }

    if (
      typeof step.duration !== "number" ||
      !Number.isFinite(step.duration) ||
      step.duration <= 0
    ) {
      return `step ${i}: duration must be > 0, got ${step.duration}`;
    }
  }

  return null;
}

function donenessListForAnimal(animalId: AnimalId): string[] {
  const options = getDonenessOptions(animalId);

  if (options.length > 0) {
    return options.map((option) => option.id);
  }

  return ["medium"];
}

function validateLanguageRegression(): string | null {
  const esInput: CookingInput = {
    animal: "Vacuno",
    cut: "entrecote",
    weightKg: WEIGHT_KG,
    thicknessCm: THICKNESS_CM.medium,
    doneness: "medium_rare",
    equipment: "parrilla gas",
    language: "es",
  };
  const enInput: CookingInput = {
    ...esInput,
    animal: "Beef",
    language: "en",
  };

  const esPlan = generateCookingPlan(esInput);
  const enPlan = generateCookingPlan(enInput);

  if (!esPlan) return "language regression: Spanish plan is null";
  if (!enPlan) return "language regression: English plan is null";

  if (!esPlan.TIEMPOS || !esPlan.TEMPERATURA || !esPlan.PASOS) {
    return "language regression: Spanish plan is missing TIEMPOS/TEMPERATURA/PASOS";
  }

  if (!enPlan.TIMES || !enPlan.TEMPERATURE || !enPlan.STEPS) {
    return "language regression: English plan is missing TIMES/TEMPERATURE/STEPS";
  }

  const englishJoined = Object.keys(enPlan).join(" ").toUpperCase();
  const bannedSpanishHeadings = ["PASOS", "TIEMPOS", "TEMPERATURA", "COMPRA"];
  const leakedHeading = bannedSpanishHeadings.find((heading) => englishJoined.includes(heading));
  if (leakedHeading) {
    return `language regression: English plan leaked Spanish heading "${leakedHeading}"`;
  }

  return null;
}

function main() {
  const failures: Failure[] = [];
  let total = 0;
  let passed = 0;
  const languageRegressionError = validateLanguageRegression();

  for (const animal of animalCatalog) {
    const animalLabel = animal.names.es;
    const cuts = getCutsByAnimal(animal.id);
    const donenessIds = donenessListForAnimal(animal.id);

    for (const cut of cuts) {
      for (const doneness of donenessIds) {
        for (const thickness of Object.values(THICKNESS_CM)) {
          for (const equipment of EQUIPMENT) {
            total += 1;

            const input: CookingInput = {
              animal: animalLabel,
              cut: cut.id,
              weightKg: WEIGHT_KG,
              thicknessCm: thickness,
              doneness,
              equipment,
              language: LANGUAGE,
            };

            const plan = generateCookingPlan(input);
            const planErr = validatePlan(plan);

            const steps = generateCookingSteps(input);
            const stepErr = validateSteps(steps);

            const reason = planErr ?? stepErr;

            if (reason) {
              failures.push({
                animal: animalLabel,
                cut: cut.id,
                doneness,
                thickness: `${thickness} cm`,
                equipment,
                reason,
              });
            } else {
              passed += 1;
            }
          }
        }
      }
    }
  }

  const failed = failures.length;

  console.log("Cooking engine QA (local only)");
  console.log("------------------------------");
  console.log(`Total combinations: ${total}`);
  console.log(`Passed:             ${passed}`);
  console.log(`Failed:             ${failed}`);
  console.log("");

  if (failures.length > 0) {
    console.log("Failures:");

    for (const failure of failures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }

  if (languageRegressionError) {
    console.log("Language regression:");
    console.log(`- ${languageRegressionError}`);
    process.exitCode = 1;
  }
}

main();
