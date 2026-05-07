# Parrillada Architecture Audit

Date: 2026-05-07  
Scope: architecture-only audit after recent Parrillada integration changes (no production code changes).

## Executive Summary

Parrillada now has a real deterministic planner path in place, with clear progression from single-cut outputs into multi-item planning and grouped execution instructions:

- `single-cut engine` output now carries `planningMetadata`.
- Catalog-backed Parrillada items are generated from real catalog cuts + single-cut plans.
- `scheduleParrillada` produces deterministic per-item phases plus warnings/conflicts.
- `executionTimelineGroups` provides a higher-level grouped execution layer for Review and Live preview.
- Hybrid UI flow (`Entry -> Setup -> Review -> Live`) is wired end-to-end to planner outputs.

Architecture direction is strong, but there is still boundary debt:

- Legacy `ParrilladaPlan` compatibility layer coexists with `PlannerResult`-first flow.
- Some legacy cards/helpers remain exported but no longer used by current production path.
- `ParrilladaSchedulerScreen` currently contains orchestration + mapping logic that can be split.
- Pro/Event behavior is intentionally partial (correct for current roadmap), but contracts are ahead of enabled UX.

Merge readiness: **conditionally ready** for architecture baseline, with recommended cleanup pass before adding more Parrillada features.

## Current Architecture Diagram

```txt
Single-Cut Engine (lib/cookingRules.ts + cookingEngine)
  -> CookingPlan + timeSemantics + prepGuidance
  -> derivePlanningMetadata() / attachPlanningMetadata()

Catalog-backed Parrillada source (lib/planning/catalogItems.ts)
  -> generateCookingPlan per candidate
  -> getPlanPlanningMetadata()
  -> singleCutPlanToPlannerInput()
  -> PlannerCutInput[]

Planner core (lib/planning/scheduler.ts)
  -> normalizePlannerInput() + profile resolution
  -> deterministic phase generation (prep/cook/rest/hold/serve + global preheat)
  -> zone conflict detection + warning builder
  -> PlannerResult

Grouped execution layer (lib/planning/parrilladaBatchTimeline.ts)
  -> behavior classification (hold/fragility/safety/finish priority)
  -> grouped execution actions
  -> burn-off safety insertion
  -> executionTimelineGroups[]

UI orchestrator (components/parrillada/ParrilladaSchedulerScreen.tsx)
  -> Entry / Setup / Review / Live screen flow
  -> PlannerResult -> ParrilladaPlan projection for review compatibility
  -> PlannerResult -> ParrilladaLivePlan for live preview
```

## Source of Truth

Primary source-of-truth chain in current implementation:

1. `generateCookingPlan()` + `derivePlanningMetadata()` from single-cut engine.
2. `planningMetadata` attached to `CookingPlan` (non-enumerable) and read via `getPlanPlanningMetadata()`.
3. Catalog-backed `PlannerCutInput` built from real cuts and single-cut plans (`catalogItems.ts` + adapter).
4. `scheduleParrillada()` as planning authority for phases, warnings, conflicts, summary.
5. `buildExecutionTimelineGroups()` as grouped execution authority for Review/Live projection.

Canonical runtime contract for Review/Live:

- `PlannerResult` is the runtime source for review and live states.
- `PlannerResult.executionTimelineGroups` is the primary execution layer for UI actions.
- `ParrilladaPlan` is a compatibility projection only (for legacy card/prop surfaces).
- Runtime projection helpers are centralized in `components/parrillada/adapters/parrilladaPlannerViewAdapter.ts`.
- Live preview must use `buildParrilladaLivePlanFromResult()` as the canonical path.

Derived layers:

- `ParrilladaPlan` objects in scheduler screen are compatibility/projection objects.
- `ParrilladaLivePlan` from `buildParrilladaLivePlanFromResult()` is preview projection (not adaptive runtime control).
- Mock plan data exists only as preview/fallback fixtures.

## Data Flow

```txt
single-cut engine
-> CookingPlan.planningMetadata
-> catalog-backed Parrillada item source
-> PlannerCutInput / PlannerRequest
-> scheduleParrillada
-> PlannerResult
-> detailed phases
-> executionTimelineGroups
-> Hybrid UI Review / Live preview
```

Details:

- `lib/cookingRules.ts` derives and attaches planning metadata while generating single-cut plans.
- `lib/planning/catalogItems.ts` converts catalog candidates into planner inputs and applies safety gates for advanced cuts.
- `lib/planning/scheduler.ts` calculates timeline phases deterministically and appends warnings/conflicts.
- `lib/planning/parrilladaBatchTimeline.ts` compacts phase-level actions into execution groups and injects food-safety group instructions.
- `components/parrillada/ParrilladaSchedulerScreen.tsx` drives step state (`entry/setup/review/live`) and consumes planner outputs.

## Module Responsibilities


| Module                                                  | Responsibility                                                                         | Inputs                                                     | Outputs                                             | Truth level                              | Path type                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------- | ------------------------------- |
| `lib/cooking/planningMetadata.ts`                       | Derive single-cut planning metadata from cut/method/time semantics/profile             | `cut`, `CookingInput`, method, optional semantics/guidance | `PlanningMetadata` (+ attach/get helpers)           | **Source** for planning metadata         | Production                      |
| `lib/planning/catalogItems.ts`                          | Build catalog-backed lite candidates; advanced safety gating; skip reporting           | Catalog candidate list + single-cut plan generator         | `PlannerCutInput[]` + skipped reasons               | **Source** for setup item pool           | Production                      |
| `lib/planning/scheduler.ts`                             | Deterministic schedule engine and planner summary                                      | `PlannerRequest`                                           | `PlannerResult` (phases/warnings/conflicts/summary) | **Core source**                          | Production                      |
| `lib/planning/parrilladaBatchTimeline.ts`               | Convert detailed phases into grouped execution actions with safety behaviors           | `PlannerResult`                                            | `ExecutionTimelineGroup[]`                          | **Derived from planner result**          | Production                      |
| `lib/planning/parrilladaLivePlan.ts`                    | Build live preview model from grouped actions/phases; legacy plan adapter also present | `PlannerResult` or legacy `ParrilladaPlan`                 | `ParrilladaLivePlan`                                | Derived                                  | Production (preview foundation) |
| `lib/planning/parrilladaWarnings.ts`                    | Legacy warning sorting/count helpers for `ParrilladaPlan`                              | `ParrilladaPlan`                                           | sorted warnings + counts                            | Derived                                  | Legacy/compat                   |
| `lib/planning/parrilladaTimeline.ts`                    | Legacy timeline sorting + critical-step extraction for `ParrilladaPlan`                | `ParrilladaPlan`                                           | sorted steps + critical step                        | Derived                                  | Legacy/compat                   |
| `lib/planning/planningProfiles.ts`                      | Planning profiles, cut overrides, mode profiles                                        | profile constants, cut ids                                 | profile lookup data                                 | **Source** for fallback profile behavior | Production                      |
| `lib/planning/parrilladaEligibility.ts`                 | UI-facing item presentation classification (category/role/visibility/hints)            | `PlannerCutInput` + metadata + overrides                   | `ParrilladaItemPresentation`                        | Derived for UI semantics                 | Production                      |
| `components/parrillada/ParrilladaSchedulerScreen.tsx`   | Flow orchestrator and planner-to-UI projection layer                                   | Planner functions + setup state + copy                     | rendered Entry/Setup/Review/Live                    | Orchestration/derived                    | Production                      |
| `components/parrillada/ParrilladaEntryScreen.tsx`       | Entry mode selection + recent plans                                                    | copy + callbacks                                           | UI events                                           | Derived                                  | Production                      |
| `components/parrillada/ParrilladaSetupScreen.tsx`       | Serve time, strategy, item selection, generate gating                                  | selected/available items + planner gating flags            | UI events                                           | Derived                                  | Production                      |
| `components/parrillada/ParrilladaReviewScreen.tsx`      | Review projection rendering (critical path, timeline, warnings, zones)                 | projected plan + planner result                            | UI rendering                                        | Derived                                  | Production                      |
| `components/parrillada/ParrilladaLiveScreen.tsx`        | Live preview command center rendering                                                  | `ParrilladaLivePlan`                                       | UI rendering                                        | Derived                                  | Production (preview)            |
| `components/parrillada/cards/*`                         | Reusable visual cards for Parrillada flow                                              | props only                                                 | UI blocks                                           | Derived                                  | Production/partly legacy        |
| `components/parrillada/icons/parrilladaIconResolver.ts` | Centralized icon path resolution from existing registries                              | mode/zone/cut/warning/action type                          | icon paths                                          | Derived                                  | Production                      |
| `components/parrillada/mock/parrilladaMockData.ts`      | Copy + sample recent plans + preview fallback plan factory                             | static constants                                           | copy/preview plan                                   | Derived                                  | Preview/fallback only           |
| `scripts/qa-parrillada-scheduler.ts`                    | Deterministic architecture QA over explicit + generated catalog scenarios              | planner/catalog functions                                  | pass/fail diagnostics and assertions                | QA truth for structural guarantees       | QA                              |


## UI Flow

Current user flow:

- **Entry:** choose Lite/Pro mode and open setup.
- **Setup:** choose serve time + strategy + catalog-backed items.
- **Review:** inspect grouped execution timeline, zone counts, warnings.
- **Live:** step through grouped live action preview (`Mark Done` progression).

Notes:

- Lite minimum is explicitly enforced at `2` items.
- Item maximum uses mode profile (`lite:4`, `pro:8`), while Pro advanced controls remain mostly placeholder/collapsed.
- Live screen explicitly labels itself as grouped planner preview foundation.

## Planner Flow

1. Build request items from setup selections (catalog-backed `PlannerCutInput`).
2. Normalize each item using planning metadata first; fallback to planning profile estimation.
3. Sort by strategy score and generate per-item phases (prep/cook/rest/hold/serve).
4. Add global preheat before first active cook.
5. Sort phases; detect zone conflicts; build warnings.
6. Build grouped execution actions and inject burn-off/safety notes.
7. Project to review and live UI models.

## Timeline Layers

Three timeline layers currently coexist:

1. **Detailed phases (source):**
  `PlannerResult.phases` from scheduler (`prep`, `preheat`, `cook`, `rest`, `hold`, `serve`, etc.).  
   This is the most granular deterministic schedule authority.
2. **Grouped execution timeline (derived, production-facing):**
  `PlannerResult.executionTimelineGroups` from `parrilladaBatchTimeline.ts`.  
   Groups nearby compatible actions and adds food safety guidance (`clean_or_burn_off_zone`, holdable/sensitive ordering).
3. **Live preview projection (derived):**
  `ParrilladaLivePlan` from `buildParrilladaLivePlanFromResult()`.  
   Converts grouped actions into current/next command cards and zone activity preview.

## Mock Data Status

Status is aligned with intended boundaries:

- `components/parrillada/mock/parrilladaMockData.ts` is mostly copy + preview fallback data.
- Scheduler screen uses catalog-backed production path (`buildCatalogBackedParrilladaLiteItems()`), not mock plan generation.
- Mock factory is documented in-file as preview-only fallback.

## QA Coverage

`npm run qa:parrillada` currently proves:

- Explicit scenarios (demo, catalog mixes, advanced long-cook, compatibility, batch).
- Deterministic generated catalog-wide scenario families.
- Lite bounds validation (`2-4` items) inside QA scenarios.
- Phase sanity: ordering, preheat before first cook, prep/cook/rest ordering, serve-time proximity.
- Grouped execution timeline assertions:
  - grouped timeline presence and sorting
  - serve group presence
  - holdable-first and sensitive-near-serve expectations where specified
  - poultry burn-off action expectation where specified
  - poultry + vegetable unsafe grouping prevention expectation where specified
- Metadata coverage assertions for catalog-backed items.
- Cut-id mismatch fallback detection.

`qa:parrillada` does **not** prove:

- perfect culinary quality for all cuts/contexts
- real grill capacity packing optimization
- adaptive live corrections
- multi-zone physical footprint optimization
- probe-driven runtime integration

## Known Risks

1. **Dual model risk (`PlannerResult` vs legacy `ParrilladaPlan`)**
  Compatibility projection is useful, but duplicate model surfaces increase drift risk.
2. **Orchestration concentration in `ParrilladaSchedulerScreen`**
  Contains flow state + mapping + planner invocation; future feature growth may over-couple UI and transformation logic.
3. **Legacy utility drift**
  `parrilladaTimeline.ts` / `parrilladaWarnings.ts` and old card components can diverge from grouped execution behavior.
4. **Pro/Event expectation gap**
  Pro is selectable, but optimizer and advanced controls are intentionally partial; must stay clearly framed as staged rollout.
5. **Heuristic layering in grouped timeline**
  Food safety and compatibility heuristics are pragmatic but still hand-authored; should remain heavily QA-guarded as complexity grows.

## Possible Duplications / Cleanup Candidates

1. **Consolidate timeline/warnings interfaces**
  Decide long-term authority: keep only `PlannerResult`-first helpers, or explicitly formalize `ParrilladaPlan` as stable contract.
2. **Deprecate unused legacy cards**
  `ParrilladaTimelineCard` and `ParrilladaWarningsCard` appear not used in current flow.
3. **Split scheduler screen mapping logic**
  Extract `PlannerResult -> ParrilladaPlan` and zone/action mapping into dedicated adapter files under `lib/planning` or `components/parrillada/adapters`.
4. **Clarify live-plan builder strategy**
  Keep `buildParrilladaLivePlanFromResult` as canonical runtime path; label or retire legacy `buildParrilladaLivePlan(plan)` if no longer required.
5. **Type naming simplification**
  There are conceptually similar role/severity models (`PlanningRole`, `ParrilladaItemRole`, `ParrilladaEligibilityRole` aliasing) that could be documented or reduced.

## Recommended Next Steps

1. **Boundary cleanup before new features**
  Remove or explicitly mark legacy-only modules/components to reduce ambiguity.
2. **Formalize canonical planner contract**
  Make `PlannerResult + executionTimelineGroups` the documented runtime contract for Review/Live.
3. **Extract UI adapters**
  Move projection helpers out of `ParrilladaSchedulerScreen` to keep screens presentation-focused.
4. **Strengthen QA around cleanup**
  Extend `qa:parrillada` with assertions for adapter parity if legacy projections are removed.
5. **Gate Pro/Event rollout intentionally**
  Keep Pro advanced controls behind explicit staged flags and QA suites until optimizer behavior is production-ready.

## Merge Readiness Recommendation

**Recommendation: Ready with caution (architecture baseline acceptable).**

Why:

- Core deterministic planner pipeline is coherent and test-backed.
- Source-of-truth path from single-cut metadata to grouped execution is present and explainable.
- Guardrails for mock isolation and icon resolver centralization are in place.

Caution items before large new feature expansion:

- Resolve legacy-vs-current duplication boundaries.
- Reduce mapping logic concentration in scheduler screen.
- Keep Pro/Event roadmap gating explicit to avoid accidental scope expansion.

## Guardrail Confirmation Snapshot

From this audit scope:

- Single-cut planning generation path is still independent (`lib/cookingRules.ts` + single-cut engine).
- Parrillada uses existing planner modules and does not indicate direct modifications to single-cut Result/Live modules in this audit.
- Supabase-specific logic was not found in reviewed Parrillada modules.
- Home/bottom-nav modules were outside reviewed Parrillada architecture files and not changed by this audit.
- No raw `.png` imports were found under `components/parrillada`.
- Icon resolver uses existing registries (`iconRegistry`, cut icon resolver), not raw asset imports.
- Lite bounds are explicitly enforced in scheduler flow (min `2`) and QA validates Lite scenario range `2-4`.
- Pro/Event is partially surfaced, with advanced controls/optimizer behavior not fully enabled yet.
- Mock plan data is annotated as preview-only fallback and not the active catalog-backed generation path.

