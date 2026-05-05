type EquipmentIconMatch = { category: "equipment"; key: string };
type MethodIconMatch = { category: "methods"; key: string };

const EQUIPMENT_ICON_MAPPINGS: Array<{ key: string; patterns: string[] }> = [
  {
    key: "gas-grill",
    patterns: ["gas", "gas grill", "gas_grill", "parrilla gas", "parrilla de gas"],
  },
  {
    key: "charcoal-grill",
    patterns: [
      "charcoal",
      "charcoal grill",
      "charcoal_grill",
      "carbon",
      "carbón",
      "parrilla carbon",
      "parrilla carbón",
    ],
  },
  { key: "kamado", patterns: ["kamado"] },
  { key: "smoker", patterns: ["smoker", "ahumador"] },
  { key: "plancha", patterns: ["plancha"] },
  { key: "oven", patterns: ["oven", "horno"] },
  {
    key: "cast-iron-pan",
    patterns: ["pan", "cast iron", "cast-iron", "cast iron pan", "sarten", "sartén"],
  },
  {
    key: "probe-thermometer",
    patterns: ["probe", "thermometer", "termometro", "termómetro", "sonda"],
  },
];

const METHOD_ICON_MAPPINGS: Array<{ key: string; patterns: string[] }> = [
  {
    key: "two-zone-charcoal-left",
    patterns: [
      "two-zone charcoal left",
      "two zone charcoal left",
      "zona doble carbon izquierda",
      "zona doble carbón izquierda",
    ],
  },
  {
    key: "two-zone-charcoal-right",
    patterns: [
      "two-zone charcoal right",
      "two zone charcoal right",
      "zona doble carbon derecha",
      "zona doble carbón derecha",
    ],
  },
  {
    key: "two-zone-gas",
    patterns: [
      "two-zone gas",
      "two zone gas",
      "two-zone",
      "two zone",
      "zona doble",
      "2 zonas",
      "direct + indirect",
      "directo + indirecto",
    ],
  },
  { key: "direct-charcoal", patterns: ["direct charcoal", "directo carbon", "directo carbón"] },
  { key: "indirect-charcoal", patterns: ["indirect", "indirecta", "indirecto", "indirect heat"] },
  { key: "direct-heat", patterns: ["direct", "directa", "directo", "direct heat"] },
  { key: "plancha-sear", patterns: ["plancha sear", "plancha"] },
  { key: "high-heat-charcoal", patterns: ["high heat", "fuego fuerte"] },
  { key: "charcoal-fire", patterns: ["charcoal fire", "brasas"] },
];

function normalizeIconLookupValue(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_/·]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesPattern(normalizedValue: string, pattern: string) {
  const normalizedPattern = normalizeIconLookupValue(pattern);
  if (!normalizedValue || !normalizedPattern) return false;

  return normalizedValue === normalizedPattern || normalizedValue.includes(normalizedPattern);
}

export function resolveEquipmentIconKey(value: string): EquipmentIconMatch | null {
  const normalizedValue = normalizeIconLookupValue(value);
  const match = EQUIPMENT_ICON_MAPPINGS.find((entry) =>
    entry.patterns.some((pattern) => matchesPattern(normalizedValue, pattern)),
  );

  return match ? { category: "equipment", key: match.key } : null;
}

export function resolveMethodIconKey(value: string): MethodIconMatch | null {
  const normalizedValue = normalizeIconLookupValue(value);
  const match = METHOD_ICON_MAPPINGS.find((entry) =>
    entry.patterns.some((pattern) => matchesPattern(normalizedValue, pattern)),
  );

  return match ? { category: "methods", key: match.key } : null;
}
