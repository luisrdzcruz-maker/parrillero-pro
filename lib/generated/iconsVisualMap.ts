// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\icons-prompts.json

export const iconsVisualMap: Record<string, string> = {

};

export const ICONS_VISUAL_FALLBACK = "/icons/fallback.webp";

export function getIconsVisual(key?: string): string {
  if (!key) {
    return ICONS_VISUAL_FALLBACK;
  }
  return iconsVisualMap[key] ?? ICONS_VISUAL_FALLBACK;
}
