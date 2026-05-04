import { getGeneratedCutProfile } from "@/lib/generated/cutProfiles";
import {
  detectSetupFromText,
  getSetupVisual as getSetupVisualFromType,
  SETUP_VISUAL_FALLBACK,
  setupVisualMap,
} from "@/lib/setupVisualMap";

const categoryDefaultVisualMap: Record<string, string> = {
  bbq: "/setup/setup_fire_indirect_heat.webp",
  breast: "/setup/setup_fire_direct_heat.webp",
  fillet: "/setup/setup_fire_two_zone.webp",
  ground: "/setup/setup_fire_direct_heat.webp",
  leg: "/setup/setup_fire_indirect_heat.webp",
  loin: "/setup/setup_fire_two_zone.webp",
  ribs: "/setup/setup_fire_indirect_heat.webp",
  roast: "/setup/setup_fire_indirect_heat.webp",
  steak: "/setup/setup_fire_two_zone.webp",
  tail: "/setup/setup_fire_two_zone.webp",
  thigh: "/setup/setup_fire_two_zone.webp",
  vegetable: "/setup/setup_fire_direct_heat.webp",
  whole: "/setup/setup_fire_indirect_heat.webp",
  wing: "/setup/setup_fire_direct_heat.webp",
};

function normalizeSetupVisualKey(setupVisualKey: string) {
  return setupVisualKey
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[_\s]+/g, "_")
    .replace(/[^a-z0-9:_-]/g, "");
}

function mapSetupVisualFromKey(setupVisualKey?: string): string | undefined {
  if (!setupVisualKey?.trim()) return undefined;

  const normalizedKey = normalizeSetupVisualKey(setupVisualKey);
  const candidates = [
    setupVisualKey.trim(),
    normalizedKey,
    `grill:${normalizedKey}`,
    normalizedKey.replace(/-/g, "_"),
    `grill:${normalizedKey.replace(/-/g, "_")}`,
  ];

  for (const candidate of candidates) {
    const visual = setupVisualMap[candidate];
    if (visual) return visual;
  }

  const detectedSetup = detectSetupFromText(setupVisualKey);
  const visualFromType = getSetupVisualFromType("grill", detectedSetup);
  return visualFromType === SETUP_VISUAL_FALLBACK ? undefined : visualFromType;
}

function getCategoryDefaultVisual(category?: string): string | undefined {
  if (!category) return undefined;
  return categoryDefaultVisualMap[category];
}

export function getSetupVisual(cutId: string): string | undefined {
  const profile = getGeneratedCutProfile(cutId);
  if (!profile) return SETUP_VISUAL_FALLBACK;

  const mappedVisual = mapSetupVisualFromKey(profile.setupVisualKeyEn);
  if (mappedVisual) return mappedVisual;

  const categoryVisual = getCategoryDefaultVisual(profile.category);
  if (categoryVisual) return categoryVisual;

  return SETUP_VISUAL_FALLBACK;
}
