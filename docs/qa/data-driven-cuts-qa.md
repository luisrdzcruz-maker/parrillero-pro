# QA Report — Data-Driven Cuts

**Branch:** `feature/product-core-data-driven-cuts`  
**Date:** 2026-05-01  
**Agent:** QA_AGENT  
**Source CSV:** `data/cuts/parrillero_pro_input_profiles_en.csv` (66 profiles)  
**Generated output:** `lib/generated/cutProfiles.ts`

---

## Pipeline run results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run validate:cuts` | ✅ PASSED | 66 profiles — zero validation errors |
| `npm run generate:cuts` | ✅ PASSED | `lib/generated/cutProfiles.ts` written cleanly |
| `npm run lint` | ❌ FAILED | 3 unused-variable warnings; `--max-warnings=0` treats them as errors |
| `npm run build` | ✅ PASSED | Next.js build clean; all routes compiled |

---

## Lint failures (must fix before merge)

| File | Line | Error |
|------|------|-------|
| `app/admin/qa/page.tsx` | 12:8 | `'AdminQaCase' is defined but never used` |
| `scripts/cuts-data.mjs` | 272:10 | `'expectBoolean' is defined but never used` |
| `scripts/generate-cuts.mjs` | 87:26 | `'sourceLine' is defined but never used` |

**Fix:** Remove the three unused symbols. `expectBoolean` was scaffolded in `cuts-data.mjs` but never wired to any `validateRecord` call. `sourceLine` is stripped by `stripSourceLines()` before writing but the destructured variable is declared in the function signature. `AdminQaCase` is imported but not rendered in the admin QA page.

---

## Data integrity checks

### Passed

| Check | Result |
|-------|--------|
| No duplicate `cut_id` values across 66 profiles | ✅ NONE found |
| All `animal` values in allowed set (`beef`/`pork`/`chicken`/`fish`/`vegetables`) | ✅ All valid |
| All `difficulty` values between 1 and 5 | ✅ All valid (range: 1–5) |
| Chicken cuts never expose `rare` or `medium_rare` doneness | ✅ All chicken → `["safe"]` or `["safe", "well_done"]` |
| Pork cuts never expose `rare` or `medium_rare` doneness | ✅ All pork → `juicy_safe`/`medium_safe`/`well_done` combinations |
| Vegetable cuts produce zero allowed doneness values | ✅ All 9 vegetables → `[]` |
| All vegetable cuts define `estimated_total_time_min` | ✅ All 9 present |
| Fish cuts all carry safety notes (via `notesEn`) | ✅ All 11 fish cuts have safety note text |
| `showThickness` is `false` for ground/whole/wing/vegetable categories | ✅ Correct |
| `defaultMethod` resolves to a supported `COOKING_METHODS` value for all profiles | ✅ All valid |

### Failed / concerns

#### F1 — Tuna doneness includes unintended `medium`

**File:** `scripts/cuts-data.mjs` → `normalizeDoneness()`, line 362–363  
**Cut:** `tuna_steak`  
**CSV value:** `"seared rare; medium rare"`  
**Actual output:** `["rare", "medium_rare", "medium"]`  
**Expected:** `["rare", "medium_rare"]`

**Root cause:** `text.includes("medium rare")` pushes `medium_rare`, then `text.includes("medium")` also matches because `"medium rare"` contains the substring `"medium"`. This causes `medium` to be appended unintentionally.

```js
// cuts-data.mjs normalizeDoneness — fish branch
if (text.includes("medium rare")) values.push("medium_rare");  // ← "medium rare" matches
if (text.includes("medium") || ...) values.push("medium");      // ← also matches substring
```

**Fix needed:** Check for `"medium rare"` before checking for bare `"medium"`, or use word-boundary matching.

---

#### F2 — `ground_beef` allows `medium` doneness (food safety risk)

**File:** `data/cuts/parrillero_pro_input_profiles_en.csv`, line 22  
**CSV value:** `recommended_doneness = "medium; well done"`  
**Actual output:** `["medium", "well_done"]`

Ground beef requires a minimum internal temperature of 71 °C (160 °F) for food safety — serving medium ground beef is a food safety hazard in most jurisdictions. The `notes` field says "Target depends on burger safety preference" which implies user choice, but the UI will present `medium` as an option without a visible warning.

**Fix needed:** Change `recommended_doneness` to `"well done"` only, and add a `safety_note`: `"Ground beef must be cooked to 71°C / 160°F. Medium carries food safety risk."`.

---

#### F3 — 9 beef cuts assigned `style="reverse"` due to method list artifact

**File:** `scripts/cuts-data.mjs` → `inferStyle()`, line 416  
**Affected cuts:** `ribeye`, `striploin`, `tenderloin`, `denver_steak`, `chuck_eye`, `top_sirloin`, `t_bone`, `porterhouse`, `tomahawk`

**Root cause:** `inferStyle` checks `methods.includes("reverse sear")` against the raw `recommended_methods` string. For these cuts, reverse sear is listed as *one optional method*, but the function assigns it as the primary style. The `inferStyle` priority order puts `reverse` above `thick` and `fast`, so any steak that lists "reverse sear" as an option — even a quick-cook ribeye — becomes `style="reverse"`.

**Impact:** The hero badge for ribeye reads "Fine control" or "Critical cut" (the `getDetailsHeroBadge` function derives the label from `showWeightPreset`/`showDoneness`, not directly from style, so the badge itself may be OK — but the `style` field is stored in the generated output and consumed by any future engine logic keyed on style).

**Fix needed:** Either make `inferStyle` prefer `fast` for steaks with short estimated times, or add an explicit `style` column to the CSV that overrides inference.

---

#### F4 — 21 cuts assigned `default` inputProfile

**Affected cuts and why:**

| Group | Cuts | Why `default` |
|-------|------|---------------|
| Fish steak/loin/tail | `salmon_steak`, `tuna_steak`, `halibut_steak`, `swordfish_steak`, `monkfish_tail`, `cod_loin` | `inferInputProfileId` only handles `fillet` and `whole` fish categories |
| Ground meats | `ground_beef`, `ground_pork`, `ground_chicken` | No ground profile defined |
| Pork BBQ | `pork_belly`, `pork_loin`, `pork_shoulder`, `pork_butt`, `pork_hock`, `baby_back_ribs`, `spare_ribs` | Only `pork-fast` maps to `pork + steak` category |
| Chicken dark meat | `chicken_thigh`, `bone_in_chicken_thigh`, `chicken_drumstick`, `chicken_leg_quarter`, `chicken_wing`, `ground_chicken` | Profile only exists for `breast` and `whole` |

**Impact:** The `default` inputProfile shows only `doneness` + `equipment` selectors. Fish steaks in particular would benefit from thickness/size controls that `fish-fillet` provides.

**Fix options:**
- Add a `pork-slow` input profile for BBQ/ribs
- Map fish steaks to `fish-fillet` in `inferInputProfileId`
- Add an explicit `input_profile_id` column to the CSV to override inference

---

#### F5 — `inferInputProfileId` operator precedence latent bug

**File:** `scripts/cuts-data.mjs`, line 380

```js
// Current (ambiguous precedence)
if (record.cut_id.includes("breast") || record.cut_id.includes("tenderloin") && record.animal === "chicken") {

// Effective evaluation (JS: && binds tighter than ||)
if (record.cut_id.includes("breast") || (record.cut_id.includes("tenderloin") && record.animal === "chicken")) {
```

Currently harmless because no non-chicken cut has `"breast"` in its `cut_id`. If a future cut like `"pork_breast"` or `"duck_breast"` is added, it would silently receive the `"chicken-breast"` inputProfile.

**Fix needed:** Add explicit parentheses and/or an `&& record.animal === "chicken"` guard on the breast check.

---

#### F6 — Engine bridge gap: 62 of 66 generated cuts not reachable via `resolveCookingProfile`

**File:** `lib/resolveCookingProfile.ts`, line 126

```ts
const legacyCut = cutId ? legacyCutsById.get(cutId) : undefined;
if (!animalId || !legacyCut || legacyCut.animalId !== animalId) return undefined;
```

`resolveCookingProfile` requires both a generated profile AND a matching entry in `productCatalog` (legacy). The legacy catalog has 22 cuts. The new CSV adds 66. The overlap is only:

| Generated `cut_id` | Legacy match |
|--------------------|-------------|
| `picanha` | `picanha` ✓ |
| `bavette` | `bavette` ✓ |
| `tomahawk` | `tomahawk` ✓ |
| `pork_chop` | `pork_chop` ✓ |

Calls like `resolveCookingProfile({ animal: "beef", cut: "ribeye", ... })` return `undefined`, so the cooking wizard engine will not generate a plan. The new cuts are only accessible via the dev `/dev/cuts` route which reads `generatedCutProfiles` directly.

**This is expected for the current branch state** — the next milestone is migrating or bridging legacy entries. However it means: **the cooking wizard cannot generate plans for 62 of the 66 new cuts until the legacy catalog is updated**.

---

#### F7 — Stale `data/cuts/cut-profiles.csv` (Track A) still present

The old 30-profile CSV at `data/cuts/cut-profiles.csv` is not referenced by any current script but sits alongside the new 66-profile file. It may confuse contributors expecting one authoritative source.

**Fix:** Either delete it or rename it to `cut-profiles.csv.bak` with a note in `README` explaining Track A/B history.

---

## Engine checks

| Check | Result |
|-------|--------|
| `resolveCookingProfile` returns `undefined` on unknown cutId | ✅ Correct — caller must handle null |
| `safeAllowedDoneness` filters chicken to `["safe"]` or `["safe", "well_done"]` only | ✅ Double safety net in both `resolveCookingProfile.ts` and `legacyCookingInputAdapter.ts` |
| `applyCookingSafetyRules` falls back correctly when requested doneness not in allowed list | ✅ Falls to `allowed[0]` for unknown requests |
| Thickness `showThickness=false` for ground/whole/wing/vegetable | ✅ `shouldShowThickness()` correctly false |
| `mergeGeneratedProfile` enriches legacy cut with generated data where IDs match | ✅ Works for the 4 overlapping cuts |
| `generatedAliasToId` map covers aliases and canonical names | ✅ Built at module init; covers all 66 profiles |
| `normalizeLegacyKey` normalizes accents, spaces, underscores | ✅ Consistent normalization |

---

## Manual check cases

| Cut | `cut_id` | `inputProfileId` | `style` | `allowedDoneness` | `defaultMethod` | `showThickness` | Notes |
|-----|----------|-----------------|---------|-------------------|-----------------|-----------------|-------|
| Ribeye | `ribeye` | `beef-steak` | `reverse` ⚠️ | `rare, medium_rare, medium` | `grill_direct` | true | Style assigned "reverse" due to F3 |
| Picanha | `picanha` | `beef-steak` | `fatcap` ✅ | `rare, medium_rare, medium` | `grill_direct` | true | Correctly gets fatcap style |
| Iberian secreto | `iberian_secreto` | `pork-fast` | `fast` ✅ | `juicy_safe, medium_safe` | `grill_direct` | true | Correct; no rare/medium_rare |
| Pork ribs | `baby_back_ribs` | `default` ⚠️ | `lowSlow` ✅ | `well_done` | `grill_indirect` | false | F4: default profile, only doneness+equipment UI |
| Chicken breast | `chicken_breast` | `chicken-breast` ✅ | `poultry` ✅ | `safe` | `grill_direct` | true | Correct safety controls |
| Whole chicken | `whole_chicken` | `poultry-whole` ✅ | `poultry` ✅ | `safe` | `grill_indirect` | false | Correct |
| Salmon fillet | `salmon_fillet` | `fish-fillet` ✅ | `fish` ✅ | `medium` | `grill_direct` | true | Correct; safety note present |
| Tuna | `tuna_steak` | `default` ⚠️ | `fish` ✅ | `rare, medium_rare, medium` ⚠️ | `grill_direct` | true | F1: extra `medium`; F4: default profile |
| Virrey (Beryx) | `kingfish_beryx` | `fish-whole` ✅ | `fish` ✅ | `medium` | `grill_indirect` | false | Correct; safety note present |
| Asparagus | `asparagus` | `vegetable-format` ✅ | `vegetable` ✅ | `[]` ✅ | `vegetables_grill` | false | Correct; estimated time 5-8 min |
| Potatoes | `potato_halves` | `vegetable-format` ✅ | `vegetable` ✅ | `[]` ✅ | `vegetables_grill` | false | Correct; estimated time 20-40 min |

---

## Risks

| ID | Severity | Risk | File |
|----|----------|------|------|
| R1 | 🔴 High | `ground_beef` allows `medium` doneness — food safety hazard | `data/cuts/parrillero_pro_input_profiles_en.csv` line 22 |
| R2 | 🔴 High | 62 of 66 cuts return `undefined` from `resolveCookingProfile` — cooking wizard cannot generate plans for any new cut | `lib/resolveCookingProfile.ts`, `lib/cookingCatalog.ts` |
| R3 | 🟠 Medium | Tuna gets unintended `medium` doneness via substring match | `scripts/cuts-data.mjs` `normalizeDoneness()` |
| R4 | 🟠 Medium | 9 beef steaks assigned `style="reverse"` when most are primarily fast-cook | `scripts/cuts-data.mjs` `inferStyle()` |
| R5 | 🟠 Medium | 21 cuts get `default` inputProfile — fish steaks, all pork BBQ, all chicken dark meat — reduced UI fidelity | `scripts/cuts-data.mjs` `inferInputProfileId()` |
| R6 | 🟡 Low | Operator precedence latent bug in `inferInputProfileId` — any future cut with "breast" in cut_id gets wrong profile | `scripts/cuts-data.mjs` line 380 |
| R7 | 🟡 Low | Stale `cut-profiles.csv` (30 entries) alongside new 66-profile CSV may mislead contributors | `data/cuts/cut-profiles.csv` |
| R8 | 🟡 Low | `expectBoolean` defined but never used — field `show_thickness` from old CSV schema was boolean-validated, but new CSV has no such field and the validator doesn't check it | `scripts/cuts-data.mjs` line 272 |
| R9 | 🟡 Low | `CutSelectionScreen` animal labels and quick-pick tags are hardcoded Spanish — no i18n | `components/cuts/CutSelectionScreen.tsx` lines 15–41 |

---

## Fixes applied during this QA run

None. This is a read-only QA pass. All issues above are documented for the development team to address before merging.

---

## Recommended fix order

| Priority | Fix | Effort |
|----------|-----|--------|
| **P0** | Fix lint: remove 3 unused symbols | 5 min |
| **P0** | Fix `ground_beef` `medium` doneness + add safety note | 5 min (CSV edit + re-generate) |
| **P1** | Fix `normalizeDoneness` tuna substring leak (`medium` inside `medium rare`) | 10 min |
| **P1** | Plan legacy catalog bridge for new cuts (enables cooking wizard engine for 62 cuts) | Large — architecture milestone |
| **P2** | Fix `inferStyle` for steaks that list reverse sear as optional method | 15 min |
| **P2** | Map fish steak/loin/tail categories to `fish-fillet` inputProfile | 5 min |
| **P3** | Add parentheses to `inferInputProfileId` breast/tenderloin check | 2 min |
| **P3** | Delete or archive `data/cuts/cut-profiles.csv` (Track A) | 2 min |
| **P4** | Add i18n to `CutSelectionScreen` labels | Medium effort |

---

## Appendix — InputProfile distribution across 66 profiles

| Profile | Count | Primary use |
|---------|-------|-------------|
| `default` | 21 | Pork BBQ, chicken dark meat, fish steak/loin, ground meats |
| `beef-steak` | 16 | All standard beef steak cuts |
| `vegetable-format` | 9 | All vegetables |
| `pork-fast` | 7 | Iberian cuts + pork chop/tenderloin/collar/belly slices |
| `beef-large` | 4 | Tomahawk, brisket, short ribs, chuck roast |
| `fish-whole` | 4 | Sea bass, sea bream, turbot, virrey |
| `poultry-whole` | 2 | Whole chicken, spatchcock chicken |
| `chicken-breast` | 2 | Chicken breast, chicken tenderloin |
| `fish-fillet` | 1 | Salmon fillet only |
