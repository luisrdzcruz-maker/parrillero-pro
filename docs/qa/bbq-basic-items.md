# BBQ Basic Items QA

## Items Added

- `sausages`
- `chorizo_criollo`
- `burger_patty`
- `chicken_wings`
- `pork_belly_slices`
- `corn_on_cob`
- `potato_halves`
- `mushrooms`
- `bell_peppers`

## Profiles Used Or Added

- `sausage_direct_gentle`: used by `sausages` and `chorizo_criollo`.
- `burger_direct`: used by `burger_patty`.
- `poultry_small_safe_direct`: used by `chicken_wings`.
- `pork_fatty_direct`: used by `pork_belly_slices`.
- `vegetables_direct`: reused by `corn_on_cob`, `mushrooms`, and `bell_peppers`.
- `vegetables_roast_indirect`: reused by `potato_halves`.

## Temperature Modes

- `sausages`: `safe_temp`
- `chorizo_criollo`: `safe_temp`
- `burger_patty`: `safe_temp`
- `chicken_wings`: `safe_temp`
- `pork_belly_slices`: `safe_temp`
- `corn_on_cob`: `visual_only`
- `potato_halves`: `visual_only`
- `mushrooms`: `visual_only`
- `bell_peppers`: `visual_only`

## Prep Guidance

- `sausages`: usually already seasoned; avoid heavy extra salt.
- `chorizo_criollo`: usually already seasoned; avoid heavy extra salt.
- `burger_patty`: salt just before cooking.
- `chicken_wings`: dry brine 1-12 h when possible.
- `pork_belly_slices`: salt 30 min-4 h; use less salt if cured or already salty.
- `corn_on_cob`: salt or butter just before or after cooking.
- `potato_halves`: par-cook optional if thick; salt before or after.
- `mushrooms`: salt late or just before to avoid excess moisture.
- `bell_peppers`: salt just before or after cooking.

## Warnings

- `sausages`: split risk, flare-up risk, cook gently, move indirect on flare-ups.
- `chorizo_criollo`: split risk, high flare-up risk, cook gently, move indirect on flare-ups.
- `burger_patty`: ground meat safety, required safe final temperature, avoid pressing out juices.
- `chicken_wings`: poultry safety, raw chicken tool separation, skin/fat flare-up risk.
- `pork_belly_slices`: safe pork temperature, high flare-up risk, move indirect on flare-ups, avoid over-salting if cured.
- `corn_on_cob`: sugar/char risk, visual doneness only.
- `potato_halves`: undercooked center risk if thick, visual doneness only.
- `mushrooms`: water release risk, visual doneness only.
- `bell_peppers`: skin char risk, overcook risk, visual doneness only.

## Validation Results

- `npm run validate:cuts:v2`: passed. Catalog rows: 28. Cooking profiles: 16. Prep profiles: 10.
- `npm run lint`: passed with one existing warning in `app/page.tsx` about a missing `router` dependency in a React hook.
- `npm run build`: passed.
- `npm run qa:cooking`: passed. Total combinations: 1116. Passed: 1116. Failed: 0.
- `npm run check`: passed. It reran lint, build, cooking QA, and printed the UI checklist.
- `npm run validate:generated-cuts`: passed. Generated runtime coverage: 70 profiles.

## Remaining Risks / Next Steps

- Burger safety is conservative for ground meat. Doneness-target burgers should only be added later if meat type, grind freshness, and safety assumptions are explicit.
- Sausage and chorizo safety depends on product type and casing thickness; the current model keeps them simple with safe-temp and gentle direct cooking.
- Vegetable timing remains visual-only and approximate; Parrillada Engine should later handle overlap, side timing, and service waves.
