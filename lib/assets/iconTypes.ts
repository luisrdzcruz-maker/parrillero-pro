export const ICON_CATEGORIES = [
  "ui",
  "animals",
  "cuts",
  "equipment",
  "methods",
  "warnings",
  "live",
  "setup",
] as const;

export type IconCategory = (typeof ICON_CATEGORIES)[number];

export type IconPublicPath = `/${string}`;

export type IconFileFormat = "webp" | "avif" | "svg";

export type IconRegistryEntry<
  TCategory extends IconCategory = IconCategory,
  TKey extends string = string,
> = {
  category: TCategory;
  key: TKey;
  path: IconPublicPath;
  format: IconFileFormat;
  description?: string;
};

export type IconRegistryCategory<TCategory extends IconCategory = IconCategory> = Record<
  string,
  IconRegistryEntry<TCategory>
>;

export type IconRegistry = {
  [TCategory in IconCategory]: IconRegistryCategory<TCategory>;
};
