import {
  buildCatalogBackedParrilladaLiteItems,
  DEMO_PARRILLADA_SCENARIOS,
  getParrilladaItemPresentation,
  NAPOLEON_ROGUE_525_LITE,
  scheduleParrillada,
  type PlannerPhase,
  type PlannerResult,
} from "../lib/planning";

type Scenario = {
  name: string;
  items: PlannerResult["request"]["items"];
  metadataCoverageRequired?: boolean;
};

type ScenarioSkip = {
  name: string;
  reason: string;
};

type CatalogItem = PlannerResult["request"]["items"][number];

type GeneratedScenarioFamily = {
  name: string;
  selectors: Array<{
    label: string;
    min: number;
    take: number;
    predicate: (item: CatalogItem) => boolean;
  }>;
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

function pickItemsByCutId(
  allItems: PlannerResult["request"]["items"],
  cutIds: string[],
  scenarioName: string,
): PlannerResult["request"]["items"] {
  const picked = cutIds
    .map((cutId) => allItems.find((item) => item.cutId === cutId))
    .filter((item): item is PlannerResult["request"]["items"][number] => Boolean(item));
  if (picked.length !== cutIds.length) {
    const missing = cutIds.filter((cutId) => !allItems.find((item) => item.cutId === cutId));
    throw new QaError(`${scenarioName}: missing catalog items [${missing.join(", ")}]`);
  }
  return picked;
}

function tryPickItemsByCutId(
  allItems: PlannerResult["request"]["items"],
  cutIds: string[],
): PlannerResult["request"]["items"] | null {
  const picked = cutIds
    .map((cutId) => allItems.find((item) => item.cutId === cutId))
    .filter((item): item is PlannerResult["request"]["items"][number] => Boolean(item));
  return picked.length === cutIds.length ? picked : null;
}

function validateMetadataCoverage(items: PlannerResult["request"]["items"]): void {
  for (const item of items) {
    const hasMetadata = Boolean(item.planningMetadata);
    const hasFallbackNote = (item.notes ?? []).some((note) =>
      note.toLowerCase().includes("fallback: planningmetadata missing"),
    );
    assert(
      hasMetadata || hasFallbackNote,
      `catalog-backed item ${item.cutId} has neither planningMetadata nor fallback note`,
    );
  }
}

function validateLiteItemCount(name: string, items: PlannerResult["request"]["items"]): void {
  assert(
    items.length >= 2 && items.length <= 4,
    `${name}: Parrillada Lite scenario must include 2-4 items`,
  );
}

function sortCatalogItems(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort((a, b) => {
    const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    const sessionDiff = (b.planningMetadata?.totalSessionMinutes ?? 0) - (a.planningMetadata?.totalSessionMinutes ?? 0);
    if (sessionDiff !== 0) return sessionDiff;
    return a.cutId.localeCompare(b.cutId);
  });
}

function buildMissingCutReason(
  cutIds: string[],
  availableItems: PlannerResult["request"]["items"],
  skippedByCandidateId: Map<string, string>,
): string {
  const missing = cutIds.filter((cutId) => !availableItems.some((item) => item.cutId === cutId));
  return missing
    .map((cutId) => {
      const skipReason = skippedByCandidateId.get(cutId);
      return skipReason ? `${cutId} (${skipReason})` : cutId;
    })
    .join(", ");
}

function isTimelineSaneForScenario(items: PlannerResult["request"]["items"]): { ok: true } | { ok: false; reason: string } {
  try {
    const result = scheduleParrillada({
      items,
      serveAtIso: FIXED_SERVE_AT_ISO,
      nowIso: FIXED_NOW_ISO,
      strategy: "balanced",
      grillCapacity: NAPOLEON_ROGUE_525_LITE,
      allowHolding: true,
      maxPlanLookbackMinutes: 720,
    });
    validatePlanSanity(result);
    return { ok: true };
  } catch (error) {
    const qaError = error as QaError;
    return { ok: false, reason: qaError.message };
  }
}

function buildGeneratedScenario(
  family: GeneratedScenarioFamily,
  sortedCatalogItems: CatalogItem[],
): { scenario?: Scenario; skip?: ScenarioSkip } {
  const usedCutIds = new Set<string>();
  const chosen: CatalogItem[] = [];

  for (const selector of family.selectors) {
    const matches = sortedCatalogItems.filter((item) => !usedCutIds.has(item.cutId) && selector.predicate(item));
    if (matches.length < selector.min) {
      return {
        skip: {
          name: family.name,
          reason: `needs ${selector.min}+ ${selector.label} item(s), found ${matches.length}`,
        },
      };
    }
    const selected = matches.slice(0, selector.take);
    for (const item of selected) {
      usedCutIds.add(item.cutId);
      chosen.push(item);
    }
  }

  if (chosen.length < 2 || chosen.length > 4) {
    return {
      skip: {
        name: family.name,
        reason: `scenario size ${chosen.length} outside Lite bounds (2-4)`,
      },
    };
  }

  return {
    scenario: {
      name: family.name,
      items: chosen,
      metadataCoverageRequired: true,
    },
  };
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
  const catalog = buildCatalogBackedParrilladaLiteItems();
  const skippedScenarios: ScenarioSkip[] = [];
  const skippedByCandidateId = new Map(catalog.skipped.map((entry) => [entry.candidateId, entry.reason]));
  if (catalog.skipped.length > 0) {
    console.log("Catalog items skipped:");
    catalog.skipped.forEach((skip) => console.log(`- ${skip.candidateId}: ${skip.reason}`));
    console.log("");
  }

  const catalogScenarios: Scenario[] = [];
  const pushScenarioIfAvailable = (
    name: string,
    cutIds: string[],
    metadataCoverageRequired = true,
  ): void => {
    const items = tryPickItemsByCutId(catalog.items, cutIds);
    if (!items) {
      const missingReason = buildMissingCutReason(cutIds, catalog.items, skippedByCandidateId);
      skippedScenarios.push({ name, reason: `missing/unsafe catalog items [${missingReason}]` });
      return;
    }
    catalogScenarios.push({ name, items, metadataCoverageRequired });
  };

  const pushScenarioIfTimelineSane = (name: string, cutIds: string[], metadataCoverageRequired = true): void => {
    const items = tryPickItemsByCutId(catalog.items, cutIds);
    if (!items) {
      const missingReason = buildMissingCutReason(cutIds, catalog.items, skippedByCandidateId);
      skippedScenarios.push({ name, reason: `missing/unsafe catalog items [${missingReason}]` });
      return;
    }
    const sanity = isTimelineSaneForScenario(items);
    if (!sanity.ok) {
      skippedScenarios.push({ name, reason: `timeline sanity check failed (${sanity.reason})` });
      return;
    }
    catalogScenarios.push({ name, items, metadataCoverageRequired });
  };

  pushScenarioIfAvailable("catalog: beef + vegetable mix", ["striploin", "t_bone", "bell_peppers", "mushrooms"]);
  pushScenarioIfAvailable("catalog: pork + vegetable mix", ["pork_loin", "iberian_presa", "potato_halves"]);
  pushScenarioIfAvailable("catalog: chicken + side mix", ["chicken_leg_quarter", "chicken_wing", "corn_on_cob"]);
  pushScenarioIfAvailable("catalog: fish + vegetable mix", ["salmon", "asparagus", "eggplant_slices"]);
  pushScenarioIfAvailable(
    "catalog: default expanded 4-item menu",
    ["striploin", "iberian_presa", "chicken_wing", "bell_peppers"],
  );
  pushScenarioIfAvailable(
    "catalog: advanced long-cook + vegetable",
    ["brisket", "short_ribs", "pork_belly", "potato_halves"],
  );
  pushScenarioIfAvailable(
    "catalog: advanced long-cook + side",
    ["brisket", "potato_halves"],
  );
  pushScenarioIfAvailable(
    "catalog: ribs + side",
    ["baby_back_ribs", "spare_ribs", "corn_on_cob"],
  );
  pushScenarioIfAvailable(
    "catalog: whole/spatchcock chicken + side",
    ["whole_chicken", "spatchcock_chicken", "asparagus"],
  );
  pushScenarioIfAvailable(
    "catalog: pork belly + side",
    ["pork_belly", "bell_peppers"],
  );
  pushScenarioIfAvailable(
    "catalog: pork belly slices + side",
    ["pork_belly_slices", "asparagus"],
  );
  pushScenarioIfTimelineSane(
    "catalog: brisket + chuck roast + side",
    ["brisket", "chuck_roast", "potato_halves"],
  );

  const sortedCatalogItems = sortCatalogItems(catalog.items);
  const generatedFamilies: GeneratedScenarioFamily[] = [
    {
      name: "generated: beef + vegetable",
      selectors: [
        {
          label: "beef main",
          min: 2,
          take: 2,
          predicate: (item) => {
            const presentation = getParrilladaItemPresentation(item);
            return presentation.category === "beef" && presentation.role === "main";
          },
        },
        {
          label: "vegetable side",
          min: 1,
          take: 1,
          predicate: (item) => getParrilladaItemPresentation(item).category === "vegetables",
        },
      ],
    },
    {
      name: "generated: pork + vegetable",
      selectors: [
        {
          label: "pork non-sausage main",
          min: 2,
          take: 2,
          predicate: (item) => {
            const presentation = getParrilladaItemPresentation(item);
            return presentation.category === "pork" && presentation.role === "main";
          },
        },
        {
          label: "vegetable side",
          min: 1,
          take: 1,
          predicate: (item) => getParrilladaItemPresentation(item).category === "vegetables",
        },
      ],
    },
    {
      name: "generated: chicken + side",
      selectors: [
        {
          label: "chicken item",
          min: 2,
          take: 2,
          predicate: (item) => getParrilladaItemPresentation(item).category === "chicken",
        },
        {
          label: "side item",
          min: 1,
          take: 1,
          predicate: (item) => getParrilladaItemPresentation(item).role === "side",
        },
      ],
    },
    {
      name: "generated: fish + vegetable",
      selectors: [
        {
          label: "fish item",
          min: 1,
          take: 1,
          predicate: (item) => getParrilladaItemPresentation(item).category === "fish",
        },
        {
          label: "vegetable side",
          min: 2,
          take: 2,
          predicate: (item) => getParrilladaItemPresentation(item).category === "vegetables",
        },
      ],
    },
    {
      name: "generated: sausage + side",
      selectors: [
        {
          label: "sausage starter",
          min: 1,
          take: 1,
          predicate: (item) => getParrilladaItemPresentation(item).category === "sausages",
        },
        {
          label: "side item",
          min: 1,
          take: 1,
          predicate: (item) => getParrilladaItemPresentation(item).role === "side",
        },
      ],
    },
    {
      name: "generated: advanced long-cook + fast finish",
      selectors: [
        {
          label: "advanced long-cook",
          min: 1,
          take: 1,
          predicate: (item) => {
            const presentation = getParrilladaItemPresentation(item);
            return presentation.visibility === "advanced" && presentation.role === "longCook";
          },
        },
        {
          label: "fast-finish item",
          min: 1,
          take: 1,
          predicate: (item) => getParrilladaItemPresentation(item).role === "fastFinish",
        },
      ],
    },
    {
      name: "generated: timing-sensitive + flexible",
      selectors: [
        {
          label: "timing-sensitive",
          min: 1,
          take: 1,
          predicate: (item) => item.planningMetadata?.timingSensitivity === "high",
        },
        {
          label: "flexible",
          min: 1,
          take: 1,
          predicate: (item) =>
            item.planningMetadata?.timingSensitivity === "low" ||
            (item.planningMetadata?.canHoldWarm === true && item.planningMetadata?.timingSensitivity === "medium"),
        },
      ],
    },
    {
      name: "generated: holdable main + delicate side",
      selectors: [
        {
          label: "holdable main",
          min: 1,
          take: 1,
          predicate: (item) => {
            const presentation = getParrilladaItemPresentation(item);
            return (
              (presentation.role === "main" || presentation.role === "longCook") &&
              item.planningMetadata?.canHoldWarm === true
            );
          },
        },
        {
          label: "delicate side",
          min: 1,
          take: 1,
          predicate: (item) => {
            const presentation = getParrilladaItemPresentation(item);
            return presentation.role === "fastFinish" && item.planningMetadata?.canHoldWarm === false;
          },
        },
      ],
    },
  ];

  const generatedScenarios: Scenario[] = [];
  for (const family of generatedFamilies) {
    const built = buildGeneratedScenario(family, sortedCatalogItems);
    if (built.skip) {
      skippedScenarios.push(built.skip);
      continue;
    }
    if (built.scenario) generatedScenarios.push(built.scenario);
  }

  const compatibilityCatalogScenarios: Scenario[] = [
    {
      name: "catalog: ribeye + asparagus",
      items: pickItemsByCutId(catalog.items, ["ribeye", "asparagus"], "catalog: ribeye + asparagus"),
      metadataCoverageRequired: true,
    },
    {
      name: "catalog: picanha + iberian_secreto + asparagus",
      items: pickItemsByCutId(
        catalog.items,
        ["picanha", "iberian_secreto", "asparagus"],
        "catalog: picanha + iberian_secreto + asparagus",
      ),
      metadataCoverageRequired: true,
    },
    {
      name: "catalog: chicken_wing + corn_on_cob",
      items: pickItemsByCutId(catalog.items, ["chicken_wing", "corn_on_cob"], "catalog: chicken_wing + corn_on_cob"),
      metadataCoverageRequired: true,
    },
    {
      name: "catalog: salmon + asparagus + corn_on_cob",
      items: pickItemsByCutId(
        catalog.items,
        ["salmon", "asparagus", "corn_on_cob"],
        "catalog: salmon + asparagus + corn_on_cob",
      ),
      metadataCoverageRequired: true,
    },
    {
      name: "catalog: default 4-item menu",
      items: pickItemsByCutId(
        catalog.items,
        ["picanha", "iberian_secreto", "chicken_wing", "asparagus"],
        "catalog: default 4-item menu",
      ),
      metadataCoverageRequired: true,
    },
  ];
  const scenarios = [...demoScenarios, ...catalogScenarios, ...generatedScenarios, ...compatibilityCatalogScenarios];

  let passed = 0;
  const coveredCutIds = new Set<string>();
  const coveredAdvancedCutIds = new Set<string>();
  const warningSeverityCounts = { info: 0, warning: 0, critical: 0 };
  console.log("Parrillada scheduler QA");
  console.log("-----------------------");
  if (skippedScenarios.length > 0) {
    skippedScenarios.forEach((skip) => console.log(`SKIP | ${skip.name} | ${skip.reason}`));
  }

  let failed = false;
  for (const scenario of scenarios) {
    validateLiteItemCount(scenario.name, scenario.items);
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
      if (scenario.metadataCoverageRequired) validateMetadataCoverage(scenario.items);
      scenario.items.forEach((item) => {
        coveredCutIds.add(item.cutId);
        if (getParrilladaItemPresentation(item).visibility === "advanced") coveredAdvancedCutIds.add(item.cutId);
      });
      result.warnings.forEach((warning) => {
        warningSeverityCounts[warning.severity] += 1;
      });
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
      failed = true;
      break;
    }
  }

  console.log("");
  console.log("Parrillada QA summary");
  console.log("---------------------");
  console.log(`Scenarios passed: ${passed}/${scenarios.length}`);
  console.log(`Scenarios skipped: ${skippedScenarios.length}`);
  console.log(`Included items covered: ${coveredCutIds.size}`);
  console.log(`Advanced items covered: ${coveredAdvancedCutIds.size}`);
  console.log(
    `Warnings by severity (info/warning/critical): ${warningSeverityCounts.info}/${warningSeverityCounts.warning}/${warningSeverityCounts.critical}`,
  );
  if (!failed && passed === scenarios.length) console.log("Parrillada QA passed.");
}

main();
