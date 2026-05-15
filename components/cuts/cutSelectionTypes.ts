import type {
  GeneratedAnimalId,
  GeneratedCookingMethod,
  GeneratedCutProfile,
} from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";

export type CutIntent = "quick" | "premium" | "easy" | "slow" | "value" | "argentinian";
export type CutViewMode = "list" | "map";

export type CutGroup = {
  id: string;
  label: string;
  cuts: GeneratedCutProfile[];
};

export type CutSelectionScreenProps = {
  selectedAnimal: GeneratedAnimalId;
  lang?: Lang;
  intentFilter?: CutIntent | null;
  selectedCutId?: string | null;
  onStartCooking?: (profile: GeneratedCutProfile) => void;
  onPreviewCutChange?: (cutId: string | null) => void;
  onAnimalChange?: (animal: GeneratedAnimalId) => void;
  isAnimalPreselected?: boolean;
};

const fallbackLang: Lang = "en";
const compactBeefLabelByLang: Record<Lang, string> = {
  es: "Vaca",
  en: "Beef",
};

const animalLabelsByLang: Record<Lang, Record<GeneratedAnimalId, string>> = {
  es: {
    beef: "Vacuno",
    pork: "Cerdo",
    chicken: "Pollo",
    fish: "Pescado",
    vegetables: "Verduras",
  },
  en: {
    beef: "Beef",
    pork: "Pork",
    chicken: "Chicken",
    fish: "Fish",
    vegetables: "Vegetables",
  },
};

const methodLabelsByLang: Record<Lang, Record<GeneratedCookingMethod, string>> = {
  es: {
    grill_direct: "Parrilla directa",
    grill_indirect: "Parrilla indirecta",
    reverse_sear: "Sellado inverso",
    oven_pan: "Sartén u horno",
    vegetables_grill: "Verduras a la parrilla",
  },
  en: {
    grill_direct: "Direct grill",
    grill_indirect: "Indirect grill",
    reverse_sear: "Reverse sear",
    oven_pan: "Pan or oven",
    vegetables_grill: "Grilled vegetables",
  },
};

const intentLabelsByLang: Record<Lang, Record<CutIntent, string>> = {
  es: {
    quick: "Rápido",
    premium: "Premium",
    easy: "Fácil",
    slow: "Cocción lenta",
    value: "Rendidor",
    argentinian: "Estilo argentino",
  },
  en: {
    quick: "Quick",
    premium: "Premium",
    easy: "Easy",
    slow: "Slow cook",
    value: "Value",
    argentinian: "Argentine style",
  },
};

function resolveLang(lang?: Lang): Lang {
  return lang ?? fallbackLang;
}

export function getAnimalLabel(animalId: GeneratedAnimalId, lang?: Lang) {
  return animalLabelsByLang[resolveLang(lang)][animalId];
}

export function getCompactAnimalLabel(animalId: GeneratedAnimalId, lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (animalId === "beef") return compactBeefLabelByLang[resolvedLang];
  return getAnimalLabel(animalId, resolvedLang);
}

export function getAnimalLabels(lang?: Lang) {
  return animalLabelsByLang[resolveLang(lang)];
}

export function getMethodLabel(method: GeneratedCookingMethod, lang?: Lang) {
  return methodLabelsByLang[resolveLang(lang)][method];
}

export function getIntentLabel(intent: CutIntent, lang?: Lang) {
  return intentLabelsByLang[resolveLang(lang)][intent];
}

export function getAllGoalsLabel(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Todos los objetivos";

  return "All goals";
}

export function getCutsUnitLabel(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "cortes";

  return "cuts";
}

export function getViewModeLabel(mode: CutViewMode, lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (mode === "list") {
    if (resolvedLang === "es") return "Lista";

    return "List";
  }

  if (resolvedLang === "es") return "Mapa";

  return "Map";
}

export function getViewAllLabel(count: number, animal: GeneratedAnimalId, lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  const animalLabel = getCompactAnimalLabel(animal, resolvedLang).toLowerCase();

  if (resolvedLang === "es") {
    return `Ver todos los cortes de ${animalLabel} (${count})`;
  }
  return `View all ${animalLabel} cuts (${count})`;
}

export function getHideAllLabel(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Ocultar todos los cortes";

  return "Hide all cuts";
}

export function getCurrentSelectionLabel(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Selección activa";

  return "Current selection";
}

export function getClearZoneLabel(zoneLabel: string, lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return `Limpiar zona: ${zoneLabel}`;

  return `Clear zone: ${zoneLabel}`;
}

export function getCategoryLabelUi(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Categoría";

  return "Category";
}

export function getNoCutsTitle(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "No hay cortes que coincidan con tus filtros actuales.";

  return "No cuts match your current filters.";
}

export function getNoCutsMessage(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Prueba otro objetivo de cocción o limpia los filtros para ver todas las opciones.";

  return "Try a different cooking goal or clear the current filters to see every option.";
}

export function getResetFiltersLabel(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Reiniciar filtros";

  return "Reset filters";
}

export function getCutSearchPlaceholder(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Buscar corte por nombre...";

  return "Search by cut name...";
}

export function getCutSearchAriaLabel(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Buscar entre todos los cortes";

  return "Search all cuts";
}

export function getCutSearchClearLabel(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Limpiar búsqueda";

  return "Clear search";
}

export function getCutSearchNoResultsTitle(query: string, lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return `No encontramos cortes para "${query}"`;

  return `No cuts found for "${query}"`;
}

export function getCutSearchNoResultsMessage(lang?: Lang) {
  const resolvedLang = resolveLang(lang);
  if (resolvedLang === "es") return "Prueba otro nombre, alias o zona del animal.";

  return "Try another name, alias, or animal area.";
}
