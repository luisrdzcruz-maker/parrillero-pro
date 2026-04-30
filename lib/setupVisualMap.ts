// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data/assets/setup-prompts.json

export type SetupEquipment = string;
export type SetupType = string;

export const setupVisualMap: Record<string, string> = {
  "grill:two_zone": "/setup/setup_reverse_sear.webp"
};

export const SETUP_VISUAL_FALLBACK = "/setup/setup_two_zone.webp";

const SETUP_VISUAL_ASSETS = new Set([
  "setup_fire_direct_heat.webp",
  "setup_fire_indirect_heat.webp",
  "setup_fire_two_zone.webp",
  "setup_gas_direct_heat.webp",
  "setup_gas_two_zone.webp",
  "setup_charcoal_two_zone.webp",
  "setup_kamado_indirect_deflector.webp",
  "setup_indoor_pan_oven.webp",
  "setup_reverse_sear.webp",
  "setup_two_zone.webp",
  "setup_two_zone_v1.webp",
]);

function normalizeLookupText(text = ""): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeSetupKey(setup?: string): string {
  const normalized = normalizeLookupText(setup).replace(/[_\s]+/g, "-");

  if (!normalized) return "two_zone";
  if (normalized === "direct" || normalized === "direct-heat") return "direct_heat";
  if (normalized === "indirect" || normalized === "indirect-heat") return "indirect_heat";
  if (normalized === "two-zone") return "two_zone";
  if (
    normalized === "reverse-sear" ||
    normalized === "reverse-searing" ||
    normalized === "sear-reverse"
  ) {
    return "reverse_sear";
  }
  if (normalized === "low-slow" || normalized === "low-and-slow") return "indirect_heat";
  if (normalized === "pan-oven") return "pan_oven";

  return normalized.replace(/-/g, "_");
}

function normalizeEquipmentKey(equipment?: string): string {
  const normalized = normalizeLookupText(equipment);

  if (normalized.includes("gas")) return "gas";
  if (normalized.includes("charcoal") || normalized.includes("carbon")) return "charcoal";
  if (normalized.includes("kamado")) return "kamado";
  if (normalized.includes("indoor") || normalized.includes("interior")) return "indoor";
  if (normalized.includes("grill") || normalized.includes("fire")) return "grill";

  return normalized || "grill";
}

function setupVisualPath(key: string): string | undefined {
  const filename = `setup_${key}.webp`;
  return SETUP_VISUAL_ASSETS.has(filename) ? `/setup/${filename}` : undefined;
}

function getEquipmentSetupCandidates(equipmentKey: string, setupKey: string): string[] {
  if (equipmentKey === "kamado" && setupKey === "indirect_heat") {
    return ["kamado_indirect_deflector"];
  }

  if (equipmentKey === "indoor") {
    return ["indoor_pan_oven"];
  }

  return [];
}

export function getSetupVisual(equipment?: string, setup?: string): string {
  const equipmentKey = normalizeEquipmentKey(equipment);
  const setupKey = normalizeSetupKey(setup);
  const candidates = [
    ...getEquipmentSetupCandidates(equipmentKey, setupKey),
    `${equipmentKey}_${setupKey}`,
    `fire_${setupKey}`,
    setupKey,
  ];

  for (const key of candidates) {
    const visual = setupVisualPath(key);
    if (visual) return visual;
  }

  return SETUP_VISUAL_FALLBACK;
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
