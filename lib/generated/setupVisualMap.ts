// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: data\assets\setup-prompts.json

export const setupVisualMap: Record<string, string> = {
  "grill:two_zone": "/setup/setup_reverse_sear.webp"
};

export const SETUP_VISUAL_FALLBACK = "/setup/setup_two_zone.webp";

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
  if (normalized === "two-zone") return "two_zone";
  if (normalized === "reverse-sear") return "reverse_sear";
  if (normalized === "low-slow" || normalized === "low-and-slow") return "low_slow";
  if (normalized === "pan-oven") return "pan_oven";
  if (normalized === "direct-heat") return "direct";

  return normalized.replace(/-/g, "_");
}

function normalizeEquipmentKey(equipment?: string): string {
  const normalized = normalizeLookupText(equipment);

  if (
    normalized.includes("gas") ||
    normalized.includes("charcoal") ||
    normalized.includes("carbon") ||
    normalized.includes("kamado") ||
    normalized.includes("indoor") ||
    normalized.includes("interior") ||
    normalized.includes("grill")
  ) {
    return "grill";
  }

  return normalized || "grill";
}

export function getSetupVisual(equipment?: string, setup?: string): string {
  const equipmentKey = normalizeEquipmentKey(equipment);
  const setupKey = normalizeSetupKey(setup);
  const candidates = [
    `${equipmentKey}:${setupKey}`,
    `grill:${setupKey}`,
  ];

  for (const key of candidates) {
    const visual = setupVisualMap[key];
    if (visual) return visual;
  }

  return SETUP_VISUAL_FALLBACK;
}
