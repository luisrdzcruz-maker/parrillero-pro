# Multi-Cut Engine Foundation

Date: 2026-05-01  
Branch: `feature/home-conversion-and-funnel`  
Model: GPT-5.5  
Scope: architecture and design only. No runtime scheduler implementation.

## 1. Executive summary

The multi-cut engine should let Parrillero Pro plan several grill items together while preserving the product's core promise: fast, trustworthy cooking decisions that users can execute with confidence. It should eventually coordinate steaks, ribs, chicken, fish, vegetables, sides, fire zones, serving windows, hold-warm limits, and Smart Probe feedback.

The engine should not start as a full scheduler. A complete optimizer would require more metadata, more QA coverage, and more confidence in edge cases than the current single-cut flow needs. Building it too early would create hidden complexity, brittle assumptions, and a high risk of overpromising timing precision.

The right foundation is a staged architecture that extends the current single-cut flow instead of replacing it. Current single-cut planning should remain the stable baseline. Multi-cut planning should first add metadata contracts and warning models, then move toward simple plans, zone-aware timelines, hold-warm logic, live execution, and probe-aware adjustment.

## 2. Design principles

- **Data-driven profiles:** Planning behavior should come from typed planning metadata, not scattered conditionals.
- **No hardcoded `cutId` logic:** The planner should read capabilities and constraints from profiles instead of branching on specific cuts.
- **Canonical English internals:** Engine keys, enum values, planning states, warnings, and contracts should use English internal identifiers. UI localization should happen at the presentation layer.
- **Constraints first:** The foundation should model what is impossible, risky, or attention-heavy before trying to optimize.
- **Warnings before automation:** Early multi-cut support should explain conflicts clearly instead of silently producing a fragile plan.
- **Simple planner before optimizer:** Start with deterministic sequencing and conflict detection. Add optimization only after metadata, QA snapshots, and user expectations are stable.
- **Single-cut compatibility:** Every future planning profile should support the existing single-cut result path without forcing users into multi-item planning.
- **Mobile execution clarity:** Any future live multi-cut interface should prioritize the next action, the active risk, and the user's attention load.

## 3. Proposed phased roadmap

### Phase 0: Single-cut stable baseline

Goal: keep the current single-cut path strong and deterministic.

Current flow:

```txt
Home -> CutSelection -> Details -> Result -> Live Cooking
```

Requirements:

- Preserve current single-cut behavior.
- Avoid changing cooking calculations as part of multi-cut preparation.
- Keep existing QA and snapshots passing.
- Identify current profile fields that can later map into planning metadata.

Exit criteria:

- Single-cut engine output is stable.
- Result and Live Cooking remain usable without multi-cut concepts.
- Baseline QA snapshots exist for representative single-cut items.

### Phase 1: Metadata contracts only

Goal: define planning metadata without building the scheduler.

Work:

- Add conceptual contracts for planning profiles.
- Map future metadata to existing cut profiles gradually.
- Keep metadata optional until enough profiles are covered.
- Create QA fixtures for metadata completeness and internal enum validity.

Expected output:

- Typed contracts for planning metadata.
- No multi-item scheduling runtime.
- No UI flow changes required.

### Phase 2: Simple multi-item planner with warnings

Goal: allow users to select multiple items and receive a basic plan plus clear warnings.

Planner behavior:

- Sort items by estimated duration.
- Group items by zone needs.
- Place long cooks first.
- Place quick cooks close to serve time.
- Detect simultaneous attention conflicts.
- Warn when serve windows are unrealistic.

Expected output:

- A deterministic multi-item plan.
- Warnings for conflicts and unrealistic expectations.
- No complex optimization.

### Phase 3: Zone-aware timeline builder

Goal: turn the simple plan into a timeline that respects direct, indirect, rest, and hold zones.

Work:

- Model zone capacity and time ranges.
- Track direct and indirect heat demand.
- Detect zone conflicts and overlapping active actions.
- Create timeline phases for preparation, cooking, flipping, resting, holding, and serving.

Expected output:

- A zone-aware timeline that can explain conflicts.
- Better support for mixed direct and indirect cooking.

### Phase 4: Hold-warm and serve-window logic

Goal: improve realism around finishing early, holding warm, and serving together.

Work:

- Model hold-warm capability per item.
- Respect maximum hold duration.
- Model preferred and acceptable serve windows.
- Warn when an item is poor for holding.
- Prefer finishing delicate items near serve time.

Expected output:

- More realistic group serving guidance.
- Better handling for ribs, potatoes, vegetables, fish, and steaks.

### Phase 5: Live multi-item execution

Goal: guide the user through a single global cook with multiple active items.

Work:

- Create one global timeline.
- Show active item cards.
- Prioritize the next action.
- Alert on conflicts.
- Allow timeline pauses and user adjustments.
- Keep controls mobile-first and thumb-friendly.

Expected output:

- A live multi-item assistant that manages attention, not just timers.

### Phase 6: Smart Probe integration

Goal: adjust plans based on measured temperature and predicted finish time.

Work:

- Track probe state per item.
- Compare actual temperature trend with expected trend.
- Predict finish time.
- Warn when an item is ahead or behind.
- Adjust the timeline when safe and explain the change.

Expected output:

- Probe-aware execution that remains deterministic and explainable.

## 4. Proposed files

Potential future files:

- `lib/planning/types.ts`
  - Shared planning contracts and canonical enums.
- `lib/planning/planningProfiles.ts`
  - Data-driven planning profiles mapped from cut/item metadata.
- `lib/planning/constraints.ts`
  - Constraint definitions and utility evaluators.
- `lib/planning/multiCutPlanner.ts`
  - Simple deterministic planner for multiple items.
- `lib/planning/timelineBuilder.ts`
  - Timeline phase generation from planned items and constraints.
- `lib/planning/conflictDetection.ts`
  - Conflict detection for timing, zones, attention, hold-warm, and serving.
- `lib/planning/warnings.ts`
  - Warning generation, severity, and explanation helpers.

Recommended package boundary:

```txt
lib/planning/
  types.ts
  planningProfiles.ts
  constraints.ts
  multiCutPlanner.ts
  timelineBuilder.ts
  conflictDetection.ts
  warnings.ts
```

The planning package should not import React components. UI layers should consume `MultiCutPlan`, `TimelinePhase`, and `PlanningWarning` outputs.

## 5. Core domain types

These are conceptual contracts, not implementation-ready code.

### `PlannedItem`

Represents one item selected for a multi-cut plan.

```ts
type PlannedItem = {
  id: string;
  itemKey: string;
  displayName: string;
  quantity?: number;
  estimatedDurationMinutes: number;
  profile: PlanningProfile;
  desiredServeWindow?: ServeWindow;
};
```

Notes:

- `itemKey` should be a canonical internal key, not a localized label.
- `displayName` should be treated as presentation data only.

### `PlanningProfile`

Planning metadata for a cut, vegetable, side, or future item class.

```ts
type PlanningProfile = {
  role: "main" | "side" | "vegetable" | "fish" | "poultry" | "largeFormat";
  timingSensitivity: TimingSensitivity;
  canHoldWarm: boolean;
  maxHoldMinutes?: number;
  preferredServeWindow?: ServeWindow;
  requiredZones: GrillZone[];
  preferredZones: GrillZone[];
  zoneDemand: ZoneDemand[];
  canBeSplitIntoPhases: boolean;
  conflictWeight: ConflictWeight;
  restFlexibility: "low" | "medium" | "high";
  probeRecommended: boolean;
  temperatureCriticality: "low" | "medium" | "high";
};
```

### `GrillZone`

Canonical fire and holding zones used by the planner.

```ts
type GrillZone =
  | "directHigh"
  | "directMedium"
  | "indirectLow"
  | "indirectMedium"
  | "indirectHigh"
  | "rest"
  | "holdWarm"
  | "serve";
```

### `ZoneDemand`

Describes how much a planned item needs a zone during a phase.

```ts
type ZoneDemand = {
  zone: GrillZone;
  intensity: "low" | "medium" | "high";
  durationMinutes: number;
  attentionRequired: boolean;
};
```

### `ServeWindow`

Represents the desired or acceptable serving range.

```ts
type ServeWindow = {
  targetMinute: number;
  earliestMinute?: number;
  latestMinute?: number;
  flexibility: "strict" | "moderate" | "flexible";
};
```

### `HoldWarmProfile`

Defines whether an item can wait after cooking and how quality changes.

```ts
type HoldWarmProfile = {
  canHoldWarm: boolean;
  maxHoldMinutes: number;
  qualityDropAfterMinutes?: number;
  recommendedZone?: GrillZone;
};
```

### `TimingSensitivity`

Represents how sensitive an item is to timing drift.

```ts
type TimingSensitivity = "low" | "medium" | "high";
```

Examples:

- Low: potatoes, some vegetables, ribs after a long cook.
- Medium: chicken wings, sausages, thick vegetables.
- High: salmon, thin steaks, delicate fish.

### `ConflictWeight`

Represents how costly it is when this item conflicts with another item.

```ts
type ConflictWeight = "low" | "medium" | "high" | "critical";
```

Examples:

- Critical: food safety or doneness-critical item with narrow timing.
- High: direct-heat item needing constant attention.
- Medium: side that can tolerate small drift.
- Low: item that can hold warm or rest safely.

### `PlanningWarning`

Explains a planning risk in a user-actionable way.

```ts
type PlanningWarning = {
  id: string;
  severity: "info" | "warning" | "critical";
  code: string;
  itemIds: string[];
  message: string;
  suggestedAction?: string;
};
```

Warning codes should be canonical English identifiers. UI text can be localized later.

### `MultiCutPlan`

Top-level output from a future planner.

```ts
type MultiCutPlan = {
  items: PlannedItem[];
  phases: TimelinePhase[];
  warnings: PlanningWarning[];
  confidence: "low" | "medium" | "high";
  assumptions: string[];
};
```

### `TimelinePhase`

One planned phase in the global timeline.

```ts
type TimelinePhase = {
  id: string;
  startsAtMinute: number;
  endsAtMinute: number;
  itemIds: string[];
  zone: GrillZone;
  action: "prep" | "cook" | "flip" | "move" | "rest" | "holdWarm" | "serve";
  attentionLevel: "low" | "medium" | "high";
  canShift: boolean;
};
```

## 6. Metadata to add gradually

For each cut or planning profile, add these fields over time:

- `role`
  - Main, side, vegetable, fish, poultry, or large-format item.
- `timingSensitivity`
  - How risky timing drift is for quality or safety.
- `canHoldWarm`
  - Whether the item can wait after cooking without unacceptable quality loss.
- `maxHoldMinutes`
  - Maximum realistic hold time.
- `preferredServeWindow`
  - Target finish range and flexibility.
- `requiredZones`
  - Zones that must be available for this item.
- `preferredZones`
  - Zones that improve quality but are not strictly required.
- `zoneDemand`
  - Intensity, duration, and attention demand by zone.
- `canBeSplitIntoPhases`
  - Whether the item can pause between phases, such as sear after indirect cooking.
- `conflictWeight`
  - Cost of overlapping this item with another attention-heavy or zone-heavy item.
- `restFlexibility`
  - How much rest time can vary without harming quality.
- `probeRecommended`
  - Whether a probe materially improves execution confidence.
- `temperatureCriticality`
  - How important temperature precision is for quality and safety.

Metadata should be added profile by profile. Missing metadata should produce planning limitations or warnings, not silent guesses.

## 7. Constraint model

### Hard constraints

Hard constraints cannot be violated by the planner.

Examples:

- An item requires indirect heat and no indirect zone exists.
- A selected serve window is shorter than the minimum realistic cook time.
- A food-safety target cannot be reached in the available time.

Planner behavior:

- Block the plan or mark it as impossible.
- Explain the issue with a critical warning.
- Suggest a concrete adjustment.

### Soft constraints

Soft constraints can be violated, but the user should be warned.

Examples:

- Two direct-heat items need attention at the same time.
- A side dish finishes earlier than ideal.
- A steak rests longer than preferred but still within acceptable range.

Planner behavior:

- Generate the plan.
- Add warnings and suggested actions.
- Reduce confidence if several soft constraints are violated.

### Safety constraints

Safety constraints protect against undercooking, unsafe holding, and unrealistic cooling assumptions.

Examples:

- Poultry needs safe internal temperature tracking.
- Hold-warm duration exceeds a safe or quality-preserving range.
- Probe data shows an item is not heating as expected.

Planner behavior:

- Treat true food safety issues as hard constraints.
- Treat quality risks as warnings.
- Prefer explicit user guidance over silent correction.

### Fire-zone constraints

Fire-zone constraints describe what the grill can support at one time.

Examples:

- Direct-high zone capacity is limited.
- Indirect zone is needed for ribs while direct zone is needed for wings.
- A move from indirect to direct requires a clear sear window.

Planner behavior:

- Track zone demand per timeline phase.
- Detect overlapping high-demand phases.
- Warn when zone pressure is high.

### Timing constraints

Timing constraints describe duration, sequence, rest, and shiftability.

Examples:

- Ribs require a long cook and cannot be compressed meaningfully.
- Vegetables can shift later.
- Salmon should finish close to serving.

Planner behavior:

- Schedule long and inflexible items first.
- Schedule short and sensitive items near serve time.
- Prefer shifting flexible items before sensitive ones.

### Hold-warm constraints

Hold-warm constraints describe whether finishing early is acceptable.

Examples:

- Potatoes may hold well.
- Ribs may hold for a controlled window.
- Salmon should not hold warm for long.

Planner behavior:

- Use hold-warm only when profile metadata allows it.
- Cap hold time using `maxHoldMinutes`.
- Warn when quality risk is high.

### Serving constraints

Serving constraints describe how close items should finish to each other.

Examples:

- Main and vegetable should be ready within a preferred range.
- A side can finish earlier and hold.
- A delicate fish should be served immediately.

Planner behavior:

- Compare each item finish time to the target serve window.
- Warn when an item lands outside the acceptable range.
- Explain which item should move earlier or later.

### Probe constraints

Probe constraints describe what can be adjusted once real temperature data exists.

Examples:

- Probe is recommended for poultry or thick cuts.
- Predicted finish time changes based on actual temperature curve.
- Actual temperature diverges from expected progress.

Planner behavior:

- Keep probe data per item.
- Adjust only when the change is explainable.
- Warn when sensor data conflicts with the planned timeline.

## 8. Algorithm strategy

Start simple:

1. Normalize selected items into `PlannedItem` values.
2. Resolve each item to a `PlanningProfile`.
3. Estimate duration from existing single-cut planning output where possible.
4. Sort items by duration and inflexibility.
5. Classify items by required and preferred zones.
6. Schedule long cooks first.
7. Add quick cooks near serve time.
8. Insert rest and hold-warm phases when metadata allows.
9. Detect conflicts across zones, timing, holding, and attention demand.
10. Show warnings and confidence.

Early planner heuristics:

- Long, inflexible cooks anchor the plan.
- Fast, timing-sensitive items move closer to serve time.
- Items that hold well can finish earlier.
- Attention-heavy direct-heat items should not overlap when possible.
- Missing metadata lowers confidence and should produce an informational warning.

Do not start with:

- Complex optimization.
- AI-only scheduling.
- Hidden magic.
- Unexplained automatic rescheduling.
- False precision down to exact minutes when the data does not support it.

## 9. Warnings-first design

Warnings should be specific, actionable, and tied to the relevant items.

Example warnings:

- "Two direct-heat items need attention at the same time."
- "Ribs cannot finish in your selected serve window."
- "Salmon should not hold warm for long."
- "Vegetables can be cooked last."
- "Chicken wings need a safety check before serving."
- "Indirect heat is overloaded during the first hour."
- "This plan assumes potatoes can hold warm for 20 minutes."

Warning design rules:

- Use `critical` only when the plan should stop or be changed.
- Use `warning` for quality, attention, timing, or zone risks.
- Use `info` for helpful execution notes.
- Keep one primary suggested action per warning.
- Avoid alert floods by grouping related conflicts.

## 10. Live Cooking implications

Future multi-cut Live Cooking should be organized around one global timeline, not separate independent timers.

Expected behavior:

- Show one global timeline with all items.
- Show active item cards only for items needing attention now.
- Prioritize the next action across all items.
- Highlight direct conflicts before they happen.
- Use conflict alerts for overlapping attention-heavy actions.
- Allow the user to pause, delay, or mark an action complete.
- Recalculate future phases after user adjustments.
- Keep completed, resting, and holding items visible but lower priority.

Mobile hierarchy:

1. Current highest-priority action.
2. Time remaining until next action.
3. Active item cards.
4. Conflict or safety alerts.
5. Lower-priority future timeline.

Future thermometer and probe adjustments should appear as execution guidance, not as unexplained schedule jumps.

## 11. Smart Probe compatibility

Smart Probe support should be designed as a later extension of the same planning model.

Future probe state:

```ts
type ProbeState = {
  itemId: string;
  currentTemperatureC: number;
  targetTemperatureC: number;
  predictedFinishMinute?: number;
  trend: "behind" | "onTrack" | "ahead" | "unknown";
  lastUpdatedAt: string;
};
```

Future integration capabilities:

- Track probe state per item.
- Compare actual temperature with planned progress.
- Estimate predicted finish time.
- Warn when actual temperature diverges from expected behavior.
- Suggest moving an item between zones when appropriate.
- Adjust the global timeline when the adjustment is safe.
- Explain why the timeline changed.

Probe integration should not become an opaque automation layer. If the system changes the plan because a probe says one item is ahead, the user should see the reason and the next action clearly.

## 12. Risks and anti-patterns

### Premature optimizer complexity

Risk:

- A sophisticated optimizer can hide assumptions, produce surprising plans, and be hard to QA.

Avoid by:

- Starting with deterministic sorting, simple sequencing, and warning generation.

### Hardcoded cut-specific rules

Risk:

- Branching on individual `cutId` values makes the engine brittle and difficult to extend.

Avoid by:

- Modeling timing, zones, holding, and conflict behavior in profiles.

### Mixing UI labels with engine logic

Risk:

- Localized names can leak into internal control flow and break future localization or integrations.

Avoid by:

- Using canonical English internals and localizing only at the UI boundary.

### Too many simultaneous alerts

Risk:

- Multi-item cooking can overwhelm the user if every minor conflict becomes an alert.

Avoid by:

- Grouping related warnings, prioritizing safety, and showing the next actionable issue.

### Overpromising precision

Risk:

- Exact timing claims can be misleading because grill heat, thickness, weather, and user behavior vary.

Avoid by:

- Using confidence levels, ranges, and explicit assumptions.

### Ignoring hold-warm realism

Risk:

- A technically valid timeline may produce poor food if delicate items are held too long.

Avoid by:

- Modeling hold-warm limits and warning when quality will drop.

## 13. Implementation recommendation

Do not implement the scheduler immediately.

Recommended next work:

1. Keep the current single-cut flow stable.
2. Add planning metadata contracts in a dedicated planning package.
3. Define canonical English planning enums and warning codes.
4. Add metadata gradually to representative profiles.
5. Create QA snapshots for metadata resolution and first multi-item examples.
6. Implement simple multi-item warnings before full scheduling.

Do not build next:

- Full optimizer.
- AI-only scheduling.
- Live multi-item execution.
- Smart Probe timeline adjustment.
- Complex drag-and-drop timeline editing.
- Broad UI redesign tied to planner internals.

The first useful product step is not automation. It is trustworthy visibility: "these items can work together", "these items conflict", and "this is what you should watch."

## 14. Acceptance criteria for future first implementation

The first implementation should support deterministic planning and warnings for these scenarios:

- `2 steaks + vegetables`
  - Steaks should stay near serve time.
  - Vegetables can be cooked last or shifted around steak attention windows.
  - Warn if direct-heat attention overlaps.
- `ribs + chicken wings`
  - Ribs should anchor the long indirect phase.
  - Wings should be scheduled later.
  - Warn if indirect or direct zones are overloaded.
- `salmon + asparagus`
  - Both are timing-sensitive.
  - Salmon should not hold warm for long.
  - Asparagus should be treated as quick and flexible.
- `picanha + potatoes`
  - Potatoes can start early and hold if metadata allows.
  - Picanha should receive priority around searing and rest.
  - Warn if the sear phase conflicts with another direct-heat demand.
- `mixed direct/indirect conflict case`
  - Planner should detect zone pressure.
  - Planner should explain the conflict.
  - Planner should suggest shifting the flexible item or changing the serve window.

Minimum quality bar:

- No hardcoded item-specific scheduler branches.
- Canonical English internal types and warning codes.
- Warnings are actionable.
- Confidence is lowered when metadata is missing.
- Existing single-cut plans remain unchanged.

