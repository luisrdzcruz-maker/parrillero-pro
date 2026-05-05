import type { AnimalId, CookingStyle, DonenessId, ProductCut, TargetTemp } from "./cookingCatalog";
import { donenessTemperatureProfiles, getTargetTempsForProfile, type DonenessTemperatureProfileId } from "./donenessProfiles";

export type TemperatureMode =
  | "doneness_target"
  | "safe_temp"
  | "texture_breakdown"
  | "visual_only"
  | "delicate_target";

export type TemperatureModeCutProfile = {
  id: string;
  animalId: AnimalId;
  category?: string;
  inputProfileId?: string;
  style?: CookingStyle | string;
  targetTempC?: number;
  defaultDoneness?: string;
  allowedDoneness?: readonly DonenessId[];
  targetTempsC?: Partial<Record<DonenessId, TargetTemp>>;
};

export type TemperatureTargetForCut = {
  mode: TemperatureMode;
  doneness?: DonenessId;
  target?: TargetTemp;
};

const steakDoneness: DonenessId[] = [
  "blue",
  "rare",
  "medium_rare",
  "medium",
  "medium_well",
  "well_done",
];

const phaseOneModeByCutId: Record<string, TemperatureMode> = {
  picanha: "doneness_target",
  picanha_steak: "doneness_target",
  picanha_steaks: "doneness_target",
  tri_tip: "doneness_target",
  maminha: "doneness_target",
  ribeye: "doneness_target",
  entrecote: "doneness_target",
  lomo_alto: "doneness_target",
  bone_in_chuleton: "doneness_target",
  chuleton: "doneness_target",
  tomahawk: "doneness_target",
  striploin: "doneness_target",
  tenderloin: "doneness_target",
  chuck_roast: "texture_breakdown",
  brisket: "texture_breakdown",
  beef_short_ribs: "texture_breakdown",
  short_ribs: "texture_breakdown",
  pork_ribs: "texture_breakdown",
  costillas: "texture_breakdown",
  chicken_breast: "safe_temp",
  pechuga: "safe_temp",
  whole_chicken: "safe_temp",
  pollo_entero: "safe_temp",
  salmon: "delicate_target",
  virrey: "delicate_target",
  asparagus: "visual_only",
  esparragos: "visual_only",
};

const phaseOneAllowedDonenessByCutId: Partial<Record<string, DonenessId[]>> = {
  ribeye: steakDoneness,
  entrecote: steakDoneness,
  lomo_alto: steakDoneness,
  bone_in_chuleton: steakDoneness,
  chuleton: steakDoneness,
  tomahawk: steakDoneness,
  striploin: steakDoneness,
  tenderloin: steakDoneness,
  tri_tip: ["medium_rare", "medium"],
  maminha: ["medium_rare", "medium"],
  picanha: ["medium_rare", "medium"],
  picanha_steak: ["medium_rare", "medium"],
  picanha_steaks: ["medium_rare", "medium"],
  chicken_breast: ["safe"],
  pechuga: ["safe"],
  whole_chicken: ["safe"],
  pollo_entero: ["safe"],
  salmon: ["juicy", "medium"],
  virrey: ["juicy", "medium"],
};

const phaseOneTargetsByCutId: Partial<Record<string, Partial<Record<DonenessId, TargetTemp>>>> = {
  chuck_roast: { well_done: { pull: 90, final: 92 } },
  brisket: { well_done: { pull: 91, final: 93 } },
  beef_short_ribs: { well_done: { pull: 88, final: 90 } },
  short_ribs: { well_done: { pull: 88, final: 90 } },
  pork_ribs: { well_done: { pull: 88, final: 90 } },
  costillas: { well_done: { pull: 88, final: 90 } },
  chicken_breast: { safe: { pull: 72, final: 74 } },
  pechuga: { safe: { pull: 72, final: 74 } },
  whole_chicken: { safe: { pull: 76, final: 78 } },
  pollo_entero: { safe: { pull: 76, final: 78 } },
};

function normalize(value: string | undefined) {
  return value
    ?.trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase() ?? "";
}

function contextFor(cut: ProductCut | TemperatureModeCutProfile, profile?: TemperatureModeCutProfile): TemperatureModeCutProfile {
  return {
    ...cut,
    ...profile,
    id: profile?.id ?? cut.id,
    animalId: profile?.animalId ?? cut.animalId,
    inputProfileId: profile?.inputProfileId ?? cut.inputProfileId,
    style: profile?.style ?? cut.style,
    allowedDoneness: profile?.allowedDoneness ?? cut.allowedDoneness,
  };
}

function categoryLooksLowAndSlow(category: string) {
  return ["bbq", "ribs", "shoulder", "brisket"].includes(category);
}

export function getTemperatureModeForCut(
  cut: ProductCut | TemperatureModeCutProfile,
  profile?: TemperatureModeCutProfile,
): TemperatureMode {
  const context = contextFor(cut, profile);
  const id = normalize(context.id);
  const mappedMode = phaseOneModeByCutId[id];
  if (mappedMode) return mappedMode;

  const category = normalize(context.category);
  const style = normalize(context.style);
  const inputProfileId = normalize(context.inputProfileId);

  if (context.animalId === "vegetables") return "visual_only";
  if (context.animalId === "chicken") return "safe_temp";
  if (context.animalId === "fish") return "delicate_target";

  if (context.animalId === "pork") {
    if (style === "lowslow" || style === "crispy" || categoryLooksLowAndSlow(category)) {
      return "texture_breakdown";
    }
    return "safe_temp";
  }

  if (context.animalId === "beef") {
    if (categoryLooksLowAndSlow(category)) return "texture_breakdown";
    if (style === "lowslow" && !inputProfileId.includes("steak")) return "texture_breakdown";
    return "doneness_target";
  }

  return "doneness_target";
}

export function shouldShowDonenessSelectorForCut(
  cut: ProductCut | TemperatureModeCutProfile,
  profile?: TemperatureModeCutProfile,
) {
  const mode = getTemperatureModeForCut(cut, profile);
  return mode === "doneness_target" || mode === "delicate_target";
}

export function getAllowedDonenessForCut(
  cut: ProductCut | TemperatureModeCutProfile,
  profile?: TemperatureModeCutProfile,
): DonenessId[] {
  const context = contextFor(cut, profile);
  const id = normalize(context.id);
  const mode = getTemperatureModeForCut(context);
  const mappedAllowed = phaseOneAllowedDonenessByCutId[id];
  if (mappedAllowed) return mappedAllowed;

  if (mode === "visual_only") return [];
  if (mode === "texture_breakdown") return ["well_done"];
  if (mode === "safe_temp") {
    return context.animalId === "pork" ? ["juicy_safe", "medium_safe", "well_done"] : ["safe"];
  }
  if (mode === "delicate_target") return ["juicy", "medium"];

  const profileAllowed = context.allowedDoneness?.filter((doneness) => steakDoneness.includes(doneness));
  return profileAllowed && profileAllowed.length > 0 ? [...profileAllowed] : steakDoneness;
}

export function getDefaultDonenessForCut(
  cut: ProductCut | TemperatureModeCutProfile,
  profile?: TemperatureModeCutProfile,
): DonenessId {
  const context = contextFor(cut, profile);
  const mode = getTemperatureModeForCut(context);
  const allowed = getAllowedDonenessForCut(context);
  const defaultDoneness = context.defaultDoneness as DonenessId | undefined;

  if (defaultDoneness && allowed.includes(defaultDoneness)) return defaultDoneness;
  if (mode === "visual_only") return "medium";
  if (mode === "texture_breakdown") return "well_done";
  if (mode === "safe_temp") return allowed.includes("juicy_safe") ? "juicy_safe" : "safe";
  if (mode === "delicate_target") return allowed.includes("medium") ? "medium" : allowed[0] ?? "medium";
  return allowed.includes("medium_rare") ? "medium_rare" : allowed[0] ?? "medium";
}

export function getDonenessProfileIdForTemperatureMode(
  cut: ProductCut | TemperatureModeCutProfile,
  profile?: TemperatureModeCutProfile,
): DonenessTemperatureProfileId | undefined {
  const context = contextFor(cut, profile);
  const mode = getTemperatureModeForCut(context);
  if (mode === "visual_only") return "vegetables";
  if (mode === "delicate_target") return "fishCuts";
  if (mode === "texture_breakdown") return context.animalId === "pork" ? "porkSlowCuts" : "beefSlowCuts";
  if (mode === "safe_temp") {
    if (context.animalId === "chicken") return "chickenSafeCuts";
    if (context.animalId === "pork") return "porkSafeCuts";
    if (context.animalId === "beef") return "beefSafeCuts";
  }
  if (context.animalId === "beef") return context.inputProfileId?.includes("tender") ? "beefTenderCuts" : "beefSteakCuts";
  if (context.animalId === "pork") return "porkSafeCuts";
  return undefined;
}

export function getTemperatureTargetForCut(
  cut: ProductCut | TemperatureModeCutProfile,
  selectedDonenessOrIntention?: string,
  profile?: TemperatureModeCutProfile,
): TemperatureTargetForCut {
  const context = contextFor(cut, profile);
  const mode = getTemperatureModeForCut(context);
  const allowed = getAllowedDonenessForCut(context);
  const selected = selectedDonenessOrIntention as DonenessId | undefined;
  const doneness = selected && allowed.includes(selected) ? selected : getDefaultDonenessForCut(context);
  const mappedTargets = phaseOneTargetsByCutId[normalize(context.id)];
  const profileTargets = getTargetTempsForProfile(getDonenessProfileIdForTemperatureMode(context));
  const target =
    mappedTargets?.[doneness] ??
    ("targetTempsC" in context ? context.targetTempsC?.[doneness] : undefined) ??
    profileTargets?.[doneness];

  if (mode === "visual_only") {
    return { mode };
  }

  return {
    mode,
    doneness,
    target,
  };
}

export function getAllowedTemperatureTargetTempsForCut(
  cut: ProductCut | TemperatureModeCutProfile,
  profile?: TemperatureModeCutProfile,
) {
  const allowed = getAllowedDonenessForCut(cut, profile);
  const entries = allowed
    .map((doneness) => [doneness, getTemperatureTargetForCut(cut, doneness, profile).target] as const)
    .filter((entry): entry is readonly [DonenessId, TargetTemp] => Boolean(entry[1]));

  return Object.fromEntries(entries) as Partial<Record<DonenessId, TargetTemp>>;
}

export function getTemperatureModeProfileAllowedDoneness(modeProfileId: DonenessTemperatureProfileId) {
  return donenessTemperatureProfiles[modeProfileId].allowed;
}
