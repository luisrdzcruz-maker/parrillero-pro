# Cut Selection Bugfixes

## Branch

feature/cut-selection-bugfixes  

## Verdict

PASS pending final manual smoke test.  

## Context

This bugfix pass addressed four observed blockers in Cut Selection and Result:  

1. Cut Selection UI/content localization was incomplete.
2. Result critical mistake copy showed internal/generated labels such as "Fatty premium steak".
3. Cut detail modal close button could appear too high or partially out of view on mobile.
4. Browser/gesture back from the cut detail modal returned to Home instead of closing the modal back to Cut Selection.

## Root causes

### Cut Selection localization

Cut Selection UI chrome was localized, but cut content still came from English-first generated profile fields such as `canonicalNameEn`, `notesEn`, and `errorEn`.  

### Result critical mistake copy

Generated profile mapping used descriptor-style error fields instead of prioritizing `criticalMistakeEn` when available.  

### Cut detail modal layout

The bottom sheet needed safer mobile spacing, max-height behavior, and internal scroll handling.  

### Modal back behavior

Opening a cut detail modal was local state only, so browser history did not know about the modal state.  

## Fixes implemented

### Localization

Added centralized localized helpers in `components/cuts/cutProfileSelectors.ts`:  

- `getCutDisplayName(profile, lang)`  
- `getCutDescription(profile, lang)`  
- `getCutAliases(profile, lang)`

Cut UI components now consume localized helpers instead of reading English-first generated profile fields directly.  

Updated:  

- `CutCard`  
- `QuickPicks`  
- `CutBottomSheet`

### Critical mistake copy

Updated generated profile mapping to prefer:  

```ts
criticalMistakeEn ?? errorEn
```

