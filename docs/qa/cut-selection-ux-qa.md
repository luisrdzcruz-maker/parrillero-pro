# CutSelection UX QA

Date: 2026-05-01  
Scope: CutSelection UX validation after copy, mobile layout, and navigation fixes  
Mode: Read-only QA (no product code changes)

## Validation Run

- `npm run lint`: PASSED (exit code 0)
- `npm run build`: PASSED (exit code 0)

## PASSED

- Entry flow works:
  - Home -> Start cooking opens CutSelection.
  - URL observed: `/?mode=coccion&step=cut`.
- Bottom nav entry works:
  - Coccion tab opens CutSelection.
  - URL remains on CutSelection flow (`mode=coccion`, `step=cut`).
- Mobile layout checks passed on tested viewports (`390x844`, `375x812`, `360x740`):
  - no horizontal overflow observed
  - LIST/MAP toggle visible
  - cards render fully (no right-edge clipping observed)
  - quick picks section visible without page-width expansion
  - vertical scrolling reaches lower content
  - bottom nav did not hide the last visible list item in tested states
- Core card readability (verified in list/details states):
  - Ribeye, Picanha, Chicken breast, Salmon, Asparagus names are clear
  - descriptors are readable
  - time / method / difficulty are readable on card surfaces
  - no internal IDs shown as primary labels
  - no noisy mixed-language aliases were observed in English UI during tested paths
- Canonical URL behavior (verified):
  - Ribeye uses `cutId=ribeye` (not `entrecote`)
  - animal query params observed as canonical values (`beef`, `chicken`, `fish`, `vegetables`)
  - asparagus URL does not include unnecessary thickness/doneness params in tested path
- Details back path passed:
  - Home -> Start cooking -> Chicken -> Chicken breast -> Details
  - Browser Back returned to CutSelection (`step=cut`) in tested run

## ISSUES FOUND

- **Critical**: animal filter history/back behavior appears inconsistent with expected replace semantics.
  - Repro from QA run:
    1. Open CutSelection
    2. Switch animal filters Beef -> Chicken -> Pork
    3. Press Browser Back
  - Expected: Back should return to Home (or at least skip previous animal filter states per replace behavior requirement).
  - Actual in multiple browser runs: Back first lands on prior animal state (for example `animal=chicken`) before returning to base CutSelection/Home.
  - Impact: user may need multiple back presses and experience filter-state history noise.
  - Note: code inspection indicates `replace` is intended for animal chip changes; observed runtime behavior should be re-verified on real device/browser outside QA harness.

## EDGE CASES

- Bottom sheet vs details behavior differs by interaction path:
  - some cut interactions route to details view where full summary fields may not be mirrored exactly as in list card metadata.
- Direct URL entries to CutSelection can alter perceived back behavior (history baseline differs from in-app linear navigation).
- MAP toggle visibility is verified; full MAP interaction/deep validation remains limited in this pass.

## RISKS

- If animal chips are effectively pushing history in production runtime, navigation polish regresses and can feel broken.
- Bottom-sheet-specific content requirements (why choose / safety / CTA visibility in all cut states) need final manual verification on physical devices due browser-tool interaction limits.
- Flow confidence is high for list/card readability and canonical params, medium for all bottom-sheet permutations.

## URL TRACE (Key Observations)

- `/?mode=inicio` -> `/?mode=coccion&step=cut`
- `/?mode=coccion&step=cut&animal=chicken`
- `/?mode=coccion&step=cut&animal=pork`
- Back in failing run: `/?mode=coccion&step=cut&animal=chicken`
- Chicken details path:
  - `/?mode=coccion&step=details&animal=chicken&cutId=chicken-breast`
  - Back to `/?mode=coccion&step=cut&animal=chicken`

## VERDICT

**NEEDS FIXES**

Primary blocker is back-navigation behavior through animal chips (history stack handling).  
After that is resolved and re-verified on real mobile browsers, CutSelection UX appears close to release-ready.