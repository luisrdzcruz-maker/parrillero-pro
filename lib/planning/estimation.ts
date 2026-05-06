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

export function normalizePlannerInput(input: PlannerCutInput): NormalizedPlannerItem {
  const profile = resolvePlanningProfile(input);
  const estimatedCookMinutes = estimateCookMinutes(input, profile);
  const restMinutes = clamp(profile.defaultRestMinutes, profile.minRestMinutes, profile.maxRestMinutes);
  const setupMinutes = profile.setupMinutes ?? 0;
  const serveOffset = input.preferredServeOffsetMinutes ?? 0;

  return {
    ...input,
    profile,
    estimatedCookMinutes,
    restMinutes,
    setupMinutes,
    latestServeMinute: serveOffset,
    earliestServeMinute: serveOffset - profile.preferredServeWindowMinutes,
  };
}
