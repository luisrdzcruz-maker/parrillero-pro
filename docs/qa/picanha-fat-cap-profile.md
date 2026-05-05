# Picanha Fat-Cap Profile QA

## What Changed

- Added reusable Phase 1 fat-cap metadata in `lib/cooking/fatCapProfiles.ts`.
- Whole `picanha` now resolves as a fat-cap whole-cut profile instead of inheriting the generated steak-like timing.
- Whole `picanha` prefers indirect heat first, then a brief controlled fat-cap sear.
- The plan now warns that flare-ups require moving to indirect heat immediately and that the fat cap should not sit over direct flames.
- Whole `picanha` keeps a doneness temperature target and includes rest plus slice-against-the-grain guidance.

## What Did Not Change

- No UI, navigation, Supabase, dependency, or Parrillada Engine changes were made.
- No full Cut Catalog v2 runtime migration was added.
- `picanha` remains `doneness_target`, not `texture_breakdown`.
- Thin steak-style fat-cap profiles can still use direct sear behavior when represented by `picanha_steak` or `picanha_steaks`.

## Why This Is Reusable

The engine now asks generic fat-cap profile questions:

- `hasFatCapForCut`
- `getFatCapBehaviorForCut`
- `getFlareUpRiskForCut`
- `requiresMoveOnFlareupForCut`
- `getFatCapWarningCodesForCut`

Those helpers are backed by a small mapping that can be expanded for future cuts without adding one-off picanha text in the plan generator.

## QA Coverage

`npm run qa:cooking` now includes focused picanha checks for:

- fat-cap warning metadata or warning text;
- controlled indirect-first fat-cap behavior;
- move-to-indirect-on-flare-up guidance;
- non-short whole-cut timing;
- `doneness_target` temperature mode;
- rest and slice-against-grain guidance.

## Remaining Migration Notes

Cut Catalog v2 already contains richer cooking profile fields such as `warning_codes`, `preferred_phases`, timing ranges, and fat-cap specific profile ids. A later migration can replace the Phase 1 mapping with CSV v2-driven runtime metadata once the broader v2 runtime layer is ready.
