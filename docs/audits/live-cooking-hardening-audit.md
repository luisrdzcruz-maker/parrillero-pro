# Live Cooking Hardening Audit

## Verdict

NEEDS HARDENING BEFORE TRUSTING LIVE AS EXECUTION SOURCE

The current Live Cooking flow is visually strong and functional, but it still relies on permissive fallbacks and heuristic step parsing that can show a plausible flow even when payload context is missing or mismatched. The highest risk is confidence drift: users can land in Live mode with mock/default steps that look valid.

## 1) Current Live Cooking structure

Primary runtime path:

1. `app/page.tsx` enters `mode === "cocina"` and renders `LiveCookingScreen`.
2. On Live entry, it reads URL context with `parseLiveParams()` and session payload via `readLiveCookingPayload()`.
3. It validates payload against URL context (`doesPayloadMatchLiveUrlContext`), then builds steps with `buildLiveStepsFromPayload(...)`.
4. If payload is missing/invalid/mismatched, it falls back to `MOCK_LIVE_STEPS`.
5. `LiveCookingScreen` renders:
  - `LiveHeader`
  - `LiveTimer` + `LiveTimeline`
  - `LiveStepCard`
  - `LiveNextStepPreview`
  - fixed bottom primary CTA bar

## 2) How Result hands off to Live Cooking

Main handoff path:

- `components/cooking/CookingWizard.tsx` (`handleStartCooking`) creates and saves session payload:
  - `createLiveCookingPayload(...)`
  - `saveLiveCookingPayload(payload)`
- Then it navigates with `buildLiveUrl(...)` including `mode=cocina` plus animal/cut/doneness/thickness/lang.

Secondary handoff path:

- `app/page.tsx` (`startSavedCookLive`) rebuilds plan from saved data, saves payload, then navigates to Live URL similarly.

Bypass path:

- Bottom nav/home header can navigate directly to Live using `buildLiveUrl({ lang })` (no cut context), which triggers fallback behavior.

## 3) Active payload assumptions

Current assumptions in `lib/liveCookingPlan.ts` and `app/page.tsx`:

- Payload lives only in `sessionStorage` (`parrillero_live_cooking_plan_v1`).
- Payload version must be `1`; otherwise ignored.
- Payload/URL context must match on:
  - animal
  - cut id
  - doneness (if present in payload)
  - thickness (if required for cut)
  - lang
- If URL has no `cutId`, payload is considered non-matching.
- Step extraction assumes `PASOS` or `STEPS` block is present/parsable.
- Durations/zone/temp are inferred from text heuristics when not explicit.

Risk notes:

- Opening Live without `cutId` always drops payload and falls back.
- Payload mismatch silently clears session storage.

## 4) Timer/progression behavior

Observed behavior:

- Live initializes paused (`livePaused = true`) until user taps primary CTA ("Start cooking").
- Active timer ticks every second while not paused.
- On timed step end (`remaining=0`), auto-advance to next step after ~1.2s.
- Manual steps (`duration=0`) are progressed only through primary CTA.
- Timeline segment taps allow jump-to-step only after start.
- Last step completion sets remaining to `0` and marks cook complete.

Risks:

- No explicit visible pause/resume control in current Live surface (state exists, control not exposed).
- Auto-advance can move too quickly for confirmation-sensitive steps.
- Right-swipe previous-step path exists in component but parent does not pass `onPreviousStep`.

## 5) Empty/missing payload behavior

Current behavior is permissive:

- Missing payload -> fallback to `MOCK_LIVE_STEPS`.
- Invalid payload -> fallback to `MOCK_LIVE_STEPS`.
- Mismatched payload vs URL -> payload cleared from session and fallback used.

Impact:

- User still sees a polished Live flow even when there is no valid plan context.
- "No active plan" screen in `LiveCookingScreen` is effectively unreachable in normal app path because fallback always provides steps.

## 6) Mobile UX risks

1. Main Live layout uses `overflow-hidden` and fixed CTA bar; long instructions are truncated with line clamps in `LiveStepCard`.
2. Core instructions cannot scroll if content exceeds available height.
3. Header and chips are compact; long localized labels can compress critical readability.
4. Gesture behavior can be inconsistent:
  - left swipe completes step
  - right swipe previous step currently does nothing (no handler wired from parent)

## 7) Bottom nav overlap risks

Current state:

- Global app bottom nav is not rendered in Live mode (`mode === "cocina"` returns early in `app/page.tsx`), so direct overlap is currently avoided.
- Live uses its own fixed bottom CTA bar with safe-area padding.

Residual risks:

- Safe-area handling is present but tight; very small viewports can still feel vertically constrained.
- Any future refactor that renders global bottom nav in Live would likely cause immediate overlap/conflict.

## 8) i18n/copy risks

1. Live UI copy source is split:
  - `texts.ts` has app mode labels
  - core Live strings come from `getLiveText()` in `surfaceFallbacks.ts`
2. Potential drift between `texts.ts` and surface fallback copy.
3. Non-ASCII was intentionally avoided in some fallback strings, reducing readability quality in ES/FI.
4. Several Live-adjacent components in `components/live/*` contain hardcoded Spanish copy (for example `StepCard`, `TimerDial`, `liveVisualGuide`) and may regress if reused.

## 9) Safety/clarity risks

1. Heuristic parsing can infer wrong zone/duration from ambiguous step text.
2. `hh:mm` parsing is interpreted as `mm:ss`, which can misread plan content.
3. Temperature parsing only looks for `°C`; other formats are ignored.
4. Fallback-to-mock flow can hide missing plan integrity issues from users.
5. Live confidence can exceed data confidence (UI certainty > payload certainty).

## 10) Recommended QA checklist

Handoff and payload integrity:

- Start Live from Result with valid plan: steps/context match selected cut and doneness.
- Start Live from saved plan: same verification.
- Open Live from nav without cut context: verify expected behavior and messaging (not silent mock confidence).
- Tamper URL (animal/cut/doneness/thickness/lang): verify mismatch handling and user clarity.

Progression/timer:

- First CTA starts timer from paused state.
- Timed step counts down correctly and auto-advances once.
- Manual step does not auto-advance and requires explicit action.
- Last step correctly reaches completed state.
- Timeline tap jump works only after start and lands on correct step/time state.

Mobile execution:

- Verify readability on small viewport heights (e.g., 667px and below).
- Ensure key instruction text remains accessible and not over-truncated.
- Confirm CTA remains tappable with safe-area insets.
- Confirm swipe gestures do not accidentally skip critical steps.

Copy/i18n:

- ES/EN/FI parity for all active Live labels and CTA text.
- Zone labels and feedback strings are consistent with selected language.
- No mixed-language fragments in notes/context after payload localization.

Safety:

- Validate temperature parsing behavior when step text lacks `°C`.
- Validate duration parsing on `mm:ss`, natural language minutes, and ambiguous formats.
- Confirm warnings/hints remain actionable and not generic.

## 11) Suggested non-invasive fixes

1. Add explicit "strict live" guard:
  - if payload missing/invalid/mismatch, show plan-required state instead of full mock flow.
2. Keep fallback only for internal/dev or clearly labeled demo mode.
3. Add visible pause/resume control to match existing `livePaused` state model.
4. Wire `onPreviousStep` in `app/page.tsx` or remove inactive swipe-back behavior to avoid false affordance.
5. Add lightweight telemetry for fallback entry reason (`missing_payload`, `mismatch`, `parse_empty_steps`).
6. Centralize Live copy ownership (single source) and align `texts.ts` references where needed.
7. Add a "payload confidence badge" (plan-backed vs fallback) for QA/debug environments.

## 12) What not to touch

Do not change in hardening pass:

- Core cooking engine logic (`generateLocalCookingPlan`, engine rules).
- Global navigation architecture beyond Live-specific guardrails.
- Result screen visual hierarchy unrelated to Live payload integrity.
- Any broad UI refactor in non-Live modes.
- Data model versions unless strictly required for payload validation patch.

## Implementation focus for next agent

Priority order:

1. Payload integrity gating before Live render.
2. Timer control clarity (explicit pause/resume and progression consistency).
3. Mobile readability under fixed CTA constraints.
4. i18n source-of-truth cleanup for active Live copy only.