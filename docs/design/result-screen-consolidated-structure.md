# Result Screen Consolidated Structure

## Goal

Design a consolidated Result screen that builds confidence after plan generation and gives the user a clear path into Live Cooking.

The screen should answer, in seconds:

- What am I cooking?
- What result am I aiming for?
- How long will it take?
- What temperature matters?
- How should the grill or equipment be set up?
- What is the one mistake I must avoid?
- What do I do next?

The ideal Result screen is premium, practical, and compact. It should feel like a decisive cooking brief, not a recipe article or a dashboard of every possible detail.

## Non-goals

- Do not turn the Result screen into the full Live Cooking experience.
- Do not show every intermediate calculation behind the cooking engine.
- Do not add decorative visuals that do not clarify setup, heat, doneness, timing, or execution.
- Do not duplicate the same time, temperature, rest, or setup guidance across multiple cards.
- Do not make shopping, sharing, timeline, or grill manager modules compete with the primary cooking decision.
- Do not introduce cut-specific screen layouts. The structure should work through data-driven content and reusable card variants.
- Do not require the user to scroll through secondary modules before they can start Live Cooking.

## Mobile hierarchy

Mobile should prioritize fast scanning and thumb-friendly progression. The user should understand the plan before the first major scroll and be able to start Live Cooking without searching.

1. **Hero summary**
  - Short confidence headline.
  - Cut, method, doneness, and estimated total time.
  - One-line execution promise or plan summary.
2. **Main cooking decision facts**
  - Compact fact grid or stacked fact rows.
  - Required facts: cut, doneness, time, target temperature, rest, equipment/setup.
  - Keep this above any large visual.
3. **Setup visual anchor**
  - One setup image, diagram, or zone visual when it clarifies execution.
  - Show grill zone, direct/indirect heat, pan placement, lid state, or thermometer placement.
  - If no useful visual exists, use a compact setup card instead of placeholder imagery.
4. **Critical mistake / avoid mistake**
  - One prominent warning card.
  - Focus on the highest-risk mistake for the plan.
  - Must include what to check or do instead.
5. **Execution steps preview**
  - Short numbered steps.
  - Should prepare the user for Live Cooking without replacing it.
  - Include only major actions: preheat, season/setup, sear/cook, flip/check, rest, slice/serve.
6. **Start Live Cooking CTA**
  - Primary CTA.
  - Sticky bottom CTA is preferred once the user scrolls past the hero.
  - Inline CTA should appear after the steps preview.
7. **Optional secondary modules**
  - Shopping.
  - Timeline.
  - Grill manager.
  - Share/save.
  - These appear below the primary CTA and should be collapsible, compact, or lower-emphasis.

## Desktop hierarchy

Desktop can use a two-column layout while preserving the same decision order. The left column should carry the cooking brief and execution flow. The right column should support confidence without becoming a competing dashboard.

1. **Top full-width hero**
  - Hero summary spans the content width.
  - Include headline, plan summary, and primary facts in a clean premium header area.
2. **Left column: primary execution path**
  - Main cooking decision facts.
  - Critical mistake / avoid mistake.
  - Execution steps.
  - Start Live Cooking CTA.
3. **Right column: setup and support**
  - Setup visual anchor at the top.
  - Equipment/setup details beneath the visual if not fully covered in the fact grid.
  - Optional modules in priority order: timeline, grill manager, shopping, share/save.
4. **CTA behavior**
  - Primary CTA should remain visible either in the hero area, the left column after steps, or as a sticky side/bottom action depending on available layout.
  - Desktop should not require scrolling to discover the Live Cooking action.

## Card-by-card structure

### 1. Hero summary

Purpose: give the user immediate confidence that the generated plan is specific and usable.

Content:

- Result headline, for example: "Medium-rare ribeye, ready in about 18 minutes."
- Subheadline with method and confidence cue, for example: "High-heat sear, short rest, finish by temperature."
- Compact metadata: difficulty, heat style, estimated active time.

Rules:

- Keep the headline concrete, not motivational.
- Do not include long explanations.
- Do not show decorative food photography above the summary.
- Avoid repeating facts that will appear directly below unless they are essential to the headline.

### 2. Main cooking decision facts

Purpose: consolidate the facts the user needs before committing to the cook.

Required facts:

- **Cut:** exact selected cut name.
- **Doneness:** target doneness label.
- **Time:** total estimated time, with active time if available.
- **Target temperature:** final target temperature and whether it is pull temperature or serving temperature.
- **Rest:** rest duration and whether temperature carryover is expected.
- **Equipment/setup:** grill, pan, oven, fuel, zone setup, lid state, or thermometer requirement.

Recommended layout:

- Mobile: 2-column fact grid for short facts, then a full-width setup row if needed.
- Desktop: 3-column or 6-item grid inside the hero or immediately below it.

Rules:

- Use one source of truth for each fact.
- Prefer labels that can be scanned: "Target", "Rest", "Setup".
- If a value is uncertain, explain the dependency briefly instead of hiding it.
- Do not split temperature across several cards unless food safety requires escalation.

### 3. Setup visual anchor

Purpose: help the user understand physical execution before cooking starts.

Valid visual types:

- Grill zone diagram.
- Pan or plancha setup diagram.
- Heat intensity strip.
- Thermometer placement illustration.
- One premium setup photo only if it clarifies the actual method.

Rules:

- One strong visual maximum.
- The visual must teach setup, not decorate.
- It should sit after the main summary facts on mobile.
- It should sit in the right column on desktop.
- It must include a short caption explaining the action, for example: "Sear over direct heat, then move to indirect heat to finish."
- If the visual cannot be specific to the plan, use a simpler setup card.

### 4. Critical mistake / avoid mistake

Purpose: prevent the most likely failure before the user starts.

Content:

- One concise mistake statement.
- One corrective action.
- Optional severity label if food safety or overcooking risk is high.

Example structure:

- Title: "Avoid pulling by time alone"
- Body: "Use the thermometer near the thickest part and pull at the target temperature. Time is only a guide."

Rules:

- Show one primary warning, not a list of generic tips.
- Make the warning actionable.
- Use a consistent warning visual treatment.
- Do not bury safety-critical guidance in optional modules.

### 5. Execution steps

Purpose: preview the cook in a simple sequence and prepare the user to start Live Cooking.

Recommended structure:

1. Preheat and prepare equipment.
2. Season or prepare the cut.
3. Start cooking on the correct heat zone.
4. Flip, move, baste, or adjust as required.
5. Check target temperature.
6. Rest and serve.

Rules:

- Keep steps short.
- Use 4 to 6 steps for most plans.
- Each step should have one primary action.
- Do not include live timer controls here.
- Do not show dense educational explanations in the main step list.

### 6. Start Live Cooking CTA

Purpose: move the user from planning to execution.

Primary CTA:

- Label: "Start Live Cooking"
- Secondary line if needed: "Timers, checks, and next actions"

Rules:

- Primary CTA should be visually dominant.
- It should appear once after the main confidence-building content.
- On mobile, use a sticky CTA after the user scrolls past the hero or facts.
- Do not place optional modules above the first clear start action.

## CTA strategy

The Result screen should have one primary action: start the guided cook.

Recommended CTA priority:

1. **Primary:** Start Live Cooking.
2. **Secondary:** Save plan.
3. **Tertiary:** Share, adjust plan, shopping, or timeline actions.

CTA placement:

- Mobile: one inline CTA after execution steps, plus a sticky bottom CTA once the primary action is not visible.
- Desktop: persistent CTA in the top or left primary column, with a repeated CTA after steps if the page is long.

Rules:

- Avoid multiple competing primary buttons.
- Do not make "Save" visually stronger than "Start Live Cooking".
- If the plan has a critical unresolved issue, replace the start CTA with a blocking critical state and tell the user what to fix.
- If the plan is valid but has a warning, allow start while keeping the warning visible.

## Visual rules

- Use dark premium surfaces with controlled contrast.
- Keep one dominant visual moment: the setup visual anchor.
- Use icons only when they improve scan speed.
- Use compact badges for method, heat, difficulty, and doneness.
- Use spacing to create hierarchy instead of adding more cards.
- Keep card count low above the CTA.
- Avoid image-heavy layouts on mobile.
- Avoid repeating decorative gradients or ornamental separators.
- Use warning color only for warnings and critical states.
- Use success styling sparingly, mainly after a plan is saved or a step is completed.

Visual density by section:

- Hero: low density, high hierarchy.
- Facts: medium density, highly scannable.
- Setup visual: one focused visual, short caption.
- Warning: high contrast, low text.
- Steps: medium density, action-first.
- Optional modules: compact and lower emphasis.

## Copy rules

- Be specific and practical.
- Prefer action verbs: "Sear", "Move", "Pull", "Rest", "Check".
- Prefer concrete values over vague guidance.
- Keep labels short and consistent.
- Explain uncertainty plainly, for example: "Time varies with thickness; temperature decides doneness."
- Do not use lifestyle or food-blog language.
- Do not overpromise perfection.
- Avoid generic encouragement such as "You've got this" unless paired with useful guidance.
- Use one idea per sentence in warnings and steps.
- For temperatures, clearly distinguish target, pull, and serving temperature when relevant.

Recommended copy pattern:

- Headline: outcome + time.
- Facts: label + value.
- Warning: mistake + corrective action.
- Steps: verb + object + condition.
- CTA: action + benefit.

## Optional modules

Optional modules should support the cooking decision without slowing the user down.

### Shopping

Use when the plan can generate useful prep or ingredient information.

Show:

- Cut quantity.
- Salt/seasoning basics.
- Fuel or equipment needs.
- Optional add-ons if already available from the plan.

Do not show:

- Long grocery lists.
- Recipe-style ingredient blocks that distract from cooking execution.

### Timeline

Use when timing confidence matters.

Show:

- Prep.
- Preheat.
- Cook.
- Rest.
- Serve.

Do not show:

- Fine-grained live timer states that belong in Live Cooking.

### Grill manager

Use when multi-zone heat, fuel, or equipment setup changes the outcome.

Show:

- Direct/indirect zones.
- Heat intensity.
- Lid position.
- Move/finish guidance.

Do not show:

- Complex grill controls before the user starts Live Cooking.
- Multi-cut orchestration unless the plan explicitly supports it.

### Share/save

Use as a lower-priority utility module.

Show:

- Save plan.
- Share plan.
- Reuse setup.

Do not show:

- Social prompts that compete with starting the cook.

## Risks

- **Overloaded first screen:** Too many cards before the CTA can make the result feel uncertain instead of premium.
- **Duplicated facts:** Repeating time, target temperature, or setup in several cards weakens trust.
- **Decorative visual drift:** Food imagery can make the screen feel richer but less useful if it does not clarify execution.
- **CTA competition:** Save, share, shopping, and timeline actions can dilute the main transition into Live Cooking.
- **Warning fatigue:** Multiple warning cards reduce attention to the one mistake that matters most.
- **Desktop dashboard creep:** Desktop space can tempt the design into showing too many modules at once.
- **Engine/UI coupling:** The screen should render structured plan data without embedding cooking rules in UI components.

## Implementation phases

### Phase 1: Consolidate the core result

- Build the final order: hero, facts, setup visual, mistake warning, steps, start CTA.
- Remove duplicated summary cards.
- Keep optional modules below the primary CTA.
- Use existing structured plan values where possible.

### Phase 2: Strengthen setup confidence

- Add or refine the setup visual anchor.
- Prefer method-specific diagrams over decorative food images.
- Add captions that explain the setup in one sentence.

### Phase 3: Normalize warnings and copy

- Standardize the avoid-mistake card.
- Ensure each plan surfaces one primary mistake.
- Clarify target, pull, and rest language.

### Phase 4: Add secondary modules carefully

- Reintroduce shopping, timeline, grill manager, and share/save as compact optional modules.
- Keep them below the first Live Cooking CTA on mobile.
- On desktop, place them in the support column without competing with the primary execution path.

### Phase 5: Validate density and flow

- Test the screen on mobile first.
- Confirm the user can identify cut, doneness, time, target temperature, rest, setup, mistake, and start action within a few seconds.
- Confirm desktop does not become a dashboard.
- Confirm visuals improve decision or execution confidence.