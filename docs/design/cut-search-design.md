# Cut Search Design

Branch: `feature/post-merge-catalog-search-prep`  
Status: Product and technical design only; do not implement until Catalog Runtime Alignment is complete  
Date: 2026-05-03

---

## Goal

Design a lightweight cut search feature for the expanded "View all cuts" catalog. The feature should help users who already know a cut name, butcher name, restaurant name, or anatomical term find a cut quickly without changing the guided-first Cut Selection flow.

Search is a secondary power tool. The default path remains:

```text
Animal -> intent -> recommendations -> View all cuts
```

Search should be implemented later only after the catalog runtime can reliably expose localized display names, anatomical zone data, cleaner aliases, and separated descriptor/safety fields.

---

## Non-goals

- Search is not a top-level entry point for Cut Selection.
- Search does not appear on the default guided-first screen.
- Search does not replace animal chips, intent chips, recommendations, or "View all cuts."
- Search does not become global app search across recipes, plans, saved items, or history.
- Search does not require a backend index, server call, analytics system, or external fuzzy-search dependency in the first version.
- Search does not require full catalog translation before launch, but it does require runtime access to localized names where they already exist.
- Search must not use safety warnings, cooking caveats, or descriptor prose as searchable result descriptions.

---

## Placement

Search appears only after the user expands "View all cuts." It must not be visible above recommendations or at the top of the default Cut Selection screen.

Recommended placement:

```text
[ Animal chips                         ]
[ Intent chips                         ]
[ Recommendations / quick picks         ]
[ View all cuts (N)                    ]
  expanded:
[ Search all cuts input                ]
[ List | Map toggle                    ]
[ Filtered grouped catalog             ]
```

The input belongs visually and technically to the expanded catalog. Collapsing "View all cuts" should remove the search UI and reset the query.

On desktop, the same placement applies inside the catalog column. The detail panel remains available beside the list and should not be displaced by the search input.

---

## UX flow

When search is empty, the expanded catalog behaves exactly like today: categories render normally, current animal selection applies, intent chips remain active, and recommendations above the catalog are unchanged.

When the user types, results update inline inside the expanded catalog. The result set should be capped visually to a practical number, with a recommended first version cap of 24 visible cuts. If more than 24 cuts match, show the strongest-ranked results first and include a compact count such as "Showing 24 of 38 matches." The exact count copy can be finalized during implementation.

When the user clears search, the query returns to empty, all catalog categories for the active animal and intent state return, and scroll should remain in the expanded catalog area rather than jumping to the top of the screen.

Animal filter interaction:

- Search is scoped to the currently selected animal by default.
- Changing animal should clear search because the active catalog context changed.
- The animal chip remains the primary animal selector; search should not invite broad cross-animal lookup in v1.

Intent chip interaction:

- Intent chips and search stack as filters.
- The recommended pipeline is `animal -> intent -> search -> ranking -> grouping`.
- Clearing the active intent while search is non-empty expands the searchable set within the active animal.
- If active intent plus search yields no results, the empty state should offer both "clear search" and "reset filters."

Category behavior:

- With an empty query, categories stay expanded/collapsed according to existing catalog behavior.
- With a non-empty query, categories should filter dynamically and hide empty categories.
- If ranking returns a mixed set across categories, preserve category headings for scanability, but order matching cards within each category by rank.
- Do not auto-expand a heavy educational section. Search is for known-item lookup, not catalog browsing.

Expanded/collapsed catalog behavior:

- Search state exists only while "View all cuts" is expanded.
- Collapsing the catalog clears the query.
- Re-expanding starts with an empty input and the standard catalog.

Map mode interaction:

- Search is list-first. In v1, the search input should appear only in expanded list catalog mode.
- Switching to map mode should hide the search input and clear the query.
- The map remains an optional discovery mode based on zones, not a free-text search surface.

Recommendations interaction:

- Recommendations remain above "View all cuts" and are not re-ranked by search.
- Search results should not replace recommendation cards or imply a stronger cooking recommendation.
- Popular/recommended boost can help ranking inside search only after the user has opted into the full catalog.

Mobile bottom nav interaction:

- The input and results must not sit under the bottom navigation.
- Focus, clear button, and result taps must not be intercepted by bottom nav hit areas.
- Add enough bottom padding to the results region when the keyboard is closed and when the bottom nav is visible.

Desktop inline detail interaction:

- Selecting a search result should open or update the existing inline detail panel, matching normal catalog behavior.
- The detail panel remains usable while search is active.
- Clearing search should not close an already-open detail unless the selected cut is no longer in the current animal context.

---

## Search matching strategy

Search should run client-side against a memoized normalized index built from runtime catalog records for the active animal. Current catalog size is small enough for simple in-memory search.

Searchable fields:

- Localized cut display name for the active app language.
- English name or canonical English name.
- Aliases, including butcher and restaurant names.
- Restaurant or butcher display names when stored separately from general aliases.
- Category labels.
- Anatomical area or zone labels.
- Animal labels, as low-priority terms only.

Normalization:

- Trim whitespace.
- Lowercase.
- Normalize diacritics for matching.
- Collapse repeated spaces.
- Tokenize on whitespace and common separators.
- Keep display text unchanged; normalization is only for matching and ranking.

Matching behavior:

- Empty query returns the normal expanded catalog.
- Exact normalized full-name matches should rank highest.
- Alias exact matches should rank nearly as high as display-name exact matches.
- Starts-with matches are stronger than contains matches.
- Contains matches should work for known partial names such as `rib`, `lomo`, or `pica`.
- Multi-token queries should initially use AND logic across indexed fields, so each token must match at least one indexed term.
- Heavy fuzzy search is not needed initially. Consider fuzzy matching only if QA shows common misspellings fail frequently after aliases and localized names are aligned.

Do not index:

- Safety warnings.
- Doneness warnings.
- Long descriptors intended for result cards.
- Cooking instructions.
- Generated explanatory prose.

Those fields can create misleading search matches and bad result copy.

---

## Ranking strategy

Ranking should make known-item lookup feel predictable and deterministic. Recommended scoring order:

1. Exact localized display-name match.
2. Exact English or canonical English name match.
3. Exact alias, restaurant name, or butcher name match.
4. Localized or English name starts-with match.
5. Alias starts-with match.
6. Localized or English name contains match.
7. Alias contains match.
8. Category match.
9. Anatomical area or zone match.
10. Animal match.

Boosts:

- Apply a small popular/recommended boost within otherwise similar matches.
- Boost cuts already surfaced by the current recommendation context, but never enough to outrank an exact name or exact alias match.
- Prefer active-language matches over fallback-language matches when scores are otherwise equal.

Tie breakers:

- Active-language exactness.
- Recommended or popular flag.
- Existing catalog order.
- Stable `cutId` order as the final fallback.

The first implementation should keep scoring transparent and easy to test. Avoid opaque fuzzy scoring until the data and QA evidence justify it.

---

## i18n copy

Placeholder copy:


| Language | Placeholder                  |
| -------- | ---------------------------- |
| Spanish  | `Buscar corte por nombre...` |
| English  | `Search by cut name...`      |
| Finnish  | `Hae leikkauksen nimellä...` |


Accessible input label:


| Language | Label                           |
| -------- | ------------------------------- |
| Spanish  | `Buscar entre todos los cortes` |
| English  | `Search all cuts`               |
| Finnish  | `Hae kaikista leikkauksista`    |


Clear button:


| Language | Label              |
| -------- | ------------------ |
| Spanish  | `Limpiar búsqueda` |
| English  | `Clear search`     |
| Finnish  | `Tyhjennä haku`    |


No results heading:


| Language | Copy                                   |
| -------- | -------------------------------------- |
| Spanish  | `No encontramos cortes para "{query}"` |
| English  | `No cuts found for "{query}"`          |
| Finnish  | `Ei leikkauksia haulle "{query}"`      |


No results subtext:


| Language | Copy                                                    |
| -------- | ------------------------------------------------------- |
| Spanish  | `Prueba otro nombre, alias o zona del animal.`          |
| English  | `Try another name, alias, or animal area.`              |
| Finnish  | `Kokeile toista nimeä, aliasnimeä tai eläimen aluetta.` |


Reset filters action:


| Language | Copy                  |
| -------- | --------------------- |
| Spanish  | `Restablecer filtros` |
| English  | `Reset filters`       |
| Finnish  | `Nollaa suodattimet`  |


Clear search action:


| Language | Copy               |
| -------- | ------------------ |
| Spanish  | `Limpiar búsqueda` |
| English  | `Clear search`     |
| Finnish  | `Tyhjennä haku`    |


Final Finnish wording should be reviewed in-product with the existing language style. The key requirement is that the copy stays short enough for mobile.

---

## Data requirements

Search should wait until Catalog Runtime Alignment is complete enough to support reliable matching. Required before implementation:

- Runtime localized display names from CSV or catalog source reach the cut selection runtime.
- Runtime `zone` or `anatomicalArea` is available for each searchable cut where the source data supports it.
- Aliases are clearer and can represent butcher/restaurant names without mixing them into unrelated prose.
- Descriptor fields and safety/warning fields are separated so search does not accidentally index or display safety copy as descriptive search text.

Strongly beneficial:

- Locale-scoped aliases, such as Spanish butcher names separate from English restaurant names.
- Distinct fields for `aliases`, `restaurantNames`, and `butcherNames` if the catalog pipeline supports them.
- Localized category and zone labels.
- Stable cut IDs across generated/runtime catalog records.

Not required:

- Full translation of every catalog description.
- Backend search infrastructure.
- Fuzzy-search dependency.
- Cross-animal global catalog search.

Fallback rule:

- If localized display name is missing for the active locale, fall back to English for matching and display according to existing product fallback rules.
- Do not show mixed-language descriptor snippets in result cards just because they matched.

---

## Component impact

This section describes expected future implementation impact only. No code should be changed in this planning branch.

Expected UI component impact:

- Add a controlled `CutSearchInput` inside the expanded catalog section.
- Add a compact `CutSearchEmptyState` or equivalent inline empty state.
- Keep `CutList` mostly unchanged by passing it already-filtered grouped results.
- Keep recommendations unchanged.
- Keep map mode unchanged except for clearing/hiding search when map mode is active.

Expected state impact:

- Add local `searchQuery` state in the cut selection screen or catalog section.
- Keep search state local to the expanded catalog.
- Clear query on catalog collapse, animal change, and map-mode switch.
- Do not put query state in global app mode or cooking plan state.
- Do not persist query in saved plans.

Expected selector/index impact:

- Build a memoized normalized search index from active animal records.
- Filter and rank profiles from the current animal and intent-filtered set.
- Keep index construction separate from UI components where practical.
- Avoid indexing safety/warning copy.

Expected layout impact:

- Mobile: full-width input with 44px minimum tap targets, visible clear button, and no overlap with bottom nav.
- Desktop: inline input within the centered catalog layout, without blocking the detail panel.

---

## Implementation steps

Phase 0: Catalog Runtime Alignment

- Ensure localized CSV/catalog display names reach runtime.
- Ensure `zone` or `anatomicalArea` reaches runtime.
- Clarify aliases and, if possible, introduce locale-scoped aliases.
- Separate descriptor fields from safety/warning fields.
- Confirm search can build an index without reading generated prose or safety text.

Phase 1: Search state and normalized index

- Add local search query state scoped to the expanded catalog.
- Add normalization helpers for lowercase, diacritic-insensitive matching, whitespace cleanup, and tokenization.
- Build a memoized index for the active animal from localized name, English name, aliases, butcher/restaurant names, category, zone, and animal.
- Keep the index small, deterministic, and client-side.

Phase 2: Search input inside expanded catalog

- Render input only when "View all cuts" is expanded and list catalog mode is active.
- Do not auto-focus on expansion.
- Add clear button when query is non-empty.
- Keep the input visually subordinate to the guided-first controls.

Phase 3: Search result filtering and ranking

- Apply search after animal and intent filters.
- Rank exact name and alias matches above starts-with and contains matches.
- Apply category, zone, and animal matches as lower-priority matches.
- Add small popular/recommended boost without overriding exact known-item matches.
- Hide empty categories while search is active.
- Cap visible results to a practical number if the matched set is large.

Phase 4: i18n copy

- Add ES/EN/FI placeholder, label, clear, empty-state, and reset-filter copy.
- Verify mobile line lengths.
- Confirm Finnish wording against existing app tone.

Phase 5: QA

- Run focused mobile, desktop, language, filter, navigation, and accessibility QA from the checklist below.
- Verify search never appears in the default guided-first screen.
- Verify no product code paths index safety or warning copy.

---

## QA checklist

Placement and flow:

- Search is absent on the default guided-first Cut Selection screen.
- Search appears only after "View all cuts" is expanded.
- Search disappears and clears when "View all cuts" is collapsed.
- Recommendations remain visible above the expanded catalog and are not replaced by search.
- Search remains a secondary control visually.

Viewport coverage:

- Mobile 360px wide.
- Mobile 375px wide.
- Mobile 390px wide.
- Desktop 1280px wide.
- No horizontal overflow in any target viewport.

Languages:

- Placeholder copy works in ES.
- Placeholder copy works in EN.
- Placeholder copy works in FI.
- Empty state copy works in ES.
- Empty state copy works in EN.
- Empty state copy works in FI.
- Locale fallback does not produce confusing mixed-language result snippets.

Animal filters:

- Search is scoped to the selected animal.
- Changing animal clears search.
- Animal chip interaction remains usable while catalog is expanded.
- Animal labels are low-priority matches only.

Intent filters:

- Search stacks after active intent filtering.
- Clearing intent while search is active expands matching results.
- Reset filters action clears active intent filters where applicable.
- Empty state is clear when query plus intent has zero results.

Search actions:

- Empty search shows normal grouped catalog.
- Typing filters results inline.
- Clearing search restores the normal expanded catalog.
- Exact localized names rank first.
- English names match when active locale is ES or FI.
- Aliases match.
- Butcher/restaurant names match when available.
- Category matches appear below stronger name and alias matches.
- Zone/anatomical area matches appear below stronger name and alias matches.

Empty state:

- No-results heading includes the query.
- Empty state suggests trying another name, alias, or animal area.
- Clear search action works.
- Reset filters action works when filters are active.
- Empty state does not present generated recommendations.

Catalog and map:

- Empty categories are hidden while search is active.
- Category headings remain useful for matching results.
- Switching to map mode hides search and clears query.
- Switching back to list mode starts with empty search.
- Map mode does not become dependent on search.

Mobile behavior:

- Keyboard opens on focus without major layout jump.
- Input remains visible enough while typing.
- Scroll position stays in the expanded catalog area when clearing search.
- Clear button is visible and has at least 44px tap target.
- Result cards remain tappable above bottom nav.
- Bottom nav does not intercept search input, clear button, or result taps.
- No overlay or autocomplete panel blocks catalog results.

Desktop behavior:

- Search is inline with the catalog layout.
- Catalog remains centered and readable.
- Detail panel remains usable while search is active.
- Opening detail from a search result works.
- Clearing search does not break the selected detail panel.

Navigation:

- Back behavior remains consistent with current Cut Selection flow.
- Back does not unexpectedly re-open search.
- Back from a detail/bottom sheet returns to the search results when that is current behavior.
- Search query is not persisted into unrelated app modes.

Performance:

- Index is memoized.
- Normalized tokens are reused instead of rebuilt unnecessarily.
- Typing does not produce visible jank on mobile.
- No heavy fuzzy-search library is included.
- No network request is made for search.

Data safety:

- Search index includes localized names where available.
- Search index includes English names.
- Search index includes aliases.
- Search index includes butcher/restaurant names when available.
- Search index includes category and zone/anatomical area labels.
- Search index excludes safety warnings.
- Search index excludes long cooking descriptors.

---

## Risks

Search becoming the primary flow:

- Risk: placing search too high would undermine guided-first decision support.
- Mitigation: render only inside expanded "View all cuts"; no default-screen search; no auto-focus on screen load.

Bad data producing bad results:

- Risk: missing localized names, unclear aliases, or absent zones reduce trust.
- Mitigation: block implementation until Catalog Runtime Alignment provides names, zones, and cleaner alias fields.

Safety or warning copy leaking into search:

- Risk: indexing warnings or descriptors could create alarming or irrelevant matches.
- Mitigation: explicitly index only name, alias, category, zone, and animal fields; keep safety fields out.

Locale fallback confusion:

- Risk: ES/FI users may see English names or aliases without understanding why.
- Mitigation: prefer active-locale display names, use English as fallback only, and avoid mixed-language snippets.

Keyboard and bottom nav issues:

- Risk: mobile keyboard or bottom nav can hide input, clear button, or result cards.
- Mitigation: verify 360/375/390 widths, maintain bottom padding, and avoid overlay-based result panels.

Overly fuzzy matching:

- Risk: fuzzy search can return surprising cuts in a cooking context.
- Mitigation: start with deterministic normalized matching and transparent ranking; add fuzzy only after QA evidence.

Result overload:

- Risk: broad category or animal matches could return too many cuts.
- Mitigation: rank exact and name-based matches first, cap visible results when needed, and keep category/zone matches lower priority.

Map/search ambiguity:

- Risk: combining map zone selection and text search can create unclear filter state.
- Mitigation: keep search list-only in v1 and clear query when switching to map mode.

---

*End of document.*