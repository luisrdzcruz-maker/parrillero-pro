import type { AnimalId, CookingStyle, DonenessId, TargetTemp } from "./cookingCatalog";

export type DonenessTemperatureProfileId =
  | "beefTenderCuts"
  | "beefSteakCuts"
  | "beefSlowCuts"
  | "beefSafeCuts"
  | "porkSafeCuts"
  | "porkSlowCuts"
  | "chickenSafeCuts"
  | "fishCuts"
  | "vegetables";

export type DonenessTemperatureProfile = {
  allowed: DonenessId[];
  recommended: DonenessId;
  targetsC: Partial<Record<DonenessId, number>>;
  carryoverC: number;
};

export type DonenessProfileContext = {
  animalId: AnimalId;
  category?: string;
  inputProfileId?: string;
  style?: CookingStyle;
  targetTempC?: number;
  defaultDoneness?: string;
};

const beefDoneness: DonenessId[] = [
  "blue",
  "rare",
  "medium_rare",
  "medium",
  "medium_well",
  "well_done",
];

export const donenessTemperatureProfiles: Record<
  DonenessTemperatureProfileId,
  DonenessTemperatureProfile
> = {
  beefTenderCuts: {
    allowed: beefDoneness,
    recommended: "rare",
    targetsC: {
      blue: 46,
      rare: 49,
      medium_rare: 53,
      medium: 57,
      medium_well: 62,
      well_done: 67,
    },
    carryoverC: 2,
  },
  beefSteakCuts: {
    allowed: beefDoneness,
    recommended: "medium_rare",
    targetsC: {
      blue: 46,
      rare: 50,
      medium_rare: 54,
      medium: 58,
      medium_well: 63,
      well_done: 68,
    },
    carryoverC: 2,
  },
  beefSlowCuts: {
    allowed: ["well_done"],
    recommended: "well_done",
    targetsC: {
      well_done: 92,
    },
    carryoverC: 0,
  },
  beefSafeCuts: {
    allowed: ["well_done"],
    recommended: "well_done",
    targetsC: {
      well_done: 71,
    },
    carryoverC: 0,
  },
  porkSafeCuts: {
    allowed: ["juicy_safe", "medium_safe", "well_done"],
    recommended: "juicy_safe",
    targetsC: {
      juicy_safe: 63,
      medium_safe: 66,
      well_done: 72,
    },
    carryoverC: 3,
  },
  porkSlowCuts: {
    allowed: ["well_done"],
    recommended: "well_done",
    targetsC: {
      well_done: 90,
    },
    carryoverC: 0,
  },
  chickenSafeCuts: {
    allowed: ["safe", "well_done"],
    recommended: "safe",
    targetsC: {
      safe: 74,
      well_done: 77,
    },
    carryoverC: 2,
  },
  fishCuts: {
    allowed: ["juicy", "medium", "well_done"],
    recommended: "medium",
    targetsC: {
      juicy: 48,
      medium: 52,
      well_done: 58,
    },
    carryoverC: 2,
  },
  vegetables: {
    allowed: [],
    recommended: "medium",
    targetsC: {},
    carryoverC: 0,
  },
};

function normalized(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isSlowCategory(category: string) {
  return ["bbq", "ribs", "roast", "shoulder", "brisket"].includes(category);
}

export function resolveDonenessProfileId(
  context: DonenessProfileContext,
): DonenessTemperatureProfileId | undefined {
  const category = normalized(context.category);
  const inputProfileId = normalized(context.inputProfileId);
  const defaultDoneness = normalized(context.defaultDoneness);

  if (context.animalId === "vegetables") return "vegetables";
  if (context.animalId === "chicken") return "chickenSafeCuts";
  if (context.animalId === "fish") return "fishCuts";

  if (context.animalId === "pork") {
    if (context.style === "lowSlow" || context.style === "crispy" || isSlowCategory(category)) {
      return "porkSlowCuts";
    }
    return "porkSafeCuts";
  }

  if (context.animalId === "beef") {
    if (context.style === "lowSlow" || isSlowCategory(category)) return "beefSlowCuts";
    if (category === "ground" || (context.targetTempC ?? 0) >= 70) return "beefSafeCuts";
    if (
      defaultDoneness === "rare" ||
      inputProfileId.includes("tender") ||
      ((context.targetTempC ?? 99) <= 52 && context.style === "fast")
    ) {
      return "beefTenderCuts";
    }
    return "beefSteakCuts";
  }

  return undefined;
}

export function buildTargetTemps(
  profile: DonenessTemperatureProfile,
): Partial<Record<DonenessId, TargetTemp>> {
  return Object.fromEntries(
    Object.entries(profile.targetsC).map(([doneness, targetC]) => [
      doneness,
      {
        pull: Math.max(0, Math.round(targetC - profile.carryoverC)),
        final: Math.round(targetC),
      },
    ]),
  ) as Partial<Record<DonenessId, TargetTemp>>;
}

export function getTargetTempsForProfile(
  profileId: DonenessTemperatureProfileId | undefined,
): Partial<Record<DonenessId, TargetTemp>> | undefined {
  if (!profileId) return undefined;
  return buildTargetTemps(donenessTemperatureProfiles[profileId]);
}

export function getTemperatureDeltaFromRecommended(
  profileId: DonenessTemperatureProfileId | undefined,
  doneness: DonenessId,
) {
  if (!profileId) return 0;
  const profile = donenessTemperatureProfiles[profileId];
  const target = profile.targetsC[doneness];
  const recommendedTarget = profile.targetsC[profile.recommended];
  if (target == null || recommendedTarget == null) return 0;
  return target - recommendedTarget;
}
