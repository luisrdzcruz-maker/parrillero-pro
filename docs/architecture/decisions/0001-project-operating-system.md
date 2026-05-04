# ADR 0001: Project Operating System

Date: 2026-05-04  
Status: Accepted  
Scope: Parrillero Pro / AI Grill Master Pro development procedures, agent workflows, QA contracts, and architecture boundaries.

## Context

Parrillero Pro is becoming a premium cooking decision platform, not a generic recipe app. The product already includes a Next.js app, local cooking engine, Result UI, Live Cooking, setup visuals, i18n, URL-backed navigation state, saved menus, and foundations for future multi-cut planning and Smart Probe Live integration.

As the product expands, unstructured development creates risk:

- UI changes can accidentally affect cooking trust.
- Engine changes can be hidden inside components.
- Data gaps can turn into hardcoded per-cut exceptions.
- Navigation changes can break direct URLs or browser back behavior.
- i18n can drift into mixed-language UI or localized internal IDs.
- Parallel Cursor agents can collide without clear ownership.
- QA can become inconsistent across screens and PR types.

The project needs a practical operating system: lightweight documents that define done criteria, PR types, agent contracts, navigation rules, i18n rules, UX regression checks, data contracts, release procedure, and debt tracking.

## Decision

Adopt a project operating system made of versioned documentation under `docs`.

Initial documents:

- `docs/process/definition-of-done.md`
- `docs/process/pr-types.md`
- `docs/agents/agent-contract.md`
- `docs/navigation/navigation-contract.md`
- `docs/i18n/i18n-contract.md`
- `docs/qa/ux-regression-checklist.md`
- `docs/data/data-contract.md`
- `docs/process/release-procedure.md`
- `docs/process/technical-debt-register.md`
- `docs/architecture/decisions/0001-project-operating-system.md`

Core rules:

- Keep PRs typed and narrow.
- Keep agent blast radius small.
- Separate UI, engine, data, navigation, i18n, and infrastructure work.
- Preserve deterministic cooking logic.
- Use canonical English internal IDs.
- Put user-facing strings through i18n.
- Keep URLs shareable and recoverable.
- Validate mobile-first premium UX before merge.
- Track debt that creates product, safety, or scalability risk.

## Alternatives Considered

### No formal process

Rejected. The project is already complex enough that informal memory is likely to cause regressions, especially with parallel agent work and future multi-cut planning.

### One large contributor guide

Rejected for the first version. A single guide would be harder to paste into agent prompts and harder to apply by PR type. Smaller contracts are more practical for Cursor workflows.

### Automate all checks first

Rejected for now. Automation is desirable, but the contracts need to exist before scripts can enforce them. Manual procedures can guide the next phase of validation tooling.

### Freeze feature work until architecture is complete

Rejected. The operating system should support incremental development, not block product progress.

## Consequences

Positive:

- Future agents receive clearer scope and validation rules.
- Parallel work can proceed with fewer file and layer conflicts.
- QA becomes more consistent across UI, engine, data, navigation, i18n, and infra changes.
- Multi-cut planning and Smart Probe Live have safer foundation contracts.
- Technical debt becomes visible and prioritized.

Tradeoffs:

- PR authors must classify work and document validation.
- Some fast changes may need small process updates.
- The docs must be maintained as architecture and tooling evolve.

Follow-up:

- Add validation scripts after data and navigation contracts stabilize.
- Link future QA reports and PR templates back to these docs.
- Convert repeated manual checks into scripts or CI jobs when the patterns are stable.
