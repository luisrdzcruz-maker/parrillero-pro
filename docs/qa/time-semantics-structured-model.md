# Time Semantics Structured Model

## What Was Added

Added `CookingTimeSemantics` in `lib/cookingTimeSemantics.ts`:

- `setupMinutes`: setup/preheat phase minutes.
- `activeCookMinutes`: actual active heat/cooking minutes.
- `restMinutes`: rest phase minutes.
- `cutPlanMinutes`: active cook + rest.
- `sessionTotalMinutes`: setup + cut plan.
- `prepLeadTimeMinutes`: currently `null`; reserved for salting/dry-brine/marinade lead time.
- `source`: currently `"legacy-engine-derived"` for local engine plans.

The local engine now attaches `plan.timeSemantics` to generated cooking plans. It is intentionally non-enumerable, so existing `Object.keys(...)`, block normalization, copy/share text, ResultCards, and ResultHero block parsing do not see it as a visible content block.

## What Did Not Change

- `TIMES` / `TIEMPOS` text did not change.
- `STEPS` / `PASOS` text did not change.
- ResultHero and ResultCards visual behavior did not change.
- Live Cooking still parses executable steps from `STEPS` / `PASOS`.
- Supabase, navigation, CSV v2 runtime wiring, and Parrillada Engine behavior were not changed.

## Mapping From Old Output

Current local engine text maps to the structured model like this:

- `TIMES` / `TIEMPOS` remains closest to `cutPlanMinutes` because it describes active cooking plus rest.
- `STEPS` / `PASOS` remains closest to `sessionTotalMinutes` because it includes setup/preheat, active cooking, and rest.
- `plan.timeSemantics.sessionTotalMinutes` should match the summed executable step duration within rounding tolerance.
- `prepLeadTimeMinutes` is not derived yet because current runtime engine plans do not expose salting/dry-brine lead time.

## QA Coverage

`scripts/cooking-engine-qa.ts` now validates local engine plans for:

- presence of `timeSemantics`;
- arithmetic invariants for `cutPlanMinutes` and `sessionTotalMinutes`;
- non-negative setup/rest minutes;
- positive active cook minutes;
- step duration total close to `sessionTotalMinutes`;
- `TIMES` / `TIEMPOS` remaining close to `cutPlanMinutes` where parseable.

## Remaining Work

- ResultHero should eventually read structured `sessionTotalMinutes` instead of summing text durations.
- Live Cooking should eventually receive structured phase data instead of parsing `STEPS` / `PASOS` strings.
- Cut-level QA can move from text and step totals to `cutPlanMinutes`.
- Parrillada Engine should count setup/preheat once per equipment/session, not once per cut.
- CSV v2 time fields should be wired into runtime after profile migration decisions are made.