import type {
  GrillZoneType,
  ParrilladaItem,
  ParrilladaMode,
  ParrilladaPlan,
  ParrilladaTimelineStep,
  ParrilladaWarning,
  PlannerCutInput,
  PlannerPhase,
  PlannerResult,
} from '@/lib/planning';
import { getParrilladaItemPresentation } from '@/lib/planning';

// Canonical Parrillada runtime adapter:
// PlannerResult + executionTimelineGroups -> Review/Live UI projections.

type ReviewZoneStatus = {
  zone: GrillZoneType;
  label: GrillZoneType;
  activeCount: number;
};

const REVIEW_ZONES: GrillZoneType[] = ['direct', 'indirect', 'resting'];

function formatClock(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function mapPlannerZone(zone: PlannerPhase['zone']): GrillZoneType {
  if (zone === 'resting' || zone === 'holding') return 'resting';
  if (zone === 'direct_high' || zone === 'direct_medium') return 'direct';
  return 'indirect';
}

export function plannerCutInputToParrilladaItem(item: PlannerCutInput): ParrilladaItem {
  const presentation = getParrilladaItemPresentation(item);
  return {
    id: item.id,
    cutId: item.cutId,
    displayName: item.displayName,
    category: presentation.categoryLabel,
    role:
      presentation.role === 'fastFinish'
        ? 'finish_last'
        : presentation.role === 'starter'
          ? 'secondary'
          : presentation.role === 'side'
            ? 'side'
            : presentation.role === 'longCook'
              ? 'hold_warm'
              : 'main',
    estimatedMinutes: item.planningMetadata?.activeCookMinutes ?? 20,
    canHoldWarm: item.planningMetadata?.canHoldWarm,
    maxHoldMinutes: item.planningMetadata?.maxHoldMinutes,
    timingSensitivity: item.planningMetadata?.timingSensitivity,
    riskFlags: item.planningMetadata?.riskTags,
  };
}

function executionGroupsToTimeline(result: PlannerResult): ParrilladaTimelineStep[] {
  return result.executionTimelineGroups.map((group) => {
    const groupZone: GrillZoneType =
      group.zone === 'mixed'
        ? 'indirect'
        : group.zone === 'resting' || group.zone === 'holding'
          ? 'resting'
          : group.zone === 'direct_high' || group.zone === 'direct_medium'
            ? 'direct'
            : 'indirect';
    return {
      id: group.id,
      timeLabel: formatClock(group.startIso),
      itemId: group.items[0]?.itemId,
      title: group.title,
      subtitle: group.instruction,
      zone: groupZone,
      durationMinutes: Math.max(1, group.endMinute - group.startMinute),
      isServeTarget: group.groupType === 'serve',
    };
  });
}

function phasesToTimeline(result: PlannerResult): ParrilladaTimelineStep[] {
  return result.phases.map((phase) => ({
    id: phase.id,
    timeLabel: formatClock(phase.startIso),
    itemId: phase.itemId !== 'global' ? phase.itemId : undefined,
    title: `${phase.displayName} - ${phase.type}`,
    subtitle: phase.notes?.[0],
    zone: mapPlannerZone(phase.zone),
    durationMinutes: Math.max(1, phase.endMinute - phase.startMinute),
    isServeTarget: phase.type === 'serve',
  }));
}

export function plannerResultToReviewTimeline(result: PlannerResult): ParrilladaTimelineStep[] {
  return result.executionTimelineGroups.length > 0 ? executionGroupsToTimeline(result) : phasesToTimeline(result);
}

export function plannerResultToReviewWarnings(result: PlannerResult): ParrilladaWarning[] {
  return result.warnings.map((warning) => ({
    id: warning.id,
    severity: warning.severity,
    title: warning.title,
    description: warning.message,
  }));
}

export function plannerResultToParrilladaPlanCompatibility(result: PlannerResult, mode: ParrilladaMode): ParrilladaPlan {
  return {
    id: `planner-${result.request.serveAtIso}`,
    mode,
    title: mode === 'pro' ? 'Parrillada Pro' : 'Parrillada Lite',
    items: result.request.items.map(plannerCutInputToParrilladaItem),
    serveTargetLabel: formatClock(result.request.serveAtIso),
    complexity: result.summary.confidence === 'low' ? 'high' : result.summary.confidence === 'medium' ? 'medium' : 'low',
    warnings: plannerResultToReviewWarnings(result),
    timeline: plannerResultToReviewTimeline(result),
  };
}

export function plannerResultToReviewZoneStatus(result: PlannerResult): ReviewZoneStatus[] {
  const timeline = plannerResultToReviewTimeline(result);
  return REVIEW_ZONES.map((zone) => ({
    zone,
    label: zone,
    activeCount: timeline.filter((step) => step.zone === zone).length,
  }));
}

export function plannerResultToCriticalStep(result: PlannerResult): ParrilladaTimelineStep | undefined {
  const timeline = plannerResultToReviewTimeline(result);
  return timeline.find((step) => !step.isServeTarget && Boolean(step.itemId));
}

export function plannerResultToLiveActionIds(result: PlannerResult): string[] {
  if (result.executionTimelineGroups.length > 0) return result.executionTimelineGroups.map((group) => group.id);
  return result.phases.map((phase) => phase.id);
}
