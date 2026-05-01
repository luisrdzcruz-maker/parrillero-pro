# Live Cooking QA Report (Final-Final Re-run)

Date: 2026-05-01
Branch: `feature/product-core-data-driven-cuts`
Model/Agent: Codex 5.3

## PASSED

- Gates pass with no blocking errors:
  - `npm run lint` passes (1 warning only, no errors).
  - `npm run build` passes.
- Result stability is validated:
  - Generating from details renders populated result content.
  - Result remains populated after waiting (no collapse observed in this run).
  - Live CTA remains visible on result.
- Result -> Live works:
  - Clicking Start Live Cooking from Result opens `mode=cocina`.
  - URL context is preserved and canonical in tested flow (`animal=beef`, `cutId=ribeye`, `thickness=2`).
- Canonical URL contract remains intact:
  - `animal=beef` stays canonical and is not rewritten to localized labels.
- Live core behavior works:
  - Start cooking begins countdown (`10:00 -> 9:48` observed).
  - CTA advances steps and updates labels dynamically (`Start cooking -> Mark step done -> Flip now`).
  - Completed-step state appears and updates.
- Fail-safe URLs are non-crashing:
  - `/?mode=cocina` loads safely.
  - `/?mode=cocina&animal=Vacuno&cutId=unknown` safely falls back (redirected to safe Live URL) without crash.

## ISSUES FOUND

- **Direct Live Plan fallback still not routing to details**:
  - On direct URL `/?mode=cocina&animal=beef&cutId=ribeye`, pressing `Plan` did not navigate to `mode=coccion` details fallback; URL remained in Live mode.
  - Expected fallback to details with same context is still not met.
- **In-app Back/Forward context consistency is not deterministic**:
  - After details -> result, browser back returned to details but with different context than the just-generated result flow (context drift observed).
  - Forward behavior did not reliably restore the expected paired result state for that same context.
- **Direct URL context switching is only partially verifiable in UI**:
  - Switching `cutId=ribeye -> picanha -> ribeye` updates URL correctly.
  - Live UI shown for direct entries uses highly generic step labels, so cut-specific visible differentiation is limited; this makes strict UI-context verification ambiguous.
- **Live feedback toast not reliably observable in snapshots**:
  - Completion state is visible, but transient feedback appearance/disappearance is still not consistently captured via accessibility snapshots.

## EDGE CASES

- Urgency threshold transitions (`<=15s`, `<=5s`) were not fully crossed in runtime because tested steps were long; countdown/progression behavior is otherwise healthy.
- Reduced-motion runtime emulation was not available in this run, so behavior is inferred from existing implementation plus non-crash observation.
- Animation duration remains `360ms` for `animate-live-enter`; this is above the target range and remains a polish item unless required as a hard gate.

## RISKS

- Missing direct-entry fallback can strand users in Live mode with no deterministic return path to planning details.
- Back/forward context drift across details/result/live can cause confusion and reduce trust in navigation history.
- Generic direct-entry Live UI reduces confidence that URL cut switches are truly reflected in user-visible context.
- Remaining lint warning (`react-hooks/exhaustive-deps`) is non-blocking but can hide future state-sync issues.

## VERDICT

**NEEDS FIXES**

Result stability, canonical URLs, and Result->Live launch are now solid in this run, but production readiness is still blocked by unresolved direct Live fallback behavior and inconsistent back/forward context history.