# Parrillada Catalog-Wide Scheduler QA

## Purpose
Expand `qa:parrillada` from a curated-only set into broader catalog-wide scheduler QA coverage while keeping execution deterministic, fast, and non-invasive to product behavior.

## Scenario Families Covered

### Existing Explicit Scenarios (kept)
- Demo scenarios:
  - `picanha + asparagus`
  - `picanha + secreto iberico + asparagus`
  - `chicken wings + secreto iberico + asparagus`
  - `default 4-item demo menu`
- Catalog-backed basic scenarios:
  - `catalog: beef + vegetable mix`
  - `catalog: pork + vegetable mix`
  - `catalog: chicken + side mix`
  - `catalog: fish + vegetable mix`
  - `catalog: default expanded 4-item menu`
- Advanced cut / long-cook explicit scenarios:
  - `catalog: advanced long-cook + vegetable`
  - `catalog: advanced long-cook + side`
  - `catalog: ribs + side`
  - `catalog: whole/spatchcock chicken + side`
  - `catalog: pork belly + side`
  - `catalog: pork belly slices + side`
  - `catalog: brisket + chuck roast + side`
- Compatibility explicit scenarios:
  - `catalog: ribeye + asparagus`
  - `catalog: picanha + iberian_secreto + asparagus`
  - `catalog: chicken_wing + corn_on_cob`
  - `catalog: salmon + asparagus + corn_on_cob`
  - `catalog: default 4-item menu`

### Generated Catalog-Wide Families (deterministic)
- `generated: beef + vegetable`
- `generated: pork + vegetable`
- `generated: chicken + side`
- `generated: fish + vegetable`
- `generated: sausage + side`
- `generated: recommended main + recommended side`
- `generated: standard main + vegetable`
- `generated: advanced long-cook + vegetable`
- `generated: advanced long-cook + fast finish`
- `generated: timing-sensitive item + flexible item`
- `generated: holdable main + delicate/fast item`
- `generated: early-start item + side`
- `generated: safety-critical item + vegetable`

## Determinism and Runtime Strategy
- Fixed timestamps are used for all scenarios:
  - `serveAtIso = 2030-05-01T18:00:00.000Z`
  - `nowIso = 2030-05-01T12:00:00.000Z`
- Generated family selection is deterministic through stable item sorting and fixed selectors.
- Matrix explosion is avoided by creating one representative scenario per family.
- Missing/unsafe families are skipped with explicit reasons instead of failing the whole suite.

## Assertions Covered
For each generated and explicit scenario:
- Plan exists.
- Timeline/phases are non-empty.
- Phases are sorted by start time.
- Global preheat ends before or at first cook/sear/check/flip phase.
- Item prep ends before or at that item's first cook/sear phase.
- Cook/sear phases happen before rest/hold/serve for the same item.
- Serve phases occur near requested serve time (within 5 minutes).
- No non-positive duration unless explicitly allowed phase type (`buffer`).
- Plan confidence exists.
- Warnings array exists.
- Catalog-backed items have planning metadata or explicit fallback note.
- No item silently falls back to a mismatched `cutId`.

## Failure Diagnostics
On any scenario failure, output includes:
- Scenario name and origin.
- Failed assertion.
- Relevant item metadata (cut/category/role/visibility/timing/hold/metadata source/confidence).
- Relevant phases/timeline slice.
- Warnings.
- Confidence.
- Non-zero process exit code.

## What This QA Proves
- Scheduler timeline ordering and phase sanity across broader catalog-backed scenario families.
- Deterministic planner behavior under fixed timing anchors.
- Catalog-backed metadata coverage consistency and explicit fallback handling.
- No silent `cutId` mismatch fallback in normalized planner items.
- Broader coverage across recommended/standard/advanced item visibility.

## What This QA Does Not Prove
- Perfect culinary optimization for every cut and every grill context.
- Full multi-zone event/platoon scheduling behavior beyond Lite scope.
- UI/UX quality, rendering fidelity, or interaction behavior.
- Supabase persistence behavior.
- Smart Probe or live telemetry integrations.

## Remaining Gaps
- Family generation is representative, not exhaustive combinations.
- Confidence remains low in some heavy advanced long-cook mixed scenarios due warning pressure.
- Category-level risk-tag balancing can be expanded further in future non-blocking QA families.
- Cross-grill capacity variant sweeps are not included in this script.

## Validation Results (Current Run)
- `npm run qa:parrillada`:
  - Passed: 34
  - Skipped: 0
  - Failed: 0
  - Explicit scenarios: 21
  - Generated scenarios: 13
  - Included catalog items covered: 28
  - Advanced items covered: 8
  - Recommended coverage count: 9
  - Standard coverage count: 11
  - Advanced coverage count: 8
  - Warning severity totals (info/warning/critical): 29/22/5
- `npm run qa:cooking`: PASS 1116/1116
- `npm run lint`: PASS with known warning in `app/page.tsx` (`react-hooks/exhaustive-deps`)
- `npm run build`: PASS
