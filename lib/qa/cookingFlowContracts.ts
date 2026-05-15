import type { CookingPlan, DonenessId } from "../cookingCatalog";
import type { Lang } from "@/lib/i18n/texts";
import { shouldShowThickness } from "../cookingEngine";
import {
  buildLiveStepsFromPayload,
  createLiveCookingPayload,
  type LiveCookingPlanPayload,
} from "../liveCookingPlan";
import { getEquipmentSurfaceLabel } from "../i18n/surfaceFallbacks";
import { buildLiveUrl, type LiveParams } from "../navigation/buildLiveUrl";
import { parseLiveParams } from "../navigation/parseLiveParams";
import type { Animal } from "../types/domain";

export type QaFlowSeverity = "error" | "warning";

export type QaFlowIssue = {
  code: string;
  message: string;
  field?: string;
  severity: QaFlowSeverity;
};

export type SingleCutFlowInput = {
  fixtureId: string;
  animal: Animal;
  animalLabel: string;
  cutId: string;
  doneness?: DonenessId;
  equipment: string;
  thicknessCm: string;
  lang: Lang;
};

export type SingleCutFlowArtifacts = {
  input: SingleCutFlowInput;
  plan: CookingPlan | null;
  blocks: Record<string, string>;
  payload: LiveCookingPlanPayload | null;
  liveUrl: string | null;
};

export type MultiCutFlowArtifacts = {
  fixtureId: string;
  items: SingleCutFlowArtifacts[];
};

const DONENESS_KEYS: readonly DonenessId[] = [
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

const REQUIRED_RESULT_BLOCK_GROUPS = [
  ["SETUP"],
  ["TIEMPOS", "TIMES"],
  ["TEMPERATURA", "TEMPERATURE"],
  ["PASOS", "STEPS"],
] as const;

function issue(code: string, message: string, field?: string): QaFlowIssue {
  return { code, message, field, severity: "error" };
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstBlock(blocks: Record<string, string>, keys: readonly string[]) {
  for (const key of keys) {
    const value = asText(blocks[key]);
    if (value) return value;
  }
  return "";
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseCelsiusValues(text: string) {
  return [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*°C/gi)]
    .map((match) => Number(match[1].replace(",", ".")))
    .filter((value) => Number.isFinite(value));
}

function isTemperatureApplicable(input: SingleCutFlowInput) {
  return input.animal !== "vegetables";
}

function normalizeToken(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isMatchingThickness(a: string | undefined, b: string | undefined) {
  const left = a ? parsePositiveNumber(a) : null;
  const right = b ? parsePositiveNumber(b) : null;

  if (left != null && right != null) return Math.abs(left - right) < 0.001;
  return normalizeToken(a) === normalizeToken(b);
}

export function validateNoDonenessKeyAsTemperature(params: {
  input: SingleCutFlowInput;
  temperatureText: string;
}): QaFlowIssue[] {
  const issues: QaFlowIssue[] = [];
  const temperatureText = params.temperatureText.trim();
  const lowerTemperature = temperatureText.toLowerCase();
  const celsiusValues = parseCelsiusValues(temperatureText);
  const leakedDonenessKeys = DONENESS_KEYS.filter((key) =>
    new RegExp(`\\b${key.replace("_", "[-_ ]")}\\b`, "i").test(lowerTemperature),
  );

  if (isTemperatureApplicable(params.input) && celsiusValues.length === 0) {
    issues.push(
      issue(
        "temperature.missing_celsius",
        "Target temperature must include a real Celsius value for this fixture.",
        "temperature",
      ),
    );
  }

  if (leakedDonenessKeys.length > 0 && celsiusValues.length === 0) {
    issues.push(
      issue(
        "temperature.doneness_key",
        `Temperature looks like a doneness key instead of a real target: ${leakedDonenessKeys.join(", ")}.`,
        "temperature",
      ),
    );
  }

  return issues;
}

export function validateResultContract(artifacts: SingleCutFlowArtifacts): QaFlowIssue[] {
  const issues: QaFlowIssue[] = [];
  const { input, plan, blocks } = artifacts;

  if (!plan) {
    issues.push(issue("plan.missing", "Plan generation returned null.", "plan"));
    return issues;
  }

  if (!asText(input.animal)) issues.push(issue("input.missing_animal", "Missing input animal.", "input.animal"));
  if (!asText(input.cutId)) issues.push(issue("input.missing_cut", "Missing input cut id.", "input.cutId"));
  if (!asText(input.equipment)) {
    issues.push(issue("input.missing_equipment", "Missing input equipment.", "input.equipment"));
  }
  if (isTemperatureApplicable(input) && !input.doneness) {
    issues.push(issue("input.missing_doneness", "Missing input doneness.", "input.doneness"));
  }

  for (const group of REQUIRED_RESULT_BLOCK_GROUPS) {
    const value = getFirstBlock(blocks, group);
    if (!value) {
      issues.push(
        issue(
          "result.missing_block",
          `Missing required Result block: ${group.join(" or ")}.`,
          group.join("|"),
        ),
      );
    }
  }

  const timesText = getFirstBlock(blocks, ["TIEMPOS", "TIMES"]);
  if (!/\d/.test(timesText)) {
    issues.push(issue("result.invalid_total_time", "Total time must contain a usable numeric duration.", "times"));
  }

  const setupText = getFirstBlock(blocks, ["SETUP"]);
  if (!setupText || !input.equipment || !setupText.toLowerCase().includes(input.equipment.toLowerCase())) {
    issues.push(
      issue(
        "result.missing_method_or_fire",
        "Setup/method block must preserve equipment or fire context.",
        "setup",
      ),
    );
  }

  const stepsText = getFirstBlock(blocks, ["PASOS", "STEPS"]);
  if (!stepsText || !/\d+[.)]\s+|[-*]\s+/.test(stepsText)) {
    issues.push(issue("result.missing_steps", "Result must include step or timeline entries for Live.", "steps"));
  }

  issues.push(
    ...validateNoDonenessKeyAsTemperature({
      input,
      temperatureText: getFirstBlock(blocks, ["TEMPERATURA", "TEMPERATURE"]),
    }),
  );

  return issues;
}

export function buildSingleCutLivePayload(artifacts: Pick<SingleCutFlowArtifacts, "input" | "blocks">) {
  const { input, blocks } = artifacts;

  return createLiveCookingPayload({
    input: {
      animal: input.animalLabel,
      cut: input.cutId,
      equipment: input.equipment,
      doneness: input.doneness ?? "",
      thickness: shouldShowThickness(input.cutId) ? input.thicknessCm : "2",
      lang: input.lang,
    },
    blocks,
  });
}

export function validateLivePayloadContract(artifacts: SingleCutFlowArtifacts): QaFlowIssue[] {
  const issues: QaFlowIssue[] = [];
  const { input, payload } = artifacts;

  if (!payload) {
    return [issue("live_payload.missing", "Live payload was not built.", "payload")];
  }

  if (payload.version !== 1) {
    issues.push(issue("live_payload.invalid_version", `Expected payload version 1, got ${payload.version}.`, "version"));
  }
  if (!asText(payload.signature)) {
    issues.push(issue("live_payload.missing_signature", "Payload signature is empty.", "signature"));
  }
  if (normalizeToken(payload.input.animal) !== normalizeToken(input.animalLabel)) {
    issues.push(issue("live_payload.animal_mismatch", "Payload animal does not match fixture animal.", "input.animal"));
  }
  if (normalizeToken(payload.input.cut) !== normalizeToken(input.cutId)) {
    issues.push(issue("live_payload.cut_mismatch", "Payload cut does not match fixture cut.", "input.cut"));
  }
  if (input.doneness && normalizeToken(payload.input.doneness) !== normalizeToken(input.doneness)) {
    issues.push(
      issue("live_payload.doneness_mismatch", "Payload doneness does not match fixture doneness.", "input.doneness"),
    );
  }
  if (!asText(payload.input.equipment)) {
    issues.push(issue("live_payload.missing_equipment", "Payload equipment is empty.", "input.equipment"));
  }
  if (shouldShowThickness(input.cutId) && !isMatchingThickness(payload.input.thickness, input.thicknessCm)) {
    issues.push(
      issue("live_payload.thickness_mismatch", "Payload thickness does not match fixture thickness.", "input.thickness"),
    );
  }

  const liveSteps = buildLiveStepsFromPayload(payload, [], input.lang);
  if (liveSteps.usedFallback) {
    issues.push(issue("live_payload.steps_fallback", "Live step builder fell back instead of using payload steps.", "steps"));
  }
  if (liveSteps.steps.length === 0) {
    issues.push(issue("live_payload.no_live_steps", "Live payload produced no executable steps.", "steps"));
  }
  const equipmentLabel = getEquipmentSurfaceLabel(input.equipment, input.lang);
  if (!liveSteps.context.includes(input.cutId) || !liveSteps.context.includes(equipmentLabel)) {
    issues.push(
      issue(
        "live_payload.context_mismatch",
        "Live context must preserve cut and equipment from the payload.",
        "context",
      ),
    );
  }

  return issues;
}

export function buildSingleCutLiveUrl(input: SingleCutFlowInput) {
  const params: LiveParams = {
    animal: input.animal,
    cutId: input.cutId,
    doneness: input.doneness,
    lang: input.lang,
  };
  const thickness = parsePositiveNumber(input.thicknessCm);
  if (shouldShowThickness(input.cutId) && thickness != null) params.thickness = thickness;

  return buildLiveUrl(params);
}

export function validateLiveUrlRoundTrip(artifacts: SingleCutFlowArtifacts): QaFlowIssue[] {
  const issues: QaFlowIssue[] = [];
  const { input, liveUrl, payload } = artifacts;

  if (!liveUrl) {
    return [issue("live_url.missing", "Live URL was not built.", "liveUrl")];
  }

  const parsed = parseLiveParams(liveUrl.slice(liveUrl.indexOf("?")));
  if (parsed.mode !== "cocina") {
    issues.push(issue("live_url.mode_mismatch", `Expected mode cocina, got ${parsed.mode ?? "missing"}.`, "mode"));
  }
  if (parsed.animal !== input.animal) {
    issues.push(issue("live_url.animal_mismatch", "URL animal did not round-trip.", "animal"));
  }
  if (parsed.cutId !== input.cutId) {
    issues.push(issue("live_url.cut_mismatch", "URL cutId did not round-trip.", "cutId"));
  }
  if (input.doneness && parsed.doneness !== input.doneness) {
    issues.push(issue("live_url.doneness_mismatch", "URL doneness did not round-trip.", "doneness"));
  }
  if (parsed.lang !== input.lang) {
    issues.push(issue("live_url.lang_mismatch", "URL language did not round-trip.", "lang"));
  }
  if (shouldShowThickness(input.cutId) && !isMatchingThickness(String(parsed.thickness ?? ""), input.thicknessCm)) {
    issues.push(issue("live_url.thickness_mismatch", "URL thickness did not round-trip.", "thickness"));
  }

  if (payload && normalizeToken(payload.input.equipment) !== normalizeToken(input.equipment)) {
    issues.push(
      issue("live_restore.equipment_mismatch", "Live restore payload did not preserve equipment.", "equipment"),
    );
  }

  return issues;
}

export function validateSingleCutFlowContract(artifacts: SingleCutFlowArtifacts): QaFlowIssue[] {
  return [
    ...validateResultContract(artifacts),
    ...validateLivePayloadContract(artifacts),
    ...validateLiveUrlRoundTrip(artifacts),
  ];
}

export function validateMultiCutFlowContract(artifacts: MultiCutFlowArtifacts): QaFlowIssue[] {
  if (artifacts.items.length === 0) {
    return [issue("multi_cut.items_empty", "Multi-cut plan must contain at least one item.", "items")];
  }

  return artifacts.items.flatMap((item, index) =>
    validateSingleCutFlowContract(item).map((itemIssue) => ({
      ...itemIssue,
      field: `items[${index}]${itemIssue.field ? `.${itemIssue.field}` : ""}`,
    })),
  );
}
