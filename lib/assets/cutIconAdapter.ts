import { CUT_ICON_PUBLIC_ROOT, type CutIconKey } from "@/lib/cutIconMap";

import { getIconEntry, getIconPath } from "./getIconPath";
import type { IconPublicPath, IconRegistryEntry } from "./iconTypes";

export type CutRegistryIconKey = CutIconKey;

export { CUT_ICON_PUBLIC_ROOT };

export function getCutIconPathFromRegistry(key?: string): IconPublicPath | undefined {
  return getIconPath({ category: "cuts", key });
}

export function getCutIconEntryFromRegistry(
  key?: string,
): IconRegistryEntry<"cuts", CutIconKey> | undefined {
  return getIconEntry({ category: "cuts", key }) as
    | IconRegistryEntry<"cuts", CutIconKey>
    | undefined;
}
