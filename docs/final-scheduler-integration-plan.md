# Integration Plan — Experimental Branch

## Recommended branch

```bash
git checkout -b feature/final-parrillada-scheduler
```

## Integration order

### Step 1 — Copy files

Copy:

```txt
lib/planning/
components/parrillada/
docs/
scripts/
```

### Step 2 — Validate TypeScript imports

Run:

```bash
npm run lint
npm run build
```

If path aliases are required, update imports to use `@/lib/planning` and `@/components/parrillada`.

### Step 3 — Run demo scheduler

Depending on repo script setup:

```bash
npx tsx scripts/demo-final-scheduler.ts
```

### Step 4 — Connect UI behind existing Parrillada mode

In `app/page.tsx`, render:

```tsx
<ParrilladaSchedulerScreen />
```

only for `mode === 'parrillada'`.

Do not connect Result or Live Cooking yet.

### Step 5 — Replace demo items with real catalog adapter

Use `catalogCutToPlannerInput()` as boundary. Do not import the full cooking catalog inside `scheduler.ts`.

### Step 6 — QA

Run:

```bash
npm run lint
npm run build
npm run qa:cooking
npm run check
```

Manual QA:

- mobile 390x844
- mobile 375x812
- mobile 360x740
- select 2, 4, and 6 items
- change serve time
- change strategy
- inspect warnings
- check no Result/Live regression

## Risk controls

Do not touch:

- existing single-cut engine behavior
- ResultHero/ResultCards
- Live Cooking
- Supabase
- Saved menus
- auth/storage
- deployment config

## Success criteria

The branch is successful if:

- app builds
- existing cooking QA still passes
- Parrillada mode shows the scheduler
- timeline updates when selected items or serve time change
- warnings are visible and understandable
- no existing flow breaks
