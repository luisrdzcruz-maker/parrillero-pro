// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\vegetables-prompts.json

export const vegetablesVisualMap: Record<string, string> = {

};

export const VEGETABLES_VISUAL_FALLBACK = "/vegetables/fallback.webp";

export function getVegetablesVisual(key?: string): string {
  if (!key) {
    return VEGETABLES_VISUAL_FALLBACK;
  }
  return vegetablesVisualMap[key] ?? VEGETABLES_VISUAL_FALLBACK;
}
