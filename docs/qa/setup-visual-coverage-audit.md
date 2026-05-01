# Setup Visual Coverage Audit

Date: 2026-05-01  
Agent: SETUP_VISUAL_AUDIT_AGENT (Codex 5.3)
Branch: `feature/home-conversion-and-funnel`

## Scope

Audit setup visual coverage for core cuts and cooking styles with read-only analysis of:

- Generated profile usage (`setupVisualKeyEn`) in `lib/generated/cutProfiles.ts`
- Mapping/fallback logic in `lib/setupVisualMap.ts` and `lib/setup/getSetupVisual.ts`
- Setup assets in `public/setup/*`

No UI, engine, or setup map files were modified.

## Keys Found

### A) Keys currently present in generated cut profiles

Found `16` populated `setupVisualKeyEn` values:

1. `two zone fire and cast iron grate at high heat`
2. `fully preheated direct zone plus warm resting area`
3. `hot sear zone and cooler finishing zone with probe ready`
4. `mixed setup with indirect rendering side and direct finish side`
5. `very hot direct zone and short cook only`
6. `stable two zone setup with lid for controlled indirect phase`
7. `two zone grill with direct sear and covered finish`
8. `intense direct heat surface with short rest tray`
9. `indirect setup with drip pan and stable lid temperature`
10. `medium direct zone with optional cooler finishing side`
11. `indirect roasting zone around 180 to 200C with optional crisp finish`
12. `clean oiled grate and medium direct heat`
13. `extremely hot direct zone and no indirect stage`
14. `whole fish basket or plancha over moderate heat`
15. `hot direct zone with fine grate or perforated tray`
16. `indirect preheat zone and direct browning zone`

### B) Core visual priority keys (requested)

- `direct_heat`
- `indirect_heat`
- `reverse_sear`
- `low_slow`
- `fish_grill`
- `vegetable_grill`
- `rest_phase`
- `two_zone_setup`
- `sear_then_indirect`
- `fat_cap_setup`

## Visuals Present

### Setup assets in `public/setup/*`

Assets found:

- `/setup/setup_fire_direct_heat.webp`
- `/setup/setup_fire_indirect_heat.webp`
- `/setup/setup_fire_two_zone.webp`
- `/setup/setup_gas_direct_heat.webp`
- `/setup/setup_gas_two_zone.webp`
- `/setup/setup_charcoal_two_zone.webp`
- `/setup/setup_kamado_indirect_deflector.webp`
- `/setup/setup_indoor_pan_oven.webp`
- `/setup/setup_reverse_sear.webp`
- `/setup/setup_two_zone.webp`
- `/setup/setup_two_zone_v1.webp`

### Priority key coverage status

- `direct_heat` -> covered (`/setup/setup_fire_direct_heat.webp`)
- `indirect_heat` -> covered (`/setup/setup_fire_indirect_heat.webp`)
- `reverse_sear` -> covered (`/setup/setup_reverse_sear.webp`)
- `low_slow` -> covered via normalization to `indirect_heat`

## Visuals Missing

Priority keys without a dedicated setup visual path today:

- `fish_grill`
- `vegetable_grill`
- `rest_phase`
- `two_zone_setup`
- `sear_then_indirect`
- `fat_cap_setup`

Notes:

- These keys do not resolve to explicit assets in `public/setup/*`.
- They currently rely on text detection and/or generic fallback behavior instead of dedicated visuals.

## Duplicate or Inconsistent Keys

### Duplicate key collision in setup prompt source

In `data/assets/setup-prompts.json`, both of these entries share the same map key (`grill:two_zone`):

- `setup_two_zone`
- `setup_reverse_sear`

Because map generation uses the same key, only the last one survives in `lib/setupVisualMap.ts` and `lib/generated/setupVisualMap.ts`:

- Effective map entry: `"grill:two_zone": "/setup/setup_reverse_sear.webp"`

Risk:

- `setup_two_zone` cannot be selected by key from the generated setup map.

### Key format inconsistency

- Generated cut profiles use descriptive free-text keys (sentences), not canonical setup IDs.
- Setup map keys use canonical `equipment:setup` tokens (for example `grill:two_zone`).
- Resolution currently depends on heuristic text detection, which can classify ambiguous phrases unexpectedly.

Example risk:

- `extremely hot direct zone and no indirect stage` still contains the word `indirect`, and current detection checks `indirect` before `direct`.

## Fallback Coverage

Fallback behavior is present and layered:

1. `lib/setup/getSetupVisual.ts`
   - Tries direct key lookup candidates in `setupVisualMap`
   - Falls back to `detectSetupFromText(...)` + `getSetupVisual(...)`
   - Falls back again to category defaults
   - Final fallback: `SETUP_VISUAL_FALLBACK`

2. `lib/setupVisualMap.ts`
   - `getSetupVisual(...)` tries equipment/setup candidates
   - Final fallback constant: `"/setup/setup_two_zone.webp"`

Result:

- There is robust fallback coverage for missing or unknown keys.
- Coverage quality is functional but not semantically precise for all key phrases.

## Recommended Next Image Batch

Priority batch (highest coverage impact first):

1. `fish_grill`
2. `vegetable_grill`
3. `sear_then_indirect`
4. `fat_cap_setup`
5. `rest_phase`
6. `two_zone_setup`

After adding assets, align canonical map entries so each key has deterministic key-to-image routing (without depending on text heuristics).

## Risks

- Duplicate map-key overwrite can silently point multiple intents to one visual.
- Heuristic detection may misclassify mixed phrases (`direct` + `indirect`) depending on regex order.
- Missing dedicated visuals for priority keys may reduce setup guidance clarity in core cooking flows.

