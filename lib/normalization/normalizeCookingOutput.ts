import type { CookingSection, Equipment, FireZone, HeatLevel } from "../types/canonical";

const SECTION_MAP: Record<string, CookingSection> = {
  TIEMPOS: "times",
  TEMPERATURA: "temperature",
  PASOS: "steps",
  CONSEJOS: "tips",
  COMPRA: "shopping",
  ORDEN: "order",
  CANTIDADES: "quantities",
  TIMES: "times",
  TEMPERATURE: "temperature",
  STEPS: "steps",
  TIPS: "tips",
  SHOPPING: "shopping",
  ORDER: "order",
  QUANTITIES: "quantities",
};

const FIRE_ZONE_MAP: Record<string, FireZone> = {
  directa: "direct",
  directo: "direct",
  indirecta: "indirect",
  indirecto: "indirect",
  reposo: "rest",
  lateral: "side",
  side: "side",
  direct: "direct",
  indirect: "indirect",
  rest: "rest",
};

const HEAT_LEVEL_MAP: Record<string, HeatLevel> = {
  alta: "high",
  media: "medium",
  baja: "low",
  high: "high",
  medium: "medium",
  low: "low",
};

const EQUIPMENT_MAP: Record<string, Equipment> = {
  "parrilla gas": "gas_grill",
  "parrilla carbón": "charcoal_grill",
  "parrilla carbon": "charcoal_grill",
  "cocina interior": "indoor_stove",
  gas_grill: "gas_grill",
  charcoal_grill: "charcoal_grill",
  indoor_stove: "indoor_stove",
};

function normalizeLowerToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function normalizeCookingSection(value: string): CookingSection | undefined {
  return SECTION_MAP[value.trim().toUpperCase()];
}

export function normalizeFireZone(value: string): FireZone | undefined {
  return FIRE_ZONE_MAP[normalizeLowerToken(value)];
}

export function normalizeHeatLevel(value: string): HeatLevel | undefined {
  return HEAT_LEVEL_MAP[normalizeLowerToken(value)];
}

export function normalizeEquipment(value: string): Equipment | undefined {
  return EQUIPMENT_MAP[normalizeLowerToken(value)];
}

/**
 * Adapter layer for canonical internal keys.
 * Keeps existing keys untouched and adds canonical English aliases.
 */
export function normalizeCookingOutput(raw: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = { ...raw };

  for (const [key, value] of Object.entries(raw)) {
    const section = normalizeCookingSection(key);
    if (section) {
      normalized[section] = value;
    }
  }

  return normalized;
}
