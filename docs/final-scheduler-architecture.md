# Parrillero Pro — Final Multi-Cut Scheduler Architecture

## Goal

Build the foundation for the final Parrillada Engine: a deterministic scheduler that can plan multiple cuts around a target serve time while respecting grill zones, rest/hold behavior, quality windows, safety warnings, and limited capacity.

This is not a recipe generator. It is the timing and orchestration layer.

## Main idea

The scheduler receives:

- selected menu items
- target serve time
- grill capacity model
- strategy
- data-driven planning profiles

It returns:

- normalized items
- scheduled phases
- zone conflicts
- warnings
- confidence summary

## Files

```txt
lib/planning/types.ts
lib/planning/planningProfiles.ts
lib/planning/profileResolver.ts
lib/planning/estimation.ts
lib/planning/capacity.ts
lib/planning/time.ts
lib/planning/warnings.ts
lib/planning/scheduler.ts
lib/planning/index.ts
lib/planning/fixtures/demoGrills.ts
lib/planning/fixtures/demoItems.ts
lib/planning/adapters/cookingCatalogAdapter.ts
```

## Scheduling model

Each item becomes phases:

1. prep
2. cook
3. rest
4. optional hold
5. serve

The scheduler works backwards from the serve time.

For each item, it tries to place the cooking phase as late as possible without exceeding zone capacity. If a conflict exists, the item is moved earlier in 5-minute increments.

## Why this is scalable

The scheduler does not special-case `cutId` in the algorithm.

Cut-specific behavior belongs in profiles:

- preferred zones
- fallback zones
- zone demand
- hold quality
- max hold minutes
- rest minutes
- timing sensitivity
- safety critical flag
- warnings
- conflict weight

## Current limitations

This package is a final foundation, not a finished production engine.

Known limitations:

- no genetic/optimization solver yet
- no drag-and-drop manual override yet
- no real probe integration yet
- no live correction loop yet
- cooking estimates are still profile-based, not fully calibrated by empirical data
- UI uses demo items unless wired to the real catalog

## Future expansion

Next layers:

1. Real catalog adapter
2. Manual timeline override
3. Multi-zone visual board
4. Live Cooking handoff
5. Smart Probe Live correction loop
6. Saved parrillada menus
7. Learn-from-result calibration
