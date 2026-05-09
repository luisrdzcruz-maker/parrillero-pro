import type { Lang } from "@/lib/i18n/texts";

import { asText } from "./text";

export type EngineLang = "es" | "en";

export const LANG_STORAGE_KEY = "parrillero_lang";

export function parseSavedLang(value: unknown): Lang {
  const text = asText(value);
  if (text === "en" || text === "fi" || text === "es") return text;
  return "es";
}

export function parseLangParam(value: string | null | undefined): Lang | null {
  if (value === "en" || value === "fi" || value === "es") return value;
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
  if (lang === "fi") return "fi-FI";
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

  if (lang === "fi") {
    return {
      planProduct: "ribeye",
      menuMeats: "ribeye, secreto iberico",
      sides: "perunat, salaatti, chimichurri",
      parrilladaProducts: "ribsit, ribeye, secreto iberico, maissi",
      parrilladaSides: "perunat, salaatti, chimichurri",
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
