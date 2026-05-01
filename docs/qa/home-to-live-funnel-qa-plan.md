# Home -> Live Funnel QA Plan

Date: 2026-05-01
Branch: `feature/home-conversion-and-funnel`
Model/Agent: Codex 5.3

## Scope

Validate the full mobile-first funnel from Home to Live cooking, including canonical URL behavior, state persistence, and fail-safe routing.

## Preconditions

- Run in a clean browser session (new tab/incognito recommended).
- Use mobile viewport during execution unless a test explicitly says otherwise.
- Ensure no stale query parameters are manually injected before starting smoke flow.
- Confirm the app opens at Home (`/?mode=inicio` or equivalent Home entry URL).

## Smoke Test (Primary Funnel)

Execute this flow in order:

1. Home loads.
2. `Start cooking` opens Cut Selection.
3. Select a cut opens Details.
4. Generate result from Details.
5. Result remains populated (no empty/fallback collapse after short wait).
6. `Start Live` opens Live.
7. `Plan` in Live returns to Details.

Expected outcomes:

- No crashes, blank screens, or dead buttons.
- Result data remains visible and actionable before entering Live.
- Returning with `Plan` preserves the active context.

## Core Cuts Coverage

Run the complete smoke flow for each cut below:

- `ribeye`
- `picanha`
- `chicken_breast`
- `salmon_fillet`
- `asparagus`

For each cut, capture:

- Entry URL into Details.
- Result URL after generation.
- Live URL after `Start Live`.
- URL after `Plan` returns to Details.

## URL Contract Checks

Validate on Details, Result, and Live URLs where applicable:

- Canonical `animal` values only (no localized terms).
- Use `cutId` key (never `cut`).
- Do not include localized labels in query params.
- `thickness` hydrates correctly when present.
- `doneness` is preserved where available for that cut.

Expected:

- URLs remain deterministic, shareable, and context-complete.
- No localized strings leak into URL state.

## Viewport Checks (Mobile)

Validate at mobile viewport for:

- Home layout and CTA visibility.
- Cut Selection usability and tappable options.
- Result readability and CTA visibility.
- Live view with critical info visible without requiring scroll for first decision loop.

Expected:

- Primary actions are visible and usable without layout breakage.
- Critical Live guidance is immediately accessible.

## Fail-Safe Checks

Validate graceful behavior for:

- Invalid `cutId`.
- Missing `animal`.
- Direct Details URL access.
- Direct Live URL access.

Expected:

- No crash.
- App either normalizes to a safe canonical state or renders valid recovery UI.
- Recovery path still allows the user to continue the funnel.

## Evidence Capture Checklist

For each tested cut and fail-safe case, capture:

- Initial URL and final URL.
- One screenshot per major step (Home, Cut Selection, Details, Result, Live).
- Any mismatch between expected and actual state.
- Console/network anomalies only if they correlate with visible behavior.

## Pass/Fail Template

Copy this block per run:

```md
# Home -> Live Funnel QA Report

Date:
Branch:
Tester:
Viewport:

## Overall Verdict
- PASS / FAIL:

## Smoke Flow
- Home loads: PASS/FAIL
- Start cooking -> Cut Selection: PASS/FAIL
- Select cut -> Details: PASS/FAIL
- Generate result: PASS/FAIL
- Result remains populated: PASS/FAIL
- Start Live -> Live: PASS/FAIL
- Plan -> Details: PASS/FAIL

## Core Cuts
- ribeye: PASS/FAIL + notes
- picanha: PASS/FAIL + notes
- chicken_breast: PASS/FAIL + notes
- salmon_fillet: PASS/FAIL + notes
- asparagus: PASS/FAIL + notes

## URL Contract
- Canonical animal: PASS/FAIL + notes
- cutId key (not cut): PASS/FAIL + notes
- No localized labels: PASS/FAIL + notes
- Thickness hydration: PASS/FAIL + notes
- Doneness preserved where available: PASS/FAIL + notes

## Viewport (Mobile)
- Home: PASS/FAIL + notes
- Cut Selection: PASS/FAIL + notes
- Result: PASS/FAIL + notes
- Live critical info no-scroll: PASS/FAIL + notes

## Fail-Safe
- Invalid cutId: PASS/FAIL + notes
- Missing animal: PASS/FAIL + notes
- Direct details URL: PASS/FAIL + notes
- Direct live URL: PASS/FAIL + notes

## Defects
- [ID/Title] Severity | Steps | Expected | Actual | URL | Screenshot

## Risks / Follow-ups
- ...
```

## Exit Criteria

- PASS only if smoke flow passes for all core cuts and no critical URL contract violations exist.
- FAIL if any blocking navigation/state regression, canonical URL violation, or unrecoverable fail-safe behavior is found.
