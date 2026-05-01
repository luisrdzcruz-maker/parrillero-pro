import fs from "fs";
import path from "path";
import { CUT_PROFILES_OUTPUT, CUT_PROFILES_SOURCE, parseCutProfiles, validateCutProfiles } from "./cuts-data.mjs";

const root = process.cwd();
const validation = validateCutProfiles(root);

if (validation.errors.length > 0) {
  console.error("Cut generation aborted because validation failed.");
  validation.errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const { profiles } = parseCutProfiles(root);
const outputPath = path.join(root, CUT_PROFILES_OUTPUT);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buildCutProfilesModule(profiles));

console.log(`Generated ${CUT_PROFILES_OUTPUT} from ${CUT_PROFILES_SOURCE}`);

function buildCutProfilesModule(profiles) {
  return `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: ${CUT_PROFILES_SOURCE}

export type GeneratedAnimalId = "beef" | "pork" | "chicken" | "fish" | "vegetables";
export type GeneratedCookingMethod =
  | "grill_direct"
  | "grill_indirect"
  | "reverse_sear"
  | "oven_pan"
  | "vegetables_grill";
export type GeneratedDonenessId =
  | "blue"
  | "rare"
  | "medium_rare"
  | "medium"
  | "medium_well"
  | "well_done"
  | "juicy_safe"
  | "medium_safe"
  | "safe"
  | "juicy";
export type GeneratedCookingStyle =
  | "fast"
  | "thick"
  | "reverse"
  | "fatcap"
  | "lowSlow"
  | "crispy"
  | "poultry"
  | "fish"
  | "vegetable";

export type GeneratedCutProfile = {
  id: string;
  animalId: GeneratedAnimalId;
  canonicalNameEn: string;
  inputProfileId: string;
  defaultThicknessCm: number;
  showThickness: boolean;
  allowedMethods: GeneratedCookingMethod[];
  defaultMethod: GeneratedCookingMethod;
  allowedDoneness: GeneratedDonenessId[];
  style: GeneratedCookingStyle;
  restingMinutes: number;
  cookingMinutes?: number;
  errorEn: string;
  aliasesEn: string[];
  notesEn?: string;
  tipsEn: string[];
};

export const generatedCutProfiles = ${JSON.stringify(stripSourceLines(profiles), null, 2)} satisfies GeneratedCutProfile[];

export const generatedCutProfilesById: Record<string, GeneratedCutProfile> = Object.fromEntries(
  generatedCutProfiles.map((profile) => [profile.id, profile]),
);

export function getGeneratedCutProfile(id: string): GeneratedCutProfile | undefined {
  return generatedCutProfilesById[id];
}
`;
}

function stripSourceLines(profiles) {
  return profiles.map(({ sourceLine, ...profile }) => profile);
}
