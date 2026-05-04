// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\hero-prompts.json

export const heroVisualMap: Record<string, string> = {
  "hero_ribeye_fire": "/hero/hero_ribeye_fire.webp",
  "hero_grill_fire": "/hero/hero_grill_fire.webp",
  "hero_live_cooking": "/hero/hero_live_cooking.webp",
  "hero_premium_steak_board": "/hero/hero_premium_steak_board.webp"
};

export const HERO_VISUAL_FALLBACK = "/hero/hero_ribeye_fire.webp";

export function getHeroVisual(key?: string): string {
  if (!key) {
    return HERO_VISUAL_FALLBACK;
  }
  return heroVisualMap[key] ?? HERO_VISUAL_FALLBACK;
}
