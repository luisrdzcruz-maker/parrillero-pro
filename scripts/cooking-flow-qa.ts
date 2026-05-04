/**
 * Cooking flow contract QA.
 *
 * Add new fixtures to FLOW_FIXTURES with a stable fixtureId, canonical animal, UI animal label,
 * canonical cutId, and the doneness/thickness/equipment state expected to survive Result -> Live.
 */

import type { CookingInput, DonenessId } from "../lib/cookingCatalog";
import {
  generateCookingPlan,
  generateCookingSteps,
  getCutForInput,
} from "../lib/cookingEngine";
import {
  buildSingleCutLivePayload,
  buildSingleCutLiveUrl,
  validateLivePayloadContract,
  validateLiveUrlRoundTrip,
  validateResultContract,
  type QaFlowIssue,
  type SingleCutFlowArtifacts,
  type SingleCutFlowInput,
} from "../lib/qa/cookingFlowContracts";
import { REQUIRED_COOKING_BLOCKS, normalizeBlocks } from "../lib/parser/normalizeBlocks";

const WEIGHT_KG = "1";

const FLOW_FIXTURES: SingleCutFlowInput[] = [
  {
    fixtureId: "beef/ribeye",
    animal: "beef",
    animalLabel: "Vacuno",
    cutId: "ribeye",
    doneness: "medium_rare",
    equipment: "parrilla gas",
    thicknessCm: "2",
    lang: "en",
  },
  {
    fixtureId: "beef/tenderloin",
    animal: "beef",
    animalLabel: "Vacuno",
    cutId: "tenderloin",
    doneness: "rare",
    equipment: "parrilla gas",
    thicknessCm: "2",
    lang: "en",
  },
  {
    fixtureId: "pork/iberian-secreto",
    animal: "pork",
    animalLabel: "Cerdo",
    cutId: "iberian_secreto",
    doneness: "medium_safe",
    equipment: "parrilla gas",
    thicknessCm: "2",
    lang: "en",
  },
  {
    fixtureId: "pork/iberian-presa",
    animal: "pork",
    animalLabel: "Cerdo",
    cutId: "iberian_presa",
    doneness: "medium_safe",
    equipment: "parrilla gas",
    thicknessCm: "2",
    lang: "en",
  },
  {
    fixtureId: "chicken/chicken-breast",
    animal: "chicken",
    animalLabel: "Pollo",
    cutId: "chicken_breast",
    doneness: "safe",
    equipment: "parrilla gas",
    thicknessCm: "2",
    lang: "en",
  },
  {
    fixtureId: "fish/salmon",
    animal: "fish",
    animalLabel: "Pescado",
    cutId: "salmon",
    doneness: "medium",
    equipment: "parrilla gas",
    thicknessCm: "2",
    lang: "en",
  },
  {
    fixtureId: "vegetables/asparagus",
    animal: "vegetables",
    animalLabel: "Verduras",
    cutId: "asparagus",
    equipment: "parrilla gas",
    thicknessCm: "2",
    lang: "en",
  },
];

type FixtureResult = {
  fixtureId: string;
  status: "PASS" | "FAIL";
  issues: QaFlowIssue[];
};

function engineLanguage(lang: SingleCutFlowInput["lang"]): CookingInput["language"] {
  return lang === "en" ? "en" : "es";
}

function buildCookingInput(input: SingleCutFlowInput): CookingInput {
  return {
    animal: input.animalLabel,
    cut: input.cutId,
    weightKg: WEIGHT_KG,
    thicknessCm: input.thicknessCm,
    doneness: input.doneness ?? "",
    equipment: input.equipment,
    language: engineLanguage(input.lang),
  };
}

function validatePlanGeneration(input: SingleCutFlowInput, cookingInput: CookingInput): QaFlowIssue[] {
  const issues: QaFlowIssue[] = [];
  const cut = getCutForInput(cookingInput);
  const steps = generateCookingSteps(cookingInput);

  if (!cut) {
    issues.push({
      code: "engine.cut_resolution_failed",
      message: "Engine could not resolve the fixture cut.",
      field: "cutId",
      severity: "error",
    });
  } else {
    if (cut.id !== input.cutId) {
      issues.push({
        code: "engine.cut_id_changed",
        message: `Engine resolved cutId ${cut.id}, expected ${input.cutId}.`,
        field: "cutId",
        severity: "error",
      });
    }
    if (input.doneness && !cut.allowedDoneness.includes(input.doneness as DonenessId)) {
      issues.push({
        code: "engine.doneness_not_allowed",
        message: `Fixture doneness ${input.doneness} is not allowed for ${input.cutId}.`,
        field: "doneness",
        severity: "error",
      });
    }
  }

  if (!steps || steps.length === 0) {
    issues.push({
      code: "engine.steps_missing",
      message: "Engine did not generate cooking steps.",
      field: "steps",
      severity: "error",
    });
  }

  return issues;
}

function buildArtifacts(input: SingleCutFlowInput): SingleCutFlowArtifacts {
  const cookingInput = buildCookingInput(input);
  const plan = generateCookingPlan(cookingInput);
  const blocks = plan ? normalizeBlocks(plan, REQUIRED_COOKING_BLOCKS, "cooking_plan") : {};
  const payload = plan ? buildSingleCutLivePayload({ input, blocks }) : null;
  const liveUrl = plan ? buildSingleCutLiveUrl(input) : null;

  return {
    input,
    plan,
    blocks,
    payload,
    liveUrl,
  };
}

function runFixture(input: SingleCutFlowInput): FixtureResult {
  const cookingInput = buildCookingInput(input);
  const artifacts = buildArtifacts(input);
  const issues = [
    ...validatePlanGeneration(input, cookingInput),
    ...validateResultContract(artifacts),
    ...validateLivePayloadContract(artifacts),
    ...validateLiveUrlRoundTrip(artifacts),
  ];

  return {
    fixtureId: input.fixtureId,
    status: issues.length > 0 ? "FAIL" : "PASS",
    issues,
  };
}

function printResult(result: FixtureResult) {
  if (result.status === "PASS") {
    console.log(`PASS ${result.fixtureId}`);
    return;
  }

  console.log(`FAIL ${result.fixtureId}`);
  for (const issue of result.issues) {
    const field = issue.field ? ` field=${issue.field}` : "";
    console.log(`  - ${issue.code}:${field} ${issue.message}`);
  }
}

function main() {
  const results = FLOW_FIXTURES.map(runFixture);
  const failures = results.filter((result) => result.status === "FAIL");

  console.log("Cooking flow contract QA");
  console.log("------------------------");
  for (const result of results) printResult(result);
  console.log("");
  console.log(`Fixtures: ${results.length}`);
  console.log(`Passed:   ${results.length - failures.length}`);
  console.log(`Failed:   ${failures.length}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
