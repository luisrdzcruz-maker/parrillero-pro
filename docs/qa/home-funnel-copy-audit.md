# Home Funnel Copy Audit

Date: 2026-05-01  
Branch: `feature/home-conversion-and-funnel`  
Agent: HOME_FUNNEL_COPY_AUDIT_AGENT  
Scope: Home hero, CTA hierarchy, popular cuts, and Home -> CutSelection -> Details -> Result -> Live funnel copy.

## Verdict

The Home screen is directionally strong for conversion. It communicates confidence, speed, guided timing, heat control, and no-guesswork value within a few seconds. It does not read like a generic recipe app.

The largest friction appears immediately after the primary CTA: the dedicated cut-selection flow shifts tone from polished consumer copy into internal/product copy, mixes languages, and asks users to understand filters before they have confirmed their cooking goal. That is the highest-priority copy issue because it happens directly after "Start cooking."

No build was run. This was a read-only product copy audit plus documentation output.

## Strengths

- Home hero value proposition is clear in 3 seconds: confidence, speed, a concrete cooking plan, doneness, heat, and timing.
- The hero avoids generic recipe-app framing. It focuses on grill-specific decisions: what is on the grill, heat, timing, doneness, and no guesswork.
- Primary CTA hierarchy is visually and semantically clear. "Start cooking" is the main path, with "Plan BBQ" and "I don't know what to cook" as secondary routes.
- Supporting chips reinforce the product promise without adding cognitive load: clear doneness, guided timing, no guesswork.
- Popular cuts are useful shortcuts because they bypass category browsing and send users into a configured cooking-details path.
- Result copy is strong: "Result ready" plus time, temperature, rest, and main risk makes the output feel actionable instead of content-heavy.
- Result-to-Live copy has a good hierarchy. "Next action" and "Open the live guide with this plan" make the live assistant value concrete.
- Live mode copy becomes action-oriented at the right moment: start, mark step done, flip now, cooking complete.

## Confusing Copy

- CutSelection headline and support text are more functional than persuasive. They explain filtering by intent, category, and zone, but they do not clearly restate the user outcome: choose a cut and get a guided cook.
- CutSelection mixes English labels with localized copy. Terms like "Cut selection", "Quick picks", "Start cooking", "Value", and "Argentinian" appear alongside localized Spanish UI in the default flow. This makes the experience feel less premium and can reduce trust.
- Some CutSelection labels feel internal or tool-like. "Filter", "Category", "View mode", "Quick picks", and count badges are useful, but they compete with the core cooking decision.
- The "I don't know what to cook" CTA currently routes to the planning flow, where the next page is framed around organizing a BBQ. That can feel mismatched for a solo undecided cook who expects help choosing a cut or meal.
- "Plan BBQ" and "I don't know what to cook" both land in the same planning mode. The routes may be acceptable, but the receiving copy should acknowledge the user's distinct intent.
- Popular cut labels are understandable, but they lack tiny outcome cues. For example, a novice can recognize "Ribeye" or "Salmon", but not know why each shortcut is useful.
- Details step copy is mostly clear, but "Adjust details" is generic. The page could reassure users that defaults are already chosen and only need changing if they know their preferences.
- Advanced thickness copy is helpful for experienced users, but it can feel like precision work too early. It should remain secondary, as it currently is.
- Result secondary actions are compact and clear, but the hierarchy should keep Live Cooking as the unmistakable next step. Current ResultHero does this well.
- Saved-cook actions such as "Review cook" and "Go live now" are functional, but "Go live now" may sound like streaming instead of live guided cooking.

## Recommended Copy Changes

### Home Hero

Keep the current strategic direction. Only consider a small subtitle refinement if the team wants stronger live-assistant positioning:

- Current intent: choose what is on the grill and get a clear plan for doneness, heat, and timing.
- Recommended direction: choose your cut and get step-by-step guidance for heat, timing, doneness, and when to act.

This keeps the "not a recipe app" positioning and makes the live assistant promise more explicit.

### CTA Hierarchy

- Keep primary CTA as "Start cooking".
- Keep secondary CTA as "Plan BBQ" if the planning flow remains event/group oriented.
- Change the unknown-intent route or receiving copy so "I don't know what to cook" feels like guided choice, not BBQ planning setup.
- If the route remains planning, add receiving-page copy that acknowledges discovery: "Tell us what you have or who you are cooking for. We will suggest a simple BBQ plan."

### Popular Cuts

The labels are understandable and useful. Add short cue text only if the UI can support it without clutter:

- Ribeye: premium steak, fast plan.
- Picanha: crowd-pleaser, direct plus indirect.
- Chicken breast: lean, needs precision.
- Salmon: fast, delicate heat.
- Asparagus: quick vegetable side.

If adding cue text is too much, keep labels as-is. The shortcuts are already useful because they reduce setup steps.

### CutSelection

Highest-impact copy changes should happen here:

- Replace internal header wording with a user outcome: "Pick your cut. We will handle heat and timing."
- Replace filter-oriented support copy with decision-oriented copy: "Choose a cut or use quick picks. Each option opens a guided cook with defaults already set."
- Localize all labels consistently for the active language.
- Rename "Quick picks" to "Best starting points" or "Recommended cuts" for a more premium, lower-friction feel.
- Rename broad intent filters to user goals. For example: "Fast", "Premium", "Easy", "Slow cook", "Best value", "Grill classics".
- Change bottom-sheet CTA from "Start cooking" to "Use this cut" or "Set up this cook" if the next screen is Details rather than Live.

### Details

- Replace "Adjust details" with a more reassuring line: "Confirm your cook setup."
- Add or keep subtle copy that defaults are enough: "Defaults are tuned for this cut. Change only what matters."
- Keep exact thickness as an advanced secondary option.
- Keep size and weight labels simple; the current simplified labels are good for speed.

### Result

Keep the current Result copy hierarchy. It is one of the strongest funnel moments because it turns generated output into a cooking decision surface.

Optional improvement:

- If "Start Live Cooking" is used, consider "Start guided cook" or "Start live guide" to reduce ambiguity and make the assistant value clearer.

### Live

Live copy is strong once the user arrives. It is action-based, concise, and appropriate for cooking under time pressure.

Optional improvement:

- Replace any saved-cook "Go live now" wording with "Start live guide" to avoid livestream ambiguity.

## Priority Fixes

1. Fix CutSelection language consistency. Mixed-language UI after the Home CTA is the most visible trust issue.
2. Reframe CutSelection from filters to outcome. Users need confidence that selecting a cut leads to guided cooking, not a catalog task.
3. Align "I don't know what to cook" with the next page. Either route it to a discovery-oriented flow or change the PlanHub receiving copy to match undecided users.
4. Clarify the CutSelection bottom-sheet CTA if it opens Details, not Live. "Start cooking" can overpromise when the next step is setup.
5. Add optional short outcome hints to popular cuts only if the UI remains clean.

## What Not To Change

- Do not dilute the Home promise into generic recipe language.
- Do not remove "Start cooking" as the primary Home CTA.
- Do not make Home explain every feature. The current short hero is a strength.
- Do not over-explain Popular Cuts. They work because they are fast.
- Do not bury Live Cooking behind save/share/copy actions on Result. Live should remain the next obvious action.
- Do not make exact thickness prominent for all users. It should stay advanced and optional.
- Do not change the deterministic cooking-plan framing. The product should continue to feel like a guided assistant, not a chatbot recipe generator.

## Validation

- Reviewed Home copy in `components/home/HomeScreen.tsx` and text definitions in `lib/i18n/texts.ts`.
- Reviewed funnel copy in `components/cuts/*`, `components/cooking/CookingWizard.tsx`, `components/ResultHero.tsx`, `components/ResultActions.tsx`, `components/live/LiveCookingScreen.tsx`, and `components/planning/PlanHub.tsx`.
- No app code was modified.
- No build was required because only this audit document was created.
