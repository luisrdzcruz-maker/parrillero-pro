# Home -> Live Funnel QA Report (Final Re-run)

Date: 2026-05-01  
Branch: `feature/home-conversion-and-funnel`  
Tester: Codex 5.3  
Viewport: Mobile (`390x844`)

## Validation Commands

- `npm run lint`: PASS (1 existing warning in `app/page.tsx`, no errors)
- `npm run build`: PASS
- `npm run validate:cuts`: PASS (`66 profiles`)
- `npm run qa:cooking`: PASS (`1116/1116`)

## PASSED

- Home above-the-fold CTA is visible and usable in mobile viewport.
- CutSelection is usable in mobile viewport.
- Result and Live screens are usable for all target cuts.
- Home popular shortcuts route correctly:
  - `Ribeye` -> `/?mode=coccion&step=details&animal=beef&cutId=ribeye&doneness=medium_rare&thickness=2`
  - `Picanha` -> `/?mode=coccion&step=details&animal=beef&cutId=picanha&doneness=medium_rare&thickness=2`
  - `Chicken breast` -> `/?mode=coccion&step=details&animal=chicken&cutId=chicken_breast&doneness=safe&thickness=2`
  - `Salmon` -> `/?mode=coccion&step=details&animal=fish&cutId=salmon_fillet&doneness=medium&thickness=2`
  - `Asparagus` -> `/?mode=coccion&step=details&animal=vegetables&cutId=asparagus`
- Ribeye alias canonicalization remains correct:
  - `/?mode=coccion&step=details&animal=beef&cutId=entrecote`
  - resolves to `/?mode=coccion&step=details&animal=beef&cutId=ribeye`
- Asparagus full funnel now passes:
  - Details: `/?mode=coccion&step=details&animal=vegetables&cutId=asparagus`
  - Result after Generate: `/?mode=coccion&step=result&animal=vegetables&cutId=asparagus`
  - After 3 seconds, Result remains populated and Live CTA remains visible.
  - Live: `/?mode=cocina&animal=vegetables&cutId=asparagus`
  - Plan-back: `/?mode=coccion&step=details&animal=vegetables&cutId=asparagus`
  - URLs contain no `thickness` or `doneness` for asparagus.

## ISSUES FOUND

- No blocking issues found in this final re-run.

## EDGE CASES

- Home shortcut transitions are asynchronous; URL changes after a short delay.
- Asparagus Live header still shows an internal `2 cm` display string even with minimal URL context; no routing/state impact observed.
- CutSelection still includes mixed-language copy in item labels/aliases.

## RISKS

- **Known lint warning remains non-blocking**: `app/page.tsx` hook dependency warning (`commitNav`) persists.
- **Copy consistency risk**: mixed-language cut labels in CutSelection may reduce UX clarity.

## Core Cuts Coverage (Final Re-run)

- `ribeye`
  - Details: `/?mode=coccion&step=details&animal=beef&cutId=ribeye&doneness=medium_rare&thickness=2`
  - Result: `/?mode=coccion&step=result&animal=beef&cutId=ribeye&doneness=medium_rare&thickness=2`
  - Live: `/?mode=cocina&animal=beef&cutId=ribeye&doneness=medium_rare&thickness=2`
  - Plan-back: `/?mode=coccion&step=details&animal=beef&cutId=ribeye&doneness=medium_rare&thickness=2`
  - Status: PASS
- `picanha`
  - Details: `/?mode=coccion&step=details&animal=beef&cutId=picanha&doneness=medium_rare&thickness=2`
  - Result: `/?mode=coccion&step=result&animal=beef&cutId=picanha&doneness=medium_rare&thickness=2`
  - Live: `/?mode=cocina&animal=beef&cutId=picanha&doneness=medium_rare&thickness=2`
  - Plan-back: `/?mode=coccion&step=details&animal=beef&cutId=picanha&doneness=medium_rare&thickness=2`
  - Status: PASS
- `chicken_breast`
  - Details: `/?mode=coccion&step=details&animal=chicken&cutId=chicken_breast&doneness=safe&thickness=2`
  - Result: `/?mode=coccion&step=result&animal=chicken&cutId=chicken_breast&doneness=safe&thickness=2`
  - Live: `/?mode=cocina&animal=chicken&cutId=chicken_breast&doneness=safe&thickness=2`
  - Plan-back: `/?mode=coccion&step=details&animal=chicken&cutId=chicken_breast&doneness=safe&thickness=2`
  - Status: PASS
- `salmon_fillet`
  - Details: `/?mode=coccion&step=details&animal=fish&cutId=salmon_fillet&doneness=medium&thickness=2`
  - Result: `/?mode=coccion&step=result&animal=fish&cutId=salmon_fillet&doneness=medium&thickness=2`
  - Live: `/?mode=cocina&animal=fish&cutId=salmon_fillet&doneness=medium&thickness=2`
  - Plan-back: `/?mode=coccion&step=details&animal=fish&cutId=salmon_fillet&doneness=medium&thickness=2`
  - Status: PASS
- `asparagus`
  - Details: `/?mode=coccion&step=details&animal=vegetables&cutId=asparagus`
  - Result: `/?mode=coccion&step=result&animal=vegetables&cutId=asparagus`
  - Live: `/?mode=cocina&animal=vegetables&cutId=asparagus`
  - Plan-back: `/?mode=coccion&step=details&animal=vegetables&cutId=asparagus`
  - Status: PASS

## VERDICT

**READY FOR NEXT PHASE**

All requested funnel checks passed in this final re-run, including the previously blocked asparagus/vegetables context path.