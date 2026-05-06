import { detectZoneConflicts, hasConflict, pickSupportedZone } from './capacity';
import { normalizePlannerInput } from './estimation';
import { addMinutesIso, sortPhases } from './time';
import { buildPlannerWarnings } from './warnings';
import type {
  NormalizedPlannerItem,
  PlannerPhase,
  PlannerRequest,
  PlannerResult,
  PlanningZone,
  SchedulerStrategy,
} from './types';

function itemSortScore(item: NormalizedPlannerItem, strategy: SchedulerStrategy): number {
  const sensitivityScore = { low: 1, medium: 2, high: 3, critical: 4 }[item.profile.timingSensitivity];
  const holdScore = { excellent: 1, good: 2, limited: 3, poor: 4, unsafe: 5 }[item.profile.holdQuality];
  const priority = item.priority ?? 0;

  if (strategy === 'quality_first') return holdScore * 100 + sensitivityScore * 20 + priority * 10;
  if (strategy === 'low_stress') return item.estimatedCookMinutes * 3 - item.profile.maxHoldMinutes + priority * 10;
  if (strategy === 'serve_together') return sensitivityScore * 100 + holdScore * 20 + priority * 10;
  return sensitivityScore * 60 + holdScore * 40 + item.estimatedCookMinutes + priority * 10;
}

function makePhase(args: {
  item: NormalizedPlannerItem;
  type: PlannerPhase['type'];
  zone: PlanningZone;
  startMinute: number;
  endMinute: number;
  serveAtIso: string;
  notes?: string[];
}): PlannerPhase {
  const { item, type, zone, startMinute, endMinute, serveAtIso, notes } = args;
  return {
    id: `${item.id}-${type}-${startMinute}-${endMinute}`,
    itemId: item.id,
    cutId: item.cutId,
    displayName: item.displayName,
    type,
    zone,
    startMinute,
    endMinute,
    startIso: addMinutesIso(serveAtIso, startMinute),
    endIso: addMinutesIso(serveAtIso, endMinute),
    durationMinutes: endMinute - startMinute,
    isFlexible: type !== 'serve',
    notes,
  };
}

function findLatestNonConflictingStart(args: {
  item: NormalizedPlannerItem;
  existing: PlannerPhase[];
  request: PlannerRequest;
  zone: PlanningZone;
  desiredEndMinute: number;
}): number {
  const { item, existing, request, zone, desiredEndMinute } = args;
  const duration = item.estimatedCookMinutes;
  const earliest = -(request.maxPlanLookbackMinutes ?? 480);
  let start = desiredEndMinute - duration;

  // Move earlier until the grill zone has capacity.
  while (start >= earliest) {
    const candidate = makePhase({
      item,
      type: 'cook',
      zone,
      startMinute: start,
      endMinute: start + duration,
      serveAtIso: request.serveAtIso,
    });
    if (!hasConflict(candidate, existing, request.grillCapacity)) return start;
    start -= 5;
  }

  return desiredEndMinute - duration;
}

function buildItemPhases(args: {
  item: NormalizedPlannerItem;
  existing: PlannerPhase[];
  request: PlannerRequest;
}): PlannerPhase[] {
  const { item, existing, request } = args;
  const profile = item.profile;
  const serveMinute = item.latestServeMinute;
  const restEnd = serveMinute;
  const restStart = restEnd - item.restMinutes;
  const desiredCookEnd = restStart;
  const zone = item.fixedZone ?? pickSupportedZone(request.grillCapacity, profile.preferredZones, profile.fallbackZones);
  const cookStart = item.fixedStartTime
    ? Math.round((new Date(item.fixedStartTime).getTime() - new Date(request.serveAtIso).getTime()) / 60000)
    : findLatestNonConflictingStart({ item, existing, request, zone, desiredEndMinute: desiredCookEnd });
  const cookEnd = cookStart + item.estimatedCookMinutes;

  const phases: PlannerPhase[] = [];

  if (item.setupMinutes > 0) {
    phases.push(
      makePhase({
        item,
        type: 'prep',
        zone,
        startMinute: cookStart - item.setupMinutes,
        endMinute: cookStart,
        serveAtIso: request.serveAtIso,
        notes: ['Prepare tray, seasoning, tools, probe, and serving board.'],
      }),
    );
  }

  phases.push(
    makePhase({
      item,
      type: 'cook',
      zone,
      startMinute: cookStart,
      endMinute: cookEnd,
      serveAtIso: request.serveAtIso,
      notes: profile.flipCadenceMinutes ? [`Check/flip around every ${profile.flipCadenceMinutes} min when relevant.`] : undefined,
    }),
  );

  if (item.restMinutes > 0) {
    phases.push(
      makePhase({
        item,
        type: 'rest',
        zone: 'resting',
        startMinute: cookEnd,
        endMinute: cookEnd + item.restMinutes,
        serveAtIso: request.serveAtIso,
        notes: ['Rest loosely covered unless crisp skin/crust would suffer.'],
      }),
    );
  }

  const readyMinute = cookEnd + item.restMinutes;
  if (readyMinute < serveMinute && profile.canHoldWarm && request.allowHolding !== false) {
    phases.push(
      makePhase({
        item,
        type: 'hold',
        zone: 'holding',
        startMinute: readyMinute,
        endMinute: serveMinute,
        serveAtIso: request.serveAtIso,
        notes: ['Hold warm gently. Avoid steaming/crust loss.'],
      }),
    );
  }

  phases.push(
    makePhase({
      item,
      type: 'serve',
      zone: 'holding',
      startMinute: serveMinute,
      endMinute: serveMinute + 1,
      serveAtIso: request.serveAtIso,
      notes: ['Slice/plate and serve.'],
    }),
  );

  return phases;
}

export function scheduleParrillada(request: PlannerRequest): PlannerResult {
  const strategy = request.strategy ?? 'balanced';
  const items = request.items.map((input) => normalizePlannerInput(input));
  const sortedItems = [...items].sort((a, b) => itemSortScore(b, strategy) - itemSortScore(a, strategy));
  const phases: PlannerPhase[] = [];

  const preheatMinutes = request.preheatMinutes ?? request.grillCapacity.defaultPreheatMinutes ?? 15;
  phases.push({
    id: `global-preheat-${preheatMinutes}`,
    itemId: 'global',
    cutId: 'global',
    displayName: 'Preheat grill',
    type: 'preheat',
    zone: 'direct_high',
    startMinute: -preheatMinutes,
    endMinute: 0,
    startIso: addMinutesIso(request.serveAtIso, -preheatMinutes),
    endIso: request.serveAtIso,
    durationMinutes: preheatMinutes,
    isFlexible: true,
    notes: ['Preheat can start earlier if long cooks need stable zones.'],
  });

  for (const item of sortedItems) {
    const itemPhases = buildItemPhases({ item, existing: phases, request });
    phases.push(...itemPhases);
  }

  const sortedPhases = sortPhases(phases);
  const conflicts = detectZoneConflicts(sortedPhases, request.grillCapacity);
  const warnings = buildPlannerWarnings({ request: { ...request, strategy }, items, phases: sortedPhases, conflicts });
  const planStartMinute = Math.min(...sortedPhases.map((phase) => phase.startMinute));
  const planEndMinute = Math.max(...sortedPhases.map((phase) => phase.endMinute));
  const criticalWarnings = warnings.filter((warning) => warning.severity === 'critical').length;
  const warningCount = warnings.filter((warning) => warning.severity === 'warning').length;

  return {
    ok: criticalWarnings === 0,
    request: { ...request, strategy },
    items,
    phases: sortedPhases,
    warnings,
    conflicts,
    summary: {
      totalItems: items.length,
      planStartIso: addMinutesIso(request.serveAtIso, planStartMinute),
      planEndIso: addMinutesIso(request.serveAtIso, planEndMinute),
      totalDurationMinutes: planEndMinute - planStartMinute,
      peakParallelDemand: conflicts.reduce((max, conflict) => Math.max(max, conflict.demand), 0),
      strategy,
      confidence: criticalWarnings > 0 ? 'low' : warningCount > 2 ? 'medium' : 'high',
    },
  };
}
