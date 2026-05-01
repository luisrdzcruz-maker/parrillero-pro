export const COOKING_SECTIONS = [
  "times",
  "temperature",
  "steps",
  "tips",
  "shopping",
  "order",
  "quantities",
] as const;

export type CookingSection = (typeof COOKING_SECTIONS)[number];

export const FIRE_ZONES = ["direct", "indirect", "rest", "side"] as const;

export type FireZone = (typeof FIRE_ZONES)[number];

export const HEAT_LEVELS = ["high", "medium", "low"] as const;

export type HeatLevel = (typeof HEAT_LEVELS)[number];

export const EQUIPMENT = ["gas_grill", "charcoal_grill", "indoor_stove"] as const;

export type Equipment = (typeof EQUIPMENT)[number];
