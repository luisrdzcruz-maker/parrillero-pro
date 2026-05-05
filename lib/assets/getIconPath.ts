import { iconRegistry } from "./iconRegistry";
import type { IconCategory, IconPublicPath, IconRegistryEntry } from "./iconTypes";

export type GetIconPathInput = {
  category: IconCategory;
  key?: string;
};

export function getIconEntry({
  category,
  key,
}: GetIconPathInput): IconRegistryEntry | undefined {
  if (!key) {
    return undefined;
  }

  const categoryRegistry = iconRegistry[category] as Record<string, IconRegistryEntry>;

  return categoryRegistry[key];
}

export function getIconPath(input: GetIconPathInput): IconPublicPath | undefined {
  return getIconEntry(input)?.path;
}
