import {
  generatedCutProfiles,
  getGeneratedCutProfile,
  type GeneratedCutProfile,
} from "./generated/cutProfiles";
import {
  applyCookingSafetyRules,
  normalizeLegacyKey,
  resolveLegacyAnimalId,
  resolveLegacyCutId,
  resolveLegacyDonenessId,
  type AdaptedCookingInput,
} from "./legacyCookingInputAdapter";
import {
  productCatalog,
  type CookingInput,
  type CookingMethod,
  type CookingStyle,
  type DonenessId,
  type ProductCut,
} from "./cookingCatalog";

export type CookingProfileSource = "generated" | "legacy";

export type ResolvedCookingProfile = {
  input: AdaptedCookingInput;
  cut: ProductCut;
  generatedProfile?: GeneratedCutProfile;
  source: CookingProfileSource;
};

const legacyCutsById = new Map(productCatalog.map((cut) => [cut.id, cut]));
const generatedAliasToId = new Map<string, string>();

for (const profile of generatedCutProfiles) {
  generatedAliasToId.set(normalizeLegacyKey(profile.id), profile.id);
  generatedAliasToId.set(normalizeLegacyKey(profile.canonicalNameEn), profile.id);
  profile.aliasesEn.forEach((alias) => generatedAliasToId.set(normalizeLegacyKey(alias), profile.id));
}

function resolveAnyCutId(value: string) {
  const legacyCutId = resolveLegacyCutId(value);
  if (legacyCutId && legacyCutsById.has(legacyCutId)) return legacyCutId;

  const normalized = normalizeLegacyKey(value);
  return generatedAliasToId.get(normalized) ?? legacyCutId;
}

function uniqueValues<T extends string>(values: readonly T[]) {
  return [...new Set(values.filter(Boolean))];
}

function safeAllowedDoneness(profile: GeneratedCutProfile, legacyCut: ProductCut) {
  const generatedAllowed = profile.allowedDoneness as DonenessId[];
  if (profile.animalId === "chicken") {
    const safe = generatedAllowed.filter((doneness) => doneness === "safe" || doneness === "well_done");
    return safe.length > 0 ? safe : legacyCut.allowedDoneness;
  }
  if (profile.animalId === "pork") {
    const safe = generatedAllowed.filter(
      (doneness) => doneness === "juicy_safe" || doneness === "medium_safe" || doneness === "well_done",
    );
    return safe.length > 0 ? safe : legacyCut.allowedDoneness;
  }
  return generatedAllowed;
}

function mergeGeneratedProfile(profile: GeneratedCutProfile, legacyCut: ProductCut): ProductCut {
  const allowedDoneness = safeAllowedDoneness(profile, legacyCut);

  return {
    ...legacyCut,
    inputProfileId: profile.inputProfileId,
    defaultThicknessCm: profile.defaultThicknessCm,
    showThickness: profile.showThickness,
    allowedMethods: profile.allowedMethods as CookingMethod[],
    allowedDoneness,
    cookingMinutes: profile.cookingMinutes ?? legacyCut.cookingMinutes,
    restingMinutes: profile.restingMinutes,
    style: profile.style as CookingStyle,
    defaultMethod: profile.defaultMethod as CookingMethod,
    names: {
      ...legacyCut.names,
      en: profile.canonicalNameEn,
    },
    notes: {
      ...legacyCut.notes,
      ...(profile.notesEn ? { en: profile.notesEn } : {}),
    },
    tips: {
      ...legacyCut.tips,
      ...(profile.tipsEn.length > 0 ? { en: profile.tipsEn } : {}),
    },
    error: {
      ...legacyCut.error,
      en: profile.errorEn,
    },
    aliases: uniqueValues([
      ...(legacyCut.aliases ?? []),
      profile.canonicalNameEn,
      ...profile.aliasesEn,
    ]),
  };
}

export function resolveProductCut(cutId: string): ProductCut | undefined {
  const id = resolveAnyCutId(cutId);
  if (!id) return undefined;

  const legacyCut = legacyCutsById.get(id);
  if (!legacyCut) return undefined;

  const generatedProfile = getGeneratedCutProfile(id);
  if (!generatedProfile || generatedProfile.animalId !== legacyCut.animalId) {
    return legacyCut;
  }

  return mergeGeneratedProfile(generatedProfile, legacyCut);
}

export function resolveCookingProfile(input: CookingInput): ResolvedCookingProfile | undefined {
  const animalId = resolveLegacyAnimalId(input.animal);
  const cutId = resolveAnyCutId(input.cut);
  const legacyCut = cutId ? legacyCutsById.get(cutId) : undefined;

  if (!animalId || !legacyCut || legacyCut.animalId !== animalId) return undefined;

  const generatedProfile = getGeneratedCutProfile(legacyCut.id);
  const useGenerated = generatedProfile?.animalId === legacyCut.animalId;
  const cut = useGenerated ? mergeGeneratedProfile(generatedProfile, legacyCut) : legacyCut;
  const requestedDonenessId = resolveLegacyDonenessId(input.doneness);
  const donenessId = applyCookingSafetyRules(cut.animalId, requestedDonenessId, cut.allowedDoneness);

  return {
    input: {
      ...input,
      animalId,
      cutId: cut.id,
      requestedDonenessId,
      donenessId,
      animal: animalId,
      cut: cut.id,
      doneness: donenessId,
    },
    cut,
    generatedProfile: useGenerated ? generatedProfile : undefined,
    source: useGenerated ? "generated" : "legacy",
  };
}
