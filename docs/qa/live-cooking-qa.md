# Live Cooking QA Report

Date: 2026-05-01
Branch: `feature/product-core-data-driven-cuts`
Model/Agent: Codex 5.3

## PASSED

- Direct Live entry works without crash for `/?mode=cocina&animal=beef&cutId=ribeye` and renders the Live screen with step/timer/CTA UI.
- Fail-safe rendering works for missing/invalid/partial params (`?mode=cocina`, invalid animal/cut, partial animal-only): app falls back safely instead of crashing.
- Countdown runs in live mode after pressing `Start cooking` (observed `5:00 -> 4:53`) and progress updates (`0% -> 1%`).
- Manual step completion works: CTA advances step index and updates step/progress context (observed `Step 1 -> Step 2`, progress to `17%`, completed list visible).
- CTA label changes dynamically during progression (observed `Start cooking -> Mark step done -> Flip now`) and CTA clicks are functional (no dead click on tested paths).
- Production build passes (`npm run build`).

## ISSUES FOUND

- **Lint gate failing**: `npm run lint` fails with `react-hooks/set-state-in-effect` in `components/live/LiveCookingScreen.tsx` (setState called synchronously inside effect). This blocks clean CI quality gating.
- **URL normalization regression in Live mode**: entering `animal=beef` gets rewritten client-side to `animal=Vacuno` (localized label). This creates inconsistent URL contracts and can break deep-link stability/analytics assumptions.
- **Navigation/state desync risk**: in repeated wizard/result navigation, URL reported `?mode=coccion&step=result` while UI intermittently rendered details-step controls. This indicates URL/state mismatch under real navigation flow.
- **Back button behavior on direct Live entry**: top-left `Plan` button can no-op when history stack has no previous route. No fallback navigation is provided in that case.
- **Microinteraction timing mismatch with target**: root live entry animation is `360ms` (`animate-live-enter`) which exceeds requested `150-250ms` transition target.

## EDGE CASES

- Urgency thresholds (`<=15s`, `<=5s`) and timeout auto-advance were validated by code path and partial runtime only; full long-duration runtime confirmation was limited by step durations.
- Zero/missing-duration behavior is handled by implementation (`duration <= 0` renders manual-step UI), but full browser runtime coverage for all generated payload variants was not exhaustive.
- Reduced motion path is implemented (`prefers-reduced-motion` checks and CSS `@media (prefers-reduced-motion: reduce)`), but explicit browser-level media emulation was not available in this run.
- No server crashes were observed for tested routes; local server returned HTTP 200 for all tested live URL variants.

## RISKS

- URL contract drift (`animal` id vs localized label) can cause brittle deep links and inconsistent behavior across reload/share/navigation.
- URL/UI desynchronization may produce user confusion and hard-to-reproduce regressions (especially after rapid navigation or history events).
- Current lint error can block release pipelines and indicates a potential render-loop/perf smell around Live step transitions.
- Animation durations above target can hurt perceived responsiveness on mobile and conflict with QA acceptance criteria.

## VERDICT

**NEEDS FIXES**

Live Cooking is broadly functional for core interactions, but navigation/URL consistency issues plus lint gate failure are release blockers for production confidence.