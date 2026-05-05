# Cut Catalog v2 Runtime Adapter QA

## What The Adapter Reads

`lib/cutCatalogV2Adapter.ts` exposes a small typed runtime representation of selected Cut Catalog v2 fields. It reads the fields currently needed by engine helpers:

- Cut row identity: `cut_id`, `variant_id`, `animal`, `category`
- Profile links: `cooking_profile`, `prep_profile`
- Temperature behavior: `temperature_mode`, `allowed_doneness`, `default_doneness`, `hide_doneness_selector`
- Timing: setup, active cook, rest, cut-plan, and session-total minute ranges
- Prep guidance: salt strategy, timing, amount, surface, and prep warning codes
- Fat-cap metadata: `has_fat_cap`, `fat_cap_behavior`, `flare_up_risk`, `requires_move_on_flareup`, `warning_codes`

The adapter intentionally uses static typed data instead of importing CSV files at runtime. These helpers are used by app code, so filesystem reads or raw CSV imports would be fragile in Next.js runtime and client/server boundaries.

## Helpers Now Preferring V2

`lib/temperatureModeProfiles.ts` now prefers Catalog v2 for:

- `getTemperatureModeForCut`
- `getAllowedDonenessForCut`
- `getDefaultDonenessForCut`

`lib/cooking/fatCapProfiles.ts` now prefers Catalog v2 for:

- `getFatCapProfileForCut`
- `hasFatCapForCut`
- `getFatCapBehaviorForCut`
- `getFlareUpRiskForCut`
- `requiresMoveOnFlareupForCut`
- `getFatCapWarningCodesForCut`

## Fallback Order

Temperature mode resolution:

1. Catalog v2 row field, when available
2. Existing Phase 1 adapter mapping
3. Legacy animal/category/style fallback

Fat-cap resolution:

1. Catalog v2 fat-cap fields, when available and mappable to the runtime behavior contract
2. Existing Phase 1 fat-cap mapping
3. Safe default: no fat cap and low flare-up risk

## What Is Still Manual

The adapter is a bridge, not the source-of-truth generator. These pieces are still manual:

- The static runtime subset in `lib/cutCatalogV2Adapter.ts`
- Behavior normalization from v2 `fat_cap_behavior` strings into existing engine behavior IDs
- Alias coverage for legacy IDs such as `entrecote`, `maminha`, `pechuga`, `esparragos`, and `bone_in_chuleton`
- Legacy generated cut profiles in `lib/generated/cutProfiles.ts`
- Phase 1 mappings in `lib/temperatureModeProfiles.ts` and `lib/cooking/fatCapProfiles.ts`

## Why This Is Not A Full Engine Migration

This change does not replace the cooking engine, legacy catalog, generated cut profiles, or deterministic fallback rules. It only lets existing helpers prefer v2 metadata when the adapter has a safe typed row. Existing behavior remains protected by the Phase 1 maps and legacy fallback logic.

No UI, navigation, Supabase, dependency, or Parrillada Engine behavior is changed.

## Next Recommended Migrations

- Generate `lib/cutCatalogV2Adapter.ts` from the CSV validation pipeline to remove manual runtime duplication.
- Move warning code normalization into a shared typed warning registry.
- Move phase metadata and prep guidance consumers to Catalog v2 after the temperature and fat-cap bridge is stable.
- Expand runtime rows to cover every v2 cut and variant before retiring Phase 1 mappings.
- Add snapshot checks for Catalog v2 timing ranges once helpers consume `getTimeRangesFromCatalogV2`.
