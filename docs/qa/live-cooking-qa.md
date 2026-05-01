# Live Cooking QA Report (Final Validation)

Date: 2026-05-01
Branch: `feature/product-core-data-driven-cuts`
Model/Agent: Codex 5.3

## PASSED

- Gate checks:
  - `npm run lint` passes (non-blocking warning only).
  - `npm run build` passes.
- Details -> Result URL carries full context:
  - Generated result URL observed as `/?mode=coccion&step=result&animal=beef&cutId=ribeye&doneness=blue&thickness=5`.
  - Contains all expected keys: `mode`, `step`, `animal`, `cutId`, `doneness`, `thickness`.
- Result stability is healthy:
  - Result content remains populated after wait.
  - Live CTA remains visible.
  - No collapse to empty state observed.
- Result -> Live transition works:
  - Live opens in `mode=cocina`.
  - Context remains canonical in URL (`animal=beef`, `cutId=ribeye`).
  - No localized `animal` label leaked into URL.
- Live behavior works:
  - Start cooking starts countdown (`5:00 -> 4:54` observed).
  - CTA updates dynamically (`Start cooking` -> `Mark step done` -> `Flip now`).
  - Completed-step state appears (`Completed` marker shown).
  - No dead clicks or crashes observed in the tested flow.
- Fail-safe behavior works:
  - `/?mode=cocina` loads without crash.
  - `/?mode=cocina&animal=Vacuno&cutId=unknown` safely normalizes to a safe URL (`/?mode=cocina`) and does not crash.

## ISSUES FOUND

- Direct Live fallback is still failing:
  - Starting from direct URL `/?mode=cocina&animal=beef&cutId=ribeye`, pressing `Plan` does not route to details fallback.
  - URL stays in Live mode instead of expected details fallback (or equivalent context-preserving fallback).
- Browser Back/Forward contract from Result is failing in-app:
  - After details -> result generation, browser back could not reliably return to details in the same flow.
  - Browser back was reported as unavailable in one run (`no previous page`) and did not satisfy expected details return behavior.
  - Forward validation is blocked by this failed back-state contract.

## EDGE CASES

- URL source-of-truth sequence was executed exactly:
  - `/?mode=cocina&animal=beef&cutId=ribeye`
  - `/?mode=cocina&animal=beef&cutId=picanha`
  - `/?mode=cocina&animal=beef&cutId=ribeye`
- URLs updated correctly each time; however, direct Live UI is mostly generic, so cut-specific visual differentiation is limited in this surface.
- Because direct Live UI does not expose strong cut-specific labels, stale session text could not be fully disproven visually beyond URL/state transitions.

## RISKS

- Users entering Live directly can get trapped without deterministic fallback to details/planning context.
- Broken back-stack behavior on result/live transitions can reduce trust and make recovery flows brittle.
- Limited cut-specific visibility on direct Live screens makes context correctness harder to verify manually without additional debug/state surface.

## VERDICT

**NEEDS FIXES**

Core generation, URL context on Result, Live runtime behavior, and fail-safe handling are stable, but release should remain blocked until direct Live `Plan/back` fallback and Back/Forward contract are fixed.