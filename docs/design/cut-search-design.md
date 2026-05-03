# Cut Search Design

Branch: `feature/post-merge-catalog-search-prep`  
Status: Planning only — no code changes  
Date: 2026-05-03

---

## Goal

Give users who already know a cut name a fast way to find it inside the expanded catalog,
without disrupting the guided-first selection flow that most users follow.

Search is a secondary power tool for known-item lookup.
It appears only after the user has explicitly expanded "View all cuts."

---

## Non-goals

- Search is **not** a top-level entry point for the Cut Selection flow.
- Search does **not** replace the guided Animal → Intent → Recommendations flow.
- Search is **not** a global app search across recipes, plans, or history.
- Search does **not** require a backend index, fuzzy library, or network call.
- Search does **not** need to surface results across different animals simultaneously.
- The first version does **not** need to support ranking, scoring, or analytics.
- Cut Map mode is **not** in scope — search applies to list mode only (see Interaction section).

---

## Placement

### Rule

Search input appears **only inside the expanded catalog**, immediately below the
"View all cuts / Hide all cuts" toggle button and above the `CutViewToggle` (list / map).

```
[ Animal chips                              ]
[ Intent chips                             ]
[ Quick Picks                              ]
[ ─────────────── ]
[ View all cuts (N) ▼ ]    ← toggle button
  ↓ when expanded:
[ 🔍 Search cuts...                        ]  ← NEW: search input
[ List | Map toggle                        ]
[ Cut categories / CutList                 ]
```

### Why this position

- It is visually inside the "all cuts" context — search only makes sense when the full
  catalog is visible.
- It does not compete with Intent chips, which are the primary filter above.
- It remains below the fold for users who never expand the catalog, so it never slows
  down the default guided flow.
- Collapsing the catalog removes the search input from the DOM entirely, resetting state
  automatically.

### Desktop

On desktop (≥768px), the search input renders in the same position within the left-panel
catalog area. The aside panel that shows the "visibleProfiles" count is not affected by
search state.

---

## UX Flow

### Happy path

1. User opens Cut Selection (`mode=coccion`, `cookingStep=cut`).
2. User sees animal chips, intent chips, quick picks — the guided-first default.
3. User taps / clicks "View all cuts (N)".
4. Catalog expands. Search input appears immediately below the toggle.
5. User types "picaña" (or "picanha", or "rump cap").
6. As they type (debounced 150ms), the `CutList` filters to matching cuts only.
7. Non-matching categories are hidden. Empty categories do not render a heading.
8. User taps the matching cut card → `CutBottomSheet` opens normally.
9. User proceeds to cook — no change to the existing selection callback flow.

### Clearing search

- A clear (×) button appears inside the input when the query is non-empty.
- Tapping it resets the query and restores the full grouped catalog.
- Collapsing the catalog also resets the query (state lives in `CutSelectionScreen`).

### Interaction with Intent chips

- Intent chips and search are **independent filters that stack**.
- When an intent chip is active (e.g. "Quick"), the visible cuts are already narrowed
  by `filterCutsByIntent`. The search then filters within that narrowed set.
- Effective pipeline: `animalProfiles` → `filterByIntent` → `filterBySearchQuery` → `groupedProfiles`.
- No warning is shown when both are active. The combined result is immediately obvious.

### Interaction with Zone / Map filter

- Search applies only in **list view mode** (`viewMode === "list"`).
- When the user switches to **map view** (`viewMode === "map"`), the search input is
  hidden and the query is cleared.
- Rationale: map view has its own zone-based discovery flow. Mixing free-text search
  with a visual map tap is ambiguous. Keep them separate.
- When the user switches back to list view, search input re-appears with an empty query.

### No results state

- When the query produces zero matching cuts (across all categories), show a centered
  empty state block where `CutList` normally renders:

  ```
  [ 🔍 ]
  No cuts found for "bajada de lomo"
  Try a different name or clear the search
  ```

  The empty state does not suggest cuts — it is not a recommendation engine.
  It only tells the user the query returned nothing and offers a clear action.

---

## Search Matching Strategy

### Scope

Search runs **client-side only**, in memory, against the already-loaded
`GeneratedCutProfile` array (merged with `ProductCut` display data via existing
`getCutDisplayName` / `getCutAliases` selectors). No network call. No index file.

### Fields searched (in priority order)

| Priority | Field | Source | Notes |
|----------|-------|---------|-------|
| 1 | Display name in current language | `getCutDisplayName(profile, lang)` | Resolves overrides → `ProductCut.names[lang]` → `canonicalNameEn` |
| 2 | `canonicalNameEn` | `GeneratedCutProfile.canonicalNameEn` | Always English |
| 3 | Aliases | `getCutAliases(profile)` → `string[]` | Merges overrides → `ProductCut.aliases` → `aliasesEn` |
| 4 | All localized names (non-current langs) | `ProductCut.names` for `es / en / fi` | Catches cross-language lookup (user types ES name while app is in EN) |
| 5 | Category label in current language | `categoryLabelsByLang[lang][category]` | e.g. searching "lomo" finds all loin-category cuts |
| 6 | Animal label | `getAnimalLabel(animalId, lang)` | Low priority — animal chips are the primary animal filter |

### Matching algorithm

- **Normalization:** lowercase + remove diacritics (`normalize("NFD").replace(/\p{Mn}/gu, "")`)
  on both query and all target strings before comparison.
- **Matching type:** substring match (not full-word, not prefix-only).
  - "rib" matches "ribeye", "prime rib", "short ribs".
  - "lomo" matches "lomo vetado", "lomito".
- **No fuzzy matching** in v1. Substring is sufficient for the cut catalog scale
  (≤200 cuts per animal). Fuzzy matching adds complexity and false positives.
- **Multi-token:** split query by whitespace; a cut matches only if **all tokens** match
  any of its searchable strings (AND logic). Single-token queries use the above directly.
  - "lomo fino" → tokens ["lomo", "fino"] → must match both somewhere across all fields.

### Alias coverage — restaurant and butcher names

The current `aliasesEn` array in `GeneratedCutProfile` and `aliases` in `ProductCut`
are the primary vehicle for restaurant and butcher names.

Examples of aliases that should already be present (or need adding via catalog):
- `ribeye` aliases: "entrecote", "ojo de bife", "chuletón"
- `picanha` aliases: "picaña", "rump cap", "rump cover", "coulotte"
- `brisket` aliases: "pecho", "falda delantera"

**Data gap risk:** aliases in the current data are English-biased (`aliasesEn`).
Spanish and Finnish butcher names may not yet be in the catalog. This is a **catalog
quality task**, separate from the search implementation. The design doc for catalog
enrichment is `docs/audits/cut-catalog-quality-audit.md`.

### Anatomical area

The current data model does not have a dedicated `anatomicalArea` field.
`GeneratedCutProfile.category` is the closest equivalent (e.g., `loin`, `rib`, `chuck`).
The search covers category labels in the current language, which covers most anatomical
lookup patterns (user searching "costilla" will match rib-category cuts).

A future `anatomicalAreaEs/En/Fi` field on `GeneratedCutProfile` could improve this,
but is not required for v1.

---

## i18n Copy

All new strings follow the existing pattern: inline language dictionaries in
`cutSelectionTypes.ts` or `cutProfileSelectors.ts`, with `es | en | fi` keys.

### Search input placeholder

| Lang | Copy |
|------|------|
| `es` | `Buscar corte...` |
| `en` | `Search cuts...` |
| `fi` | `Hae leikkaus...` |

### Clear button aria-label

| Lang | Copy |
|------|------|
| `es` | `Limpiar búsqueda` |
| `en` | `Clear search` |
| `fi` | `Tyhjennä haku` |

### Empty state — heading

| Lang | Copy |
|------|------|
| `es` | `Sin resultados para "{query}"` |
| `en` | `No cuts found for "{query}"` |
| `fi` | `Ei tuloksia haulle "{query}"` |

### Empty state — subtext

| Lang | Copy |
|------|------|
| `es` | `Intenta otro nombre o limpia la búsqueda` |
| `en` | `Try a different name or clear the search` |
| `fi` | `Kokeile eri nimeä tai tyhjennä haku` |

### Search input aria-label (screen readers)

| Lang | Copy |
|------|------|
| `es` | `Buscar entre todos los cortes` |
| `en` | `Search all cuts` |
| `fi` | `Hae kaikista leikkauksista` |

---

## Data Requirements

### No new data fields required for v1

The search implementation can run entirely on existing fields:

- `getCutDisplayName(profile, lang)` — already exists in `cutProfileSelectors.ts`
- `getCutAliases(profile)` — already exists in `cutProfileSelectors.ts`
- `ProductCut.names` — already in `cookingCatalog.ts`
- `categoryLabelsByLang` — already in `cutSelectionTypes.ts`

### Catalog quality improvement (separate task, not blocking v1)

To improve search recall for Spanish and Finnish common names, the following catalog
enrichment should happen as a follow-up, not as a blocker for the search feature:

1. Audit `aliasesEn` for entries that contain non-English butcher/market names.
2. If a multi-language alias array (`aliases: Partial<Record<Language, string[]>>`)
   is needed in `ProductCut`, design it as a separate catalog migration task.
3. Until then, Spanish/Finnish aliases can be added directly to
   `localizedCutContentOverrides` in `cutProfileSelectors.ts`.

---

## Component Impact

### New component

**`CutSearchInput`** — `components/cuts/CutSearchInput.tsx`

Responsibilities:
- Controlled input (`value`, `onChange`, `onClear` props).
- Renders search icon, text input, optional clear button.
- No logic — presentational only.
- Accepts `placeholder`, `aria-label` as props (passed from parent with correct lang).

### Modified component

**`CutSelectionScreen`** — `components/cuts/CutSelectionScreen.tsx`

Changes:
- Add `searchQuery: string` state (default `""`).
- Clear `searchQuery` when `catalogExpanded` transitions to `false`.
- Clear `searchQuery` when `viewMode` switches to `"map"`.
- Add `filterCutsBySearchQuery(profiles, query, lang)` selector call between
  intent filter and `groupedProfiles` construction.
- Mount `<CutSearchInput>` when `catalogExpanded && viewMode === "list"`.
- Mount `<CutEmptySearchState>` (or inline) when catalog filtered result is empty.

### New utility function

**`filterCutsBySearchQuery`** — added to `cutProfileSelectors.ts`

Signature:

```typescript
export function filterCutsBySearchQuery(
  profiles: GeneratedCutProfile[],
  query: string,
  lang: Lang
): GeneratedCutProfile[]
```

Internal behavior:
1. If `query.trim() === ""`, return `profiles` unchanged.
2. Normalize query: lowercase + strip diacritics. Split by whitespace → tokens.
3. For each profile, build a searchable string array using existing selectors.
4. Return profiles where **every token** matches at least one string in the array.

### No changes required

- `CutList` — receives filtered `groupedProfiles` already; no change.
- `QuickPicks` — not affected by catalog search.
- `IntentSelector` — not affected; search stacks on top of intent filter.
- `CutBottomSheet` / `CutCard` — no change.
- `app/page.tsx` — no change; search state lives entirely in `CutSelectionScreen`.
- Engine, `cookingRules`, result flow — no change.

---

## Mobile Behavior

- `CutSearchInput` is full-width, height ≥ 44px tap target.
- On focus, the mobile keyboard opens. The input scrolls into view (browser default
  `scrollIntoView` behavior is sufficient — no custom scroll logic needed).
- The clear (×) button is inside the input on the right, ≥ 44×44px tap area.
- No autocomplete dropdown — results update inline in `CutList` below.
- On mobile, the `CutViewToggle` (List | Map) remains above the search input so the
  user can always switch modes without scrolling past results.

Wait — reconsider position:

```
[ 🔍 Search cuts...           × ]   ← search input
[ List | Map                    ]   ← view toggle
```

vs.

```
[ List | Map                    ]   ← view toggle
[ 🔍 Search cuts...           × ]   ← search input
```

**Decision: Search input above view toggle.** Rationale: search is only visible in
list mode anyway (hidden when map is active), so placing it above the toggle keeps it
contextually tied to the list. When the user switches to map, the input disappears and
the toggle moves up naturally.

- Debounce: 150ms on `onChange`. Avoids re-filtering on every keystroke, especially
  important on low-end mobile where the filter runs synchronously on the main thread.

---

## Desktop Behavior

- Same position and logic as mobile.
- On desktop (≥768px), the search input spans the catalog column width.
- The aside panel (right side, showing `visibleProfiles` count and intent filter summary)
  is **not** updated to reflect search results — it reflects the intent-filtered count
  only, as today. No change to the aside.
- Keyboard shortcut: no dedicated shortcut in v1. The input is reachable via Tab.
- The input is not auto-focused on catalog expansion — this would be disruptive on
  desktop where the user may have just clicked the toggle.

---

## Performance Considerations

### Scale

- The `generatedCutProfiles` array is already in memory when `CutSelectionScreen`
  mounts. Per-animal slices are typically 20–60 profiles (beef ~50, pork ~20, etc.).
- Substring match across 6 fields × 60 profiles = ~360 string operations per keystroke.
  At 150ms debounce this is negligible — no memoization or worker needed.

### No external library needed

- Fuse.js, Flexsearch, MiniSearch, Lunr — all overkill for ≤200 items.
- They add bundle weight and introduce fuzzy-match false positives that degrade trust
  in a cooking context (a user searching "entraña" should not see "ternera").
- Decision: plain substring match as described. Reassess only if catalog grows to
  1000+ items, which is not planned.

### Memoization

- `filterCutsBySearchQuery` should be wrapped in `useMemo` inside `CutSelectionScreen`,
  keyed on `[animalProfiles, selectedIntent, searchQuery, lang]`.
- This avoids redundant re-computation when unrelated state changes (e.g., bottom sheet
  open/close) trigger re-renders of `CutSelectionScreen`.

### Bundle impact

- `CutSearchInput` is a small presentational component.
- `filterCutsBySearchQuery` adds ~20 lines to `cutProfileSelectors.ts`.
- No new dependency in `package.json`.
- No impact on bundle size beyond the component code itself.

---

## Implementation Plan

This feature should be implemented in a single focused branch.
Suggested branch name: `feature/cut-catalog-search`

### Step 1 — Add strings

Add the i18n strings from the "i18n Copy" section above to the existing inline
dictionaries in `cutSelectionTypes.ts` (follow the existing pattern for `getViewAllLabel`,
`getHideAllLabel`, etc.).

### Step 2 — Add `filterCutsBySearchQuery` to `cutProfileSelectors.ts`

Pure function, no side effects. Write the function and verify with a quick unit check
(or add to the existing QA script if one exists for selectors).

Fields to build the searchable string array per profile:
```typescript
const fields = [
  getCutDisplayName(profile, lang),          // priority 1
  profile.canonicalNameEn,                   // priority 2
  ...getCutAliases(profile),                 // priority 3
  ...Object.values(resolveProductCut(profile.id)?.names ?? {}), // priority 4
  categoryLabelsByLang[lang][profile.category] ?? profile.category, // priority 5
  getAnimalLabel(profile.animalId, lang),    // priority 6
]
```

### Step 3 — Build `CutSearchInput` component

Presentational only. Props:
```typescript
interface CutSearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder: string
  ariaLabel: string
}
```

Styling follows existing design tokens and input patterns in the app. Dark background,
premium feel. No border-radius surprises — match the existing card / input language.

### Step 4 — Integrate into `CutSelectionScreen`

1. Add `searchQuery` state.
2. Add effects to clear on catalog collapse and on map mode switch.
3. Wire `filterCutsBySearchQuery` into the profile pipeline (after intent filter,
   before `groupedProfiles` / `CutList`).
4. Mount `<CutSearchInput>` when `catalogExpanded && viewMode === "list"`.
5. Show empty state when filtered result is empty.

### Step 5 — QA

Run through the QA checklist below. Fix any regressions before merging.

### Step 6 — Lint + build check

```bash
npm run lint
npm run build
```

No new lint errors should be introduced. Check that `filterCutsBySearchQuery`
does not cause type errors with existing selectors.

---

## QA Checklist

### Placement and visibility

- [ ] Search input does **not** appear on the Cut Selection default screen (catalog collapsed).
- [ ] Search input **does** appear immediately after tapping "View all cuts".
- [ ] Search input disappears when the user taps "Hide all cuts".
- [ ] Search input disappears when the user switches to map view.
- [ ] Search input reappears (empty) when switching back to list view.

### Language

- [ ] Placeholder reads correctly in ES, EN, and FI.
- [ ] Empty state heading correctly interpolates the query string in all three languages.
- [ ] Clear button aria-label is correct in all three languages.

### Matching — positive cases

- [ ] Typing "ribeye" returns the ribeye profile.
- [ ] Typing "ojo de bife" returns the ribeye profile (alias match).
- [ ] Typing "lomo" returns all loin-category cuts.
- [ ] Typing "rump" returns picanha / rump cap (alias match).
- [ ] Typing "RIB" (uppercase) returns rib-related cuts (case-insensitive).
- [ ] Typing "picanã" (diacritic variant) returns picanha (diacritic-insensitive).
- [ ] Multi-token: typing "lomo fino" returns only loin cuts that also match "fino".

### Matching — negative cases

- [ ] Typing a random string ("zzzzz") shows the empty state, not a broken UI.
- [ ] Empty state shows the query string correctly, not `[object Object]` or blank.

### Interaction with intent chips

- [ ] With "Quick" intent active, search further narrows the quick-filtered cuts.
- [ ] Clearing the intent chip while search is active shows the full search results.
- [ ] Both can be active simultaneously without visual conflict.

### Interaction with zone filter (CutMap)

- [ ] Switching to map view while search is active hides the input and clears the query.
- [ ] Switching back to list view starts with an empty search, full catalog.

### State reset

- [ ] Changing the animal clears the search query (catalog collapses, which clears state).
- [ ] Collapsing and re-expanding the catalog resets the search to empty.

### Mobile

- [ ] Search input is ≥ 44px tall.
- [ ] Clear (×) button has ≥ 44×44px tap area.
- [ ] Keyboard opens on focus without breaking the layout.
- [ ] Results update while typing (debounced, no perceptible lag on mid-range device).

### Desktop

- [ ] Search input spans the catalog column width.
- [ ] Tab navigation reaches the search input.
- [ ] No auto-focus on catalog expansion.
- [ ] Aside panel count is unaffected by search query.

### Accessibility

- [ ] Input has correct `aria-label` in current language.
- [ ] Clear button has correct `aria-label`.
- [ ] Empty state is announced by screen reader (uses semantic element, not `div` only).
- [ ] No focus trap — user can tab out of the search input.

### Performance

- [ ] Typing rapidly (all characters) does not produce visible jank on mobile Chrome.
- [ ] No console errors or warnings during search interaction.
- [ ] No re-render of `CutBottomSheet` or `QuickPicks` when search query changes.

---

## Risks

### R1 — Alias coverage gap

**Risk:** Users searching Spanish or Finnish butcher names may get zero results because
`aliasesEn` is English-biased and `ProductCut.aliases` is sparse.  
**Severity:** Medium — degrades recall, does not break the feature.  
**Mitigation:** The feature still works for English and canonical names. Alias enrichment
is a catalog quality task that can proceed in parallel or as a follow-up.  
**Owner:** Catalog / Engine Agent.

### R2 — `resolveProductCut` cost inside search loop

**Risk:** `resolveProductCut(profile.id)` does a lookup per profile per keystroke.
If the internal implementation is not O(1) (e.g., linear scan), this multiplies cost.  
**Severity:** Low at current catalog scale. Medium if catalog grows significantly.  
**Mitigation:** Verify `resolveProductCut` uses a Map or object index internally.
If it does a `.find()` scan, pre-build the lookup map once outside the filter function
and pass it in, or cache via `useMemo` on the profile array.

### R3 — "All tokens must match" is too strict

**Risk:** Searching "lomo de cerdo" (3 tokens) might return zero results if a profile
only matches "lomo" and "cerdo" separately but not a third token.  
**Severity:** Low — most queries will be 1–2 tokens for a cut name.  
**Mitigation:** The first deployed version can start with AND-logic and relax to
OR-logic for 3+ tokens if real user testing shows the strict mode causes frustration.

### R4 — Diacritic normalization edge cases (Finnish)

**Risk:** Finnish has ä, ö characters. Stripping diacritics (`ä → a`, `ö → o`) might
cause unexpected cross-matches in Finnish text.  
**Severity:** Very low at current catalog scale (few Finnish-specific names).  
**Mitigation:** For the search query input, normalize both sides identically.
Do not strip diacritics from display output — normalization is query-only.

### R5 — Component re-render scope

**Risk:** `searchQuery` state in `CutSelectionScreen` may cause unnecessary re-renders
of components that do not depend on it (e.g., `QuickPicks`, animal chips).  
**Severity:** Low — component tree is not deep.  
**Mitigation:** Use `useMemo` for filtered profiles. Keep `CutSearchInput` and
`CutList` as the only re-render targets on query change via careful prop drilling
or component splitting. Do not use a global state store for this.

---

*End of document.*
