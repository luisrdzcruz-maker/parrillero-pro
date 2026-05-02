import {
  generatedCutProfiles,
  type GeneratedAnimalId,
  type GeneratedCookingStyle,
  type GeneratedCutProfile,
} from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";
import { resolveProductCut } from "@/lib/resolveCookingProfile";
import type { CutGroup, CutIntent } from "./cutSelectionTypes";

const categoryLabelsByLang: Record<Lang, Record<string, string>> = {
  es: {
    bbq: "BBQ",
    breast: "Pechuga",
    fillet: "Filetes",
    ground: "Picada",
    leg: "Pierna",
    loin: "Lomo",
    ribs: "Costillas",
    roast: "Asados",
    steak: "Steaks",
    tail: "Cola",
    thigh: "Muslos",
    vegetable: "Verduras",
    whole: "Entero",
    wing: "Alitas",
  },
  en: {
    bbq: "BBQ",
    breast: "Breast",
    fillet: "Fillets",
    ground: "Ground",
    leg: "Leg",
    loin: "Loin",
    ribs: "Ribs",
    roast: "Roasts",
    steak: "Steaks",
    tail: "Tail",
    thigh: "Thighs",
    vegetable: "Vegetables",
    whole: "Whole",
    wing: "Wings",
  },
  fi: {
    bbq: "BBQ",
    breast: "Rinta",
    fillet: "Fileet",
    ground: "Jauheliha",
    leg: "Koipi",
    loin: "Lanne",
    ribs: "Ribsit",
    roast: "Paistit",
    steak: "Pihvit",
    tail: "Pyrstö",
    thigh: "Reidet",
    vegetable: "Kasvikset",
    whole: "Kokonainen",
    wing: "Siivet",
  },
};

const styleLabelsByLang: Record<Lang, Record<GeneratedCookingStyle, string>> = {
  es: {
    crispy: "Crujiente",
    fast: "Fuego directo",
    fatcap: "Tapa de grasa",
    fish: "Pescado",
    lowSlow: "Fuego bajo y lento",
    poultry: "Aves",
    reverse: "Sellado inverso",
    thick: "Corte grueso",
    vegetable: "Verduras",
  },
  en: {
    crispy: "Crispy",
    fast: "Direct heat",
    fatcap: "Fat cap",
    fish: "Fish",
    lowSlow: "Low and slow",
    poultry: "Poultry",
    reverse: "Reverse sear",
    thick: "Thick cut",
    vegetable: "Vegetables",
  },
  fi: {
    crispy: "Rapea",
    fast: "Suora lämpö",
    fatcap: "Rasvakerros",
    fish: "Kala",
    lowSlow: "Matala ja hidas",
    poultry: "Kana",
    reverse: "Käänteinen paisto",
    thick: "Paksu pala",
    vegetable: "Kasvikset",
  },
};

const helpfulAliasByCutId: Record<string, string> = {
  ribeye: "Rib eye",
  striploin: "New York strip",
  tenderloin: "Filet",
  tomahawk: "Bone-in ribeye",
  pork_tenderloin: "Pork fillet",
};

const localizedCutContentOverrides: Record<
  string,
  Partial<{
    names: Partial<Record<Lang, string>>;
    descriptions: Partial<Record<Lang, string>>;
    aliases: Partial<Record<Lang, string[]>>;
  }>
> = {
  ribeye: {
    names: { es: "Ribeye", fi: "Ribeye" },
    descriptions: {
      es: "Steak premium con buena infiltración y costra intensa.",
      fi: "Premium-pihvi, jossa hyvä rasvoitus ja vahva paistopinta.",
    },
    aliases: { es: ["Ojo de bife", "Entrecot"], fi: ["Rib eye"] },
  },
};

export function getCutsByAnimal(animal: GeneratedAnimalId) {
  return generatedCutProfiles.filter((profile) => profile.animalId === animal);
}

export function getCutsByAnimalAndCategory(animal: GeneratedAnimalId, category: string) {
  return getCutsByAnimal(animal).filter((profile) => profile.category === category);
}

export function getQuickPicksByAnimal(animal: GeneratedAnimalId, tag?: CutIntent | null) {
  const cuts = getCutsByAnimal(animal);
  const taggedCuts = tag ? cuts.filter((profile) => hasIntent(profile, tag)) : cuts.filter((profile) => hasIntent(profile, "quick"));
  return taggedCuts.slice(0, 6);
}

export function getCategoryGroups(profiles: GeneratedCutProfile[], lang: Lang = "en"): CutGroup[] {
  const groups = new Map<string, GeneratedCutProfile[]>();

  for (const profile of profiles) {
    const category = profile.category || "other";
    groups.set(category, [...(groups.get(category) ?? []), profile]);
  }

  return [...groups.entries()].map(([category, cuts]) => ({
    id: category,
    label: getCategoryLabel(category, lang),
    cuts,
  }));
}

export function getAvailableCategories(animal: GeneratedAnimalId) {
  return [...new Set(getCutsByAnimal(animal).map((profile) => profile.category).filter(Boolean))];
}

export function filterCutsByIntent(profiles: GeneratedCutProfile[], intent: CutIntent | null) {
  if (!intent) return profiles;
  return profiles.filter((profile) => hasIntent(profile, intent));
}

export function hasIntent(profile: GeneratedCutProfile, intent: CutIntent) {
  const tags = getTagSet(profile);
  if (intent === "slow") return tags.has("slow") || profile.style === "lowSlow";
  return tags.has(intent);
}

export function getDisplayName(profile: GeneratedCutProfile, lang: Lang = "en") {
  return getCutDisplayName(profile, lang);
}

export function getCutDescriptor(profile: GeneratedCutProfile, lang: Lang = "en") {
  return getCutDescription(profile, lang);
}

export function getHelpfulAlias(profile: GeneratedCutProfile, lang: Lang = "en") {
  const aliases = getCutAliases(profile, lang);
  if (aliases.length > 0) return aliases[0];
  return helpfulAliasByCutId[profile.id] ?? null;
}

export function getWhyChooseLabel(profile: GeneratedCutProfile, lang: Lang = "en") {
  const fallbackByLang: Record<Lang, string> = {
    es: "Una opción confiable para este tipo de cocción.",
    en: "A reliable choice for this cooking path.",
    fi: "Luotettava valinta tähän kypsennystapaan.",
  };
  return toDisplaySentence(profile.textureResultEn || profile.notesEn || profile.errorEn || fallbackByLang[lang]);
}

export function getDifficultyLabel(profile: GeneratedCutProfile, lang: Lang = "en") {
  const labelsByLang: Record<Lang, { easy: string; medium: string; hard: string }> = {
    es: { easy: "Fácil", medium: "Media", hard: "Alta" },
    en: { easy: "Easy", medium: "Medium", hard: "Hard" },
    fi: { easy: "Helppo", medium: "Keskitaso", hard: "Vaikea" },
  };
  if (profile.confidenceLevel === "high" || profile.tipsEn.includes("easy")) return labelsByLang[lang].easy;
  if (profile.style === "lowSlow" || profile.confidenceLevel === "low") return labelsByLang[lang].hard;
  return labelsByLang[lang].medium;
}

export function getEstimatedTimeLabel(profile: GeneratedCutProfile, lang: Lang = "en") {
  if (profile.estimatedTotalTimeMin) return `${profile.estimatedTotalTimeMin} min`;
  if (profile.cookingMinutes) return `${profile.cookingMinutes} min`;
  if (profile.estimatedTimeMinPerCm) return `${profile.estimatedTimeMinPerCm} min/cm`;
  if (lang === "es") return "Visual";
  if (lang === "fi") return "Visuaalinen";
  return "Visual";
}

export function getStyleLabel(profile: GeneratedCutProfile, lang: Lang = "en") {
  return styleLabelsByLang[lang][profile.style] ?? profile.cookingStyle ?? profile.style;
}

export function getTemperatureLabel(profile: GeneratedCutProfile) {
  return profile.targetTempC ? `${profile.targetTempC}°C` : null;
}

export function getCategoryLabel(category: string, lang: Lang = "en") {
  return categoryLabelsByLang[lang][category] ?? titleCase(category);
}

export function getSafetyNote(profile: GeneratedCutProfile, lang: Lang = "en") {
  if (profile.safetyNoteEn || profile.errorEn) return profile.safetyNoteEn || profile.errorEn;
  if (lang === "es") return "Usa señales visuales y manipulación segura.";
  if (lang === "fi") return "Käytä visuaalista kypsyysarviota ja turvallista käsittelyä.";
  return "Use visual doneness and safe handling.";
}

function getTagSet(profile: GeneratedCutProfile) {
  return new Set(profile.tipsEn.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
}

function getOverride(profile: GeneratedCutProfile) {
  return localizedCutContentOverrides[profile.id];
}

function getCatalogCut(profile: GeneratedCutProfile) {
  return resolveProductCut(profile.id);
}

function fallbackNameFromId(profile: GeneratedCutProfile) {
  return titleCase(profile.id);
}

function getFirstNonEmpty(values: Array<string | undefined>) {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return "";
}

export function getCutDisplayName(profile: GeneratedCutProfile, lang: Lang = "en") {
  const override = getOverride(profile);
  const catalogCut = getCatalogCut(profile);

  const requested = getFirstNonEmpty([override?.names?.[lang], catalogCut?.names?.[lang]]);
  if (requested) return requested;

  const english = getFirstNonEmpty([override?.names?.en, catalogCut?.names?.en, profile.canonicalNameEn]);
  if (english) return english;

  return fallbackNameFromId(profile);
}

export function getCutDescription(profile: GeneratedCutProfile, lang: Lang = "en") {
  const override = getOverride(profile);
  const catalogCut = getCatalogCut(profile);

  const requested = getFirstNonEmpty([
    override?.descriptions?.[lang],
    catalogCut?.notes?.[lang],
    catalogCut?.error?.[lang === "es" ? "es" : "en"],
  ]);
  if (requested) return toDisplaySentence(requested);

  const english = getFirstNonEmpty([
    override?.descriptions?.en,
    catalogCut?.notes?.en,
    catalogCut?.error?.en,
    profile.notesEn,
    profile.errorEn,
  ]);
  if (english) return toDisplaySentence(english);

  return toDisplaySentence(fallbackNameFromId(profile));
}

export function getCutAliases(profile: GeneratedCutProfile, lang: Lang = "en") {
  const override = getOverride(profile);
  const catalogCut = getCatalogCut(profile);

  const requested = override?.aliases?.[lang] ?? [];
  if (requested.length > 0) return requested;

  const english = override?.aliases?.en ?? [];
  if (english.length > 0) return english;

  return [...new Set([...(catalogCut?.aliases ?? []), ...profile.aliasesEn])];
}

function titleCase(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function toDisplaySentence(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return cleaned;
  return cleaned.endsWith(".") ? cleaned : `${cleaned}.`;
}
