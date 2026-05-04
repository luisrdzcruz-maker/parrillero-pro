export const brandIconAssets = {
  appFlameProbe: "/brand/icons/flame_and_probe_emblem_logo.png",
  navHome: "/brand/icons/glowing_home_icon_in_dark_theme.png",
  navCooking: "/brand/icons/grill_icon_with_glowing_accents.png",
  navLive: "/brand/icons/thermometer_and_pot_sensor_icon.png",
  navSaved: "/brand/icons/glowing_bookmark_icon_on_dark_tile.png",
  categoryBeef: "/brand/icons/glowing_bull_emblem_on_black_background.png",
  categoryPork: "/brand/icons/glowing_orange_pig_head_icon.png",
  categoryChicken: "/brand/icons/fiery_rooster_emblem_on_dark_background.png",
  categoryVegetables: "/brand/icons/glowing_vegetable_emblem_on_dark_tile.png",
  cutTomahawk: "/brand/icons/glowing_tomahawk_steak_icon.png",
} as const;

export type BrandIconAssetKey = keyof typeof brandIconAssets;
