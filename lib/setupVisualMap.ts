export type SetupEquipment = "gas" | "charcoal" | "kamado" | "indoor";
export type SetupType =
  | "direct"
  | "indirect"
  | "two-zone"
  | "reverse-sear"
  | "smoke"
  | "pan"
  | "pan-oven"
  | "low-slow";

export const setupVisualMap: Record<string, string> = {
  "gas:direct": "/setup/setup_gas_direct_heat.webp",
  "gas:two-zone": "/setup/setup_gas_two_zone.webp",

  "charcoal:two-zone": "/setup/setup_charcoal_two_zone.webp",

  "kamado:indirect": "/setup/setup_kamado_indirect_deflector.webp",

  "indoor:pan-oven": "/setup/setup_indoor_pan_oven.webp"
};

export const SETUP_VISUAL_FALLBACK = "/setup/setup_gas_two_zone.webp";

export function getSetupVisual(
  equipment?: string,
  setup?: string
): string {
  const key = `${equipment}:${setup}`;
  return setupVisualMap[key] ?? SETUP_VISUAL_FALLBACK;
}