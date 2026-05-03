# App Flow QA

## Verdict

NEEDS FIXES

The repository-level quality gates (`lint`, `build`, `check`) pass, but integrated app-flow QA shows multiple user-facing regressions across navigation history, i18n consistency, and responsive layout stability.

## Commands run

- `npm run lint` ✅ pass
- `npm run build` ✅ pass
- `npm run check` ✅ pass (`lint + build + qa:cooking + check:ui`)

Notes:

- `qa:cooking`: 1116/1116 combinations passed.
- Repeated npm warning observed: `Unknown env config "devdir"` (non-blocking for this QA run).

## Screens tested

- Home (`?mode=inicio`)
- Cut Selection (`?mode=coccion&step=cut`)
- Cut modal (e.g., `cutId=ribeye`, `cutId=striploin`)
- Details / Plan Configuration (`?mode=coccion&step=details...`)
- Result (`?mode=coccion&step=result...`)
- Live Cooking (`?mode=cocina...`)
- Menu / planning (`?mode=plan`)
- Saved / Guardados (`?mode=guardados`)

Viewports validated:

- Mobile `360x740`
- Mobile `375x812`
- Mobile `390x844`
- Desktop `1280x900`

## Primary flow results

- Home primary CTA: ⚠️ inconsistent; click responsiveness is delayed/intermittent in automation but eventually routes to cooking flow.
- Home secondary CTA: ⚠️ visible; full downstream validation from this entry was not fully completed due broader blocking issues.
- Bottom nav entries: ✅ present and route between modes.
- Cut Selection animal chips and intent chips: ✅ present; core labels render in ES and FI.
- Recommended cuts: ✅ renders, but with mixed-language content (see i18n issues).
- View all / hide full catalog: ✅ functional toggle.
- Cut card click -> modal open: ✅ functional.
- Cut modal close button: ✅ closes modal.
- Cut modal CTA -> details: ✅ functional.
- Browser Back / history behavior for modal: ❌ fails expected behavior (details in navigation section).
- Details -> Result (`Generar plan`): ✅ functional.
- Result -> Start Live Cooking: ⚠️ works, but navigation is not immediate/clear and UI copy quality issues remain.
- Live step progression (`Start cooking` / `Mark step done`): ✅ functional.

## Secondary flow results

- Parrillada / plan mode smoke: ⚠️ mode is reachable, but contains severe language inconsistency (mixed ES/EN/FI).
- Menu mode smoke: ⚠️ reachable; content localization inconsistent.
- Saved plans / Guardados: ✅ reachable; empty-state displayed.
- Share availability: ✅ share action is present on Result screen (full share outcome not deeply validated).
- Language switching ES/EN/FI: ⚠️ selector works, but content leaks across locales.
- Desktop layout smoke: ❌ not centered as expected; narrow mobile shell remains left-aligned.

## Critical issues

1. **Modal/browser back history behavior broken**
  - Expected: modal open should create history entry so Back closes modal and stays on Cut Selection.
  - Observed: `browser_navigate_back` frequently reports no history entry after opening modal via cut cards.
  - Impact: high navigation friction and mismatch with expected mobile back behavior.
2. **Severe i18n leakage in core cooking flow**
  - ES and FI show significant English internal/descriptor strings in cut cards, modal rationale, details, result warnings, and live hints.
  - Examples observed:
    - `buttery soft bite with thin crust and low chew.`
    - `firm beef bite with pink core and crisp fat rim.`
    - `overcooking the lean eye before fat renders`
    - `Do not press the meat — it squeezes out the juices`
  - Impact: trust and clarity degradation in production-facing guidance.
3. **Horizontal overflow / layout instability on mobile**
  - On `375x812` and `390x844`, visible horizontal overflow and extra right-side canvas area appear on Home.
  - Impact: breaks mobile-first layout expectations and introduces navigation/scroll friction.

## Non-critical issues

- Copy quality consistency: mixed tone and language across some labels/cards.
- CTA interaction clarity: some primary actions feel delayed before route changes become visible.

## UX friction

- Back-stack behavior is unpredictable in modal-driven cut exploration.
- Result -> Live transition lacks immediate confidence when state updates are delayed.
- Mixed-language text in critical guidance reduces execution confidence.

## Mobile layout issues

- Horizontal overflow visible at `375x812` and `390x844`.
- Bottom nav remains visible; no hard evidence of critical controls being fully covered in tested states.
- Modal header/close area appears visible and not clipped in tested mobile captures.
- Modal content scroll works in tested states.

## Navigation/back issues

- **Risk area failed**: expected modal back sequence not reliable.
  - Home -> Cut Selection -> open Ribeye modal -> Back should close modal: not reliable (missing history entries).
  - Back again to Home cannot be trusted when first back action is not recorded.
- Open modal -> close -> open another modal works via explicit close/click flow, but browser Back is still unreliable.

## i18n issues

- ES core labels requested in scope are present:
  - `Vaca / Cerdo / Pollo / Pescado / Verduras`
  - `¿Qué buscas?`
  - `Recomendados`
  - `Ver todos los cortes de vaca (N)` pattern
- EN home labels are coherent.
- FI does **not** show Spanish `Lista`; it shows localized `Luettelo` (good).
- However, FI and ES still leak multiple English descriptors/internal strings in cut data and live guidance (high-priority fix).
- Plan/Menu mode in FI still shows broad Spanish content blocks (major inconsistency).

## Result/engine display issues

- Result “critical mistake”/warning copy contains English internal-style phrasing (`overcooking the lean eye before fat renders`) in ES context.
- Did **not** observe the exact blocked labels (`Fatty premium steak`, `Premium steak`, `Fatty steak`) in this run, but similarly non-user-facing internal-style text is still leaking.

## Live Cooking issues

- Rail and execution structure render correctly (direct/indirect/rest chips and step rail present).
- Next-step preview is present (`Up next` row).
- Step progression works (`Start cooking` -> `Mark step done`).
- Major localization issue remains in live hint text (English leakage in ES context).

## Recommended fixes by priority

1. **P0 - Navigation history integrity for cut modal**
  - Ensure opening a cut modal pushes a history entry (not replace-only), so browser/gesture Back closes modal first.
  - Re-validate the exact expected back sequence from the QA brief.
2. **P0 - i18n hardening across cut/result/live data surfaces**
  - Audit descriptor/mistake/hint fields for locale fallbacks and ensure locale-specific user-facing copy is used.
  - Block internal descriptor strings from rendering directly in user UI.
3. **P1 - Fix horizontal overflow on mobile breakpoints**
  - Investigate container width constraints and any `100vw`/fixed-width elements causing right-side overflow on `375x812` and `390x844`.
4. **P1 - Desktop presentation alignment**
  - Ensure centered desktop layout (or intentional max-width behavior) without large empty right-side canvas artifacts.
5. **P2 - CTA response clarity**
  - Validate immediate route/state feedback after primary CTA taps to reduce ambiguity.

## Suggested next agent(s)

- **ENGINE_AGENT + UI_AGENT (paired bugfix pass)** for history/i18n rendering and responsive layout corrections.
- **QA_AGENT follow-up** for strict re-validation of:
  - modal back-stack scenarios,
  - ES/EN/FI leakage matrix on cut/result/live,
  - mobile overflow checks on all required viewports.