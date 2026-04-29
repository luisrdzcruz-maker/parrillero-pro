import type { LiveStep } from "@/components/live/LiveCookingScreen";

export const LIVE_COOKING_STORAGE_KEY = "parrillero_live_cooking_plan_v1";

type LiveCookingBlocks = Record<string, string>;

export type LiveCookingInputSnapshot = {
  animal: string;
  cut: string;
  equipment: string;
  doneness: string;
  thickness: string;
  lang: "es" | "en" | "fi";
};

export type LiveCookingPlanPayload = {
  version: 1;
  createdAt: string;
  input: LiveCookingInputSnapshot;
  blocks: LiveCookingBlocks;
  signature: string;
};

type BuildLiveStepsResult = {
  steps: LiveStep[];
  context: string;
  usedFallback: boolean;
  signature: string;
};

const FALLBACK_STEP_SECONDS = 180;

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBlocks(blocks: LiveCookingBlocks): LiveCookingBlocks {
  return Object.fromEntries(
    Object.entries(blocks)
      .map(([key, value]) => [key.trim().toUpperCase(), asText(value)])
      .filter(([key, value]) => Boolean(key) && Boolean(value)),
  );
}

function block(blocks: LiveCookingBlocks, ...keys: string[]) {
  for (const key of keys) {
    const value = asText(blocks[key]);
    if (value) return value;
  }
  return "";
}

function inferZone(text: string) {
  const line = text.toLowerCase();
  if (/rest|reposo/.test(line)) return "Reposo";
  if (/serve|servir|finish|terminar|listo/.test(line)) return "Servir";
  if (/indirect|indirecto|oven|horno|core|centro/.test(line)) return "Indirecto";
  if (/preheat|precalent|stabilize|estabiliza|setup|zona/.test(line)) return "Directo";
  if (/sear|sellad|dorar|browning|crisp/.test(line)) return "Directo";
  return "Directo";
}

function defaultDurationByZone(zone: string) {
  if (zone === "Reposo") return 360;
  if (zone === "Servir") return 0;
  if (zone === "Indirecto") return 420;
  return 240;
}

function parseDurationSeconds(text: string) {
  const hhmm = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hhmm) {
    const mm = Number(hhmm[1]);
    const ss = Number(hhmm[2]);
    if (Number.isFinite(mm) && Number.isFinite(ss)) return mm * 60 + ss;
  }

  const hours = text.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas|hour|hours)\b/i);
  const minutes = text.match(/(\d+(?:[.,]\d+)?)\s*(?:min|mins|minuto|minutos|minute|minutes)\b/i);
  const seconds = text.match(/(\d+(?:[.,]\d+)?)\s*(?:s|sec|secs|seg|segundo|segundos|second|seconds)\b/i);
  const toNum = (value?: string) => {
    if (!value) return 0;
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const total = Math.round(toNum(hours?.[1]) * 3600 + toNum(minutes?.[1]) * 60 + toNum(seconds?.[1]));
  if (total > 0) return total;

  return null;
}

function parseTempTargets(tempText: string) {
  const values = Array.from(tempText.matchAll(/(\d+(?:[.,]\d+)?)\s*°C/gi))
    .map((match) => Number(match[1].replace(",", ".")))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.round(value));

  return {
    pull: values[0] ?? null,
    final: values[1] ?? values[0] ?? null,
  };
}

function splitPlanLines(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const collected: string[] = [];

  for (const line of lines) {
    if (/^\d+[.)]\s+/.test(line) || /^[-*]\s+/.test(line)) {
      collected.push(line.replace(/^\d+[.)]\s+/, "").replace(/^[-*]\s+/, ""));
      continue;
    }

    if (collected.length > 0) {
      collected[collected.length - 1] = `${collected[collected.length - 1]} ${line}`.trim();
      continue;
    }

    collected.push(line);
  }

  return collected;
}

function parsePlanSteps(stepsText: string) {
  const lines = splitPlanLines(stepsText);
  if (lines.length > 0) return lines;

  return stepsText
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ])/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function pickLabel(entry: string) {
  const [title] = entry.split(":");
  const base = title?.trim() || entry.trim();
  return base.length > 72 ? `${base.slice(0, 69)}...` : base;
}

function buildStepNotes(input: LiveCookingInputSnapshot, setupText: string, timelineText: string) {
  const details = [
    `${input.animal} · ${input.cut}`,
    input.equipment,
    `${input.doneness} · ${input.thickness} cm`,
  ].join(" | ");

  const setup = setupText ? `Setup: ${setupText}` : "";
  const timeline = timelineText ? `Timeline: ${timelineText}` : "";

  return [details, setup, timeline].filter(Boolean).join(" | ");
}

export function buildLiveStepsSignature(steps: LiveStep[]) {
  return steps
    .map((step) => `${step.zone}:${step.duration}:${step.label.toLowerCase()}`)
    .join("|");
}

export function hasDistinctLiveSteps(a: LiveStep[], b: LiveStep[]) {
  return buildLiveStepsSignature(a) !== buildLiveStepsSignature(b);
}

export function createLiveCookingPayload(params: {
  input: LiveCookingInputSnapshot;
  blocks: LiveCookingBlocks;
}) {
  const normalizedBlocks = normalizeBlocks(params.blocks);
  const baseSignature = [
    params.input.animal,
    params.input.cut,
    params.input.equipment,
    params.input.doneness,
    params.input.thickness,
    block(normalizedBlocks, "PASOS", "STEPS"),
    block(normalizedBlocks, "TIMELINE", "TIMING"),
  ]
    .map((value) => value.toLowerCase())
    .join("::");

  const payload: LiveCookingPlanPayload = {
    version: 1,
    createdAt: new Date().toISOString(),
    input: params.input,
    blocks: normalizedBlocks,
    signature: baseSignature,
  };

  return payload;
}

export function saveLiveCookingPayload(payload: LiveCookingPlanPayload) {
  if (typeof window === "undefined") return false;
  window.sessionStorage.setItem(LIVE_COOKING_STORAGE_KEY, JSON.stringify(payload));
  return true;
}

export function readLiveCookingPayload(): LiveCookingPlanPayload | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(LIVE_COOKING_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LiveCookingPlanPayload>;
    if (parsed.version !== 1 || !parsed.input || !parsed.blocks) return null;
    return {
      version: 1,
      createdAt: asText(parsed.createdAt) || new Date().toISOString(),
      input: parsed.input,
      blocks: normalizeBlocks(parsed.blocks),
      signature: asText(parsed.signature),
    };
  } catch {
    return null;
  }
}

export function buildLiveStepsFromPayload(
  payload: LiveCookingPlanPayload | null,
  fallbackSteps: LiveStep[],
): BuildLiveStepsResult {
  if (!payload) {
    return {
      steps: fallbackSteps,
      context: "",
      usedFallback: true,
      signature: buildLiveStepsSignature(fallbackSteps),
    };
  }

  const setupText = block(payload.blocks, "SETUP");
  const tempText = block(payload.blocks, "TEMPERATURA", "TEMPERATURE");
  const stepsText = block(payload.blocks, "PASOS", "STEPS");
  const timelineText = block(payload.blocks, "TIMELINE", "TIMING");
  const entries = parsePlanSteps(stepsText);
  const targets = parseTempTargets(tempText);
  const sharedNotes = buildStepNotes(payload.input, setupText, timelineText);

  if (entries.length === 0) {
    return {
      steps: fallbackSteps,
      context: `${payload.input.animal} · ${payload.input.cut} · ${payload.input.equipment}`,
      usedFallback: true,
      signature: buildLiveStepsSignature(fallbackSteps),
    };
  }

  const steps: LiveStep[] = entries.map((entry, index) => {
    const zone = inferZone(entry);
    const parsedDuration = parseDurationSeconds(entry);
    const duration =
      parsedDuration ?? (defaultDurationByZone(zone) > 0 ? defaultDurationByZone(zone) : FALLBACK_STEP_SECONDS);
    const explicitTemp = parseTempTargets(entry).pull;
    const tempTarget =
      explicitTemp ??
      (zone === "Reposo" || zone === "Servir" ? targets.final : targets.pull ?? null);

    return {
      id: `plan-step-${index + 1}`,
      label: pickLabel(entry),
      zone,
      duration,
      tempTarget,
      notes: index === 0 ? sharedNotes : entry,
    };
  });

  const signature = buildLiveStepsSignature(steps);

  return {
    steps,
    context: `${payload.input.animal} · ${payload.input.cut} · ${payload.input.equipment}`,
    usedFallback: false,
    signature,
  };
}
