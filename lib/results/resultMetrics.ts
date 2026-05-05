import { texts } from "@/lib/i18n/texts";
import type { CookingTimeSemantics } from "@/lib/cookingTimeSemantics";
import type { ResultSummary } from "@/lib/results/resultSummary";

export type ResultLang = "es" | "en" | "fi";
export type MetricTone = "orange" | "red" | "sky";
export type ResultHeroMetricItem = {
  label: string;
  value: string;
  tone: MetricTone;
};
type ResultHeroRawMetricItem = {
  label: string;
  value: string | null | undefined;
  tone: MetricTone;
};
type ResultHeroTimeSemantics = Pick<CookingTimeSemantics, "sessionTotalMinutes">;

const restPattern = /\b(reposo|reposa|reposar|descanso|rest|resting|lepuutus|lepuuta|lepaa|levata)\b/i;

function normalizeMetricText(value = "") {
  return (
    value
      .split("\n")
      .map((line) => line.trim().replace(/^(?:[-•*]\s+|\d+[.)]\s+)/, ""))
      .find(Boolean)
      ?.replace(/\s+/g, " ")
      .replace(/\s+([.,;:])/g, "$1")
      .trim() ?? ""
  );
}

function stripMetricPrefix(value: string) {
  return value
    .replace(/^[^:]{1,34}:\s*/, "")
    .replace(/^temperatura\s+(?:de\s+)?(?:salida|final)\s*:\s*/i, "")
    .trim();
}

function looksLikeInstruction(value: string) {
  const clean = normalizeMetricText(value);
  if (!clean) return true;
  if (clean.length > 56) return true;
  if (clean.includes("...") || clean.includes("…")) return true;
  if (clean.split(/\s+/).length > 8) return true;
  return /[.;]\s+\S/.test(clean);
}

function formatMinuteValue(value: string) {
  return `${value} min`;
}

function getPlanTimeSemantics(plan: unknown): Partial<ResultHeroTimeSemantics> | undefined {
  if (!plan || typeof plan !== "object") return undefined;

  const value = (plan as { readonly timeSemantics?: unknown }).timeSemantics;
  if (!value || typeof value !== "object") return undefined;

  return value as Partial<ResultHeroTimeSemantics>;
}

export function getResultHeroSessionTotalMetric(plan: unknown) {
  const minutes = getPlanTimeSemantics(plan)?.sessionTotalMinutes;
  const minutesNumber = typeof minutes === "number" ? minutes : NaN;
  if (!Number.isFinite(minutesNumber) || minutesNumber <= 0) return "";

  // Hero total means full session time: setupMinutes + activeCookMinutes + restMinutes.
  return formatMinuteValue(String(Math.round(minutesNumber)));
}

function extractMinuteValues(
  value: string,
  options: { excludeRest: boolean; ignoreEllipsisSegments?: boolean },
) {
  const segments = normalizeMetricText(value)
    .split(/\s*(?:\+|,|;|\/|\||\by\b|\band\b|\bja\b)\s*/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const sourceSegments = segments.length > 1 ? segments : [normalizeMetricText(value)];

  return sourceSegments.flatMap((segment) => {
    if (options.excludeRest && restPattern.test(segment)) return [];
    if (options.ignoreEllipsisSegments && /(?:\.\.\.|…)/.test(segment)) return [];

    return Array.from(segment.matchAll(/(\d{1,3})\s*(?:min\.?|mins?|minutos?|minutes?)/gi), (match) => match[1]);
  });
}

function compactSegmentTotalTime(value: string) {
  const segments = normalizeMetricText(value)
    .split(/\s*(?:\+|,|;|\/|\||\by\b|\band\b|\bja\b)\s*/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length < 2) return "";

  const totalMinutes = segments.reduce((total, segment) => {
    const match = segment.match(/(\d{1,3})\s*(?:min\.?|mins?|minutos?|minutes?)/i);
    if (!match?.[1]) return total;

    const minutes = Number(match[1]);
    const multiplier = /\b(per\s+side|por\s+lado|por\s+cara|per\s+puoli)\b/i.test(segment) ? 2 : 1;
    return total + minutes * multiplier;
  }, 0);

  return totalMinutes > 0 ? formatMinuteValue(String(totalMinutes)) : "";
}

function compactTotalTime(value: string) {
  const clean = normalizeMetricText(value);
  const totalMatch = clean.match(
    /\b(?:total|aprox(?:\.|imado)?|aproximado|approx(?:\.|imate)?|estimated|yhteensa|arvio)\D{0,18}(\d{1,3})\s*(?:min\.?|mins?|minutos?|minutes?)/i,
  );
  if (totalMatch?.[1]) return `${formatMinuteValue(totalMatch[1])} aprox.`;

  const simpleMatch = clean.match(/^(\d{1,3})\s*(?:min\.?|mins?|minutos?|minutes?)(?:\s*(?:aprox\.?|approx\.?))?$/i);
  if (simpleMatch?.[1]) return clean.replace(/\s+/g, " ");

  return "";
}

function compactTimeMetric(value?: string, restValue?: string) {
  const clean = normalizeMetricText(value);
  if (!clean) return "";

  const total = compactTotalTime(clean);
  if (total && !restPattern.test(clean)) return total;

  const segmentTotal = compactSegmentTotalTime(clean);
  if (segmentTotal) return segmentTotal;

  const restMinutes = new Set(extractMinuteValues(restValue ?? "", { excludeRest: false }));
  const minuteValues = extractMinuteValues(clean, { excludeRest: true, ignoreEllipsisSegments: true }).filter(
    (minutes, index, values) => {
      if (values.length > 1 && restMinutes.has(minutes) && index === values.length - 1) return false;
      return true;
    },
  );

  if (minuteValues.length >= 2) return `${minuteValues.slice(0, 4).join(" + ")} min`;
  if (minuteValues.length === 1 && !looksLikeInstruction(clean)) return formatMinuteValue(minuteValues[0]);

  return "";
}

function temperatureSuffix(value: string, lang: ResultLang) {
  if (/\b(salida|retirar|sacar|pull|remove)\b/i.test(value)) {
    if (lang === "en") return "pull";
    if (lang === "fi") return "ulos";
    return "salida";
  }
  if (/\b(final|servir|serve|ready|valmis)\b/i.test(value)) return lang === "fi" ? "valmis" : "final";
  return "";
}

function compactTemperatureMetric(value?: string, doneness?: string, lang: ResultLang = "es") {
  const clean = normalizeMetricText(value);
  const donenessClean = stripMetricPrefix(normalizeMetricText(doneness));
  const temperatures = Array.from(clean.matchAll(/(\d{2,3})\s*(?:\u00b0)?\s*c\b/gi), (match) => ({
    label: `${match[1]}\u00b0C`,
    index: match.index ?? 0,
  }));

  if (temperatures.length >= 2) return `${temperatures[0].label} \u2192 ${temperatures[1].label}`;

  if (temperatures.length === 1) {
    const context = clean.slice(Math.max(0, temperatures[0].index - 28), temperatures[0].index + 48);
    const suffix = temperatureSuffix(context || clean, lang);
    const compactDoneness = donenessClean && !looksLikeInstruction(donenessClean) ? donenessClean : "";
    if (suffix) return `${temperatures[0].label} ${suffix}`;
    if (compactDoneness && compactDoneness.length <= 18) return `${compactDoneness} \u00b7 ${temperatures[0].label}`;
    return temperatures[0].label;
  }

  const stripped = stripMetricPrefix(clean || donenessClean);
  if (!looksLikeInstruction(stripped)) return stripped;
  return "";
}

function extractTemperaturePair(value?: string) {
  const clean = normalizeMetricText(value);
  const temperatures = Array.from(clean.matchAll(/(\d{2,3})\s*(?:\u00b0)?\s*c\b/gi), (match) => ({
    label: `${match[1]}\u00b0C`,
    index: match.index ?? 0,
  }));

  if (temperatures.length === 0) return { pull: "", target: "" };

  const pullTemperature =
    temperatures.find(({ index }) =>
      /\b(salida|retirar|sacar|pull|remove)\b/i.test(clean.slice(Math.max(0, index - 36), index + 36)),
    ) ?? temperatures[0];
  const targetTemperature =
    temperatures.find(({ index }) =>
      /\b(final|servir|serve|ready|valmis)\b/i.test(
        clean.slice(Math.max(0, index - 36), index + 56),
      ),
    ) ?? temperatures.find((temperature) => temperature.label !== pullTemperature.label);

  return {
    pull: pullTemperature.label,
    target: targetTemperature?.label ?? "",
  };
}

function compactRestMetric(value?: string) {
  const clean = normalizeMetricText(value);
  if (!clean) return "";

  const minuteValues = extractMinuteValues(clean, { excludeRest: false, ignoreEllipsisSegments: true });
  if (minuteValues.length === 1 && (restPattern.test(clean) || !looksLikeInstruction(clean))) {
    return formatMinuteValue(minuteValues[0]);
  }

  const restMatch = clean.match(
    /\b(?:reposo|reposa|reposar|descanso|rest|resting|lepuutus|lepuuta|lepaa|levata)\D{0,24}(\d{1,3})\s*(?:min\.?|mins?|minutos?|minutes?)/i,
  );
  if (restMatch?.[1]) return formatMinuteValue(restMatch[1]);

  return "";
}

export function buildResultHeroMetrics({
  doneness,
  heroTotalTime,
  lang = "es",
  summary,
  timeFallback,
}: {
  doneness?: string;
  heroTotalTime?: string;
  lang?: ResultLang;
  summary?: ResultSummary;
  timeFallback?: string;
}) {
  const copy = texts[lang];
  const restMetric = compactRestMetric(summary?.rest);
  const temperaturePair = extractTemperaturePair(summary?.temperature);
  const fallbackTarget = compactTemperatureMetric(summary?.temperature, summary?.doneness || doneness, lang);
  const timeMetric =
    heroTotalTime || compactTimeMetric(summary?.time, restMetric) || compactTimeMetric(timeFallback, restMetric);
  const usedMetricValues = new Set<string>();

  const rawMetrics: ResultHeroRawMetricItem[] = [
    { label: copy.resultHeroMetricTime, value: timeMetric, tone: "orange" },
    { label: copy.resultHeroMetricTargetTemp, value: temperaturePair.target || fallbackTarget, tone: "red" },
    { label: copy.resultHeroMetricPullTemp, value: temperaturePair.pull, tone: "sky" },
  ];

  return rawMetrics.filter((item): item is ResultHeroMetricItem => {
    if (!item.value) return false;
    const normalized = item.value.toLowerCase();
    if (usedMetricValues.has(normalized)) return false;
    usedMetricValues.add(normalized);
    return true;
  });
}
