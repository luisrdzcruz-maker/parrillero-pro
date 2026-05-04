# Data Contract

Date: 2026-05-04  
Scope: Cut data, cooking profiles, setup visuals, translations, and future multi-cut planning metadata.

## Purpose

Parrillero Pro should scale through data-driven profiles, not scattered UI or engine conditionals. This contract defines the minimum fields future data must provide before a cut, category, or planning profile is considered ready.

## Required Cut Fields

Every cut entry should have:

- `id`: canonical English internal ID.
- `animal`: canonical animal/category ID.
- `category`: high-level grouping for selection and filtering.
- `displayNameKey`: i18n key for the user-facing name.
- `descriptionKey`: i18n key for short selection or detail copy when needed.
- `defaultMethod`: canonical cooking method ID.
- `supportedMethods`: list of canonical method IDs.
- `difficulty`: canonical difficulty value.
- `estimatedTimeRange`: structured min/max timing reference.
- `recommendedDoneness`: allowed doneness values when applicable.
- `thicknessOptions`: supported thickness inputs when applicable.
- `tags`: canonical tags for selection and filtering.
- `inputProfileId`: reference to required input profile.
- `planningProfileId`: reference to required planning profile.
- `safetyProfileId`: reference to required safety profile.
- `setupVisualKey`: reference to setup visual metadata.
- `translationKeys`: all required user-facing translation keys.

Do not use localized labels as IDs.

## Required Input Profile

Input profiles define what the user must provide before generating a plan.

Required fields:

- `id`: canonical English profile ID.
- `requiredInputs`: input keys that must be provided.
- `optionalInputs`: input keys that can refine the result.
- `defaults`: safe defaults when the user has not provided optional values.
- `validRanges`: numeric ranges for thickness, weight, quantity, or other inputs.
- `allowedDoneness`: doneness values available for this cut/profile.
- `equipmentOptions`: supported cooking equipment or grill setup IDs.
- `validationMessages`: warning/error IDs, not display copy.

Input profiles must not contain localized UI text.

## Required Planning Profile

Planning profiles define deterministic cooking behavior and future multi-cut compatibility.

Required fields:

- `id`: canonical English profile ID.
- `method`: primary cooking method ID.
- `heatZones`: required heat zones such as direct, indirect, low, medium, or high.
- `estimatedCookTime`: structured timing model.
- `restTime`: required or recommended rest duration.
- `turningModel`: flip/turn cadence or no-turn instruction.
- `attentionLevel`: low, medium, or high.
- `serveWindow`: preferred and acceptable serving window.
- `holdWarmCapability`: whether the item can hold and for how long.
- `multiCutPriority`: future scheduling hint, such as long-cook-first or finish-near-serve.
- `conflictTags`: future planning conflict markers, such as high-direct-heat or delicate-finish.

Planning profiles should model capabilities and constraints. Do not branch by `cutId` in UI to compensate for missing planning data.

## Required Safety Profile

Safety profiles define food safety and critical warning behavior.

Required fields:

- `id`: canonical English profile ID.
- `foodSafetyCategory`: beef, poultry, pork, fish, vegetable, or other canonical category.
- `minSafeInternalTemp`: safe internal temperature when applicable.
- `targetTempRange`: recommended target range by doneness when applicable.
- `carryoverExpected`: expected carryover behavior when applicable.
- `criticalWarnings`: warning IDs that should stop or redirect unsafe actions.
- `standardWarnings`: actionable warning IDs.
- `restRequired`: whether rest is required, recommended, or optional.
- `crossContaminationNotes`: warning IDs for poultry, fish, or other sensitive categories when applicable.

Safety profiles must be reviewed carefully because they affect trust and safety.

## Required Setup Visual Key

Every cut or planning profile should map to a setup visual key, even if the initial visual is generic.

Required fields:

- `setupVisualKey`: canonical English key.
- `visualType`: setup, grill zone, cut reference, plating, or none.
- `screenUse`: where the visual is allowed, such as Result only.
- `fallbackKey`: generic setup visual when specific asset is missing.
- `altTextKey`: i18n key for accessibility.
- `assetStatus`: available, pending, generic, or intentionally none.

Screen rules:

- Result may use one strong setup visual when it improves confidence.
- Cut Selection uses thumbnails selectively.
- Live Cooking uses functional icons only.

## Required Translations

Every user-visible data item must include translation coverage for supported locales.

Required translation keys:

- Cut display name.
- Short description when shown.
- Selection tags when user-facing.
- Warning messages.
- Setup visual alt text.
- Method labels.
- Difficulty labels.
- Input labels and validation messages.

Translations must be short enough for mobile cards.

## Validation Rules For Future Scripts

Future validation scripts should fail when:

- A cut is missing required profile references.
- A referenced input, planning, safety, or setup visual profile does not exist.
- An internal ID contains localized display text.
- A user-facing translation key is missing for a supported locale.
- A setup visual key has no fallback.
- A safety profile is missing required safe temperature data for a category that needs it.
- A planning profile has no rest, heat zone, or timing model.
- A cut declares a supported method that the planner cannot handle.
- A URL-facing ID contains spaces, accents, uppercase letters, or localized words.

Scripts should warn when:

- A cut uses generic setup visuals.
- A planning profile lacks future multi-cut metadata.
- Translation copy is unusually long for mobile UI.
- A hold-warm value is missing for a cut likely to appear in multi-cut planning.

## Data PR Exit Criteria

A data PR is ready when:

- All required fields are present.
- All references resolve.
- Supported locales are covered.
- Representative result flow still works.
- No UI component contains one-off cut-specific logic to compensate for incomplete data.
