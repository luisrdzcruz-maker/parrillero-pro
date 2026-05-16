import type { LiveCookingStepState, LiveZone } from "@/hooks/useLiveCooking";
import { getLiveText, type SurfaceLang } from "@/lib/i18n/surfaceFallbacks";
import { texts } from "@/lib/i18n/texts";

export type ActionKind = "preheat" | "sear" | "flip" | "move" | "rest" | "serve" | "manual";

const COMBINING_MARKS = /[̀-ͯ]/g;

function normalize(value: string) {
  return value.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();
}

function includesAny(value: string, terms: string[]) {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(term));
}

export function resolveCurrentActionKind(currentStep: LiveCookingStepState): ActionKind {
  const text = `${currentStep.name} ${currentStep.instructions}`;

  if (currentStep.zone === "rest" || includesAny(text, ["rest", "repos", "lepuut"])) return "rest";
  if (includesAny(text, ["serve", "servir", "slice", "cortar", "grain", "fibra"])) return "serve";
  if (includesAny(text, ["flip", "turn", "side 2", "lado 2", "voltea", "dar vuelta", "kaanna"])) {
    return "flip";
  }
  if (includesAny(text, ["move", "shift", "mover", "mueve", "siirra"])) return "move";
  if (includesAny(text, ["preheat", "precalienta", "esilamita"])) return "preheat";
  if (includesAny(text, ["sear", "sell", "dorar", "crust", "mark", "ruskista"])) return "sear";
  return currentStep.duration > 0 ? "sear" : "manual";
}

export function getActionLabel(kind: ActionKind, lang: SurfaceLang) {
  const text = getLiveText(lang);
  const labels: Record<ActionKind, string> = {
    preheat: text.actionPreheat,
    sear: text.actionSear,
    flip: text.actionFlip,
    move: text.actionMove,
    rest: text.actionRest,
    serve: text.actionServe,
    manual: text.actionManual,
  };
  return labels[kind];
}

export function getActionHint(kind: ActionKind, lang: SurfaceLang) {
  const text = getLiveText(lang);
  const hints: Record<ActionKind, string> = {
    preheat: text.actionHintPreheat,
    sear: text.actionHintSear,
    flip: text.actionHintFlip,
    move: text.actionHintMove,
    rest: text.actionHintRest,
    serve: text.actionHintServe,
    manual: text.actionHintManual,
  };
  return hints[kind];
}

export function getMistakeHint(
  name: string,
  instructions: string,
  zone: LiveZone,
  lang: SurfaceLang = "en",
): string | null {
  const copy = texts[lang];
  const labels = {
    waitCrust: copy.liveStepMistakeWaitCrust,
    flipOnce: copy.liveStepMistakeFlipOnce,
    rest: copy.liveStepMistakeRest,
    lidClosed: copy.liveStepMistakeLidClosed,
    noPress: copy.liveStepMistakeNoPress,
  } as const;

  const text = normalize(`${name} ${instructions}`);

  if (text.includes("sear") || text.includes("crust") || text.includes("brown") || text.includes("mark")) {
    return labels.waitCrust;
  }
  if (text.includes("flip") || text.includes("turn") || text.includes("side 2") || text.includes("lado 2")) {
    return labels.flipOnce;
  }
  if (zone === "rest") {
    return labels.rest;
  }
  if (zone === "indirect" || text.includes("indirect")) {
    return labels.lidClosed;
  }
  if (zone === "direct") {
    return labels.noPress;
  }
  return null;
}

export function getFireLabel(zone: LiveZone, lang: SurfaceLang) {
  const text = getLiveText(lang);
  if (zone === "direct") return text.fireDirectLabel;
  if (zone === "indirect") return text.fireIndirectLabel;
  return text.fireRestLabel;
}

export function formatTargetTemp(tempTarget: number | null, lang: SurfaceLang) {
  const text = getLiveText(lang);
  if (tempTarget == null) return text.noTargetTempLabel;
  return text.targetTempTemplate.replace("{value}", String(tempTarget));
}

export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatDurationShort(seconds: number): string {
  if (seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  if (secs === 0) return `${minutes}m`;
  return `${minutes}m ${secs}s`;
}
