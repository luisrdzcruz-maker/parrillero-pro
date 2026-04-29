// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data/assets/setup-prompts.json

export type SetupEquipment = string;
export type SetupType = string;

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

export function getSetupVisual(equipment?: string, setup?: string): string {
  const key = `${equipment}:${setup}`;
  return setupVisualMap[key] ?? SETUP_VISUAL_FALLBACK;
}

function normalizeSetupText(text = ""): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectSetupFromText(text?: string): SetupType {
  const normalized = normalizeSetupText(text);
  if (!normalized) return "two-zone";

  if (/(reverse sear|reverse-sear|sellado inverso)/.test(normalized)) return "reverse-sear";
  if (
    /(two zone|two-zone|direct\s*\+\s*indirect|directo\s*\+\s*indirecto|dos zonas)/.test(
      normalized
    )
  ) {
    return "two-zone";
  }
  if (/(indirect|indirecto)/.test(normalized)) return "indirect";
  if (/(direct heat|direct|directo)/.test(normalized)) return "direct";
  if (/(smoke|smoking|ahumado|low and slow)/.test(normalized)) return "low-slow";
  if (/(pan|sarten|oven|horno)/.test(normalized)) return "pan-oven";

  return "two-zone";
}
