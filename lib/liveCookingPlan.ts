import type { LiveStep } from "@/components/live/LiveCookingScreen";
import {
  getAnimalSurfaceLabel,
  getEquipmentSurfaceLabel,
  localizeLiveStepEntry,
  localizeResultSurfaceCopy,
} from "@/lib/i18n/surfaceFallbacks";
import type { CookingTimeSemantics, CookingTimeSemanticsSource } from "@/lib/cookingTimeSemantics";
import { getLiveCookingPhaseMetadata } from "@/lib/liveCookingPhases";
import type { Lang } from "@/lib/i18n/texts";

export const LIVE_COOKING_STORAGE_KEY = "parrillero_live_cooking_plan_v1";

type LiveCookingBlocks = Record<string, string>;

export type LiveCookingInputSnapshot = {
  animal: string;
  cut: string;
  equipment: string;
  doneness: string;
  thickness: string;
  lang: Lang;
};

export type LiveCookingTimerState = {
  currentStepIndex: number;
  remainingAtLastWriteSec: number;
  paused: boolean;
  lastWriteMs: number;
  started: boolean;
};

export type LiveCookingPlanPayload = {
  version: 1;
  createdAt: string;
  input: LiveCookingInputSnapshot;
  blocks: LiveCookingBlocks;
  signature: string;
  timeSemantics?: CookingTimeSemantics;
  timer?: LiveCookingTimerState;
};

const TIMER_STALE_MS = 24 * 60 * 60 * 1000;

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

function asLiveCookingTimerState(value: unknown): LiveCookingTimerState | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const currentStepIndex = Number(record.currentStepIndex);
  const remainingAtLastWriteSec = Number(record.remainingAtLastWriteSec);
  const lastWriteMs = Number(record.lastWriteMs);
  const paused = record.paused === true;
  if (
    !Number.isFinite(currentStepIndex) ||
    currentStepIndex < 0 ||
    !Number.isFinite(remainingAtLastWriteSec) ||
    remainingAtLastWriteSec < 0 ||
    !Number.isFinite(lastWriteMs) ||
    lastWriteMs <= 0
  ) {
    return undefined;
  }
  return {
    currentStepIndex: Math.round(currentStepIndex),
    remainingAtLastWriteSec: Math.max(0, Math.round(remainingAtLastWriteSec)),
    paused,
    lastWriteMs: Math.round(lastWriteMs),
    started: record.started === true,
  };
}

export function isLiveCookingTimerStale(timer: LiveCookingTimerState, nowMs = Date.now()) {
  if (timer.lastWriteMs > nowMs) return true;
  return nowMs - timer.lastWriteMs > TIMER_STALE_MS;
}

export function hydrateLiveCookingTimer(
  timer: LiveCookingTimerState,
  steps: LiveStep[],
  nowMs = Date.now(),
): { currentStepIndex: number; remainingSec: number; paused: boolean } {
  if (steps.length === 0) {
    return { currentStepIndex: 0, remainingSec: 0, paused: timer.paused };
  }

  const deltaSec = timer.paused ? 0 : Math.max(0, (nowMs - timer.lastWriteMs) / 1000);
  let currentStepIndex = Math.max(0, Math.min(steps.length - 1, timer.currentStepIndex));
  let remaining = timer.remainingAtLastWriteSec - deltaSec;

  let safety = steps.length + 2;
  while (remaining <= 0 && currentStepIndex < steps.length - 1 && safety > 0) {
    currentStepIndex += 1;
    const next = steps[currentStepIndex];
    remaining += next?.duration ?? 0;
    safety -= 1;
  }

  if (remaining <= 0) {
    return { currentStepIndex, remainingSec: 0, paused: false };
  }

  return {
    currentStepIndex,
    remainingSec: Math.max(0, Math.round(remaining)),
    paused: timer.paused,
  };
}

function asCookingTimeSemantics(value: unknown): CookingTimeSemantics | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const source = asText(record.source);
  const readMinutes = (key: keyof CookingTimeSemantics) => {
    const parsed = Number(record[key]);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
  };
  const setupMinutes = readMinutes("setupMinutes");
  const activeCookMinutes = readMinutes("activeCookMinutes");
  const restMinutes = readMinutes("restMinutes");
  const cutPlanMinutes = readMinutes("cutPlanMinutes");
  const sessionTotalMinutes = readMinutes("sessionTotalMinutes");
  const validSource: CookingTimeSemanticsSource =
    source === "catalog-v2" || source === "mixed" || source === "legacy-engine-derived"
      ? source
      : "legacy-engine-derived";

  if (
    setupMinutes == null ||
    activeCookMinutes == null ||
    restMinutes == null ||
    cutPlanMinutes == null ||
    sessionTotalMinutes == null
  ) {
    return undefined;
  }

  const prepLeadTimeMinutes = readMinutes("prepLeadTimeMinutes");

  return {
    setupMinutes,
    activeCookMinutes,
    restMinutes,
    cutPlanMinutes,
    sessionTotalMinutes,
    prepLeadTimeMinutes,
    source: validSource,
  };
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
  if (/rest|reposo/.test(line)) return "Rest";
  if (/indirect|indirecto|oven|horno|core|centro/.test(line)) return "Indirect";
  if (/serve|servir/.test(line)) return "Serve";
  if (/preheat|precalent|stabilize|estabiliza|setup|zona/.test(line)) return "Direct";
  if (/sear|sellad|dorar|browning|crisp/.test(line)) return "Direct";
  return "Direct";
}

function defaultDurationByZone(zone: string) {
  if (zone === "Rest") return 360;
  if (zone === "Serve") return 0;
  if (zone === "Indirect") return 420;
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

function getLiveCookingPayloadIssues(payload: LiveCookingPlanPayload) {
  const issues: string[] = [];
  const input = payload.input;
  const stepsText = block(payload.blocks, "PASOS", "STEPS");
  const tempText = block(payload.blocks, "TEMPERATURA", "TEMPERATURE");

  if (!asText(input.animal)) issues.push("missing animal");
  if (!asText(input.cut)) issues.push("missing cut");
  if (!asText(input.equipment)) issues.push("missing equipment");
  if (!asText(input.doneness) && input.animal !== "Verduras") issues.push("missing doneness");
  if (!stepsText) issues.push("missing steps");
  if (!parseTempTargets(tempText).final && input.animal !== "Verduras") issues.push("missing target temperature");

  return issues;
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

function pickStepInstruction(entry: string, surfaceLang: Lang) {
  const [, ...bodyParts] = entry.split(":");
  const body = bodyParts.join(":").trim();
  const instruction = body || entry.trim();
  return localizeResultSurfaceCopy(instruction, surfaceLang);
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
  const timeSemantics = asCookingTimeSemantics(
    (params.blocks as LiveCookingBlocks & { readonly timeSemantics?: unknown }).timeSemantics,
  );
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
    ...(timeSemantics ? { timeSemantics } : {}),
  };

  return payload;
}

export function saveLiveCookingPayload(payload: LiveCookingPlanPayload) {
  if (typeof window === "undefined") return false;
  const issues = getLiveCookingPayloadIssues(payload);
  if (issues.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn("[live-cooking] incomplete live cooking payload", {
      issues,
      input: payload.input,
      blockKeys: Object.keys(payload.blocks),
    });
  }
  if (issues.some((issue) => issue === "missing animal" || issue === "missing cut" || issue === "missing steps")) {
    return false;
  }
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
    const timeSemantics = asCookingTimeSemantics(parsed.timeSemantics);
    const timer = asLiveCookingTimerState(parsed.timer);
    return {
      version: 1,
      createdAt: asText(parsed.createdAt) || new Date().toISOString(),
      input: parsed.input,
      blocks: normalizeBlocks(parsed.blocks),
      signature: asText(parsed.signature),
      ...(timeSemantics ? { timeSemantics } : {}),
      ...(timer && !isLiveCookingTimerStale(timer) ? { timer } : {}),
    };
  } catch {
    return null;
  }
}

export function writeLiveCookingTimer(timer: LiveCookingTimerState | null) {
  if (typeof window === "undefined") return false;
  const raw = window.sessionStorage.getItem(LIVE_COOKING_STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as Partial<LiveCookingPlanPayload>;
    if (parsed.version !== 1 || !parsed.input || !parsed.blocks) return false;
    if (timer) {
      parsed.timer = timer;
    } else {
      delete parsed.timer;
    }
    window.sessionStorage.setItem(LIVE_COOKING_STORAGE_KEY, JSON.stringify(parsed));
    return true;
  } catch {
    return false;
  }
}

export function buildLiveStepsFromPayload(
  payload: LiveCookingPlanPayload | null,
  fallbackSteps: LiveStep[],
  surfaceLang: Lang = "en",
): BuildLiveStepsResult {
  if (!payload) {
    return {
      steps: fallbackSteps,
      context: "",
      usedFallback: true,
      signature: buildLiveStepsSignature(fallbackSteps),
    };
  }

  const tempText = block(payload.blocks, "TEMPERATURA", "TEMPERATURE");
  const stepsText = block(payload.blocks, "PASOS", "STEPS");
  const entries = parsePlanSteps(stepsText).map((entry) => localizeLiveStepEntry(entry, surfaceLang));
  const targets = parseTempTargets(tempText);

  if (entries.length === 0) {
    return {
      steps: fallbackSteps,
      context: `${getAnimalSurfaceLabel(payload.input.animal, surfaceLang)} · ${payload.input.cut} · ${getEquipmentSurfaceLabel(payload.input.equipment, surfaceLang)}`,
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
      (zone === "Rest" ? targets.final : targets.pull ?? null);
    const label = pickLabel(entry);
    const notes = pickStepInstruction(entry, surfaceLang);
    const phaseMetadata = getLiveCookingPhaseMetadata({
      label,
      zone,
      duration,
      notes,
      index,
      totalSteps: entries.length,
      timeSemantics: payload.timeSemantics,
    });

    return {
      id: `plan-step-${index + 1}`,
      label,
      zone,
      duration,
      tempTarget,
      notes,
      ...phaseMetadata,
    };
  });

  const signature = buildLiveStepsSignature(steps);

  return {
    steps,
    context: `${getAnimalSurfaceLabel(payload.input.animal, surfaceLang)} · ${payload.input.cut} · ${getEquipmentSurfaceLabel(payload.input.equipment, surfaceLang)}`,
    usedFallback: false,
    signature,
  };
}
