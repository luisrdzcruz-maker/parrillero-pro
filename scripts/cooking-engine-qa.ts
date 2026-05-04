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
  getCutForInput,
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

type TemperaturePair = {
  pullTemp: number;
  targetInternalTemp: number;
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

function parseTemperaturePair(plan: CookingPlan | null): TemperaturePair | null {
  if (!plan) return null;
  const normalized = normalizeCookingOutput(plan);
  const tempText = String(
    normalized.TEMPERATURA ?? normalized.TEMPERATURE ?? normalized.temperature ?? "",
  );
  const values = [...tempText.matchAll(/(\d+(?:[.,]\d+)?)\s*°C/g)].map((match) =>
    Number(match[1].replace(",", ".")),
  );

  if (values.length < 2 || values.some((value) => !Number.isFinite(value))) return null;

  return {
    pullTemp: values[0],
    targetInternalTemp: values[1],
  };
}

function totalStepSeconds(steps: CookingStep[] | null) {
  if (!steps) return 0;
  return steps.reduce((total, step) => total + step.duration, 0);
}

function donenessListForAnimal(animalId: AnimalId): string[] {
  const options = getDonenessOptions(animalId);

  if (options.length > 0) {
    return options.map((option) => option.id);
  }

  return ["medium"];
}

function makeInput({
  animal,
  cut,
  doneness,
  thickness = THICKNESS_CM.medium,
  equipment = "parrilla gas",
}: {
  animal: string;
  cut: string;
  doneness: string;
  thickness?: string;
  equipment?: string;
}): CookingInput {
  return {
    animal,
    cut,
    weightKg: WEIGHT_KG,
    thicknessCm: thickness,
    doneness,
    equipment,
    language: LANGUAGE,
  };
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

function validateDonenessTemperatureRegression(): Failure[] {
  const failures: Failure[] = [];
  const guardCuts = new Map<string, { animalId: AnimalId; animalLabel: string; cutId: string }>();

  for (const animal of animalCatalog) {
    for (const cut of getCutsByAnimal(animal.id)) {
      guardCuts.set(`${animal.id}:${cut.id}`, {
        animalId: animal.id,
        animalLabel: animal.names.es,
        cutId: cut.id,
      });
    }
  }

  // Generated profiles are resolved by the engine but are not all present in the legacy catalog.
  guardCuts.set("beef:tenderloin", {
    animalId: "beef",
    animalLabel: "Vacuno",
    cutId: "tenderloin",
  });
  guardCuts.set("beef:ribeye", {
    animalId: "beef",
    animalLabel: "Vacuno",
    cutId: "ribeye",
  });

  for (const guardCut of guardCuts.values()) {
    const baseInput = makeInput({
      animal: guardCut.animalLabel,
      cut: guardCut.cutId,
      doneness: "medium",
    });
    const resolvedCut = getCutForInput(baseInput);
    if (!resolvedCut) {
      failures.push({
        animal: guardCut.animalLabel,
        cut: guardCut.cutId,
        doneness: "medium",
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: "doneness regression guard: cut could not be resolved",
      });
      continue;
    }

    const validDoneness = resolvedCut.allowedDoneness;
    if (validDoneness.length <= 1) continue;

    const results = validDoneness.map((doneness) => {
      const input = makeInput({
        animal: guardCut.animalLabel,
        cut: guardCut.cutId,
        doneness,
      });
      const plan = generateCookingPlan(input);
      const steps = generateCookingSteps(input);
      return {
        doneness,
        temps: parseTemperaturePair(plan),
        totalSeconds: totalStepSeconds(steps),
      };
    });

    for (const result of results) {
      if (!result.temps) {
        failures.push({
          animal: guardCut.animalLabel,
          cut: guardCut.cutId,
          doneness: result.doneness,
          thickness: `${THICKNESS_CM.medium} cm`,
          equipment: "parrilla gas",
          reason: "doneness regression guard: missing target/pull temperature",
        });
      }
    }

    for (let i = 0; i < results.length; i += 1) {
      for (let j = i + 1; j < results.length; j += 1) {
        const first = results[i];
        const second = results[j];
        if (!first.temps || !second.temps) continue;

        if (first.temps.targetInternalTemp === second.temps.targetInternalTemp) {
          failures.push({
            animal: guardCut.animalLabel,
            cut: guardCut.cutId,
            doneness: `${first.doneness} vs ${second.doneness}`,
            thickness: `${THICKNESS_CM.medium} cm`,
            equipment: "parrilla gas",
            reason: `doneness regression guard: identical targetInternalTemp ${first.temps.targetInternalTemp}°C`,
          });
        }

        if (first.temps.pullTemp === second.temps.pullTemp) {
          failures.push({
            animal: guardCut.animalLabel,
            cut: guardCut.cutId,
            doneness: `${first.doneness} vs ${second.doneness}`,
            thickness: `${THICKNESS_CM.medium} cm`,
            equipment: "parrilla gas",
            reason: `doneness regression guard: identical pullTemp ${first.temps.pullTemp}°C`,
          });
        }
      }
    }

    if (guardCut.cutId === "tenderloin" || guardCut.cutId === "ribeye") {
      const requiredDoneness = ["rare", "medium", "well_done"] as const;
      const requiredResults = requiredDoneness.map((doneness) =>
        results.find((result) => result.doneness === doneness),
      );

      if (requiredResults.some((result) => !result?.temps)) {
        failures.push({
          animal: guardCut.animalLabel,
          cut: guardCut.cutId,
          doneness: requiredDoneness.join(" / "),
          thickness: `${THICKNESS_CM.medium} cm`,
          equipment: "parrilla gas",
          reason: "doneness regression guard: missing required rare/medium/well_done coverage",
        });
        continue;
      }

      const uniqueTargets = new Set(
        requiredResults.map((result) => result?.temps?.targetInternalTemp),
      );
      const uniquePulls = new Set(requiredResults.map((result) => result?.temps?.pullTemp));
      const uniqueTotals = new Set(requiredResults.map((result) => result?.totalSeconds));

      if (uniqueTargets.size !== requiredDoneness.length) {
        failures.push({
          animal: guardCut.animalLabel,
          cut: guardCut.cutId,
          doneness: requiredDoneness.join(" / "),
          thickness: `${THICKNESS_CM.medium} cm`,
          equipment: "parrilla gas",
          reason: "doneness regression guard: rare/medium/well_done target temps are not all different",
        });
      }

      if (uniquePulls.size !== requiredDoneness.length) {
        failures.push({
          animal: guardCut.animalLabel,
          cut: guardCut.cutId,
          doneness: requiredDoneness.join(" / "),
          thickness: `${THICKNESS_CM.medium} cm`,
          equipment: "parrilla gas",
          reason: "doneness regression guard: rare/medium/well_done pull temps are not all different",
        });
      }

      if (uniqueTotals.size !== requiredDoneness.length) {
        failures.push({
          animal: guardCut.animalLabel,
          cut: guardCut.cutId,
          doneness: requiredDoneness.join(" / "),
          thickness: `${THICKNESS_CM.medium} cm`,
          equipment: "parrilla gas",
          reason: "doneness regression guard: rare/medium/well_done total timings are not all different",
        });
      }
    }
  }

  return failures;
}

function validateFoodSafetyRegression(): Failure[] {
  const failures: Failure[] = [];
  const safetyCases = [
    {
      animal: "Pollo",
      cut: "pechuga",
      doneness: "rare",
      minPull: 72,
      minTarget: 74,
      label: "chicken unsafe rare request",
    },
    {
      animal: "Cerdo",
      cut: "pork_tenderloin",
      doneness: "rare",
      minPull: 60,
      minTarget: 63,
      label: "pork unsafe rare request",
    },
  ];

  for (const safetyCase of safetyCases) {
    const input = makeInput(safetyCase);
    const temps = parseTemperaturePair(generateCookingPlan(input));

    if (!temps) {
      failures.push({
        animal: safetyCase.animal,
        cut: safetyCase.cut,
        doneness: safetyCase.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `food safety guard: missing temperature output for ${safetyCase.label}`,
      });
      continue;
    }

    if (
      temps.pullTemp < safetyCase.minPull ||
      temps.targetInternalTemp < safetyCase.minTarget
    ) {
      failures.push({
        animal: safetyCase.animal,
        cut: safetyCase.cut,
        doneness: safetyCase.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `food safety guard: unsafe output for ${safetyCase.label} (pull ${temps.pullTemp}°C, target ${temps.targetInternalTemp}°C)`,
      });
    }
  }

  return failures;
}

function main() {
  const failures: Failure[] = [];
  let total = 0;
  let passed = 0;
  const languageRegressionError = validateLanguageRegression();
  const donenessRegressionFailures = validateDonenessTemperatureRegression();
  const foodSafetyFailures = validateFoodSafetyRegression();

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
  const guardFailed = donenessRegressionFailures.length + foodSafetyFailures.length;

  console.log("Cooking engine QA (local only)");
  console.log("------------------------------");
  console.log(`Total combinations: ${total}`);
  console.log(`Passed:             ${passed}`);
  console.log(`Failed:             ${failed + guardFailed}`);
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

  if (donenessRegressionFailures.length > 0) {
    console.log("Doneness regression guard failures:");

    for (const failure of donenessRegressionFailures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }

  if (foodSafetyFailures.length > 0) {
    console.log("Food safety regression failures:");

    for (const failure of foodSafetyFailures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }
}

main();
