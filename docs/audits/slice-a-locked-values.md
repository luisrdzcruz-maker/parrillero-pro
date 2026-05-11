# Slice A — Locked token values

Final values shipped in Slice A. Locked after the Stop 1 measurement pass against `docs/design/hybrid-premium-canvas/` (see `slice-a-token-proposal.md` §10 open questions, resolved by reviewer 2026-05-12).

This document is **the reference** for these tokens. The proposal doc captures rationale and measurement history; this doc captures the values that actually ship.

> **Status:** locked for Slice A scope. Net-additive only — Slice A does not migrate any existing token consumer to the new values. Migration happens in Slices B / D when those slices touch the affected files.

---

## 1. Ember color

```ts
ds.ember = {
  DEFAULT: '#E36A1A',
  hover:   '#D55E14',
  border:  '#E36A1A',
  faint:   'rgba(227, 106, 26, 0.12)',
};
```

**Rationale.** Canvas measurement of three CTAs (Build My Plan / Resume Plan / Mark as Done) returned non-agreeing RGB values because all three are rendered as gradients spanning roughly `#BD4506 → #ED923C`. `#E36A1A` is the closest single-hex fit to the gradient mid-tone. The existing codebase literals `#FF6A00` and `bg-orange-500` (`#F97316`) are visibly more saturated than the canvas; they are not deleted in Slice A — the lint rule blocks new uses, and cleanup happens in Slices B/D when those files get touched.

## 2. Muted text opacities — capped at 3

```ts
ds.color.muted = {
  strong: 'rgba(255, 255, 255, 0.90)',
  base:   'rgba(255, 255, 255, 0.70)',
  helper: 'rgba(255, 255, 255, 0.50)',
};
```

**Rationale.** Three visually distinct tiers in the canvas (titles / subtitles / helper labels). Programmatic sampling was unreliable on small text due to anti-aliasing; visual estimation against the cropped probe images clusters around 0.90 / 0.70 / 0.50 within ±0.05. Round numbers chosen for greppability. The lint rule bans every other `text-white/<n>` value not in {50, 70, 90}.

## 3. Radius scale — single `card` token, no `hero`

```ts
ds.radius = {
  // Legacy Tailwind-alias scale (unchanged in Slice A)
  sm: 'rounded-lg',     //  8px
  md: 'rounded-xl',     // 12px
  lg: 'rounded-2xl',    // 16px
  xl: 'rounded-3xl',    // 24px
  // Slice A — semantic scale
  pill: 'rounded-full',          // 9999px
  chip: 'rounded-xl',            // 12px (0.75rem)
  row:  'rounded-[0.875rem]',    // 14px
  card: 'rounded-3xl',           // 24px (1.5rem)
};
```

**Rationale.** Canvas cards have very faint hairline borders that don't reliably encode a card-vs-hero radius distinction. Proposal's `1.25rem / 1.5rem` two-token split is collapsed to a single `card: 1.5rem` (24 px) — matching the existing `rounded-3xl` used by `ds.panel.card`, so no migration produces a visual diff. Re-split into `hero` only if a future mockup demonstrates a meaningful difference. `pill` uses Tailwind's `rounded-full` (effectively 9999 px); `chip` uses the preset `rounded-xl` (12 px); `row` uses an arbitrary value for 14 px (no preset). The legacy `sm/md/lg/xl` keys are kept untouched.

## 4. Eyebrow labels — two flavors at existing 0.2em tracking

```ts
ds.text.eyebrowEmber = 'text-xs font-semibold uppercase tracking-[0.2em] text-[#E36A1A]';
ds.text.eyebrowMuted = 'text-xs font-semibold uppercase tracking-[0.2em] text-white/55';
```

**Rationale.** The proposal suggested `0.08em` tracking based on a canvas read, but switching every existing eyebrow site (~30+ uses of `ds.text.eyebrow`) from `0.2em` to `0.08em` produces a real visible diff that doesn't belong in a token-scaffold slice. The new variants ship at the **existing** `0.2em` tracking so adoption produces zero visual diff; the tracking change is deferred to a future visual-polish slice. The pre-existing `ds.text.eyebrow` (still `tracking-[0.2em]`, `text-orange-300`) is left untouched.

## 5. Body text tiers

```ts
ds.text.body14  = 'text-[14px] leading-[1.45]';
ds.text.body12  = 'text-[12px] leading-[1.4]';
ds.text.body11  = 'text-[11px] leading-[1.4]';
ds.text.helper  = 'text-[11px] leading-[1.35] text-white/50';
```

**Rationale.** Shipped per proposal §4. Replaces the 208 raw `text-[Npx]` occurrences flagged in audit §1.4. Existing `ds.text.body` / `ds.text.muted` are kept untouched.

## 6. Shadows

```ts
ds.shadow = {
  cardBase:    'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]',
  cardLifted:  'shadow-[0_8px_24px_rgba(0,0,0,0.35)]',
  emberGlowSm: 'shadow-[0_4px_18px_rgba(227,106,26,0.25)]',
  emberGlowMd: 'shadow-[0_12px_32px_rgba(227,106,26,0.20)]',
};
```

**Rationale.** Shipped per proposal §5. Tailwind class-string format (consistent with the rest of `ds.*`); the literal `shadow-[...]` lives inside `lib/design-system.ts`, which the lint rule exempts. Replaces the 88 raw `shadow-[...]` occurrences flagged in audit §2.6.

## 7. Motion

```ts
ds.motion = {
  enter:    'duration-200 ease-out',
  emphasis: 'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
  pulse:    'duration-[600ms] ease-in-out',
};
```

**Rationale.** Tailwind class-string format. `duration-200` / `duration-300` are exact Tailwind presets approximating the proposal's 180 ms / 280 ms (±20 ms — imperceptible in motion). `duration-[600ms]` uses an arbitrary value because Tailwind has no 600 ms preset; this literal lives inside `lib/design-system.ts` where the lint rule does not apply.

## 8. Lint rule (proposal §8 verbatim)

Implemented as a Node script at `scripts/lint-tokens.mjs`, invoked via `npm run lint:tokens`. This is the intended permanent home for the rule, **not a stopgap before an ESLint plugin** — the check is a regex match over file source, AST traversal is overkill, and a standalone script is faster to run in CI and doesn't fight ESLint's own plugin lifecycle. Promote to a real ESLint plugin only if someone specifically needs IDE inline-warning integration.

Patterns and scope match proposal §8 exactly:

- Scope: `components/**/*.tsx` and `app/**/*.tsx`.
- Exempt: `lib/design-system.ts`, `app/globals.css`, every file in `lib/` or `node_modules/`.
- Opt-out: any of these three forms, on the same line as the violation or the immediately preceding line:
  - `// allow-arbitrary: <reason>` (TS line comment)
  - `/* allow-arbitrary: <reason> */` (block comment — universal, but renders as text if placed at JSX-children position)
  - `{/* allow-arbitrary: <reason> */}` (JSX expression — required at JSX-children position)

## 9. Existing-violation amnesty

Option **(a)** — scripted pre-slice-a amnesty pass. Every line in `components/**/*.tsx` and `app/**/*.tsx` that the lint rule would flag has been annotated with an `allow-arbitrary: pre-slice-a` opt-out on the previous line. The amnesty script picks the right comment form per context:

- `{/* allow-arbitrary: pre-slice-a */}` when the violation line opens a JSX child (the previous non-blank line ends with `>` or `}` and the current line starts with `<` or `{`).
- `/* allow-arbitrary: pre-slice-a */` everywhere else (after `return (`, between JSX attributes, inside JS expressions, etc.).

The `//` line-comment form is **accepted by the lint rule but never emitted by amnesty** — the script biases toward block-comment forms because they're valid in more contexts. Two markers were hand-fixed where the heuristic mismatched JSX-children context (`components/live/StepCard.tsx`, `components/parrillada/cards/ParrilladaItemRow.tsx`). The amnesty is its own commit on the Slice A PR for reviewer clarity.

**Why parole, not blessing.** Every `pre-slice-a` marker is a grep target. Slices B and D should remove the marker and migrate the underlying value to a `ds.*` token whenever they touch the line. CI tracks the count and flags growth (no new `pre-slice-a` markers should ever appear after Slice A merges).

## 10. What Slice A does NOT do

- Migrate `ds.panel.*` to consume the new `ds.radius.*`. Deferred.
- Migrate components from inline `text-white/<n>` literals to `ds.color.muted.*`. Deferred.
- Delete existing ember hex literals (`#FF6A00`, `bg-orange-500`). Deferred to B/D.
- Change eyebrow tracking values. Deferred to a future visual-polish slice.
- Extend `tailwind.config.*` with a named `ember` color. Deferred.

---

## Cross-references

- Measurement protocol and findings: `docs/audits/slice-a-token-proposal.md` §7.
- Stop 1 report (in PR #115's review thread).
- Audit driving the slice: `docs/audits/UI-UX-audit01.md` §5, Slice A.
- Visual source for the values: `docs/design/hybrid-premium-canvas/` (canonical).
