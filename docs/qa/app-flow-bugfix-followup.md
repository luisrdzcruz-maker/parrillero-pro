# App Flow Bugfix Follow-up QA

## Verdict

NEEDS FIXES

## Commands run

- `npm run lint` ✅ pass
- `npm run build` ✅ pass
- `npm run check` ✅ pass (`lint + build + qa:cooking + check:ui`)

Notes:

- `qa:cooking` stayed green (`1116/1116`).
- Non-blocking npm warning still appears: `Unknown env config "devdir"`.

## Blockers retested

### 1) Cut modal browser/back history

Retest scenarios:

- Home -> Cut Selection -> open Ribeye modal -> Back should close modal and stay on Cut Selection -> Back again should return Home.
- Open Ribeye -> close -> open Tomahawk -> Back should close Tomahawk.

Observed:

- Opening modal updates URL as expected (`cutId` present).
- `Back` does **not** close modal into Cut Selection. It navigates unexpectedly to `?mode=guardados` in this session.
- Same failure reproduced after open/close/open sequence with Tomahawk.

Result: ❌ **FAILED**

---

### 2) ES/FI i18n + internal copy leakage

Checked surfaces:

- Cut cards
- Cut modal
- Result warning / critical mistake
- Live Cooking hinting

Observed:

- **ES:** cut cards/modal appeared mostly user-facing Spanish in tested states.
- **FI:** multiple internal/English strings still leak in critical flow:
  - Details: `failing to render the cap fat side first`, `Cooking setup`, `Adjust details`
  - Result: `Critical error`, `Error that ruins this cut`, full English step blocks
  - Live: heading and setup context in English (`Preheat grill`, `controlled direct heat. Use parrilla gas.`)
- Internal descriptor-like strings are still visible to users in FI/partially localized contexts.

Result: ❌ **FAILED**

---

### 3) Mobile horizontal overflow

Viewports rechecked:

- `360x740`
- `375x812`
- `390x844`

Observed:

- `360x740`: looks stable in this pass (no obvious horizontal canvas overflow).
- `375x812`: right-side extra canvas/overflow visible.
- `390x844`: right-side extra canvas/overflow visible.

Result: ❌ **FAILED** (2/3 target viewports still broken)

---

### 4) Desktop centering

Viewport rechecked:

- `1280x900`

Observed:

- App shell remains left-aligned with large empty area on the right.
- Expected centered shell behavior not met.

Result: ❌ **FAILED**

## Remaining issues

1. Modal history/back stack remains incorrect and can jump to unrelated mode (`guardados`) instead of closing modal.
2. FI localization path still shows significant internal English text in details/result/live.
3. Mobile horizontal overflow persists at `375x812` and `390x844`.
4. Desktop `1280x900` shell centering is still not applied.

## Recommended next action

Run a targeted second bugfix pass before new feature work:

1. **P0:** Fix modal history stack behavior for `cutId` open/close transitions (Back semantics first).
2. **P0:** Lock down locale mapping/fallbacks for details/result/live text sources (block internal English leakage in FI).
3. **P1:** Resolve responsive width overflow for `375x812` and `390x844`.
4. **P1:** Implement/restore centered desktop shell constraints for `1280x900`.

Then rerun this exact follow-up QA checklist only on these four blockers.