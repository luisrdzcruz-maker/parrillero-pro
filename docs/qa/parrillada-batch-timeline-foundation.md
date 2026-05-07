# Parrillada Batch Timeline Foundation

## Why batching exists

Parrillada menus frequently contain repeated or similar items (for example, multiple steaks plus several sausages and sides).  
Showing one independent line per physical portion quickly becomes noisy and hard to execute.

This foundation adds a grouped execution timeline derived from the existing detailed scheduler phases. The objective is clarity of action without losing deterministic planning detail.

## Menu lines vs physical portions

- `PlannerCutInput` now accepts `quantity`, `unit`, and optional `physicalPortionCount`.
- `ParrilladaMenuLine` is introduced as a future-facing model (`item` + `quantity` + `unit`) for Event/Pro expansion.
- Lite still plans 2-4 selected menu lines. Quantity is currently used for planning metadata and grouped action readability, not for exposing a larger selection UI.

## Holdable vs sensitive behavior

Each normalized item is classified into derived behavior:

- `holdBehavior`: `can_hold_indirect`, `short_hold_only`, `serve_immediately`, `do_not_hold`
- `finishPriority`: `early`, `middle`, `finish_last`
- `heatFragility`: `low`, `medium`, `high`
- `foodSafetyGroup`: `raw_beef`, `raw_pork`, `raw_poultry`, `raw_fish`, `vegetable`, `ready_to_eat`

Derivation is metadata-first and uses:

- `planningMetadata` (`timingSensitivity`, `canHoldWarm`, `maxHoldMinutes`, `riskTags`, zones)
- normalized planning profile timing/hold traits
- animal/category semantics
- parrillada presentation role as a hint layer (not cooking truth)

No grouping rule is hardcoded by `cutId` as primary logic.

## Finish-last logic

Sensitive items are classified as `finish_last` when they are timing fragile or low-hold.  
Holdable items with enough warm-hold tolerance are classified as early/middle and can be started before sensitive finish items.

This gives expected behavior like:

- sides/starters start first
- move/hold where possible
- premium/sensitive items finish near serve

## Food safety groups and burn-off rules

Grouping compatibility now blocks unsafe silent grouping:

- raw poultry is not grouped with vegetables or ready-to-eat items

When direct-zone reuse is detected from raw poultry to vegetables/ready-to-eat, the grouped timeline inserts a compact action:

- `Clean/burn off zone · 2-3 min`
- instruction: `High heat before vegetables or ready-to-eat food`

This action is derived from existing phase ordering and zone usage.

## Grouped timeline vs detailed phases

- Existing detailed `result.phases` remain unchanged and are still used for deterministic scheduling QA.
- New `result.executionTimelineGroups` is an additive, derived layer.
- Grouping uses phase timing proximity, zone/heat compatibility, holdability, fragility, and food safety constraints.
- UI can show grouped actions first for readability while keeping detailed blocks available.

## QA scenarios added for batch/group behavior

`qa:parrillada` now validates grouped execution behavior with deterministic scenarios:

- 2 ribeyes + 6 sausages + 4 corn
- sausages + corn + peppers
- premium steak + holdable sides
- chicken wings + asparagus + corn
- raw poultry + vegetable safety case
- sensitive cuts finish-last behavior

Assertions include:

- grouped timeline exists and is sorted
- final serve action exists
- holdable early coordination appears where expected
- sensitive finish groups occur near serve time
- unsafe poultry/vegetable grouping does not happen silently
- clean/burn-off action appears when zone reuse requires it
- detailed timeline sanity assertions still pass

## What this enables for future Event/Pro mode

- scalable menu-line quantities without forcing one timeline row per portion
- clear action-oriented timeline for larger menus
- deterministic safety-aware grouping constraints
- ability to layer richer capacity/footprint logic later

## Current limitations

- Lite UI remains intentionally capped at 2-4 selected menu lines.
- Grouping is phase-derived and conservative; it does not yet include advanced footprint/load balancing per grate slot.
- Quantity currently improves action readability and future data model readiness, but does not expose Event/Pro item-count UI.
