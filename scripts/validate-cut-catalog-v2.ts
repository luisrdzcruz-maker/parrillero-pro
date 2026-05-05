import { readFileSync } from "node:fs";
import { join } from "node:path";

type CsvRow = Record<string, string>;

type CsvFile = {
  headers: string[];
  rows: CsvRow[];
};

const dataDir = join(process.cwd(), "data", "cuts");

const files = {
  catalog: join(dataDir, "cut_catalog_v2.csv"),
  cookingProfiles: join(dataDir, "cooking_profiles_v2.csv"),
  prepProfiles: join(dataDir, "prep_profiles_v2.csv"),
} as const;

const requiredColumns = {
  catalog: [
    "schema_version",
    "animal",
    "cut_id",
    "variant_id",
    "cooking_profile",
    "prep_profile",
    "temperature_mode",
    "hide_doneness_selector",
    "has_fat_cap",
    "fat_cap_behavior",
    "flare_up_risk",
    "requires_move_on_flareup",
    "setup_minutes_min",
    "setup_minutes_max",
    "active_cook_min_minutes",
    "active_cook_max_minutes",
    "rest_min_minutes",
    "rest_max_minutes",
    "cut_plan_minutes_min",
    "cut_plan_minutes_max",
    "session_total_minutes_min",
    "session_total_minutes_max",
    "warning_codes",
  ],
  cookingProfiles: ["schema_version", "profile_id"],
  prepProfiles: ["schema_version", "prep_profile_id"],
} as const;

const errors: string[] = [];
const allowedTemperatureModes = new Set([
  "doneness_target",
  "safe_temp",
  "texture_breakdown",
  "visual_only",
  "delicate_target",
]);
const textureBreakdownCutIds = new Set(["chuck_roast", "brisket", "beef_short_ribs", "pork_ribs"]);
const donenessTargetCutIds = new Set(["tri_tip", "ribeye"]);

function parseCsv(content: string, fileLabel: string): CsvFile {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      record.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      record.push(field);
      if (record.some((value) => value.length > 0)) {
        records.push(record);
      }
      field = "";
      record = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field);
    if (record.some((value) => value.length > 0)) {
      records.push(record);
    }
  }

  const [headers, ...dataRecords] = records;
  if (!headers) {
    errors.push(`${fileLabel}: file is empty.`);
    return { headers: [], rows: [] };
  }

  const rows = dataRecords.map((record, rowIndex) => {
    if (record.length !== headers.length) {
      errors.push(
        `${fileLabel}: row ${rowIndex + 2} has ${record.length} columns, expected ${headers.length}.`,
      );
    }

    return Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""]));
  });

  return { headers, rows };
}

function readCsv(path: string, fileLabel: string): CsvFile {
  return parseCsv(readFileSync(path, "utf8"), fileLabel);
}

function validateRequiredColumns(fileLabel: string, csv: CsvFile, columns: readonly string[]) {
  const headerSet = new Set(csv.headers);
  for (const column of columns) {
    if (!headerSet.has(column)) {
      errors.push(`${fileLabel}: missing required column "${column}".`);
    }
  }
}

function parseMinutes(row: CsvRow, column: string, rowLabel: string): number | undefined {
  const rawValue = row[column];
  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    errors.push(`${rowLabel}: "${column}" must be a number, got "${rawValue}".`);
    return undefined;
  }

  return value;
}

function validateSum(row: CsvRow, rowLabel: string, resultColumn: string, leftColumn: string, rightColumn: string) {
  const result = parseMinutes(row, resultColumn, rowLabel);
  const left = parseMinutes(row, leftColumn, rowLabel);
  const right = parseMinutes(row, rightColumn, rowLabel);

  if (result === undefined || left === undefined || right === undefined) {
    return;
  }

  if (result !== left + right) {
    errors.push(`${rowLabel}: "${resultColumn}" must equal "${leftColumn}" + "${rightColumn}".`);
  }
}

function isHighFlareUpWarningCode(code: string) {
  return /flare|move.*indirect|indirect.*flare/i.test(code);
}

function isTrue(value: string) {
  return value.trim().toLowerCase() === "true";
}

function splitCodes(value: string) {
  return value
    .split("|")
    .map((code) => code.trim())
    .filter(Boolean);
}

const catalog = readCsv(files.catalog, "cut_catalog_v2.csv");
const cookingProfiles = readCsv(files.cookingProfiles, "cooking_profiles_v2.csv");
const prepProfiles = readCsv(files.prepProfiles, "prep_profiles_v2.csv");

validateRequiredColumns("cut_catalog_v2.csv", catalog, requiredColumns.catalog);
validateRequiredColumns("cooking_profiles_v2.csv", cookingProfiles, requiredColumns.cookingProfiles);
validateRequiredColumns("prep_profiles_v2.csv", prepProfiles, requiredColumns.prepProfiles);

const cookingProfileIds = new Set(cookingProfiles.rows.map((row) => row.profile_id).filter(Boolean));
const prepProfileIds = new Set(prepProfiles.rows.map((row) => row.prep_profile_id).filter(Boolean));

let hasBoneInChuleton = false;

for (const [index, row] of catalog.rows.entries()) {
  const rowLabel = `cut_catalog_v2.csv row ${index + 2} (${row.cut_id || "missing cut_id"}:${
    row.variant_id || "missing variant_id"
  })`;

  if (!cookingProfileIds.has(row.cooking_profile)) {
    errors.push(`${rowLabel}: cooking_profile "${row.cooking_profile}" does not exist.`);
  }

  if (!prepProfileIds.has(row.prep_profile)) {
    errors.push(`${rowLabel}: prep_profile "${row.prep_profile}" does not exist.`);
  }

  validateSum(row, rowLabel, "cut_plan_minutes_min", "active_cook_min_minutes", "rest_min_minutes");
  validateSum(row, rowLabel, "cut_plan_minutes_max", "active_cook_max_minutes", "rest_max_minutes");
  validateSum(row, rowLabel, "session_total_minutes_min", "setup_minutes_min", "cut_plan_minutes_min");
  validateSum(row, rowLabel, "session_total_minutes_max", "setup_minutes_max", "cut_plan_minutes_max");

  if (!allowedTemperatureModes.has(row.temperature_mode)) {
    errors.push(`${rowLabel}: temperature_mode "${row.temperature_mode}" is not supported.`);
  }

  if (row.temperature_mode === "texture_breakdown" && !isTrue(row.hide_doneness_selector)) {
    errors.push(`${rowLabel}: texture_breakdown rows must hide the doneness selector.`);
  }

  if (row.temperature_mode === "visual_only" && !isTrue(row.hide_doneness_selector)) {
    errors.push(`${rowLabel}: visual_only rows must hide the doneness selector.`);
  }

  if (row.animal === "chicken") {
    if (row.temperature_mode !== "safe_temp") {
      errors.push(`${rowLabel}: chicken rows must use temperature_mode=safe_temp.`);
    }

    if (!isTrue(row.hide_doneness_selector)) {
      errors.push(`${rowLabel}: chicken rows must hide the doneness selector.`);
    }
  }

  if (row.animal === "vegetable" || row.category === "vegetables") {
    if (row.temperature_mode !== "visual_only") {
      errors.push(`${rowLabel}: vegetable rows must use temperature_mode=visual_only.`);
    }
  }

  if (textureBreakdownCutIds.has(row.cut_id) && row.temperature_mode !== "texture_breakdown") {
    errors.push(`${rowLabel}: ${row.cut_id} must use temperature_mode=texture_breakdown.`);
  }

  if (
    donenessTargetCutIds.has(row.cut_id) &&
    row.temperature_mode !== "doneness_target" &&
    row.variant_id !== "unused"
  ) {
    errors.push(`${rowLabel}: ${row.cut_id} must use temperature_mode=doneness_target.`);
  }

  if (row.cut_id === "picanha") {
    const warningCodes = splitCodes(row.warning_codes);
    const hasFatCapOrFlareUpWarning = warningCodes.some((code) => /fat|flare|burn/i.test(code));

    if (!hasFatCapOrFlareUpWarning) {
      errors.push(`${rowLabel}: picanha rows must include fat-cap or flare-up warning codes.`);
    }
  }

  if (isTrue(row.has_fat_cap) && !row.fat_cap_behavior.trim()) {
    errors.push(`${rowLabel}: has_fat_cap=true requires fat_cap_behavior.`);
  }

  if (row.flare_up_risk === "high") {
    const warningCodes = splitCodes(row.warning_codes);
    if (!warningCodes.some(isHighFlareUpWarningCode)) {
      errors.push(`${rowLabel}: flare_up_risk=high requires flare-up/move-to-indirect warning code.`);
    }
  }

  if (row.cut_id === "ribeye" && row.variant_id === "bone_in_chuleton") {
    if (row.temperature_mode !== "doneness_target") {
      errors.push(`${rowLabel}: bone_in_chuleton must use temperature_mode=doneness_target.`);
    }

    hasBoneInChuleton = true;
  }
}

if (!hasBoneInChuleton) {
  errors.push("cut_catalog_v2.csv: missing cut_id=ribeye and variant_id=bone_in_chuleton row.");
}

if (errors.length > 0) {
  console.error("Cut Catalog v2 validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Cut Catalog v2 validation passed.");
console.log(`- Catalog rows: ${catalog.rows.length}`);
console.log(`- Cooking profiles: ${cookingProfiles.rows.length}`);
console.log(`- Prep profiles: ${prepProfiles.rows.length}`);
