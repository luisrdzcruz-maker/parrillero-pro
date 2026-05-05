import { cutIconMap, type CutIconKey } from "@/lib/cutIconMap";

import type { IconRegistry, IconRegistryEntry } from "./iconTypes";

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

export const iconRegistry = {
  ui: {},
  animals: {},
  cuts: cutIconEntries,
  equipment: {},
  methods: {},
  warnings: {},
  live: {},
  setup: {},
} as const satisfies IconRegistry;

export type RegisteredIconCategory = keyof typeof iconRegistry;
