# Definition of Done

Date: 2026-05-04  
Scope: Parrillero Pro / AI Grill Master Pro development, QA, and agent work.

## Purpose

A change is done only when it improves the product without weakening cooking trust, mobile execution, navigation stability, localization, or future data scalability.

Use this checklist before marking any task, PR, or agent run complete.

## Technical Checks

- The app starts locally without new runtime errors.
- TypeScript, lint, and build checks pass when relevant to the change.
- Existing tests, QA scripts, or snapshots pass when the touched area has coverage.
- No unrelated app code, package scripts, generated files, or lockfiles changed unless the task required it.
- No console errors appear in the primary user flow touched by the change.
- New shared helpers, components, or contracts are named with canonical English identifiers.
- No duplicated logic was introduced where an existing helper, token, profile, or engine contract should be used.

Recommended commands:

```bash
npm run lint
npm run build
```

Run deeper QA only when the change touches the related area:

- Engine or data: cooking QA scripts, deterministic output snapshots, representative cut checks.
- Navigation: browser back, direct URL, query param hydration, language preservation.
- i18n: language switch smoke test and missing translation scan if available.
- UI: mobile viewport and desktop centered layout smoke test.

## Product Checks

- The change helps the user decide, understand, or execute.
- The flow remains fast and practical for a real cooking session.
- Result and Live Cooking continue to prioritize timing, temperature, rest, setup, warnings, and next action.
- AI remains an enhancement only. Core cooking behavior remains deterministic unless the task explicitly changes AI behavior.
- Future multi-cut planning is not blocked by hardcoded single-cut assumptions.
- Smart Probe Live expectations are not implied unless the feature is actually implemented.

## UX Checks

- Mobile-first layout remains usable at common phone widths.
- Primary CTA remains visible and tappable in the relevant screen.
- Bottom navigation does not overlap important content or controls.
- The premium dark shell feels integrated and not like disconnected page sections.
- Visual density follows screen rules:
  - Home: low clutter, one strong start action, no top hero photo.
  - Cut Selection: scannable cards, icons/tags first, selective thumbnails only.
  - Result: summary first, one useful setup visual when applicable, no repeated cards.
  - Live Cooking: functional controls only, no decorative imagery.
- Warnings are visible, actionable, and severity-appropriate.

## i18n Checks

- User-facing strings go through the i18n layer.
- Internal IDs, enum values, URL params, and engine keys remain canonical English.
- No localized labels are stored in cooking logic, URLs, or persisted planning state.
- Language changes preserve the current cooking context where possible.
- Missing translations fall back predictably without mixing languages in the same UI block.
- New copy is short enough for mobile layouts in English, Spanish, and Finnish.

## Architecture Checks

- UI, navigation, data, and cooking engine logic remain separated.
- Cooking rules are data-driven when possible and are not hardcoded by `cutId` inside React components.
- New data fields belong in typed profiles or config, not scattered UI conditionals.
- New UI patterns reuse design tokens, reusable components, or controlled variants.
- Changes have a small blast radius and do not perform broad vague refactors.
- Public contracts are documented when behavior spans agents, modules, or future work.

## Safety Checks

- Food safety warnings, target temperatures, rest guidance, and doneness behavior were not weakened.
- Critical warnings stop or redirect unsafe action when appropriate.
- No secrets, `.env` files, credentials, or private tokens were read or edited.
- No destructive git commands were used.
- Existing user work in the repository was not reverted.
- No direct push to `main`.

## Required Final Report Format For Agents

Use this format at the end of every implementation task:

```md
## Files Changed
- `path/to/file`: short purpose

## What Changed
- User-facing or behavioral summary.

## Validation
- Commands run and result.
- Manual QA performed.
- Checks not run, with reason.

## Risks / Follow-ups
- Remaining risk, known limitation, or none.

## Assumptions
- Any product, data, or technical assumption made during the change.
```

For documentation-only tasks, replace `Files Changed` with `Files Created` when appropriate.
