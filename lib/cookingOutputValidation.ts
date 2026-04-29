import type { AnimalId, CookingInput, CookingPlan, CookingStep } from "./cookingCatalog";
import { getCutForInput } from "./cookingRules";

export const COOKING_WARNING_CODES = [
  "plan_null",
  "plan_section_missing",
  "plan_section_empty",
  "steps_null",
  "steps_empty",
  "step_empty_text",
  "step_duplicate",
  "step_invalid_duration",
  "temperature_missing_numeric",
  "temperature_invalid_pair",
  "temperature_out_of_range",
] as const;

export type CookingWarningCode = (typeof COOKING_WARNING_CODES)[number];

export type CookingOutputWarning = {
  code: CookingWarningCode;
  message: string;
  detail?: string;
};

export type CookingValidationResult = {
  /** Human-readable issues */
  warnings: CookingOutputWarning[];
  /** One boolean per known code; `true` means that issue was detected */
  flags: Record<CookingWarningCode, boolean>;
  /** Shorthand: no warnings */
  ok: boolean;
};

function emptyFlags(): Record<CookingWarningCode, boolean> {
  const f = {} as Record<CookingWarningCode, boolean>;
  for (const c of COOKING_WARNING_CODES) f[c] = false;
  return f;
}

function sectionKeys(lang: "es" | "en"): {
  setup: string;
  times: string;
  temp: string;
  steps: string;
} {
  if (lang === "en") {
    return { setup: "SETUP", times: "TIMES", temp: "TEMPERATURE", steps: "STEPS" };
  }
  return { setup: "SETUP", times: "TIEMPOS", temp: "TEMPERATURA", steps: "PASOS" };
}

function inferLangFromPlan(plan: CookingPlan): "es" | "en" {
  if ("TIEMPOS" in plan || "TEMPERATURA" in plan || "PASOS" in plan) return "es";
  if ("TIMES" in plan || "TEMPERATURE" in plan) return "en";
  return "es";
}

function extractCelsiusValues(text: string): number[] {
  const nums: number[] = [];
  for (const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*°C/gi)) {
    const n = Number(m[1].replace(",", "."));
    if (Number.isFinite(n)) nums.push(n);
  }
  return nums;
}

function isNonNumericTempFallback(text: string, lang: "es" | "en"): boolean {
  const t = text.trim();
  if (lang === "es") {
    return /textura tierna|bordes dorados/i.test(t) && !/°C/.test(t);
  }
  return /tender texture|browned edges/i.test(t) && !/°C/.test(t);
}

function tempInPlausibleRange(animalId: AnimalId | undefined, lo: number, hi: number): boolean {
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  if (a === b) return false;
  if (a >= b) return false;
  if (animalId === "beef") return a >= 40 && b <= 82;
  if (animalId === "pork") return a >= 55 && b <= 78;
  if (animalId === "chicken") return a >= 68 && b <= 80;
  if (animalId === "fish") return a >= 42 && b <= 64;
  if (animalId === "vegetables") return true;
  return a >= 35 && b <= 100;
}

export type ValidateCookingOutputOptions = {
  /** Resolves animal + cut for temperature expectations. */
  input?: CookingInput;
  /** Overrides inference from `input` or from plan keys */
  language?: "es" | "en";
};

/**
 * Validates engine outputs: required plan sections, step list, durations, and temperature text.
 * Does not mutate the engine; safe to call after `generateCookingPlan` / `generateCookingSteps`.
 */
export function validateCookingEngineOutput(
  plan: CookingPlan | null,
  steps: CookingStep[] | null,
  options?: ValidateCookingOutputOptions,
): CookingValidationResult {
  const warnings: CookingOutputWarning[] = [];
  const flags = emptyFlags();

  const push = (w: CookingOutputWarning) => {
    warnings.push(w);
    flags[w.code] = true;
  };

  const lang =
    options?.language ??
    (options?.input ? options.input.language : undefined) ??
    (plan ? inferLangFromPlan(plan) : "es");
  const keys = sectionKeys(lang);

  const cut = options?.input ? getCutForInput(options.input) : undefined;
  const animalId = cut?.animalId;

  if (plan == null) {
    push({ code: "plan_null", message: "Cooking plan is null" });
  } else {
    for (const [label, key] of Object.entries(keys) as [string, string][]) {
      if (!(key in plan)) {
        push({
          code: "plan_section_missing",
          message: `Plan section "${key}" is missing`,
          detail: label,
        });
      } else if (!String(plan[key] ?? "").trim()) {
        push({
          code: "plan_section_empty",
          message: `Plan section "${key}" is empty`,
          detail: label,
        });
      }
    }

    const tempText = String(plan[keys.temp] ?? "");
    const nums = extractCelsiusValues(tempText);
    const vegStyle = cut?.style === "vegetable";

    if (tempText.trim() && !vegStyle) {
      if (nums.length === 0 && !isNonNumericTempFallback(tempText, lang)) {
        push({
          code: "temperature_missing_numeric",
          message: "Expected °C values in temperature section for this product",
          detail: tempText.slice(0, 120),
        });
      }
      if (nums.length >= 2) {
        const lo = Math.min(nums[0], nums[1]);
        const hi = Math.max(nums[0], nums[1]);
        if (lo >= hi) {
          push({
            code: "temperature_invalid_pair",
            message: "Temperature pull should be below final (or two distinct °C targets)",
            detail: `${nums[0]}°C / ${nums[1]}°C`,
          });
        } else if (!tempInPlausibleRange(animalId, lo, hi)) {
          push({
            code: "temperature_out_of_range",
            message: "Temperature pair is outside plausible range for this animal",
            detail: `${lo}°C–${hi}°C`,
          });
        }
      }
    }
  }

  if (steps == null) {
    push({ code: "steps_null", message: "Cooking steps array is null" });
  } else if (steps.length === 0) {
    push({ code: "steps_empty", message: "Cooking steps array is empty" });
  } else {
    const seen = new Set<string>();
    steps.forEach((s, i) => {
      const title = String(s.title ?? "").trim();
      const description = String(s.description ?? "").trim();
      if (!title || !description) {
        push({
          code: "step_empty_text",
          message: `Step ${i} has empty title or description`,
          detail: `title=${title.slice(0, 40)} description=${description.slice(0, 60)}`,
        });
      }

      const dedupeKey = `${title.toLowerCase()}|${description.toLowerCase()}`;
      if (seen.has(dedupeKey)) {
        push({
          code: "step_duplicate",
          message: `Step ${i} duplicates a previous step`,
          detail: title.slice(0, 60),
        });
      } else {
        seen.add(dedupeKey);
      }

      if (typeof s.duration !== "number" || !Number.isFinite(s.duration) || s.duration <= 0) {
        push({
          code: "step_invalid_duration",
          message: `Step ${i} has invalid duration`,
          detail: `title=${s.title?.slice(0, 40) ?? ""} duration=${String(s.duration)}`,
        });
      }
    });
  }

  return {
    warnings,
    flags,
    ok: warnings.length === 0,
  };
}
