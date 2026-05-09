# Deprecated Routes

This file tracks routes that exist in the codebase but are not part of the active Parrillero Pro product flow. They are kept for reference (early design experiments, prototypes) and should not be linked from production UI.

## Currently deprecated

### `/v3` — `app/v3/page.tsx`

- **Status:** Deprecated. Early design experiment.
- **Layout:** `app/v3/layout.tsx` sets `robots: { index: false, follow: false }`. Should not appear in search results.
- **Public link?** No internal references in the codebase (verified via grep at quarantine time).
- **Why kept:** Useful as a visual snapshot of an earlier cut-card layout. Not currently part of the active product flow.
- **When can it be deleted:** Safe to remove together with `/v4` once the `app/page.tsx` shell extraction (Phase B) lands and the team confirms there is no remaining design reference value.

### `/v4` — `app/v4/page.tsx`

- **Status:** Deprecated. Early design experiment, evolution of `/v3`.
- **Layout:** `app/v4/layout.tsx` sets `robots: { index: false, follow: false }`.
- **Public link?** No internal references in the codebase.
- **Why kept:** Iteration on `/v3` with a slightly different cut-card model. Same kept-for-reference rationale.
- **When can it be deleted:** Same as `/v3`.

## Deletion checklist (when the time comes)

Before removing either route:

1. Run `Grep` for `/v3` and `/v4` across the codebase. If anything outside `app/v3/` or `app/v4/` still references these paths, resolve those first.
2. Confirm no published links exist (search engine results should be empty thanks to `noindex`, but check Vercel deployment URLs and any docs/READMEs).
3. Delete the directory in a single commit.
4. Run `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run smoke` to confirm no regressions.

## Operational rules

- Do **not** add new features to `/v3` or `/v4`.
- Do **not** link to these routes from production UI, marketing pages, or shared content.
- If you find yourself referencing these routes for design ideas, copy the relevant pattern into the active component tree under `components/` and delete the local copy.
