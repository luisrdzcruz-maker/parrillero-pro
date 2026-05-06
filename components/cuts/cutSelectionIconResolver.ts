import { getCutIconPath, type CutIconKey } from "@/lib/cutIconMap";
import type { GeneratedCutProfile } from "@/lib/generated/cutProfiles";

const cutSelectionIconKeysByCutId: Partial<Record<string, CutIconKey>> = {
  ribeye: "beef/ribeye",
  bone_in_ribeye: "beef/ribeye",
  striploin: "beef/strip-steak",
  tenderloin: "beef/tenderloin",
  picanha: "beef/picanha",
  skirt_steak: "beef/skirt-steak",
  flank_steak: "beef/flank-steak",
  t_bone: "beef/t-bone-steak",
  tomahawk: "beef/tomahawk",
  brisket: "beef/brisket",
  short_ribs: "beef/beef-ribs",
  pork_tenderloin: "pork/pork-tenderloin",
  pork_loin: "pork/pork-loin-roast",
  pork_chop: "pork/pork-loin-chop",
  iberian_secreto: "pork/iberian-secreto",
  iberian_presa: "pork/iberian-presa",
  pork_collar: "pork/pork-neck-steak",
  baby_back_ribs: "pork/pork-ribs",
  spare_ribs: "pork/pork-ribs",
  pork_belly: "pork/pork-belly",
  pork_belly_slices: "pork/pork-belly",
  chicken_breast: "chicken/chicken-breast",
  chicken_drumstick: "chicken/chicken-drumstick",
  chicken_leg_quarter: "chicken/chicken-leg-quarter",
  chicken_wing: "chicken/chicken-wings",
  whole_chicken: "chicken/whole-chicken",
  spatchcock_chicken: "chicken/spatchcock-chicken",
  corn_on_cob: "vegetables/corn-cob",
  eggplant_slices: "vegetables/eggplant",
  asparagus: "vegetables/asparagus",
  bell_peppers: "vegetables/red-bell-pepper",
  potato_halves: "vegetables/potato",
  mushrooms: "vegetables/mushrooms",
  zucchini: "vegetables/zucchini",
};

export function getCutSelectionIconPath(profile: Pick<GeneratedCutProfile, "id">) {
  return getCutIconPath(cutSelectionIconKeysByCutId[profile.id]);
}

export const cutSelectionIconMappedCutIds = Object.keys(cutSelectionIconKeysByCutId);
