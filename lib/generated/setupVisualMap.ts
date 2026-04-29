// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\setup-prompts.json

export const setupVisualMap: Record<string, string> = {
  "gas:direct": "/setup/setup_gas_direct_heat.webp",
  "gas:two-zone": "/setup/setup_gas_two_zone.webp",
  "charcoal:two-zone": "/setup/setup_fire_two_zone.webp",
  "kamado:indirect": "/setup/setup_kamado_indirect_deflector.webp",
  "indoor:pan-oven": "/setup/setup_indoor_pan_oven.webp",
  "charcoal:direct": "/setup/setup_charcoal_embers.webp",
  "charcoal:indirect": "/setup/setup_fire_indirect_heat.webp"
};

export const SETUP_VISUAL_FALLBACK = "/setup/setup_gas_direct_heat.webp";

export function getSetupVisual(key?: string): string {
  if (!key) {
    return SETUP_VISUAL_FALLBACK;
  }
  return setupVisualMap[key] ?? SETUP_VISUAL_FALLBACK;
}
