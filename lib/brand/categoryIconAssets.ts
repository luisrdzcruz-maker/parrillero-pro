import { brandIconAssets } from "./iconAssets";

export const categoryIconAssets = {
  beef: brandIconAssets.categoryBeef,
  pork: brandIconAssets.categoryPork,
  chicken: brandIconAssets.categoryChicken,
  vegetables: brandIconAssets.categoryVegetables,
} as const;

export type CategoryIconAssetKey = keyof typeof categoryIconAssets;
