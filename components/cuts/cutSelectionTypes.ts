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
  fi: {
    beef: "Nauta",
    pork: "Sika",
    chicken: "Kana",
    fish: "Kala",
    vegetables: "Kasvikset",
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
  fi: {
    grill_direct: "Suora grillaus",
    grill_indirect: "Epäsuora grillaus",
    reverse_sear: "Käänteinen paisto",
    oven_pan: "Pannu tai uuni",
    vegetables_grill: "Grillatut kasvikset",
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
  fi: {
    quick: "Nopea",
    premium: "Premium",
    easy: "Helppo",
    slow: "Hidas kypsennys",
    value: "Edullinen",
    argentinian: "Argentiinalainen tyyli",
  },
};

function resolveLang(lang?: Lang): Lang {
  return lang ?? fallbackLang;
}

export function getAnimalLabel(animalId: GeneratedAnimalId, lang?: Lang) {
  return animalLabelsByLang[resolveLang(lang)][animalId];
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
