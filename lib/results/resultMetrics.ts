import { texts } from "@/lib/i18n/texts";
import type { ResultSummary } from "@/lib/results/resultSummary";

export type ResultLang = "es" | "en" | "fi";
export type MetricTone = "orange" | "red" | "sky";
export type ResultHeroMetricItem = {
  label: string;
  value: string;
  tone: MetricTone;
};

const restPattern = /\b(reposo|reposa|reposar|descanso|rest|resting|lepuutus|lepuuta|lepaa|levata)\b/i;

function normalizeMetricText(value = "") {
  return (
    value
      .split("\n")
      .map((line) => line.trim().replace(/^[-•*\d.)\s]+/, ""))
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
  lang = "es",
  summary,
}: {
  doneness?: string;
  lang?: ResultLang;
  summary?: ResultSummary;
}) {
  const copy = texts[lang];
  const restMetric = compactRestMetric(summary?.rest);
  const target = compactTemperatureMetric(summary?.temperature, summary?.doneness || doneness, lang);
  const usedMetricValues = new Set<string>();

  const rawMetrics = [
    { label: copy.resultHeroMetricTime, value: compactTimeMetric(summary?.time, restMetric), tone: "orange" },
    { label: copy.resultHeroMetricTarget, value: target, tone: "red" },
    { label: copy.resultHeroMetricRest, value: restMetric, tone: "sky" },
  ] as const;

  return rawMetrics.filter((item): item is ResultHeroMetricItem => {
    if (!item.value) return false;
    const normalized = item.value.toLowerCase();
    if (usedMetricValues.has(normalized)) return false;
    usedMetricValues.add(normalized);
    return true;
  });
}
