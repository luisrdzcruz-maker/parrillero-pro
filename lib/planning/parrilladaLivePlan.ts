import type {
  ExecutionTimelineGroup,
  GrillZoneType,
  PlannerPhase,
  PlannerResult,
  ParrilladaLiveAction,
  ParrilladaLivePlan,
  ParrilladaPlan,
  ParrilladaTimelineStep,
} from './types';
import { buildParrilladaTimeline } from './parrilladaTimeline';

const orderedZones: GrillZoneType[] = ['direct', 'indirect', 'resting'];

function buildAction(step: ParrilladaTimelineStep): ParrilladaLiveAction {
  return {
    id: step.id,
    statusLabel: 'Now',
    instruction: step.title,
    zone: step.zone,
    durationLabel: step.durationMinutes ? `${step.durationMinutes} min` : undefined,
    actionType: step.isServeTarget ? 'serve' : step.zone === 'resting' ? 'rest' : 'move',
  };
}

/**
 * @deprecated Compatibility path for legacy ParrilladaPlan consumers.
 * Canonical runtime path is buildParrilladaLivePlanFromResult().
 */
export function buildParrilladaLivePlan(plan: ParrilladaPlan, currentStepId?: string): ParrilladaLivePlan {
  const timeline = buildParrilladaTimeline(plan);
  const currentIndex = Math.max(
    0,
    currentStepId ? timeline.findIndex((step) => step.id === currentStepId) : timeline.findIndex((step) => !step.isServeTarget),
  );
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentStep = timeline[safeCurrentIndex] ?? timeline[0];
  const nextStep = timeline[safeCurrentIndex + 1];

  const activeItem = currentStep?.itemId ? plan.items.find((item) => item.id === currentStep.itemId) : undefined;
  const activeItems = activeItem
    ? [
        {
          itemId: activeItem.id,
          displayName: activeItem.displayName,
          cutId: activeItem.cutId,
          phase: currentStep?.zone ? `${currentStep.zone} phase` : 'active',
          timeRemainingLabel: currentStep?.durationMinutes ? `${currentStep.durationMinutes} min left` : 'In progress',
        },
      ]
    : [];

  const zoneStatus = orderedZones.map((zone) => ({
    zone,
    activeCount: timeline.slice(safeCurrentIndex, safeCurrentIndex + 2).filter((step) => step.zone === zone).length,
    label: zone,
  }));

  return {
    planId: plan.id,
    currentAction: currentStep
      ? buildAction(currentStep)
      : {
          id: 'idle',
          statusLabel: 'Now',
          instruction: 'Review your timeline and start with the first step.',
          actionType: 'check',
        },
    upNextAction: nextStep ? { ...buildAction(nextStep), statusLabel: 'Up next' } : undefined,
    zoneStatus,
    activeItems,
  };
}

function mapPlannerZoneToGrillZone(zone: PlannerPhase['zone'] | ExecutionTimelineGroup['zone']): GrillZoneType {
  if (zone === 'resting' || zone === 'holding') return 'resting';
  if (zone === 'direct_high' || zone === 'direct_medium') return 'direct';
  if (zone === 'mixed') return 'indirect';
  return 'indirect';
}

function actionFromExecutionGroup(group: ExecutionTimelineGroup): ParrilladaLiveAction {
  const duration = Math.max(1, group.endMinute - group.startMinute);
  return {
    id: group.id,
    statusLabel: 'Now',
    instruction: group.title,
    zone: mapPlannerZoneToGrillZone(group.zone),
    durationLabel: `${duration} min`,
    actionType: group.groupType === 'serve' ? 'serve' : group.groupType === 'move_to_indirect' ? 'move' : 'check',
  };
}

function actionFromPhase(phase: PlannerPhase): ParrilladaLiveAction {
  const duration = Math.max(1, phase.endMinute - phase.startMinute);
  return {
    id: phase.id,
    statusLabel: 'Now',
    instruction: `${phase.displayName} - ${phase.type}`,
    zone: mapPlannerZoneToGrillZone(phase.zone),
    durationLabel: `${duration} min`,
    actionType: phase.type === 'serve' ? 'serve' : phase.type === 'rest' ? 'rest' : 'move',
  };
}

export function buildParrilladaLivePlanFromResult(
  result: PlannerResult,
  currentActionId?: string,
): ParrilladaLivePlan {
  // Canonical runtime path: planner result + grouped execution actions.
  const groupBasedActions = result.executionTimelineGroups.map(actionFromExecutionGroup);
  const phaseBasedActions = result.phases
    .filter((phase) => phase.type === 'preheat' || phase.type === 'cook' || phase.type === 'hold' || phase.type === 'serve')
    .map(actionFromPhase);
  const sourceActions = groupBasedActions.length > 0 ? groupBasedActions : phaseBasedActions;
  const safeActions = sourceActions.length > 0
    ? sourceActions
    : [
        {
          id: 'idle',
          statusLabel: 'Now',
          instruction: 'Waiting for the first execution action.',
          actionType: 'check' as const,
        },
      ];
  const currentIndex = Math.max(
    0,
    currentActionId ? safeActions.findIndex((action) => action.id === currentActionId) : 0,
  );
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentAction = safeActions[safeCurrentIndex] ?? safeActions[0];
  const upNextAction = safeActions[safeCurrentIndex + 1];

  const zoneStatus: ParrilladaLivePlan['zoneStatus'] = orderedZones.map((zone) => ({
    zone,
    activeCount: safeActions
      .slice(safeCurrentIndex, safeCurrentIndex + 2)
      .filter((action) => action.zone === zone).length,
    label: zone,
  }));

  const activeItems =
    result.executionTimelineGroups.length > 0
      ? (result.executionTimelineGroups[safeCurrentIndex]?.items ?? []).map((item) => ({
          itemId: item.itemId,
          displayName: item.displayName,
          cutId: item.cutId,
          phase: currentAction.instruction,
          timeRemainingLabel: currentAction.durationLabel ?? 'In progress',
        }))
      : result.phases
          .filter((phase) => phase.id === currentAction.id)
          .map((phase) => ({
            itemId: phase.itemId,
            displayName: phase.displayName,
            cutId: phase.cutId,
            phase: phase.type,
            timeRemainingLabel: currentAction.durationLabel ?? 'In progress',
          }));

  return {
    planId: `live-${result.request.serveAtIso}`,
    currentAction,
    upNextAction,
    zoneStatus,
    activeItems,
  };
}
