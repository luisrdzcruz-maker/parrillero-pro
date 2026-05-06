import { CUT_PROFILE_OVERRIDES, DEFAULT_PLANNING_PROFILES } from './planningProfiles';
import type { PlannerCutInput, PlanningProfile } from './types';

export function getPlanningProfileById(profileId: string): PlanningProfile | undefined {
  return DEFAULT_PLANNING_PROFILES.find((profile) => profile.id === profileId);
}

export function resolvePlanningProfile(input: PlannerCutInput): PlanningProfile {
  const explicit = input.profileId ? getPlanningProfileById(input.profileId) : undefined;
  if (explicit) return explicit;

  const overrideId = CUT_PROFILE_OVERRIDES[input.cutId];
  const override = overrideId ? getPlanningProfileById(overrideId) : undefined;
  if (override) return override;

  const byAnimal = DEFAULT_PLANNING_PROFILES.find((profile) => profile.animal === input.animal);
  if (byAnimal) return byAnimal;

  return DEFAULT_PLANNING_PROFILES.find((profile) => profile.id === 'vegetable-side-flexible') ?? DEFAULT_PLANNING_PROFILES[0];
}
