import path from "path";
import { spawnSync } from "child_process";
import { parseCutProfiles, validateCutProfiles } from "./cuts-data.mjs";

const { sourcePath, count, errors } = validateCutProfiles();
const regressionErrors = validateRegressionChecks();
const bridgeCheckError = runBridgeRegressionCheck();

if (errors.length > 0 || regressionErrors.length > 0 || bridgeCheckError) {
  console.error(`Cut profile validation failed: ${path.relative(process.cwd(), sourcePath)}`);
  errors.forEach((error) => console.error(`- ${error}`));
  regressionErrors.forEach((error) => console.error(`- ${error}`));
  if (bridgeCheckError) console.error(`- ${bridgeCheckError}`);
  process.exit(1);
}

console.log(`Cut profile validation passed: ${count} profiles`);

function validateRegressionChecks() {
  const { profiles } = parseCutProfiles();
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const regressions = [];

  const tuna = profileById.get("tuna_steak");
  if (!tuna) {
    regressions.push(`Missing required profile: tuna_steak`);
  } else if (tuna.allowedDoneness.includes("medium")) {
    regressions.push(`tuna_steak must not include "medium" unless explicitly declared as medium in CSV`);
  }

  const groundBeef = profileById.get("ground_beef");
  if (!groundBeef) {
    regressions.push(`Missing required profile: ground_beef`);
  } else if (
    groundBeef.allowedDoneness.length !== 1 ||
    groundBeef.allowedDoneness[0] !== "well_done"
  ) {
    regressions.push(`ground_beef must map to ["well_done"] only`);
  }

  const ribeye = profileById.get("ribeye");
  if (!ribeye) {
    regressions.push(`Missing required profile: ribeye`);
  } else {
    if (!ribeye.displayNameEsEs) regressions.push(`ribeye must include displayNameEsEs from CSV`);
    if (!ribeye.displayNameFi) regressions.push(`ribeye must include displayNameFi from CSV`);
    if (!ribeye.zone || !ribeye.anatomicalArea) {
      regressions.push(`ribeye must include zone/anatomicalArea from CSV zone`);
    }
  }

  if (groundBeef) {
    if (!groundBeef.shortDescriptionEn) {
      regressions.push(`ground_beef must include shortDescriptionEn`);
    }
    if (!groundBeef.safetyNoteEn) {
      regressions.push(`ground_beef must include safetyNoteEn`);
    }
    if (groundBeef.notesEn !== groundBeef.shortDescriptionEn) {
      regressions.push(`ground_beef notesEn must match shortDescriptionEn and not mix safety_note`);
    }
  }

  const requiredGeneratedCuts = [
    "ribeye",
    "striploin",
    "chuck_roast",
    "pork_shoulder",
    "tuna_steak",
    "asparagus",
  ];
  for (const cutId of requiredGeneratedCuts) {
    const profile = profileById.get(cutId);
    if (!profile) {
      regressions.push(`Missing required generated profile: ${cutId}`);
      continue;
    }

    const syntheticMinutes = resolveSyntheticCookingMinutes(profile);
    if (!Number.isFinite(syntheticMinutes) || syntheticMinutes <= 0) {
      regressions.push(`${cutId} must resolve a valid synthetic cooking time (> 0 minutes)`);
    }
  }

  return regressions;
}

function resolveSyntheticCookingMinutes(profile) {
  if (profile.estimatedTimeMinPerCm) {
    return Math.round(profile.defaultThicknessCm * profile.estimatedTimeMinPerCm);
  }
  if (profile.estimatedTotalTimeMin) return profile.estimatedTotalTimeMin;
  if (profile.cookingMinutes) return profile.cookingMinutes;

  if (profile.animalId === "vegetables") return 12;
  if (profile.animalId === "fish") return profile.category === "whole" ? 30 : 14;
  if (profile.animalId === "chicken") return profile.category === "whole" ? 80 : 35;
  if (profile.animalId === "pork") {
    if (
      profile.category === "bbq" ||
      profile.category === "ribs" ||
      profile.category === "roast" ||
      profile.category === "shoulder"
    ) {
      return 180;
    }
    return 30;
  }
  if (profile.animalId === "beef") {
    if (profile.category === "bbq" || profile.category === "roast" || profile.category === "shoulder") return 150;
    return 20;
  }
  return 30;
}

function runBridgeRegressionCheck() {
  const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/check-generated-resolve.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.error) {
    return `Bridge regression check failed to run: ${result.error.message}`;
  }

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    return output || `Bridge regression check failed with exit code ${result.status}`;
  }

  return null;
}
