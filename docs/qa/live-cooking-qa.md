# Live Cooking QA Report (Final Validation After Navigation Contract)

Date: 2026-05-01
Branch: `feature/product-core-data-driven-cuts`
Model/Agent: Codex 5.3

## PASSED

- Gate checks:
  - `npm run lint` passes with one existing warning only (`react-hooks/exhaustive-deps` in `app/page.tsx`).
  - `npm run build` passes.
- Direct Live fallback now works with canonical context:
  - Opened `/?mode=cocina&animal=beef&cutId=ribeye`.
  - Pressed `Plan`.
  - After short async delay, URL transitioned to `/?mode=coccion&step=details&animal=beef&cutId=ribeye`.
- Result stability is healthy:
  - Result remains populated after wait.
  - Live CTA remains visible.
  - No collapse to empty state observed.
- Result -> Live works and preserves canonical context:
  - From result, clicking `Start Live Cooking` opens `mode=cocina`.
  - Observed URL: `/?mode=cocina&animal=beef&cutId=ribeye&thickness=2`.
  - `animal` remained canonical (`beef`), never localized in URL.
- Live runtime core behavior works:
  - Start cooking starts countdown (`5:00 -> 4:53` observed).
  - CTA updates dynamically (`Start cooking` -> `Mark step done` -> `Flip now`).
  - Completed-step state appears (`Completed` marker shown).
  - No dead clicks observed in runtime step actions.
- Fail-safe behavior works:
  - `/?mode=cocina` loads without crash.
  - `/?mode=cocina&animal=Vacuno&cutId=unknown` safely normalizes to `/?mode=cocina` without crash.

## ISSUES FOUND

- Details -> Result browser history contract is still broken (critical):
  - Started from details URL with ribeye context and generated result.
  - Expected browser back target: details.
  - Actual behavior in clean tab: `browser_navigate_back` reports no previous history entry.
  - This means the expected `details <-> result` back/forward pair is not present in history.
- Result URL is missing one expected context key:
  - Observed result URL after generation: `/?mode=coccion&step=result&animal=beef&cutId=ribeye&thickness=2`.
  - `doneness` was not preserved in URL in this run.

## EDGE CASES

- URL source-of-truth switching executed:
  - `/?mode=cocina&animal=beef&cutId=ribeye`
  - `/?mode=cocina&animal=beef&cutId=picanha`
  - `/?mode=cocina&animal=beef&cutId=ribeye`
- URL updates were correct and canonical in all switches.
- Direct Live surface remains mostly generic across cuts, so visual differentiation is limited even when URL context changes correctly.

## RISKS

- Missing browser history pairing between details/result breaks expected user recovery and navigation trust.
- Forward validation is blocked by absent back entry (this is app behavior, not an automation limitation in this run).
- Missing `doneness` in result URL can weaken strict context reproducibility/shareability.

## VERDICT

**NEEDS FIXES**

Navigation fallback, Live runtime, fail-safe handling, and Result -> Live transition are stable. Release should remain blocked until the Details -> Result history contract is fixed (back/forward parity) and result URL context preservation includes all required keys (notably `doneness`).