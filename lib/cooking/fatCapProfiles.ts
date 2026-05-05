import type { AnimalId, CookingMethod } from "@/lib/cookingCatalog";

export type FatCapBehavior =
  | "indirect_then_brief_fat_cap_sear"
  | "direct_sear_then_brief_fat_edge_render"
  | "low_and_slow_fat_cap_protection";

export type FlareUpRisk = "low" | "medium" | "high";

export type FatCapPhase =
  | "preheat"
  | "indirect_roast"
  | "brief_fat_cap_sear"
  | "direct_sear"
  | "edge_fat_render_brief"
  | "low_slow_indirect"
  | "rest"
  | "slice_against_grain";

export type FatCapWarningCode =
  | "fat_cap_burn_risk"
  | "flare_up_risk"
  | "move_to_indirect_on_flareup"
  | "do_not_leave_fat_cap_over_direct_flames"
  | "slice_against_grain"
  | "do_not_burn_fat_edge"
  | "probe_tender_not_doneness";

export type FatCapCutContext = {
  id: string;
  animalId: AnimalId;
  category?: string;
  inputProfileId?: string;
  style?: string;
  defaultMethod?: CookingMethod | string;
  defaultThicknessCm?: number;
  showThickness?: boolean;
};

export type FatCapProfile = {
  hasFatCap: true;
  behavior: FatCapBehavior;
  flareUpRisk: FlareUpRisk;
  requiresMoveOnFlareup: boolean;
  warningCodes: readonly FatCapWarningCode[];
  preferredPhases: readonly FatCapPhase[];
  preferredInputProfileId?: string;
  preferredDefaultMethod?: CookingMethod;
  minDefaultThicknessCm?: number;
  minActiveCookMinutes?: number;
  maxActiveCookMinutes?: number;
  restMinutes?: number;
  directExposureMaxMinutes?: number;
  fatCapSearMinutes?: number;
};

const phaseOneFatCapProfilesByCutId: Record<string, FatCapProfile> = {
  picanha: {
    hasFatCap: true,
    behavior: "indirect_then_brief_fat_cap_sear",
    flareUpRisk: "high",
    requiresMoveOnFlareup: true,
    warningCodes: [
      "fat_cap_burn_risk",
      "flare_up_risk",
      "move_to_indirect_on_flareup",
      "do_not_leave_fat_cap_over_direct_flames",
      "slice_against_grain",
    ],
    preferredPhases: [
      "preheat",
      "indirect_roast",
      "brief_fat_cap_sear",
      "rest",
      "slice_against_grain",
    ],
    preferredInputProfileId: "beef-large",
    preferredDefaultMethod: "grill_indirect",
    minDefaultThicknessCm: 4,
    minActiveCookMinutes: 30,
    maxActiveCookMinutes: 75,
    restMinutes: 10,
    directExposureMaxMinutes: 3,
    fatCapSearMinutes: 3,
  },
  picanha_steak: {
    hasFatCap: true,
    behavior: "direct_sear_then_brief_fat_edge_render",
    flareUpRisk: "medium",
    requiresMoveOnFlareup: true,
    warningCodes: ["do_not_burn_fat_edge", "flare_up_risk", "move_to_indirect_on_flareup"],
    preferredPhases: ["preheat", "direct_sear", "edge_fat_render_brief", "rest"],
    preferredInputProfileId: "beef-steak",
    preferredDefaultMethod: "grill_direct",
    minDefaultThicknessCm: 2,
    minActiveCookMinutes: 8,
    maxActiveCookMinutes: 18,
    restMinutes: 5,
    directExposureMaxMinutes: 2,
    fatCapSearMinutes: 2,
  },
  picanha_steaks: {
    hasFatCap: true,
    behavior: "direct_sear_then_brief_fat_edge_render",
    flareUpRisk: "medium",
    requiresMoveOnFlareup: true,
    warningCodes: ["do_not_burn_fat_edge", "flare_up_risk", "move_to_indirect_on_flareup"],
    preferredPhases: ["preheat", "direct_sear", "edge_fat_render_brief", "rest"],
    preferredInputProfileId: "beef-steak",
    preferredDefaultMethod: "grill_direct",
    minDefaultThicknessCm: 2,
    minActiveCookMinutes: 8,
    maxActiveCookMinutes: 18,
    restMinutes: 5,
    directExposureMaxMinutes: 2,
    fatCapSearMinutes: 2,
  },
  brisket: {
    hasFatCap: true,
    behavior: "low_and_slow_fat_cap_protection",
    flareUpRisk: "low",
    requiresMoveOnFlareup: false,
    warningCodes: ["probe_tender_not_doneness"],
    preferredPhases: ["preheat", "low_slow_indirect", "rest", "slice_against_grain"],
    preferredInputProfileId: "beef-large",
    preferredDefaultMethod: "grill_indirect",
  },
};

function normalize(value: string | undefined) {
  return value
    ?.trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase() ?? "";
}

function getFatCapProfileForId(id: string | undefined) {
  return phaseOneFatCapProfilesByCutId[normalize(id)];
}

export function getFatCapProfileForCut(
  cut: FatCapCutContext,
  profile?: Partial<FatCapCutContext>,
): FatCapProfile | undefined {
  return getFatCapProfileForId(profile?.id) ?? getFatCapProfileForId(cut.id);
}

export function hasFatCapForCut(cut: FatCapCutContext, profile?: Partial<FatCapCutContext>) {
  return Boolean(getFatCapProfileForCut(cut, profile));
}

export function getFatCapBehaviorForCut(
  cut: FatCapCutContext,
  profile?: Partial<FatCapCutContext>,
) {
  return getFatCapProfileForCut(cut, profile)?.behavior;
}

export function getFlareUpRiskForCut(cut: FatCapCutContext, profile?: Partial<FatCapCutContext>) {
  return getFatCapProfileForCut(cut, profile)?.flareUpRisk;
}

export function requiresMoveOnFlareupForCut(
  cut: FatCapCutContext,
  profile?: Partial<FatCapCutContext>,
) {
  return getFatCapProfileForCut(cut, profile)?.requiresMoveOnFlareup ?? false;
}

export function getFatCapWarningCodesForCut(
  cut: FatCapCutContext,
  profile?: Partial<FatCapCutContext>,
) {
  return [...(getFatCapProfileForCut(cut, profile)?.warningCodes ?? [])];
}
