# PR Types

Date: 2026-05-04  
Scope: Parrillero Pro / AI Grill Master Pro pull request boundaries.

## Purpose

Each PR should have one primary type. The type controls what the PR may touch, which agents can work safely in parallel, and which validation is required.

If a change needs multiple PR types, split it unless the overlap is small, explicit, and necessary.

## UI-Only PR

Purpose:

- Improve layout, components, visual hierarchy, responsive behavior, or user-facing presentation.

Allowed:

- React components in `app` and `components`.
- Design tokens and UI constants in `lib/design-system` or equivalent.
- CSS classes, variants, visual states, accessibility labels, and layout wrappers.
- Documentation or QA notes for the UI change.

Not allowed:

- Cooking engine calculations.
- Cut profile semantics or planning data.
- URL state contracts unless the task is explicitly navigation UI.
- Package scripts or infrastructure.
- Large component rewrites unrelated to the requested screen.

Required validation:

- Mobile viewport smoke test for touched screens.
- Desktop centered layout check.
- CTA visibility and bottom nav overlap check.
- `npm run lint` when feasible.

## Engine-Only PR

Purpose:

- Change deterministic cooking logic, planning logic, safety rules, timings, doneness behavior, or future multi-cut planning rules.

Allowed:

- Engine modules, planning helpers, cooking types, deterministic rule config.
- Engine QA scripts and snapshots.
- Data contract updates required by the engine change.
- Documentation explaining changed cooking behavior.

Not allowed:

- UI redesign.
- Decorative copy or layout changes.
- Localized display text inside engine modules.
- Hardcoded per-cut behavior when a profile/config field can model the rule.

Required validation:

- Engine QA scripts or snapshots for representative cuts.
- Safety review for target temperatures, rest, doneness, and warnings.
- Regression check for at least one beef, poultry, fish, and vegetable flow when applicable.

## Data-Only PR

Purpose:

- Add or correct cut metadata, translations, setup visual mappings, safety profiles, planning profiles, or future multi-cut metadata.

Allowed:

- Data/config files.
- Translation files.
- Validation scripts or fixtures directly related to data completeness.
- Documentation of new required fields.

Not allowed:

- UI layout changes.
- Engine behavior changes not driven by the declared data contract.
- New package scripts unless already approved.
- Unvalidated bulk data edits.

Required validation:

- Data completeness checks where available.
- At least one manual result flow for changed cut categories.
- Translation fallback review.
- No localized labels in internal IDs.

## Script-Only PR

Purpose:

- Add or improve development, QA, data validation, generation, or audit scripts.

Allowed:

- Scripts and script-specific tests.
- Script docs and usage examples.
- Fixtures used only by scripts.

Not allowed:

- App runtime behavior.
- UI changes.
- Cooking behavior changes unless the script is only validating existing logic.
- Package script changes unless the task explicitly includes them.

Required validation:

- Run the script against a small representative input.
- Confirm generated output is deterministic or intentionally ignored.
- Document command, expected output, and failure behavior.

## Navigation-Only PR

Purpose:

- Change URL/query state, app modes, browser back behavior, direct-link hydration, bottom navigation, or swipe/back behavior.

Allowed:

- Navigation helpers, URL serialization/parsing, app mode transitions.
- Router usage in affected components.
- Navigation contract documentation and QA plans.

Not allowed:

- Cooking calculations.
- Broad UI redesign.
- Data model changes unrelated to route state.
- Localized route state values.

Required validation:

- Direct URL entry for Home, Cut Selection, Details, Result, Live Cooking, Saved, and menu-related modes when relevant.
- Browser back and forward behavior.
- Language preservation across navigation.
- Animal filter replace behavior versus cut/detail/result push behavior.

## Infra-Only PR

Purpose:

- Change build, deployment, CI, linting, dependency management, or hosting configuration.

Allowed:

- CI config, Vercel config, lint/build config, package metadata when explicitly required.
- Infrastructure documentation.
- Minimal code changes only if needed to satisfy the infra change.

Not allowed:

- Product behavior changes hidden inside infra work.
- UI redesign.
- Cooking engine logic.
- Data migrations not required by the infra change.

Required validation:

- Local build or the closest available equivalent.
- CI status review.
- Deployment preview smoke test when available.
- Rollback notes for risky deployment changes.

## Mixed PR Rule

A mixed PR is allowed only when:

- The user explicitly requested an end-to-end change.
- The PR lists every touched layer.
- The validation plan covers every touched layer.
- The final report calls out why the work was not split.

Default to smaller PRs when parallel agents are involved.
