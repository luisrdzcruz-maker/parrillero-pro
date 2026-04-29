// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\cuts-prompts.json

export const cutsVisualMap: Record<string, string> = {

};

export const CUTS_VISUAL_FALLBACK = "/cuts/fallback.webp";

export function getCutsVisual(key?: string): string {
  if (!key) {
    return CUTS_VISUAL_FALLBACK;
  }
  return cutsVisualMap[key] ?? CUTS_VISUAL_FALLBACK;
}
