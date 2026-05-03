# UX Regression Checklist

Date: 2026-05-04  
Scope: Mobile-first UX checks for Parrillero Pro / AI Grill Master Pro.

## Purpose

Use this checklist before merging UI, navigation, i18n, data, or engine changes that can affect the visible cooking experience.

The goal is not visual perfection. The goal is to catch regressions that reduce speed, trust, execution clarity, or premium perception.

## Screens To Test

Run the touched screens first, then run the smoke path if time allows.

Core smoke path:

1. Home.
2. Cut Selection.
3. Cut Details.
4. Result.
5. Live Cooking.
6. Saved plans.
7. Menu or Parrillada mode when touched.

Representative cuts:

- `ribeye`
- `picanha`
- `chicken_breast`
- `salmon_fillet`
- `asparagus`

## Mobile Viewports

Check at least one compact and one common mobile viewport:

- 320 x 568: small phone stress check.
- 375 x 667: common compact phone.
- 390 x 844: modern iPhone-sized viewport.
- 412 x 915: common Android-sized viewport.

For high-risk UI changes, test both 320 and 390 widths.

## Desktop Centered Layout Check

On desktop widths:

- Content remains centered and app-like.
- Mobile shell does not stretch into a low-density desktop layout.
- Cards keep readable max width.
- Bottom navigation or shell navigation does not float awkwardly.
- Large empty areas do not make the product feel unfinished.

## CTA Visibility

Check that primary actions are visible and tappable:

- Home: start cooking CTA is visible without hunting.
- Cut Selection: cut cards and filter controls are tappable.
- Details: generate result CTA is reachable after required inputs.
- Result: start live CTA is visible after the confidence summary.
- Live Cooking: current action and timer controls are immediately usable.
- Saved/Menu: open or continue actions are clear.

CTA failures are regressions even if the page looks good.

## Bottom Nav Overlap

Verify on mobile:

- Bottom nav does not cover primary CTAs.
- Bottom nav does not cover live timers or critical action controls.
- Scroll padding is enough for last card and last button.
- Safe-area handling works on tall and compact phones.
- Keyboard or input states do not trap important controls behind navigation.

## Visual Density

Apply the screen-specific density rules:

- Home: clean first screen, no large top food photo, one dominant start action.
- Cut Selection: fast scanning, icons/tags by default, thumbnails only where useful.
- Details: inputs are clear and not buried under education.
- Result: premium summary first, one useful setup visual when applicable, no repeated timing/temperature blocks.
- Live Cooking: no decorative images, high-contrast current action, compact controls.
- Saved/Menu: cards should help resume or decide, not become content-heavy galleries.

Remove visuals that only decorate.

## Premium Integrated Shell Rule

The app should feel like one premium product, not separate experiments.

Check:

- Consistent dark background treatment.
- Shared spacing, radius, border, and shadow language.
- Cards feel related across Home, Result, and Live Cooking.
- Icons communicate function and do not introduce random styles.
- Text hierarchy is clear without excessive labels.
- Important cooking facts are easier to scan than decorative elements.

## Navigation UX Checks

- Browser back from Result returns to Details with context.
- Browser back from Details returns to the relevant selection state.
- Animal/category filter changes do not create noisy back history.
- Language switch preserves current flow context.
- Direct URL entry does not show blank or broken UI.

## i18n UX Checks

- English, Spanish, and Finnish do not mix inside the same visible block.
- Long translated labels do not overflow cards or buttons.
- Warnings remain direct and actionable.
- CTAs stay understandable after translation.
- URL params remain canonical English.

## Live Cooking Execution Checks

- Current action is visible immediately.
- Timer or timing guidance is readable at a glance.
- Next action is clear.
- Safety or warning states stand out.
- Controls are thumb-friendly.
- Decorative content does not compete with active execution.

## Pass / Fail Template

```md
# UX Regression Report

Date:
Branch:
Tester:
Viewport(s):
Flow tested:

## Verdict
- PASS / FAIL:

## Screens
- Home:
- Cut Selection:
- Details:
- Result:
- Live Cooking:
- Saved/Menu/Parrillada:

## Critical Checks
- CTA visibility:
- Bottom nav overlap:
- Visual density:
- Premium integrated shell:
- Browser back:
- Language preservation:

## Defects
- [Severity] Screen | Steps | Expected | Actual | Screenshot/URL

## Notes
- Risks, follow-ups, or none.
```
