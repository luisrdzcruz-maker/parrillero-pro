import fs from "fs";
import path from "path";

export const CUT_PROFILES_SOURCE = path.join("data", "cuts", "parrillero_pro_input_profiles_en.csv");
export const CUT_PROFILES_OUTPUT = path.join("lib", "generated", "cutProfiles.ts");

export const EXPECTED_HEADERS = [
  "animal",
  "category",
  "cut_id",
  "display_name_en",
  "display_name_es_es",
  "display_name_es_ar",
  "display_name_fi",
  "aliases",
  "zone",
  "recommended_methods",
  "difficulty",
  "target_temp_c",
  "estimated_time_min_per_cm",
  "estimated_total_time_min",
  "rest_time_min",
  "recommended_doneness",
  "cutting_direction",
  "safety_note",
  "quick_pick_tags",
  "notes",
];
export const OPTIONAL_HEADERS = [
  "cooking_style",
  "fire_zone",
  "time_type",
  "default_doneness",
  "input_profile_id",
  "confidence_level",
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
export const CSV_COOKING_STYLES = ["fast", "low_slow", "reverse", "fatcap", "poultry", "fish", "vegetable"];
export const FIRE_ZONES = ["direct", "indirect", "mixed"];
export const TIME_TYPES = ["total", "per_cm", "hybrid"];
export const CONFIDENCE_LEVELS = ["high", "medium", "low"];

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

  validateHeaders(headers, errors);

  const seenIds = new Set();
  for (const { line, record } of profiles) {
    validateRecord(record, line, seenIds, errors);
  }

  return { sourcePath, count: profiles.length, errors };
}

export function normalizeCutProfile(record, line) {
  const animalId = record.animal;
  const allowedMethods = normalizeMethods(record.recommended_methods, animalId);
  const defaultMethod = allowedMethods[0] ?? (animalId === "vegetables" ? "vegetables_grill" : "grill_direct");
  const allowedDoneness = normalizeDoneness(record);
  const inferredInputProfileId = inferInputProfileId(record);
  const inferredStyle = inferStyle(record);
  const inferredCsvCookingStyle = mapStyleToCsvCookingStyle(inferredStyle);
  const resolvedCsvCookingStyle = resolveCsvCookingStyle(record.cooking_style, inferredCsvCookingStyle);
  const resolvedStyle = mapCsvCookingStyleToStyle(resolvedCsvCookingStyle) ?? inferredStyle;
  const inferredFireZone = inferFireZone(record, allowedMethods);
  const resolvedFireZone = resolveFireZone(record.fire_zone, inferredFireZone);
  const inferredTimeType = inferTimeType(record);
  const resolvedTimeType = resolveTimeType(record.time_type, inferredTimeType);
  const resolvedDefaultDoneness = resolveDefaultDoneness(record, allowedDoneness);
  const resolvedInputProfileId = emptyToUndefined(record.input_profile_id) ?? inferredInputProfileId;
  const resolvedConfidenceLevel = resolveConfidenceLevel(record);
  const notes = [record.notes, record.safety_note].map((value) => value.trim()).filter(Boolean).join(" ");
  const estimatedTimeMinPerCm = averageRange(record.estimated_time_min_per_cm);
  const estimatedTotalTimeMin = averageRange(record.estimated_total_time_min);
  const tips = [record.quick_pick_tags, record.cutting_direction]
    .flatMap((value) => parseSemicolonList(value))
    .filter(Boolean);

  return {
    id: record.cut_id,
    animalId,
    category: record.category,
    canonicalNameEn: record.display_name_en,
    inputProfileId: resolvedInputProfileId,
    defaultThicknessCm: inferDefaultThicknessCm(record),
    showThickness: shouldShowThickness(record),
    allowedMethods,
    defaultMethod,
    allowedDoneness,
    style: resolvedStyle,
    cookingStyle: resolvedCsvCookingStyle,
    fireZone: resolvedFireZone,
    timeType: resolvedTimeType,
    defaultDoneness: resolvedDefaultDoneness,
    confidenceLevel: resolvedConfidenceLevel,
    restingMinutes: Number(record.rest_time_min),
    estimatedTimeMinPerCm,
    estimatedTotalTimeMin,
    cookingMinutes: estimatedTotalTimeMin,
    targetTempC: averageRange(record.target_temp_c),
    safetyNoteEn: emptyToUndefined(record.safety_note ?? ""),
    errorEn: record.safety_note || record.notes,
    aliasesEn: parseSemicolonList(record.aliases),
    notesEn: emptyToUndefined(notes),
    tipsEn: tips,
    sourceLine: line,
  };
}

function validateRecord(record, line, seenIds, errors) {
  requireValue(record.animal, line, "animal", errors);
  requireValue(record.category, line, "category", errors);
  requireValue(record.cut_id, line, "cut_id", errors);
  requireValue(record.display_name_en, line, "display_name_en", errors);
  requireValue(record.recommended_methods, line, "recommended_methods", errors);
  requireValue(record.difficulty, line, "difficulty", errors);
  requireValue(record.rest_time_min, line, "rest_time_min", errors);
  requireValue(record.recommended_doneness, line, "recommended_doneness", errors);
  requireValue(record.notes, line, "notes", errors);

  if (record.cut_id && !/^[a-z0-9_]+$/.test(record.cut_id)) {
    errors.push(`Line ${line}: cut_id must be snake_case lowercase: ${record.cut_id}`);
  }
  if (seenIds.has(record.cut_id)) {
    errors.push(`Line ${line}: duplicate cut_id: ${record.cut_id}`);
  }
  seenIds.add(record.cut_id);

  expectOneOf(record.animal, ANIMAL_IDS, line, "animal", errors);
  expectPositiveNumber(record.difficulty, line, "difficulty", errors);
  expectPositiveNumber(record.rest_time_min, line, "rest_time_min", errors);

  const difficulty = Number(record.difficulty);
  if (Number.isFinite(difficulty) && (difficulty < 1 || difficulty > 5)) {
    errors.push(`Line ${line}: difficulty must be between 1 and 5`);
  }

  const allowedMethods = normalizeMethods(record.recommended_methods, record.animal);
  if (allowedMethods.length === 0) {
    errors.push(`Line ${line}: recommended_methods must map to at least one supported method`);
  }
  allowedMethods.forEach((method) => expectOneOf(method, COOKING_METHODS, line, "recommended_methods", errors));

  const allowedDoneness = normalizeDoneness(record);
  allowedDoneness.forEach((doneness) => expectOneOf(doneness, DONENESS_IDS, line, "recommended_doneness", errors));
  if (createsMediumFromMediumRare(record, allowedDoneness)) {
    errors.push(
      `Line ${line}: recommended_doneness must not map "medium rare" to bare "medium"`
    );
  }
  if (record.animal === "vegetables" && allowedDoneness.length > 0) {
    errors.push(`Line ${line}: vegetables must not map to generated allowed_doneness`);
  }
  if (record.animal !== "vegetables" && allowedDoneness.length === 0) {
    errors.push(`Line ${line}: non-vegetable cuts must map to generated allowed_doneness`);
  }

  if (record.estimated_total_time_min) {
    expectRangeOrPositiveNumber(record.estimated_total_time_min, line, "estimated_total_time_min", errors);
  }
  if (record.estimated_time_min_per_cm) {
    expectRangeOrPositiveNumber(record.estimated_time_min_per_cm, line, "estimated_time_min_per_cm", errors);
  }
  if (record.target_temp_c) {
    expectRangeOrPositiveNumber(record.target_temp_c, line, "target_temp_c", errors);
  }
  if (record.animal === "vegetables" && !record.estimated_total_time_min) {
    errors.push(`Line ${line}: vegetables must define estimated_total_time_min`);
  }

  if (record.cooking_style) {
    expectOneOf(record.cooking_style, CSV_COOKING_STYLES, line, "cooking_style", errors);
  }
  if (record.fire_zone) {
    expectOneOf(record.fire_zone, FIRE_ZONES, line, "fire_zone", errors);
  }
  if (record.time_type) {
    expectOneOf(record.time_type, TIME_TYPES, line, "time_type", errors);
  }
  if (record.default_doneness) {
    const normalizedDefaultDoneness = normalizeSingleDoneness(record.default_doneness);
    if (!normalizedDefaultDoneness) {
      errors.push(`Line ${line}: default_doneness has unsupported value "${record.default_doneness}"`);
    } else if (!allowedDoneness.includes(normalizedDefaultDoneness)) {
      errors.push(`Line ${line}: default_doneness must be included in allowed_doneness`);
    }
  }
  if (record.input_profile_id) {
    expectOneOf(record.input_profile_id, INPUT_PROFILE_IDS, line, "input_profile_id", errors);
  }
  if (record.confidence_level) {
    expectOneOf(record.confidence_level, CONFIDENCE_LEVELS, line, "confidence_level", errors);
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

function parseSemicolonList(value = "") {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateHeaders(headers, errors) {
  const expectedPrefix = EXPECTED_HEADERS.join(",");
  const actualPrefix = headers.slice(0, EXPECTED_HEADERS.length).join(",");
  if (actualPrefix !== expectedPrefix) {
    errors.push(
      `Header mismatch in ${CUT_PROFILES_SOURCE}. Required leading headers: ${EXPECTED_HEADERS.join(",")}`
    );
  }

  const extraHeaders = headers.slice(EXPECTED_HEADERS.length).filter(Boolean);
  const unsupported = extraHeaders.filter((header) => !OPTIONAL_HEADERS.includes(header));
  if (unsupported.length > 0) {
    errors.push(`Unsupported optional headers in ${CUT_PROFILES_SOURCE}: ${unsupported.join(",")}`);
  }
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

function expectPositiveNumber(value, line, field, errors) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    errors.push(`Line ${line}: ${field} must be a positive number`);
  }
}

function expectRangeOrPositiveNumber(value, line, field, errors) {
  const parts = value.split("-").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0 || parts.length > 2) {
    errors.push(`Line ${line}: ${field} must be a positive number or range`);
    return;
  }

  const numbers = parts.map(Number);
  if (numbers.some((number) => !Number.isFinite(number) || number <= 0)) {
    errors.push(`Line ${line}: ${field} must be a positive number or range`);
  }
}

function averageRange(value) {
  if (!value) return undefined;
  const numbers = value.split("-").map((part) => Number(part.trim())).filter(Number.isFinite);
  if (numbers.length === 0) return undefined;
  const total = numbers.reduce((sum, number) => sum + number, 0);
  return Math.round(total / numbers.length);
}

function normalizeMethods(value, animalId) {
  if (animalId === "vegetables") return ["vegetables_grill"];

  const methods = new Set();
  for (const rawMethod of parseSemicolonList(value)) {
    const method = rawMethod.toLowerCase();
    if (method.includes("reverse sear")) methods.add("reverse_sear");
    if (
      method.includes("indirect") ||
      method.includes("low and slow") ||
      method.includes("smoke") ||
      method.includes("rotisserie") ||
      method.includes("spatchcock") ||
      method.includes("whole grill")
    ) {
      methods.add("grill_indirect");
    }
    if (
      method.includes("direct") ||
      method.includes("sear") ||
      method.includes("grill") ||
      method.includes("plancha")
    ) {
      methods.add("grill_direct");
    }
    if (
      method.includes("pan") ||
      method.includes("oven") ||
      method.includes("roast") ||
      method.includes("braise") ||
      method.includes("burger") ||
      method.includes("skewer") ||
      method.includes("medallion") ||
      method.includes("chop") ||
      method.includes("plank")
    ) {
      methods.add("oven_pan");
    }
  }

  return [...methods];
}

function normalizeDoneness(record) {
  if (record.animal === "vegetables") return [];

  const tokens = normalizeDonenessTokens(record);
  const text = tokens.join("; ");
  if (record.animal === "chicken") return text.includes("crispy") ? ["safe", "well_done"] : ["safe"];
  if (record.animal === "pork") {
    if (text.includes("juicy")) return ["juicy_safe", "medium_safe"];
    if (text.includes("crisp") || text.includes("render") || text.includes("tender") || text.includes("done")) {
      return ["well_done"];
    }
    return ["medium_safe", "well_done"];
  }
  if (record.animal === "fish") {
    const values = [];
    if (hasDonenessToken(tokens, ["rare", "seared rare"])) values.push("rare");
    if (hasDonenessToken(tokens, ["medium rare"])) values.push("medium_rare");
    if (
      hasDonenessToken(tokens, ["medium", "flaky", "just cooked", "just flaky"]) ||
      tokens.some((token) => token.includes("cooked"))
    ) {
      values.push("medium");
    }
    if (text.includes("done")) values.push("well_done");
    return [...new Set(values.length > 0 ? values : ["medium"])];
  }

  const values = [];
  if (hasDonenessToken(tokens, ["rare", "seared rare"])) values.push("rare");
  if (hasDonenessToken(tokens, ["medium rare"])) values.push("medium_rare");
  if (hasDonenessToken(tokens, ["medium"])) values.push("medium");
  if (text.includes("well") || text.includes("pull-apart") || text.includes("tender")) values.push("well_done");
  return [...new Set(values.length > 0 ? values : ["medium"])];
}

function normalizeSingleDoneness(value = "") {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (!normalized) return undefined;

  const aliases = {
    done: "well_done",
    well: "well_done",
    mediumsafe: "medium_safe",
    juicysafe: "juicy_safe",
  };
  const candidate = aliases[normalized.replace(/_/g, "")] ?? normalized;
  return DONENESS_IDS.includes(candidate) ? candidate : undefined;
}

function normalizeDonenessTokens(record) {
  return parseSemicolonList(record.recommended_doneness).map((item) => item.toLowerCase());
}

function hasDonenessToken(tokens, expected) {
  return tokens.some((token) => expected.includes(token));
}

function createsMediumFromMediumRare(record, allowedDoneness) {
  const tokens = normalizeDonenessTokens(record);
  return (
    tokens.includes("medium rare") &&
    !hasDonenessToken(tokens, ["medium", "flaky", "just cooked", "just flaky"]) &&
    !tokens.some((token) => token.includes("cooked")) &&
    allowedDoneness.includes("medium")
  );
}

function inferInputProfileId(record) {
  if (record.animal === "vegetables") return "vegetable-format";
  if (record.animal === "chicken" && record.category === "whole") return "poultry-whole";
  if (record.animal === "chicken" && (record.cut_id.includes("breast") || record.cut_id.includes("tenderloin"))) {
    return "chicken-breast";
  }
  if (record.animal === "fish" && record.category === "whole") return "fish-whole";
  if (
    record.animal === "fish" &&
    (record.category === "fillet" ||
      record.category === "steak" ||
      record.category === "loin" ||
      record.category === "tail")
  ) {
    return "fish-fillet";
  }
  if (
    record.animal === "pork" &&
    (record.category === "bbq" ||
      record.category === "ribs" ||
      record.category === "roast" ||
      record.cut_id.includes("shoulder") ||
      record.cut_id.includes("butt") ||
      record.cut_id.includes("belly") ||
      record.cut_id.includes("hock") ||
      record.cut_id.includes("ribs"))
  ) {
    return "pork-fast";
  }
  if (
    record.animal === "chicken" &&
    (record.cut_id.includes("thigh") ||
      record.cut_id.includes("drumstick") ||
      record.cut_id.includes("wing") ||
      record.cut_id.includes("leg_quarter"))
  ) {
    return "poultry-whole";
  }
  if (record.animal === "pork" && record.category === "steak") return "pork-fast";
  if (record.animal === "beef" && record.category === "steak") return "beef-steak";
  if (record.animal === "beef" && (record.category === "roast" || record.category === "bbq")) return "beef-large";
  return "default";
}

function inferDefaultThicknessCm(record) {
  if (record.animal === "vegetables") return 2;
  if (record.category === "ground") return 2;
  if (record.category === "whole") return 6;
  if (record.category === "bbq" || record.category === "ribs" || record.category === "roast") return 5;
  if (record.category === "fillet" || record.category === "wing") return 2;
  return Math.max(2, Math.min(5, Number(record.difficulty) || 3));
}

function shouldShowThickness(record) {
  if (record.animal === "vegetables") return false;
  if (record.category === "ground" || record.category === "whole" || record.category === "wing") return false;
  return Boolean(record.estimated_time_min_per_cm);
}

function inferStyle(record) {
  const methods = record.recommended_methods.toLowerCase();
  const tags = record.quick_pick_tags.toLowerCase();
  const totalTime = record.estimated_total_time_min ? averageRange(record.estimated_total_time_min) : 0;
  const isThickSteak = record.category === "steak" && (Number(record.difficulty) >= 4 || totalTime >= 45);
  const isVeryThickSteak =
    record.cut_id.includes("tomahawk") ||
    record.cut_id.includes("porterhouse") ||
    record.cut_id.includes("t_bone");

  if (record.animal === "vegetables") return "vegetable";
  if (record.animal === "fish") return "fish";
  if (record.animal === "chicken") return "poultry";
  if (record.cut_id === "picanha") return "fatcap";
  if (
    record.category === "bbq" ||
    record.category === "ribs" ||
    record.category === "roast" ||
    methods.includes("low and slow") ||
    methods.includes("smoke") ||
    totalTime >= 90
  ) {
    return "lowSlow";
  }
  if (
    (methods.includes("reverse sear") && (isThickSteak || isVeryThickSteak || totalTime >= 60)) ||
    record.cut_id.includes("tomahawk")
  ) {
    return "reverse";
  }
  if (tags.includes("crispy") || methods.includes("crispy")) return "crispy";
  if (Number(record.difficulty) >= 4 || record.category === "roast" || record.category === "ribs") return "thick";
  return "fast";
}

function mapStyleToCsvCookingStyle(style) {
  if (style === "lowSlow") return "low_slow";
  if (style === "reverse" || style === "fatcap" || style === "poultry" || style === "fish" || style === "vegetable") {
    return style;
  }
  return "fast";
}

function mapCsvCookingStyleToStyle(cookingStyle) {
  if (cookingStyle === "low_slow") return "lowSlow";
  if (cookingStyle === "reverse" || cookingStyle === "fatcap" || cookingStyle === "poultry" || cookingStyle === "fish" || cookingStyle === "vegetable") {
    return cookingStyle;
  }
  if (cookingStyle === "fast") return "fast";
  return undefined;
}

function resolveCsvCookingStyle(rawCookingStyle, inferredCookingStyle) {
  const explicit = emptyToUndefined(rawCookingStyle ?? "");
  if (explicit && CSV_COOKING_STYLES.includes(explicit)) return explicit;
  return inferredCookingStyle;
}

function inferFireZone(record, allowedMethods) {
  const methodsText = record.recommended_methods.toLowerCase();
  if (methodsText.includes("mix")) return "mixed";
  const hasDirect = methodsText.includes("direct") || allowedMethods.includes("grill_direct");
  const hasIndirect =
    methodsText.includes("indirect") ||
    methodsText.includes("smoke") ||
    methodsText.includes("low and slow") ||
    methodsText.includes("rotisserie") ||
    allowedMethods.includes("grill_indirect");
  if (hasDirect && hasIndirect) return "mixed";
  if (hasIndirect) return "indirect";
  if (hasDirect) return "direct";
  return "direct";
}

function resolveFireZone(rawFireZone, inferredFireZone) {
  const explicit = emptyToUndefined(rawFireZone ?? "");
  if (explicit && FIRE_ZONES.includes(explicit)) return explicit;
  return inferredFireZone;
}

function inferTimeType(record) {
  if (emptyToUndefined(record.estimated_time_min_per_cm ?? "")) return "per_cm";
  if (emptyToUndefined(record.estimated_total_time_min ?? "")) return "total";
  return "total";
}

function resolveTimeType(rawTimeType, inferredTimeType) {
  const explicit = emptyToUndefined(rawTimeType ?? "");
  if (explicit && TIME_TYPES.includes(explicit)) return explicit;
  return inferredTimeType;
}

function resolveDefaultDoneness(record, allowedDoneness) {
  if (allowedDoneness.length === 0) return undefined;

  const explicitDefault = normalizeSingleDoneness(record.default_doneness ?? "");
  if (explicitDefault && allowedDoneness.includes(explicitDefault)) {
    return explicitDefault;
  }

  if (record.animal === "chicken") {
    return allowedDoneness.includes("safe") ? "safe" : allowedDoneness[0];
  }
  if (record.animal === "pork") {
    const porkPriority = ["safe", "well_done", "medium_safe", "juicy_safe"];
    for (const option of porkPriority) {
      if (allowedDoneness.includes(option)) return option;
    }
    return allowedDoneness[0];
  }
  if (record.animal === "fish") {
    return allowedDoneness[0];
  }
  return allowedDoneness[0];
}

function resolveConfidenceLevel(record) {
  const explicit = emptyToUndefined(record.confidence_level ?? "");
  if (explicit && CONFIDENCE_LEVELS.includes(explicit)) return explicit;

  if (["ribeye", "picanha", "chicken_breast", "salmon_fillet", "salmon_steak"].includes(record.cut_id)) {
    return "high";
  }
  if (
    record.cut_id.includes("kingfish") ||
    record.cut_id.includes("beryx") ||
    record.cut_id.includes("turbot")
  ) {
    return "low";
  }
  return "medium";
}
