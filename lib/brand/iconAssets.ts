export const brandIconAssets = {
  appFlameProbe: "/brand/icons/flame_and_probe_emblem_logo.webp",
  navHome: "/brand/icons/glowing_home_icon_in_dark_theme.webp",
  navCooking: "/brand/icons/grill_icon_with_glowing_accents.webp",
  navMenu: "/brand/icons/nav-menu-plan.webp",
  navLive: "/brand/icons/thermometer_and_pot_sensor_icon.webp",
  navSaved: "/brand/icons/glowing_bookmark_icon_on_dark_tile.webp",
  categoryBeef: "/brand/icons/glowing_bull_emblem_on_black_background.webp",
  categoryPork: "/brand/icons/glowing_orange_pig_head_icon.webp",
  categoryChicken: "/brand/icons/fiery_rooster_emblem_on_dark_background.webp",
  categoryVegetables: "/brand/icons/glowing_vegetable_emblem_on_dark_tile.webp",
  cutTomahawk: "/brand/icons/glowing_tomahawk_steak_icon.webp",
} as const;

export type BrandIconAssetKey = keyof typeof brandIconAssets;
