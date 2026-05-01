

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.



# Parrillero Pro — Agent Operating System

This project uses AI agents to assist development.

This is NOT a generic recipe app.  
It is a real-time cooking assistant and decision engine for premium grilling.

The product goal is to help users make better cooking decisions quickly, execute with confidence, and get consistent results.

---

## Product identity

Parrillero Pro is:

- a cooking decision engine
- a real-time grilling assistant
- a premium mobile-first experience
- a practical execution tool, not a content-heavy recipe feed

Parrillero Pro is NOT:

- a generic recipe app
- a decorative food blog
- a dense educational encyclopedia
- a UI playground for unnecessary visuals

---

## Core principles

- mobile-first
- premium UX
- fast cooking decisions
- deterministic engine first
- AI as enhancement, not core
- local rules before AI fallback
- clarity before decoration
- execution before entertainment
- modular architecture before one-off screens

---

## Approved visual direction — Hybrid Premium

The approved design direction is **Hybrid Premium**.

Base concept:

- **Concept D — Hybrid Premium Winner**

Supporting influences:

- **Concept A:** cleanliness, minimal density, premium clarity
- **Concept B:** educational modules only when they improve user confidence
- **Concept C:** Cut Map as optional discovery and learning mode, never mandatory

Implementation rule:

- Build the design as a modular visual system, not as hardcoded screen mockups.
- Use design tokens, reusable components, controlled variants, and screen-specific image rules.
- Separate layout, visual components, product logic, and cooking-engine logic.
- Do not add visual elements only because they look good.

Main visual rule:

> Every visual must help the user decide, understand, or execute. If it only decorates, remove it.

---

## Visual density rules by screen

### Home

Purpose: conversion and orientation.

Rules:

- no large hero photo at the top
- keep the first screen clean, scannable, and action-focused
- use icons, short labels, and one strong CTA
- avoid dense explanations before the user starts

Preferred visual reinforcement:

- compact protein icons
- clean CTA card
- optional small secondary visual lower on the page only if it improves conversion

Avoid:

- decorative food photography above the primary CTA
- large banners that push the main action down
- repeated brand/header blocks

---

### Cut Selection

Purpose: fast selection with confidence.

Rules:

- icons and tags by default
- thumbnails only for featured, premium, unfamiliar, or visually confusing cuts
- keep list/card scanning fast
- avoid heavy image grids unless explicitly needed

Preferred visual reinforcement:

- cut icons
- difficulty tags
- cooking-method tags
- small thumbnails for selected high-value cards

Avoid:

- making every cut card image-heavy
- adding long educational text inside the selection list
- mixing inconsistent card styles

---

### Cut Map

Purpose: optional education and discovery.

Rules:

- Cut Map is optional, not required for the main cooking flow
- use vector/zone-based anatomical maps
- use tap/hover states, zone labels, and short educational blurbs
- keep it useful for discovery without slowing down users who already know their cut

Preferred visual reinforcement:

- animal silhouette
- highlighted anatomical zones
- zone chips
- short “best cuts in this area” modules

Avoid:

- making the map the only way to choose a cut
- photo backgrounds behind anatomical maps
- overly complex taxonomy in the first version

---

### Result Screen

Purpose: confidence before cooking.

Rules:

- this is the best place for one strong setup visual or food image
- the premium summary must remain the main scan surface
- place the setup visual after the main summary and before execution details when useful
- show time, temperature, rest, doneness, setup, and critical warnings clearly

Preferred visual reinforcement:

- one strong setup visual
- one premium food/setup image if it improves confidence
- clear icons for temperature, time, rest, grill zone, and difficulty
- compact “avoid this mistake” card with warning icon

Avoid:

- multiple competing images
- duplicated time/temperature cards
- decorative sections that delay the user from starting

---

### Live Cooking

Purpose: real-time execution.

Rules:

- functional icons only
- compact, high-contrast guidance
- no decorative imagery
- prioritize current action, timer, temperature, grill zone, next step, and safety warnings
- all controls must be thumb-friendly on mobile

Preferred visual reinforcement:

- timer icon
- thermometer icon
- grill-zone strip
- heat intensity indicator
- step progress indicators
- warning/success/info micro-icons

Avoid:

- large food images during active cooking
- dense educational cards
- decorative animation that distracts from the current action

---

### Errors, warnings, and safety guidance

Purpose: prevent bad results and unsafe cooking.

Rules:

- use clear micro-icons with high contrast
- distinguish severity levels clearly
- warnings must be actionable
- do not bury critical safety information in decorative cards

Suggested severity system:

- Critical: stops the action
- Warning: check before continuing
- Info: helpful context
- Success: action completed

---

## App modes

Current modes:

- inicio
- coccion
- menu
- parrillada
- cocina
- guardados

Mode intent:

- `inicio`: conversion-focused entry point
- `coccion`: single-cut planning flow
- `menu`: menu or saved meal planning context
- `parrillada`: multi-item event planning
- `cocina`: live cooking execution
- `guardados`: saved plans, menus, and reusable cooking setups

---

## Architecture rules

- never break existing flows
- do not refactor everything at once
- always propose before big changes
- prefer small incremental improvements
- keep cooking logic separate from UI components
- prefer deterministic data and rules over hardcoded heuristics
- use data-driven profiles for scalable cut behavior
- avoid adding cut-specific logic directly in components
- avoid duplicating calculations across UI cards
- prefer shared helpers, typed contracts, and reusable components

When changing UI:

- preserve existing engine behavior unless the task explicitly touches engine logic
- keep layout changes separate from engine/data changes when possible
- prefer component extraction over giant page-level additions
- use controlled variants instead of copy-pasted components
- check mobile first, then desktop

---

## Visual system implementation rules

Prefer this structure:

```txt
Design tokens
↓
Reusable UI primitives
↓
Reusable product components
↓
Screen layouts
↓
Feature-specific variants
```

Use shared tokens for:

- color
- spacing
- radius
- typography
- shadows
- borders
- motion
- density

Use reusable components for:

- cards
- buttons
- badges
- section headers
- stat rows
- warning cards
- result summary modules
- setup visual modules
- cut cards
- cut map modules
- live cooking status panels

Do not create one-off visual styles unless there is a strong product reason.

---

## Recommended current roadmap alignment

The Hybrid Premium direction should be attached to the current work in this order:

1. ResultHero / ResultCards refinement
2. Home conversion improvement
3. Live Cooking individual flow
4. Cut Selection visual simplification
5. Setup Visual placement and asset rules
6. Optional Cut Map foundation
7. Guided educational modules only after the core flow is stable
8. Multi-cut planning foundation later, after the single-cut flow is stable

Do not over-invest in Cut Map or dense visual education before Result, Home, and Live Cooking are strong.

---

## Agent workflow

1. Analyze
2. Propose
3. Implement
4. Verify

Before implementation, agents should identify:

- files likely affected
- whether the change touches UI, engine, data, or navigation
- risks to current flows
- how to verify the change

After implementation, agents should run the relevant checks when available:

- lint
- build
- cooking engine QA
- snapshots if engine output changed

---

## Agent roles

### UI / Product Agent

Use for:

- visual system
- Home
- Cut Selection
- Result cards
- Live Cooking UI
- component extraction
- responsive layout

Must follow:

- Hybrid Premium direction
- visual density rules
- reusable component strategy

Must not:

- change cooking calculations without explicit instruction
- add decorative visuals without product purpose

---

### Engine Agent

Use for:

- cooking rules
- planning logic
- cut profiles
- timing logic
- doneness rules
- QA scripts
- snapshots

Must follow:

- deterministic engine first
- data-driven profiles
- no UI coupling
- no hardcoded per-cut hacks inside UI

---

### Asset / Image Agent

Use for:

- setup visuals
- cut thumbnails
- icon prompts
- asset pipeline
- image processing
- generated asset maps

Must follow:

- images are selective
- Result gets the strongest setup visual
- Cut Selection thumbnails are limited
- Live Cooking uses functional icons only
- no humans, no text inside generated food/setup images unless explicitly requested

---

### Navigation / State Agent

Use for:

- URL-backed state
- browser back behavior
- wizard step navigation
- mode transitions
- shareable state

Must follow:

- never break existing flows
- preserve canonical app modes
- avoid direct setState navigation when URL sync is required

---

## Safety

- never delete files without permission
- never touch `.env`
- never expose API keys or secrets
- never push to `main`
- always work in branches
- never overwrite user work without checking diff
- do not remove existing features unless the task explicitly asks for it

---

## Final quality bar

A change is good only if it improves at least one of these:

- faster decision-making
- clearer cooking execution
- stronger premium perception
- better mobile usability
- more scalable architecture
- safer cooking guidance
- lower future maintenance cost

A change is not good if it only adds visual noise.