import type { Doneness } from "@/lib/types/domain";
import { toAnimalId } from "@/lib/navigation/animalParam";
import { canonicalizeCutId } from "@/lib/navigation/canonicalCutId";
import type { Lang } from "@/lib/i18n/texts";

type CookingNavigationParams = {
  animal?: string;
  cutId?: string;
  doneness?: string;
  thickness?: string;
  lang?: Lang;
};

const VALID_DONENESS: ReadonlySet<Doneness> = new Set([
  "rare",
  "medium_rare",
  "medium",
  "medium_well",
  "well_done",
  "safe",
]);

function normalizeCutId(value: string | undefined) {
  return canonicalizeCutId(value);
}

function normalizeDoneness(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return VALID_DONENESS.has(trimmed as Doneness) ? trimmed : undefined;
}

function normalizeThickness(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed.replace(",", "."));
  return Number.isFinite(numeric) && numeric > 0 ? trimmed : undefined;
}

function normalizeLang(value: string | undefined) {
  if (value === "es" || value === "en" || value === "fi") return value;
  return undefined;
}

function buildCookingUrl(step: "details" | "result", params: CookingNavigationParams = {}) {
  const search = new URLSearchParams();
  search.set("mode", "coccion");
  search.set("step", step);

  const animal = toAnimalId(params.animal);
  const cutId = canonicalizeCutId(normalizeCutId(params.cutId), animal);
  const doneness = normalizeDoneness(params.doneness);
  const thickness = normalizeThickness(params.thickness);
  const lang = normalizeLang(params.lang);

  if (animal) search.set("animal", animal);
  if (cutId) search.set("cutId", cutId);
  if (doneness) search.set("doneness", doneness);
  if (thickness) search.set("thickness", thickness);
  if (lang) search.set("lang", lang);

  return `/?${search.toString()}`;
}

export function buildCookingDetailsUrl(params: CookingNavigationParams = {}) {
  return buildCookingUrl("details", params);
}

export function buildCookingResultUrl(params: CookingNavigationParams = {}) {
  return buildCookingUrl("result", params);
}

export function buildHomeUrl(lang?: Lang) {
  const search = new URLSearchParams({ mode: "inicio" });
  const normalizedLang = normalizeLang(lang);
  if (normalizedLang) search.set("lang", normalizedLang);
  return `/?${search.toString()}`;
}
