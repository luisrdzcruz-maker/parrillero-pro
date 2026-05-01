# Live Cooking QA Report (Final Re-run)

Date: 2026-05-01
Branch: `feature/product-core-data-driven-cuts`
Model/Agent: Codex 5.3

## PASSED

- Gates pass with no blocking errors:
  - `npm run lint` passes (1 warning only, no errors).
  - `npm run build` passes.
- Result stability improved and validated:
  - Generating from details now renders a populated result.
  - Result remains populated after waiting (no collapse to empty state observed).
  - Live CTA remains visible on result during stability checks.
- Result -> Live works:
  - Clicking Start Live Cooking from Result opens Live mode (`mode=cocina`).
  - Context is preserved in URL for tested flow (`animal=beef`, `cutId=lomo_alto`, `thickness=5`).
- Canonical URL contract validated:
  - `animal=beef` remains `animal=beef` (no rewrite to localized labels).
- Live behavior core works:
  - Start cooking starts countdown (`10:00 -> 9:52` observed).
  - CTA advances steps and labels update dynamically (`Start cooking -> Mark step done -> Flip now`).
  - Completed-step state appears and updates correctly.
- Fail-safe URLs are non-crashing:
  - `/?mode=cocina` loads safely.
  - `/?mode=cocina&animal=Vacuno&cutId=unknown` safely falls back to non-crashing Live state.

## ISSUES FOUND

- **Direct Live fallback still missing**:
  - On direct URL `/?mode=cocina&animal=beef&cutId=ribeye`, pressing `Plan` does not navigate to details fallback and URL remains unchanged.
  - Expected fallback (`/?mode=coccion&step=details&animal=beef&cutId=ribeye` or equivalent) is not happening.
- **Back navigation from Result remains inconsistent**:
  - In details -> result scenarios, browser back did not reliably return to details with same context; history sometimes returned to prior Live state instead.
  - Forward verification is therefore also inconsistent and not reliably proving details/result history pairing.
- **Direct URL context leakage from previous session payload**:
  - Opening `/?mode=cocina&animal=beef&cutId=ribeye` can still render prior-plan content (example observed: Lomo alto/blue in live context text), indicating session payload precedence over URL context for displayed plan content.
- **Live feedback message not verifiable via snapshot**:
  - Completed-state updates are visible, but the transient feedback toast/message could not be consistently captured in accessibility snapshots.

## EDGE CASES

- Urgency threshold transitions (`<=15s`, `<=5s`) were not fully crossed in runtime due long step durations; timer progression and CTA flow are otherwise healthy.
- Reduced-motion runtime emulation was not available in-browser in this run; no crash indicators seen in normal motion path.
- Animation duration remains `360ms` for `animate-live-enter`; this is above the 150-250ms target but treated as polish/non-blocking unless product requires strict threshold.

## RISKS

- Missing direct-entry fallback can trap users in Live with no reliable route back to planning.
- Inconsistent history behavior (details/result/live) risks user confusion and regression in multi-step workflows.
- URL-context vs session-payload mismatch can reduce trust in direct links and shared URLs.
- Remaining lint warning (`react-hooks/exhaustive-deps`) is not blocking but can hide future state-sync regressions if left unresolved.

## VERDICT

**NEEDS FIXES**

Major blockers from previous run are improved (result stability and Result->Live launch), but production readiness is still blocked by unresolved direct Live fallback and inconsistent back/history behavior.