MODEL RECOMMENDED: GPT-5.5 Thinking for first integration pass. Use a cheaper/faster model only for follow-up import fixes or formatting.

MODE: EXPERIMENTAL BIG BRANCH IMPLEMENTATION

PROJECT: Parrillero Pro

GOAL:
Integrate the Final Multi-Cut Parrillada Scheduler foundation into a new experimental branch.

BRANCH:
Create/use:
feature/final-parrillada-scheduler

CONTEXT:
A package has been copied into the repo containing:
- lib/planning/*
- components/parrillada/*
- scripts/demo-final-scheduler.ts
- docs/*

The goal is to make Parrillada mode show a working scheduler UI:
- select multiple cuts/items
- choose serve time
- choose strategy
- show timeline
- show warnings

IMPORTANT PRODUCT PRINCIPLE:
This is a scheduler/orchestration engine, not a recipe content feature.
Do not hardcode special behavior in the algorithm by cutId. Use profiles and adapters.

TASKS:
1. Inspect the existing repo structure.
2. Fix import paths if needed, preferring existing repo aliases when available.
3. Ensure lib/planning compiles cleanly.
4. Ensure components/parrillada compiles cleanly.
5. Wire ParrilladaSchedulerScreen only behind existing `mode === 'parrillada'` or equivalent Parrillada route/state.
6. Keep existing Home, Cooking single-cut, Result, Live, Saved, Supabase, and navigation behavior unchanged unless minimal import/render wiring is required.
7. Run validation commands.
8. Return changed files, validation output, and any risks.

COMMAND SAFETY / ALLOWLIST:
Allowed without asking:
- npm run lint
- npm run build
- npm run qa:cooking
- npm run check
- npx tsc --noEmit
- npx tsx scripts/demo-final-scheduler.ts
- git status
- git status --short --untracked-files=all
- git diff --stat
- git diff --name-only
- git log --oneline -5
- git branch --show-current
- git status --short --untracked-files=all; git diff --stat

Ask before:
- git add/commit/push
- branch changes if not already on requested branch
- installs/dependency updates
- Supabase/database changes
- deploys/Vercel
- destructive commands
- history-changing git commands

CONSTRAINTS:
- Keep final diff focused.
- Do not rewrite app/page.tsx broadly.
- Do not redesign Home.
- Do not touch Result or Live internals.
- Do not connect to real thermometer/probe yet.
- Do not add external dependencies unless absolutely necessary.
- Do not import PNGs directly.
- Do not create new AI/API calls.

VALIDATION:
Run:
- npm run lint
- npm run build
- npm run qa:cooking

If available, run:
- npm run check
- npx tsx scripts/demo-final-scheduler.ts

SUCCESS CRITERIA:
- Build passes.
- Existing cooking QA passes.
- Parrillada mode renders the scheduler.
- Timeline updates from selected items, serve time, and strategy.
- Warnings render.
- No single-cut Result/Live regression.

OUTPUT FORMAT:
1. Branch used
2. Files changed
3. What was integrated
4. Validation results
5. Known risks
6. Suggested next PR scope
