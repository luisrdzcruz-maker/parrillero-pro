import { resolvePlanningProfile } from './profileResolver';
import type { NormalizedPlannerItem, PlannerCutInput, PlanningProfile } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function estimateCookMinutes(input: PlannerCutInput, profile: PlanningProfile): number {
  let minutes = profile.defaultCookMinutes;

  if (input.thicknessCm && input.thicknessCm > 0) {
    const thicknessFactor = input.thicknessCm / 3;
    minutes *= clamp(thicknessFactor, 0.65, 1.8);
  }

  if (input.weightGrams && input.weightGrams > 0) {
    const weightFactor = Math.sqrt(input.weightGrams / 500);
    minutes *= clamp(weightFactor, 0.75, 2.4);
  }

  if (input.animal === 'chicken') minutes = Math.max(minutes, profile.minCookMinutes);
  if (input.doneness === 'well_done' || input.doneness === 'safe') minutes *= 1.12;
  if (input.doneness === 'rare' || input.doneness === 'medium_rare') minutes *= 0.92;

  return Math.round(clamp(minutes, profile.minCookMinutes, profile.maxCookMinutes));
}

function metadataProfile(input: PlannerCutInput, fallbackProfile: PlanningProfile): PlanningProfile | undefined {
  const metadata = input.planningMetadata;
  if (!metadata) return undefined;

  return {
    ...fallbackProfile,
    id: `${fallbackProfile.id}-metadata-v${metadata.version}`,
    label: `${fallbackProfile.label} (metadata)`,
    preferredZones: metadata.preferredZones.length > 0 ? metadata.preferredZones : fallbackProfile.preferredZones,
    fallbackZones: fallbackProfile.fallbackZones,
    requiredZones: metadata.requiredZones.length > 0 ? metadata.requiredZones : fallbackProfile.requiredZones,
    zoneDemand:
      metadata.zoneDemand === 'high'
        ? 3
        : metadata.zoneDemand === 'medium'
          ? 2
          : 1,
    timingSensitivity: metadata.timingSensitivity,
    canHoldWarm: metadata.canHoldWarm,
    maxHoldMinutes: metadata.maxHoldMinutes,
    preferredServeWindowMinutes: metadata.serveWindowMinutes,
    defaultRestMinutes: Math.max(0, metadata.restMinutes),
    minRestMinutes: 0,
    maxRestMinutes: Math.max(metadata.restMinutes, fallbackProfile.maxRestMinutes),
    defaultCookMinutes: Math.max(1, metadata.activeCookMinutes),
    minCookMinutes: 1,
    maxCookMinutes: Math.max(metadata.activeCookMinutes, fallbackProfile.maxCookMinutes),
    setupMinutes: Math.max(0, metadata.setupMinutes),
  };
}

export function normalizePlannerInput(input: PlannerCutInput): NormalizedPlannerItem {
  const fallbackProfile = resolvePlanningProfile(input);
  const profile = metadataProfile(input, fallbackProfile) ?? fallbackProfile;
  const estimatedCookMinutes = input.planningMetadata
    ? Math.max(1, Math.round(input.planningMetadata.activeCookMinutes))
    : estimateCookMinutes(input, profile);
  const restMinutes = input.planningMetadata
    ? Math.max(0, Math.round(input.planningMetadata.restMinutes))
    : clamp(profile.defaultRestMinutes, profile.minRestMinutes, profile.maxRestMinutes);
  const setupMinutes = input.planningMetadata
    ? Math.max(0, Math.round(input.planningMetadata.setupMinutes))
    : (profile.setupMinutes ?? 0);
  const serveOffset = input.preferredServeOffsetMinutes ?? 0;
  const serveWindow = input.planningMetadata
    ? Math.max(0, Math.round(input.planningMetadata.serveWindowMinutes))
    : profile.preferredServeWindowMinutes;

  return {
    ...input,
    profile,
    estimatedCookMinutes,
    restMinutes,
    setupMinutes,
    latestServeMinute: serveOffset,
    earliestServeMinute: serveOffset - serveWindow,
  };
}
