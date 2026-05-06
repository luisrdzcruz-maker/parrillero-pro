import {
  DEMO_PARRILLADA_SCENARIOS,
  NAPOLEON_ROGUE_525_LITE,
  scheduleParrillada,
  singleCutPlanToPlannerInput,
  type PlannerPhase,
  type PlannerResult,
} from "../lib/planning";
import { generateCookingPlan, getCutForInput, type CookingInput } from "../lib/cookingEngine";
import { getPlanPlanningMetadata } from "../lib/cooking/planningMetadata";

type Scenario = {
  name: string;
  items: PlannerResult["request"]["items"];
};

const FIXED_SERVE_AT_ISO = "2030-05-01T18:00:00.000Z";
const FIXED_NOW_ISO = "2030-05-01T12:00:00.000Z";
const ACTIVE_COOK_TYPES = new Set<PlannerPhase["type"]>(["cook", "sear", "flip", "check"]);

class QaError extends Error {
  constructor(
    message: string,
    public readonly phaseContext: PlannerPhase[] = [],
  ) {
    super(message);
  }
}

function formatPhase(phase: PlannerPhase): string {
  return `${phase.startIso} | ${phase.type} | ${phase.displayName} | ${phase.durationMinutes}m | ${phase.zone}`;
}

function assert(condition: boolean, message: string, phaseContext: PlannerPhase[] = []): asserts condition {
  if (!condition) throw new QaError(message, phaseContext);
}

function validatePlanSanity(result: PlannerResult): void {
  const phases = result.phases;
  assert(Boolean(result), "plan is missing");
  assert(phases.length > 0, "timeline has no actions");
  assert(Array.isArray(result.warnings), "warnings array is missing");
  assert(Boolean(result.summary.confidence), "plan confidence is missing");

  for (let i = 1; i < phases.length; i += 1) {
    const prev = phases[i - 1];
    const curr = phases[i];
    const startsDecreasing = curr.startMinute < prev.startMinute;
    const endsDecreasingOnSameStart =
      curr.startMinute === prev.startMinute && curr.endMinute < prev.endMinute;
    assert(
      !startsDecreasing && !endsDecreasingOnSameStart,
      "actions are not sorted by start time",
      [prev, curr],
    );
  }

  for (const phase of phases) {
    assert(phase.durationMinutes > 0, `phase has non-positive duration: ${phase.id}`, [phase]);
  }

  const preheat = phases.find((phase) => phase.type === "preheat" && phase.itemId === "global");
  const firstCook = phases
    .filter((phase) => ACTIVE_COOK_TYPES.has(phase.type))
    .sort((a, b) => a.startMinute - b.startMinute)[0];
  if (preheat && firstCook) {
    assert(
      preheat.endMinute <= firstCook.startMinute,
      "global preheat ends after first cook/sear/check/flip starts",
      [preheat, firstCook],
    );
  }

  const byItem = new Map<string, PlannerPhase[]>();
  for (const phase of phases) {
    if (phase.itemId === "global") continue;
    byItem.set(phase.itemId, [...(byItem.get(phase.itemId) ?? []), phase]);
  }

  for (const [itemId, itemPhases] of byItem.entries()) {
    const firstCookLike = itemPhases
      .filter((phase) => phase.type === "cook" || phase.type === "sear")
      .sort((a, b) => a.startMinute - b.startMinute)[0];
    const prep = itemPhases.find((phase) => phase.type === "prep");
    if (prep && firstCookLike) {
      assert(prep.endMinute <= firstCookLike.startMinute, `prep ends after cook start for item ${itemId}`, [prep, firstCookLike]);
    }

    const cookLike = itemPhases.filter((phase) => phase.type === "cook" || phase.type === "sear");
    const afterCook = itemPhases.filter(
      (phase) => phase.type === "rest" || phase.type === "hold" || phase.type === "serve",
    );
    if (cookLike.length > 0 && afterCook.length > 0) {
      const cookEnd = Math.max(...cookLike.map((phase) => phase.endMinute));
      const firstAfterCook = afterCook.sort((a, b) => a.startMinute - b.startMinute)[0];
      assert(
        cookEnd <= firstAfterCook.startMinute,
        `rest/hold/serve starts before cook/sear ends for item ${itemId}`,
        [...cookLike, firstAfterCook],
      );
    }
  }

  const serveActions = phases.filter((phase) => phase.type === "serve");
  assert(serveActions.length > 0, "serve actions are missing");
  const requestedServeMs = new Date(result.request.serveAtIso).getTime();
  for (const serve of serveActions) {
    const serveStartMs = new Date(serve.startIso).getTime();
    const deltaMinutes = Math.abs(Math.round((serveStartMs - requestedServeMs) / 60000));
    assert(deltaMinutes <= 5, "serve action is too far from requested serve time", [serve]);
  }
}

function makeCookingInput(args: {
  animal: string;
  cut: string;
  doneness: string;
  thicknessCm: string;
}): CookingInput {
  return {
    animal: args.animal,
    cut: args.cut,
    doneness: args.doneness,
    thicknessCm: args.thicknessCm,
    weightKg: "1",
    equipment: "parrilla gas",
    language: "es",
  };
}

function toMetadataPlannerItem(args: {
  scenarioPrefix: string;
  animal: string;
  cut: string;
  doneness: string;
  thicknessCm: string;
  weightGrams?: number;
  priority?: number;
}) {
  const input = makeCookingInput(args);
  const plan = generateCookingPlan(input);
  if (!plan) {
    throw new QaError(`single-cut plan is missing for ${args.cut}`);
  }
  const resolvedCut = getCutForInput(input);
  if (!resolvedCut) {
    throw new QaError(`single-cut cut resolution failed for ${args.cut}`);
  }

  const metadata = getPlanPlanningMetadata(plan);
  assert(Boolean(metadata), `planningMetadata missing for ${args.cut}`);

  return singleCutPlanToPlannerInput({
    id: `${args.scenarioPrefix}-${args.cut}`,
    cut: resolvedCut,
    plan,
    thicknessCm: Number(args.thicknessCm),
    weightGrams: args.weightGrams,
    priority: args.priority,
  });
}

function main(): void {
  const demoScenarios: Scenario[] = [
    { name: "picanha + asparagus", items: DEMO_PARRILLADA_SCENARIOS.picanhaAsparagus },
    {
      name: "picanha + secreto iberico + asparagus",
      items: DEMO_PARRILLADA_SCENARIOS.picanhaSecretoAsparagus,
    },
    {
      name: "chicken wings + secreto iberico + asparagus",
      items: DEMO_PARRILLADA_SCENARIOS.wingsSecretoAsparagus,
    },
    { name: "default 4-item demo menu", items: DEMO_PARRILLADA_SCENARIOS.defaultLite4 },
  ];
  const metadataScenarios: Scenario[] = [
    {
      name: "metadata: ribeye + bone_in_ribeye + asparagus",
      items: [
        toMetadataPlannerItem({
          scenarioPrefix: "meta-ribeye",
          animal: "Beef",
          cut: "ribeye",
          doneness: "medium_rare",
          thicknessCm: "3",
          weightGrams: 500,
          priority: 3,
        }),
        toMetadataPlannerItem({
          scenarioPrefix: "meta-bonein",
          animal: "Beef",
          cut: "bone_in_ribeye",
          doneness: "medium_rare",
          thicknessCm: "5",
          weightGrams: 1100,
          priority: 5,
        }),
        toMetadataPlannerItem({
          scenarioPrefix: "meta-asparagus",
          animal: "Verduras",
          cut: "asparagus",
          doneness: "juicy",
          thicknessCm: "2",
          weightGrams: 300,
          priority: 1,
        }),
      ],
    },
    {
      name: "metadata: picanha + iberian_secreto + chicken_wing + salmon + corn_on_cob",
      items: [
        toMetadataPlannerItem({
          scenarioPrefix: "meta-picanha",
          animal: "Beef",
          cut: "picanha",
          doneness: "medium_rare",
          thicknessCm: "4",
          weightGrams: 1000,
          priority: 5,
        }),
        toMetadataPlannerItem({
          scenarioPrefix: "meta-secreto",
          animal: "Pork",
          cut: "iberian_secreto",
          doneness: "medium_safe",
          thicknessCm: "2",
          weightGrams: 450,
          priority: 4,
        }),
        toMetadataPlannerItem({
          scenarioPrefix: "meta-wings",
          animal: "Chicken",
          cut: "chicken_wing",
          doneness: "safe",
          thicknessCm: "2",
          weightGrams: 800,
          priority: 3,
        }),
        toMetadataPlannerItem({
          scenarioPrefix: "meta-salmon",
          animal: "Fish",
          cut: "salmon",
          doneness: "medium",
          thicknessCm: "3",
          weightGrams: 450,
          priority: 2,
        }),
        toMetadataPlannerItem({
          scenarioPrefix: "meta-corn",
          animal: "Verduras",
          cut: "corn_on_cob",
          doneness: "juicy",
          thicknessCm: "3",
          weightGrams: 350,
          priority: 1,
        }),
      ],
    },
  ];
  const scenarios = [...demoScenarios, ...metadataScenarios];

  let passed = 0;
  console.log("Parrillada scheduler QA");
  console.log("-----------------------");

  for (const scenario of scenarios) {
    const result = scheduleParrillada({
      items: scenario.items,
      serveAtIso: FIXED_SERVE_AT_ISO,
      nowIso: FIXED_NOW_ISO,
      strategy: "balanced",
      grillCapacity: NAPOLEON_ROGUE_525_LITE,
      allowHolding: true,
      maxPlanLookbackMinutes: 480,
    });

    try {
      validatePlanSanity(result);
      passed += 1;
      console.log(
        `PASS | ${scenario.name} | items=${result.items.length} | actions=${result.phases.length} | confidence=${result.summary.confidence} | warnings=${result.warnings.length}`,
      );
    } catch (error) {
      const qaError = error as QaError;
      console.log(
        `FAIL | ${scenario.name} | items=${result.items.length} | actions=${result.phases.length} | confidence=${result.summary.confidence} | warnings=${result.warnings.length}`,
      );
      console.log(`  Rule: ${qaError.message}`);
      const context = qaError.phaseContext.length > 0 ? qaError.phaseContext : result.phases.slice(0, 8);
      console.log("  Relevant actions:");
      context.forEach((phase) => console.log(`  - ${formatPhase(phase)}`));
      process.exitCode = 1;
      break;
    }
  }

  if (passed === scenarios.length) {
    console.log("");
    console.log(`Parrillada QA passed: ${passed}/${scenarios.length} scenarios`);
  }
}

main();
