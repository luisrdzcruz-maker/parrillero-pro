import {
  generatedCutProfiles,
  type GeneratedAnimalId,
  type GeneratedCookingStyle,
  type GeneratedCutProfile,
} from "@/lib/generated/cutProfiles";
import { productCatalog } from "@/lib/cookingCatalog";
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
const legacyCatalogCutsById = new Map(productCatalog.map((cut) => [cut.id, cut]));
const safetyNoteTranslations: Record<string, { es: string; fi: string }> = {
  "Cook to safe pork temperature.": {
    es: "Cocina hasta una temperatura segura para cerdo.",
    fi: "Kypsenna turvalliseen porsaan sisalampotilaan.",
  },
  "Chicken must be fully cooked.": {
    es: "El pollo debe cocinarse por completo.",
    fi: "Kana on kypsennettava kokonaan.",
  },
  "Ground pork must be cooked safely.": {
    es: "La carne de cerdo picada debe cocinarse de forma segura.",
    fi: "Jauhettu porsaanliha on kypsennettava turvallisesti.",
  },
  "Ground chicken must be fully cooked.": {
    es: "El pollo picado debe cocinarse por completo.",
    fi: "Jauhettu kana on kypsennettava kokonaan.",
  },
  "Cook until flesh flakes easily.": {
    es: "Cocina hasta que la carne se desmenuce con facilidad.",
    fi: "Kypsenna kunnes liha lohkeaa helposti.",
  },
  "Cook until opaque and firm.": {
    es: "Cocina hasta que quede opaco y firme.",
    fi: "Kypsenna kunnes rakenne on opaakki ja napakka.",
  },
  "Do not overcook lean fish.": {
    es: "No sobrecocines pescados magros.",
    fi: "Ala ylikypsenna vaharasvaista kalaa.",
  },
  "Use very fresh fish; cook higher for vulnerable guests.": {
    es: "Usa pescado muy fresco; cocina mas alto para comensales vulnerables.",
    fi: "Kayta hyvin tuoretta kalaa; kypsenna korkeammaksi herkille ruokailijoille.",
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

export function getRecommendedCuts(
  profiles: GeneratedCutProfile[],
  intent: CutIntent | null,
  limit = 4,
) {
  if (profiles.length === 0) return [];

  const ranked = profiles
    .map((profile) => ({ profile, score: getRecommendationScore(profile, intent) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aMinutes = getEstimatedMinutes(a.profile) ?? Number.POSITIVE_INFINITY;
      const bMinutes = getEstimatedMinutes(b.profile) ?? Number.POSITIVE_INFINITY;
      if (aMinutes !== bMinutes) return aMinutes - bMinutes;
      return a.profile.canonicalNameEn.localeCompare(b.profile.canonicalNameEn);
    });

  const picks: GeneratedCutProfile[] = [];
  const seenCategories = new Set<string>();
  for (const entry of ranked) {
    const category = entry.profile.category || "other";
    if (seenCategories.has(category)) continue;
    picks.push(entry.profile);
    seenCategories.add(category);
    if (picks.length === limit) return picks;
  }

  for (const entry of ranked) {
    if (picks.some((profile) => profile.id === entry.profile.id)) continue;
    picks.push(entry.profile);
    if (picks.length === limit) return picks;
  }

  return picks;
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
  const override = getOverride(profile);
  const catalogCut = getLegacyCatalogCut(profile);
  const requested = getFirstNonEmpty([override?.descriptions?.[lang], catalogCut?.notes?.[lang]]);
  if (requested) return toDisplaySentence(requested);
  if (lang !== "en") return toDisplaySentence(fallbackByLang[lang]);
  const englishText = getFirstNonEmpty([
    profile.textureResultEn,
    profile.proTipEn,
    catalogCut?.notes?.en,
  ]);
  if (englishText) return toDisplaySentence(englishText);
  return toDisplaySentence(fallbackByLang[lang]);
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
  if (profile.safetyNoteEn?.trim()) {
    const translated = translateSafetyNote(profile.safetyNoteEn, lang);
    if (translated) return toDisplaySentence(translated);
    if (lang !== "en") {
      return lang === "es"
        ? "Verifica temperatura interna y manipula con seguridad."
        : "Tarkista sisalampotila ja kasittele turvallisesti.";
    }
    return toDisplaySentence(profile.safetyNoteEn);
  }
  if (lang === "es") return "Usa señales visuales y manipulación segura.";
  if (lang === "fi") return "Käytä visuaalista kypsyysarviota ja turvallista käsittelyä.";
  return "Use visual doneness and safe handling.";
}

function getTagSet(profile: GeneratedCutProfile) {
  return new Set(profile.tipsEn.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
}

function getEstimatedMinutes(profile: GeneratedCutProfile) {
  if (profile.estimatedTotalTimeMin) return profile.estimatedTotalTimeMin;
  if (profile.cookingMinutes) return profile.cookingMinutes;
  if (profile.estimatedTimeMinPerCm) {
    const thickness = Number.isFinite(profile.defaultThicknessCm) ? profile.defaultThicknessCm : 2;
    return Math.round(profile.estimatedTimeMinPerCm * Math.max(1, thickness));
  }
  return null;
}

function getRecommendationScore(profile: GeneratedCutProfile, intent: CutIntent | null) {
  const tags = getTagSet(profile);
  let score = 0;

  if (intent && hasIntent(profile, intent)) score += 40;
  if (tags.has("easy") || profile.confidenceLevel === "high") score += 18;
  if (tags.has("premium")) score += 14;

  const minutes = getEstimatedMinutes(profile);
  if (minutes !== null) {
    score += Math.max(0, 16 - Math.min(16, Math.round(minutes / 3)));
  } else {
    score += 4;
  }

  if (profile.confidenceLevel === "medium") score += 6;
  if (profile.confidenceLevel === "low") score += 2;
  return score;
}

function getOverride(profile: GeneratedCutProfile) {
  return localizedCutContentOverrides[profile.id];
}

function getCatalogCut(profile: GeneratedCutProfile) {
  return resolveProductCut(profile.id);
}

function getLegacyCatalogCut(profile: GeneratedCutProfile) {
  return legacyCatalogCutsById.get(profile.id);
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
  const catalogCut = getLegacyCatalogCut(profile);

  const requested = getFirstNonEmpty([
    override?.descriptions?.[lang],
    catalogCut?.notes?.[lang],
  ]);
  if (requested) return toDisplaySentence(requested);
  if (lang !== "en") return toDisplaySentence(getNeutralDescriptorFallback(profile, lang));

  const english = getFirstNonEmpty([
    override?.descriptions?.en,
    catalogCut?.notes?.en,
    profile.textureResultEn,
    profile.proTipEn,
  ]);
  if (english) return toDisplaySentence(english);

  return toDisplaySentence(getNeutralDescriptorFallback(profile, lang));
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

function getNeutralDescriptorFallback(profile: GeneratedCutProfile, lang: Lang) {
  const timeLabel = getEstimatedTimeLabel(profile, lang);
  const styleLabel = getStyleLabel(profile, lang);
  const categoryLabel = getCategoryLabel(profile.category || "other", lang);

  if (lang === "es") {
    return `${categoryLabel} · ${styleLabel} · ${timeLabel}`;
  }
  if (lang === "fi") {
    return `${categoryLabel} · ${styleLabel} · ${timeLabel}`;
  }
  return `${categoryLabel} · ${styleLabel} · ${timeLabel}`;
}

function translateSafetyNote(note: string, lang: Lang) {
  if (lang === "en") return note;
  const normalized = note.trim();
  const translated = safetyNoteTranslations[normalized];
  if (!translated) return "";
  return lang === "es" ? translated.es : translated.fi;
}
