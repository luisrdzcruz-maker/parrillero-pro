# Release Procedure

Date: 2026-05-04  
Scope: Local checks, PR review, Vercel deploy, production smoke test, and rollback notes.

## Purpose

Releases should protect cooking trust, premium UX, and navigation stability. Do not release changes that cannot be explained, tested, or rolled back.

## 1. Pre-Release Scope Check

Before preparing a release:

- Identify the PR type or mixed PR scope.
- Confirm no unrelated changes are included.
- Confirm no secrets or `.env` files were touched.
- Confirm any engine, data, navigation, or i18n contract changes are documented.
- Confirm known risks are written in the PR description.

## 2. Local Checks

Run the strongest relevant local checks available:

```bash
npm run lint
npm run build
```

Additional checks by layer:

- UI: run the UX regression checklist for touched screens.
- Engine: run cooking QA scripts and snapshots when available.
- Data: run data validation scripts when available and smoke changed cuts.
- Navigation: direct URL and browser back smoke test.
- i18n: language switch and missing translation smoke test.

If a check is skipped, document the reason.

## 3. Git Workflow

Use focused branches:

```bash
git checkout -b feature/short-purpose
```

Before opening a PR:

- Review `git status`.
- Review the diff.
- Confirm only intended files are included.
- Keep commits focused.
- Do not push directly to `main`.
- Do not rewrite history unless explicitly approved.

Recommended PR title pattern:

```txt
[PR type] Short outcome-focused title
```

Examples:

- `[UI] Improve result summary hierarchy`
- `[Engine] Add deterministic rest warning model`
- `[Data] Add setup visual keys for core cuts`
- `[Navigation] Preserve language through result flow`

## 4. PR Review

PR description should include:

```md
## Summary
- What changed and why.

## Type
- UI-only / Engine-only / Data-only / Script-only / Navigation-only / Infra-only / Mixed

## Validation
- Commands run.
- Manual QA performed.
- Checks not run and why.

## Screenshots / Evidence
- Before/after screenshots for UI changes.
- URLs tested for navigation changes.
- QA output for engine/data changes.

## Risks
- Known limitations or none.
```

Review focus:

- Does the change match the declared PR type?
- Does it preserve deterministic cooking behavior unless intentionally changed?
- Does it preserve mobile-first premium UX?
- Does it keep internal IDs canonical English?
- Does it avoid broad unrelated refactors?

## 5. Vercel Deploy

For preview deploys:

- Confirm the deploy completed successfully.
- Open the preview URL.
- Run the smoke path for the touched area.
- Check browser console for visible-flow errors.
- Capture screenshots for UI changes.

For production deploys:

- Deploy only after PR review and required checks are complete.
- Confirm the production URL after deployment.
- Run production smoke tests immediately.
- Keep rollback path ready.

## 6. Production Smoke Test

Minimum production smoke:

1. Home loads.
2. Start cooking opens Cut Selection.
3. Select `ribeye`.
4. Details loads with valid inputs.
5. Generate Result.
6. Result shows summary, timing, temperature/rest guidance, and CTA.
7. Start Live opens Live Cooking.
8. Browser back returns safely.
9. Switch language and confirm context preservation if i18n was touched.
10. Open Saved/Menu/Parrillada only if touched by the release.

Pass criteria:

- No blank screens.
- No dead primary CTA.
- No obvious layout overlap.
- No mixed-language visible block.
- No cooking output collapse.
- No broken URL hydration.

## 7. Rollback Notes

Every release should know the rollback path:

- Identify the last known good commit or deployment.
- Note whether rollback requires data, config, or code reversal.
- For engine/data changes, note whether snapshots or persisted saved plans could be affected.
- For navigation changes, note whether shared URLs might behave differently after rollback.
- For infra changes, note whether environment or Vercel settings need manual restoration.

If production smoke fails:

1. Stop further changes.
2. Capture URL, screenshot, and console evidence.
3. Decide whether to rollback or hotfix.
4. Rollback first when the issue blocks core cooking flow or safety guidance.
5. Document the incident in the PR or release notes.
