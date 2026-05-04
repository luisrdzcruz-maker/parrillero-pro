/**
 * Edge-case harness for the local cooking engine (no API).
 * Run: npx tsx scripts/cooking-edge-cases.ts
 *
 * "Unstable" = structural failure, invalid step durations, or (when the catalog
 * says thickness matters) 1cm vs 10cm producing identical plan+steps.
 * Vegetables with showThickness=false: thickness is ignored by design (listed separately).
 */

import {
  animalDoneness,
  type AnimalId,
  type CookingInput,
  type CookingPlan,
  type CookingStep,
} from "../lib/cookingCatalog";
import { generateCookingPlan, generateCookingSteps, getCutById } from "../lib/cookingEngine";
import { normalizeCookingOutput } from "../lib/normalization/normalizeCookingOutput";

const LANGUAGE = "es" as const;
const WEIGHT_KG = "1";
const THIN = "1";
const THICK = "10";

/** Matches app `equipmentOptions` in app/page.tsx */
const ALL_EQUIPMENT = [
  "parrilla gas",
  "parrilla carbón",
  "kamado",
  "cocina interior",
  "Napoleon Rogue 525-2",
] as const;

/** One representative cut per food category (meat) + one vegetable */
const CATEGORY_CUTS: { animalId: AnimalId; labelEs: string; cutId: string }[] = [
  { animalId: "beef", labelEs: "Vacuno", cutId: "entrecote" },
  { animalId: "pork", labelEs: "Cerdo", cutId: "secreto_iberico" },
  { animalId: "chicken", labelEs: "Pollo", cutId: "pechuga" },
  { animalId: "fish", labelEs: "Pescado", cutId: "salmon" },
  { animalId: "vegetables", labelEs: "Verduras", cutId: "maiz" },
];

function extremeDonenessPair(animalId: AnimalId): { low: string; high: string } {
  if (animalId === "vegetables") {
    return { low: "medium", high: "medium" };
  }
  const list = animalDoneness[animalId];
  return { low: list[0]!, high: list[list.length - 1]! };
}

type UnstableRow = {
  kind: "meat" | "vegetable";
  cutId: string;
  doneness: string;
  equipment: string;
  thicknessCm: string;
  reasons: string[];
};

function buildInput(
  labelEs: string,
  cutId: string,
  thickness: string,
  doneness: string,
  equipment: string,
): CookingInput {
  return {
    animal: labelEs,
    cut: cutId,
    weightKg: WEIGHT_KG,
    thicknessCm: thickness,
    doneness,
    equipment,
    language: LANGUAGE,
  };
}

function checkPlanStructure(plan: CookingPlan | null): string[] {
  const r: string[] = [];
  if (plan == null) return ["plan is null"];
  const normalized = normalizeCookingOutput(plan) as CookingPlan;
  // Guardrail: after normalization, read canonical keys only.
  if (!String(plan.SETUP ?? "").trim()) r.push("empty SETUP");
  const t = normalized.times ?? plan.TIMES;
  if (!String(t ?? "").trim()) r.push("empty times/TIMES");
  const temp = normalized.temperature ?? plan.TEMPERATURE;
  if (!String(temp ?? "").trim()) r.push("empty temperature/TEMPERATURE");
  const p = normalized.steps ?? plan.STEPS;
  if (!String(p ?? "").trim()) r.push("empty steps/STEPS");
  return r;
}

function checkStepDurations(steps: CookingStep[] | null): string[] {
  const r: string[] = [];
  if (steps == null) return ["steps is null"];
  if (steps.length === 0) r.push("steps empty");
  for (let i = 0; i < steps.length; i++) {
    const d = steps[i]!.duration;
    if (typeof d !== "number" || !Number.isFinite(d)) {
      r.push(`step[${i}] duration not finite: ${d}`);
    } else if (d <= 0) {
      r.push(`step[${i}] duration <= 0: ${d}`);
    }
  }
  return r;
}

function snapshot(plan: CookingPlan | null, steps: CookingStep[] | null): string {
  return JSON.stringify({ plan, steps });
}

function analyzeOne(
  input: CookingInput,
  identical1vs10: boolean,
  showThickness: boolean,
): string[] {
  const plan = generateCookingPlan(input);
  const steps = generateCookingSteps(input);
  const out = [...checkPlanStructure(plan), ...checkStepDurations(steps)];
  if (showThickness && identical1vs10) {
    out.push(
      "thickness 1cm vs 10cm → identical plan+steps while catalog has showThickness=true (unexpected)",
    );
  }
  return out;
}

function main() {
  const unstable: UnstableRow[] = [];
  const thicknessIgnoredNotes: string[] = [];
  let meatRunCount = 0;
  let vegRunCount = 0;

  for (const { animalId, labelEs, cutId } of CATEGORY_CUTS) {
    const isVeg = animalId === "vegetables";
    const kind: "meat" | "vegetable" = isVeg ? "vegetable" : "meat";
    const cut = getCutById(cutId);
    if (!cut) {
      console.error(`Unknown cut: ${cutId}`);
      process.exitCode = 1;
      return;
    }
    const showThickness = cut.showThickness;
    const { low, high } = extremeDonenessPair(animalId);
    const donenessList = isVeg ? [low] : [low, high];

    for (const doneness of donenessList) {
      for (const equipment of ALL_EQUIPMENT) {
        const thin = buildInput(labelEs, cutId, THIN, doneness, equipment);
        const thck = buildInput(labelEs, cutId, THICK, doneness, equipment);
        const sameOutput =
          snapshot(generateCookingPlan(thin), generateCookingSteps(thin)) ===
          snapshot(generateCookingPlan(thck), generateCookingSteps(thck));

        if (!showThickness && sameOutput) {
          thicknessIgnoredNotes.push(
            `${cutId} (${animalId}) · doneness ${doneness} · ${equipment}: 1cm and 10cm → same output (showThickness=false in catalog)`,
          );
        }

        for (const thickness of [THIN, THICK] as const) {
          if (kind === "meat") meatRunCount += 1;
          else vegRunCount += 1;

          const input = buildInput(labelEs, cutId, thickness, doneness, equipment);
          const reasons = analyzeOne(input, sameOutput, showThickness);
          if (reasons.length > 0) {
            unstable.push({
              kind,
              cutId,
              doneness,
              equipment,
              thicknessCm: `${thickness} cm`,
              reasons,
            });
          }
        }
      }
    }
  }

  console.log(
    "Cooking engine — edge cases (1cm & 10cm, extreme doneness, all equipment, meat vs veg)\n",
  );
  console.log(
    `Runs: ${meatRunCount + vegRunCount} (meat rows: ${meatRunCount} · vegetable rows: ${vegRunCount})`,
  );
  console.log(`Unstable combinations: ${unstable.length}\n`);

  if (unstable.length > 0) {
    for (const u of unstable) {
      console.log(`• [${u.kind}] ${u.cutId} · ${u.doneness} · ${u.thicknessCm} · ${u.equipment}`);
      for (const r of u.reasons) console.log(`    - ${r}`);
      console.log("");
    }
  } else {
    console.log("No unstable combinations in this matrix.\n");
  }

  const uniqueNotes = [...new Set(thicknessIgnoredNotes)];
  if (uniqueNotes.length > 0) {
    console.log("Thickness 1cm/10cm ignored (expected for these catalog cuts):");
    for (const line of uniqueNotes.slice(0, 12)) {
      console.log(`  - ${line}`);
    }
    if (uniqueNotes.length > 12) console.log(`  ... +${uniqueNotes.length - 12} more`);
    console.log("");
  }

  if (unstable.length > 0) process.exitCode = 1;
}

main();
