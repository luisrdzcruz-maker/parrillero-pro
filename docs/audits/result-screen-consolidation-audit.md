# Result Screen Consolidation Audit

## Verdict

NEEDS FIXES FIRST

Current Result output is functional and stable, but it still has hierarchy overlap and visual duplication that weaken confidence-first execution. The biggest issue is repeated setup presentation (hero context + setup visual anchor + setup setup-card + setup visual toggle), plus secondary modules appearing with similar visual weight to primary execution content.

## Current structure

Current rendering path:

1. `ResultCards` in `components/cooking/CookingWizard.tsx`
2. `ResultHero`
3. save/share status message (if present)
4. `ResultGrid`
  - `SetupVisualAnchor` (if `SETUP` exists)
  - ordered cards from `getOrderedResultItems`:
    - setup card (`variant: "setup"`) when `SETUP`
    - critical error card (`variant: "tip"`) when `ERROR`
    - steps card (`variant: "primary"`) when `PASOS` / `STEPS`
    - then remaining blocks in key order (`TIMELINE`, `GRILL_MANAGER`, `SHOPPING`/`COMPRA`, other keys)

Observed order with normalized cooking blocks (`SETUP`, `TIEMPOS`, `TEMPERATURA`, `PASOS`, `ERROR`):

- Hero (contains time/temp/rest summary and primary CTA)
- Setup visual anchor (large full-width image)
- Setup card
- Error card
- Steps card
- Optional extras (timeline, grill manager, shopping, other cards)

## Duplications found

1. **Setup is overrepresented**
  - Setup appears as: `SetupVisualAnchor` + setup text card + inline setup visual toggle inside `ResultCard` for setup titles.  
  - This creates 2-3 setup visuals depending on content.
2. **Summary overlap between hero and setup card copy**
  - Hero already communicates method/context and core decision metrics.  
  - Setup card repeats method/setup summary in another large block.
3. **Action overlap in some flows**
  - Main Result uses hero primary live CTA.  
  - Saved-menu surfaces also add review/live actions near the same content, reducing one-clear-next-action feeling.
4. **Localization logic repeated across layers**
  - Similar setup/equipment normalization/sanitization logic exists in multiple Result components and `surfaceFallbacks`.

## UX hierarchy issues

1. **Primary path is not strict enough after hero**
  - After the main CTA, setup visuals can consume more attention than “what to do next now”.
2. **Critical mistake is not guaranteed to stay high in scan flow**
  - It is early now, but still competes against oversized setup visuals and decorative gradients.
3. **Execution stack is not compressed**
  - The top of Result should be: summary -> setup anchor -> avoid mistake -> steps -> start live reinforcement.  
  - Current structure injects redundant setup content before execution confidence fully settles.
4. **Optional modules have high visual priority**
  - Timeline and Grill Manager have strong styles and controls, similar to core execution cards.

## Mobile issues

1. Vertical density is high before users reach full step execution.
2. Repeated setup blocks force extra scroll before core action certainty.
3. Timeline card interactions (live/demo controls) are heavy for a planning-first Result phase.
4. Secondary actions (save/copy/share) remain visually close to primary intent in constrained viewport height.

## Desktop issues

1. Two-column grid works, but content priority is still mixed because setup and optional modules are visually strong.
2. Full-width sections (setup anchor, steps, timeline, shopping, grill manager) can create a long “same-weight” stack.
3. Hero + grid split does not fully enforce “decide -> execute -> optional”.

## i18n risks

1. **Hardcoded strings outside `texts` map**
  - Result components include many direct ES/FI/EN inline labels.
2. **Spanish-only copy inside timeline modules**
  - `ResultTimeline` includes Spanish labels/messages in component code.
3. **Normalization/sanitization fallback can produce unnatural copy**
  - Regex-based transformations are useful for safety, but can over-sanitize nuanced output.
4. **Title key assumptions are rigid**
  - Key detection depends on strict uppercase candidates (`SETUP`, `PASOS`, etc.), increasing risk if future block naming drifts.

## Recommended final structure

Target Result order for cooking plans:

1. **ResultHero (confidence summary)**
  - What am I cooking, doneness, time, target temp, rest.
2. **Primary CTA block (Start Live Cooking)**
  - Dominant and immediate.
3. **Setup Visual Card (single source)**
  - One setup visual + compact setup guidance line.
4. **Critical Mistake Card (high prominence)**
  - Actionable “avoid this”.
5. **Steps Card (primary execution card)**
  - Numbered, scannable, ready for live handoff.
6. **Secondary actions row**
  - Save / copy / share (demoted).
7. **Optional modules (collapsed or demoted by default)**
  - Timeline, shopping, grill manager, extra blocks.

Priority rule:

- Any block that does not improve decision, understanding, or execution should be demoted below core execution content.

## Components to keep

- `ResultHero` (keep, simplify role clarity)
- `ResultGrid` (keep as orchestrator)
- `ResultCard` (keep as base card primitive)
- `ResultActions` (keep, secondary utility role)
- `ResultTimeline` (keep as optional/advanced planning module)
- shopping and grill manager cards (keep as optional execution support)

## Components to consolidate

1. **Setup presentation stack**
  - Consolidate `SetupVisualAnchor` + setup card content + `SetupVisualToggle` behavior into one setup module.
  - Keep one visual entry point and one concise setup text.
2. **Result ordering logic**
  - Centralize explicit priority tiers in `ResultGrid` ordering helper.
  - Tier 1: hero-adjacent core cards.
  - Tier 2: execution support.
  - Tier 3: optional/advanced.
3. **Localization handling**
  - Reduce inline per-component string branching.
  - Move Result-specific copy tokens into shared i18n keys.

## Components to remove or demote

- **Demote:** inline setup visual toggle inside setup `ResultCard` (after consolidation, this should not coexist with anchor visual).
- **Demote:** timeline/grill manager default prominence (move below core execution stack, optionally collapsed).
- **Demote:** any decorative-only labels/chips that do not improve decision or execution.
- **Remove (behavioral role, not feature):** repeated setup surfaces that communicate the same content.

## Implementation plan

Phase 0 (safety baseline)

1. Capture current Result snapshots for ES/EN/FI and 3 representative cuts (fast, reverse-sear, vegetable).
2. Define acceptance metrics: first-scroll confidence, CTA visibility, card count before steps.

Phase 1 (ordering and hierarchy only)

1. Introduce explicit result priority ordering in `ResultGrid` orchestration.
2. Keep existing cards, but enforce final order: setup visual -> critical mistake -> steps -> optional.
3. Ensure Start Live CTA remains visually dominant and above optional modules.

Phase 2 (setup consolidation)

1. Replace multi-surface setup rendering with one setup module.
2. Remove duplicate setup visual toggle path from setup card flow.
3. Keep setup summary text compact and non-redundant with hero.

Phase 3 (optional module demotion)

1. Demote timeline, grill manager, shopping to secondary section.
2. Add collapsed-by-default behavior where appropriate (especially mobile).
3. Preserve access but reduce pre-execution noise.

Phase 4 (i18n hardening)

1. Move hardcoded labels in Result components into i18n source keys.
2. Audit ES/EN/FI parity for hero labels, CTA microcopy, timeline labels, and warnings.
3. Keep surface fallback sanitization, but reduce duplicate localization branches.

Phase 5 (regression and rollout)

1. Verify no change to engine outputs, live payload generation, or navigation contracts.
2. Validate saved-menu Result rendering parity.
3. Roll out behind focused PR(s): hierarchy/order -> setup consolidation -> i18n cleanup.

## QA checklist

- Hero answers: what cut, total time, target temp, rest at first glance.
- Start Live Cooking CTA is visible without scroll on common mobile viewport.
- Setup visual appears exactly once.
- Critical mistake card appears before steps and is visually prominent.
- Steps card remains scannable and fully actionable.
- Timeline/grill/shopping are available but demoted below core execution stack.
- No duplicated time/temp/rest/doneness summaries across hero and top cards.
- ES/EN/FI copy parity verified for all Result priority sections.
- Saved plan detail uses same consolidated hierarchy rules.
- Live start behavior and payload signature logic unchanged.
- Engine deterministic outputs unchanged.
- Mobile and desktop layouts preserve premium dark hierarchy without decorative clutter.

## Status update

Result Phase 1 removed duplicated setup rendering and established the current order:

ResultHero → SetupVisualAnchor → Critical mistake → Steps → optional modules.

Result Phase 2 refines the ResultHero premium scan surface.

Remaining follow-ups:

- Metric extraction polish.
- i18n hardening.
- Optional module demotion/collapse.
- Live Cooking hardening.

