# Navigation Contract

Date: 2026-05-04  
Scope: URL-backed navigation, browser history, app modes, and language preservation.

## Purpose

Parrillero Pro navigation must be deterministic, shareable, and recoverable. A user should be able to enter a URL directly, go back safely, switch language without losing context, and continue the cooking flow without hidden local-only state.

## Canonical App URLs

Use canonical English query values for app state. Do not store localized labels in URLs.

Current canonical modes:

- Home: `/?mode=inicio`
- Single-cut planning: `/?mode=coccion`
- Menu planning: `/?mode=menu`
- Parrillada planning: `/?mode=parrillada`
- Live Cooking: `/?mode=cocina`
- Saved plans: `/?mode=guardados`

Canonical flow states should use stable keys:

- `mode`: current app mode.
- `animal`: canonical animal/category ID.
- `cutId`: canonical cut ID. Use `cutId`, not `cut`.
- `step`: flow step when needed, such as selection, details, result, or live.
- `lang`: active locale when encoded in the URL.
- Cooking inputs such as `thickness`, `doneness`, `equipment`, or similar fields only when the app can hydrate them safely.

URLs must be safe to share. If required context is missing, the app should normalize to the nearest safe state or show recovery UI.

## Browser Back Expectations

Browser back should reverse meaningful user decisions:

- Result back goes to Details for the same `cutId` and preserved inputs.
- Details back goes to Cut Selection for the same animal/category when available.
- Cut Selection back goes to Home or the previous high-level mode.
- Live Cooking back should return to Result or Details with context preserved, not to an empty screen.
- Saved/Menu back behavior should preserve the selected saved/menu context when possible.

Back should not:

- Drop language.
- Drop `cutId` unexpectedly.
- Recreate stale result state from localized labels.
- Send the user to a broken intermediate state.

## Swipe / Back Behavior

Mobile swipe-back should follow the same contract as browser back.

If swipe/back would abandon a live cook, the app should either:

- Preserve the active cook state and return safely, or
- Ask for confirmation if data loss or timer confusion is possible.

Do not intercept back behavior for decoration or animation only.

## Bottom Nav Behavior

Bottom navigation is for high-level mode changes:

- Home
- Single-cut cooking
- Menu or Parrillada planning when present
- Live Cooking when an active cook exists
- Saved

Bottom nav taps should replace the current high-level mode when the user is switching sections. They should not create long history stacks for repeated tab changes.

Bottom nav must:

- Preserve language.
- Preserve recoverable active cooking context where appropriate.
- Avoid overlapping CTAs or critical live controls.
- Never navigate to an invalid or empty required state.

## Language Preservation Rules

Language is user context, not cooking logic.

Rules:

- Preserve `lang` or the active locale across all navigation.
- Language switch should keep the current mode, animal, `cutId`, and cooking inputs where valid.
- URL state must continue to use canonical English IDs after language changes.
- Display labels should re-render from i18n resources.
- Do not translate query param keys or values.

## Animal Filter Replace vs Push Behavior

Animal/category filter changes in Cut Selection should generally replace history, not push.

Use replace when:

- The user is browsing categories or filtering the list.
- No specific cut decision has been made.
- Repeated taps would otherwise create noisy back history.

Expected behavior:

- Changing from beef to chicken updates `animal` with replace.
- Browser back from the selection list returns to the previous meaningful screen, not every category filter.

## Cut / Detail / Result Push Behavior

Meaningful user decisions should push history.

Use push when:

- The user selects a cut from Cut Selection.
- The user enters Details for a specific `cutId`.
- The user generates a Result from valid inputs.
- The user starts Live Cooking.
- The user opens a saved plan or menu item that changes the active working context.

Expected behavior:

- Cut selection creates a back target.
- Result creation creates a back target.
- Live Cooking creates a back target if the user can safely return to Result/Details.

## Direct URL Recovery

For invalid or incomplete URLs:

- Invalid `mode`: normalize to Home.
- Missing `animal` in Cut Selection: choose a safe default category or show all categories.
- Invalid `cutId`: return to Cut Selection with an actionable message.
- Result URL without required inputs: show Details with preserved known fields or recovery guidance.
- Live URL without active plan: route to Result or Details when possible, otherwise Cut Selection.

Recovery must avoid blank screens and silent data loss.

## Navigation QA Checklist

- Direct Home URL loads.
- Direct Cut Selection URL loads.
- Direct Details URL hydrates canonical `animal` and `cutId`.
- Direct Result URL either hydrates or recovers.
- Direct Live URL either hydrates or recovers.
- Browser back from Live, Result, Details, and Cut Selection works.
- Animal filter changes do not pollute back history.
- Language switch preserves state and canonical query values.
- Bottom nav does not overlap critical content on mobile.
