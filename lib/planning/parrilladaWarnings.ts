import type { ParrilladaPlan, ParrilladaWarning } from './types';

// Legacy compatibility helpers for ParrilladaPlan warnings.
// Canonical runtime warning contract is PlannerResult.warnings.

const severityRank: Record<ParrilladaWarning['severity'], number> = {
  critical: 4,
  warning: 3,
  watch: 2,
  info: 1,
};

export function getParrilladaWarnings(plan: ParrilladaPlan): ParrilladaWarning[] {
  return [...plan.warnings].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}

/** @deprecated Use PlannerResult warning summaries instead. */
export function getParrilladaWarningsCountBySeverity(plan: ParrilladaPlan) {
  return plan.warnings.reduce<Record<ParrilladaWarning['severity'], number>>(
    (acc, warning) => {
      acc[warning.severity] += 1;
      return acc;
    },
    { info: 0, watch: 0, warning: 0, critical: 0 },
  );
}
