import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { Lang } from "@/lib/i18n/texts";
import { getCategoryLabel } from "./cutProfileSelectors";
import { getAnimalLabel } from "./cutSelectionTypes";

type SearchableFields = {
  activeNames: string[];
  englishNames: string[];
  aliases: string[];
  categories: string[];
  zones: string[];
  animalTerms: string[];
  activeNameForSort: string;
};

const TOKEN_SPLIT_REGEX = /[\s,./\\|_:\-]+/;

export function normalizeCutSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function tokenizeNormalized(value: string) {
  return value
    .split(TOKEN_SPLIT_REGEX)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toNormalizedUnique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => normalizeCutSearchText(value ?? "")).filter(Boolean))];
}

function getActiveLocaleNames(profile: GeneratedCutProfile, lang: Lang) {
  if (lang === "es") {
    return toNormalizedUnique([
      profile.displayNameEsEs,
      profile.displayNameEsAr,
      profile.displayNameEn,
      profile.canonicalNameEn,
    ]);
  }
  if (lang === "fi") {
    return toNormalizedUnique([profile.displayNameFi, profile.displayNameEn, profile.canonicalNameEn]);
  }
  return toNormalizedUnique([profile.displayNameEn, profile.canonicalNameEn]);
}

function buildSearchableFields(profile: GeneratedCutProfile, lang: Lang, animalId: GeneratedAnimalId): SearchableFields {
  const activeNames = getActiveLocaleNames(profile, lang);
  const englishNames = toNormalizedUnique([profile.displayNameEn, profile.canonicalNameEn]);
  const aliases = toNormalizedUnique([...(profile.aliasesEn ?? []), ...(profile.aliasesMixed ?? [])]);
  const categoryLabel = getCategoryLabel(profile.category || "other", lang);
  const categories = toNormalizedUnique([profile.category, categoryLabel]);
  const zones = toNormalizedUnique([profile.zone, profile.anatomicalArea]);
  const animalLabel = getAnimalLabel(animalId, lang);
  const animalTerms = toNormalizedUnique([animalLabel, animalId]);

  return {
    activeNames,
    englishNames,
    aliases,
    categories,
    zones,
    animalTerms,
    activeNameForSort: activeNames[0] ?? englishNames[0] ?? normalizeCutSearchText(profile.id),
  };
}

function matchesAllTokens(fields: SearchableFields, tokens: string[]) {
  if (tokens.length === 0) return false;
  const pool = [
    ...fields.activeNames,
    ...fields.englishNames,
    ...fields.aliases,
    ...fields.categories,
    ...fields.zones,
    ...fields.animalTerms,
  ];

  return tokens.every((token) => pool.some((term) => term.includes(token)));
}

function rankMatch(fields: SearchableFields, normalizedQuery: string) {
  if (fields.activeNames.some((term) => term === normalizedQuery)) return 1000;
  if (fields.englishNames.some((term) => term === normalizedQuery)) return 950;
  if (fields.aliases.some((term) => term === normalizedQuery)) return 900;

  if ([...fields.activeNames, ...fields.englishNames].some((term) => term.startsWith(normalizedQuery))) return 850;
  if (fields.aliases.some((term) => term.startsWith(normalizedQuery))) return 800;

  if ([...fields.activeNames, ...fields.englishNames].some((term) => term.includes(normalizedQuery))) return 700;
  if (fields.aliases.some((term) => term.includes(normalizedQuery))) return 650;

  if (fields.categories.some((term) => term.includes(normalizedQuery))) return 500;
  if (fields.zones.some((term) => term.includes(normalizedQuery))) return 400;
  if (fields.animalTerms.some((term) => term.includes(normalizedQuery))) return 300;

  return 100;
}

export function searchCutProfiles(
  profiles: GeneratedCutProfile[],
  query: string,
  options: { lang: Lang; animalId: GeneratedAnimalId },
) {
  const normalizedQuery = normalizeCutSearchText(query);
  if (!normalizedQuery) return profiles;

  const tokens = tokenizeNormalized(normalizedQuery);

  return profiles
    .map((profile) => {
      const fields = buildSearchableFields(profile, options.lang, options.animalId);
      if (!matchesAllTokens(fields, tokens)) {
        return null;
      }

      return {
        profile,
        score: rankMatch(fields, normalizedQuery),
        sortName: fields.activeNameForSort,
      };
    })
    .filter((entry): entry is { profile: GeneratedCutProfile; score: number; sortName: string } => Boolean(entry))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const nameOrder = a.sortName.localeCompare(b.sortName);
      if (nameOrder !== 0) return nameOrder;
      return a.profile.id.localeCompare(b.profile.id);
    })
    .map((entry) => entry.profile);
}
