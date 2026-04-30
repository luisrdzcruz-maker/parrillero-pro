// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\setup-prompts.json

export const setupVisualMap: Record<string, string> = {
  "grill:two_zone": "/setup/setup_reverse_sear.webp"
};

export const SETUP_VISUAL_FALLBACK = "/setup/setup_two_zone.webp";

export function getSetupVisual(key?: string): string {
  if (!key) {
    return SETUP_VISUAL_FALLBACK;
  }
  return setupVisualMap[key] ?? SETUP_VISUAL_FALLBACK;
}
