# Technical Debt Register

Date: 2026-05-04  
Scope: Tracking debt that affects product trust, cooking safety, development speed, or future scalability.

## Purpose

Technical debt should be visible, prioritized, and tied to product risk. This register is not a wishlist. Add items only when they block safe development, increase regression risk, slow delivery, or weaken the premium cooking experience.

## Priority Definitions

- P0: Blocks release, breaks core cooking flow, risks unsafe guidance, or causes severe production instability.
- P1: High regression risk, repeated defects, navigation/data inconsistency, or major UX trust issue.
- P2: Slows development or QA, creates moderate maintainability risk, or limits near-term roadmap work.
- P3: Cleanup or improvement that is useful but not urgent.

## Debt Categories

- Engine safety.
- Data scalability.
- Navigation state.
- i18n.
- UX consistency.
- Live Cooking execution.
- Setup visuals.
- Multi-cut planning readiness.
- Tooling and QA.
- Infrastructure.

## Register Template

| ID | Priority | Category | Title | Impact | Proposed Fix | Owner | Status | Target |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEBT-000 | P2 | Example | Short title | Why it matters | Smallest safe fix | Agent/person | Open | Milestone/PR |

Status values:

- Open
- In progress
- Blocked
- Fixed
- Accepted

## Example Entries

| ID | Priority | Category | Title | Impact | Proposed Fix | Owner | Status | Target |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEBT-001 | P1 | Data scalability | Missing complete planning profiles for future multi-cut support | Multi-cut planning could require hardcoded exceptions if profiles are incomplete | Define required planning fields and add validation before building scheduler behavior | ENGINE_AGENT / DATA_AGENT | Open | Multi-cut foundation |
| DEBT-002 | P1 | Navigation state | Direct URL recovery needs consistent QA coverage | Shared links and browser back can regress silently | Add navigation smoke checklist to every navigation PR and automate later | NAVIGATION_AGENT | Open | Navigation hardening |
| DEBT-003 | P1 | i18n | User-facing copy can drift across English, Spanish, and Finnish | Mixed-language UI weakens premium trust | Enforce translation checklist and add missing-key validation when scripts are approved | UI_AGENT / DATA_AGENT | Open | i18n hardening |
| DEBT-004 | P2 | UX consistency | Result, Home, and Live shell patterns may diverge as features expand | Product can feel like separate screens instead of one premium assistant | Document shared shell/card rules and reuse design tokens/components | UI_AGENT | Open | Visual system |
| DEBT-005 | P2 | Setup visuals | Some cuts may rely on generic setup visual fallbacks | Result confidence is weaker for unfamiliar cuts | Track setup visual coverage and require fallback keys for all cuts | IMAGE_AGENT / DATA_AGENT | Open | Setup visual coverage |
| DEBT-006 | P2 | Tooling and QA | Data validation scripts are not yet formalized in package scripts | Missing fields may be caught late by manual QA | Add validation scripts after the data contract stabilizes | ENGINE_AGENT / DATA_AGENT | Open | Data QA |
| DEBT-007 | P3 | Documentation | Older QA reports may not reference the new operating procedures | Future agents may miss newer contracts | Link high-value QA docs to process docs during normal maintenance | Documentation agent | Open | Maintenance |

## Adding New Debt

When adding debt:

- Use the next numeric ID.
- Pick the lowest accurate priority.
- Describe impact in product terms.
- Propose the smallest safe fix.
- Avoid creating debt entries for vague cleanup.
- Link to a PR, QA report, or defect when available.

## Closing Debt

Debt can be closed when:

- The fix has shipped or the team intentionally accepts the risk.
- Validation evidence exists.
- Follow-up debt is created if only part of the risk was addressed.

Close with:

```md
Closed by:
Validation:
Residual risk:
```
