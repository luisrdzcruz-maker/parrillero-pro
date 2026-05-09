import { detectSetupFromText } from "@/lib/setupVisualMap";
import { texts } from "@/lib/i18n/texts";
import type { ResultLang, ResultSummary } from "@/lib/results/resultSummary";

export type ResultRationaleSetupKey =
  | "reverse-sear"
  | "two-zone"
  | "indirect"
  | "direct"
  | "low-slow"
  | "pan-oven"
  | "fallback";

export type ResultRationaleDetail =
  | { kind: "doneness"; value: string }
  | { kind: "thickness"; cm: number }
  | { kind: "rest"; value: string };

export type ResultRationale = {
  setupKey: ResultRationaleSetupKey;
  details: ResultRationaleDetail[];
};

export type ResultRationaleCopy = {
  headline: string;
  details: string[];
};

type SelectorInputs = {
  summary?: ResultSummary;
  blocks?: Record<string, string>;
  doneness?: string;
  thicknessCm?: number;
};

const SETUP_HEADLINE_KEYS: Record<ResultRationaleSetupKey, keyof (typeof texts)["en"]> = {
  "reverse-sear": "rationaleSetupReverseSear",
  "two-zone": "rationaleSetupTwoZone",
  indirect: "rationaleSetupIndirect",
  direct: "rationaleSetupDirect",
  "low-slow": "rationaleSetupLowSlow",
  "pan-oven": "rationaleSetupPanOven",
  fallback: "rationaleSetupFallback",
};

function pickSetupKey(summary?: ResultSummary, blocks?: Record<string, string>): ResultRationaleSetupKey {
  const setupBlock = blocks?.SETUP ?? blocks?.CONFIGURACION ?? blocks?.["CONFIGURACIÓN"] ?? "";
  const text = `${summary?.method ?? ""} ${setupBlock}`.trim();
  if (!text) return "fallback";

  const detected = detectSetupFromText(text);
  switch (detected) {
    case "reverse-sear":
    case "two-zone":
    case "indirect":
    case "direct":
    case "low-slow":
    case "pan-oven":
      return detected;
    default:
      return "fallback";
  }
}

export function getResultRationale({ summary, blocks, doneness, thicknessCm }: SelectorInputs): ResultRationale {
  const setupKey = pickSetupKey(summary, blocks);

  const details: ResultRationaleDetail[] = [];
  const trimmedDoneness = doneness?.trim();
  if (trimmedDoneness) {
    details.push({ kind: "doneness", value: trimmedDoneness });
  }
  if (typeof thicknessCm === "number" && Number.isFinite(thicknessCm) && thicknessCm > 0) {
    details.push({ kind: "thickness", cm: thicknessCm });
  }
  const rest = summary?.rest?.trim();
  if (rest) {
    details.push({ kind: "rest", value: rest });
  }

  return { setupKey, details: details.slice(0, 3) };
}

function applyTemplate(template: string, value: string) {
  return template.replace("{value}", value);
}

export function formatResultRationale(rationale: ResultRationale, lang: ResultLang): ResultRationaleCopy {
  const copy = texts[lang];
  const headlineKey = SETUP_HEADLINE_KEYS[rationale.setupKey] ?? SETUP_HEADLINE_KEYS.fallback;
  const headline = (copy[headlineKey] as string | undefined) ?? (copy.rationaleSetupFallback as string);

  const details = rationale.details.map((detail) => {
    if (detail.kind === "doneness") {
      return applyTemplate(copy.rationaleDetailDoneness as string, detail.value);
    }
    if (detail.kind === "thickness") {
      return applyTemplate(copy.rationaleDetailThickness as string, String(detail.cm));
    }
    return applyTemplate(copy.rationaleDetailRest as string, detail.value);
  });

  return { headline, details };
}

export function getResultRationaleLabel(lang: ResultLang) {
  return texts[lang].resultHeroWhy;
}

export function getResultRationaleShowLabel(lang: ResultLang) {
  return texts[lang].resultHeroWhyShow;
}

export function getResultRationaleHideLabel(lang: ResultLang) {
  return texts[lang].resultHeroWhyHide;
}
