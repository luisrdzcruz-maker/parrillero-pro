# Core Cuts Audit

**Branch:** `feature/home-conversion-and-funnel`  
**Date:** 2026-05-01  
**Mode:** Read-only audit (no CSV/profile/UI/engine edits)

## Scope

Audited the requested 25 core cuts against `data/cuts/parrillero_pro_input_profiles_en.csv` for:

- `input_profile_id`
- `cooking_style`
- `fire_zone`
- `time_type`
- `default_doneness`
- `confidence_level`
- `critical_mistake`
- `cutting_direction`
- `pro_tip`
- `texture_result`
- `setup_visual_key`
- `safety_note` where needed
- estimated time consistency
- target temperature safety

## Executive Outcome

- **Exact core IDs found:** 23 / 25
- **Missing exact IDs:** `sea_bass`, `corn`
- **P0 safety issues in existing core rows:** none
- **Main quality gap:** uneven enrichment depth in 7 existing core cuts

## Complete Cuts (exact ID exists and core structure is valid)

`ribeye`, `striploin`, `tenderloin`, `picanha`, `tomahawk`, `bavette`, `short_ribs`, `brisket`, `iberian_secreto`, `pork_chop`, `baby_back_ribs`, `pork_belly`, `chicken_breast`, `chicken_thigh`, `chicken_wing`, `whole_chicken`, `salmon_fillet`, `tuna_steak`, `kingfish_beryx`, `asparagus`, `potato_halves`, `bell_peppers`, `mushrooms`

## Incomplete Cuts (exact core ID missing)

- `sea_bass` (closest existing row: `sea_bass_whole`)
- `corn` (closest existing row: `corn_on_cob`)

## Per-Cut Audit

### Beef

- **`ribeye`**: profile/style/zone/time/default/confidence all present (`beef-steak`/`fast`/`direct`/`per_cm`/`medium_rare`/`high`); enrichment fields complete; time model consistent (`3-4 min/cm` with `per_cm`); temp `52-55C` is safe for whole-muscle beef.
- **`striploin`**: all core fields present (`beef-steak`/`fast`/`direct`/`per_cm`/`medium_rare`/`medium`); enrichment fields complete; time model consistent; temp `52-55C` safe for whole-muscle beef.
- **`tenderloin`**: all core fields present (`beef-steak`/`fast`/`direct`/`per_cm`/`rare`/`medium`); enrichment fields complete; time model consistent; temp `50-54C` safe for whole-muscle beef.
- **`picanha`**: all core fields present (`beef-steak`/`fatcap`/`mixed`/`per_cm`/`medium_rare`/`high`); enrichment fields complete; time model consistent; temp `52-56C` safe for whole-muscle beef.
- **`tomahawk`**: all core fields present (`beef-steak`/`reverse`/`mixed`/`per_cm`/`medium_rare`/`medium`); enrichment fields complete; time model consistent; temp `52-55C` safe for whole-muscle beef.
- **`bavette`**: all core fields present (`beef-steak`/`fast`/`direct`/`per_cm`/`medium_rare`/`medium`); enrichment fields complete; time model consistent; temp `52-55C` safe for whole-muscle beef.
- **`short_ribs`**: core fields present (`beef-large`/`low_slow`/`indirect`/`total`/`well_done`/`medium`); missing enrichment set (`critical_mistake`, `pro_tip`, `texture_result`, `setup_visual_key`); time model consistent (`180-360 total` with `total`); temp `85-95C` safe for collagen-heavy BBQ.
- **`brisket`**: core fields present (`beef-large`/`low_slow`/`indirect`/`total`/`well_done`/`medium`); missing enrichment set (`critical_mistake`, `pro_tip`, `texture_result`, `setup_visual_key`); time model consistent (`480-720 total` with `total`); temp `90-95C` safe for low-and-slow beef.

### Pork

- **`iberian_secreto`**: all core fields present (`pork-fast`/`fast`/`direct`/`per_cm`/`medium_safe`/`medium`); enrichment fields complete; safety note present; time model consistent; temp `63-68C` safe.
- **`pork_chop`**: all core fields present (`pork-fast`/`fast`/`direct`/`per_cm`/`medium_safe`/`medium`); enrichment fields complete; safety note present; time model consistent; temp `63-68C` safe.
- **`baby_back_ribs`**: all core fields present (`pork-fast`/`low_slow`/`indirect`/`total`/`well_done`/`medium`); enrichment fields complete; safety note present; time model consistent (`120-240 total`); temp `85-95C` safe for ribs tenderness.
- **`pork_belly`**: core fields present (`pork-fast`/`low_slow`/`indirect`/`total`/`well_done`/`medium`); missing enrichment set (`critical_mistake`, `pro_tip`, `texture_result`, `setup_visual_key`); safety note present; time model consistent (`90-180 total`); temp `80-90C` safe for rendered belly.

### Chicken

- **`chicken_breast`**: all core fields present (`chicken-breast`/`poultry`/`direct`/`per_cm`/`safe`/`high`); enrichment fields complete; safety note present; time model consistent; temp `72-74C` safe.
- **`chicken_thigh`**: core fields present (`poultry-whole`/`poultry`/`mixed`/`per_cm`/`safe`/`medium`); missing enrichment set (`critical_mistake`, `pro_tip`, `texture_result`, `setup_visual_key`); safety note present; time model consistent; temp `75-80C` safe.
- **`chicken_wing`**: core fields present (`poultry-whole`/`poultry`/`mixed`/`per_cm`/`safe`/`medium`); missing enrichment set (`critical_mistake`, `pro_tip`, `texture_result`, `setup_visual_key`); `cutting_direction` is explicitly `not applicable`; safety note present; time model consistent; temp `80-85C` safe.
- **`whole_chicken`**: all core fields present (`poultry-whole`/`poultry`/`indirect`/`total`/`safe`/`medium`); enrichment fields complete; safety note present; time model consistent (`60-90 total`); temp `75-80C` safe.

### Fish

- **`salmon_fillet`**: all core fields present (`fish-fillet`/`fish`/`direct`/`per_cm`/`medium`/`high`); enrichment fields complete; safety note present (vulnerable guest caution); time model consistent; temp `50-60C` acceptable with current cautionary note.
- **`tuna_steak`**: all core fields present (`fish-fillet`/`fish`/`direct`/`per_cm`/`rare`/`medium`); enrichment fields complete; safety note present (sushi-grade warning); time model consistent; temp `45-52C` acceptable only under sushi-grade assumption already documented.
- **`sea_bass`**: exact ID missing from CSV. Closest row is `sea_bass_whole` (`fish-whole`/`fish`/`indirect`/`total`/`medium`/`medium`) with consistent time and safe temp `55-62C`.
- **`kingfish_beryx`**: all core fields present (`fish-whole`/`fish`/`mixed`/`total`/`medium`/`low`); enrichment fields complete; safety note present; time model consistent (`18-35 total`); temp `55-60C` acceptable for whole fish.

### Vegetables

- **`asparagus`**: core fields present (`vegetable-format`/`vegetable`/`direct`/`total`/confidence `medium`); `default_doneness` intentionally empty for vegetables; enrichment fields complete; time model consistent (`5-8 total`); target temp not required.
- **`potato_halves`**: core fields present (`vegetable-format`/`vegetable`/`indirect`/`total`/confidence `medium`); `default_doneness` intentionally empty; enrichment fields complete; time model consistent (`20-40 total`); target temp not required.
- **`corn`**: exact ID missing from CSV. Closest row is `corn_on_cob` (`vegetable-format`/`vegetable`/`mixed`/`total`/confidence `medium`) with consistent total time `10-18`; target temp not required.
- **`bell_peppers`**: core fields present (`vegetable-format`/`vegetable`/`direct`/`total`/confidence `medium`); missing enrichment set (`critical_mistake`, `pro_tip`, `texture_result`, `setup_visual_key`); `default_doneness` intentionally empty; time model consistent.
- **`mushrooms`**: core fields present (`vegetable-format`/`vegetable`/`direct`/`total`/confidence `medium`); missing enrichment set (`critical_mistake`, `pro_tip`, `texture_result`, `setup_visual_key`); `cutting_direction` is `not applicable`; `default_doneness` intentionally empty; time model consistent.

## P0 Safety Issues

- None found in existing exact core-cut rows.

## P1 Product Quality Gaps

- **Core ID mismatch:** `sea_bass` and `corn` are not present as exact `cut_id`s; current rows use `sea_bass_whole` and `corn_on_cob`.
- **Uneven enrichment depth:** 7 existing core cuts are missing all four enrichment fields (`critical_mistake`, `pro_tip`, `texture_result`, `setup_visual_key`): `short_ribs`, `brisket`, `pork_belly`, `chicken_thigh`, `chicken_wing`, `bell_peppers`, `mushrooms`.
- **Low confidence in core fish:** `kingfish_beryx` is marked `confidence_level=low`, which is acceptable but should be prioritized for evidence-based uplift.

## P2 Nice-to-Have Improvements

- Standardize stronger safety phrasing in fish rows with low target temperatures (`salmon_fillet`, `tuna_steak`) to reduce misuse risk by novice users.
- Add optional setup visual guidance for all core low-and-slow cuts to improve reproducibility (`short_ribs`, `brisket`, `pork_belly`).
- Align naming strategy for whole-fish and produce IDs so canonical core names and `cut_id`s do not diverge.

## Recommended Enrichment Order

1. **Fix core ID coverage first:** resolve canonical mapping for `sea_bass` and `corn`.
2. **Fill missing enrichment quartets:** `short_ribs`, `brisket`, `pork_belly`, `chicken_thigh`, `chicken_wing`, `bell_peppers`, `mushrooms`.
3. **Raise confidence on low-confidence core fish:** start with `kingfish_beryx` (data-backed refinement of tips and setup).
4. **Harden fish safety guidance copy:** especially for low-temp recommendations.
5. **Polish consistency pass:** verify naming/canonical alignment and wording parity across all core cuts.

## Validation

- `npm run validate:cuts`
- `npm run build`

Results:

- `npm run validate:cuts` -> **PASS** (`Cut profile validation passed: 66 profiles`)
- `npm run build` -> **PASS** (Next.js production build completed successfully)

No commits were created.
