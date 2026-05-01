# Live Cooking QA Report (Re-run)

Date: 2026-05-01
Branch: `feature/product-core-data-driven-cuts`
Model/Agent: Codex 5.3

## PASSED

- Validation gates pass: `npm run lint` and `npm run build` both complete successfully.
- Direct Live URL works and keeps canonical animal id unchanged: `/?mode=cocina&animal=beef&cutId=ribeye` stays with `animal=beef` (no rewrite to localized labels).
- Missing/invalid params are fail-safe and non-crashing:
  - `/?mode=cocina` loads Live safely.
  - `/?mode=cocina&animal=Vacuno&cutId=unknown` safely falls back without crashing.
- URL/UI step sync for direct mode checks is correct:
  - `?mode=coccion&step=details...` renders details controls.
  - `?mode=coccion&step=result...` renders result view (not details controls).
- Live timer and progression core behavior works:
  - `Start cooking` starts countdown (`5:00 -> 4:49` observed) and progress increments (`0% -> 1%`).
  - CTA advances steps and updates labels dynamically (`Start cooking -> Mark step done -> Flip now -> Rest now` observed).
  - Completed step state is shown and updates as steps are completed.
- No crashes observed during tested navigation and flow transitions.

## ISSUES FOUND

- **Result screen state regression after generation**: after generating a plan, the rich result with Live CTA appears briefly and then collapses into an empty result state (`El resultado aparecerá aquí.`), removing the `Start Live Cooking` action. This blocks reliable Result -> Live entry validation in normal user flow.
- **Back navigation from result not working as expected**: after details -> result transition, browser back did not return to details in-browser (`browser_navigate_back` reported no previous page). This does not satisfy the expected "back from result returns to details when history exists" behavior.
- **Direct-entry Live back fallback still missing**: on a fresh direct Live URL tab, pressing `Plan` leaves URL unchanged and does not navigate away (no fallback route when history is missing).
- **Entry animation duration still above target**: `.animate-live-enter` remains `360ms` in `app/globals.css`, outside the requested `150-250ms` range.

## EDGE CASES

- Urgency threshold verification (`<=15s`, `<=5s`) and timeout auto-advance were not fully runtime-verified due long step durations in tested plans; core logic paths are present but full threshold crossing was not observed in-session.
- Feedback toast visibility/disappearance could not be reliably captured from accessibility snapshots, although step completion states and transitions updated correctly.
- Reduced motion behavior is implemented in code/CSS, but explicit browser media emulation was not available in this QA run.

## RISKS

- The transient result-state collapse can prevent users from launching Live Cooking from result, degrading conversion into the core live experience.
- Missing/weak history fallback paths can strand users in Live or break expected backward flow.
- Navigation regressions around history handling can reintroduce URL/UI trust issues, even with canonical param fixes already in place.
- Longer-than-target motion timing can still affect perceived responsiveness on mobile.

## VERDICT

**NEEDS FIXES**

Core fixes for lint and canonical URL behavior are in place and validated, but production readiness is blocked by result-state instability and unresolved back-navigation/fallback behavior.