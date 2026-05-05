# Time Semantics Audit

## 1. Summary

Parrillero Pro currently has two overlapping time semantics:

- The local engine `TIMES` / `TIEMPOS` block is closest to `activeCookMinutes + restMinutes`.
- The generated step timeline includes a setup/preheat step, active cooking steps, and rest steps.
- The ResultHero time metric is currently derived from summed step durations when `TIMES` / `TIEMPOS` does not contain an explicit total, so it is closest to `setupMinutes + activeCookMinutes + restMinutes`.
- Live Cooking uses the same parsed step timeline, so its timers include preheat/setup, active cooking, and rest.
- Cut Catalog v2 already defines the target semantic model with separate setup, active cook, rest, cut plan, session total, and prep lead time fields. That model is validated by `npm run validate:cuts:v2`, but it is not yet wired into the local cooking engine output.

No engine behavior, UI output, navigation, Supabase code, or snapshots were changed in this audit.

## 2. Current Time Fields

### Engine and catalog fields

- `lib/cookingCatalog.ts`
  - `ProductCut.restingMinutes`: rest duration in minutes.
  - `ProductCut.cookingMinutes`: optional generated or catalog cooking duration in minutes.
- `lib/generated/cutProfiles.ts`
  - `restingMinutes`
  - `estimatedTimeMinPerCm`
  - `estimatedTotalTimeMin`
  - `cookingMinutes`
- `lib/resolveCookingProfile.ts`
  - Maps generated `restingMinutes` and `cookingMinutes` onto `ProductCut`.
  - Resolves generated time from `estimatedTimeMinPerCm`, `estimatedTotalTimeMin`, `cookingMinutes`, or legacy fallback.
- `data/cuts/parrillero_pro_input_profiles_en.csv`
  - Legacy generated-input source uses `estimated_total_time_min` and `rest_time_min`.
  - `scripts/cuts-data.mjs` maps `estimated_total_time_min` to `cookingMinutes`, so the field name says total but the runtime field is treated as cook duration.
- `data/cuts/cut_catalog_v2.csv`
  - Already has target model fields:
    - `setup_minutes_min/max`
    - `active_cook_min/max_minutes`
    - `rest_min/max_minutes`
    - `cut_plan_minutes_min/max`
    - `session_total_minutes_min/max`
    - `prep_lead_time_min/max_minutes`
- `data/cuts/cooking_profiles_v2.csv`
  - Repeats the target time fields at reusable cooking-profile level.
- `data/cuts/prep_profiles_v2.csv`
  - Separates salting/dry-brine lead time from the cooking session.

### Engine calculations

- `lib/cookingRules.ts`
  - `getMainCookSeconds(...)` returns active cooking seconds from generated `cookingMinutes` or thickness/doneness heuristics.
  - `getRestSeconds(...)` returns `cut.restingMinutes * 60`.
  - `estimateTimes(...)` builds the `TIMES` / `TIEMPOS` string from sear/indirect cooking plus rest. It does not include setup/preheat.
  - `makeStandardSteps(...)` adds a setup/preheat step with `duration: 600` seconds for standard meat flows.
  - Low-and-slow, crispy, and poultry flows also add a `600` second preheat/setup step.
  - Vegetable flow adds `Prep vegetables` / `Preparar verduras` with `duration: 300` seconds and a `Finish` step with `duration: 60` seconds.

## 3. Current Display Behavior

### ResultHero time

- `components/ResultHero.tsx` asks `buildResultHeroMetrics(...)` for the visible hero metrics.
- `lib/results/resultSummary.ts` builds `summary.time`.
- If `TIMES` / `TIEMPOS` does not look like an explicit total, `buildResultSummary(...)` prefers `getResultStepDurationTotal(...)`.
- `getResultStepDurationTotal(...)` sums every `N min` value found in the `STEPS` / `PASOS` block.
- Because local engine steps include preheat/setup and rest, the ResultHero time is currently closest to `setup + active cook + rest`.

Example consequence:

- `TIEMPOS`: `3 min por lado + 4 min indirecto + 7 min reposo` is cook + rest.
- `PASOS`: `Precalentar ... (10 min)`, `Sellar lado 1 ... (3 min)`, `Sellar lado 2 ... (3 min)`, `Terminar ... (4 min)`, `Reposo ... (7 min)` sums to 27 min.
- ResultHero prefers the step total, so it shows the session-style total, not the `TIEMPOS` semantic.

### ResultCards time

- `components/cooking/CookingWizard.tsx` wraps results in `ResultCards`.
- `components/ResultGrid.tsx` marks `SETUP`, `TIMES` / `TIEMPOS`, `TEMPERATURE` / `TEMPERATURA`, `STEPS` / `PASOS`, and `ERROR` as used keys.
- Current ordering pushes `ERROR` and `STEPS` into visible core cards, but it does not render a dedicated `TIMES` / `TIEMPOS` card.
- Time is therefore primarily visible in ResultHero and inside the step text card.

### Live Cooking payload time

- `components/cooking/CookingWizard.tsx` creates the Live Cooking payload from the current `blocks`.
- `app/page.tsx` does the same when starting a saved cook live.
- `lib/liveCookingPlan.ts` stores normalized blocks and later parses `STEPS` / `PASOS`.
- `buildLiveStepsFromPayload(...)` parses each step duration from the step line text.
- Since the local `STEPS` / `PASOS` text includes preheat/setup and rest, Live Cooking timers currently include `setup + active cook + rest`.
- The payload has no explicit `setupMinutes`, `activeCookMinutes`, `restMinutes`, `cutPlanMinutes`, `sessionTotalMinutes`, or `prepLeadTimeMinutes` fields today.

## 4. Current QA Behavior

### Cut Catalog v2 QA

- `scripts/validate-cut-catalog-v2.ts` validates the target semantic sums:
  - `cut_plan_minutes_min = active_cook_min_minutes + rest_min_minutes`
  - `cut_plan_minutes_max = active_cook_max_minutes + rest_max_minutes`
  - `session_total_minutes_min = setup_minutes_min + cut_plan_minutes_min`
  - `session_total_minutes_max = setup_minutes_max + cut_plan_minutes_max`
- This is aligned with the target model.
- This validation applies to v2 CSV data only; it does not verify current local engine output totals.

### Cooking engine QA

- `scripts/cooking-engine-qa.ts` validates that `TIMES` / `TIEMPOS`, `TEMPERATURE` / `TEMPERATURA`, `STEPS` / `PASOS`, and valid step durations exist.
- It sums step durations only for a doneness regression guard, not for a semantic check against cut plan or session total.
- Because steps include preheat/setup and rest, any total step duration used by QA is session-like, not cut-plan-only.

### Cooking snapshots

- `scripts/cooking-snapshots.ts` snapshots both `plan` and `steps`.
- The snapshot payload would include:
  - `plan.TIMES` / `plan.TIEMPOS`, currently cook + rest text.
  - `steps`, currently including setup/preheat and rest durations.
- No `tests/snapshots/cooking-engine.json` file is currently present in the workspace, so snapshot comparison is not active unless that baseline is created.

### Response audit and quality scripts

- `scripts/cooking-response-audit.ts` checks duration validity and flags unusual total timeline durations from summed step durations.
- `scripts/cooking-quality.ts` and `lib/cookingQualityScore.ts` score output structure and duration sanity, but do not enforce the target semantic split.

## 5. Problems Found

1. `TIMES` / `TIEMPOS` and ResultHero time do not mean the same thing.
  - Engine `TIMES` / `TIEMPOS` is closest to cook + rest.
  - ResultHero time is currently closest to setup + cook + rest because it prefers summed step durations.
2. Preheat/setup is hardcoded inside step generation.
  - Standard meat, poultry, crispy, and low-and-slow flows use `600` seconds.
  - Vegetable prep uses `300` seconds.
  - These values are not sourced from `setup_minutes_min/max`.
3. Runtime engine types do not expose target semantic fields.
  - There is no structured `setupMinutes`, `activeCookMinutes`, `restMinutes`, `cutPlanMinutes`, `sessionTotalMinutes`, or `prepLeadTimeMinutes` on `CookingPlan` or `CookingStep`.
4. Legacy generated data naming is ambiguous.
  - `estimated_total_time_min` becomes `cookingMinutes`.
  - Runtime treats it as active/main cook time, while the source name suggests a total.
5. Live Cooking depends on parsed display text.
  - It parses durations from `STEPS` / `PASOS` text rather than receiving structured time fields.
  - This makes semantic migrations fragile because display copy and timer math are coupled.
6. ResultCards no longer show a dedicated time card.
  - This reduces duplicate display, but it also means ResultHero is the main visible total and must be semantically precise.

## 6. Target Semantic Model

Target meanings:

- `setupMinutes`: preheat/setup time.
- `activeCookMinutes`: actual grill/cooking time.
- `restMinutes`: rest time.
- `cutPlanMinutes`: `activeCookMinutes + restMinutes`.
- `sessionTotalMinutes`: `setupMinutes + cutPlanMinutes`.
- `prepLeadTimeMinutes`: salting, dry brine, marinade, or other prep before the session. This is not part of session total.

Target usage:

- Cut-level QA validates `cutPlanMinutes`.
- UI may display `sessionTotalMinutes`.
- Live Cooking may execute `sessionTotalMinutes` if it includes setup/preheat as the first step, but it should know which step is setup.
- Future Parrillada Engine should count setup/preheat once per session, not once per cut.
- Prep lead time should appear as advance guidance, not as cooking-session time.

## 7. Minimal Migration Plan

1. Add structured time semantics without changing visible output.
  - Introduce a typed time model near the cooking engine, for example `CookingTimeSemantics`.
  - Populate it from existing calculations first:
    - `setupMinutes`: derive from current preheat/setup step duration.
    - `activeCookMinutes`: derive from sear + indirect/main cook durations.
    - `restMinutes`: use `restingMinutes`.
    - `cutPlanMinutes`: active + rest.
    - `sessionTotalMinutes`: setup + cut plan.
  - Keep existing `TIMES` / `TIEMPOS` and `STEPS` / `PASOS` text unchanged during this step.
2. Add QA around structured semantics.
  - Extend local cooking QA to validate `cutPlanMinutes`, not summed step duration.
  - Keep a separate assertion that step timeline duration equals `sessionTotalMinutes` when setup/preheat steps are present.
  - Add v2 data cross-checks only after the runtime engine consumes v2 fields.
3. Decouple ResultHero from text scraping.
  - Feed ResultHero a structured display time.
  - Use `sessionTotalMinutes` for UI total when the product wants "ready in/session time".
  - Avoid deriving totals from arbitrary `STEPS` / `PASOS` text.
4. Decouple Live Cooking from display text.
  - Extend `LiveCookingPlanPayload` to include structured steps with phase/type and duration.
  - Mark setup/preheat, active cook, rest, and serve phases explicitly.
  - Continue accepting text-derived blocks temporarily for saved-plan compatibility if needed.
5. Prepare Parrillada semantics.
  - Treat setup/preheat as an equipment/session event.
  - For multiple cuts sharing the same equipment setup, count setup once in the session timeline.
  - Keep each cut's `cutPlanMinutes` as active + rest only.
6. Migrate generated data carefully.
  - Rename or remap ambiguous `estimated_total_time_min` in the data pipeline.
  - Avoid using source "total" fields as runtime active cook time unless confirmed row by row.

## 8. Files Likely Needing Changes

### Engine and data model

- `lib/cookingCatalog.ts`
- `lib/cookingRules.ts`
- `lib/cookingEngine.ts`
- `lib/resolveCookingProfile.ts`
- `lib/generated/cutProfiles.ts`
- `scripts/generate-cuts.mjs`
- `scripts/cuts-data.mjs`
- `data/cuts/parrillero_pro_input_profiles_en.csv`
- `data/cuts/cut_catalog_v2.csv`
- `data/cuts/cooking_profiles_v2.csv`
- `data/cuts/prep_profiles_v2.csv`

### UI display

- `lib/results/resultSummary.ts`
- `lib/results/resultMetrics.ts`
- `components/ResultHero.tsx`
- `components/ResultGrid.tsx`
- `components/cooking/CookingWizard.tsx`

### Live Cooking

- `lib/liveCookingPlan.ts`
- `hooks/useLiveCooking.ts`
- `hooks/useLiveCookingSession.ts`
- `components/live/LiveCookingScreen.tsx`
- `components/live/LiveTimer.tsx`
- `components/live/LiveExecutionGuide.tsx`
- `components/live/LiveStepCard.tsx`
- `app/page.tsx`

### QA and snapshots

- `scripts/validate-cut-catalog-v2.ts`
- `scripts/cooking-engine-qa.ts`
- `scripts/cooking-snapshots.ts`
- `scripts/cooking-response-audit.ts`
- `scripts/cooking-quality.ts`
- `lib/cookingOutputValidation.ts`
- `lib/cookingQaRun.ts`
- `tests/snapshots/cooking-engine.json` if a baseline is generated later.

## 9. Validation Results

Commands run on this audit:

- `npm run validate:cuts:v2`
  - Passed.
  - Output: Cut Catalog v2 validation passed. Catalog rows: 28. Cooking profiles: 16. Prep profiles: 10.
- `npm run lint`
  - Passed with one warning.
  - Warning: `app/page.tsx` has a React Hook dependency warning for `router` at line 930.
- `npm run build`
  - Passed.
  - Next.js 16.2.4 production build completed successfully.
- `npm run qa:cooking`
  - Passed.
  - Total combinations: 1116. Passed: 1116. Failed: 0.
- `npm run check`
  - Passed.
  - Re-ran lint, build, cooking QA, and printed the UI validation checklist.
  - Same lint warning appeared in `app/page.tsx`.

Direct answers to the audit questions:

1. Preheat/setup time is currently added in `makeStandardSteps(...)` and related style-specific step builders in `lib/cookingRules.ts`, usually as a hardcoded `600` second step. Vegetable prep uses `300` seconds.
2. Yes. Preheat/setup is included in the ResultHero visible time when the hero falls back to summed step durations, which is the current local-engine path for non-explicit `TIMES` / `TIEMPOS`.
3. Partially. Preheat/setup is included in generated `steps` used by cooking QA and would be included in cooking snapshots. It is not validated as a named semantic field. No snapshot baseline file currently exists.
4. The current visible ResultHero total is closest to setup + cook + rest. The engine `TIMES` / `TIEMPOS` block is closer to cook + rest. The main active cook calculation itself is active cook only.
5. Files likely needing changes are listed in section 8.
6. The smallest safe migration is to add structured time semantics alongside current output, validate them in QA, then switch ResultHero and Live Cooking to structured fields after parity is proven.
7. Snapshot/test risk is high once step text, step durations, or plan shape changes. Existing QA will likely continue passing unless semantic assertions are added, but future cooking snapshots would change because both `plan` and `steps` capture time text and durations.