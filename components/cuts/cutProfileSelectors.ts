import {
  generatedCutProfiles,
  type GeneratedAnimalId,
  type GeneratedCookingStyle,
  type GeneratedCutProfile,
} from "@/lib/generated/cutProfiles";
import type { CutGroup, CutIntent } from "./cutSelectionTypes";

const categoryLabels: Record<string, string> = {
  bbq: "BBQ",
  breast: "Breast",
  fillet: "Fillets",
  ground: "Ground",
  leg: "Leg",
  loin: "Loin",
  ribs: "Ribs",
  roast: "Roasts",
  steak: "Steaks",
  tail: "Tail",
  thigh: "Thighs",
  vegetable: "Vegetables",
  whole: "Whole",
  wing: "Wings",
};

const styleLabels: Record<GeneratedCookingStyle, string> = {
  crispy: "Crispy",
  fast: "Direct heat",
  fatcap: "Fat cap",
  fish: "Fish",
  lowSlow: "Low and slow",
  poultry: "Poultry",
  reverse: "Reverse sear",
  thick: "Thick cut",
  vegetable: "Vegetables",
};

const helpfulAliasByCutId: Record<string, string> = {
  ribeye: "Rib eye",
  striploin: "New York strip",
  tenderloin: "Filet",
  tomahawk: "Bone-in ribeye",
  pork_tenderloin: "Pork fillet",
};

export function getCutsByAnimal(animal: GeneratedAnimalId) {
  return generatedCutProfiles.filter((profile) => profile.animalId === animal);
}

export function getCutsByAnimalAndCategory(animal: GeneratedAnimalId, category: string) {
  return getCutsByAnimal(animal).filter((profile) => profile.category === category);
}

export function getQuickPicksByAnimal(animal: GeneratedAnimalId, tag?: CutIntent | null) {
  const cuts = getCutsByAnimal(animal);
  const taggedCuts = tag ? cuts.filter((profile) => hasIntent(profile, tag)) : cuts.filter((profile) => hasIntent(profile, "quick"));
  return taggedCuts.slice(0, 6);
}

export function getCategoryGroups(profiles: GeneratedCutProfile[]): CutGroup[] {
  const groups = new Map<string, GeneratedCutProfile[]>();

  for (const profile of profiles) {
    const category = profile.category || "other";
    groups.set(category, [...(groups.get(category) ?? []), profile]);
  }

  return [...groups.entries()].map(([category, cuts]) => ({
    id: category,
    label: getCategoryLabel(category),
    cuts,
  }));
}

export function getAvailableCategories(animal: GeneratedAnimalId) {
  return [...new Set(getCutsByAnimal(animal).map((profile) => profile.category).filter(Boolean))];
}

export function filterCutsByIntent(profiles: GeneratedCutProfile[], intent: CutIntent | null) {
  if (!intent) return profiles;
  return profiles.filter((profile) => hasIntent(profile, intent));
}

export function hasIntent(profile: GeneratedCutProfile, intent: CutIntent) {
  const tags = getTagSet(profile);
  if (intent === "slow") return tags.has("slow") || profile.style === "lowSlow";
  return tags.has(intent);
}

export function getDisplayName(profile: GeneratedCutProfile) {
  return profile.canonicalNameEn;
}

export function getCutDescriptor(profile: GeneratedCutProfile) {
  return toDisplaySentence(profile.notesEn || profile.errorEn || `${getStyleLabel(profile)} method.`);
}

export function getHelpfulAlias(profile: GeneratedCutProfile) {
  return helpfulAliasByCutId[profile.id] ?? null;
}

export function getWhyChooseLabel(profile: GeneratedCutProfile) {
  return toDisplaySentence(profile.textureResultEn || profile.notesEn || profile.errorEn || "A reliable choice for this cooking path.");
}

export function getDifficultyLabel(profile: GeneratedCutProfile) {
  if (profile.confidenceLevel === "high" || profile.tipsEn.includes("easy")) return "Easy";
  if (profile.style === "lowSlow" || profile.confidenceLevel === "low") return "Hard";
  return "Medium";
}

export function getEstimatedTimeLabel(profile: GeneratedCutProfile) {
  if (profile.estimatedTotalTimeMin) return `${profile.estimatedTotalTimeMin} min`;
  if (profile.cookingMinutes) return `${profile.cookingMinutes} min`;
  if (profile.estimatedTimeMinPerCm) return `${profile.estimatedTimeMinPerCm} min/cm`;
  return "Visual";
}

export function getStyleLabel(profile: GeneratedCutProfile) {
  return styleLabels[profile.style] ?? profile.cookingStyle ?? profile.style;
}

export function getTemperatureLabel(profile: GeneratedCutProfile) {
  return profile.targetTempC ? `${profile.targetTempC}°C` : null;
}

export function getCategoryLabel(category: string) {
  return categoryLabels[category] ?? titleCase(category);
}

export function getSafetyNote(profile: GeneratedCutProfile) {
  return profile.safetyNoteEn || profile.errorEn || "Use visual doneness and safe handling.";
}

function getTagSet(profile: GeneratedCutProfile) {
  return new Set(profile.tipsEn.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
}

function titleCase(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function toDisplaySentence(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return cleaned;
  return cleaned.endsWith(".") ? cleaned : `${cleaned}.`;
}
