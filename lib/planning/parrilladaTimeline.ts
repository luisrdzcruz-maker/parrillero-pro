import type { ParrilladaPlan, ParrilladaTimelineStep } from './types';

// Legacy compatibility helpers for ParrilladaPlan projections.
// Canonical runtime timeline contract is PlannerResult.executionTimelineGroups.

function parseTimelineMinute(value: string): number {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const hoursRaw = Number.parseInt(match[1] ?? '0', 10);
  const minutesRaw = Number.parseInt(match[2] ?? '0', 10);
  const period = match[3];
  const hours24 =
    period === 'pm' && hoursRaw < 12 ? hoursRaw + 12 : period === 'am' && hoursRaw === 12 ? 0 : hoursRaw;

  return hours24 * 60 + minutesRaw;
}

export function buildParrilladaTimeline(plan: ParrilladaPlan): ParrilladaTimelineStep[] {
  return [...plan.timeline].sort((a, b) => parseTimelineMinute(a.timeLabel) - parseTimelineMinute(b.timeLabel));
}

/** @deprecated Use PlannerResult execution timeline adapters instead. */
export function getParrilladaCriticalStep(plan: ParrilladaPlan): ParrilladaTimelineStep | undefined {
  const timeline = buildParrilladaTimeline(plan);
  return timeline.find((step) => !step.isServeTarget && Boolean(step.itemId));
}
