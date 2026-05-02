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
  animalDoneness,
  productCatalog,
  type CookingInput,
  type CookingMethod,
  type CookingStyle,
  type DonenessId,
  type ProductCut,
} from "./cookingCatalog";

export type CookingProfileSource = "generated" | "legacy";
export type ExtendedCookingProfileSource = "generated" | "legacy" | "fallback";
export type CookingProfileConfidenceLevel = "high" | "medium" | "low";
export type CookingProfileDataCompleteness = {
  hasGeneratedProfile: boolean;
  hasLegacyCut: boolean;
  hasTimeEstimate: boolean;
  hasTargetTemperature: boolean;
  hasSafetyNotes: boolean;
};

export type ResolvedCookingProfile = {
  input: AdaptedCookingInput;
  cut: ProductCut;
  generatedProfile?: GeneratedCutProfile;
  source: CookingProfileSource;
  profileSource?: ExtendedCookingProfileSource;
  confidenceLevel?: CookingProfileConfidenceLevel;
  dataCompleteness?: CookingProfileDataCompleteness;
};

const legacyCutsById = new Map(productCatalog.map((cut) => [cut.id, cut]));
const generatedPrimaryToId = new Map<string, string>();
const generatedAliasToId = new Map<string, string>();

for (const profile of generatedCutProfiles) {
  generatedPrimaryToId.set(normalizeLegacyKey(profile.id), profile.id);
  generatedPrimaryToId.set(normalizeLegacyKey(profile.canonicalNameEn), profile.id);
  profile.aliasesEn.forEach((alias) => generatedAliasToId.set(normalizeLegacyKey(alias), profile.id));
}

function resolveAnyCutId(value: string) {
  const normalized = normalizeLegacyKey(value);
  const generatedPrimaryId = generatedPrimaryToId.get(normalized);
  if (generatedPrimaryId) return generatedPrimaryId;

  const legacyCutId = resolveLegacyCutId(value);
  if (legacyCutId && legacyCutsById.has(legacyCutId)) return legacyCutId;

  return generatedAliasToId.get(normalized) ?? legacyCutId;
}

function uniqueValues<T extends string>(values: readonly T[]) {
  return [...new Set(values.filter(Boolean))];
}

function safeAllowedDoneness(profile: GeneratedCutProfile, legacyCut?: ProductCut) {
  const generatedAllowed = profile.allowedDoneness as DonenessId[];
  if (profile.animalId === "chicken") {
    const safe = generatedAllowed.filter((doneness) => doneness === "safe" || doneness === "well_done");
    return safe.length > 0 ? safe : (legacyCut?.allowedDoneness ?? animalDoneness.chicken);
  }
  if (profile.animalId === "pork") {
    const safe = generatedAllowed.filter(
      (doneness) => doneness === "juicy_safe" || doneness === "medium_safe" || doneness === "well_done",
    );
    return safe.length > 0 ? safe : (legacyCut?.allowedDoneness ?? animalDoneness.pork);
  }
  return generatedAllowed;
}

function parseThicknessCm(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function resolveGeneratedProfile(input: CookingInput) {
  const cutId = resolveAnyCutId(input.cut);
  return cutId ? getGeneratedCutProfile(cutId) : undefined;
}

function resolveLegacyCut(input: CookingInput) {
  const cutId = resolveAnyCutId(input.cut);
  return cutId ? legacyCutsById.get(cutId) : undefined;
}

function buildProductCutFromGenerated(profile: GeneratedCutProfile, legacyCut?: ProductCut): ProductCut {
  const allowedDoneness = safeAllowedDoneness(profile, legacyCut);
  const criticalError = profile.criticalMistakeEn ?? profile.errorEn;

  return {
    ...(legacyCut ?? {
      id: profile.id,
      animalId: profile.animalId,
      names: {
        es: profile.canonicalNameEn,
        en: profile.canonicalNameEn,
        fi: profile.canonicalNameEn,
      },
      defaultThicknessCm: profile.defaultThicknessCm,
      showThickness: profile.showThickness,
      allowedMethods: profile.allowedMethods as CookingMethod[],
      allowedDoneness,
      restingMinutes: profile.restingMinutes,
      style: profile.style as CookingStyle,
      defaultMethod: profile.defaultMethod as CookingMethod,
      error: {
        es: criticalError,
        en: criticalError,
      },
    }),
    id: legacyCut?.id ?? profile.id,
    animalId: legacyCut?.animalId ?? profile.animalId,
    inputProfileId: profile.inputProfileId,
    defaultThicknessCm: profile.defaultThicknessCm,
    showThickness: profile.showThickness,
    allowedMethods: profile.allowedMethods as CookingMethod[],
    allowedDoneness,
    targetTempsC: legacyCut?.targetTempsC,
    cookingMinutes: profile.cookingMinutes ?? legacyCut?.cookingMinutes,
    restingMinutes: profile.restingMinutes,
    style: profile.style as CookingStyle,
    defaultMethod: profile.defaultMethod as CookingMethod,
    names: {
      ...(legacyCut?.names ?? {
        es: profile.canonicalNameEn,
        en: profile.canonicalNameEn,
        fi: profile.canonicalNameEn,
      }),
      en: profile.canonicalNameEn,
    },
    notes: {
      ...legacyCut?.notes,
      ...(profile.notesEn ? { en: profile.notesEn } : {}),
    },
    tips: {
      ...legacyCut?.tips,
      ...(profile.tipsEn.length > 0 ? { en: profile.tipsEn } : {}),
    },
    error: {
      ...(legacyCut?.error ?? {
        es: criticalError,
        en: criticalError,
      }),
      en: criticalError,
    },
    aliases: uniqueValues([
      ...(legacyCut?.aliases ?? []),
      profile.canonicalNameEn,
      ...profile.aliasesEn,
    ]),
  };
}

function inferFallbackMinutesByAnimalAndCategory(animal: string, category?: string) {
  if (animal === "vegetables") return 12;
  if (animal === "fish") return category === "whole" ? 30 : 14;
  if (animal === "chicken") return category === "whole" ? 80 : 35;
  if (animal === "pork") {
    if (category === "bbq" || category === "ribs" || category === "roast" || category === "shoulder") return 180;
    return 30;
  }
  if (animal === "beef") {
    if (category === "bbq" || category === "roast" || category === "shoulder") return 150;
    return 20;
  }
  return 30;
}

function buildFallbackCutFromAnimal(animalId: string, inputCutName: string): ProductCut {
  const style: CookingStyle =
    animalId === "vegetables"
      ? "vegetable"
      : animalId === "fish"
        ? "fish"
        : animalId === "chicken"
          ? "poultry"
          : animalId === "pork"
            ? "lowSlow"
            : "thick";
  const allowedMethods: CookingMethod[] =
    animalId === "vegetables"
      ? ["vegetables_grill"]
      : ["grill_direct", "grill_indirect", "oven_pan"];
  const defaultMethod: CookingMethod = animalId === "vegetables" ? "vegetables_grill" : "grill_indirect";
  const normalizedId = normalizeLegacyKey(inputCutName).replace(/\s+/g, "_") || `${animalId}_cut`;

  return {
    id: normalizedId,
    animalId: animalId as ProductCut["animalId"],
    names: {
      es: inputCutName,
      en: inputCutName,
      fi: inputCutName,
    },
    defaultThicknessCm: animalId === "fish" ? 3 : animalId === "vegetables" ? 2 : 4,
    showThickness: animalId !== "vegetables",
    allowedMethods,
    allowedDoneness: animalDoneness[animalId as ProductCut["animalId"]] ?? [],
    restingMinutes: animalId === "vegetables" ? 1 : 5,
    style,
    defaultMethod,
    cookingMinutes: inferFallbackMinutesByAnimalAndCategory(animalId),
    error: {
      es: "Perfil conservador aplicado. Usa termometro y ajusta segun la pieza real.",
      en: "Conservative fallback profile applied. Use a thermometer and adjust for the real cut.",
    },
  };
}

function resolveBestDoneness({
  requested,
  allowed,
  animal,
}: {
  requested?: DonenessId;
  allowed: readonly DonenessId[];
  animal: string;
}) {
  if (animal === "vegetables") return undefined;

  const disallowUnsafeRed = requested === "rare" || requested === "medium_rare";
  if (animal === "chicken" && disallowUnsafeRed) {
    return allowed.find((doneness) => doneness === "safe" || doneness === "well_done") ?? "safe";
  }
  if (animal === "pork" && disallowUnsafeRed) {
    return (
      allowed.find(
        (doneness) => doneness === "juicy_safe" || doneness === "medium_safe" || doneness === "well_done",
      ) ?? "well_done"
    );
  }

  if (requested && allowed.includes(requested)) return requested;

  if (animal === "fish") {
    if ((requested === "rare" || requested === "medium_rare") && allowed.includes(requested)) return requested;
    return allowed.find((doneness) => doneness === "medium") ?? allowed[0];
  }
  if (animal === "beef") {
    return (
      allowed.find((doneness) => doneness === "medium_rare") ??
      allowed.find((doneness) => doneness === "medium") ??
      allowed[0]
    );
  }
  if (animal === "pork") {
    return (
      allowed.find((doneness) => doneness === "juicy_safe") ??
      allowed.find((doneness) => doneness === "medium_safe") ??
      allowed.find((doneness) => doneness === "well_done") ??
      allowed[0]
    );
  }
  if (animal === "chicken") {
    return allowed.find((doneness) => doneness === "safe") ?? allowed.find((doneness) => doneness === "well_done");
  }

  return allowed[0];
}

function resolveCookingTime({
  profile,
  thicknessCm,
  legacyCut,
}: {
  profile?: GeneratedCutProfile;
  thicknessCm?: number;
  legacyCut?: ProductCut;
}) {
  if (profile?.estimatedTimeMinPerCm && thicknessCm) {
    return Math.max(1, Math.round(thicknessCm * profile.estimatedTimeMinPerCm));
  }
  if (profile?.estimatedTotalTimeMin) return profile.estimatedTotalTimeMin;
  if (profile?.cookingMinutes) return profile.cookingMinutes;
  if (legacyCut?.cookingMinutes) return legacyCut.cookingMinutes;
  if (profile) return inferFallbackMinutesByAnimalAndCategory(profile.animalId, profile.category);
  if (legacyCut) return inferFallbackMinutesByAnimalAndCategory(legacyCut.animalId);
  return undefined;
}

function resolveConfidenceLevel({
  generatedProfile,
  legacyCut,
  fallbackUsed,
}: {
  generatedProfile?: GeneratedCutProfile;
  legacyCut?: ProductCut;
  fallbackUsed: boolean;
}): CookingProfileConfidenceLevel {
  if (generatedProfile && !fallbackUsed) return legacyCut ? "high" : "medium";
  if (legacyCut && !fallbackUsed) return "medium";
  return "low";
}

function hasTargetTemperature(generatedProfile?: GeneratedCutProfile, legacyCut?: ProductCut) {
  if (generatedProfile?.targetTempC) return true;
  return Boolean(legacyCut?.targetTempsC && Object.keys(legacyCut.targetTempsC).length > 0);
}

function hasSafetyNotes(generatedProfile?: GeneratedCutProfile, legacyCut?: ProductCut) {
  return Boolean(
    generatedProfile?.safetyNoteEn ||
      generatedProfile?.notesEn ||
      legacyCut?.notes?.en ||
      legacyCut?.notes?.es ||
      legacyCut?.error?.en ||
      legacyCut?.error?.es,
  );
}

export function resolveProductCut(cutId: string): ProductCut | undefined {
  const id = resolveAnyCutId(cutId);
  if (!id) return undefined;

  const legacyCut = legacyCutsById.get(id);
  const generatedProfile = getGeneratedCutProfile(id);

  if (!legacyCut) {
    return generatedProfile ? buildProductCutFromGenerated(generatedProfile) : undefined;
  }

  if (!generatedProfile || generatedProfile.animalId !== legacyCut.animalId) {
    return legacyCut;
  }

  return buildProductCutFromGenerated(generatedProfile, legacyCut);
}

export function resolveCookingProfile(input: CookingInput): ResolvedCookingProfile | undefined {
  const generatedProfile = resolveGeneratedProfile(input);
  const legacyCut = resolveLegacyCut(input);
  const requestedAnimalId = resolveLegacyAnimalId(input.animal);
  const fallbackAnimalId = requestedAnimalId ?? generatedProfile?.animalId ?? legacyCut?.animalId;

  if (!generatedProfile && !legacyCut && !fallbackAnimalId) return undefined;

  const fallbackUsed = !generatedProfile && !legacyCut;
  const baseCut =
    (generatedProfile ? buildProductCutFromGenerated(generatedProfile, legacyCut) : undefined) ??
    legacyCut ??
    (fallbackAnimalId ? buildFallbackCutFromAnimal(fallbackAnimalId, input.cut) : undefined);
  if (!baseCut) return undefined;

  const requestedDonenessId = resolveLegacyDonenessId(input.doneness);
  const safeDoneness =
    resolveBestDoneness({
      requested: requestedDonenessId,
      allowed: baseCut.allowedDoneness,
      animal: baseCut.animalId,
    }) ??
    applyCookingSafetyRules(baseCut.animalId, requestedDonenessId, baseCut.allowedDoneness);
  const thicknessCm = parseThicknessCm(input.thicknessCm);
  const resolvedCookingMinutes = resolveCookingTime({
    profile: generatedProfile,
    thicknessCm,
    legacyCut,
  });
  const cut: ProductCut = {
    ...baseCut,
    cookingMinutes: resolvedCookingMinutes ?? baseCut.cookingMinutes,
  };
  const profileSource: ExtendedCookingProfileSource = generatedProfile
    ? "generated"
    : legacyCut
      ? "legacy"
      : "fallback";
  const dataCompleteness: CookingProfileDataCompleteness = {
    hasGeneratedProfile: Boolean(generatedProfile),
    hasLegacyCut: Boolean(legacyCut),
    hasTimeEstimate: Boolean(resolvedCookingMinutes ?? cut.cookingMinutes),
    hasTargetTemperature: hasTargetTemperature(generatedProfile, legacyCut),
    hasSafetyNotes: hasSafetyNotes(generatedProfile, legacyCut),
  };
  const confidenceLevel = resolveConfidenceLevel({
    generatedProfile,
    legacyCut,
    fallbackUsed,
  });

  return {
    input: {
      ...input,
      animalId: cut.animalId,
      cutId: cut.id,
      requestedDonenessId,
      donenessId: safeDoneness,
      animal: cut.animalId,
      cut: cut.id,
      doneness: safeDoneness,
    },
    cut,
    generatedProfile,
    source: generatedProfile ? "generated" : "legacy",
    profileSource,
    confidenceLevel,
    dataCompleteness,
  };
}
