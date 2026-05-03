"use client";

import ResultActions from "@/components/ResultActions";
import ResultHeader from "@/components/ResultHeader";
import { Panel } from "@/components/ui";
import type { ResultSummary } from "@/components/ResultGrid";

type SaveMenuStatus = "idle" | "saving" | "success" | "error";
type Lang = "es" | "en" | "fi";
type MetricTone = "orange" | "red" | "sky";

const restPattern = /\b(reposo|reposa|reposar|descanso|rest|resting|lepuutus|lepuuta|lepaa|levata)\b/i;

function normalizeMetricText(value = "") {
  return value
    .split("\n")
    .map((line) => line.trim().replace(/^[-•*\d.)\s]+/, ""))
    .find(Boolean)
    ?.replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim() ?? "";
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

function extractMinuteValues(value: string, options: { excludeRest: boolean; ignoreEllipsisSegments?: boolean }) {
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

function temperatureSuffix(value: string, lang: Lang) {
  if (/\b(salida|retirar|sacar|pull|remove)\b/i.test(value)) {
    if (lang === "en") return "pull";
    if (lang === "fi") return "ulos";
    return "salida";
  }
  if (/\b(final|servir|serve|ready|valmis)\b/i.test(value)) return lang === "fi" ? "valmis" : "final";
  return "";
}

function compactTemperatureMetric(value?: string, doneness?: string, lang: Lang = "es") {
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

export default function ResultHero({
  actions,
  animal,
  context,
  cut,
  doneness,
  hasResult,
  lang = "es",
  onEdit,
  saveMenuStatus,
  summary,
  t,
}: {
  actions: {
    onCopy: () => void;
    onSave?: () => Promise<void>;
    onShare?: () => void;
    onStartCooking?: () => void;
  };
  animal?: string;
  context?: string;
  cut?: string;
  doneness?: string;
  hasResult: boolean;
  lang?: "es" | "en" | "fi";
  onEdit?: () => void;
  saveMenuStatus?: SaveMenuStatus;
  summary?: ResultSummary;
  t: {
    copy: string;
    save: string;
    saving: string;
    share: string;
    startCooking: string;
  };
}) {
  const isEs = lang === "es";
  const isFi = lang === "fi";
  const eyebrow = animal || context || (isEs ? "Plan de coccion" : isFi ? "Kypsennyssuunnitelma" : "Cooking plan");
  const title = cut || (isEs ? "Resultado listo" : isFi ? "Tulos valmis" : "Result ready");
  const method = summary?.method || "";
  const restMetric = compactRestMetric(summary?.rest);
  const target = compactTemperatureMetric(summary?.temperature, summary?.doneness || doneness, lang);
  const usedMetricValues = new Set<string>();

  const heroMetrics = [
    { label: isEs ? "Tiempo" : isFi ? "Aika" : "Time", value: compactTimeMetric(summary?.time, restMetric), tone: "orange" },
    { label: isEs ? "Objetivo" : isFi ? "Tavoite" : "Target", value: target, tone: "red" },
    { label: isEs ? "Reposo" : isFi ? "Lepuutus" : "Rest", value: restMetric, tone: "sky" },
  ].filter((item): item is { label: string; value: string; tone: MetricTone } => {
    if (!item.value) return false;
    const normalized = item.value.toLowerCase();
    if (usedMetricValues.has(normalized)) return false;
    usedMetricValues.add(normalized);
    return true;
  });

  function getMetricClass(tone: MetricTone) {
    if (tone === "red") return "border-red-300/25 bg-red-500/[0.08] text-red-50 ring-red-200/[0.04]";
    if (tone === "sky") return "border-sky-300/20 bg-sky-500/[0.07] text-sky-50 ring-sky-200/[0.04]";
    return "border-orange-300/25 bg-orange-500/[0.09] text-orange-50 ring-orange-200/[0.05]";
  }

  return (
    <Panel as="section" className="relative mb-3 overflow-hidden p-4 sm:mb-5 sm:p-5" tone="hero">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-orange-500/[0.06] blur-2xl" />

      <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <ResultHeader
            eyebrow={eyebrow}
            method={method}
            onEdit={onEdit}
            safety={summary?.safety}
            title={title}
            t={{
              edit: isEs ? "Editar" : isFi ? "Muokkaa" : "Edit",
              fallbackSummary: isEs
                ? "Lo esencial para cocinar sin dudar."
                : isFi
                  ? "Oleellinen selkeaan ja varmaan kypsennykseen."
                  : "The essentials for confident cooking.",
              safety: isEs ? "Senal segura" : isFi ? "Turvasignaali" : "Safety signal",
            }}
          />

          {heroMetrics.length > 0 && (
            <div
              className={`grid gap-2 ${heroMetrics.length >= 3 ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-2"}`}
            >
              {heroMetrics.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-3 shadow-lg shadow-black/10 ring-1 ring-inset ${getMetricClass(item.tone)}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-current/70">
                    {item.label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-black leading-snug text-white sm:min-h-9">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <ResultActions
            actions={actions}
            compact
            hasResult={hasResult}
            lang={lang}
            secondary
            status={saveMenuStatus}
            t={{
              copy: t.copy,
              save: t.save,
              saving: t.saving,
              share: t.share,
              startCooking: t.startCooking,
            }}
          />
        </div>
      </div>
    </Panel>
  );
}
