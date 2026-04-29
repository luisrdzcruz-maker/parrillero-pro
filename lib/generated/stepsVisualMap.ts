// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\steps-prompts.json

export const stepsVisualMap: Record<string, string> = {

};

export const STEPS_VISUAL_FALLBACK = "/steps/fallback.webp";

export function getStepsVisual(key?: string): string {
  if (!key) {
    return STEPS_VISUAL_FALLBACK;
  }
  return stepsVisualMap[key] ?? STEPS_VISUAL_FALLBACK;
}
