# Cut Search QA + Polish

## Verdict

PASS

## Commands run

- `npm run lint`
- `npm run build`
- `npm run check`

## Behavior validation

- PASS - Search is hidden while catalog is collapsed.
- PASS - Search appears only after expanding `View all cuts`.
- PASS - Search clears on animal change.
- PASS - Search clears on catalog collapse.
- PASS - Search clears on map mode selection.
- PASS - Search filters active animal + active intent catalog subset.
- PASS - Query `rib` returns rib/ribeye-related results.
- PASS - Spanish visible-name queries work (`solomillo`, `entrecot`, `costilla`).
- PASS - English fallback works in localized UIs (validated with `ribeye` in ES/FI).
- PASS - Category queries work (validated with `bbq`).
- PASS - Anatomical area/zone terms work when data exists (validated with `chuck`).
- PASS - No-results state renders and is localized.
- PASS - Opening a search result opens the expected cut detail context.
- PASS - Search interactions do not alter navigation/history (URL remains stable in cut step interactions).
- PASS - Bottom nav does not intercept search input, clear action, or result-card taps.

## Viewport validation

- `360x740` - PASS, no clipping in search block, clear button tappable, no horizontal wobble observed.
- `375x812` - PASS, input and clear control visible and tappable, no horizontal overflow observed.
- `390x844` - PASS, search + results remain stable, no clipping/overflow observed.
- `1280x900` - PASS, search remains usable; cut detail interaction remains usable with search active.
- Keyboard/layout note - input focus did not produce a visible layout break in tested states.

## I18n validation

- Placeholder localized:
  - ES: `Buscar corte por nombre...`
  - EN: `Search by cut name...`
  - FI: `Hae leikkauksen nimellä...`
- Empty-state title localized:
  - ES: `No encontramos cortes para "{query}"`
  - EN: `No cuts found for "{query}"`
  - FI: `Ei leikkauksia haulle "{query}"`
- Empty-state helper localized:
  - ES: `Prueba otro nombre, alias o zona del animal.`
  - EN: `Try another name, alias, or animal area.`
  - FI: `Kokeile toista nimeä, aliasnimeä tai eläimen aluetta.`

## Bugs found

- Duplicate clear control in no-results state (input clear icon + extra no-results button), visible in ES/EN/FI.

## Fixes applied

- Removed the extra no-results clear button so only one clear control is present (the input clear action).
- File changed: `components/cuts/CutSelectionScreen.tsx`

## Remaining risks

- Existing repository warning remains outside this scope: `app/page.tsx` has a pre-existing `react-hooks/exhaustive-deps` lint warning.
- Browser harness viewport framing can appear narrower than raw pixel target; no functional break was observed during interactive checks.

