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
import {
  buildLiveStepsFromPayload,
  createLiveCookingPayload,
} from "../lib/liveCookingPlan";
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

function parseMinuteValues(value: string) {
  return Array.from(value.matchAll(/(\d{1,3})\s*min\b/gi), (match) => Number(match[1])).filter(
    (minutes) => Number.isFinite(minutes),
  );
}

function parseTimesCutPlanMinutes(value: string) {
  const segments = value
    .split(/\s*(?:\+|,|;|\/|\by\b|\band\b)\s*/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const sourceSegments = segments.length > 1 ? segments : [value];
  const hasRest = /\b(rest|reposo|reposar|reposa|descanso)\b/i.test(value);

  const total = sourceSegments.reduce((sum, segment) => {
    const match = segment.match(/(\d{1,3})\s*min\b/i);
    if (!match?.[1]) return sum;

    const minutes = Number(match[1]);
    const multiplier = /\b(per\s+side|por\s+lado|por\s+cara)\b/i.test(segment) ? 2 : 1;
    return sum + minutes * multiplier;
  }, 0);

  if (hasRest) return total;
  const minuteValues = parseMinuteValues(value);
  return minuteValues.length === 1 ? total : 0;
}

function validateTimeSemantics(plan: CookingPlan | null, steps: CookingStep[] | null): string | null {
  if (!plan) return "time semantics: plan is null";
  const timeSemantics = plan.timeSemantics;
  if (!timeSemantics) return "time semantics: missing timeSemantics";

  const {
    setupMinutes,
    activeCookMinutes,
    restMinutes,
    cutPlanMinutes,
    sessionTotalMinutes,
  } = timeSemantics;

  if (timeSemantics.source !== "legacy-engine-derived") {
    return `time semantics: unexpected source ${timeSemantics.source}`;
  }

  if (setupMinutes < 0) return `time semantics: setupMinutes must be >= 0, got ${setupMinutes}`;
  if (activeCookMinutes <= 0) {
    return `time semantics: activeCookMinutes must be > 0, got ${activeCookMinutes}`;
  }
  if (restMinutes < 0) return `time semantics: restMinutes must be >= 0, got ${restMinutes}`;
  if (cutPlanMinutes !== activeCookMinutes + restMinutes) {
    return `time semantics: cutPlanMinutes ${cutPlanMinutes} must equal activeCookMinutes + restMinutes ${activeCookMinutes + restMinutes}`;
  }
  if (sessionTotalMinutes !== setupMinutes + cutPlanMinutes) {
    return `time semantics: sessionTotalMinutes ${sessionTotalMinutes} must equal setupMinutes + cutPlanMinutes ${setupMinutes + cutPlanMinutes}`;
  }

  const executableStepMinutes = Math.round(totalStepSeconds(steps) / 60);
  if (steps && executableStepMinutes > 0 && Math.abs(executableStepMinutes - sessionTotalMinutes) > 1) {
    return `time semantics: step duration total ${executableStepMinutes} min is not close to sessionTotalMinutes ${sessionTotalMinutes} min`;
  }

  const normalized = normalizeCookingOutput(plan);
  const timesText = String(normalized.TIEMPOS ?? normalized.TIMES ?? normalized.times ?? "");
  const timesMinutes = parseTimesCutPlanMinutes(timesText);
  const rawMinuteValues = parseMinuteValues(timesText);

  if (timesMinutes > 0 && setupMinutes > 0 && timesMinutes >= sessionTotalMinutes - 1) {
    return "time semantics: TIMES/TIEMPOS appears to describe sessionTotalMinutes instead of cut-plan time";
  }

  if (setupMinutes > 0 && rawMinuteValues.includes(sessionTotalMinutes)) {
    return "time semantics: TIMES/TIEMPOS appears to include sessionTotalMinutes";
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

function validateLiveCookingPhaseMetadata(): Failure[] {
  const failures: Failure[] = [];
  const cases = [
    {
      animal: "Vacuno",
      cut: "ribeye",
      doneness: "medium_rare",
      thickness: THICKNESS_CM.medium,
      equipment: "parrilla gas",
      label: "ribeye live phases",
    },
    {
      animal: "Vacuno",
      cut: "picanha",
      doneness: "medium",
      thickness: THICKNESS_CM.medium,
      equipment: "parrilla gas",
      label: "picanha live phases",
    },
    {
      animal: "Pollo",
      cut: "pollo_entero",
      doneness: "safe",
      thickness: THICKNESS_CM.medium,
      equipment: "parrilla gas",
      label: "whole chicken live phases",
    },
    {
      animal: "Verduras",
      cut: "esparragos",
      doneness: "juicy",
      thickness: THICKNESS_CM.thin,
      equipment: "parrilla gas",
      label: "asparagus live phases",
    },
  ];

  for (const testCase of cases) {
    const input = makeInput(testCase);
    const plan = generateCookingPlan(input);
    if (!plan) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: plan is null`,
      });
      continue;
    }

    const payload = createLiveCookingPayload({
      input: {
        animal: testCase.animal,
        cut: testCase.cut,
        equipment: testCase.equipment,
        doneness: testCase.doneness,
        thickness: testCase.thickness,
        lang: LANGUAGE,
      },
      blocks: plan,
    });
    const steps = buildLiveStepsFromPayload(payload, [], LANGUAGE).steps;

    if (steps.length === 0) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: no live steps built`,
      });
      continue;
    }

    if (steps.some((step) => !step.phaseType)) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: missing phaseType metadata`,
      });
    }

    if (plan.timeSemantics?.setupMinutes && !steps.some((step) => step.isSetupPhase)) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: missing setup phase`,
      });
    }

    if (!steps.some((step) => step.isActiveCookingPhase)) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: missing active cooking phase`,
      });
    }

    const hasServeText = steps.some((step) =>
      /\b(servir|serve|listo|slice|cortar|finish|terminar)\b/i.test(`${step.label} ${step.notes ?? ""}`),
    );

    if (
      plan.timeSemantics?.restMinutes &&
      !hasServeText &&
      !steps.some((step) => step.isRestPhase)
    ) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: missing rest phase`,
      });
    }

    const sessionMinutes = Math.round(
      steps
        .filter((step) => step.contributesToSessionTotal)
        .reduce((sum, step) => sum + step.duration, 0) / 60,
    );
    const cutPlanMinutes = Math.round(
      steps
        .filter((step) => step.contributesToCutPlan)
        .reduce((sum, step) => sum + step.duration, 0) / 60,
    );

    if (plan.timeSemantics && Math.abs(sessionMinutes - plan.timeSemantics.sessionTotalMinutes) > 1) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: live session phase total ${sessionMinutes} min differs from sessionTotalMinutes ${plan.timeSemantics.sessionTotalMinutes} min`,
      });
    }

    if (
      plan.timeSemantics &&
      !steps.some((step) => step.phaseType === "serve") &&
      Math.abs(cutPlanMinutes - plan.timeSemantics.cutPlanMinutes) > 1
    ) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: live cut-plan phase total ${cutPlanMinutes} min differs from cutPlanMinutes ${plan.timeSemantics.cutPlanMinutes} min`,
      });
    }

    if (hasServeText && !steps.some((step) => step.phaseType === "serve")) {
      failures.push({
        ...testCase,
        thickness: `${testCase.thickness} cm`,
        reason: `${testCase.label}: serve-like step was not classified as serve`,
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
  const liveCookingPhaseFailures = validateLiveCookingPhaseMetadata();

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
            const timeErr = validateTimeSemantics(plan, steps);

            const reason = planErr ?? stepErr ?? timeErr;

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
  const guardFailed =
    donenessRegressionFailures.length + foodSafetyFailures.length + liveCookingPhaseFailures.length;

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

  if (liveCookingPhaseFailures.length > 0) {
    console.log("Live cooking phase metadata failures:");

    for (const failure of liveCookingPhaseFailures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }
}

main();
