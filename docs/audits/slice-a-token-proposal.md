# Slice A — Token proposal derived from `hybrid-premium-canvas/`

This document proposes the concrete values for the new tokens called for in audit §5 Slice A, **derived from direct reading of the eight canvas PNGs**, not invented.

> **IMPORTANT:** The hex values, opacities, and radii below are visual reads, not pixel-precise measurements. The agent **must** verify each value with a measurement protocol (see §4) before committing. Treat this document as a starting point that closes the "agent invents values" risk, not the final word.

---

## 1. Ember color

The single ember used across every primary CTA, ember-outlined card, and brand mark.

Visible in: `01-home.png` (Resume Plan, Recent Parrilladas chevrons, logo), `02-cut-selection.png` (Continue to Setup, All filter chip selected, selection radio fill), `03-cook-setup.png` (Build My Plan, eyebrow labels inside cards), `06-parrillada-entry.png` (Continue to Plan, stepper + / − buttons), `07-parrillada-review.png` (Looks good start cooking, plan summary border + tints), `10-parrillada-setup.png` (Choose Cuts, Add Selected, All chip selected), `05-live-cooking.png` (Mark as Done, NOW eyebrow, progress bar), `08-parrillada-live.png` (Mark as Done, NOW eyebrow, severity tints).

```ts
ember: {
  DEFAULT: '#E36A1A',   // primary fill (CTAs, brand)
  hover:   '#D55E14',   // press / hover state
  border:  '#E36A1A',   // 1.5px outline on highlighted cards
  faint:   'rgba(227, 106, 26, 0.12)', // ember-outlined card interior wash
}
```

**Reconcile with existing codebase:** the audit §3 flags `#FF6A00` as a hex literal that shadows `bg-orange-500` (`#f97316`). Neither matches the value above. The agent should:
1. Color-pick the CTA fill in **3 different canvases** (Home, Cook Setup, Live Cooking) and confirm they're the same hex.
2. If `#FF6A00` or `bg-orange-500` is the actual canvas color, propose that instead and delete the loser.
3. If the canvas color is different from both, replace both in code and document the new value.

The point is **one ember color, period**.

---

## 2. Muted text opacities — cap at 3

The audit found 20 distinct white opacities. The canvas only uses three distinct strengths visibly:

| Token         | Opacity | Where it's used in the canvas |
|---|---|---|
| `muted.strong` | `0.90`  | Card titles ("Sunday Night Parrillada", "Reverse Sear", "Medium Rare"), eyebrow content |
| `muted.base`   | `0.70`  | Secondary text ("Asado · 6–8 People", "Low & slow, then sear for a perfect crust", subtitles, descriptions) |
| `muted.helper` | `0.50`  | Labels under values ("Suggested range", "Sundry Night Parrillada", "Target Temp" label) |

```ts
color: {
  muted: {
    strong: 'rgba(255, 255, 255, 0.90)',
    base:   'rgba(255, 255, 255, 0.70)',
    helper: 'rgba(255, 255, 255, 0.50)',
  },
}
```

The lint rule in §5 below bans any other `text-white/<n>` value.

---

## 3. Radius scale

Five tiers, visually distinct in the canvas. Reading the corners across the eight PNGs:

| Token         | Value           | Where it's used |
|---|---|---|
| `radius.pill` | `9999px`        | Status pills (`MEDIUM`, `HIGH`, `LIVE` badges), stepper `+`/`-` buttons (`06-parrillada-entry.png`), selection radios |
| `radius.chip` | `0.75rem` (12px)| Filter chips (All / Beef / Pork in `02-cut-selection.png`, `10-parrillada-setup.png`), small inline tags |
| `radius.row`  | `0.875rem` (14px)| List rows (Cut Selection rows, Parrillada Setup selected-cuts rows, Cook Setup grill-condition rows), input fields, secondary buttons (Pause Timer, Hold, Reorder) |
| `radius.card` | `1.25rem` (20px)| Standard panel surface — every section card across all eight screens |
| `radius.hero` | `1.5rem` (24px) | Highlighted ember-outlined cards (`01-home.png` Next Cook, `05-live-cooking.png` NOW, `07-parrillada-review.png` plan summary, `08-parrillada-live.png` NOW) |

```ts
radius: {
  pill: '9999px',
  chip: '0.75rem',
  row:  '0.875rem',
  card: '1.25rem',
  hero: '1.5rem',
}
```

**Caveats:**
- The visual delta between `card` (20px) and `hero` (24px) is subtle. If a pixel measurement shows them to be identical, collapse to one token and document it.
- The canvas may render the actual app radii slightly off-true because the PNG export resamples corners. Verify by overlaying a rendered `<Panel>` on the mockup at 1:1.

---

## 4. Eyebrow labels — two flavors

The canvas uses two visually distinct eyebrow styles depending on emphasis:

**Ember eyebrow** (inside emphasized cards):
- "NEXT COOK" (`01-home.png`)
- "1. NAME YOUR PARRILLADA", "2. SERVE TARGET", "3. READY TO START?" (`06-parrillada-entry.png`)
- "YOUR PARRILLADA PLAN", "MAIN SEQUENCE", "EXECUTION TIMELINE (PREVIEW)" (`07-parrillada-review.png`)
- "MENU BUILDER" (`10-parrillada-setup.png`)
- "NOW" (`05-live-cooking.png`, `08-parrillada-live.png`)

**Muted eyebrow** (neutral section headers):
- "RECENT PARRILLADAS" (`01-home.png`)
- "COOKING STRATEGY", "DONENESS / TIMING", "GRILL CONDITIONS", "FUEL & SETUP" (`03-cook-setup.png`)
- "TEMPS", "UP NEXT", "UP NEXT AFTER", "EXECUTION" (`05-live-cooking.png`)
- "SELECTED CUTS", "SERVE STRATEGY", "ZONE LAYOUT / GRILL SETUP" (`10-parrillada-setup.png`)
- "GROUPED LIVE GUIDANCE", "UP NEXT" (`08-parrillada-live.png`)

```ts
text: {
  eyebrow: {
    ember:  'text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--ds-ember)]',
    muted:  'text-[11px] uppercase tracking-[0.08em] font-semibold text-white/55',
  },
  // Additional tokens called for in audit §5 Slice A:
  body14: 'text-[14px] leading-[1.45]',
  body12: 'text-[12px] leading-[1.4]',
  body11: 'text-[11px] leading-[1.4]',
  helper: 'text-[11px] leading-[1.35] text-white/50',
  eyebrowSmall: 'text-[10px] uppercase tracking-[0.08em] font-semibold',
}
```

**Decisions to confirm:**
- Letter-spacing `0.08em` vs `0.06em` — verify by direct read against the canvas.
- Weight `font-semibold` vs `font-medium` — likely semibold given the visible contrast, but verify. **Do NOT use `font-black`** anywhere except the metric numbers (24–32px display digits) and headline titles.

---

## 5. Shadows

Cards in the canvas do **not** float aggressively. The visual hierarchy comes from fill darkness + thin borders, not shadow stacks. Two subtle treatments are visible:

| Token              | Purpose                                                            |
|---|---|
| `shadow.cardBase`  | Standard panel — barely-there inner highlight to define edge       |
| `shadow.cardLifted`| Hover / pressed state — slightly stronger drop                     |
| `shadow.emberGlowSm` | Faint warm glow under primary CTA                                |
| `shadow.emberGlowMd` | Stronger ember halo on the highlighted NOW / Next Cook cards     |

```ts
shadow: {
  cardBase:    '0 1px 0 rgba(255, 255, 255, 0.04) inset',
  cardLifted:  '0 8px 24px rgba(0, 0, 0, 0.35)',
  emberGlowSm: '0 4px 18px rgba(227, 106, 26, 0.25)',
  emberGlowMd: '0 12px 32px rgba(227, 106, 26, 0.20)',
}
```

**Replaces:** the 88 raw `shadow-[...]` occurrences across 32 files flagged in audit §2.6.

---

## 6. Motion

The audit notes durations of 180 / 280 / 360 / 500 / 700ms scattered across components. Collapse to three:

```ts
motion: {
  enter:    '180ms ease-out',
  emphasis: '280ms cubic-bezier(0.16, 1, 0.3, 1)',
  pulse:    '600ms ease-in-out',
}
```

Anything outside these three needs justification in a same-line comment.

---

## 7. Verification protocol (agent runs this before locking values)

Before staging the token additions, the agent must verify each numeric value against the canvas. Use ImageMagick or similar; values below assume the canvas PNGs are accessible at 1:1.

**Ember hex:**
```bash
# Sample the CTA fill at the visual center of the Build My Plan button
convert docs/design/hybrid-premium-canvas/03-cook-setup.png \
  -crop 1x1+540+1480 +repage txt: | tail -1
# Compare to 01-home.png Resume Plan
convert docs/design/hybrid-premium-canvas/01-home.png \
  -crop 1x1+540+780 +repage txt: | tail -1
# Pixel coordinates above are approximate; adjust to land cleanly inside the button fill.
```

If the three samples agree within ±2 RGB per channel, that's the canonical ember. If they diverge, report it — that's a canvas inconsistency worth flagging.

**Muted opacities:**
```bash
# Sample card subtitle text against card background, compute apparent opacity
# Card subtitle: "Asado · 6–8 People" in 01-home.png
# Card title:    "Sunday Night Parrillada" in 01-home.png
# Helper label:  "Suggested range" in 06-parrillada-entry.png
```

Three samples should produce three distinct alpha values approximately at 0.90 / 0.70 / 0.50. Report any that don't fit.

**Card radius:**
```bash
# Trace the corner curve on a standard card (e.g. Cooking Strategy in 03-cook-setup.png)
# A 20px-radius corner at the canvas's native render scale has a known pixel signature.
# Measure both standard cards AND highlighted (ember-outlined) cards.
```

If `card` and `hero` measure the same, collapse to one token.

---

## 8. Lint rule (Slice A's other half)

After the token additions land, this rule fires in CI:

```js
// eslint custom rule: no-arbitrary-tailwind-tokens
// Fails on raw arbitrary values that have a ds.* equivalent.

const FORBIDDEN_PATTERNS = [
  /\btext-\[\d+px\]/,                   // use ds.text.*
  /\btext-\[clamp\([^)]+\)\]/,
  /\brounded-\[[\d.]+rem\]/,            // use ds.radius.*
  /\brounded-\[\d+px\]/,
  /\bshadow-\[[^\]]+\]/,                // use ds.shadow.*
  /\bbg-white\/\[0\.0\d+\]/,            // use ds.color.muted (for text) or
                                        //   ds.panel.* (for surfaces)
  /\btext-white\/(?!50|70|90)\d+/,      // only 50/70/90 allowed
  /\btext-slate-\d+\/\d+/,              // use ds.color.muted.*
  /\bduration-\[\d+ms\]/,               // use ds.motion.*
];

const OPT_OUT_COMMENT = /\/\/\s*allow-arbitrary:/;
```

**Scope:** `components/**/*.tsx` and `app/**/*.tsx`. Excludes `lib/design-system.ts` itself.

**Opt-out:** a `// allow-arbitrary: <reason>` comment on the same line lets a value through. Use sparingly; CI tracks opt-out count and flags growth.

---

## 9. Out-of-scope for Slice A

These are deferred to Slice D or later:

- New primitives (`ListRow`, `SetupOptionCard`, `TimelineRow`, `WarningRow`) — Slice D.
- Bottom-nav-with-labels structural change — happens during the consuming slice (B or D), since it's a markup change, not a token change.
- Phase-tint / severity-tint badges (`HIGH`, `MEDIUM`, `LOW`) — already covered by `ds.liveBg.*` per audit §4; the canvas confirms those are correct.
- Decorative photography rules in Cut Selection — Slice C / D concern, not a token.

---

## 10. Open questions before locking

1. **Existing `lib/design-system.ts` content** — the agent must read the current `ds.*` exports and report any conflicts before adding. Tokens proposed above may already exist under different names (e.g. `ds.panel.card.radius` might already encode the card radius).
2. **`#FF6A00` vs `#E36A1A` vs `bg-orange-500`** — three candidates for the canonical ember. Pixel measurement against three canvases (§7) decides.
3. **Card vs hero radius** — confirm they're actually distinct after measurement, or collapse.
4. **Letter-spacing on eyebrows** — `0.08em` is a guess. Read the canvas.

Resolve these four before staging the token additions.
