import { brandIconAssets } from "./iconAssets";

export const cutIconAssets = {
  tomahawk: brandIconAssets.cutTomahawk,
} as const;

export type CutIconAssetKey = keyof typeof cutIconAssets;
