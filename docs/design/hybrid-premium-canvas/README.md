# Hybrid Premium canvas — visual targets

These PNGs are the **canonical visual target** for the Parrillero Pro consolidation work tracked in `UI-UX-audit01.md` and specified in `../hybrid-premium-ui-spec.md`.

> **They are not aspirational.** They are the spec. Any divergence between a shipped screen and its mockup here is a regression and should be filed as such.

## Files

| File | Purpose | Audit references |
|---|---|---|
| `00-full-system-board.png`     | System overview — all screens, one canvas. Cross-screen tiebreaker.   | n/a |
| `01-home.png`                  | Home / command center                                                  | §1.2, §1.6, §2.2 |
| `02-cut-selection.png`         | Cut Selection (icon-led, Lite mode)                                    | §1.3, §2.5 |
| `03-cook-setup.png`            | Cook Setup (four-section canvas)                                       | §1.3, spec §6 / §7 |
| `05-live-cooking.png`          | Live Cooking (single-cook execution)                                   | §1.1, spec §3 |
| `06-parrillada-entry.png`      | Parrillada Entry (quick start)                                         | §1.7, §1.1 |
| `07-parrillada-review.png`     | Parrillada Review (pre-fire summary)                                   | §1.2, §1.7, §2.4 |
| `08-parrillada-live.png`       | Parrillada Live (team execution)                                       | §1.7, §2.2 |
| `10-parrillada-setup.png`      | Parrillada Setup (menu builder)                                        | §1.2, §1.7, §2.7 |

Numbers `04` and `09` are intentionally reserved. Do not renumber existing files when filling them in.

Any file not listed in this table that appears in this folder is **not canonical** — move it to `../_scratch/` or delete it. Agents will treat everything in this folder as spec.

## How to use these

**When writing or reviewing code:**
- Open the mockup for the screen you are touching. Keep it visible next to the code.
- Card radius, eyebrow color, CTA color, padding, and spacing are whatever the mockup shows. Do not improvise.
- One solid ember CTA per screen, matching the gradient and shape in the mockup.
- Bottom nav has labels under each icon (see `01-home.png`, `08-parrillada-live.png`).
- The same card surface is used across all screens. If your screen looks subtly different, it is wrong.
- Use `00-full-system-board.png` as a cross-screen consistency check. If two screens diverge on a token value, the system board is the tiebreaker.

**When extending `lib/design-system.ts`:**
- Token values (radii, opacities, shadow strengths, ember color stops) should be derived from these mockups, not invented.
- If two mockups disagree on a value, that is a bug in the mockups — flag it before encoding the disagreement into tokens.

**When extracting a primitive (`ListRow`, `SetupOptionCard`, `TimelineRow`, `WarningRow`):**
- The reference rendering for each lives in one of these mockups. Cite it in the component file's docblock.

## Screens without a mockup — analogy map

The canvas does not cover every screen. For any screen not pictured, **do not skip it and do not invent a new visual treatment.** Bring it into the system by analogy from the closest canvas screen using the table below.

| Screen without mockup    | Inherit visual system from   | What to copy specifically |
|---|---|---|
| Result screen            | `03-cook-setup.png`          | Section cards with eyebrow label; metric row pattern; single sticky ember CTA at bottom |
| Saved / Guardados        | `01-home.png`                | "Recent parrilladas" list pattern (image thumb + title + meta + chevron row) |
| Onboarding               | `01-home.png`                | Hero card surface + single ember CTA; no decorative photos behind text |
| Wizard — Animal step     | `02-cut-selection.png`       | Icon-led row pattern, single-select selected state, category chips if needed |
| Wizard — Details step    | `03-cook-setup.png`          | Four-section canvas pattern (Strategy / Doneness / Conditions / Fuel structure) |
| Wizard — Result step     | `07-parrillada-review.png`   | Compact plan summary metrics grid + sequence + sticky CTA |
| Any modal / bottom sheet | `10-parrillada-setup.png`    | "Choose Cuts" sheet — search field, chip filter row, list with `+` affordances, sticky "Add" CTA |

The rule is **same Panel surface, same radius scale, same eyebrow style, same muted-text opacities, same single-ember-CTA pattern, same bottom-nav-with-labels** as the analogue screen. Tokens come from `lib/design-system.ts`. No raw Tailwind values.

## What these mockups deliberately do not specify

- **Animation and motion.** Stills cannot show motion. Refer to `../hybrid-premium-ui-spec.md` §8 and the existing `globals.css` keyframes.
- **Loading, empty, and error states.** Cover these in component-level specs as they come up.
- **Tablet and desktop layouts.** Mockups are 375 px mobile. Larger breakpoints are a separate exercise.

## Provenance

- Source: design handoff, 2026-05-12.
- Direction: Hybrid Premium (see spec).
- Status: **canonical** — supersedes any earlier mockup or Figma frame.
