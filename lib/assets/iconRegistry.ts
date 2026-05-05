import { cutIconMap, type CutIconKey } from "@/lib/cutIconMap";

import type { IconRegistry, IconRegistryCategory, IconRegistryEntry } from "./iconTypes";

const cutIconEntries = Object.entries(cutIconMap).reduce(
  (entries, [key, path]) => {
    const cutIconKey = key as CutIconKey;

    entries[cutIconKey] = {
      category: "cuts",
      key: cutIconKey,
      path,
      format: "webp",
    };

    return entries;
  },
  {} as Record<CutIconKey, IconRegistryEntry<"cuts", CutIconKey>>,
);

const uiIconEntries = {
  "cooking-dashboard": {
    category: "ui",
    key: "cooking-dashboard",
    path: "/icons/ui/cooking-dashboard.webp",
    format: "webp",
  },
  "meat-selection": {
    category: "ui",
    key: "meat-selection",
    path: "/icons/ui/meat-selection.webp",
    format: "webp",
  },
  premium: {
    category: "ui",
    key: "premium",
    path: "/icons/ui/premium.webp",
    format: "webp",
  },
  recipes: {
    category: "ui",
    key: "recipes",
    path: "/icons/ui/recipes.webp",
    format: "webp",
  },
  "shopping-list": {
    category: "ui",
    key: "shopping-list",
    path: "/icons/ui/shopping-list.webp",
    format: "webp",
  },
} as const satisfies IconRegistryCategory<"ui">;

const equipmentIconEntries = {
  "cast-iron-pan": {
    category: "equipment",
    key: "cast-iron-pan",
    path: "/icons/equipment/cast-iron-pan.webp",
    format: "webp",
  },
  "charcoal-grill": {
    category: "equipment",
    key: "charcoal-grill",
    path: "/icons/equipment/charcoal-grill.webp",
    format: "webp",
  },
  "cutting-board": {
    category: "equipment",
    key: "cutting-board",
    path: "/icons/equipment/cutting-board.webp",
    format: "webp",
  },
  "gas-grill": {
    category: "equipment",
    key: "gas-grill",
    path: "/icons/equipment/gas-grill.webp",
    format: "webp",
  },
  "gas-grill-front": {
    category: "equipment",
    key: "gas-grill-front",
    path: "/icons/equipment/gas-grill-front.webp",
    format: "webp",
  },
  kamado: {
    category: "equipment",
    key: "kamado",
    path: "/icons/equipment/kamado.webp",
    format: "webp",
  },
  oven: {
    category: "equipment",
    key: "oven",
    path: "/icons/equipment/oven.webp",
    format: "webp",
  },
  plancha: {
    category: "equipment",
    key: "plancha",
    path: "/icons/equipment/plancha.webp",
    format: "webp",
  },
  "probe-thermometer": {
    category: "equipment",
    key: "probe-thermometer",
    path: "/icons/equipment/probe-thermometer.webp",
    format: "webp",
  },
  smoker: {
    category: "equipment",
    key: "smoker",
    path: "/icons/equipment/smoker.webp",
    format: "webp",
  },
  tongs: {
    category: "equipment",
    key: "tongs",
    path: "/icons/equipment/tongs.webp",
    format: "webp",
  },
} as const satisfies IconRegistryCategory<"equipment">;

const methodIconEntries = {
  "charcoal-fire": {
    category: "methods",
    key: "charcoal-fire",
    path: "/icons/methods/charcoal-fire.webp",
    format: "webp",
  },
  "direct-charcoal": {
    category: "methods",
    key: "direct-charcoal",
    path: "/icons/methods/direct-charcoal.webp",
    format: "webp",
  },
  "direct-heat": {
    category: "methods",
    key: "direct-heat",
    path: "/icons/methods/direct-heat.webp",
    format: "webp",
  },
  "high-heat-charcoal": {
    category: "methods",
    key: "high-heat-charcoal",
    path: "/icons/methods/high-heat-charcoal.webp",
    format: "webp",
  },
  "indirect-charcoal": {
    category: "methods",
    key: "indirect-charcoal",
    path: "/icons/methods/indirect-charcoal.webp",
    format: "webp",
  },
  "plancha-sear": {
    category: "methods",
    key: "plancha-sear",
    path: "/icons/methods/plancha-sear.webp",
    format: "webp",
  },
  "two-zone-charcoal-left": {
    category: "methods",
    key: "two-zone-charcoal-left",
    path: "/icons/methods/two-zone-charcoal-left.webp",
    format: "webp",
  },
  "two-zone-charcoal-right": {
    category: "methods",
    key: "two-zone-charcoal-right",
    path: "/icons/methods/two-zone-charcoal-right.webp",
    format: "webp",
  },
  "two-zone-gas": {
    category: "methods",
    key: "two-zone-gas",
    path: "/icons/methods/two-zone-gas.webp",
    format: "webp",
  },
} as const satisfies IconRegistryCategory<"methods">;

const warningIconEntries = {
  "flare-up-risk": {
    category: "warnings",
    key: "flare-up-risk",
    path: "/icons/warnings/flare-up-risk.webp",
    format: "webp",
  },
  "long-cook-warning": {
    category: "warnings",
    key: "long-cook-warning",
    path: "/icons/warnings/long-cook-warning.webp",
    format: "webp",
  },
} as const satisfies IconRegistryCategory<"warnings">;

const liveIconEntries = {
  "check-temperature": {
    category: "live",
    key: "check-temperature",
    path: "/icons/live/check-temperature.webp",
    format: "webp",
  },
  "flip-now": {
    category: "live",
    key: "flip-now",
    path: "/icons/live/flip-now.webp",
    format: "webp",
  },
  "turn-food": {
    category: "live",
    key: "turn-food",
    path: "/icons/live/turn-food.webp",
    format: "webp",
  },
  "low-and-slow-timer": {
    category: "live",
    key: "low-and-slow-timer",
    path: "/icons/live/low-and-slow-timer.webp",
    format: "webp",
  },
  "place-food": {
    category: "live",
    key: "place-food",
    path: "/icons/live/place-food.webp",
    format: "webp",
  },
  "rest-now": {
    category: "live",
    key: "rest-now",
    path: "/icons/live/rest-now.webp",
    format: "webp",
  },
} as const satisfies IconRegistryCategory<"live">;

export const iconRegistry = {
  ui: uiIconEntries,
  animals: {},
  cuts: cutIconEntries,
  equipment: equipmentIconEntries,
  methods: methodIconEntries,
  warnings: warningIconEntries,
  live: liveIconEntries,
  setup: {},
} as const satisfies IconRegistry;

export type RegisteredIconCategory = keyof typeof iconRegistry;
