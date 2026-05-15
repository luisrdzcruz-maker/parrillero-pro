# Slice D-tokens — Token additions

Values shipped in PR D-tokens (first of two PRs for Slice D). Locked against discovery of in-use literals across `components/` and `app/` plus the canvas in `docs/design/hybrid-premium-canvas/`.

This document is **the reference** for these additions. The discovery output captured in the PR description records the per-value callsite counts that justify each token.

> **Status:** locked for Slice D-tokens scope. Net-additive only — this PR does not migrate any consumer. Migration happens in PR D-primitives, which uses these tokens to clear ~290 amnesty markers and extracts new primitives (ListRow / SetupOptionCard / TimelineRow / WarningRow) plus MetricTile and Badge tone extensions.

Companion reference: [`slice-a-locked-values.md`](./slice-a-locked-values.md). Sections below extend the same `ds.*` surface that Slice A locked.

---

## 1. ds.text — small body tier expanded

```ts
ds.text.body14 = 'text-[14px] leading-[1.45]';   // existing
ds.text.body13 = 'text-[13px] leading-[1.4]';    // NEW
ds.text.body12 = 'text-[12px] leading-[1.4]';    // existing
ds.text.body11 = 'text-[11px] leading-[1.4]';    // existing
ds.text.body10 = 'text-[10px] leading-[1.35]';   // NEW
ds.text.body9  = 'text-[9px]  leading-[1.35]';   // NEW
ds.text.body8  = 'text-[8px]  leading-[1.35]';   // NEW
ds.text.helper = 'text-[11px] leading-[1.35] text-white/50';  // existing
```

**Rationale.** Discovery found 15 distinct `text-[Npx]` values in use. Four new tokens (body8/9/10/13) plus Slice A's existing four (body11/12/14/helper) cover 8 of those distinct values, totaling **243 callsites** that PR D-primitives migrates mechanically. Leading values match the established pattern: 1.35 for the smallest tier (8–10 px, tight at small sizes), 1.4 for the body tier (11–13 px), 1.45 for 14 px. Naming continues the body{N} convention from Slice A.

**Display-tier sizes (22+ px) and clamp() sizes stay inline** — one-off usage in display headings; tokenizing each would over-engineer the scale.

**8px verification.** Four callsites in use: three in `LiveExecutionGuide.tsx` (zone label, remaining-short, target/duration-short eyebrows), one in `AppHeader.tsx` (responsive narrowest size). The Live cooking screen has a canvas mockup (`05-live-cooking.png`) and the 8px sites are small-caps eyebrows visually subordinate to neighboring text. Without the ability to programmatically verify the canvas's exact pixel rendering, `body8` ships as a separate token rather than collapsing to `body9` — preserves possibly-intentional 1px subordination at the cost of one extra token.

## 2. ds.color.muted — 7-tier scale

```ts
ds.color.muted = {
  strong:    'rgba(255, 255, 255, 0.90)',   // existing
  body:      'rgba(255, 255, 255, 0.80)',   // NEW
  base:      'rgba(255, 255, 255, 0.70)',   // existing
  secondary: 'rgba(255, 255, 255, 0.65)',   // NEW
  helper:    'rgba(255, 255, 255, 0.50)',   // existing
  faint:     'rgba(255, 255, 255, 0.45)',   // NEW
  disabled:  'rgba(255, 255, 255, 0.35)',   // NEW
};
```

**Rationale.** Slice A locked a 3-tone scale (strong / base / helper) at 0.90 / 0.70 / 0.50 against canvas measurement. Discovery showed the codebase has since used **30 distinct opacity values** across ~143 callsites — far past what 3 tones could cover. The 7-tone scale consolidates those 30 values into named tiers with at-worst 10% snap-to-tier visual diff at migration.

Approximate cluster mapping (used for migration in PR D-primitives):

| Range in use | Snaps to | Callsites |
|---|---|---|
| 18 – 40 | `disabled` (0.35) | ~56 |
| 40 – 49 | `faint` (0.45) | ~25 |
| 50 | `helper` (existing) | 7 |
| 55 – 68 | `secondary` (0.65) | ~36 |
| 70 | `base` (existing) | 7 |
| 72 – 88 | `body` (0.80) | ~28 |
| 88 + | `strong` (existing) | 12 |

The **7-tier (rather than 6-tier) decision** kept `faint=0.45` as a distinct tier because `text-white/45` is tied with `text-white/55` as the most-used non-canonical opacity (18 callsites each) and represents a different canvas-visible semantic intent ("muted eyebrow" vs "secondary body"). Collapsing 45 → helper (50) would have produced a 5% visual diff on a heavily-used tier.

**Naming consistency.** Names descend by visual emphasis, mirroring how a reader would describe the role: `strong` titles, `body` text, `base` chrome, `secondary` annotations, `helper` hints, `faint` muted eyebrows, `disabled` chrome-off-state. Ordering in source descends by opacity.

## 3. ds.panel.subpanel — nested low-tint chassis

```ts
ds.panel.subpanel = 'rounded-2xl border border-white/[0.08] bg-white/[0.025] ring-1 ring-inset ring-white/[0.04]';
```

**Rationale.** Discovery found 106 `bg-white/[0.0X]` callsites across 15 distinct alphas. The 0.04 / 0.045 / 0.05 / 0.06 cluster (62 callsites) is already covered by Slice A's existing `ds.panel.{form, row, card, result, homeCard, glass}`. The remaining unmet need is the **0.02–0.035 tier (~23 callsites)** — used for nested panels inside an outer card (e.g. the execution-group list wrapper inside `ParrilladaTimelineFinal`, the cut selector group panels inside `ParrilladaMenuBuilderCard`).

`subpanel` ships as the full chassis className (border + bg + radius + ring) so consumers replace the whole inline pattern with `${ds.panel.subpanel}`. **Padding is intentionally not bundled** — consumers add their own padding inline because nested-panel padding is contextual (varies with content density).

**Differentiation from existing low-alpha tones:**

- `empty` (bg-white/[0.03]): full chassis with `p-6` + shadow + backdrop-blur. For empty-state hero panels, not list wrappers.
- `glass` (bg-white/5): `p-5` + shadow + backdrop-blur. For floating modal-like panels.
- `subpanel` (bg-white/[0.025]): chassis only. For nested list/group wrappers inside a parent card. No shadow (would compete with parent), no padding (callsites set their own).

**The elevated tier (0.07–0.09, ~16 callsites) was not tokenized.** Variance is too high to consolidate cleanly into one tone, and 16 callsites isn't enough to justify two new elevated tones. PR D-primitives will surface candidates during migration; remaining elevated sites keep their `allow-arbitrary` markers until a future polish slice.

## 4. ds.shadow — unchanged

Slice A already shipped `cardBase / cardLifted / emberGlowSm / emberGlowMd`. No additions in PR D-tokens.

## 5. What PR D-tokens does NOT do

- **Migrate any consumer.** Net-additive only. The 464 amnesty marker burn-down count stays exactly at 464 after this PR. PR D-primitives clears ~290 markers mechanically by migrating consumers to the tokens added here.
- **Extract new primitives** (ListRow / SetupOptionCard / TimelineRow / WarningRow). PR D-primitives.
- **Add `success` / `danger` tones to `<MetricTile>` or intensity variants to `<Badge>`.** PR D-primitives, per the memory entry `slice-d-scope-additions-from-slice-b.md`.
- **Tokenize the ember-tint tier** (`text-orange-XXX/N` patterns at non-canonical alphas, ~110 callsites). Deferred to a follow-up — tracked in memory entry `slice-d-followup-ember-tint-tokens.md`.
- **Touch `bg-white/N` Tailwind-native syntax** (no brackets — `bg-white/10` etc.). These pass the existing lint rule (only the bracket form `bg-white/[0.0X]` is forbidden); they don't contribute to the amnesty burn-down and don't need consolidation.
- **Change the lint rule.** No new rules; the rule already accepts `ds.*` values via consumer reference.

---

## Cross-references

- Slice A token reference: [`slice-a-locked-values.md`](./slice-a-locked-values.md).
- Slice B Group 7 amnesty audit (the cleanup that drove this token gap): [`UI-UX-audit01.md`](./UI-UX-audit01.md) §1.4 (typography), §1.5 (muted text drift).
- Visual source: `docs/design/hybrid-premium-canvas/` (canonical).
- Memory: `slice-d-scope-additions-from-slice-b.md`, `slice-d-followup-ember-tint-tokens.md`.
