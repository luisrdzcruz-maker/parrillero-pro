import type { DonenessId } from "./cookingCatalog";

export type CatalogV2TemperatureMode =
  | "doneness_target"
  | "safe_temp"
  | "texture_breakdown"
  | "visual_only"
  | "delicate_target";

export type CatalogV2FlareUpRisk = "low" | "medium" | "high";

export type CatalogV2TimeRange = {
  min: number;
  max: number;
};

export type CatalogV2TimeRanges = {
  setupMinutes: CatalogV2TimeRange;
  activeCookMinutes: CatalogV2TimeRange;
  restMinutes: CatalogV2TimeRange;
  cutPlanMinutes: CatalogV2TimeRange;
  sessionTotalMinutes: CatalogV2TimeRange;
};

export type CutCatalogV2Row = {
  cutId: string;
  variantId: string;
  animal: string;
  category: string;
  cookingProfileId: string;
  prepProfileId: string;
  temperatureMode: CatalogV2TemperatureMode;
  allowedDoneness: readonly string[];
  defaultDoneness?: string;
  hideDonenessSelector: boolean;
  requiredPhases: readonly string[];
  timeRanges: CatalogV2TimeRanges;
  hasFatCap: boolean;
  fatCapBehavior?: string;
  flareUpRisk: CatalogV2FlareUpRisk;
  requiresMoveOnFlareup: boolean;
  warningCodes: readonly string[];
  prepWarningCodes: readonly string[];
  saltStrategy?: string;
  saltTimingMinutes?: CatalogV2TimeRange;
  saltAmountGuidance?: string;
  saltSurfaceGuidance?: string;
};

export type CookingProfileV2 = {
  profileId: string;
  temperatureMode: CatalogV2TemperatureMode;
  allowedDoneness: readonly string[];
  defaultDoneness?: string;
  hideDonenessSelector: boolean;
  defaultMethod: string;
  expectedPhases: readonly string[];
  timeRanges: CatalogV2TimeRanges;
  requiredWarnings: readonly string[];
};

export type PrepProfileV2 = {
  profileId: string;
  appliesToCookingProfiles: readonly string[];
  prepLeadTimeMinutes: CatalogV2TimeRange;
  saltStrategy: string;
  saltTimingMinutes: CatalogV2TimeRange;
  saltAmountGuidance: string;
  saltSurfaceGuidance: string;
  prepWarningCodes: readonly string[];
  titleEn: string;
};

export type CatalogV2FatCapMetadata = {
  hasFatCap: boolean;
  behavior?: string;
  flareUpRisk: CatalogV2FlareUpRisk;
  requiresMoveOnFlareup: boolean;
  warningCodes: readonly string[];
  requiredPhases: readonly string[];
  timeRanges: CatalogV2TimeRanges;
};

export type CatalogV2PrepGuidance = {
  prepProfileId: string;
  prepLeadTimeMinutes?: CatalogV2TimeRange;
  prepWarningCodes: readonly string[];
  saltStrategy?: string;
  saltTimingMinutes?: CatalogV2TimeRange;
  saltAmountGuidance?: string;
  saltSurfaceGuidance?: string;
};

const emptyTimeRange: CatalogV2TimeRange = { min: 0, max: 0 };

function timeRanges(
  setup: CatalogV2TimeRange,
  active: CatalogV2TimeRange,
  rest: CatalogV2TimeRange,
): CatalogV2TimeRanges {
  return {
    setupMinutes: setup,
    activeCookMinutes: active,
    restMinutes: rest,
    cutPlanMinutes: { min: active.min + rest.min, max: active.max + rest.max },
    sessionTotalMinutes: {
      min: setup.min + active.min + rest.min,
      max: setup.max + active.max + rest.max,
    },
  };
}

function list(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function catalogRow(row: Omit<CutCatalogV2Row, "timeRanges"> & {
  setup: CatalogV2TimeRange;
  active: CatalogV2TimeRange;
  rest: CatalogV2TimeRange;
}): CutCatalogV2Row {
  const { setup, active, rest, ...catalogFields } = row;
  return {
    ...catalogFields,
    timeRanges: timeRanges(setup, active, rest),
  };
}

function cookingProfile(profile: Omit<CookingProfileV2, "timeRanges"> & {
  setup: CatalogV2TimeRange;
  active: CatalogV2TimeRange;
  rest: CatalogV2TimeRange;
}): CookingProfileV2 {
  const { setup, active, rest, ...profileFields } = profile;
  return {
    ...profileFields,
    timeRanges: timeRanges(setup, active, rest),
  };
}

const cutCatalogV2Rows: readonly CutCatalogV2Row[] = [
  catalogRow({
    cutId: "picanha",
    variantId: "whole",
    animal: "beef",
    category: "beef_specialty",
    cookingProfileId: "beef_fat_cap_direct_indirect",
    prepProfileId: "beef_thick_dry_brine_fat_cap",
    temperatureMode: "doneness_target",
    allowedDoneness: list("medium_rare|medium"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    requiredPhases: list("preheat|indirect_roast|brief_fat_cap_sear|rest|slice_against_grain"),
    setup: { min: 12, max: 20 },
    active: { min: 30, max: 75 },
    rest: { min: 10, max: 20 },
    hasFatCap: true,
    fatCapBehavior: "keep_fat_cap_indirect_then_sear_briefly_never_leave_over_flames",
    flareUpRisk: "high",
    requiresMoveOnFlareup: true,
    warningCodes: list("fat_cap_burn_risk|flare_up_risk|move_to_indirect_on_flareup|slice_against_grain"),
    prepWarningCodes: list("avoid_heavy_salt_on_fat_cap|pat_dry_before_sear"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 120, max: 1440 },
    saltAmountGuidance: "moderate",
    saltSurfaceGuidance: "meat_side_generous_fat_cap_light",
  }),
  catalogRow({
    cutId: "picanha",
    variantId: "steaks",
    animal: "beef",
    category: "beef_steak",
    cookingProfileId: "steak_direct_fat_cap_edge",
    prepProfileId: "beef_steak_dry_brine",
    temperatureMode: "doneness_target",
    allowedDoneness: list("medium_rare|medium"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    requiredPhases: list("preheat|direct_sear|edge_fat_render_brief|rest"),
    setup: { min: 10, max: 15 },
    active: { min: 8, max: 18 },
    rest: { min: 5, max: 10 },
    hasFatCap: true,
    fatCapBehavior: "brief_edge_render_only",
    flareUpRisk: "medium",
    requiresMoveOnFlareup: true,
    warningCodes: list("flare_up_risk|do_not_burn_fat_edge"),
    prepWarningCodes: list("pat_dry_before_sear"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 45, max: 720 },
    saltAmountGuidance: "moderate",
    saltSurfaceGuidance: "all_sides_fat_edge_light",
  }),
  catalogRow({
    cutId: "ribeye",
    variantId: "steak",
    animal: "beef",
    category: "beef_steak",
    cookingProfileId: "steak_direct",
    prepProfileId: "beef_steak_dry_brine",
    temperatureMode: "doneness_target",
    allowedDoneness: list("blue|rare|medium_rare|medium|medium_well|well_done"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    requiredPhases: list("preheat|direct_sear|flip|finish_to_target|rest"),
    setup: { min: 10, max: 15 },
    active: { min: 7, max: 18 },
    rest: { min: 5, max: 10 },
    hasFatCap: false,
    fatCapBehavior: "none",
    flareUpRisk: "medium",
    requiresMoveOnFlareup: true,
    warningCodes: list("pat_dry_before_sear|serve_immediately"),
    prepWarningCodes: list("pat_dry_before_sear"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 45, max: 1440 },
    saltAmountGuidance: "generous",
    saltSurfaceGuidance: "all_sides",
  }),
  catalogRow({
    cutId: "bone_in_ribeye",
    variantId: "chuleton",
    animal: "beef",
    category: "beef_steak",
    cookingProfileId: "thick_beef_direct_indirect",
    prepProfileId: "beef_thick_dry_brine",
    temperatureMode: "doneness_target",
    allowedDoneness: list("rare|medium_rare|medium"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    requiredPhases: list("preheat|indirect_warmup|direct_sear|rest|slice"),
    setup: { min: 12, max: 20 },
    active: { min: 25, max: 65 },
    rest: { min: 8, max: 15 },
    hasFatCap: false,
    fatCapBehavior: "fat_edges_render_briefly",
    flareUpRisk: "medium",
    requiresMoveOnFlareup: true,
    warningCodes: list("probe_away_from_bone|serve_immediately|do_not_use_92c_target"),
    prepWarningCodes: list("pat_dry_before_sear"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 120, max: 1440 },
    saltAmountGuidance: "generous",
    saltSurfaceGuidance: "all_sides_edges_bone_side",
  }),
  catalogRow({
    cutId: "tri_tip",
    variantId: "whole",
    animal: "beef",
    category: "beef_roast",
    cookingProfileId: "beef_roast_reverse_sear",
    prepProfileId: "beef_thick_dry_brine",
    temperatureMode: "doneness_target",
    allowedDoneness: list("medium_rare|medium"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    requiredPhases: list("preheat|indirect_roast|direct_sear|rest|slice_against_grain"),
    setup: { min: 12, max: 20 },
    active: { min: 25, max: 55 },
    rest: { min: 10, max: 15 },
    hasFatCap: false,
    fatCapBehavior: "trim_silver_skin_if_needed",
    flareUpRisk: "low",
    requiresMoveOnFlareup: false,
    warningCodes: list("slice_against_two_grain_directions|do_not_use_92c_target"),
    prepWarningCodes: list("pat_dry_before_sear"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 120, max: 1440 },
    saltAmountGuidance: "moderate",
    saltSurfaceGuidance: "all_sides",
  }),
  catalogRow({
    cutId: "chuck_roast",
    variantId: "whole",
    animal: "beef",
    category: "beef_low_slow",
    cookingProfileId: "low_and_slow_beef",
    prepProfileId: "low_slow_dry_brine",
    temperatureMode: "texture_breakdown",
    allowedDoneness: [],
    hideDonenessSelector: true,
    requiredPhases: list("preheat|low_slow_indirect|wrap_optional|probe_tender_check|long_rest"),
    setup: { min: 15, max: 30 },
    active: { min: 240, max: 480 },
    rest: { min: 30, max: 90 },
    hasFatCap: false,
    fatCapBehavior: "render_connective_tissue_low_slow",
    flareUpRisk: "low",
    requiresMoveOnFlareup: false,
    warningCodes: list("hide_steak_doneness|probe_tender_not_doneness|stall_expected"),
    prepWarningCodes: list("low_slow_salt_ahead_recommended"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 720, max: 1440 },
    saltAmountGuidance: "generous",
    saltSurfaceGuidance: "all_sides",
  }),
  catalogRow({
    cutId: "brisket",
    variantId: "whole",
    animal: "beef",
    category: "beef_low_slow",
    cookingProfileId: "low_and_slow_beef",
    prepProfileId: "low_slow_dry_brine",
    temperatureMode: "texture_breakdown",
    allowedDoneness: [],
    hideDonenessSelector: true,
    requiredPhases: list("preheat|low_slow_smoke|stall_management|wrap_optional|probe_tender_check|long_hold"),
    setup: { min: 20, max: 35 },
    active: { min: 480, max: 900 },
    rest: { min: 60, max: 180 },
    hasFatCap: true,
    fatCapBehavior: "trim_to_even_layer_and_cook_fat_side_toward_heat_if_needed",
    flareUpRisk: "low",
    requiresMoveOnFlareup: false,
    warningCodes: list("stall_expected|probe_tender_not_doneness|long_hold_ok|hide_steak_doneness"),
    prepWarningCodes: list("low_slow_salt_ahead_recommended"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 720, max: 1440 },
    saltAmountGuidance: "generous",
    saltSurfaceGuidance: "all_sides",
  }),
  catalogRow({
    cutId: "beef_short_ribs",
    variantId: "rack_or_individual",
    animal: "beef",
    category: "beef_low_slow",
    cookingProfileId: "low_and_slow_beef",
    prepProfileId: "low_slow_dry_brine",
    temperatureMode: "texture_breakdown",
    allowedDoneness: [],
    hideDonenessSelector: true,
    requiredPhases: list("preheat|low_slow_indirect|probe_tender_check|rest"),
    setup: { min: 20, max: 30 },
    active: { min: 300, max: 540 },
    rest: { min: 30, max: 90 },
    hasFatCap: false,
    fatCapBehavior: "render_intramuscular_fat_low_slow",
    flareUpRisk: "low",
    requiresMoveOnFlareup: false,
    warningCodes: list("probe_away_from_bone|probe_tender_not_doneness|hide_steak_doneness"),
    prepWarningCodes: [],
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 720, max: 1440 },
    saltAmountGuidance: "generous",
    saltSurfaceGuidance: "meat_sides",
  }),
  catalogRow({
    cutId: "pork_ribs",
    variantId: "default",
    animal: "pork",
    category: "pork_low_slow",
    cookingProfileId: "pork_ribs_low_slow",
    prepProfileId: "pork_ribs_rub_salt_guard",
    temperatureMode: "texture_breakdown",
    allowedDoneness: [],
    hideDonenessSelector: true,
    requiredPhases: list("preheat|low_slow|sauce_optional|rest"),
    setup: { min: 15, max: 25 },
    active: { min: 180, max: 360 },
    rest: { min: 15, max: 45 },
    hasFatCap: false,
    fatCapBehavior: "none",
    flareUpRisk: "low",
    requiresMoveOnFlareup: false,
    warningCodes: list("safe_pork_temp|avoid_double_salting_if_rub_contains_salt"),
    prepWarningCodes: list("avoid_double_salting_if_rub_contains_salt"),
    saltStrategy: "rub_salt_aware",
    saltTimingMinutes: { min: 120, max: 720 },
    saltAmountGuidance: "depends_on_rub_salt",
    saltSurfaceGuidance: "meat_side_and_bone_side_light",
  }),
  catalogRow({
    cutId: "chicken_breast",
    variantId: "boneless",
    animal: "chicken",
    category: "poultry",
    cookingProfileId: "poultry_safe_direct",
    prepProfileId: "poultry_short_dry_brine",
    temperatureMode: "safe_temp",
    allowedDoneness: [],
    hideDonenessSelector: true,
    requiredPhases: list("preheat|direct_sear|finish_to_safe_temp|rest"),
    setup: { min: 12, max: 20 },
    active: { min: 12, max: 25 },
    rest: { min: 5, max: 8 },
    hasFatCap: false,
    fatCapBehavior: "none",
    flareUpRisk: "low",
    requiresMoveOnFlareup: false,
    warningCodes: list("poultry_safe_temp|required_safe_final_temp|separate_raw_chicken_tools|hide_doneness_selector"),
    prepWarningCodes: list("avoid_over_salting_lean_poultry"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 30, max: 240 },
    saltAmountGuidance: "moderate",
    saltSurfaceGuidance: "all_sides",
  }),
  catalogRow({
    cutId: "whole_chicken",
    variantId: "whole",
    animal: "chicken",
    category: "poultry",
    cookingProfileId: "poultry_whole_indirect",
    prepProfileId: "poultry_whole_dry_brine",
    temperatureMode: "safe_temp",
    allowedDoneness: [],
    hideDonenessSelector: true,
    requiredPhases: list("preheat|indirect_roast|safe_temp_check|rest"),
    setup: { min: 12, max: 20 },
    active: { min: 60, max: 110 },
    rest: { min: 10, max: 20 },
    hasFatCap: false,
    fatCapBehavior: "none",
    flareUpRisk: "medium",
    requiresMoveOnFlareup: true,
    warningCodes: list("poultry_safe_temp|required_safe_final_temp|separate_raw_chicken_tools|hide_doneness_selector"),
    prepWarningCodes: list("air_dry_skin_for_crispness|separate_raw_chicken_tools"),
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 240, max: 1440 },
    saltAmountGuidance: "moderate",
    saltSurfaceGuidance: "skin_and_cavity",
  }),
  catalogRow({
    cutId: "asparagus",
    variantId: "spears",
    animal: "vegetable",
    category: "vegetables",
    cookingProfileId: "vegetables_direct",
    prepProfileId: "vegetable_salt_just_before",
    temperatureMode: "visual_only",
    allowedDoneness: [],
    hideDonenessSelector: true,
    requiredPhases: list("preheat|direct_grill|visual_check|serve"),
    setup: { min: 8, max: 12 },
    active: { min: 4, max: 8 },
    rest: { min: 0, max: 2 },
    hasFatCap: false,
    fatCapBehavior: "none",
    flareUpRisk: "low",
    requiresMoveOnFlareup: false,
    warningCodes: list("avoid_early_salting_vegetables|serve_immediately"),
    prepWarningCodes: list("avoid_early_salting_vegetables"),
    saltStrategy: "salt_just_before",
    saltTimingMinutes: { min: 0, max: 5 },
    saltAmountGuidance: "light",
    saltSurfaceGuidance: "all_sides",
  }),
];

const cookingProfileV2Rows: readonly CookingProfileV2[] = [
  cookingProfile({
    profileId: "steak_direct",
    temperatureMode: "doneness_target",
    allowedDoneness: list("blue|rare|medium_rare|medium|medium_well|well_done"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    defaultMethod: "direct_sear_two_zone_finish_if_needed",
    expectedPhases: list("preheat|direct_sear|flip|finish_to_target|rest"),
    setup: { min: 10, max: 15 },
    active: { min: 6, max: 20 },
    rest: { min: 5, max: 10 },
    requiredWarnings: list("pat_dry_before_sear|serve_immediately"),
  }),
  cookingProfile({
    profileId: "thick_beef_direct_indirect",
    temperatureMode: "doneness_target",
    allowedDoneness: list("rare|medium_rare|medium"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    defaultMethod: "reverse_sear_or_indirect_then_direct",
    expectedPhases: list("preheat|indirect_warmup|direct_sear|rest|slice"),
    setup: { min: 12, max: 20 },
    active: { min: 25, max: 75 },
    rest: { min: 8, max: 15 },
    requiredWarnings: list("probe_away_from_bone|serve_immediately"),
  }),
  cookingProfile({
    profileId: "beef_roast_reverse_sear",
    temperatureMode: "doneness_target",
    allowedDoneness: list("medium_rare|medium"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    defaultMethod: "reverse_sear",
    expectedPhases: list("preheat|indirect_roast|direct_sear|rest|slice_against_grain"),
    setup: { min: 12, max: 20 },
    active: { min: 25, max: 65 },
    rest: { min: 10, max: 20 },
    requiredWarnings: list("slice_against_grain|do_not_use_92c_target"),
  }),
  cookingProfile({
    profileId: "beef_fat_cap_direct_indirect",
    temperatureMode: "doneness_target",
    allowedDoneness: list("medium_rare|medium"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    defaultMethod: "indirect_then_brief_fat_cap_sear",
    expectedPhases: list("preheat|indirect_roast|brief_fat_cap_sear|rest|slice_against_grain"),
    setup: { min: 12, max: 20 },
    active: { min: 30, max: 75 },
    rest: { min: 10, max: 20 },
    requiredWarnings: list("fat_cap_burn_risk|flare_up_risk|move_to_indirect_on_flareup"),
  }),
  cookingProfile({
    profileId: "steak_direct_fat_cap_edge",
    temperatureMode: "doneness_target",
    allowedDoneness: list("medium_rare|medium"),
    defaultDoneness: "medium_rare",
    hideDonenessSelector: false,
    defaultMethod: "direct_sear_then_brief_fat_edge_render",
    expectedPhases: list("preheat|direct_sear|edge_fat_render_brief|rest"),
    setup: { min: 10, max: 15 },
    active: { min: 8, max: 18 },
    rest: { min: 5, max: 10 },
    requiredWarnings: list("do_not_burn_fat_edge|flare_up_risk"),
  }),
  cookingProfile({
    profileId: "low_and_slow_beef",
    temperatureMode: "texture_breakdown",
    allowedDoneness: [],
    hideDonenessSelector: true,
    defaultMethod: "low_and_slow_indirect",
    expectedPhases: list("preheat|low_slow_indirect|stall_management|wrap_optional|probe_tender_check|long_rest_or_hold"),
    setup: { min: 15, max: 35 },
    active: { min: 240, max: 900 },
    rest: { min: 30, max: 180 },
    requiredWarnings: list("hide_steak_doneness|probe_tender_not_doneness|stall_expected"),
  }),
  cookingProfile({
    profileId: "pork_ribs_low_slow",
    temperatureMode: "texture_breakdown",
    allowedDoneness: [],
    hideDonenessSelector: true,
    defaultMethod: "low_and_slow_indirect",
    expectedPhases: list("preheat|low_slow|sauce_optional|bend_test|rest"),
    setup: { min: 15, max: 25 },
    active: { min: 180, max: 360 },
    rest: { min: 15, max: 45 },
    requiredWarnings: list("avoid_double_salting_if_rub_contains_salt|bend_test_not_steak_doneness"),
  }),
  cookingProfile({
    profileId: "poultry_safe_direct",
    temperatureMode: "safe_temp",
    allowedDoneness: [],
    hideDonenessSelector: true,
    defaultMethod: "direct_then_indirect_to_safe_temp",
    expectedPhases: list("preheat|direct_sear|finish_to_safe_temp|rest"),
    setup: { min: 12, max: 20 },
    active: { min: 12, max: 30 },
    rest: { min: 5, max: 8 },
    requiredWarnings: list("poultry_safe_temp|separate_raw_chicken_tools|hide_doneness_selector"),
  }),
  cookingProfile({
    profileId: "vegetables_direct",
    temperatureMode: "visual_only",
    allowedDoneness: [],
    hideDonenessSelector: true,
    defaultMethod: "direct_grill",
    expectedPhases: list("preheat|direct_grill|visual_check|serve"),
    setup: { min: 8, max: 12 },
    active: { min: 4, max: 18 },
    rest: { min: 0, max: 2 },
    requiredWarnings: list("avoid_early_salting_vegetables|serve_immediately"),
  }),
];

const prepProfileV2Rows: readonly PrepProfileV2[] = [
  {
    profileId: "beef_steak_dry_brine",
    appliesToCookingProfiles: list("steak_direct|steak_direct_thin"),
    prepLeadTimeMinutes: { min: 45, max: 1440 },
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 45, max: 1440 },
    saltAmountGuidance: "generous",
    saltSurfaceGuidance: "all_sides",
    prepWarningCodes: list("pat_dry_before_sear"),
    titleEn: "Salt 45 min-24 h before",
  },
  {
    profileId: "beef_thick_dry_brine",
    appliesToCookingProfiles: list("thick_beef_direct_indirect|beef_roast_reverse_sear"),
    prepLeadTimeMinutes: { min: 120, max: 1440 },
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 120, max: 1440 },
    saltAmountGuidance: "generous",
    saltSurfaceGuidance: "all_sides",
    prepWarningCodes: list("pat_dry_before_sear"),
    titleEn: "Salt 2-24 h before",
  },
  {
    profileId: "beef_thick_dry_brine_fat_cap",
    appliesToCookingProfiles: list("beef_fat_cap_direct_indirect"),
    prepLeadTimeMinutes: { min: 120, max: 1440 },
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 120, max: 1440 },
    saltAmountGuidance: "moderate",
    saltSurfaceGuidance: "meat_side_generous_fat_cap_light",
    prepWarningCodes: list("avoid_heavy_salt_on_fat_cap|pat_dry_before_sear"),
    titleEn: "Salt 2-24 h before; light on fat cap",
  },
  {
    profileId: "low_slow_dry_brine",
    appliesToCookingProfiles: list("low_and_slow_beef"),
    prepLeadTimeMinutes: { min: 720, max: 1440 },
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 720, max: 1440 },
    saltAmountGuidance: "generous",
    saltSurfaceGuidance: "all_sides",
    prepWarningCodes: list("low_slow_salt_ahead_recommended|rub_may_include_salt"),
    titleEn: "Salt 12-24 h before",
  },
  {
    profileId: "pork_ribs_rub_salt_guard",
    appliesToCookingProfiles: list("pork_ribs_low_slow"),
    prepLeadTimeMinutes: { min: 120, max: 720 },
    saltStrategy: "rub_salt_aware",
    saltTimingMinutes: { min: 120, max: 720 },
    saltAmountGuidance: "depends_on_rub_salt",
    saltSurfaceGuidance: "meat_side_and_bone_side_light",
    prepWarningCodes: list("avoid_double_salting_if_rub_contains_salt"),
    titleEn: "Rub 2-12 h before; watch salt",
  },
  {
    profileId: "poultry_short_dry_brine",
    appliesToCookingProfiles: list("poultry_safe_direct"),
    prepLeadTimeMinutes: { min: 30, max: 240 },
    saltStrategy: "dry_brine",
    saltTimingMinutes: { min: 30, max: 240 },
    saltAmountGuidance: "moderate",
    saltSurfaceGuidance: "all_sides",
    prepWarningCodes: list("separate_raw_chicken_tools|avoid_over_salting_lean_poultry"),
    titleEn: "Salt 30 min-4 h before",
  },
  {
    profileId: "vegetable_salt_just_before",
    appliesToCookingProfiles: list("vegetables_direct|vegetables_roast_indirect"),
    prepLeadTimeMinutes: { min: 0, max: 5 },
    saltStrategy: "salt_just_before",
    saltTimingMinutes: { min: 0, max: 5 },
    saltAmountGuidance: "light",
    saltSurfaceGuidance: "all_sides",
    prepWarningCodes: list("avoid_early_salting_vegetables"),
    titleEn: "Salt just before",
  },
];

const rowByCutAndVariant = new Map(cutCatalogV2Rows.map((row) => [`${row.cutId}:${row.variantId}`, row]));
const rowsByCut = new Map<string, CutCatalogV2Row[]>();
const cookingProfilesById = new Map(cookingProfileV2Rows.map((profile) => [profile.profileId, profile]));
const prepProfilesById = new Map(prepProfileV2Rows.map((profile) => [profile.profileId, profile]));

for (const row of cutCatalogV2Rows) {
  rowsByCut.set(row.cutId, [...(rowsByCut.get(row.cutId) ?? []), row]);
}

const cutAliases: Record<string, { cutId: string; variantId?: string }> = {
  "bone-in entrecote": { cutId: "bone_in_ribeye", variantId: "chuleton" },
  "bone-in ribeye": { cutId: "bone_in_ribeye", variantId: "chuleton" },
  "cowboy steak": { cutId: "bone_in_ribeye", variantId: "chuleton" },
  "ribeye + bone_in_chuleton": { cutId: "bone_in_ribeye", variantId: "chuleton" },
  "ribeye on the bone": { cutId: "bone_in_ribeye", variantId: "chuleton" },
  "ribeye:bone_in_chuleton": { cutId: "bone_in_ribeye", variantId: "chuleton" },
  bone_in_chuleton: { cutId: "bone_in_ribeye", variantId: "chuleton" },
  bone_in_ribeye: { cutId: "bone_in_ribeye", variantId: "chuleton" },
  chuleton: { cutId: "bone_in_ribeye", variantId: "chuleton" },
  entrecote: { cutId: "ribeye", variantId: "steak" },
  lomo_alto: { cutId: "ribeye", variantId: "steak" },
  maminha: { cutId: "tri_tip", variantId: "whole" },
  picanha_steak: { cutId: "picanha", variantId: "steaks" },
  picanha_steaks: { cutId: "picanha", variantId: "steaks" },
  pechuga: { cutId: "chicken_breast", variantId: "boneless" },
  pollo_entero: { cutId: "whole_chicken", variantId: "whole" },
  short_ribs: { cutId: "beef_short_ribs", variantId: "rack_or_individual" },
  costillas: { cutId: "pork_ribs", variantId: "default" },
  esparragos: { cutId: "asparagus", variantId: "spears" },
};

const defaultVariantPriority = ["whole", "default", "steak", "boneless", "spears", "rack_or_individual", "steaks"];

const donenessAliases: Record<string, DonenessId> = {
  just_cooked: "medium",
  translucent: "juicy",
};

function normalizeId(value: string | undefined) {
  return (
    value
      ?.trim()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase() ?? ""
  );
}

function normalizeDoneness(value: string): DonenessId | undefined {
  const normalized = normalizeId(value);
  const aliased = donenessAliases[normalized] ?? normalized;
  const supported: readonly string[] = [
    "blue",
    "rare",
    "medium_rare",
    "medium",
    "medium_well",
    "well_done",
    "juicy_safe",
    "medium_safe",
    "safe",
    "juicy",
  ];

  return supported.includes(aliased) ? (aliased as DonenessId) : undefined;
}

function defaultRowForCut(cutId: string) {
  const rows = rowsByCut.get(cutId);
  if (!rows?.length) return undefined;

  for (const variantId of defaultVariantPriority) {
    const row = rows.find((candidate) => candidate.variantId === variantId);
    if (row) return row;
  }

  return rows[0];
}

export function getCutCatalogV2Row(cutId: string, variantId?: string): CutCatalogV2Row | undefined {
  const normalizedCutId = normalizeId(cutId);
  const normalizedVariantId = normalizeId(variantId);
  const alias = cutAliases[normalizedCutId];
  const resolvedCutId = alias?.cutId ?? normalizedCutId;
  const resolvedVariantId =
    resolvedCutId === "ribeye" && normalizedVariantId === "bone_in_chuleton"
      ? "chuleton"
      : normalizedVariantId || alias?.variantId;
  const canonicalCutId =
    resolvedCutId === "ribeye" && resolvedVariantId === "chuleton" ? "bone_in_ribeye" : resolvedCutId;

  if (resolvedVariantId) {
    return rowByCutAndVariant.get(`${canonicalCutId}:${resolvedVariantId}`) ?? defaultRowForCut(canonicalCutId);
  }

  return defaultRowForCut(canonicalCutId);
}

export function getCookingProfileV2(profileId: string): CookingProfileV2 | undefined {
  return cookingProfilesById.get(normalizeId(profileId));
}

export function getPrepProfileV2(profileId: string): PrepProfileV2 | undefined {
  return prepProfilesById.get(normalizeId(profileId));
}

export function getTemperatureModeFromCatalogV2(
  cutId: string,
  variantId?: string,
): CatalogV2TemperatureMode | undefined {
  return getCutCatalogV2Row(cutId, variantId)?.temperatureMode;
}

export function getAllowedDonenessFromCatalogV2(cutId: string, variantId?: string): DonenessId[] | undefined {
  const row = getCutCatalogV2Row(cutId, variantId);
  if (!row) return undefined;

  const allowed = row.allowedDoneness.map(normalizeDoneness).filter((doneness): doneness is DonenessId =>
    Boolean(doneness),
  );
  return allowed.length > 0 ? [...new Set(allowed)] : undefined;
}

export function getDefaultDonenessFromCatalogV2(cutId: string, variantId?: string): DonenessId | undefined {
  const row = getCutCatalogV2Row(cutId, variantId);
  return row?.defaultDoneness ? normalizeDoneness(row.defaultDoneness) : undefined;
}

export function getWarningCodesFromCatalogV2(cutId: string, variantId?: string): string[] | undefined {
  const row = getCutCatalogV2Row(cutId, variantId);
  return row ? [...row.warningCodes] : undefined;
}

export function getFatCapMetadataFromCatalogV2(
  cutId: string,
  variantId?: string,
): CatalogV2FatCapMetadata | undefined {
  const row = getCutCatalogV2Row(cutId, variantId);
  if (!row) return undefined;

  return {
    hasFatCap: row.hasFatCap,
    behavior: row.fatCapBehavior,
    flareUpRisk: row.flareUpRisk,
    requiresMoveOnFlareup: row.requiresMoveOnFlareup,
    warningCodes: row.warningCodes,
    requiredPhases: row.requiredPhases,
    timeRanges: row.timeRanges,
  };
}

export function getPrepGuidanceFromCatalogV2(cutId: string, variantId?: string): CatalogV2PrepGuidance | undefined {
  const row = getCutCatalogV2Row(cutId, variantId);
  if (!row) return undefined;
  const prepProfile = getPrepProfileV2(row.prepProfileId);

  return {
    prepProfileId: row.prepProfileId,
    prepLeadTimeMinutes: prepProfile?.prepLeadTimeMinutes,
    prepWarningCodes: row.prepWarningCodes.length ? row.prepWarningCodes : (prepProfile?.prepWarningCodes ?? []),
    saltStrategy: row.saltStrategy ?? prepProfile?.saltStrategy,
    saltTimingMinutes: row.saltTimingMinutes ?? prepProfile?.saltTimingMinutes,
    saltAmountGuidance: row.saltAmountGuidance ?? prepProfile?.saltAmountGuidance,
    saltSurfaceGuidance: row.saltSurfaceGuidance ?? prepProfile?.saltSurfaceGuidance,
  };
}

export function getTimeRangesFromCatalogV2(cutId: string, variantId?: string): CatalogV2TimeRanges | undefined {
  return getCutCatalogV2Row(cutId, variantId)?.timeRanges;
}

export function emptyCatalogV2TimeRanges(): CatalogV2TimeRanges {
  return {
    setupMinutes: emptyTimeRange,
    activeCookMinutes: emptyTimeRange,
    restMinutes: emptyTimeRange,
    cutPlanMinutes: emptyTimeRange,
    sessionTotalMinutes: emptyTimeRange,
  };
}
