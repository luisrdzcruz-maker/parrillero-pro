# i18n Contract

Date: 2026-05-04  
Scope: Localization rules for Parrillero Pro / AI Grill Master Pro.

## Purpose

Parrillero Pro must support multiple languages without mixing display copy into cooking logic, URLs, or data IDs. Localization should make the app feel native while preserving deterministic internal behavior.

## Internal IDs In English

Use canonical English identifiers for:

- Cut IDs.
- Animal/category IDs.
- Engine enum values.
- Planning profile keys.
- Safety warning IDs.
- Setup visual keys.
- URL query values.
- Persisted state keys.
- Script fixture IDs.

Examples:

- Use `ribeye`, not `ojo_de_bife`.
- Use `chicken_breast`, not a translated display label.
- Use `direct_heat`, not localized copy.

## User-Facing Strings Through i18n

All user-facing display copy must come from the i18n layer:

- Buttons.
- Labels.
- Cards.
- Warnings.
- Empty states.
- Error messages.
- Setup instructions.
- Result summaries.
- Live Cooking action text.

Do not hardcode new user-facing strings directly inside components unless the task is an approved temporary prototype and the follow-up is documented.

## No Mixed Language

Each visible UI block should render in one active language.

Avoid:

- English headings with Spanish body copy.
- Finnish labels with English warnings.
- Localized card labels with English fallback action text in the same block.

If a translation is missing, fallback should be consistent and obvious during QA.

## No Display Copy Inside Cooking Logic

Cooking logic must return IDs, structured facts, numeric values, and severity levels. UI layers translate them.

Engine output should prefer:

```ts
{
  warningId: "rest_required",
  severity: "warning",
  minutes: 8
}
```

UI should translate:

```txt
Rest for 8 minutes before slicing.
```

Do not return localized sentences from engine modules unless an explicit AI copy feature owns that behavior outside the deterministic core.

## Required Fallback Behavior

Fallback behavior must be predictable:

- Missing locale: use the default supported locale.
- Missing translation key: use a clearly detectable fallback, not a silent blank.
- Missing cut translation: display a safe generic label only if the user can still continue.
- Missing warning translation: use a generic translated warning shell plus the warning ID for QA visibility if necessary.
- Missing setup visual translation: keep the visual key internal and show translated generic setup guidance.

Fallbacks should never change cooking outputs.

## Translation Checklist

For every PR that adds or changes user-facing copy:

- Add or update English source text.
- Add or update Spanish copy.
- Add or update Finnish copy.
- Confirm copy fits mobile card widths.
- Confirm no untranslated strings appear in Home, Cut Selection, Details, Result, Live Cooking, Saved, Menu, or Parrillada flows touched by the PR.
- Confirm warning severity labels are translated consistently.
- Confirm URL params remain canonical English.
- Confirm data IDs remain canonical English.
- Confirm display copy is not stored in engine outputs.

## Copy Style Rules

Parrillero Pro copy should be:

- Short.
- Practical.
- Confidence-building.
- Cooking-specific.
- Direct about safety and timing.

Avoid:

- Decorative marketing copy during active cooking.
- Long educational paragraphs inside dense selection flows.
- Ambiguous warning language.
- Jokes or personality copy that reduces trust.

## i18n QA Smoke Test

Run this for touched flows:

1. Open the flow in English.
2. Switch to Spanish and confirm context is preserved.
3. Switch to Finnish and confirm context is preserved.
4. Generate or view a result.
5. Enter Live Cooking if relevant.
6. Check that the URL still uses canonical English IDs.
7. Check that no visible UI block mixes languages.
8. Check that warnings and CTAs remain understandable.
