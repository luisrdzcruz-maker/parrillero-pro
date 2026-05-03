# Cut Catalog Quality Audit

## Data sources inspected

- `data/cuts/parrillero_pro_input_profiles_en.csv` (66 catalog rows; beef, pork, chicken, fish, vegetables)
- `scripts/cuts-data.mjs` (CSV parsing + normalization + field mapping)
- `scripts/generate-cuts.mjs` (codegen into runtime profile module)
- `lib/generated/cutProfiles.ts` (runtime profile data used by Cut Selection)
- `lib/cookingCatalog.ts` (legacy catalog with localized names/notes/aliases for subset of cuts)
- `lib/resolveCookingProfile.ts`, `lib/legacyCookingInputAdapter.ts` (generated + legacy merge and alias matching)
- `components/cuts/cutProfileSelectors.ts` (name/description/alias/safety selectors for Cut Selection)
- `components/cuts/CutSelectionScreen.tsx`, `components/cuts/CutMap.tsx`, `components/cuts/CutCard.tsx`, `components/cuts/QuickPicks.tsx`, `components/cuts/CutBottomSheet.tsx` (selector consumers)

## Current data flow

1. CSV is parsed in `scripts/cuts-data.mjs`.
2. Generator writes `lib/generated/cutProfiles.ts`.
3. Cut Selection loads `generatedCutProfiles` by animal/category/intent.
4. UI text is assembled in `cutProfileSelectors.ts`:
   - display name: override -> resolved catalog cut names -> generated canonical English
   - description: override -> legacy `notes` -> generated EN fallbacks
   - aliases: override -> merged aliases from resolved catalog + generated `aliasesEn`
5. `resolveProductCut()` merges generated profile + legacy product catalog where IDs overlap.

Important behavior:

- Cut Selection is generated-profile-first.
- Legacy catalog still influences names/descriptions/aliases for overlapping IDs.
- `CutMap` "zone filter" currently filters by `category`, not anatomical `zone`.
- Localization is mixed between data-driven values and selector-level hardcoded overrides.

## Strengths

- Single generated runtime source exists for all five target animals and 66 cuts.
- Animal coverage in generated runtime is strong and balanced for search indexing:
  - beef 21, pork 15, chicken 10, fish 11, vegetables 9.
- CSV already contains multilingual display-name columns (`display_name_en`, `display_name_es_es`, `display_name_es_ar`, `display_name_fi`).
- Alias coverage exists for all rows (no empty alias field).
- Search-relevant structural fields already exist in CSV: `animal`, `category`, `aliases`, `zone`, `recommended_methods`, `quick_pick_tags`.
- UI chrome localization is separated and currently localized in `cutSelectionTypes.ts`.

## Problems found

- **Names source split:** cut names currently come from `resolveProductCut(profile.id)?.names[lang]` when legacy cut exists; otherwise fallback to generated `canonicalNameEn`.
- **Descriptions source split:** descriptions currently come from legacy `notes[lang]` first, then generated EN (`notesEn`, `textureResultEn`, `proTipEn`) or neutral fallback.
- **Aliases source split:** aliases come from legacy `aliases` + generated `aliasesEn`, with optional selector overrides.
- CSV localization columns are not propagated to generated runtime data:
  - `display_name_es_es`, `display_name_es_ar`, `display_name_fi` are present in CSV but not emitted into `GeneratedCutProfile`.
- CSV `zone` (anatomical area) is not mapped into `GeneratedCutProfile`, so runtime selectors/search cannot query anatomical area.
- `GeneratedCutProfile` is EN-centric for user content:
  - `canonicalNameEn`, `aliasesEn`, `notesEn`, `safetyNoteEn`, `errorEn`, `tipsEn`, etc.
- Existing CSV fields partially propagate to runtime:
  - **Propagated:** `animal`, `category`, `cut_id`, `aliases`, methods, doneness, time/temps, confidence, critical_mistake, pro_tip, texture_result, setup_visual_key.
  - **Not propagated:** `display_name_es_es`, `display_name_es_ar`, `display_name_fi`, `zone`.
- Legacy and generated data overlap inconsistently (some IDs in both, many only generated), causing mixed output quality by cut.
- Selector contains content hardcoding:
  - `localizedCutContentOverrides` (currently only `ribeye`),
  - `helpfulAliasByCutId` (small static map),
  - hardcoded safety translation map.
- Descriptor/safety/warning/critical separation is still blurry in generation:
  - `notesEn` is built from `notes + safety_note`.
  - `errorEn` is set from `safety_note || notes`.
  - `tipsEn` mixes quick-pick tags with `cutting_direction`.
  - `criticalMistakeEn` is separated but optional/inconsistent.

## Localization gaps

- Current Cut Selection localized output is partial and inconsistent by cut:
  - names can be localized if coming from `productCatalog`,
  - generated-only cuts fall back to English names for all languages.
- CSV already has ES/FI display names but runtime currently discards them.
- Spanish variants (`es_es`, `es_ar`) are not modeled as first-class runtime locales.
- FI user content is weak outside name labels:
  - no FI notes/safety/descriptor fields in generated profiles.
- Non-name localized data is mostly not data-driven:
  - safety translations are hardcoded by exact English sentence matching.

Cuts that should receive ES/FI display names from catalog data as priority (generated-only or weakly localized at runtime):

- Beef: `tri_tip`, `flat_iron`, `chuck_eye`, `top_sirloin`, `rump_steak`, `hanger_steak`, `denver_steak`.
- Pork: `iberian_pluma`, `pork_collar`, `pork_shoulder`, `pork_butt`, `baby_back_ribs`, `spare_ribs`, `pork_hock`, `pork_belly_slices`.
- Chicken: `chicken_tenderloin`, `bone_in_chicken_thigh`, `chicken_drumstick`, `chicken_leg_quarter`, `spatchcock_chicken`, `ground_chicken`.
- Fish: `salmon_fillet`, `salmon_steak`, `tuna_steak`, `sea_bass_whole`, `sea_bream_whole`, `turbot_whole`, `monkfish_tail`, `cod_loin`, `halibut_steak`, `swordfish_steak`, `kingfish_beryx`.
- Vegetables: `corn_on_cob`, `eggplant_slices`, `bell_peppers`, `potato_halves`, `onion_halves`.

Note: these IDs may already have localized text in CSV columns, but the gap is runtime propagation and source-of-truth consistency.

## Alias/search gaps

- Aliases are not locale-scoped; they are a single mixed list (`aliases` -> `aliasesEn`).
- Search-target fields requested by product decision are incomplete in runtime:
  - localized names: partial
  - English names: present
  - aliases: present but inconsistent depth
  - butcher/restaurant names: sparse/inconsistent
  - category: present
  - anatomical area (`zone`): present in CSV, missing in runtime generated profiles
- Cuts with weaker practical alias depth (good candidates for enrichment before search):
  - `bone_in_chicken_thigh` (single alias),
  - `pork_tenderloin`, `pork_loin`, `chicken_tenderloin`, `onion_halves`, `carrots`, `cod_loin` (narrow alias sets),
  - market-name-sensitive fish where region names vary: `sea_bass_whole`, `sea_bream_whole`, `monkfish_tail`, `halibut_steak`, `kingfish_beryx`.
- Some canonical/market naming mismatches can hurt recall:
  - `sea_bass_whole` vs common short query "sea bass"/"lubina",
  - `corn_on_cob` vs "corn"/"choclo",
  - Iberian cuts where users search by butcher labels or regional shorthand.

## Internal descriptor risks

- `notesEn` is built as `notes + safety_note`; this can mix operational safety messaging into general cut descriptions.
- `errorEn` is set from `safety_note || notes` at generation time, which blurs "error/warning" vs "descriptor".
- Bottom sheet description paths (`getCutDescription`, `getWhyChooseLabel`) can surface technical/internal phrasing if notes carry warning-style language.
- Safety localization uses exact-string mapping; unknown safety note strings fall back to generic localized text, creating uneven quality.
- Recommendation/intent behavior uses `tipsEn`, which also includes `cutting_direction`; this can couple UX logic to editorial text formatting.

## Recommended source-of-truth structure

- Make catalog row (CSV now, DB later) the single source of truth for cut content.
- Separate runtime domains cleanly:
  - **identity**: `cutId`, `animalId`, `category`, `zone/anatomicalArea`
  - **localized content**: `displayName`, `shortDescription`, `aliases` by locale (`en`, `es`, `fi`; optional `es_es`, `es_ar`)
  - **search metadata**: normalized search tokens by locale, butcher/restaurant synonyms, transliterations
  - **engine/profile metadata**: methods, doneness, times, temps, safety flags, confidence
  - **ui enrichments**: critical mistake, pro tip, texture result, setup visual key
- Keep warning/safety copy in dedicated safety fields, not mixed into descriptor fields.
- Keep selector logic generic (no cut-specific hardcoded maps for names/descriptions/aliases).

Catalog Runtime Alignment recommendation:

- **Align generated runtime schema first**, then implement search on top of it.
- If search is added before schema alignment, index quality will be unstable because name/alias/zone sources differ by cut.

Compatibility risks if runtime schema is changed:

- `GeneratedCutProfile` consumers currently assume EN field names (`canonicalNameEn`, `aliasesEn`, `notesEn`, etc.).
- `resolveCookingProfile` and `resolveProductCut` rely on merged legacy/generated shape; removing fields abruptly can break fallback behavior.
- Safe migration path is additive (`localizedNames`, `localizedAliases`, `zone`) plus compatibility adapters before removing EN-only fields.

## Recommended next data fields

- Localized content fields (minimum):
  - `display_name_en`, `display_name_es`, `display_name_fi` (with support for `display_name_es_es`, `display_name_es_ar`)
  - `short_description_en/es/fi`
  - `aliases_en/es/fi` (array per locale, not a single mixed string)
- Search-specific fields:
  - `search_tokens_en/es/fi`
  - `butcher_names_en/es/fi`
  - `restaurant_names_en/es/fi`
  - `anatomical_area` (from existing CSV `zone`)
  - `market_region_tags` (optional, for ES-ES vs ES-AR variant support)
- Safety/descriptor separation:
  - `safety_note_en/es/fi`
  - `critical_warning_en/es/fi`
  - `why_choose_en/es/fi`
- Mapping hygiene:
  - `canonical_cut_key` (stable machine key),
  - `legacy_aliases` (for backward compatibility only),
  - `search_priority` (optional weighting for recommendation/search ranking).

## Prioritized cleanup plan

1. **P0 - Catalog Runtime Alignment (must happen before search)**
   - propagate localized display names from CSV to generated runtime.
   - propagate anatomical `zone` to generated runtime and expose via selectors.
   - separate `descriptor`, `safety_note`, `warning`, `critical_mistake` in generation output.
2. **P0 - Selector de-hardcoding**
   - remove one-off maps (`localizedCutContentOverrides`, `helpfulAliasByCutId`) once catalog provides equivalent fields.
   - stop exact-English safety sentence matching; use structured safety fields per locale.
3. **P1 - Alias/search normalization**
   - move from mixed alias list to locale-scoped alias arrays.
   - add butcher/restaurant synonyms for low-recall cuts listed in Alias/search gaps.
4. **P1 - Legacy/generated consistency contract**
   - define per-field authority (generated catalog first, legacy fallback only).
   - add compatibility adapter during schema transition to avoid breaking current selectors/runtime merge.
5. **P2 - Editorial quality hardening**
   - normalize tone so user-facing descriptions stay neutral, while safety/warnings remain explicit in dedicated fields.
   - validate fish/chicken/pork safety wording consistency across locales.

## Search readiness score

**6.3 / 10**

Rationale:

- Strong catalog volume exists (66 cuts across all target animals) and alias/category data already provides a usable base.
- Main blockers are structural, not content-volume:
  - localized name fields not flowing into runtime,
  - anatomical area not available in generated runtime model,
  - mixed descriptor/safety semantics,
  - alias model not locale-scoped.
- Catalog Runtime Alignment should happen first; after that, search implementation risk drops substantially and readiness can move toward 8+ quickly.