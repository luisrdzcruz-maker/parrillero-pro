# UI / UX Audit 01 — Parrillero Pro

> **Scope:** Critical review of the visual + interaction surface across all top-level screens (Home, Cut Selection, Cook Setup/Wizard, Result, Live Cooking, Parrillada Entry/Setup/Review/Live, Guardados/Saved, Onboarding).
> **Date:** 2026-05-12
> **Branch inspected:** `visual/mobile-final-polish-pass`
> **Reference spec:** `docs/design/hybrid-premium-ui-spec.md` (Hybrid Premium direction)
> **Canonical visual source:** `docs/design/hybrid-premium-canvas/` — all visual decisions defer to the PNGs in this folder. `00-full-system-board.png` is the cross-screen tiebreaker. Slots `04` and `09` are reserved gaps; screens without a dedicated mockup follow the analogy map in that folder's README. Do not derive any screen's visual treatment from the prose spec alone.
> **Line-number caveat:** Line numbers in this audit reflect the polish branch at the time of writing and will drift on main as files change. Trust file paths and symbol references; re-grep for the symbol if a line number doesn't match. Slice work should not rely on line numbers as identifiers.
> **Method:** static read of every screen-level component, design-system token (`lib/design-system.ts`), `app/globals.css`, and the existing canvas spec. No code modified. No build/runtime run.

---

## TL;DR

The product has a clear, well-defined visual identity on paper (Hybrid Premium dark ember UI) and a real design-token file (`ds.*`). **The execution of that identity is uneven.** Three things are working against the product:

1. **Token adoption is partial.** `lib/design-system.ts` is the source of truth, but only ~23 files actually import `ds.*` while there are 1,383 `className=` literals across `components/` + `app/`. Most screens reach past the tokens and inline raw Tailwind, producing dozens of subtly different surfaces.
2. **The visual system is fragmented across "eras".** Three or four card languages coexist (legacy `ds.panel.card` glass, hand-rolled `rounded-3xl border-white/10 bg-white/[0.04]` cards in Parrillada, `rounded-[1.75rem]` photo-led CutCards in Wizard, ember-gradient hero tiles on Home). Each is internally consistent and individually attractive — together they read as a UI that lost a debate with itself.
3. **The most important screens are also the least disciplined.** `CookingWizard.tsx` is **1,577 lines** and contains its own private versions of cards, headers, and buttons; the spec calls these out as the highest-gap surfaces. The Parrillada flow has ~22 components but uses none of `ds.*` and re-implements the metric / chip / button primitives inside each card.

The product is *very close* to looking premium. The fix is not "more polish" — it is consolidation and ruthless deletion of one-offs.

---

## 1. Critical issues (must fix)

### 1.1 Two parallel button systems, neither dominant

- `components/ui/Button.tsx` exists and wraps `ds.button.*`, but it is imported in only **7 files**. The rest of the app (Parrillada, Home, Live, CutSelection, ResultHero, the wizard) writes its own `<button>` with bespoke classNames. Result:
  - **Two distinct "primary ember CTAs" in the same product.** Home + ResultHero use a `bg-gradient-to-br from-orange-200 via-orange-500 to-orange-600` tile. `ParrilladaReviewScreen.tsx:107` and `ParrilladaSetupScreen.tsx:96` use a *different* gradient (`from-orange-400 to-orange-500`). `CutBottomSheet.tsx:175` adds yet another (`from-orange-400 to-red-500`).
  - The hybrid-premium spec is explicit: "**No screen should have more than one solid ember CTA visible at once**". Today the gradient is the only "primary" tell, and there are at least three competing gradients in production.
- Anti-pattern §13 of the spec ("One-off arbitrary Tailwind values when a `ds.*` token covers the case") is violated systematically by the Parrillada package.

**Fix:** lock all primary CTAs to a single ember token (the solid `ds.button.primary` per spec §3, not a gradient). Migrate the seven non-Button screens. Remove the three gradient variants — they are visual debt.

### 1.2 Card surface fragmentation

The codebase has at least four card "languages" for the same conceptual element ("module on the canvas"):

| Language | Where it appears | What it costs |
|---|---|---|
| `ds.panel.card` (`rounded-3xl border-white/10 bg-gradient-to-br ...`) via `Panel` | `ResultHero`, `ResultCard`, a few UI primitives | The spec's intended surface. |
| Hand-rolled `rounded-3xl border-white/10 bg-white/[0.04] p-4` | All ~10 Parrillada cards (`ParrilladaHeroCard`, `ServeStrategyCard`, `ParrilladaMenuBuilderCard`, `ParrilladaTimelineFinal`, `ParrilladaReviewScreen` inline `<section>`s) | Looks like `ds.panel.card` but is not. Padding/radius/border opacity drift between cards. |
| Photo-led `rounded-[1.75rem] bg-zinc-950` + radial-gradient overlay | `CookingWizard.tsx` cut cards (lines ~490 and ~607) | Different border radius, different background base (zinc-950 vs canvas), different shadow. Heavy decorative imagery — explicitly against the cut-selection rules in the spec. |
| `rounded-[1.65rem] bg-white/[0.045]` "hero" / "homeCard" variants | Home primary tiles | Different again. |

`ds.panel.row`, `ds.panel.metric`, and `ds.panel.hero` exist — they are simply not used by ~70% of the screens that need them.

**Fix:** force every "container" to come through `<Panel tone="...">` or a new `ds.panel.row` token. Strip the inline `rounded-3xl border-white/10 bg-white/[0.04]` repetition from Parrillada (it appears verbatim in at least 8 files).

### 1.3 The wizard god-component blocks the design pass

- `components/cooking/CookingWizard.tsx` is **1,577 lines** and owns: animal selection, cut selection (full-bleed photo card variant), details (donness/temperature/equipment/thickness), and a private CutCard implementation.
- It imports its own copies of cards, headers, transitions, and helpers — none routed through `ds.*` or `ui/`.
- The hybrid-premium spec (§11) names this file as the "highest visual gap" and warns that the four-section Cook Setup canvas cannot be safely refactored without shell extraction. **Six months in, that extraction has not happened.** Every visual change to Cook Setup risks touching the god-component.
- Subtle but real cost: the inline `CutCard` here (lines 487 and 607) does NOT match the dedicated `components/cuts/CutCard.tsx`. Two cards, same role, different visuals.

**Fix:** plan a controlled extraction of Cook Setup into a dedicated screen file (e.g. `components/cooking/CookSetupScreen.tsx`) using `ListRow` + `SetupOptionCard` per spec §6, leaving the wizard as a pure flow controller. This is on the spec's roadmap as Phase 5 / "Phase B"; it has been deferred too long to keep deferring.

### 1.4 Typography: an undocumented zoo of sizes

`text-[Npx]` and `text-[clamp(...)]` appear **208 times across 53 files**:

- `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[14px]`, `text-[15px]`, `text-[17px]`, `text-[22px]`, `text-[26px]`, `text-[clamp(...)]` … all coexisting.
- Eyebrow labels alone are written as `text-[10px]`, `text-[11px]`, `text-xs`, `text-[9px] sm:text-[10px]`, and `text-xs sm:text-[11px]` depending on the file. The token `ds.text.eyebrow` exists. Almost nothing uses it.
- `font-black` is the de-facto weight for *everything* — eyebrow labels, body, CTAs, helper text — because that's how the canvas looks. Variation that should come from size + tracking comes from weight instead, which reads loud rather than premium.

**Fix:** lock typography to `ds.text.*` (extend with `body12`, `body11`, `eyebrowSmall` if needed). Treat every `text-[Npx]` as a regression and replace it. Drop `font-black` from anything that is not a headline or a metric number.

### 1.5 Color/opacity drift in muted text

`text-white/<n>` and `text-slate-<n>` appear **204 times across 47 files**. The opacities in use include: `/18`, `/22`, `/28`, `/30`, `/35`, `/38`, `/45`, `/50`, `/52`, `/55`, `/60`, `/62`, `/65`, `/70`, `/72`, `/75`, `/78`, `/80`, `/82`, `/85`. That is **20 distinct muted-text tones** — none of them documented as tokens.

The eye does not perceive a difference between `text-white/65` and `text-white/70`, but it does notice when one card sits next to another and they look subtly mismatched. This is exactly what is happening.

**Fix:** define three muted tokens (e.g. `body-strong`, `body`, `helper`) and forbid anything else.

### 1.6 Border-radius lottery

There are **131 occurrences of rounded-* utilities** across 30 files using at least these distinct radii: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-[1.05rem]`, `rounded-[1.15rem]`, `rounded-[1.25rem]`, `rounded-[1.35rem]`, `rounded-[1.45rem]`, `rounded-[1.5rem]`, `rounded-[1.65rem]`, `rounded-[1.7rem]`, `rounded-[1.75rem]`, `rounded-[1.85rem]`, `rounded-[2rem]`.

Fifteen radius values for what should be a four-step scale (`ds.radius`: sm/md/lg/xl). The wizard, home tiles, parrillada cards, and live cards each picked their own.

**Fix:** extend `ds.radius` to a 5-step scale that covers every legitimate need (chip / row / card / hero / pill) and forbid raw `rounded-[Nrem]` values outside of `lib/design-system.ts`.

### 1.7 Hard-coded English copy in the new Parrillada flow

The hybrid-premium spec §10 is explicit: *"All user-facing copy through i18n. … No hardcoded strings in components."*

The recently committed Parrillada package violates this everywhere:

- `ParrilladaReviewScreen.tsx`: `"Main sequence"`, `"Zone status"`, `"Warnings"`, `"Back"`.
- `ParrilladaSetupScreen.tsx`: `"Back"`, `liteMinItems–liteMaxItems items` rendered with literal "items".
- `ParrilladaHeroCard.tsx`: `"Parrillada Plan"`, `"Pro"`, `"Lite"`, `"Items"`, `"Serve"`, `"Complexity"`, `"Warnings"`, `"zones"`, `"holds"`.
- `ParrilladaTimelineFinal.tsx`: `"Timeline"`, `"Actions"`, `"All phases"`, `"parallel"`, `"Prep"`, `"Preheat"`, `"Cook"`, `"Sear"`, `"Flip"`, `"Rest"`, …
- `ServeStrategyCard.tsx`: `"Serve time"`, `"Serve ASAP"`, `"Serve at time"`, …
- `ParrilladaMenuBuilderCard.tsx`: `"Choose cuts"`, `"Beef"`, `"Pork"`, `"Chicken"`, `"Fish"`, `"Add cuts (min 2)"`, `"Done"`, `"Search cut"`, `"Selected"`, `"Add"`.

The es/fi audiences see English in the most premium flow in the product. This is a launch blocker for non-EN users.

**Fix:** route all of the above through `lib/i18n/texts.ts` + `surfaceFallbacks.ts`. Add a CI rule that fails on string literals inside Parrillada JSX.

---

## 2. Significant issues (should fix this cycle)

### 2.1 ScreenHeader was extracted but never adopted

- `components/ui/ScreenHeader.tsx` is implemented, exported, documented in the spec (§6), and tested in `index.ts`. Grep for actual usage in any screen turns up **zero hits**.
- Meanwhile, `ParrilladaEntryScreen`, `ParrilladaSetupScreen`, `ParrilladaReviewScreen`, `LiveHeader`, `AppHeader`, `OnboardingSlides`, and the wizard each roll their own `<header>` markup. They look related but not identical: padding differs, eyebrow color drifts between `text-orange-200/70`, `text-orange-300/85`, `text-white/45`, and `text-white/55`.
- Same story for `MetricTile` (used in `ResultHero` only — Parrillada and Live re-roll). Same story for `CompactDisclosure` (Parrillada uses raw `<details>` instead, see `ParrilladaReviewScreen.tsx:66`/`81` and `ParrilladaTimelineFinal.tsx:118`/`149`).

**Fix:** treat shipped UI primitives as load-bearing. Migrate the existing header/disclosure/metric markup over. Until that happens, the "shared component" file is fiction.

### 2.2 Bottom nav drops labels (mobile)

`components/navigation/AppHeader.tsx:236-249`:

- The mobile `Tab` renders an icon and an `sr-only` label. Visually, the user sees five orange-or-gray icons with no text.
- The spec §6 ("BottomNav") explicitly says: *"5 icons + labels (Home / Cuts / Cook / Plans / Settings)"*. The desktop tabs follow the spec; the mobile nav does not.
- New users on a dark icon-only nav have to guess what each tab does. The icons are custom illustrations, not OS-standard glyphs.

**Fix:** show 10–11px labels under the icon. The minimum tap target is already 54 px; adding a label costs nothing.

### 2.3 Two competing "saved cooks" experiences

`GuardadosModeScreen.tsx` ships a manual tab toggle (`"📋 Planes"` / `"🔥 Cocciones"`) with emoji in the button label and arbitrary `text-[12px] font-black`. The rest of the app does not use emoji-in-label as a navigation pattern. It looks like a temporary internal-tools widget shipped to production.

**Fix:** replace with a `ds.button.tabActive` / `tabIdle` pair, or a `Segmented` UI primitive — and drop the emoji from the labels, or treat them as `IconBadge`s consistent with the rest of the design.

### 2.4 Inline `<details>` everywhere defeats the disclosure pattern

`CompactDisclosure` exists (`components/ui/CompactDisclosure.tsx`, spec §6) and is used by `ResultHero`. Everyone else uses raw `<details>` + emoji chevrons (`›` rotated 90deg). Examples:

- `ParrilladaReviewScreen.tsx:66`/`81` — Zone status / Warnings
- `ParrilladaTimelineFinal.tsx:118`/`149` — Actions / All phases
- `ResultCard.tsx`'s `SetupVisualToggle` is its own custom button + grid-rows animation

Each one looks slightly different: different chevron color, different hover, different summary padding.

**Fix:** wrap every `<details>` site through `CompactDisclosure`. Choose one chevron treatment.

### 2.5 Heavy decorative imagery in Cut Selection

The wizard's `CutCard` and the featured cut card render a full-bleed cooked-food photo with a triple gradient mask. The hybrid-premium spec §7 (Cut Selection) is unambiguous: *"icons and tags by default; thumbnails only for featured, premium, unfamiliar, or visually confusing cuts… avoid heavy image grids unless explicitly needed"*. The current behavior is the opposite: every cut gets a hero photograph.

The dedicated icon-led `components/cuts/CutCard.tsx` is the correct direction; the wizard's competing implementation has not been retired.

**Fix:** delete the wizard's private `CutCard`. Use `components/cuts/CutSelectionScreen.tsx` as the single source. Reserve full-bleed photos for a "featured" tier (≤ 3 cuts max).

### 2.6 Animations and shadows multiplied

`shadow-[...]` appears **88 times across 32 files** with bespoke values: `0_22px_64px_rgba(255,106,0,0.30)`, `0_14px_42px_rgba(0,0,0,0.35)`, `0_2px_12px_rgba(249,115,22,0.35)`, `0_20px_70px_rgba(249,115,22,0.25)`, `0_18px_45px_rgba(249,115,22,0.16)`, etc. Same intent ("warm glow under primary action"), no shared definition.

`globals.css` defines `animate-fire-breathe`, `animate-fire-drift`, `animate-shimmer`, `animate-msg-in`, `animate-live-enter`, `animate-ignition-spark`, `animate-ignition-bloom`. Most usages are good; the ignition transition on Home is a particularly nice touch. But there is no documented motion language — durations (180/280/360/500/700ms) and easings vary by component.

**Fix:** define `ds.shadow.glowOrange{Sm,Md,Lg}`, `ds.shadow.cardBase`, `ds.shadow.cardLifted`. Define `ds.motion.{enter,emphasis,pulse}` with 2–3 durations max. Treat raw `shadow-[...]` and `duration-[Nms]` as drift.

### 2.7 Parrillada cards re-implement chips/badges from scratch

`ParrilladaHeroCard.tsx`'s local `Chip` (lines 74–87) and `Metric` (58–72) duplicate `Badge` (`components/ui/Badge.tsx`) and `MetricTile`. Same for `ParrilladaMenuBuilderCard`'s pill chips (lines 90–96, 161–168) — they look like `ds.badge.*` but they are not.

**Fix:** delete the local Chip/Metric/Pill implementations; use `Badge`, `MetricTile`, and a soon-to-extract `ListRow`.

### 2.8 Hero metric tile overloaded with the CTA

`ResultHero.tsx:219-255` puts a fully-fledged "Start Live Cooking" CTA inside the metric grid (col-span-2 / xl col-span-1 / row-span-2). Visually, it competes with the time/temp metric tiles next to it, and the metric grid is no longer a "scan-then-act" surface — it's "scan-mix-act". The spec is clear that the CTA is "the one dominant action on a screen". Burying it inside the metric row weakens both halves: metrics no longer feel calm, and the CTA no longer feels singular.

**Fix:** separate concerns: metrics row stays compact and informational; one dedicated sticky CTA bar at the bottom of the screen (matching the Live and Parrillada Setup patterns). The current configuration breaks the "summary-first review, action below" hierarchy.

### 2.9 i18n exists but Onboarding ships hardcoded English

`OnboardingSlides.tsx:18-34` hardcodes "Cook like a pro", "Never miss timing", "Feel in control", etc. There is no Lang prop, no `texts.onboarding*` plumbed in. First-run users in es/fi see English first — bad first impression.

**Fix:** lift onboarding copy into `lib/i18n/texts.ts`. Add Lang prop. (Same pattern as the Home language strip already enforced.)

### 2.10 Saved cooks (`SavedCooksScreen.tsx`) bypasses i18n entirely

Lines 47-55 hardcode `"es-ES"` locale and Spanish month abbreviation. The screen-level copy mixes Spanish in code (`a.includes("ternera")`, `"a.includes("ibérico")`, fallback strings) and is not parameterized by lang.

**Fix:** parameterize everything by `Lang`. Use `Intl.DateTimeFormat(lang, …)` instead of hardcoding `es-ES`.

---

## 3. Smaller hygiene wins

- `app/globals.css:8-11` keeps `overflow-x-hidden` on `html` AND `body` AND `body > *`. This is a workaround for some layout escaping that should be fixed at the source — masking it globally hides real bugs (e.g. a section that grows past 100vw goes unnoticed).
- `app/layout.tsx` still loads both `Geist` and `Geist_Mono`. Mono is barely visible in the product (a `tabular-nums` here and there). Either commit to mono for metric numbers or drop it to save the font load.
- `app/dev/cuts/page.tsx` and `app/admin/qa/page.tsx` are still routable in production builds — confirm these are gated behind an env flag or robots-noindexed; if they ship, they're inconsistent with the premium tone.
- `app/v3/` and `app/v4/` exist — dead experiments? If not maintained, delete; if maintained, document.
- `components/ResultTimeline.tsx` and `components/live/Timeline.tsx` and `components/live/LiveTimeline.tsx` all exist. From file names alone the relationship is unclear. Fold or rename.
- The legacy "FoodCard.tsx" still ships gradient bottom bars (`from-orange-300 via-#FF6A00 to-amber-300`) duplicated in the wizard CutCard. Two implementations of one motif.
- `ParrilladaHeroCard.tsx:23` hardcodes "Pro"/"Lite" badge text. Both deserve a `Badge tone="accent"` and i18n.
- `ResultCard.tsx:28-33` inlines a 1.7 KB SVG-data-URI fallback. Move to `public/visuals/` and reference by URL.
- The hex literal `#FF6A00` appears in cooking + food cards — it shadows `bg-orange-500` (`#f97316`) and there is no token for it. Decide on one ember color.
- `getCloseLabel` is inlined in `ResultCard.tsx:223`, duplicating what `lib/i18n/texts.ts` provides. The "translate inline" anti-pattern recurs across the codebase.

---

## 4. What's working well (do not touch)

- **`lib/design-system.ts` is well-structured.** The taxonomy (`panel`, `text`, `button`, `media`, `badge`, `notice`, `nav`, `liveBg`) is the right shape. The problem is adoption, not the file itself.
- **Live phase tints** centralized in `ds.liveBg.*` are exactly the kind of consolidation the rest of the codebase needs. Treat this as the template.
- **`ResultHero` Why-this-plan disclosure** is a good UX choice: short headline, opt-in detail, no shouting. Keep.
- **`MetricTile` + `CompactDisclosure` + `Panel`** are good primitives. They just need to be used.
- **Ignition transition** on Home tap → cooking is a high-quality detail. Premium animation done well, with `prefers-reduced-motion` honored.
- **Bottom-sheet pattern** in `ParrilladaMenuBuilderCard` (escape key, body-overflow lock, focus trap implied) is decent; only the visual treatment drifts.
- **Phase tints + urgency-tinted CTA** in `LiveCookingScreen` are correct execution-first UX.
- **Hybrid-premium spec itself** is unusually clear and well-written. The audit's recommendations below largely come from holding the code to the spec.

---

## 5. Recommended plan (concrete, prioritized)

### Slice A — Token discipline (1–2 days)

Goal: make `ds.*` the only way to express a card / button / chip / metric / radius.

1. **Extend the token file:**
   - `ds.text.body12`, `ds.text.body11`, `ds.text.helper`, `ds.text.eyebrowSmall`.
   - `ds.color.muted.{strong,base,helper,faint}` (3 opacities — cap the proliferation).
   - `ds.radius.pill`, `ds.radius.chip`, `ds.radius.row`, `ds.radius.card`, `ds.radius.hero` mapped to fixed values.
   - `ds.shadow.{cardBase,cardLifted,emberGlowSm,emberGlowMd}`.
   - `ds.motion.{enter,emphasis}`.
2. **Lint rule:** add a regex check (eslint custom rule or CI grep) that fails on raw `text-[Npx]`, `rounded-[Nrem]`, `shadow-[...]`, `bg-white/[0.0Nx]` in `components/**/*.tsx`. Exceptions explicitly opt-in via a comment.
3. **Adoption sprint:** mass-replace existing literals across the codebase. Mechanical change; no visual diff expected when done right.

### Slice B — Parrillada cleanup (3–5 days)

Goal: bring the Parrillada package onto `ds.*` + reusable primitives.

1. Replace inline `rounded-3xl border-white/10 bg-white/[0.04] p-4` with `<Panel tone="card">`.
2. Replace local `Chip` / `Metric` / `Pill` with `Badge` + `MetricTile`.
3. Replace raw `<details>` with `CompactDisclosure`.
4. Replace inline gradient CTA with `<Button variant="primary">` (or the `PrimaryCTA` extraction below).
5. **i18n pass:** route every string in `ParrilladaReviewScreen`, `ParrilladaSetupScreen`, `ParrilladaEntryScreen`, `ParrilladaHeroCard`, `ParrilladaMenuBuilderCard`, `ParrilladaTimelineFinal`, `ServeStrategyCard` through `texts[lang]`.
6. Adopt `ScreenHeader` in the three Parrillada screens.

### Slice C — Cooking wizard extraction (5–8 days, planned slice)

Goal: split `CookingWizard.tsx` into `CookAnimalStep`, `CookCutStep`, `CookDetailsStep`, `CookResultStep`, each ≤ 250 lines, plus a thin wizard controller. Delete the wizard's private `CutCard` and use the shared `components/cuts/CutSelectionScreen.tsx` directly. Migrate Cook Setup to the four-section pattern (Strategy / Doneness / Conditions / Fuel) per spec §7.

**Risk:** this is the "Phase B" the spec warns against bundling with visual work. Slice C should be its own PR, planned and reviewed independently of Slice B.

### Slice D — Component primitives backfill (2–3 days)

Goal: extract or finish the primitives the spec already names and the screens already need.

1. `ListRow` (workhorse selectable row) — spec §6.
2. `SetupOptionCard` — spec §6.
3. `TimelineRow` — spec §6 (used in `ParrilladaTimelineFinal` and `ResultGrid`).
4. `WarningRow` — spec §6.
5. `PrimaryCTA` / `SecondaryCTA` thin wrappers on `Button` so calling code is `<PrimaryCTA>Start Live Cooking</PrimaryCTA>` instead of 6 lines of Tailwind.

### Slice E — Onboarding + Saved screens i18n + tone (1–2 days)

- Lift Onboarding copy into `texts.ts` and add Lang prop.
- Replace emoji-in-label patterns in `GuardadosModeScreen` tabs.
- Parameterize `SavedCooksScreen` by `Lang`; replace hardcoded `es-ES` formatting.

### Slice F — Audit-driven removals (0.5 day)

- Delete the legacy `FoodCard.tsx` bottom-bar duplicate.
- Decide on `app/v3` / `app/v4` (keep + document, or delete).
- Drop `Geist_Mono` if not used in real surfaces (or commit to it for `tabular-nums` metric values and standardize).
- Move the inline data-URI fallback in `ResultCard.tsx` to `public/visuals/`.

---

## 6. Definition-of-done for the next visual pass

Borrowed and tightened from spec §14:

- ✅ **No raw arbitrary Tailwind values** for radius, shadow, or text size in `components/**/*.tsx` (CI-enforced).
- ✅ **No hardcoded user-facing strings** in `components/parrillada/**` and `components/onboarding/**` (regex grep CI rule).
- ✅ **Single ember CTA per screen.** Verified at 375 px by manual screenshot review on Home, Cut Selection, Cook Setup, Result, Live, Parrillada Review.
- ✅ **`ScreenHeader`, `CompactDisclosure`, `MetricTile`, `Panel`, `Button` used everywhere** they apply. Grep for raw `<header>`, raw `<details>`, hand-rolled metric tiles fails CI.
- ✅ **Muted-text palette ≤ 3 opacities** in product code. Verified by automated grep over `text-white/<n>` and `text-slate-<n>` usage.
- ✅ **Wizard ≤ 250 LOC per file.** Or, if the extraction is deferred, document the deferral and gate any new visual work in the wizard on a feature flag.
- ✅ **Validation:** `npm run lint`, `npx tsc --noEmit`, `npm run smoke`, `npm run qa:cooking`, `npm run qa:flow`, `npm run build` clean.

---

## 7. Next steps (this week)

1. **Confirm direction.** Walk through Sections 1.1 → 1.7 with the product owner and decide which fixes are this-cycle vs. next-cycle. Slices A, B, and E are low-risk and can run in parallel.
2. **Start Slice A.** Token extensions + lint rule. This is the leverage point — every subsequent slice gets faster once the rule is in place.
3. **Plan Slice C in its own document.** Cooking wizard extraction has been deferred for months. It is the single largest visual debt in the product and needs a real plan, not another phase deferral.
4. **Defer Slice F until A/B land** — small cleanups belong after the structural work, not before.

---

## 8. Follow-ups

### Planner surface fallbacks need i18n

During Slice B, the seven in-scope Parrillada UI files were i18n'd, but several user-visible strings still flow through planner data unchanged:

- `executionZoneLabel()` / `executionHeatLabel()` / `compactExecutionInstruction()` in `components/parrillada/ParrilladaTimelineFinal.tsx` emit data-derived English ("high heat", "mixed zones", "holding").
- `lib/i18n/surfaceFallbacks.ts` is the natural home for proper i18n of these enum values (it already houses `getEquipmentSurfaceLabel`, `localizeResultSurfaceCopy`, etc.).
- Some props passed into the seven Parrillada files (e.g. `parrilladaPlanCopy.entry.quickTitle`, ctaLabel, criticalStep fields) are caller-supplied English. Caller chain: `parrilladaPlanCopy` → SchedulerScreen → the seven files.

Out of scope for Slice B (which limited itself to seven UI files). Consider a dedicated planner-surface i18n slice when broader i18n coverage matters.

### Copy tone alignment with canvas

Slice B refined the verbose source copy for Parrillada Entry, Review, and Hero headers to match the canvas voice (short declarative title + optional one-sentence support). Remaining surfaces (Onboarding, Saved, CookingWizard, Result) have not yet been audited against the canvas for tone. A dedicated pass over `lib/i18n/texts.ts` (now es/en only after the Finnish locale removal) will close the gap consistently across the app.

---

## 9. Density audit — 2026-05-15

Parrillada screens audited at 375 × 667 px (iPhone SE viewport) against the one-viewport rule from `memory/slice-b-followup-information-density.md`. Heights below are **static-JSX estimates** based on padding/leading/content tallies — runtime variations (recent-plan count, item count, conditional warnings) are noted per screen.

Reference usable height: ~570 px after Safari iOS chrome (status bar + URL bar + tab bar). Anything past that requires scroll.

Canvas mockups are the ground truth where shipped diverges:
- `06-parrillada-entry.png`
- `07-parrillada-review.png`
- `08-parrillada-live.png`
- `10-parrillada-setup.png`

### Findings

| Screen | Tag | Estimated height | Notes |
|---|---|---|---|
| `ParrilladaEntryScreen` | ✅ | ~382–554 px depending on recent-plan count | Comfortable in all observed states. Mode cards are appropriately sized; recent-plans panel is bounded. |
| `ParrilladaSetupScreen` | ⚠ / ❌ | ~528 px empty/asap, ~764 px with 3 items + time, ~956 px with 5 items + past warning | Heavy contributors: ServeStrategyCard balloons to ~254 px when `startsInPast` warning is shown. MenuBuilderCard grows linearly with selected-item count. |
| `ParrilladaReviewScreen` | ❌ | ~820 px after slice-B-fu-ia/1 (was ~1052 px before) | Compacting the inner execution-group disclosures removed ~232 px. Remaining over-budget contributors are the Hero card (~156 px), the outer "All phases" CompactDisclosure (~80 px collapsed), and the two zone/warnings disclosures (~80 px each). |
| `ParrilladaLiveScreen` | ❌ | ~862 px with 2 active items | Currently outside Slice B-FU-IA's compaction scope but flagged for the dedicated Live slice. Header, LiveCommandCard, Up-Next, GrillZones, ActiveItems list, and Adjust-Plan footer all stack vertically with no compaction. |

### Compaction targets (proposed, awaiting direction)

For ⚠ / ❌ screens, the heaviest contributors and proposed strategies:

**Review** (highest priority — `slice-B-fu-ia/1` already addressed timeline rows):
- *Hero card* (~156 px) — the metric tile row could be reduced from 4-column to a 2-row 2x2 grid only on very narrow viewports; or the optional `zones`/`holds` badges row collapsed when both are absent. ~12–20 px savings possible.
- *"All phases" outer disclosure* (~80 px collapsed) — could be removed entirely if the inner execution-group rows make it redundant. The data overlaps. Removing saves ~80 px + ~12 px gap.
- *Zone status + Warnings disclosures* (~80 px × 2 = 160 px) — could be combined into a single "Plan checks" disclosure with two sub-sections, or rendered as two compact rows side-by-side. ~80 px savings.
- *space-y-3 → space-y-2* between top-level sections — uniform tightening. Saves 5 × 4 = 20 px.

Conservative estimate after these: ~620 px. Still ~50 px over but visibly close.

**Setup**:
- *ServeStrategyCard* (~110–254 px) — the `startsInPast` amber card is the largest variable contributor. It could be a single-line warning row with an inline CTA chip instead of a full card. ~60–80 px savings when shown.
- *GrillSetupCard* (~112 px) — currently a 3-zone grid below the strategy. Canvas mockup 10 shows this as a tighter horizontal strip. ~30 px savings possible.
- *MenuBuilderCard item rows* (~52 px each) — already reasonably tight. Could trim `py-2.5` → `py-2` if needed. ~10 px savings.

Setup also has unique runtime variability (item count); a viewport-fit guarantee for arbitrary item counts is unrealistic. Goal should be: empty/2-item state fits one viewport; longer states scroll gracefully.

**Live**: out of scope for this slice. Defer to a future Live-specific density slice.

### Out of scope for this audit

- Cut Selection (catalog is inherently scrollable; exempt per principle).
- Onboarding, Saved, CookingWizard (their respective consolidation slices).
- Token-scale extensions, MetricTile/Badge variants (Slice D).
- Any color or styling changes — this audit is layout and density only.

### Status after Slice B-FU-IA (2026-05-15)

Compactions landed in this branch (`slice-B-fu-ia-density`):

- **Entry** — ✅ no changes needed; was already fitting.
- **Review** — ✅ ~1052 → ~648 px. Deleted the "All phases" disclosure (substantive — removed the phases-by-time detail view; execution-group rows are the primary display). Combined zone status + warnings into "Plan checks" disclosure with subsection eyebrows.
- **Setup** — ⚠ ~528–956 → ~490–800 px. ServeStrategy past-warning is now an inline row, GrillSetupCard restructured to canvas mockup 10's single-row collapsible pattern, ParrilladaItemRow padding trimmed. Empty/2-item state fits; edge state with 5 items + all warnings still slightly over.

**Deferred** (explicit, documented in `memory/slice-b-followup-information-density.md`):

1. **Live screen density** — ~862 px. Needs a dedicated slice with its own canvas reference (`08-parrillada-live.png`).
2. **Setup-with-warning edge case** — acceptable scroll for a rare state. Next compaction target if needed: `ParrilladaMenuBuilderCard` "Add cuts" button becomes a row inside the menu card.

**Not pursued** (per user direction during /3 review): Hero metric tile padding trim, `space-y-3 → space-y-2`. Rhythm consistency over marginal recovery.

The one-viewport rule is now an established app-wide principle. Cut Selection is the documented exception.

---

*This document is a static analysis. Visual verification on real devices (iPhone SE, Pixel 5, iPhone 14 Pro) is required before treating any "looks fine" claim as fact. The next audit (UI-UX-audit02.md) should be done on-device with screenshots attached.*
