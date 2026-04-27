/**
 * Snapshot tests for the local cooking engine (plan + steps).
 * Reference: tests/snapshots/cooking-engine.json
 *
 * Compare:  npx tsx scripts/cooking-snapshots.ts
 * Update ref: npx tsx scripts/cooking-snapshots.ts --update
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { animalCatalog, type AnimalId, type CookingInput, type CookingPlan, type CookingStep } from "../lib/cookingCatalog";
import { generateCookingPlan, generateCookingSteps, getCutsByAnimal, getDonenessOptions } from "../lib/cookingEngine";

const SNAPSHOT_VERSION = 1 as const;
const SNAPSHOT_PATH = join(process.cwd(), "tests", "snapshots", "cooking-engine.json");

const THICKNESS_CM = { thin: "2", medium: "5", thick: "8" } as const;
const EQUIPMENT = ["parrilla gas", "parrilla carbón", "kamado", "cocina interior"] as const;
const LANGUAGE: "es" = "es";
const WEIGHT_KG = "1";

type CaseRecord = {
  input: CookingInput;
  plan: CookingPlan | null;
  steps: CookingStep[] | null;
};

type CookingEngineSnapshotFile = {
  version: typeof SNAPSHOT_VERSION;
  cases: Record<string, CaseRecord>;
};

function donenessListForAnimal(animalId: AnimalId): string[] {
  const options = getDonenessOptions(animalId);
  if (options.length > 0) return options.map((d) => d.id);
  return ["medium"];
}

function caseKey(animalId: AnimalId, cutId: string, doneness: string, thicknessCm: string, equipment: string): string {
  return [animalId, cutId, doneness, thicknessCm, equipment].join("|");
}

function buildCases(): Record<string, CaseRecord> {
  const cases: Record<string, CaseRecord> = {};
  for (const animal of animalCatalog) {
    const animalLabel = animal.names.es;
    for (const cut of getCutsByAnimal(animal.id)) {
      for (const doneness of donenessListForAnimal(animal.id)) {
        for (const thickness of Object.values(THICKNESS_CM)) {
          for (const equipment of EQUIPMENT) {
            const input: CookingInput = {
              animal: animalLabel,
              cut: cut.id,
              weightKg: WEIGHT_KG,
              thicknessCm: thickness,
              doneness,
              equipment,
              language: LANGUAGE,
            };
            const key = caseKey(animal.id, cut.id, doneness, thickness, equipment);
            cases[key] = {
              input,
              plan: generateCookingPlan(input),
              steps: generateCookingSteps(input),
            };
          }
        }
      }
    }
  }
  return cases;
}

function sortCaseKeys(cases: Record<string, CaseRecord>): Record<string, CaseRecord> {
  const out: Record<string, CaseRecord> = {};
  for (const k of Object.keys(cases).sort()) out[k] = cases[k];
  return out;
}

function loadSnapshot(): CookingEngineSnapshotFile | null {
  if (!existsSync(SNAPSHOT_PATH)) return null;
  const raw = readFileSync(SNAPSHOT_PATH, "utf8");
  return JSON.parse(raw) as CookingEngineSnapshotFile;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type DiffItem = { key: string; reason: "missing_baseline" | "missing_new" | "mismatch" };

function diffSnapshots(
  baseline: Record<string, CaseRecord> | undefined,
  next: Record<string, CaseRecord>,
): DiffItem[] {
  const diffs: DiffItem[] = [];
  const base = baseline ?? {};
  const bKeys = new Set(Object.keys(base));
  const nKeys = new Set(Object.keys(next));

  for (const k of nKeys) {
    if (!bKeys.has(k)) {
      diffs.push({ key: k, reason: "missing_baseline" });
    } else if (!deepEqual(base[k], next[k])) {
      diffs.push({ key: k, reason: "mismatch" });
    }
  }
  for (const k of bKeys) {
    if (!nKeys.has(k)) diffs.push({ key: k, reason: "missing_new" });
  }
  return diffs;
}

function printDiffDetail(current: CaseRecord, baseline: CaseRecord | undefined) {
  if (!baseline) {
    console.log("  (no baseline to print)");
    return;
  }
  const sCur = JSON.stringify(current, null, 2);
  const sBase = JSON.stringify(baseline, null, 2);
  if (sCur.length < 2000 && sBase.length < 2000) {
    console.log("  --- baseline");
    console.log(sBase.split("\n").map((l) => "  " + l).join("\n"));
    console.log("  +++ current");
    console.log(sCur.split("\n").map((l) => "  " + l).join("\n"));
  } else {
    console.log("  (large payload; use a JSON diff on this case or `git diff` after a dry update.)");
  }
}

function main() {
  const update = process.argv.includes("--update");
  const cases = buildCases();
  const sorted = sortCaseKeys(cases);
  const payload: CookingEngineSnapshotFile = { version: SNAPSHOT_VERSION, cases: sorted };

  if (update) {
    mkdirSync(join(process.cwd(), "tests", "snapshots"), { recursive: true });
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
    console.log(`Wrote ${Object.keys(cases).length} cases to ${SNAPSHOT_PATH}`);
    return;
  }

  const loaded = loadSnapshot();
  if (!loaded) {
    console.error("Missing snapshot. Run: npx tsx scripts/cooking-snapshots.ts --update");
    process.exitCode = 1;
    return;
  }
  if (loaded.version !== SNAPSHOT_VERSION) {
    console.error(`Snapshot version ${loaded.version} != ${SNAPSHOT_VERSION}. Re-run with --update after reviewing.`);
    process.exitCode = 1;
    return;
  }

  const diffs = diffSnapshots(loaded.cases, sorted);
  if (diffs.length === 0) {
    console.log(`OK — ${Object.keys(sorted).length} cooking engine snapshots match.`);
    return;
  }

  console.log(`MISMATCH: ${diffs.length} case(s) differ from ${SNAPSHOT_PATH}\n`);
  for (const d of diffs) {
    const next = sorted[d.key]!;
    const base = loaded.cases[d.key];
    console.log(`- ${d.key}  (${d.reason})`);
    if (d.reason === "mismatch" && base) {
      printDiffDetail(next, base);
    } else if (d.reason === "missing_baseline") {
      console.log("  (new case not in reference file; run --update to accept)");
    } else {
      console.log("  (case removed from current matrix — update snapshot or remove ref)");
    }
    console.log("");
  }
  process.exitCode = 1;
}

main();
