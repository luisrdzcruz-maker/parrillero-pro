// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: public/cut-icons/**/*.webp

export const cutIconMap = {
  "beef/beef-ribs": "/cut-icons/beef/beef-ribs.webp",
  "beef/beef-rolled-roast": "/cut-icons/beef/beef-rolled-roast.webp",
  "beef/brisket": "/cut-icons/beef/brisket.webp",
  "beef/flank-steak": "/cut-icons/beef/flank-steak.webp",
  "beef/picanha": "/cut-icons/beef/picanha.webp",
  "beef/ribeye": "/cut-icons/beef/ribeye.webp",
  "beef/skirt-steak": "/cut-icons/beef/skirt-steak.webp",
  "beef/strip-steak": "/cut-icons/beef/strip-steak.webp",
  "beef/t-bone-steak": "/cut-icons/beef/t-bone-steak.webp",
  "beef/tenderloin": "/cut-icons/beef/tenderloin.webp",
  "beef/tomahawk": "/cut-icons/beef/tomahawk.webp",
  "chicken/chicken-breast-alt": "/cut-icons/chicken/chicken-breast-alt.webp",
  "chicken/chicken-breast": "/cut-icons/chicken/chicken-breast.webp",
  "chicken/chicken-drumstick": "/cut-icons/chicken/chicken-drumstick.webp",
  "chicken/chicken-drumsticks": "/cut-icons/chicken/chicken-drumsticks.webp",
  "chicken/chicken-leg-quarter": "/cut-icons/chicken/chicken-leg-quarter.webp",
  "chicken/chicken-wings": "/cut-icons/chicken/chicken-wings.webp",
  "chicken/half-chicken": "/cut-icons/chicken/half-chicken.webp",
  "chicken/spatchcock-chicken": "/cut-icons/chicken/spatchcock-chicken.webp",
  "chicken/whole-chicken": "/cut-icons/chicken/whole-chicken.webp",
  "pork/bone-in-pork-chop": "/cut-icons/pork/bone-in-pork-chop.webp",
  "pork/iberian-presa": "/cut-icons/pork/iberian-presa.webp",
  "pork/iberian-secreto": "/cut-icons/pork/iberian-secreto.webp",
  "pork/pork-belly": "/cut-icons/pork/pork-belly.webp",
  "pork/pork-loin-chop": "/cut-icons/pork/pork-loin-chop.webp",
  "pork/pork-loin-roast": "/cut-icons/pork/pork-loin-roast.webp",
  "pork/pork-neck-steak": "/cut-icons/pork/pork-neck-steak.webp",
  "pork/pork-ribs": "/cut-icons/pork/pork-ribs.webp",
  "pork/pork-shank-cross-cut": "/cut-icons/pork/pork-shank-cross-cut.webp",
  "pork/pork-shoulder-steak": "/cut-icons/pork/pork-shoulder-steak.webp",
  "pork/pork-tenderloin": "/cut-icons/pork/pork-tenderloin.webp",
  "vegetables/asparagus": "/cut-icons/vegetables/asparagus.webp",
  "vegetables/corn-cob": "/cut-icons/vegetables/corn-cob.webp",
  "vegetables/eggplant": "/cut-icons/vegetables/eggplant.webp",
  "vegetables/green-bell-pepper": "/cut-icons/vegetables/green-bell-pepper.webp",
  "vegetables/mushrooms": "/cut-icons/vegetables/mushrooms.webp",
  "vegetables/potato": "/cut-icons/vegetables/potato.webp",
  "vegetables/red-bell-pepper": "/cut-icons/vegetables/red-bell-pepper.webp",
  "vegetables/red-onion": "/cut-icons/vegetables/red-onion.webp",
  "vegetables/tomato": "/cut-icons/vegetables/tomato.webp",
  "vegetables/zucchini": "/cut-icons/vegetables/zucchini.webp"
} as const satisfies Record<string, string>;

export type CutIconKey = keyof typeof cutIconMap;

export const CUT_ICON_PUBLIC_ROOT = "/cut-icons";

export function getCutIconPath(key?: string): string | undefined {
  if (!key) {
    return undefined;
  }

  return cutIconMap[key as CutIconKey];
}
