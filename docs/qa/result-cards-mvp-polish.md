# Result Cards MVP Polish QA

## What Changed

- Reworked the Result hierarchy around `ResultHero control panel -> Guidance triggers -> Steps -> secondary details`.
- Refactored the hero into a cooking control panel with Time, Temp, Start Live Cooking, Fire, and Method.
- Made Start Live Cooking the dominant hero action; on wider screens it spans a taller control area.
- Removed the large `View steps` CTA because Steps are already visible by default.
- Replaced separate pre-step Setup, Avoid, and Prep cards with one compact secondary trigger row.
- Setup, Avoid, and Prep now open a separate detail surface: bottom-sheet style on mobile and centered modal/card on larger screens.
- Kept Steps visible by default; they are not hidden inside an accordion.
- Setup uses a compact visual crop inside the detail surface instead of a large always-visible setup image.
- Avoid/Mistakes uses compact warning rows and remains high-contrast without taking over the page.
- Prep is a one-sentence panel and still notes that prep lead time is not added to session time.
- Time and Temp labels are visually secondary; their values are the dominant content.

## Hero Before / After

Before:

- Header summary
- Separate metric grid
- Start Live Cooking button
- Large secondary `View steps` button

After:

- Header summary
- Compact control grid:
  `Time + Temp`
  `Start Live Cooking`
  `Fire + Method`
- No large secondary steps button; Steps remain visible below the hero/guidance area.

## View Steps

`View steps` was removed from the hero. It was only a scroll anchor, and Steps are now already visible by default immediately after the compact guidance triggers. This avoids competing with the primary Live Cooking action.

## Mobile Layout Before / After

Before:

- `ResultHero`
- Large Setup visual card
- Critical Guidance card
- Prep card
- Steps card
- Secondary details

After:

- `ResultHero` as compact control panel
- Three secondary guidance triggers: `Setup`, `Avoid`, `Prep`
- Separate detail surface when one trigger is active
- Steps card, always visible by default
- Secondary details

## Guidance Detail Behavior

- Only one of `Setup`, `Avoid`, or `Prep` can be open at a time.
- Mobile opens a bottom-sheet style detail surface.
- Desktop/tablet opens the same detail as a centered modal/card surface.
- Closing the surface returns the page to the compact hero + triggers + Steps layout.
- The detail surface does not permanently push Steps down the page.

## Screens / Cuts Reviewed

Reviewed generated Result output shape for:

- `tenderloin`
- `ribeye`
- `bone_in_ribeye`
- `chuleton`
- `picanha`
- `tri_tip`
- `chuck_roast`
- `brisket`
- `burger_patty`
- `sausages`
- `chicken_wings`
- `salmon`
- `asparagus`
- `potato_halves`

Specific checks:

- Picanha still exposes fat-cap / flare-up guidance in setup, warning, and prep surfaces.
- Bone-in ribeye / chuleton still exposes reverse-sear setup and bone-aware warning guidance.
- Chicken wings still show safe-temperature guidance rather than steak-style doneness.
- Salmon keeps delicate fish temperature guidance and short salting guidance.
- Asparagus and potato halves render as visual/texture targets with no meat internal-temperature framing.
- BBQ basic items such as burger patties, sausages, and chicken wings render with safe-temperature guidance and compact prep notes.

## Mobile QA Notes

Manual viewport checks targeted:

- Desktop / PC
- `390 x 844`
- `375 x 812`
- `360 x 740`

Observed / intended mobile behavior:

- Time and Temp values dominate over labels.
- Start Live Cooking remains in the hero and is the strongest action.
- Fire and Method fit naturally in the hero control grid.
- Setup / Avoid / Prep triggers fit in one row on the target mobile widths.
- No duplicated setup, prep, or warning cards remain above Steps.
- Steps are visible without requiring the user to tap any control.
- Opening Setup shows a compact visual crop in a separate detail surface.
- Opening Avoid shows the most important warning clearly.
- Opening Prep shows salting/prep guidance in one compact detail surface.
- Steps remain readable as separate executable rows.
- Live Cooking behavior is unchanged.

Observed browser QA:

- Desktop / PC with `picanha`: hero shows Time/Temp/Fire/Method plus a dominant double-height Live Cooking control; Setup detail opens as a centered modal/card.
- `390 x 844` with `picanha`: mobile order is Time/Temp, full-width Live Cooking, Fire/Method, guidance triggers, then Steps.
- `375 x 812` and `360 x 740` with `picanha`: Steps remain visible by default under the compact triggers; no large Setup/Avoid/Prep cards appear above Steps.
- `tenderloin`: Time/Temp values and direct fire/method controls render cleanly with visible Steps.
- `asparagus`: Temp hides gracefully; visual/texture vegetable flow keeps Time/Fire/Method and does not present meat doneness framing.
- `bone_in_ribeye` / `chuleton`: reverse-sear method renders cleanly; unavailable Fire detail does not leave an empty card.
- `chicken_wings`, `sausages`, and `burger_patty`: safe-temperature values render in Temp, with visible executable Steps.
- `salmon_fillet` / salmon: delicate fish temperature renders in Temp with visible Steps.

## Intentionally Not Changed

- No engine logic changes.
- No navigation changes.
- No Supabase changes.
- No dependency changes.
- No Live Cooking behavior changes.
- No parser block behavior changes.
- No changes to saved/share payload compatibility.
- No changes to `timeSemantics`, `prepGuidance`, or warning generation.

## Risks / Next Steps

- Some legacy warning strings still come from older catalog copy; the UI now presents them better, but content quality should continue to be improved in data/config.
- Visual QA should be repeated in-browser before release on the exact target devices.
- A later pass can add a dedicated secondary details accordion if Times / Temperature details need to be exposed beyond the hero metrics.
