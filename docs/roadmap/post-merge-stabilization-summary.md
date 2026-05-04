# Post-Merge Stabilization Summary

Date: 2026-05-03  
Stabilization branch merged: `feature/app-flow-bugfixes`  
Roadmap update branch: `feature/post-merge-catalog-search-prep`  
Target baseline: `main`  
Status: **MERGED - STABLE BASELINE**

This document captures the stable baseline after the app-flow stabilization phase and the roadmap that should guide the next agents. Future work should preserve the current core flow, avoid mixing unrelated concerns, and keep the approved Hybrid Premium product direction intact.

---

## Completed

### Cut Selection guided-first direction

- Cut Selection now leads with a guided-first Concept A direction instead of opening as a raw catalog dump.
- The full catalog remains accessible through the "View all cuts" / "Ver todos los cortes" path, but guided recommendations are the default decision surface.
- The screen follows Hybrid Premium rules: clean hierarchy, icons and tags first, selective thumbnails only where they improve confidence, and no decorative clutter.

### Desktop inline detail behavior

- Cut detail opens inline on desktop instead of as a modal.
- The desktop layout supports faster comparison without losing Cut Selection context.
- Wide viewport spacing and centering were improved so the app shell no longer appears left-biased or stranded in unused canvas space.

### Mobile bottom sheet behavior

- Cut detail opens as a mobile bottom sheet.
- Sheet CTA behavior was stabilized so the primary action remains reachable by thumb interaction.
- Mobile fixed sheet behavior is now treated separately from desktop inline behavior, which made the responsive model easier to reason about.

### Modal and browser history stabilization

- Detail open/close state is URL-backed through `cutId`.
- Browser Back from an open cut detail closes detail first and returns to Cut Selection.
- Browser Back from Cut Selection returns to Home.
- Filter-style state changes were moved toward replacement behavior so incidental UI state does not pollute the browser history stack.

### Bottom nav and CTA clickability fixes

- Bottom nav behavior was changed from overlay/interception behavior to safe app layout flow.
- Primary CTAs such as start cooking, cook selected cut, and generate plan are clickable on the validated mobile viewports.
- Fixed bottom overlays are no longer allowed to sit above active primary-flow CTAs.

### Mobile overflow and desktop centering fixes

- Mobile overflow was resolved across the stabilization target viewports: `360x740`, `375x812`, and `390x844`.
- Cut cards, chips, bottom sheets, and the active flow surfaces stay within viewport bounds.
- Desktop centering was improved across Cut Selection, Details, Result, and Live Cooking surfaces.

### FI/ES i18n and locale persistence

- `lang` now persists across the core flow: Home -> Cut Selection -> Details -> Result -> Live Cooking.
- ES, EN, and FI core UI chrome were improved across the primary flow.
- The final FI Details/Home CTA patch was completed. The previously observed FI Details blocker for aggressive-heat warning copy is not an open blocker.
- Internal engine keys remain canonical. UI-facing language must continue to be handled through display/i18n layers, not by mutating engine meaning.

### QA reports and merge validation

- App-flow QA reports were added through the stabilization phase.
- Final interaction, layout, navigation, and i18n rechecks established the current baseline.
- `main` passed `npm run check` after merge.
- Cooking QA passed at `1116/1116`.

---

## Current app state

The current stable core flow is:

```txt
Home -> Cut Selection (guided-first) -> Cut Detail (mobile bottom sheet / desktop inline) -> Details -> Result -> Live Cooking
```

All primary screens are reachable on mobile and desktop. The stable baseline is mobile-first, uses a premium dark UI direction, and keeps cooking logic deterministic first with AI as a fallback enhancement only when valuable.

Validated behavior:


| Area           | Current state                                                                |
| -------------- | ---------------------------------------------------------------------------- |
| Mobile layout  | No known blocking horizontal overflow on `360x740`, `375x812`, or `390x844`. |
| Desktop layout | Centered shell with inline detail behavior at desktop widths.                |
| Primary CTAs   | Clickable in the active flow; bottom nav should not intercept them.          |
| Navigation     | Back behavior closes detail before leaving Cut Selection, then returns Home. |
| Locale         | `lang` persists through core flows and survives URL-driven navigation.       |
| Engine         | Deterministic local engine remains the core planning source.                 |


Approved product direction remains Hybrid Premium:

- Base direction: Concept D.
- Use Concept A clarity and clean hierarchy.
- Use Concept B educational modules only when they improve confidence or execution.
- Keep Concept C Cut Map optional and discovery-focused, not required for core conversion.
- Every visual must help the user decide, understand, or execute.
- Preserve mobile-first layout, premium dark UI, and practical execution focus.

---

## Validation status


| Gate                        | Result                                              |
| --------------------------- | --------------------------------------------------- |
| Merge to `main`             | Complete.                                           |
| `npm run check` on `main`   | PASS.                                               |
| Cooking QA                  | PASS - `1116/1116`.                                 |
| Mobile CTA smoke            | PASS for stabilization target viewports.            |
| Desktop inline detail smoke | PASS for stabilization baseline.                    |
| Back-stack behavior         | PASS for core detail close and return-to-Home flow. |
| FI/ES/EN core locale flow   | PASS for stabilization baseline.                    |


This document does not replace post-merge QA. A dedicated post-merge QA / stability confirmation pass should still verify the merged baseline on the current deployment before new feature work begins.

---

## Known follow-ups

These items are non-blocking for the current stable baseline. They should be addressed in priority order and kept separate from unrelated feature work.

### Catalog runtime alignment

- The latest catalog audit found that the CSV already has localized display-name columns.
- The CSV also has zone and anatomical-area information.
- Generated runtime profiles are still EN-centric.
- Localized names and zone/anatomical area are not fully propagated to runtime.
- Search readiness is approximately `6.2/10`.
- Catalog Runtime Alignment must happen before implementing cut search.

### Lower-priority catalog and equipment localization polish

- Remaining FI work should be treated as catalog/equipment localization polish, not as a release-blocking Details issue.
- Example: equipment labels such as `parrilla gas` can still appear where catalog/i18n data is incomplete.
- Fix source catalog/i18n data or generators first, then regenerate runtime outputs.

### Animal filter back-stack edge case

- Some filter transitions may still deserve real-device verification to ensure they do not create unexpected extra Back stops.
- The preferred behavior is replacement for filter state, not a new browser history entry for every filter tap.
- Keep this as a navigation-only QA/fix pass if it resurfaces.

### Pre-existing lint warnings

- Some `react-hooks/exhaustive-deps` warnings predate the stabilization work.
- Treat them as maintenance work unless they are proven to affect the active flow.

---

## Engineering rules learned

### Navigation

- Avoid raw `window.history.pushState` / `window.history.replaceState` for App Router navigation unless deliberately isolated and tested.
- Use App Router APIs for logical navigation and URL state updates.
- Use replacement behavior for filters, locale switches within a page, and other state changes that should not create Back-stack stops.
- Preserve `lang` in the URL and persistent state for core flows.
- URL updates must preserve existing relevant params such as `mode`, `step`, `animal`, `cutId`, and `lang`.

### Layout and mobile behavior

- Do not use fixed overlays for bottom nav when they can intercept CTAs.
- Primary CTAs must be verified at the smallest supported mobile viewports before layout work is considered done.
- For mobile sheets, separate mobile fixed behavior from desktop inline behavior where appropriate.
- Do not solve a desktop layout issue by adding constraints that create mobile overflow.

### Engine, data, and i18n boundaries

- Keep engine/data logic separate from UI/i18n display sanitization.
- Engine keys and canonical data may remain English internally, but display strings must go through translation/display layers.
- Do not hardcode cutId-specific heuristics when a data-driven profile or config can solve the problem.
- Treat generated files as generated: modify source data or generator code first, then regenerate.
- Search should be implemented only after runtime catalog fields are aligned.

### Agent discipline

- Do not mix navigation, layout, i18n, and engine changes in the same agent.
- Keep PRs and agent passes focused enough that regressions can be attributed quickly.
- QA agents should stay read-only unless explicitly assigned a fix pass.
- Do not modify `docs/qa/post-merge-stability-qa.md` while a post-merge QA agent may be running.

---

## Recommended next phases

These phases are ordered. Do not start cut search before Catalog Runtime Alignment is complete.

### Phase 1: Post-merge QA / stability confirmation

Goal: confirm the merged `main` baseline still behaves as stabilized before any new feature work lands.

Work items:

- Verify the Home -> Cut Selection -> Details -> Result -> Live Cooking flow.
- Recheck mobile viewports `360x740`, `375x812`, `390x844`.
- Recheck desktop inline detail behavior.
- Confirm bottom nav does not intercept primary CTAs.
- Confirm `lang` persistence across ES, EN, and FI core flows.
- Run `npm run check` if the branch includes any relevant code or generated-output changes.

### Phase 2: Catalog Runtime Alignment

Goal: propagate existing catalog source data into runtime profiles so search and display can rely on aligned fields.

Work items:

- Map localized display-name columns from CSV into generated runtime profiles.
- Propagate zone and anatomical-area data into runtime catalog/profile outputs.
- Keep source CSV, generator logic, generated data, and runtime consumers clearly separated.
- Add or update QA checks that prove localized names and zone fields survive generation.
- Do not implement user-facing cut search in this phase.

### Phase 3: Cut Search inside "View all cuts"

Goal: add search only after runtime catalog fields are aligned.

Work items:

- Scope search to the full catalog area opened by "View all cuts".
- Search across aligned localized display names and relevant catalog metadata.
- Preserve guided-first Cut Selection as the default conversion path.
- Keep search optional and fast; it should help users who already know what they want.

### Phase 4: Result screen consolidation

Goal: make Result the strongest confidence-building surface before cooking.

Work items:

- Consolidate duplicated timing, temperature, doneness, rest, and setup information.
- Keep the premium summary first.
- Place setup visual guidance after the summary and before detailed execution when useful.
- Keep critical mistakes and warnings actionable and prominent.
- Remove decorative sections that do not improve decision, confidence, or execution.

### Phase 5: Live Cooking individual hardening

Goal: strengthen the single-cut execution surface after the planning flow is stable.

Work items:

- Verify timers, temperature, grill-zone state, current action, and next step behavior.
- Keep the screen compact, high contrast, and thumb-friendly.
- Avoid decorative images during active cooking.
- Preserve locale continuity from Result into Live Cooking.

### Phase 6: Home conversion polish

Goal: improve first-action conversion without adding top clutter.

Work items:

- Keep the first screen clean and action-focused.
- Avoid large decorative hero photos above the primary CTA.
- Make start-cooking the clearest first action.
- Audit Home/bottom-nav redundancy after the stabilized layout baseline.

### Phase 7: Cut Map optional discovery module later

Goal: add optional learning/discovery only after the core conversion and execution surfaces remain stable.

Work items:

- Keep Cut Map optional, never mandatory for choosing a cut.
- Use vector/zone-based anatomy and concise labels.
- Use the aligned catalog zone/anatomical fields from Catalog Runtime Alignment.
- Provide fallback list mode.

### Phase 8: Multi-Cut Engine Foundation later

Goal: prepare multi-cut planning only after single-cut flow remains stable.

Work items:

- Preserve deterministic local engine behavior.
- Avoid disrupting the single-cut flow.
- Design shared data/profile contracts before UI expansion.
- Gate the work with cooking QA and focused engine snapshots.

---

## Multi-agent strategy

### Recommended agent lanes


| Agent lane                 | Scope                                                                            | Must not touch                                             |
| -------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Post-merge QA agent        | Read-only stability confirmation and report writing.                             | Product code unless explicitly reassigned.                 |
| Catalog runtime agent      | CSV/source data mapping, generator logic, runtime profile alignment, catalog QA. | UI redesign and navigation.                                |
| Search UI agent            | Search input/results inside "View all cuts" after runtime alignment.             | Generator/runtime schema changes unless explicitly scoped. |
| Result UI agent            | Result hierarchy, card consolidation, setup visual placement.                    | Engine calculations and catalog generation.                |
| Live Cooking UI agent      | Active cooking controls, timers, compact execution UI.                           | Decorative imagery and engine rules.                       |
| Home UI agent              | Entry conversion and top-screen clarity.                                         | Cut Selection, Result, and engine logic.                   |
| Navigation agent           | URL params, Back behavior, mode transitions, locale persistence.                 | Visual redesign and engine/data changes.                   |
| i18n/catalog display agent | Locale strings, display-name mapping, equipment labels.                          | Engine heuristics and layout refactors.                    |


### Coordination rules

- Run post-merge QA / stability confirmation before feature work.
- Complete Catalog Runtime Alignment before cut search.
- Keep navigation, layout, i18n, and engine/data work in separate passes.
- Do not update generated runtime files by hand.
- Do not use cut search work to smuggle in Cut Map or multi-cut planning work.
- Keep Hybrid Premium as the product guardrail for every UI pass.

### Baselines future agents must not break

- `npm run check` must remain green before merge.
- Cooking QA must preserve the `1116/1116` pass baseline unless tests intentionally change with reviewed rationale.
- Bottom nav must not intercept primary CTAs.
- Mobile core flow must remain usable at `360x740`, `375x812`, and `390x844`.
- Browser Back must close detail before leaving Cut Selection.
- `lang` must persist through the core flow.
- Search must wait for aligned runtime catalog fields.

