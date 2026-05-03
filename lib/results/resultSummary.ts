import { localizeResultSurfaceCopy } from "@/lib/i18n/surfaceFallbacks";

export type ResultLang = "es" | "en" | "fi";
export type ResultBlocks = Record<string, string>;

export type ResultSummary = {
  method: string;
  time: string;
  temperature: string;
  doneness: string;
  rest: string;
  cutting: string;
  safety: string;
  criticalError: string;
};

function getLocalizedInternalCopyFallback(lang: ResultLang) {
  if (lang === "es") return "Evita sobrecocinar el centro magro antes de terminar el dorado.";
  if (lang === "fi") return "Valta ylikypsentamasta vähärasvaista osaa ennen pinnan viimeistelya.";
  return "Avoid overcooking the lean center before the crust finishes.";
}

function looksLikeInternalDescriptorCopy(value: string) {
  return /\b(overcook(?:ing)?|lean eye|fat renders|pink core|fat rim|thin crust|low chew|firm beef bite|buttery soft bite)\b/i.test(
    value,
  );
}

export function sanitizeUserFacingGuidance(value: string, lang: ResultLang) {
  if (lang === "en") return value;
  if (!looksLikeInternalDescriptorCopy(value)) return value;
  return getLocalizedInternalCopyFallback(lang);
}

export function getFirstUsefulLine(value = "") {
  return (
    value
      .split("\n")
      .map((line) => line.trim().replace(/^[-•]\s*/, ""))
      .find(Boolean) ?? ""
  );
}

export function compactSummaryValue(value: string) {
  const clean = getFirstUsefulLine(value);
  return clean.length > 78 ? `${clean.slice(0, 75).trim()}...` : clean;
}

export function compactDetailValue(value: string) {
  const clean = getFirstUsefulLine(value).replace(/^[^:]{1,28}:\s*/, "");
  return clean.length > 96 ? `${clean.slice(0, 93).trim()}...` : clean;
}

function findBlockKey(keys: string[], candidates: string[]) {
  return keys.find((key) => candidates.includes(key.toUpperCase()));
}

function getSearchableLines(blocks: ResultBlocks, keys: string[]) {
  return keys
    .flatMap((key) => blocks[key]?.split("\n") ?? [])
    .map((line) => line.trim().replace(/^[-•*\d.)\s]+/, ""))
    .filter(Boolean);
}

function extractMatchingLine(blocks: ResultBlocks, keys: string[], patterns: RegExp[]) {
  const lines = getSearchableLines(blocks, keys);
  const match = lines.find((line) => patterns.some((pattern) => pattern.test(line)));
  return match ? compactDetailValue(match) : "";
}

function extractDonenessValue(blocks: ResultBlocks, keys: string[]) {
  const explicitKey = findBlockKey(keys, ["PUNTO", "DONENESS", "POINT", "KYPSYYS"]);
  if (explicitKey) return compactSummaryValue(blocks[explicitKey]);

  const candidateText = keys
    .map((key) => blocks[key])
    .filter(Boolean)
    .join("\n");
  const line = candidateText
    .split("\n")
    .map((value) => value.trim())
    .find((value) =>
      /(^|\b)(punto|doneness|point|t[eé]rmino|termino|kypsyys)(\b|:)/i.test(value),
    );

  if (!line) return "";

  const [, value = ""] = line.split(/:\s+(.+)/);
  return compactSummaryValue(value || line);
}

export function buildResultSummary(
  blocks: ResultBlocks,
  keys: string[],
  lang: ResultLang = "es",
): ResultSummary {
  const setupKey = findBlockKey(keys, ["SETUP", "CONFIGURACION", "CONFIGURACIÓN"]);
  const timeKey = findBlockKey(keys, ["TIEMPOS", "TIMES"]);
  const tempKey = findBlockKey(keys, ["TEMPERATURA", "TEMPERATURE"]);
  const errorKey = findBlockKey(keys, ["ERROR", "ERROR CLAVE", "KEY ERROR"]);

  return {
    method: setupKey ? compactSummaryValue(localizeResultSurfaceCopy(blocks[setupKey], lang)) : "",
    time: timeKey ? compactSummaryValue(localizeResultSurfaceCopy(blocks[timeKey], lang)) : "",
    temperature: tempKey ? compactSummaryValue(localizeResultSurfaceCopy(blocks[tempKey], lang)) : "",
    doneness: localizeResultSurfaceCopy(extractDonenessValue(blocks, keys), lang),
    rest: localizeResultSurfaceCopy(
      extractMatchingLine(blocks, keys, [/\b(reposo|reposar|descanso|rest|resting)\b/i]),
      lang,
    ),
    cutting: localizeResultSurfaceCopy(
      extractMatchingLine(blocks, keys, [
        /\b(cortar|corte|cortarlo|trinchar|slice|cutting|carve)\b/i,
        /\b(contra\s+(la\s+)?fibra|against\s+the\s+grain)\b/i,
      ]),
      lang,
    ),
    safety: localizeResultSurfaceCopy(
      extractMatchingLine(blocks, keys, [
        /\b(seguridad|seguro|inocuo|safety|safe)\b/i,
        /\b(term[oó]metro|thermometer|no\s+servir|do\s+not\s+serve)\b/i,
      ]),
      lang,
    ),
    criticalError: errorKey ? sanitizeUserFacingGuidance(compactDetailValue(blocks[errorKey]), lang) : "",
  };
}
