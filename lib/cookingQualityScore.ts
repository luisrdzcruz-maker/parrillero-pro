/**
 * 0–100 quality score for an engine plan+steps (same heuristics as scripts/cooking-quality.ts).
 * Used by the admin QA dashboard; does not call OpenAI.
 */

import {
  beefTemps,
  chickenTemps,
  fishTemps,
  porkTemps,
  type AnimalId,
  type CookingInput,
  type CookingPlan,
  type CookingStep,
  type DonenessId,
  type ProductCut,
  type TargetTemp,
} from "./cookingCatalog";
import { normalizeCookingOutput } from "./normalization/normalizeCookingOutput";

const MAX = {
  sections: 20,
  durations: 25,
  contradictions: 15,
  order: 20,
  temperature: 20,
} as const;

function expectedTargetTemp(cut: ProductCut, doneness: DonenessId): TargetTemp | undefined {
  if (cut.targetTempsC?.[doneness]) return cut.targetTempsC[doneness];
  if (cut.animalId === "beef") return beefTemps[doneness] ?? beefTemps.medium_rare;
  if (cut.animalId === "pork") return porkTemps[doneness] ?? porkTemps.juicy_safe;
  if (cut.animalId === "chicken") return chickenTemps[doneness] ?? chickenTemps.safe;
  if (cut.animalId === "fish") return fishTemps[doneness] ?? fishTemps.medium;
  return undefined;
}

function parseTemperaturaC(text: string): { a: number; b: number } | null {
  const out: number[] = [];
  for (const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*°C/gi)) {
    const n = Number(m[1].replace(",", "."));
    if (Number.isFinite(n)) out.push(n);
  }
  if (out.length >= 2) return { a: out[0], b: out[1] };
  return null;
}

function pullWithinAnimalRange(animalId: AnimalId, pull: number): boolean {
  if (animalId === "beef") return pull >= 40 && pull <= 78;
  if (animalId === "pork") return pull >= 55 && pull <= 75;
  if (animalId === "chicken") return pull >= 70 && pull <= 78;
  if (animalId === "fish") return pull >= 42 && pull <= 60;
  return true;
}

function scoreSections(plan: CookingPlan | null): number {
  if (!plan) return 0;
  const keys: (keyof CookingPlan)[] = ["SETUP", "times", "temperature", "steps"];
  let pts = 0;
  for (const k of keys) {
    const v = plan[k as string];
    if (typeof v === "string" && v.trim().length > 0) pts += 5;
  }
  return pts;
}

function plausibleDurations(cut: ProductCut, steps: CookingStep[] | null): number {
  if (!steps || steps.length === 0) return 0;
  const lowSlow = cut.style === "lowSlow";
  const minS = 30;
  const maxS = lowSlow ? 20_000 : 15_000;
  let bad = 0;
  for (const s of steps) {
    if (typeof s.duration !== "number" || !Number.isFinite(s.duration)) {
      bad++;
      continue;
    }
    if (s.duration < minS || s.duration > maxS) bad++;
  }
  if (bad === 0) return MAX.durations;
  const ratio = 1 - bad / steps.length;
  return Math.round(MAX.durations * Math.max(0, ratio));
}

function isIndoorEquipment(equipment: string): boolean {
  const n = equipment.trim().toLowerCase();
  return n.includes("cocina interior") || n.includes("indoor") || n.includes("oven");
}

function scoreContradictions(
  plan: CookingPlan | null,
  cut: ProductCut,
  steps: CookingStep[] | null,
  equipment: string,
): number {
  if (!plan) return 0;
  const setup = String(plan.SETUP ?? "");
  const combined = [
    plan.times ?? plan.TIMES,
    plan.temperature ?? plan.TEMPERATURE,
    plan.steps ?? plan.STEPS,
    ...(steps ?? []).map((s) => s.description),
  ]
    .filter(Boolean)
    .join(" \n ");
  const indoor = isIndoorEquipment(equipment);
  const canOven = cut.allowedMethods.includes("oven_pan");
  let p = MAX.contradictions;
  if (indoor && canOven) {
    const hasIndoorCues = /sart[ée]n|horno|horne|p[áa]n|oven|interior|plancha/i.test(setup);
    if (!hasIndoorCues) p -= 6;
  }
  if (
    /\b(nunca|no)\b.*(muevas|mover|t[oó]c|toques)/i.test(combined) &&
    /(a menudo|cada|muchas vuel|girando|vueltas|menudo)/i.test(combined)
  ) {
    p -= 5;
  }
  if (
    /\b(siempre|s[oó]lo)\b.*\b(fuego directo|directo|llama|parrilla)\b/i.test(combined) &&
    /\b(only|solo)\b.*\b(horno|indirect|indirecto)\b/i.test(combined)
  ) {
    p -= 4;
  }
  return Math.max(0, p);
}

function firstStepOrderScore(steps: CookingStep[] | null): number {
  if (!steps?.length) return 0;
  const t0 = (steps[0].title + " " + steps[0].description).toLowerCase();
  if (
    /precalent|preheat|preparar verduras|prep |preparamos|encender|horno|sart[ée]n|indirecto|parrilla|zona/.test(
      t0,
    )
  ) {
    return 10;
  }
  return 3;
}

function lastStepOrderScore(steps: CookingStep[] | null): number {
  if (!steps?.length) return 0;
  const last = steps[steps.length - 1];
  const t = (last.title + " " + last.description).toLowerCase();
  if (/reposo|rest|descans|terminar|fin |comer|serve|caliente(?!s)/.test(t)) return 10;
  return 4;
}

function restBeforeSearClash(steps: CookingStep[] | null): number {
  if (!steps || steps.length < 2) return 0;
  const titles = steps.map((s) => s.title.toLowerCase());
  const restI = titles.findIndex((u) => /reposo|rest/.test(u));
  const searI = titles.findIndex((u) => /sell|sear|dora|grill|parrilla direct|dorad/.test(u));
  if (restI === -1 || searI === -1) return 0;
  if (restI < searI) return 8;
  return 0;
}

function scoreOrder(steps: CookingStep[] | null): number {
  if (!steps?.length) return 0;
  const a = firstStepOrderScore(steps) + lastStepOrderScore(steps);
  return Math.max(0, a - restBeforeSearClash(steps));
}

function scoreTemperature(plan: CookingPlan | null, cut: ProductCut, doneness: string): number {
  if (!plan) return 0;
  const text = String(plan.temperature ?? plan.TEMPERATURE ?? "");
  const parsed = parseTemperaturaC(text);
  if (!parsed) {
    if (cut.style === "vegetable" && /textura tierna|bordes dorados/i.test(text))
      return MAX.temperature;
    if (!text.trim()) return 0;
    return 6;
  }
  const { a: t1, b: t2 } = parsed;
  const lo = Math.min(t1, t2);
  const hi = Math.max(t1, t2);
  if (lo > hi) return 0;
  if (lo === hi) return 4;
  if (!pullWithinAnimalRange(cut.animalId, lo)) return 5;
  const finalDelta = hi - lo;
  if (finalDelta > 12) return 8;
  const exp = expectedTargetTemp(cut, doneness as DonenessId);
  if (exp) {
    if (Math.abs(exp.pull - lo) <= 1.5 && Math.abs(exp.final - hi) <= 1.5) return MAX.temperature;
  }
  if (lo < hi && finalDelta >= 0 && finalDelta <= 8) return Math.max(12, MAX.temperature - 3);
  return 10;
}

/**
 * Heuristic 0–100 quality score; independent of `validateCookingEngineOutput` strict checks.
 */
export function computeCookingQualityScore(
  input: CookingInput,
  plan: CookingPlan | null,
  steps: CookingStep[] | null,
  cut: ProductCut,
): number {
  const normalized = plan ? (normalizeCookingOutput(plan) as CookingPlan) : null;
  // Guardrail: once normalized, consume canonical keys internally.
  const sSections = scoreSections(normalized);
  const sDur = plausibleDurations(cut, steps);
  const sCon = scoreContradictions(normalized, cut, steps, input.equipment);
  const sOrder = scoreOrder(steps);
  const sTemp = scoreTemperature(normalized, cut, input.doneness);
  const sub = {
    sections: sSections,
    durations: sDur,
    contradictions: sCon,
    order: sOrder,
    temperature: sTemp,
  };
  return Math.max(
    0,
    Math.min(
      100,
      Object.values(sub).reduce((a, b) => a + b, 0),
    ),
  );
}
