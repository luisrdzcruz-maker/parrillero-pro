import type { Lang } from "@/lib/i18n/texts";

import { asText } from "./text";

export type EngineLang = "es" | "en";

export const LANG_STORAGE_KEY = "parrillero_lang";

export function parseSavedLang(value: unknown): Lang {
  const text = asText(value);
  // Legacy 'fi' storage from prior versions: silently fall back to 'en'.
  if (text === "fi") return "en";
  if (text === "en" || text === "es") return text;
  return "es";
}

export function parseLangParam(value: string | null | undefined): Lang | null {
  // Legacy 'fi' URL state from prior versions: silently fall back to 'en'.
  if (value === "fi") return "en";
  if (value === "en" || value === "es") return value;
  return null;
}

export function engineLang(lang: Lang): EngineLang {
  return lang === "es" ? "es" : "en";
}

export function catalogLang(lang: Lang) {
  return lang;
}

export function localeForLang(lang: Lang) {
  if (lang === "en") return "en-US";
  return "es-ES";
}

export function getPlanTextDefaults(lang: Lang) {
  if (lang === "en") {
    return {
      planProduct: "ribeye",
      menuMeats: "ribeye, secreto iberico",
      sides: "potatoes, salad, chimichurri",
      parrilladaProducts: "ribs, ribeye, secreto iberico, corn",
      parrilladaSides: "potatoes, salad, chimichurri",
    };
  }

  return {
    planProduct: "chuletón",
    menuMeats: "chuletón, secreto ibérico",
    sides: "patatas, ensalada, chimichurri",
    parrilladaProducts: "costillas, chuletón, secreto ibérico, maíz",
    parrilladaSides: "patatas, ensalada, chimichurri",
  };
}
