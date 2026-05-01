import fs from "fs";
import path from "path";

export const CUT_PROFILES_SOURCE = path.join("data", "cuts", "cut-profiles.csv");
export const CUT_PROFILES_OUTPUT = path.join("lib", "generated", "cutProfiles.ts");

export const EXPECTED_HEADERS = [
  "id",
  "animal_id",
  "canonical_name_en",
  "input_profile_id",
  "default_thickness_cm",
  "show_thickness",
  "allowed_methods",
  "default_method",
  "allowed_doneness",
  "style",
  "resting_minutes",
  "cooking_minutes",
  "error_en",
  "aliases_en",
  "notes_en",
  "tips_en",
];

export const ANIMAL_IDS = ["beef", "pork", "chicken", "fish", "vegetables"];
export const INPUT_PROFILE_IDS = [
  "beef-large",
  "beef-steak",
  "pork-fast",
  "chicken-breast",
  "poultry-whole",
  "fish-fillet",
  "fish-whole",
  "vegetable-format",
  "default",
];
export const COOKING_METHODS = [
  "grill_direct",
  "grill_indirect",
  "reverse_sear",
  "oven_pan",
  "vegetables_grill",
];
export const DONENESS_IDS = [
  "blue",
  "rare",
  "medium_rare",
  "medium",
  "medium_well",
  "well_done",
  "juicy_safe",
  "medium_safe",
  "safe",
  "juicy",
];
export const COOKING_STYLES = [
  "fast",
  "thick",
  "reverse",
  "fatcap",
  "lowSlow",
  "crispy",
  "poultry",
  "fish",
  "vegetable",
];

export function readCutProfilesCsv(root = process.cwd()) {
  const sourcePath = path.join(root, CUT_PROFILES_SOURCE);
  const csv = fs.readFileSync(sourcePath, "utf8").trim();
  const rows = parseCsv(csv);
  const [headers, ...dataRows] = rows;

  const profiles = dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row, index) => {
      const record = {};
      headers.forEach((header, columnIndex) => {
        record[header] = row[columnIndex] ?? "";
      });
      return { line: index + 2, record };
    });

  return { sourcePath, headers, profiles };
}

export function parseCutProfiles(root = process.cwd()) {
  const { sourcePath, headers, profiles } = readCutProfilesCsv(root);
  return {
    sourcePath,
    headers,
    profiles: profiles.map(({ line, record }) => normalizeCutProfile(record, line)),
  };
}

export function validateCutProfiles(root = process.cwd()) {
  const { sourcePath, headers, profiles } = readCutProfilesCsv(root);
  const errors = [];

  if (headers.join(",") !== EXPECTED_HEADERS.join(",")) {
    errors.push(
      `Header mismatch in ${CUT_PROFILES_SOURCE}. Expected: ${EXPECTED_HEADERS.join(",")}`
    );
  }

  const seenIds = new Set();
  for (const { line, record } of profiles) {
    validateRecord(record, line, seenIds, errors);
  }

  return { sourcePath, count: profiles.length, errors };
}

export function normalizeCutProfile(record, line) {
  return {
    id: record.id,
    animalId: record.animal_id,
    canonicalNameEn: record.canonical_name_en,
    inputProfileId: record.input_profile_id,
    defaultThicknessCm: Number(record.default_thickness_cm),
    showThickness: record.show_thickness === "true",
    allowedMethods: parseList(record.allowed_methods),
    defaultMethod: record.default_method,
    allowedDoneness: parseList(record.allowed_doneness),
    style: record.style,
    restingMinutes: Number(record.resting_minutes),
    cookingMinutes: record.cooking_minutes ? Number(record.cooking_minutes) : undefined,
    errorEn: record.error_en,
    aliasesEn: parseList(record.aliases_en),
    notesEn: emptyToUndefined(record.notes_en),
    tipsEn: parseList(record.tips_en),
    sourceLine: line,
  };
}

function validateRecord(record, line, seenIds, errors) {
  requireValue(record.id, line, "id", errors);
  requireValue(record.animal_id, line, "animal_id", errors);
  requireValue(record.canonical_name_en, line, "canonical_name_en", errors);
  requireValue(record.input_profile_id, line, "input_profile_id", errors);
  requireValue(record.default_method, line, "default_method", errors);
  requireValue(record.style, line, "style", errors);
  requireValue(record.error_en, line, "error_en", errors);

  if (record.id && !/^[a-z0-9_]+$/.test(record.id)) {
    errors.push(`Line ${line}: id must be snake_case lowercase: ${record.id}`);
  }
  if (seenIds.has(record.id)) {
    errors.push(`Line ${line}: duplicate id: ${record.id}`);
  }
  seenIds.add(record.id);

  expectOneOf(record.animal_id, ANIMAL_IDS, line, "animal_id", errors);
  expectOneOf(record.input_profile_id, INPUT_PROFILE_IDS, line, "input_profile_id", errors);
  expectOneOf(record.default_method, COOKING_METHODS, line, "default_method", errors);
  expectOneOf(record.style, COOKING_STYLES, line, "style", errors);
  expectBoolean(record.show_thickness, line, "show_thickness", errors);
  expectPositiveNumber(record.default_thickness_cm, line, "default_thickness_cm", errors);
  expectPositiveNumber(record.resting_minutes, line, "resting_minutes", errors);

  const allowedMethods = parseList(record.allowed_methods);
  if (allowedMethods.length === 0) {
    errors.push(`Line ${line}: allowed_methods must contain at least one method`);
  }
  allowedMethods.forEach((method) => expectOneOf(method, COOKING_METHODS, line, "allowed_methods", errors));
  if (record.default_method && !allowedMethods.includes(record.default_method)) {
    errors.push(`Line ${line}: default_method must be present in allowed_methods`);
  }

  const allowedDoneness = parseList(record.allowed_doneness);
  allowedDoneness.forEach((doneness) =>
    expectOneOf(doneness, DONENESS_IDS, line, "allowed_doneness", errors)
  );
  if (record.animal_id === "vegetables" && allowedDoneness.length > 0) {
    errors.push(`Line ${line}: vegetables must not define allowed_doneness`);
  }
  if (record.animal_id !== "vegetables" && allowedDoneness.length === 0) {
    errors.push(`Line ${line}: non-vegetable cuts must define allowed_doneness`);
  }

  if (record.cooking_minutes) {
    expectPositiveNumber(record.cooking_minutes, line, "cooking_minutes", errors);
  }
  if (record.animal_id === "vegetables" && !record.cooking_minutes) {
    errors.push(`Line ${line}: vegetables must define cooking_minutes`);
  }
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      value += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += char;
  }

  row.push(value);
  rows.push(row);
  return rows;
}

function parseList(value = "") {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyToUndefined(value) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function requireValue(value, line, field, errors) {
  if (!value || value.trim() === "") {
    errors.push(`Line ${line}: ${field} is required`);
  }
}

function expectOneOf(value, allowed, line, field, errors) {
  if (value && !allowed.includes(value)) {
    errors.push(`Line ${line}: ${field} has unsupported value "${value}"`);
  }
}

function expectBoolean(value, line, field, errors) {
  if (value !== "true" && value !== "false") {
    errors.push(`Line ${line}: ${field} must be true or false`);
  }
}

function expectPositiveNumber(value, line, field, errors) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    errors.push(`Line ${line}: ${field} must be a positive number`);
  }
}
