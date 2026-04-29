// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\setup-prompts.json

export const setupVisualMap: Record<string, string> = {
  "gas:direct": "/setup/setup_gas_direct_heat.webp",
  "gas:two-zone": "/setup/setup_gas_two_zone.webp",
  "charcoal:two-zone": "/setup/setup_charcoal_two_zone.webp",
  "kamado:indirect": "/setup/setup_kamado_indirect_deflector.webp",
  "indoor:pan-oven": "/setup/setup_indoor_pan_oven.webp"
};

export const SETUP_VISUAL_FALLBACK = "/setup/setup_gas_direct_heat.webp";

export type SetupEquipment = "gas" | "charcoal" | "kamado" | "indoor";
export type SetupType =
  | "direct"
  | "two-zone"
  | "indirect"
  | "reverse-sear"
  | "low-slow"
  | "pan-oven";

export function getSetupVisual(key?: string): string {
  if (!key) {
    return SETUP_VISUAL_FALLBACK;
  }
  return setupVisualMap[key] ?? SETUP_VISUAL_FALLBACK;
}

export function detectSetupFromText(text: string): SetupType {
  const normalized = (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ");

  if (normalized.includes("reverse sear") || normalized.includes("reverse-sear")) {
    return "reverse-sear";
  }

  if (
    normalized.includes("two zone") ||
    normalized.includes("two-zone") ||
    normalized.includes("direct + indirect")
  ) {
    return "two-zone";
  }

  if (normalized.includes("indirect")) {
    return "indirect";
  }

  if (normalized.includes("direct heat") || normalized.includes("directo")) {
    return "direct";
  }

  if (
    normalized.includes("smoke") ||
    normalized.includes("smoking") ||
    normalized.includes("low and slow")
  ) {
    return "low-slow";
  }

  if (
    normalized.includes("pan") ||
    normalized.includes("sarten") ||
    normalized.includes("oven") ||
    normalized.includes("horno")
  ) {
    return "pan-oven";
  }

  return "two-zone";
}
