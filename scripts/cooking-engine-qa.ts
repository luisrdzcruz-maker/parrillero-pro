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
import {
  getAllowedDonenessForCut,
  getTemperatureModeForCut,
  shouldShowDonenessSelectorForCut,
  type TemperatureMode,
} from "../lib/temperatureModeProfiles";
import {
  getFatCapBehaviorForCut,
  getFlareUpRiskForCut,
  getFatCapWarningCodesForCut,
  hasFatCapForCut,
  requiresMoveOnFlareupForCut,
} from "../lib/cooking/fatCapProfiles";
import { formatPrepGuidance, getPrepGuidanceForCut } from "../lib/prepGuidance";
import { getGeneratedCutProfile } from "../lib/generated/cutProfiles";

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

function getTemperatureText(plan: CookingPlan | null) {
  if (!plan) return "";
  const normalized = normalizeCookingOutput(plan);
  return String(normalized.TEMPERATURA ?? normalized.TEMPERATURE ?? normalized.temperature ?? "");
}

function getPlanAndStepText(plan: CookingPlan | null, steps: CookingStep[] | null) {
  const normalized = plan ? normalizeCookingOutput(plan) : {};
  const planText = Object.values(normalized).join(" ");
  const stepText = (steps ?? [])
    .map((step) => `${step.title} ${step.description} ${(step.tips ?? []).join(" ")} ${step.warningCue ?? ""}`)
    .join(" ");

  return `${planText} ${stepText}`;
}

type TemperatureModeQaCase = {
  animal: string;
  cut: string;
  requestedDoneness: string;
  mode: TemperatureMode;
  showDoneness: boolean;
  forbiddenDoneness?: readonly string[];
  requiredDoneness?: readonly string[];
  requiredText?: RegExp;
  forbiddenText?: RegExp;
  label: string;
};

function validateTemperatureModeProfiles(): Failure[] {
  const failures: Failure[] = [];
  const cases: TemperatureModeQaCase[] = [
    {
      animal: "Vacuno",
      cut: "chuck_roast",
      requestedDoneness: "medium_rare",
      mode: "texture_breakdown",
      showDoneness: false,
      forbiddenDoneness: ["rare", "medium_rare", "medium"],
      requiredText: /\b(textura|tierno|pinchar|probe tender)\b/i,
      forbiddenText: /\btemperatura de salida\b/i,
      label: "chuck roast texture mode",
    },
    {
      animal: "Vacuno",
      cut: "tri_tip",
      requestedDoneness: "medium_rare",
      mode: "doneness_target",
      showDoneness: true,
      requiredDoneness: ["medium_rare", "medium"],
      label: "tri-tip beef doneness mode",
    },
    {
      animal: "Pollo",
      cut: "chicken_breast",
      requestedDoneness: "rare",
      mode: "safe_temp",
      showDoneness: false,
      forbiddenDoneness: ["rare", "medium_rare"],
      requiredText: /\b(seguro|safe)\b/i,
      label: "chicken breast safe mode",
    },
    {
      animal: "Pollo",
      cut: "whole_chicken",
      requestedDoneness: "medium_rare",
      mode: "safe_temp",
      showDoneness: false,
      forbiddenDoneness: ["rare", "medium_rare"],
      label: "whole chicken hides steak doneness",
    },
    {
      animal: "Verduras",
      cut: "asparagus",
      requestedDoneness: "medium",
      mode: "visual_only",
      showDoneness: false,
      forbiddenDoneness: ["rare", "medium_rare", "medium", "well_done"],
      requiredText: /\b(dorado visible|visible browning|no hay objetivo interno|no internal meat)\b/i,
      label: "asparagus visual mode",
    },
    {
      animal: "Vacuno",
      cut: "brisket",
      requestedDoneness: "medium_rare",
      mode: "texture_breakdown",
      showDoneness: false,
      forbiddenDoneness: ["rare", "medium_rare", "medium"],
      label: "brisket texture mode",
    },
    {
      animal: "Cerdo",
      cut: "pork_ribs",
      requestedDoneness: "medium_rare",
      mode: "texture_breakdown",
      showDoneness: false,
      forbiddenDoneness: ["rare", "medium_rare", "medium"],
      label: "pork ribs texture mode",
    },
    {
      animal: "Vacuno",
      cut: "ribeye",
      requestedDoneness: "medium_rare",
      mode: "doneness_target",
      showDoneness: true,
      requiredDoneness: ["medium_rare", "medium"],
      label: "ribeye doneness mode",
    },
    {
      animal: "Vacuno",
      cut: "tomahawk",
      requestedDoneness: "medium_rare",
      mode: "doneness_target",
      showDoneness: true,
      requiredDoneness: ["medium_rare", "medium"],
      label: "tomahawk long-bone ribeye doneness mode",
    },
  ];

  for (const testCase of cases) {
    const input = makeInput({
      animal: testCase.animal,
      cut: testCase.cut,
      doneness: testCase.requestedDoneness,
    });
    const cut = getCutForInput(input);
    const plan = generateCookingPlan(input);

    if (!cut) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: testCase.requestedDoneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${testCase.label}: cut could not be resolved`,
      });
      continue;
    }

    const mode = getTemperatureModeForCut(cut);
    const allowed = getAllowedDonenessForCut(cut);
    const showDoneness = shouldShowDonenessSelectorForCut(cut);
    const temperatureText = getTemperatureText(plan);

    if (mode !== testCase.mode) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: testCase.requestedDoneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${testCase.label}: expected mode ${testCase.mode}, got ${mode}`,
      });
    }

    if (showDoneness !== testCase.showDoneness) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: testCase.requestedDoneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${testCase.label}: expected showDoneness ${testCase.showDoneness}, got ${showDoneness}`,
      });
    }

    for (const forbidden of testCase.forbiddenDoneness ?? []) {
      if (allowed.includes(forbidden as (typeof allowed)[number])) {
        failures.push({
          animal: testCase.animal,
          cut: testCase.cut,
          doneness: forbidden,
          thickness: `${THICKNESS_CM.medium} cm`,
          equipment: "parrilla gas",
          reason: `${testCase.label}: forbidden doneness is allowed`,
        });
      }
    }

    for (const required of testCase.requiredDoneness ?? []) {
      if (!allowed.includes(required as (typeof allowed)[number])) {
        failures.push({
          animal: testCase.animal,
          cut: testCase.cut,
          doneness: required,
          thickness: `${THICKNESS_CM.medium} cm`,
          equipment: "parrilla gas",
          reason: `${testCase.label}: required doneness is missing`,
        });
      }
    }

    if (testCase.requiredText && !testCase.requiredText.test(temperatureText)) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: testCase.requestedDoneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${testCase.label}: temperature text did not include expected semantics`,
      });
    }

    if (testCase.forbiddenText?.test(temperatureText)) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: testCase.requestedDoneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${testCase.label}: temperature text includes steak-style target phrasing`,
      });
    }
  }

  return failures;
}

function validatePicanhaFatCapProfile(): Failure[] {
  const failures: Failure[] = [];
  const input = makeInput({
    animal: "Vacuno",
    cut: "picanha",
    doneness: "medium_rare",
    thickness: "4",
    equipment: "parrilla gas",
  });
  const cut = getCutForInput(input);
  const plan = generateCookingPlan(input);
  const steps = generateCookingSteps(input);
  const combinedText = getPlanAndStepText(plan, steps);
  const label = "picanha whole fat-cap profile";

  if (!cut) {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: cut could not be resolved`,
    });
    return failures;
  }

  const warningCodes = getFatCapWarningCodesForCut(cut);
  const hasWarningMetadata = warningCodes.some((code) => /fat|flare|burn|indirect/i.test(code));
  const hasWarningText = /\b(fat cap|grasa|flare-ups?|llamaradas|direct flames|llamas directas)\b/i.test(
    combinedText,
  );

  if (!hasWarningMetadata && !hasWarningText) {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: missing fat-cap warning metadata or warning text`,
    });
  }

  if (getFatCapBehaviorForCut(cut) !== "indirect_then_brief_fat_cap_sear") {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: expected indirect-first controlled fat-cap behavior`,
    });
  }

  if (!requiresMoveOnFlareupForCut(cut)) {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: expected move-to-indirect-on-flare-up metadata`,
    });
  }

  if (getTemperatureModeForCut(cut) !== "doneness_target") {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: picanha must remain doneness_target`,
    });
  }

  if (!plan?.timeSemantics) {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: missing timeSemantics`,
    });
  } else {
    if (plan.timeSemantics.activeCookMinutes < 30) {
      failures.push({
        animal: input.animal,
        cut: input.cut,
        doneness: input.doneness,
        thickness: `${input.thicknessCm} cm`,
        equipment: input.equipment,
        reason: `${label}: active cook time is unrealistically short (${plan.timeSemantics.activeCookMinutes} min)`,
      });
    }

    if (plan.timeSemantics.cutPlanMinutes < 40) {
      failures.push({
        animal: input.animal,
        cut: input.cut,
        doneness: input.doneness,
        thickness: `${input.thicknessCm} cm`,
        equipment: input.equipment,
        reason: `${label}: cut-plan time is unrealistically short (${plan.timeSemantics.cutPlanMinutes} min)`,
      });
    }
  }

  if (!/\b(indirect|indirecto)\b/i.test(combinedText) || !/\b(fat[- ]cap|grasa)\b/i.test(combinedText)) {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: plan does not describe controlled indirect fat-cap behavior`,
    });
  }

  if (!/\b(move|mueve|mover)\b.*\b(indirect|indirecto)\b.*\b(flare|llamarada)/i.test(combinedText)) {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: plan does not tell the cook to move indirect on flare-ups`,
    });
  }

  if (!/\b(slice against the grain|corta contra la fibra|cortar contra la fibra)\b/i.test(combinedText)) {
    failures.push({
      animal: input.animal,
      cut: input.cut,
      doneness: input.doneness,
      thickness: `${input.thicknessCm} cm`,
      equipment: input.equipment,
      reason: `${label}: missing slice-against-grain guidance`,
    });
  }

  return failures;
}

function validateCatalogV2RuntimeAdapterBridge(): Failure[] {
  const failures: Failure[] = [];
  const temperatureCases = [
    { animalId: "beef", id: "chuck_roast", mode: "texture_breakdown", label: "chuck roast v2 mode" },
    { animalId: "beef", id: "tri_tip", mode: "doneness_target", label: "tri-tip v2 mode" },
    { animalId: "chicken", id: "chicken_breast", mode: "safe_temp", label: "chicken breast v2 mode" },
    { animalId: "vegetables", id: "asparagus", mode: "visual_only", label: "asparagus v2 mode" },
    { animalId: "beef", id: "ribeye", mode: "doneness_target", label: "ribeye v2 mode" },
    { animalId: "beef", id: "bone_in_chuleton", mode: "doneness_target", label: "chuleton v2 alias mode" },
  ] as const;

  for (const testCase of temperatureCases) {
    const mode = getTemperatureModeForCut({
      id: testCase.id,
      animalId: testCase.animalId,
    });

    if (mode !== testCase.mode) {
      failures.push({
        animal: testCase.animalId,
        cut: testCase.id,
        doneness: "medium",
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${testCase.label}: expected ${testCase.mode}, got ${mode}`,
      });
    }
  }

  const legacyFallbackMode = getTemperatureModeForCut({
    id: "legacy_unmapped_bbq_cut",
    animalId: "beef",
    category: "bbq",
  });
  if (legacyFallbackMode !== "texture_breakdown") {
    failures.push({
      animal: "beef",
      cut: "legacy_unmapped_bbq_cut",
      doneness: "medium",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: `legacy fallback mode: expected texture_breakdown, got ${legacyFallbackMode}`,
    });
  }

  const picanha = { id: "picanha", animalId: "beef" as const };
  const warningCodes = getFatCapWarningCodesForCut(picanha);

  if (!hasFatCapForCut(picanha)) {
    failures.push({
      animal: "beef",
      cut: "picanha",
      doneness: "medium_rare",
      thickness: "4 cm",
      equipment: "parrilla gas",
      reason: "catalog v2 fat-cap bridge: picanha should expose fat-cap metadata",
    });
  }

  if (getFlareUpRiskForCut(picanha) !== "high" || !warningCodes.includes("flare_up_risk")) {
    failures.push({
      animal: "beef",
      cut: "picanha",
      doneness: "medium_rare",
      thickness: "4 cm",
      equipment: "parrilla gas",
      reason: "catalog v2 fat-cap bridge: picanha should expose high flare-up warning metadata",
    });
  }

  if (!requiresMoveOnFlareupForCut(picanha) || !warningCodes.includes("move_to_indirect_on_flareup")) {
    failures.push({
      animal: "beef",
      cut: "picanha",
      doneness: "medium_rare",
      thickness: "4 cm",
      equipment: "parrilla gas",
      reason: "catalog v2 fat-cap bridge: picanha should require move-to-indirect behavior",
    });
  }

  const fallbackFlareUpRisk = getFlareUpRiskForCut({
    id: "legacy_unmapped_lean_cut",
    animalId: "beef",
  });
  if (fallbackFlareUpRisk !== "low") {
    failures.push({
      animal: "beef",
      cut: "legacy_unmapped_lean_cut",
      doneness: "medium",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: `fat-cap safe default: expected low flare-up risk, got ${fallbackFlareUpRisk}`,
    });
  }

  return failures;
}

function validateBoneInRibeyeNormalization(): Failure[] {
  const failures: Failure[] = [];
  const legacyAliases = [
    "ribeye:bone_in_chuleton",
    "bone_in_chuleton",
    "chuleton",
    "chuletón",
    "bone-in ribeye",
    "ribeye on the bone",
    "cowboy steak",
  ];

  for (const alias of legacyAliases) {
    const input = makeInput({
      animal: "Vacuno",
      cut: alias,
      doneness: "medium_rare",
      thickness: THICKNESS_CM.medium,
    });
    const cut = getCutForInput(input);

    if (cut?.id !== "bone_in_ribeye") {
      failures.push({
        animal: input.animal,
        cut: alias,
        doneness: input.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: input.equipment,
        reason: `bone-in ribeye normalization: expected bone_in_ribeye, got ${cut?.id ?? "unresolved"}`,
      });
      continue;
    }

    if (getTemperatureModeForCut(cut) !== "doneness_target") {
      failures.push({
        animal: input.animal,
        cut: alias,
        doneness: input.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: input.equipment,
        reason: "bone-in ribeye normalization: expected doneness_target mode",
      });
    }

    if (cut.inputProfileId !== "thick_steak_bone_in_thickness_weight" || cut.cookingMinutes == null || cut.cookingMinutes < 33) {
      failures.push({
        animal: input.animal,
        cut: alias,
        doneness: input.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: input.equipment,
        reason: "bone-in ribeye normalization: expected thick bone-in behavior and timing",
      });
    }
  }

  const ribeye = getCutForInput(
    makeInput({
      animal: "Vacuno",
      cut: "ribeye",
      doneness: "medium_rare",
      thickness: THICKNESS_CM.medium,
    }),
  );
  const ribeyePrep = getPrepGuidanceForCut(ribeye);

  if (ribeye?.id !== "ribeye" || ribeye.inputProfileId !== "beef-steak") {
    failures.push({
      animal: "Vacuno",
      cut: "ribeye",
      doneness: "medium_rare",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: `ribeye steak behavior: expected normal ribeye steak, got ${ribeye?.id ?? "unresolved"}`,
    });
  }

  if (ribeyePrep?.saltTimingMinutes?.min !== 45 || ribeyePrep.saltTimingMinutes.max !== 1440) {
    failures.push({
      animal: "Vacuno",
      cut: "ribeye",
      doneness: "medium_rare",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: "ribeye steak behavior: expected 45 min-24 h prep guidance",
    });
  }

  const chuletonPrep = getPrepGuidanceForCut({ id: "bone_in_ribeye", animalId: "beef" });
  if (chuletonPrep?.saltTimingMinutes?.min !== 120 || chuletonPrep.saltTimingMinutes.max !== 1440) {
    failures.push({
      animal: "Vacuno",
      cut: "bone_in_ribeye",
      doneness: "medium_rare",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: "chuleton prep behavior: expected 2-24 h prep guidance",
    });
  }

  const tomahawk = getCutForInput(
    makeInput({
      animal: "Vacuno",
      cut: "tomahawk",
      doneness: "medium_rare",
      thickness: THICKNESS_CM.medium,
    }),
  );
  if (tomahawk?.id !== "tomahawk") {
    failures.push({
      animal: "Vacuno",
      cut: "tomahawk",
      doneness: "medium_rare",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: `tomahawk distinction: expected tomahawk, got ${tomahawk?.id ?? "unresolved"}`,
    });
  }

  return failures;
}

function validateCriticalAliasAndMetadataSafety(): Failure[] {
  const failures: Failure[] = [];
  const tomahawkAliases = ["tomahawk", "long bone ribeye", "long-bone ribeye", "frenched ribeye"];

  for (const alias of tomahawkAliases) {
    const input = makeInput({
      animal: "Vacuno",
      cut: alias,
      doneness: "medium_rare",
      thickness: THICKNESS_CM.medium,
    });
    const cut = getCutForInput(input);

    if (cut?.id !== "tomahawk") {
      failures.push({
        animal: input.animal,
        cut: alias,
        doneness: input.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: input.equipment,
        reason: `tomahawk alias safety: expected tomahawk, got ${cut?.id ?? "unresolved"}`,
      });
    }
  }

  const tomahawkGenerated = getGeneratedCutProfile("tomahawk");
  const forbiddenTomahawkAliases = new Set(["chuleton", "chuletón", "bone-in ribeye", "cowboy steak", "ribeye on the bone"]);
  const generatedTomahawkAliases = [...(tomahawkGenerated?.aliasesEn ?? []), ...(tomahawkGenerated?.aliasesMixed ?? [])].map(
    (alias) => alias.toLowerCase(),
  );
  const conflictingTomahawkAliases = [...new Set(generatedTomahawkAliases.filter((alias) => forbiddenTomahawkAliases.has(alias)))];

  if (conflictingTomahawkAliases.length > 0) {
    failures.push({
      animal: "Vacuno",
      cut: "tomahawk",
      doneness: "medium_rare",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: `tomahawk generated aliases include Chuletón/bone-in ribeye aliases: ${conflictingTomahawkAliases.join(", ")}`,
    });
  }

  const triTipGenerated = getGeneratedCutProfile("tri_tip");
  if (triTipGenerated?.cookingStyle === "low_slow" || triTipGenerated?.style === "lowSlow") {
    failures.push({
      animal: "Vacuno",
      cut: "tri_tip",
      doneness: "medium_rare",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: "tri-tip generated metadata must not expose low_slow/lowSlow as its primary style",
    });
  }

  const triTip = getCutForInput(
    makeInput({
      animal: "Vacuno",
      cut: "tri_tip",
      doneness: "medium_rare",
      thickness: THICKNESS_CM.medium,
    }),
  );
  const triTipAllowedDoneness = triTip ? getAllowedDonenessForCut(triTip) : [];

  if (
    !triTip ||
    getTemperatureModeForCut(triTip) !== "doneness_target" ||
    !triTipAllowedDoneness.includes("medium_rare") ||
    !triTipAllowedDoneness.includes("medium")
  ) {
    failures.push({
      animal: "Vacuno",
      cut: "tri_tip",
      doneness: "medium_rare",
      thickness: `${THICKNESS_CM.medium} cm`,
      equipment: "parrilla gas",
      reason: "tri-tip must remain doneness_target with medium_rare and medium targets",
    });
  }

  return failures;
}

function validatePrepSaltingGuidance(): Failure[] {
  const failures: Failure[] = [];
  const cases = [
    {
      animal: "Vacuno",
      cut: "ribeye",
      doneness: "medium_rare",
      label: "ribeye steak dry-brine guidance",
      expectedMin: 45,
      expectedMax: 1440,
      requiredText: /\b45 min-24 h\b/i,
    },
    {
      animal: "Vacuno",
      cut: "picanha",
      doneness: "medium_rare",
      label: "picanha whole light fat-cap salting",
      expectedMin: 120,
      expectedMax: 1440,
      requiredText: /\b2 h-24 h\b.*\b(grasa|fat cap)\b/i,
    },
    {
      animal: "Vacuno",
      cut: "brisket",
      doneness: "medium_rare",
      label: "brisket long dry-brine guidance",
      expectedMin: 720,
      expectedMax: 1440,
      requiredText: /\b12 h-24 h\b/i,
    },
    {
      animal: "Vacuno",
      cut: "chuck_roast",
      doneness: "medium_rare",
      label: "chuck long dry-brine guidance",
      expectedMin: 720,
      expectedMax: 1440,
      requiredText: /\b12 h-24 h\b/i,
    },
    {
      animal: "Pollo",
      cut: "chicken_breast",
      doneness: "safe",
      label: "chicken breast safe dry-brine guidance",
      expectedMin: 30,
      expectedMax: 240,
      requiredText: /\b30 min-4 h\b/i,
    },
    {
      animal: "Verduras",
      cut: "asparagus",
      doneness: "medium",
      label: "asparagus just-before salting guidance",
      expectedMin: 0,
      expectedMax: 5,
      requiredText: /\bjusto antes\b/i,
    },
  ] as const;

  for (const testCase of cases) {
    const input = makeInput({
      animal: testCase.animal,
      cut: testCase.cut,
      doneness: testCase.doneness,
    });
    const plan = generateCookingPlan(input);
    const guidance = plan?.prepGuidance;
    const formatted = formatPrepGuidance(guidance, LANGUAGE);
    const label = testCase.label;

    if (!guidance) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: testCase.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${label}: missing prepGuidance`,
      });
      continue;
    }

    const saltTiming = guidance.saltTimingMinutes;
    if (saltTiming?.min !== testCase.expectedMin || saltTiming?.max !== testCase.expectedMax) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: testCase.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${label}: expected salt window ${testCase.expectedMin}-${testCase.expectedMax}, got ${saltTiming?.min}-${saltTiming?.max}`,
      });
    }

    if (!testCase.requiredText.test(formatted)) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: testCase.doneness,
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${label}: formatted guidance did not include expected text (${formatted})`,
      });
    }

    if (plan?.timeSemantics) {
      const { setupMinutes, cutPlanMinutes, sessionTotalMinutes } = plan.timeSemantics;
      if (sessionTotalMinutes !== setupMinutes + cutPlanMinutes) {
        failures.push({
          animal: testCase.animal,
          cut: testCase.cut,
          doneness: testCase.doneness,
          thickness: `${THICKNESS_CM.medium} cm`,
          equipment: "parrilla gas",
          reason: `${label}: prep lead time appears to affect sessionTotalMinutes`,
        });
      }
    }
  }

  const directCases = [
    {
      animal: "beef",
      cut: "bone_in_chuleton",
      label: "chuleton thick steak dry-brine guidance",
      expectedMin: 120,
      expectedMax: 1440,
    },
    {
      animal: "fish",
      cut: "salmon",
      label: "salmon short fish salting window",
      expectedMin: 10,
      expectedMax: 30,
    },
    {
      animal: "fish",
      cut: "virrey",
      label: "virrey short fish salting window",
      expectedMin: 10,
      expectedMax: 30,
    },
  ] as const;

  for (const testCase of directCases) {
    const guidance = getPrepGuidanceForCut({ id: testCase.cut, animalId: testCase.animal });
    const saltTiming = guidance?.saltTimingMinutes;

    if (!guidance || saltTiming?.min !== testCase.expectedMin || saltTiming?.max !== testCase.expectedMax) {
      failures.push({
        animal: testCase.animal,
        cut: testCase.cut,
        doneness: "medium",
        thickness: `${THICKNESS_CM.medium} cm`,
        equipment: "parrilla gas",
        reason: `${testCase.label}: expected salt window ${testCase.expectedMin}-${testCase.expectedMax}, got ${saltTiming?.min}-${saltTiming?.max}`,
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
  const temperatureModeFailures = validateTemperatureModeProfiles();
  const picanhaFatCapFailures = validatePicanhaFatCapProfile();
  const catalogV2RuntimeAdapterFailures = validateCatalogV2RuntimeAdapterBridge();
  const boneInRibeyeNormalizationFailures = validateBoneInRibeyeNormalization();
  const criticalAliasAndMetadataFailures = validateCriticalAliasAndMetadataSafety();
  const prepSaltingGuidanceFailures = validatePrepSaltingGuidance();
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
    donenessRegressionFailures.length +
    foodSafetyFailures.length +
    temperatureModeFailures.length +
    picanhaFatCapFailures.length +
    catalogV2RuntimeAdapterFailures.length +
    boneInRibeyeNormalizationFailures.length +
    criticalAliasAndMetadataFailures.length +
    prepSaltingGuidanceFailures.length +
    liveCookingPhaseFailures.length;

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

  if (temperatureModeFailures.length > 0) {
    console.log("Temperature mode profile failures:");

    for (const failure of temperatureModeFailures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }

  if (picanhaFatCapFailures.length > 0) {
    console.log("Picanha fat-cap profile failures:");

    for (const failure of picanhaFatCapFailures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }

  if (catalogV2RuntimeAdapterFailures.length > 0) {
    console.log("Catalog v2 runtime adapter failures:");

    for (const failure of catalogV2RuntimeAdapterFailures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }

  if (boneInRibeyeNormalizationFailures.length > 0) {
    console.log("Bone-in ribeye normalization failures:");

    for (const failure of boneInRibeyeNormalizationFailures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }

  if (criticalAliasAndMetadataFailures.length > 0) {
    console.log("Critical alias and metadata safety failures:");

    for (const failure of criticalAliasAndMetadataFailures) {
      console.log(
        `- [${failure.animal} / ${failure.cut} / ${failure.doneness} / ${failure.thickness} / ${failure.equipment}] ${failure.reason}`,
      );
    }

    process.exitCode = 1;
  }

  if (prepSaltingGuidanceFailures.length > 0) {
    console.log("Prep salting guidance failures:");

    for (const failure of prepSaltingGuidanceFailures) {
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
