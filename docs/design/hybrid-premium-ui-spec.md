# Hybrid Premium UI Spec — Parrillero Pro

> Source of truth for the visual implementation of Parrillero Pro.
> Derived from the local Hybrid Premium canvas references in `docs/design/hybrid-premium-canvas/` (gitignored, local-only).
> Owner: Product / Design.
> Status: approved direction, staged implementation per Section 12.

**Important:** Canvas reference images are visual sources only. The committed product UI must implement what is described here, not what is drawn. Dotted callouts, side annotations, marketing-board background composition, and explanatory labels around the phone in the canvases are presentation devices for the design board — they are NOT part of the app and must never be ported into product code.

---

## 1. Product Feeling

Parrillero Pro is a **premium dark mobile app** for grilling decisions and execution. The intended feeling is:

- Premium, calm, and controlled. The user feels guided, never lectured.
- Ember / fire / luxury tone — warm orange accents over deep, near-black backgrounds. Not a theme park, not a SaaS dashboard, not a bright recipe app.
- **Decision engine + live execution guide.** The app helps the user *decide* (cut, doneness, setup) and then helps the user *cook* with confidence. Both halves matter; neither is a content feed.
- **Execution-first.** During cooking, the UI must be unambiguous, glance-friendly, and thumb-driven.

What it is NOT:

- Not a recipe app — no long prose, no editorial blocks, no curated content streams.
- Not a generic dashboard — no metric grids without intent, no card walls.
- Not a bright SaaS UI — no white backgrounds, no light blue chrome, no Material Design defaults.
- Not a fitness/nutrition app — no progress bars over personal goals, no streaks, no gamification.

Tagline informing tone (from canvas board): "Plan it. Fire it. Nail every bite."

---

## 2. Visual Principles

1. **Clean premium dark UI.** Continuous near-black canvas; modules sit on it, not inside an outer frame.
2. **Selective icons only.** Icons appear when they help a decision or identify a thing (cut, setup, equipment). They do not decorate.
3. **Summary-first review.** Result and Parrillada screens lead with a hero summary; details follow on demand.
4. **Grouped execution commands.** Live cooking groups the active command together with target temps and zone, then "up next" — never scattered.
5. **Progressive disclosure.** Disclosures (`<details>`-style toggles) are the default for "why" content. The first line is always visible; expansion is opt-in.
6. **One dominant action per screen.** The orange CTA. Secondary actions are visually quieter.
7. **No decoration without function.** Every visual element should support a decision, an identification, or a confirmation. If it doesn't, remove it.
8. **Plan with intention, cook with confidence.** Setup screens slow the user down to make a deliberate choice; live screens speed them up to act.

---

## 3. Color System

Practical token set extracted from the canvases. Names are conceptual; concrete Tailwind/HEX values listed in parentheses are the closest match to existing `lib/design-system.ts` tokens — implementations should map through `ds.*` rather than hardcoding.

**Primary surfaces:**

- App background — deep near-black with subtle ember radial wash. Existing: `ds.shell.page` (`#050301 → #090807 → #030201` linear + warm radial corners). Keep as-is.
- Elevated surface (cards) — slightly lifted dark gradient with a hairline white border at ~10% opacity. Existing: `ds.panel.card`, `ds.panel.result`.
- Card surface (compact rows) — `bg-white/[0.04..0.06]` over the canvas, with `border-white/10`.
- Card border — hairline `border-white/10` is the default; `border-orange-500/30` for selected / accented states.
- Warm border — `border-orange-500/40..50` for highlighted CTAs and active selections.

**Brand accents (primary):**

- **Ember orange (primary)** — the signature accent. Used for the ONE dominant CTA per screen and selected-state highlights. Existing: `bg-orange-500 text-black` for solid, `border-orange-500/50 bg-orange-500/10 text-orange-200` for outline. **No screen should have more than one solid ember CTA visible at once.**
- **Copper / amber (secondary accent)** — text-only treatments (`text-orange-200`, `text-orange-300`), small pill chips, eyebrow labels. Used to draw attention without competing with the dominant CTA.

**Text:**

- Strong text — `text-white` for hero titles, metric numbers, primary content.
- Body text — `text-slate-200` / `text-white/85`.
- Muted text — `text-slate-400` for helper / secondary.
- Eyebrow / section labels — `text-orange-300` uppercase tracked, OR `text-white/55` uppercase tracked when the orange would compete with a CTA.

**Status:**

- Success — `text-emerald-200` over `bg-emerald-500/10` border `border-emerald-500/30`. Use for confirmation states (cook complete, plan saved). Quiet.
- Warning — amber/orange treatment (re-uses brand ember palette but as a text/border overlay, not solid CTA). Reserve for "check before continuing" states.
- Danger / alert — `text-red-200` over `bg-red-500/10` border `border-red-500/30..40`. Use for "stops the action" / safety-critical errors. Sparingly.

**Rare cool accents:**

- Cool blue/sky — used **only** for Live and Pro badges, indirect-zone indicators, and rest-phase visuals. Never for primary CTAs or general chrome. Existing: `text-sky-200`, `bg-sky-500/[0.07]`, `border-sky-300/20`.
- Cool blue must NEVER appear as a body-text or button color. It is a status accent only.

**Forbidden:**

- Random purple / pink / violet gradients.
- Generic Material blue for buttons or surfaces.
- White surfaces or light cards.
- More than one solid ember CTA on screen at once.

---

## 4. Typography System

Compact, premium, mobile-first. Existing `ds.text.*` tokens already encode most of this — extend rather than replace.

| Role | Approximate spec | Existing token to reuse |
|---|---|---|
| Hero title (Result, Parrillada Review) | 24–28px, font-black, tracking-tight, white | adapt `ds.text.heroTitle` (currently 30/48px); add a mobile-tight variant |
| Section title | 18–20px, font-semibold | `ds.text.title` |
| Section label / eyebrow | 10–11px, uppercase, tracking-[0.16em–0.2em], `text-orange-300` or `text-white/55` | `ds.text.eyebrow` |
| Body | 14px, leading-relaxed, `text-slate-200` | `ds.text.body` |
| Helper text | 12–13px, `text-slate-400` | `ds.text.muted` |
| Metric number (large) | 24–32px, font-black, tracking tight, white | new — codify a `ds.text.metricLarge` |
| Metric number (compact) | 16–20px, font-bold | new — `ds.text.metricCompact` |
| CTA primary text | 14–16px, font-bold, color depending on solid/outline | already in `ds.button.primary` / `outlineAccent` |
| Chip text | 12px, font-semibold, often uppercase tracked when small | `ds.badge.base` family |
| Warning text | 12–13px, `text-red-200` or `text-orange-200` per severity, never bold-shouty | derive from `ds.notice.error` |

Tone rules:

- Headlines are short, declarative ("Cook with confidence", "Build the perfect parrillada"). No marketing hype, no exclamation marks.
- Never wrap a CTA over two lines. If you can't fit, the copy is too long.
- Eyebrow labels sit above titles, never below.

---

## 5. Layout System

- **Continuous dark page canvas.** The app's background is a single dark surface (`ds.shell.page`). Cards float on it. There is **no giant outer card** wrapping the entire screen content. (See Anti-Patterns.)
- **Cards are content modules**, not page frames. They group related fields, summary metrics, or rows. They do not nest more than one level deep.
- **Mobile primary viewport: 375 px wide.** All screens must look correct and usable at 375 px. Tablet/desktop is acceptable but a secondary concern; do not let a desktop layout dictate mobile structure.
- **Safe-area aware.** Top headers and bottom CTAs respect `env(safe-area-inset-top/bottom)`. Already partially in place via `pt-[max(...,env(safe-area-inset-top))]` patterns; keep that style.
- **Compact top headers** with a single back affordance + a screen title + (optionally) a single right-side action. No header carousels, no tab bars in the header.
- **Section spacing** of 16–20 px between modules; 12 px within a card; 8 px between rows in a list.
- **Bottom nav** is fixed, near-black with a hairline top border, 5 entries (Home, Cuts, Cook, Plans, Settings). Always visible on top-level screens; hidden during Live execution. Existing: `ds.nav.bottom`.
- **Sticky bottom action area** for screens whose flow ends in a "Continue" / "Build Plan" / "Start Live Cooking" CTA. The CTA is fixed to the bottom safe-area; the scrollable content has padding-bottom equal to the CTA height plus margin.

---

## 6. Component Language

Visual rules below each name. "Reuse" means a real implementation already exists; "Create later" means a component should be added during the relevant Phase in Section 12.

### AppShell / PageCanvas
- **Role:** the dark page wrapper. Provides background, safe-area padding, and bottom-nav clearance.
- **Density:** single instance per route; never nested.
- **Border/radius/shadow:** none — it's the canvas.
- **Use when:** every full-page screen.
- **Don't use when:** wrapping individual cards (cards live inside the shell, not vice versa).
- **Reuse:** `ds.shell.page` + `ds.shell.container`.

### ScreenHeader
- **Role:** compact top bar with title + back/close + at most one action.
- **Density:** ~52 px tall (excluding safe-area top).
- **Border:** hairline bottom optional; usually transparent.
- **Use when:** every secondary screen (Cut Selection, Cook Setup, Result Plan, Live, Parrillada *).
- **Don't use when:** Home (uses logo-led launcher instead).
- **Create later** as a small reusable component; today header markup is duplicated across screens.

### PremiumCard
- **Role:** the standard module surface for grouped content.
- **Density:** padding 16–20 px; rounded 16–24 px.
- **Border/radius/shadow:** hairline `border-white/10`, subtle dark gradient, soft black shadow. Existing: `ds.panel.card` / `ds.panel.result`.
- **Use when:** any group of related rows/metrics.
- **Don't use when:** wrapping the whole page; or as a standalone single-row container (use `ListRow` directly on canvas).

### HeroSummaryCard
- **Role:** the strong "this is what you're cooking" panel at the top of Result Plan and the Parrillada Review.
- **Density:** generous; prominent title; one or two metric rows; one optional setup visual; one primary CTA.
- **Border/radius/shadow:** `ds.panel.hero` family — a slightly richer gradient, hairline orange-tinted top edge, and warmer shadow.
- **Use when:** Result Plan (single cut) and Parrillada Review (multi-cut summary).
- **Don't use when:** anywhere mid-flow — it's reserved for "ready to act" moments.
- **Reuse:** `components/ResultHero.tsx` is the canonical implementation; align the parrillada hero card to match.

### MetricTile
- **Role:** small framed pill showing one labeled value (Time, Temp., Doneness, Pull Temp, Heat).
- **Density:** ~64–88 px wide; eyebrow label above, large bold number below.
- **Border/radius/shadow:** rounded 16–18 px, subtle warm/red/sky tint per tone.
- **Use when:** inside HeroSummaryCard, top of Live Cooking, top of Parrillada Review summary.
- **Don't use when:** mixed with body text in a paragraph; metrics belong together in a row.
- **Reuse:** the `renderControlMetric` helper inside `ResultHero.tsx`. Extract to a real component during Phase 1.

### SectionLabel
- **Role:** the uppercase eyebrow above a card or list section ("MAIN SEQUENCE", "FUEL & SETUP", "TEMPS").
- **Density:** 10–11 px, tracked, `text-orange-300` (when next to body content) or `text-white/55` (next to a CTA).
- **Use when:** introducing a logical group inside a card or above a list.
- **Don't use when:** as a heading for the whole screen (that's ScreenHeader).
- **Reuse:** `ds.text.eyebrow`.

### IconBadge
- **Role:** small square icon container that identifies a thing (cut, equipment, fuel type, mode).
- **Density:** 32–44 px, rounded 12 px, hairline border.
- **Border/radius/shadow:** `ds.media.iconBox` for compact list use; `ds.media.iconTile` for larger contexts.
- **Use when:** leading a `ListRow`, identifying a saved cook, marking a strategy.
- **Don't use when:** purely decorative — always paired with naming text.

### ListRow
- **Role:** the workhorse selectable row.
- **Density:** 56–72 px tall, padding 12–14 px, rounded 18 px.
- **Layout:** `IconBadge` + (title + subtitle) + (right-side meta or chevron).
- **Selected state:** ember outline (`border-orange-500/40`), warm tint (`bg-orange-500/[0.06–0.10]`), subtle glow.
- **Use when:** Cut Selection, Cook Setup field rows, Saved Plans, Parrillada cut list.
- **Don't use when:** content wants more than three lines — use a card instead.
- **Create later** as a real reusable component; today similar markup is repeated.

### CutSelectionRow
- **Role:** specialized `ListRow` for cuts.
- **Visual:** cut icon (left) + cut name (medium-weight white) + short descriptor (muted) + selected check or chevron.
- **Use when:** the Cut Selection screen and the Parrillada cut-chooser sheet.
- **Reuse:** `components/cuts/*` already does most of this; align spacing/density with the canvas.

### SetupOptionCard
- **Role:** a tappable card-row for selecting a strategy (Reverse Sear, Two Zone, Indirect, etc.).
- **Visual:** small icon + title + one-line "what this is for" + chevron. Selected state with ember outline.
- **Use when:** Cook Setup → Cooking Strategy.
- **Don't use when:** binary toggles (use a smaller toggle row instead).
- **Create later** during Phase 5.

### TimelineRow
- **Role:** an ordered numbered step in a plan list (Result Plan: Prepare / Sear / Reverse / Rest / …).
- **Visual:** rounded ordinal (01, 02, 03 with subtle white border) + step title + duration on the right.
- **Use when:** Result Plan overview, Parrillada Review main sequence.
- **Don't use when:** in Live (Live uses LiveNowCard / UpNextCard, not a flat list).

### TemperatureMetric
- **Role:** a metric tile dedicated to temps with internal/external split (e.g., 225°C heat / 57°C target / 180°F pull).
- **Visual:** identical density to `MetricTile` but with a subtle red tint for "core target" and a sky tint for "indirect".
- **Use when:** Live, Result Plan summary, Parrillada Review temps row.

### WarningRow
- **Role:** a one-line advisory inline with content.
- **Visual:** small left icon + short text, framed by `ds.notice.error` (danger) or amber (warning).
- **Density:** compact; never grows into a paragraph.
- **Use when:** "Finish sensitive items first" advisory; "Avoid this mistake" tips on Result.
- **Don't use when:** for general body content — only for actionable cautions.

### PrimaryCTA
- **Role:** the one dominant action on a screen.
- **Visual:** full-width (or near-full-width), solid ember, bold black text, ~52 px tall, rounded 18 px.
- **Use when:** "Continue to Setup", "Build My Plan", "Start Live Cooking", "Looks good, start cooking", "Resume Plan".
- **Don't use when:** for "Edit", "Cancel", or any secondary action.
- **Reuse:** `ds.button.primary`.

### SecondaryCTA
- **Role:** the quieter sibling to `PrimaryCTA`.
- **Visual:** outline or ghost variant; `text-slate-200` or `text-orange-200` depending on emphasis. Smaller height (44 px).
- **Use when:** "Edit plan", "Saved", "Share".
- **Don't use when:** as the primary action.
- **Reuse:** `ds.button.secondary` / `ds.button.outlineAccent`.

### BottomNav
- **Role:** persistent navigation across the top-level modes.
- **Visual:** 5 icons + labels (Home / Cuts / Cook / Plans / Settings). Active tab uses ember; inactive `text-slate-400`. Hairline top border.
- **Density:** ~56 px tall above safe-area bottom.
- **Hide on:** Live Cooking, modal overlays.
- **Reuse:** `ds.nav.bottom`.

### LiveNowCard
- **Role:** the dominant card during live cooking — what to do *right now*.
- **Visual:** large white step title ("Sear the sirloin then Rest in a Honey / Chulchón"), countdown chip, target temp inline, primary action button.
- **Density:** the largest card on the Live screen; everything else is secondary.
- **Use when:** the active step in Live Cooking and Parrillada Live.
- **Don't use when:** anywhere outside execution.

### UpNextCard
- **Role:** brief "what's after this" preview during execution.
- **Visual:** smaller card, `text-white/75`, single-line step title + duration. No CTA.
- **Use when:** below the LiveNowCard.
- **Don't use when:** more than two upcoming items deep — Live focus is one-step-ahead.

### ParrilladaSummaryCard
- **Role:** a HeroSummaryCard variant for multi-cut parrillada (4 cuts, 8 guests, complexity, warnings count).
- **Visual:** title + chip row of meta + small avatars/icons for guests when relevant.
- **Use when:** Parrillada Review, Parrillada Live header.

### ParrilladaTimelineCard
- **Role:** the grouped execution timeline ("00:00 High Heat Group", "00:50 Med Heat Group", "01:30 Low & Indirect Group").
- **Visual:** rows ordered by start time, each with offset, group name, and difficulty/notes pill on the right.
- **Use when:** Parrillada Review and Parrillada Live (the Live version highlights the active group).

### CompactDisclosure
- **Role:** the `<details>`-style "Why this plan?" / "More info" toggle.
- **Visual:** an eyebrow label + always-visible one-liner + a small "Show detail / Hide" pill button.
- **Density:** tight; never more than 3 detail lines.
- **Use when:** Result hero (`Why this plan?`), Cook Setup tips (when needed), Parrillada Review confirmations.
- **Reuse:** the disclosure pattern shipped in Phase A inside `components/ResultHero.tsx`. Codify as a small component during Phase 2.
- **Don't use when:** for content longer than 3 short lines — use a separate screen.

---

## 7. Screen-by-Screen Direction

### Home

- **Logo-led premium launcher.** The brand mark sits at the top, generous space below. No hero photo of food.
- **Quick resume / next cook.** A single hero card calls out the upcoming session ("Welcome back, Grill Master. Sunday Night Parrillada — Asado, 6 ppl, sunset, 32°C") with a "Resume Plan" PrimaryCTA inline.
- **Recent plans** as a compact list (3–5 items). Each row: cut/event icon + name + 1-line meta + chevron.
- **Clean bottom nav** (Home / Cuts / Cook / Plans / Settings).
- **No giant hero photo** at the top. No banner ads. No live "trending" content.
- **Calm command center.** The user should feel they have control over their week of grilling.

### Cut Selection

- **Search first.** A persistent search input pinned just under the header.
- **Animal/category chips** below search (All, Beef, Pork, Chicken, Lamb). Active chip uses ember outline.
- **Compact rows.** Cuts grouped by category with a small section label (BEEF, PORK, CHICKEN). Each row: cut icon + name + short descriptor + chevron.
- **Icon-led cut identity.** Icon visual is what identifies the cut at a glance — the descriptor is secondary.
- **2–4 item lite selection.** The screen accommodates selecting one cut or up to a small handful for parrillada. Selected rows show ember outline.
- **Dominant continue CTA.** Sticky bottom: "Continue to Setup". Always visible; disabled when no cut is selected.

### Cook Setup

- **Intentional setup.** Title sets the tone: "Build the perfect cook" / "Define your cook with clarity". This is the screen that asks for deliberation.
- **Four sections, each as a `PremiumCard`:**
  - **COOKING STRATEGY** — Reverse Sear / Two Zone / Direct / etc. as a `SetupOptionCard` row with strategy hint underneath ("Hot sear, finish at lower temp").
  - **DONENESS & TIMING** — current target ("Medium Rare 55°C — 01:30 hr") with chevron to drill in.
  - **GRILL CONDITIONS** — Grill Temperature ("Hot Closed") and Wind ("Light") as compact controls.
  - **FUEL & SETUP** — fuel type ("Lump Charcoal") and configuration ("Two Zone, Lid On").
- **One dominant Build Plan CTA** — sticky bottom: "Build My Plan".
- **Conditions at a glance** — the four cards compress to a digestible snapshot before the plan is generated.

### Result Plan

- **Summary-first review.** A short eyebrow ("RESULT PLAN") above a strong title ("Bone-in Ribeye / Chuletón").
- **Hero summary** as the dominant card: cut title, total time, audience, heat target, pull temp, doneness, optional setup visual.
- **Key metrics** in a `MetricTile` row immediately under the title.
- **Plan overview** as `TimelineRow`s (01 Prepare 10 min / 02 Sear 4 min / 03 Reverse 18–22 min / 04 Rest 8 min / 05 Slice / Serve …).
- **Compact "Why this plan?" disclosure** (CompactDisclosure) — already implemented in Phase A; keep position under the metric row.
- **One strong setup visual** when useful (gas / two-zone webp from `setupVisualMap`). Selective: only when the configuration benefits from a visual.
- **Clear Start Live Cooking CTA** at the bottom — sticky, primary.
- **Secondary actions** (Save, Share, Edit) sit in the header or as quieter ghost buttons. Never compete with Start Live Cooking.

### Live Cooking

- **Execution-first.** No bottom nav, no decoration, no marketing. The screen is a tool.
- **Now card dominant** (`LiveNowCard`) — current step title is the largest text on the screen. Step number + countdown + target temp inline.
- **Timer visible** at all times when active. Countdown legible at arm's length.
- **Temps at a glance** — pull temp / target temp / heat with `TemperatureMetric` tiles directly under the Now card.
- **Up Next** (`UpNextCard`) — one card after Now showing the next step.
- **Up Next After** — optional second-glance card, smaller, never with a CTA.
- **Minimal distraction.** No food photography, no "did you know" tips, no unrelated data.
- **Pause / Done actions clear** — Pause on the left, "Mark as Done" / "Mark Step Complete" on the right. Both thumb-reachable. Solid ember on the action that advances; quieter outline on Pause.
- **Phase tinting** — the page background subtly tints (warm orange for active, sky for rest, yellow for urgent). Never decorative.

### Parrillada Entry

- **Quick start.** Small intro ("Start with intent. Plan with confidence.") then immediately ask the two questions that gate everything: name + serve target.
- **Lightweight entry** — one input and one stepper. No required-but-optional fields.
- **Guest-aware planning** — guest count drives downstream cut sizing.
- **Minimal form friction** — sticky "Continue to Plan" PrimaryCTA at the bottom.

### Parrillada Setup

- **Selected cuts** as a vertical list with `IconBadge` + cut name + Remove link.
- **Strategy** ("Serve at same target", "Sequenced") as toggleable rows with a strategy hint.
- **Heat / fuel / setup** as a compact section like Cook Setup.
- **Compact zone layout** as a small visual snapshot (sear vs indirect).
- **Review plan CTA** sticky at bottom — "Add Selection" or "Continue to Review" depending on flow.
- **Compact but confident** — never feel like a spreadsheet. The list of cuts is meant to be scanned, not edited row-by-row.

### Parrillada Review

- **Review before fire-up.** The screen lives between planning and execution; tone is "confirm, adjust if needed, start with confidence".
- **Compact plan summary** (`ParrilladaSummaryCard`) — cuts count, guests, complexity, warnings count, all in one row of small chips at the top.
- **Main sequence** (`TimelineRow`s) — ordered execution steps with start offsets ("00:00 High Heat Group, 00:50 Med Heat Group, 01:30 Low & Indirect Group").
- **Grouped execution timeline** (`ParrilladaTimelineCard`) — rows ordered by time, each named group with its difficulty and notes.
- **Warnings / advisories** (`WarningRow`) inline — "Finish sensitive items first", "Brisket starts at 06:20".
- **Looks good / start cooking CTA** — sticky bottom primary.

### Parrillada Live

- **Grouped live guidance.** The Live screen for a parrillada shows the active group on top, the team's responsibilities, and "up next" group below.
- **Team-first instructions** — short, imperative phrases ("Move chicken thighs to indirect", "Rotate ribeye 90°").
- **Finish sensitive items last.** The timeline order is fixed by the planner; the live view enforces it.
- **Now card** (`LiveNowCard`) keeps the team focused on a single current group + its dominant step.
- **Up Next section** showing the next group, with the cuts about to enter cooking.
- **Confident execution controls** — Pause / Mark as Done; never more than two visible actions.

---

## 8. Interaction Rules

- **One primary CTA per screen.** If a flow needs two actions, one of them is `SecondaryCTA`.
- **Secondary actions visually quieter** — outline / ghost / icon-only.
- **Disclosure for extra explanation** — always opt-in via a button or `<details>`. Never a default-expanded prose block.
- **Warnings concise and contextual** — one line, one icon, one severity. No multi-step "info notices".
- **Live actions thumb-friendly** — bottom 25% of screen reserved for primary action, both vertically reachable on a held phone.
- **Tap targets at least 44 × 44 px.** Existing `px-4 py-2.5` minimums and `h-10`/`h-12` icon buttons satisfy this. Verify on every new control.
- **No hidden critical actions.** Save, Start, Pause, Reset must always be visible without scrolling on the screen they belong to.
- **No overloaded educational blocks.** A "Why this plan?" disclosure can carry up to 3 short lines; longer educational content goes to a dedicated screen, not buried in a card.

---

## 9. Image and Icon Rules

- **Icons are functional, not decorative.** Use the existing icon registry first (`lib/assets/iconRegistry.ts`, `lib/cutIconMap.ts`, brand icons in `lib/brand/iconAssets.ts`).
- **Cut icons in selection / list identity.** Each cut row leads with its dedicated cut icon. The icon is the identifier; the name is the confirmation.
- **Setup visuals selectively.** One curated webp per Result Plan when the configuration benefits from a visual (gas + two-zone, kamado + indirect, charcoal + two-zone, reverse-sear, etc.). Routed through `lib/setupVisualMap.ts` — the Phase A map covers all 11 assets.
- **Avoid decorative food photography in Live.** Live shows phase tinting, not food images.
- **Never import canvas images into product UI.** The PNGs in `docs/design/hybrid-premium-canvas/` are gitignored and must stay local. They are not assets — they are sources.
- **Source assets must be optimized.** All in-product images go through `pipeline:assets` (Sharp/webp). No raw PNGs in `public/`.

---

## 10. i18n and Copy Tone

- **Short, confident copy.** "Cook with confidence." "Build the perfect parrillada." "Looks good, start cooking." Direct, action-oriented.
- **Neutral Spanish.** Default voice is es-MX-leaning but understandable across LATAM and Spain. No regional slang.
- **User-facing copy through i18n.** All strings route through `lib/i18n/texts.ts` and `lib/i18n/surfaceFallbacks.ts`. No hardcoded strings in components.
- **English-first internal architecture.** Identifiers, types, and code-level naming stay in English (`liveStarted`, `setupKey`, etc.) even when the UI renders Spanish.
- **No long recipe explanations.** A cut card is identification + short descriptor, not a paragraph.
- **No hype-heavy marketing copy inside the app.** "BEST EVER!" / "TRENDING" / "MOST LOVED" — none of it. The marketing canvas tagline ("Plan it. Fire it. Nail every bite.") is for the canvas, not the app UI.
- **Action-oriented cooking guidance.** "Move to indirect." "Sear 90 seconds." "Rest 8 min." Imperative voice. No "you might want to consider".

---

## 11. Implementation Mapping

### Existing tokens to reuse (today)

- `lib/design-system.ts:ds.shell.page` — exactly the canvas this spec wants.
- `lib/design-system.ts:ds.panel.card` / `ds.panel.result` / `ds.panel.hero` — card surfaces; close enough to canvas language.
- `lib/design-system.ts:ds.button.primary` / `outlineAccent` / `secondary` — primary/secondary CTA family.
- `lib/design-system.ts:ds.text.eyebrow` / `title` / `body` / `muted` — typography.
- `lib/design-system.ts:ds.media.iconBox` / `iconTile` — IconBadge surfaces.
- `lib/design-system.ts:ds.badge.*` — chip family.
- `lib/design-system.ts:ds.nav.bottom` — BottomNav.
- `lib/design-system.ts:ds.notice.*` — info / success / error notice rails.
- `lib/setupVisualMap.ts` — setup visuals (Phase A: 11 keys mapped).
- `lib/cutIconMap.ts` — cut icons.
- `lib/i18n/texts.ts` + `lib/i18n/surfaceFallbacks.ts` — copy.

### Tokens that should be extended later

- **Typography.** Add `ds.text.metricLarge`, `ds.text.metricCompact` for hero metric numbers (currently inline-styled).
- **Cards.** Add a `ds.panel.row` for `ListRow` density (currently re-derived per call site).
- **Hero variants.** Codify a `ds.panel.heroParrillada` for the multi-cut hero card (vs single-cut Result hero).
- **Phase tints (Live).** Extract the `getBgStyle` radial gradients in `components/live/LiveCookingScreen.tsx` into a `ds.live.bg.<phase>` map for reuse.
- **Disclosure.** Codify a `ds.disclosure.*` pattern around the Why-this-plan affordance.

### Components that should be created later

- `components/ui/ScreenHeader.tsx` — the compact top bar pattern that's currently duplicated.
- `components/ui/MetricTile.tsx` — extract from the `renderControlMetric` helper in `ResultHero.tsx`.
- `components/ui/ListRow.tsx` — the workhorse selectable row.
- `components/ui/SetupOptionCard.tsx` — Cooking Strategy row.
- `components/ui/TimelineRow.tsx` — numbered ordinal step row.
- `components/ui/TemperatureMetric.tsx` — temp-tinted metric tile.
- `components/ui/WarningRow.tsx` — inline advisory.
- `components/ui/CompactDisclosure.tsx` — wrap the Why-this-plan pattern from `ResultHero.tsx`.
- `components/live/LiveNowCard.tsx` and `components/live/UpNextCard.tsx` — extract the dominant Live cards from the current monolithic `LiveCookingScreen.tsx`.

### Screens that already partially match the spec

- **Result Plan (`components/ResultHero.tsx` + `ResultGrid.tsx` + `ResultCard.tsx`)** — closest to the canvas. Hero is ~80% there; metrics row, Why-this-plan disclosure, and one setup visual are already implemented in Phase A. **Priority: low-risk polish.**
- **Live Cooking (`components/live/LiveCookingScreen.tsx` + `useLiveCooking` + `useLiveCookingSession`)** — the execution model and phase tinting are correct. The Now / Up Next / Up Next After hierarchy is conceptually present but visually denser than the canvas; needs a card-extraction pass.
- **Cut Selection (`components/cuts/CutSelectionScreen.tsx`)** — search + chips + grouped rows are present at 656 LOC. Spacing and selected-state visuals likely need light alignment with the canvas.
- **Bottom nav** — `ds.nav.bottom` exists; canvases imply 5 entries with cleaner glyphs; no major rework.
- **Home (`components/home/HomeScreen.tsx`)** — already follows the "no hero photo" rule. Needs the "Welcome back" + "Resume Plan" hero card pattern from canvas 01.

### Screens that need the most visual work

- **Cook Setup** — currently lives inside the 1,577-line `CookingWizard.tsx`. The four-section card-stack pattern from canvas 03 (Strategy / Doneness / Conditions / Fuel) doesn't yet exist as a discrete view. **Highest visual gap, but cannot be safely refactored without the Phase B shell extraction.**
- **Parrillada Setup / Review / Live** — substantial existing implementation in `components/parrillada/*` (22 components). The existing approach is feature-complete but visually denser than the canvas. Specifically `ParrilladaReviewScreen` and `ParrilladaLiveScreen` need alignment with the timeline-grouped pattern from canvases 07 and 08. **Significant work; phase 4.**
- **Parrillada Entry** — small two-question entry exists; canvas 06 implies a slightly cleaner hero + sticky CTA. Light polish.

### Safest implementation order

See Section 12 below — staged so that each phase ships independently green and never blocks on the `app/page.tsx` shell extraction.

---

## 12. Implementation Order

This is a visual-system implementation roadmap, separate from any architectural refactor. Each phase ships under its own plan, behind its own gate.

### Phase 1 — Shared tokens / card surfaces / CTA consistency

- Codify the missing tokens listed above (`ds.text.metricLarge`, `ds.live.bg.<phase>`, etc.).
- Extract `MetricTile`, `ListRow`, `ScreenHeader`, `CompactDisclosure` into `components/ui/`.
- Replace inline-styled metric tiles, list rows, and headers across screens to use the new components. Visually identical, but consolidated.
- **No new features. No new screens. No engine changes.**
- Validation: smoke + qa:cooking + qa:flow stay green; visual diff inspected on Result, Cut Selection, Cook Setup.

### Phase 2 — Home and Result polish

- Home: refine the "Welcome back" / "Resume Plan" hero card per canvas 01.
- Result: tighten metric row, hero spacing, and the Why-this-plan disclosure already shipped in Phase A.
- Cross-check the setup-visual rendering after Phase A's map fix.

### Phase 3 — Live Cooking polish

- Extract `LiveNowCard`, `UpNextCard`, `UpNextAfterCard`, `TemperatureMetric` from `LiveCookingScreen.tsx`.
- Align phase tints with the canvas (warm orange / sky / yellow / emerald).
- Strict no-decoration audit: any food image, any non-functional graphic gets removed.

### Phase 4 — Parrillada flow polish

- Align `ParrilladaSetupScreen`, `ParrilladaReviewScreen`, `ParrilladaLiveScreen`, and the menu-builder sheet with canvases 06 / 07 / 08 / 10.
- Reuse `TimelineRow` / `ParrilladaTimelineCard` components across review and live.
- Convert dense lists to grouped sequences with section labels.

### Phase 5 — Cut Selection / Cook Setup alignment

- Cut Selection: light density / selected-state / chips alignment.
- Cook Setup: requires the four-section pattern. **This phase is most exposed to the `CookingWizard.tsx` god-component and may need to wait until shell extraction (Phase B of architecture work).** Decide explicitly before starting.

### Important boundary

**Do NOT combine the visual pass with the `app/page.tsx` architecture refactor unless explicitly planned.** Phase B (shell extraction) and Phases 1–5 (visual) are separate controlled slices. Bundling them is the fastest way to ship a regression nobody can isolate.

---

## 13. Anti-Patterns (Forbidden)

- ❌ A giant outer card wrapping the whole page. Cards are modules on the canvas, not the canvas itself.
- ❌ Random blue / purple / pink gradients. Cool blue is reserved for Live/Pro/indirect-zone status only.
- ❌ Spreadsheet-like planner UI. Even Parrillada Setup is a sequence of cards, not a grid.
- ❌ Multiple competing solid-ember CTAs visible at the same time.
- ❌ Decorative food photos in Live. Phase tinting only.
- ❌ Importing canvas images into product UI or copying them to `public/`.
- ❌ Copying side-callout annotations from the canvases into the app — they are presentation devices, not UI.
- ❌ One-off arbitrary Tailwind values when a `ds.*` token covers the case.
- ❌ Hardcoded Spanish (or English) inside components — route through `lib/i18n/texts.ts`.
- ❌ Desktop-first layouts. Mobile is the primary target; if a desktop layout dictates structure, you've inverted the constraint.
- ❌ Broad redesign during a bugfix or refactor. Every visual change is staged and reviewed under its own slice.

---

## 14. Definition of Done for Future UI Work

A change is done only if all of these are true:

- ✅ **Mobile 375 px check.** Open the screen in DevTools at 375 px wide (iPhone SE / 12 mini class) and confirm primary content + primary CTA are visible without horizontal scroll.
- ✅ **Primary action visible.** The dominant CTA is on screen at first paint (not below the fold). On screens with a sticky bottom CTA, it overlaps no critical content.
- ✅ **No visual clutter.** No element on the screen exists purely for decoration. Each element supports a decision, an identification, or a confirmation.
- ✅ **Cards feel like modules on one continuous canvas.** No screen is wrapped by an outer "page card". Background is `ds.shell.page`.
- ✅ **Copy is short and routed through i18n.** All user-visible strings live in `lib/i18n/texts.ts` and the UI consumes them via the existing surface helpers.
- ✅ **Icons support decisions.** Each icon either identifies a thing (cut, equipment) or signals a status. None purely decorative.
- ✅ **Validation passes.** `npm run lint` (0 errors), `npx tsc --noEmit` (clean), `npm run smoke` (16/16+), `npm run qa:cooking` (1116/1116), `npm run qa:flow` (7/7), `npm run build` (clean).
- ✅ **No engine, URL contract, Supabase, generated maps, or canvas images touched** unless the slice's plan explicitly authorizes it.

---

## Cross-references

- `AGENTS.md` and `CLAUDE.md` link here under "Visual Direction".
- Phase A polish that already implements parts of this spec: see commits `4f0b5eb`, `117acf1`, `2bcc80b` on the merged feature branch (live timer persistence, Why-this-plan disclosure, setup visual mapping).
- Audit doc that informed Section 9: `docs/qa/setup-visual-coverage-audit.md` (2026-05-01).
- Architecture review note about why the visual pass and shell extraction stay separate: see the Phase A plan archived at `~/.claude/plans/you-are-inspecting-the-woolly-bear.md`.
