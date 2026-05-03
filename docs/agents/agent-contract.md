# Agent Contract

Date: 2026-05-04  
Scope: Operating contract for Cursor agents working on Parrillero Pro / AI Grill Master Pro.

## Purpose

Agents should make focused, verifiable changes that preserve the cooking decision engine, premium mobile UX, URL-backed navigation, i18n discipline, and future data-driven planning direction.

This contract can be pasted into future Cursor prompts.

## Standard Scope Section

Every agent task should begin with a scope block:

```md
## Scope
Task type:
Primary files or folders:
Allowed layers:
Forbidden layers:
Expected validation:
Definition of done:
```

Example:

```md
## Scope
Task type: UI-only
Primary files or folders: `components/cuts`, `app/page.tsx`
Allowed layers: React layout, visual hierarchy, design tokens
Forbidden layers: cooking engine, data profiles, package scripts
Expected validation: lint, mobile smoke test, CTA visibility check
Definition of done: no navigation or cooking behavior changes
```

## Forbidden Changes

Agents must not:

- Touch `.env`, secrets, credentials, or private tokens.
- Push directly to `main`.
- Delete files without explicit user permission.
- Revert user changes unless explicitly requested.
- Perform broad vague refactors.
- Mix UI redesign with engine behavior changes unless the task explicitly requires it.
- Store localized labels in URLs, engine state, data IDs, or persisted planning state.
- Put display copy inside cooking logic.
- Add decorative visuals that do not help decide, understand, or execute.
- Add hardcoded cut-specific heuristics in React components.
- Change package scripts unless explicitly requested.
- Claim tests passed unless they were actually run.

## Required Validation

Agents must choose validation based on the touched layer:

- UI: mobile viewport, desktop centered layout, CTA visibility, bottom nav overlap, visual density.
- Engine: deterministic QA, representative cut coverage, safety review, snapshots when available.
- Data: required fields, translations, setup visual keys, internal English IDs, validation script if available.
- Navigation: direct URLs, browser back/forward, language preservation, query param canonicalization.
- i18n: missing keys, fallback behavior, no mixed-language UI blocks.
- Infra: lint/build/CI/deploy preview as applicable.
- Documentation-only: file existence, spelling/structure scan, no app code changes.

If validation cannot be run, the final response must say why.

## Required Final Response Format

Use this format:

```md
## Files Changed
- `path/to/file`: purpose

## Key Changes
- Short bullets focused on user or developer impact.

## Validation Performed
- Command or manual check: PASS/FAIL/not run with reason.

## Risks / Assumptions
- Remaining risks, assumptions, or none.

## Next Suggested Step
- One concrete follow-up only when useful.
```

For documentation-only work, use `Files Created`.

## Rules For Parallel Agents

- Each parallel agent must have a different PR type, folder boundary, or clearly isolated file list.
- One agent owns final integration and conflict review.
- Agents must not edit the same file at the same time unless one is read-only.
- Engine and UI agents can run in parallel only when the engine contract is stable and the UI consumes existing outputs.
- Data and engine agents can run in parallel only when the data fields are already documented or one agent is read-only.
- Navigation changes should not run in parallel with UI changes on the same screen unless ownership is explicit.
- QA agents should run after implementation agents or in read-only mode against a stable branch.
- Final integration must re-run relevant checks after merging agent outputs.

## Small Blast Radius Rule

Prefer changes that are:

- Narrow in file count.
- Easy to review.
- Easy to revert.
- Tied to one product outcome.
- Covered by a clear validation path.

Avoid requests like:

- "Clean up the app."
- "Refactor the flow."
- "Improve all UI."
- "Make the engine smarter."

Rewrite broad requests into scoped work:

```md
Improve the Result summary card hierarchy only.
Do not change cooking outputs, navigation, data, or Live Cooking.
Validate mobile result readability and lint.
```

## Agent Handoff Template

Use this when one agent passes work to another:

```md
## Handoff
Branch:
Task type:
Files changed:
Behavior changed:
Validation run:
Known risks:
Do not touch:
Recommended next agent:
```
