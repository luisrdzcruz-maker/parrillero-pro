import type { CookingInput, CookingMethod, ProductCut } from "@/lib/cookingCatalog";
import type { CookingTimeSemantics } from "@/lib/cookingTimeSemantics";
import type { PrepGuidance } from "@/lib/prepGuidance";
import { getFatCapWarningCodesForCut, getFlareUpRiskForCut, hasFatCapForCut } from "@/lib/cooking/fatCapProfiles";
import { getTemperatureModeForCut } from "@/lib/temperatureModeProfiles";
import { resolvePlanningProfile } from "@/lib/planning/profileResolver";
import type {
  PlanningAnimal,
  PlanningMetadata,
  PlanningZone,
  PlanningZoneDemand,
  PlannerCutInput,
} from "@/lib/planning/types";

type DerivePlanningMetadataArgs = {
  cut: ProductCut;
  input: CookingInput;
  selectedMethod: CookingMethod;
  timeSemantics?: CookingTimeSemantics;
  prepGuidance?: PrepGuidance;
};

function normalizeAnimal(animalId: string): PlanningAnimal {
  if (animalId === "beef") return "beef";
  if (animalId === "pork") return "pork";
  if (animalId === "chicken") return "chicken";
  if (animalId === "fish") return "fish";
  if (animalId === "vegetables") return "vegetable";
  return "other";
}

function methodPreferredZones(method: CookingMethod): PlanningZone[] {
  if (method === "grill_direct") return ["direct_high", "direct_medium"];
  if (method === "grill_indirect") return ["indirect_medium", "indirect_low"];
  if (method === "reverse_sear") return ["indirect_medium", "direct_high"];
  if (method === "vegetables_grill") return ["plancha", "direct_medium"];
  return ["plancha", "direct_medium"];
}

function methodRequiredZones(method: CookingMethod): PlanningZone[] {
  if (method === "grill_direct") return ["direct_high"];
  if (method === "grill_indirect") return ["indirect_medium"];
  if (method === "reverse_sear") return ["indirect_medium", "direct_high"];
  if (method === "vegetables_grill") return ["direct_medium"];
  return ["plancha"];
}

function zoneDemandLabel(value: number): PlanningZoneDemand {
  if (value <= 1) return "low";
  if (value === 2) return "medium";
  return "high";
}

export function derivePlanningMetadata(args: DerivePlanningMetadataArgs): PlanningMetadata {
  const { cut, input, selectedMethod, timeSemantics, prepGuidance } = args;
  const plannerSeed: PlannerCutInput = {
    id: cut.id,
    cutId: cut.id,
    displayName: cut.names.en ?? cut.names.es ?? cut.id,
    animal: normalizeAnimal(cut.animalId),
    doneness: input.doneness as PlannerCutInput["doneness"],
    thicknessCm: Number(input.thicknessCm),
    profileId: undefined,
  };
  const profile = resolvePlanningProfile(plannerSeed);

  const setupMinutes =
    timeSemantics?.setupMinutes ??
    prepGuidance?.prepLeadTimeMinutes?.min ??
    profile.setupMinutes ??
    0;
  const activeCookMinutes =
    timeSemantics?.activeCookMinutes ??
    cut.cookingMinutes ??
    profile.defaultCookMinutes;
  const restMinutes =
    timeSemantics?.restMinutes ??
    cut.restingMinutes ??
    profile.defaultRestMinutes;
  const totalSessionMinutes =
    timeSemantics?.sessionTotalMinutes ??
    Math.max(0, setupMinutes) + Math.max(1, activeCookMinutes) + Math.max(0, restMinutes);

  const methodPreferred = methodPreferredZones(selectedMethod);
  const methodRequired = methodRequiredZones(selectedMethod);
  const preferredZones = [...new Set([...methodPreferred, ...profile.preferredZones])];
  const requiredZones = [...new Set([...(profile.requiredZones ?? []), ...methodRequired])];

  const riskTags = new Set<string>();
  if (profile.safetyCritical) riskTags.add("safety_critical");
  if (hasFatCapForCut(cut)) riskTags.add("fat_cap");
  const flareUpRisk = getFlareUpRiskForCut(cut);
  if (flareUpRisk !== "low") riskTags.add(`flare_up_${flareUpRisk}`);
  if (getTemperatureModeForCut(cut) === "safe_temp") riskTags.add("safe_temp_mode");
  if (getTemperatureModeForCut(cut) === "delicate_target") riskTags.add("delicate_target_mode");
  if (activeCookMinutes <= 12) riskTags.add("fast_cook");
  getFatCapWarningCodesForCut(cut).forEach((warningCode) => riskTags.add(`fatcap_${warningCode}`));

  const source: PlanningMetadata["source"] = timeSemantics ? "single-cut-engine" : "fallback";
  const confidence: PlanningMetadata["confidence"] =
    source === "single-cut-engine" ? "high" : profile.warnings?.length ? "medium" : "low";
  const timingSensitivity =
    profile.timingSensitivity === "critical" ? "high" : profile.timingSensitivity;

  return {
    version: 1,
    source,
    confidence,
    setupMinutes: Math.max(0, Math.round(setupMinutes)),
    activeCookMinutes: Math.max(1, Math.round(activeCookMinutes)),
    restMinutes: Math.max(0, Math.round(restMinutes)),
    totalSessionMinutes: Math.max(1, Math.round(totalSessionMinutes)),
    requiredZones,
    preferredZones,
    zoneDemand: zoneDemandLabel(profile.zoneDemand),
    timingSensitivity,
    canHoldWarm: profile.canHoldWarm,
    maxHoldMinutes: profile.maxHoldMinutes,
    serveWindowMinutes: profile.preferredServeWindowMinutes,
    riskTags: [...riskTags],
    notes: profile.notes,
  };
}

export function attachPlanningMetadata<T extends Record<string, string>>(
  plan: T,
  planningMetadata: PlanningMetadata | undefined,
): T {
  if (!planningMetadata) return plan;

  Object.defineProperty(plan, "planningMetadata", {
    value: planningMetadata,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return plan;
}

export function getPlanPlanningMetadata(plan: unknown): PlanningMetadata | undefined {
  if (!plan || typeof plan !== "object") return undefined;
  const value = (plan as { readonly planningMetadata?: unknown }).planningMetadata;
  if (!value || typeof value !== "object") return undefined;
  return value as PlanningMetadata;
}
