import { getParrilladaItemPresentation } from './parrilladaEligibility';
import { addMinutesIso } from './time';
import type {
  ExecutionTimelineGroup,
  ExecutionTimelineGroupItem,
  NormalizedPlannerItem,
  ParrilladaFinishPriority,
  ParrilladaFoodSafetyGroup,
  ParrilladaHeatFragility,
  ParrilladaHoldBehavior,
  PlannerPhase,
  PlannerResult,
  PlannerWarning,
  PlanningZone,
} from './types';

type GroupDraft = {
  id: string;
  groupType: ExecutionTimelineGroup['groupType'];
  startMinute: number;
  endMinute: number;
  zone: PlanningZone | 'mixed';
  heat: ExecutionTimelineGroup['heat'];
  items: ExecutionTimelineGroupItem[];
  phaseIds: string[];
  safetyNotes: string[];
  details: string[];
};

const ACTIVE_COOK_PHASES = new Set<PlannerPhase['type']>(['cook', 'sear', 'flip', 'check']);
const DIRECT_ZONES = new Set<PlanningZone>(['direct_high', 'direct_medium']);
const TIMING_CLOSE_WINDOW_MINUTES = 12;
const BURN_OFF_MINUTES = 3;

function quantityForItem(item: NormalizedPlannerItem): number {
  return Math.max(1, Math.round(item.quantity ?? 1));
}

function unitForItem(item: NormalizedPlannerItem): ExecutionTimelineGroupItem['unit'] {
  return item.unit ?? 'pieces';
}

function deriveFoodSafetyGroup(item: NormalizedPlannerItem): ParrilladaFoodSafetyGroup {
  const tags = new Set(item.planningMetadata?.riskTags ?? []);
  if (tags.has('ready_to_eat')) return 'ready_to_eat';
  if (item.animal === 'vegetable') return 'vegetable';
  if (item.animal === 'chicken') return 'raw_poultry';
  if (item.animal === 'fish' || item.animal === 'seafood') return 'raw_fish';
  if (item.animal === 'pork') return 'raw_pork';
  return 'raw_beef';
}

function deriveHeatFragility(item: NormalizedPlannerItem): ParrilladaHeatFragility {
  const metadataSensitivity = item.planningMetadata?.timingSensitivity;
  const profileSensitivity = item.profile.timingSensitivity;
  const tags = new Set(item.planningMetadata?.riskTags ?? []);
  const highSensitivity = metadataSensitivity === 'high' || profileSensitivity === 'high' || profileSensitivity === 'critical';
  if (item.animal === 'fish' || tags.has('delicate_target_mode') || highSensitivity) return 'high';
  if (metadataSensitivity === 'medium' || profileSensitivity === 'medium') return 'medium';
  return 'low';
}

function deriveHoldBehavior(item: NormalizedPlannerItem): ParrilladaHoldBehavior {
  const canHoldWarm = item.planningMetadata?.canHoldWarm ?? item.profile.canHoldWarm;
  const maxHoldMinutes = item.planningMetadata?.maxHoldMinutes ?? item.profile.maxHoldMinutes;
  const fragility = deriveHeatFragility(item);
  if (canHoldWarm && maxHoldMinutes >= 20) return 'can_hold_indirect';
  if (canHoldWarm && maxHoldMinutes >= 8) return 'short_hold_only';
  if (fragility === 'high') return 'serve_immediately';
  return 'do_not_hold';
}

function deriveFinishPriority(item: NormalizedPlannerItem, holdBehavior: ParrilladaHoldBehavior): ParrilladaFinishPriority {
  const presentation = getParrilladaItemPresentation(item);
  const timingSensitivity = item.planningMetadata?.timingSensitivity ?? (item.profile.timingSensitivity === 'critical' ? 'high' : item.profile.timingSensitivity);
  if (presentation.role === 'fastFinish' || timingSensitivity === 'high') return 'finish_last';
  if (holdBehavior === 'serve_immediately' || holdBehavior === 'do_not_hold') return 'finish_last';
  if (holdBehavior === 'can_hold_indirect' && (presentation.role === 'side' || presentation.role === 'starter' || presentation.role === 'longCook')) {
    return 'early';
  }
  return 'middle';
}

function itemToExecutionItem(item: NormalizedPlannerItem): ExecutionTimelineGroupItem {
  const holdBehavior = deriveHoldBehavior(item);
  const heatFragility = deriveHeatFragility(item);
  const finishPriority = deriveFinishPriority(item, holdBehavior);
  return {
    itemId: item.id,
    cutId: item.cutId,
    displayName: item.displayName,
    quantity: quantityForItem(item),
    unit: unitForItem(item),
    physicalPortionCount: item.physicalPortionCount,
    behavior: {
      holdBehavior,
      finishPriority,
      heatFragility,
      foodSafetyGroup: deriveFoodSafetyGroup(item),
    },
  };
}

function zoneHeat(zone: PlanningZone): ExecutionTimelineGroup['heat'] {
  if (zone === 'direct_high') return 'high';
  if (zone === 'direct_medium' || zone === 'plancha' || zone === 'indirect_medium') return 'medium';
  return 'low';
}

function zoneGroup(zone: PlanningZone): 'direct' | 'indirect' | 'plancha' | 'rest' {
  if (zone === 'direct_high' || zone === 'direct_medium') return 'direct';
  if (zone === 'plancha') return 'plancha';
  if (zone === 'resting' || zone === 'holding') return 'rest';
  return 'indirect';
}

function canShareFoodSafetyZone(a: ExecutionTimelineGroupItem, b: ExecutionTimelineGroupItem): boolean {
  const oneIsPoultry =
    a.behavior.foodSafetyGroup === 'raw_poultry' || b.behavior.foodSafetyGroup === 'raw_poultry';
  const otherIsVegOrReady =
    a.behavior.foodSafetyGroup === 'vegetable' ||
    a.behavior.foodSafetyGroup === 'ready_to_eat' ||
    b.behavior.foodSafetyGroup === 'vegetable' ||
    b.behavior.foodSafetyGroup === 'ready_to_eat';
  if (oneIsPoultry && otherIsVegOrReady) return false;
  return true;
}

function isHighFlareRisk(item: ExecutionTimelineGroupItem): boolean {
  const cut = item.cutId.toLowerCase();
  return (
    cut.includes('sausage') ||
    cut.includes('chorizo') ||
    cut.includes('pork_belly') ||
    cut.includes('fat_cap')
  );
}

function isPremiumSensitive(item: ExecutionTimelineGroupItem): boolean {
  return item.behavior.finishPriority === 'finish_last' && item.behavior.heatFragility === 'high';
}

function itemsAreCompatible(args: {
  existing: ExecutionTimelineGroupItem[];
  candidate: ExecutionTimelineGroupItem;
  groupType: ExecutionTimelineGroup['groupType'];
  zone: PlanningZone;
}): boolean {
  const { existing, candidate, groupType, zone } = args;
  const candidateZoneGroup = zoneGroup(zone);
  const candidateHeat = zoneHeat(zone);
  for (const item of existing) {
    if (!canShareFoodSafetyZone(item, candidate)) return false;

    if (
      groupType === 'start_holdable_items' &&
      (item.behavior.finishPriority === 'finish_last' || candidate.behavior.finishPriority === 'finish_last')
    ) {
      return false;
    }

    if (
      candidateZoneGroup === 'direct' &&
      ((isHighFlareRisk(item) && isPremiumSensitive(candidate)) || (isHighFlareRisk(candidate) && isPremiumSensitive(item)))
    ) {
      return false;
    }

    const fragilityPair = [item.behavior.heatFragility, candidate.behavior.heatFragility];
    if (candidateHeat === 'high' && fragilityPair.includes('high') && fragilityPair.includes('low')) return false;
  }
  return true;
}

function resolveGroupType(phase: PlannerPhase, item: ExecutionTimelineGroupItem): ExecutionTimelineGroup['groupType'] {
  if (phase.type === 'preheat') return 'setup';
  if (phase.type === 'hold') return 'move_to_indirect';
  if (phase.type === 'serve') return 'serve';
  if (item.behavior.finishPriority === 'finish_last') return 'finish_sensitive_items';
  if (item.behavior.holdBehavior === 'can_hold_indirect' || item.behavior.holdBehavior === 'short_hold_only') {
    return 'start_holdable_items';
  }
  return 'other';
}

function compactItemLabel(item: ExecutionTimelineGroupItem): string {
  const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
  return `${item.displayName}${qty}`;
}

function titleForDraft(draft: GroupDraft): string {
  const names = draft.items.map((item) => compactItemLabel(item)).join(' + ');
  if (draft.groupType === 'setup') return 'Setup grill zones';
  if (draft.groupType === 'start_holdable_items') return `Start holdable items · ${names}`;
  if (draft.groupType === 'move_to_indirect') return `Move to indirect/holding · ${names}`;
  if (draft.groupType === 'clean_or_burn_off_zone') return 'Clean/burn off zone';
  if (draft.groupType === 'finish_sensitive_items') return `Finish sensitive items · ${names}`;
  if (draft.groupType === 'serve') return `Serve · ${names}`;
  return names.length > 0 ? names : 'Execution step';
}

function instructionForDraft(draft: GroupDraft): string {
  if (draft.groupType === 'setup') return 'Preheat grill and establish direct + indirect zones.';
  if (draft.groupType === 'start_holdable_items') return 'Start these holdable items first to build buffer.';
  if (draft.groupType === 'move_to_indirect') return 'Move these items to indirect/warm holding while finishing sensitive cuts.';
  if (draft.groupType === 'clean_or_burn_off_zone') return 'High heat before vegetables or ready-to-eat food.';
  if (draft.groupType === 'finish_sensitive_items') return 'Cook these timing-sensitive items close to serve time.';
  if (draft.groupType === 'serve') return 'Plate and serve while textures and temperatures are optimal.';
  return 'Execute this grouped action as scheduled.';
}

function toGroup(draft: GroupDraft, serveAtIso: string): ExecutionTimelineGroup {
  return {
    id: draft.id,
    startMinute: draft.startMinute,
    endMinute: draft.endMinute,
    startIso: addMinutesIso(serveAtIso, draft.startMinute),
    endIso: addMinutesIso(serveAtIso, draft.endMinute),
    title: titleForDraft(draft),
    groupType: draft.groupType,
    items: draft.items,
    zone: draft.zone,
    heat: draft.heat,
    instruction: instructionForDraft(draft),
    safetyNotes: draft.safetyNotes,
    details: draft.details.length > 0 ? draft.details : undefined,
    phaseIds: draft.phaseIds,
  };
}

function ensureFinalServeGroup(groups: ExecutionTimelineGroup[], result: PlannerResult): ExecutionTimelineGroup[] {
  if (groups.some((group) => group.groupType === 'serve')) return groups;
  const fallback: ExecutionTimelineGroup = {
    id: 'execution-serve-fallback',
    startMinute: 0,
    endMinute: 1,
    startIso: result.request.serveAtIso,
    endIso: addMinutesIso(result.request.serveAtIso, 1),
    title: 'Serve',
    groupType: 'serve',
    items: [],
    zone: 'holding',
    heat: 'low',
    instruction: 'Serve all items.',
    safetyNotes: [],
    phaseIds: [],
  };
  return [...groups, fallback];
}

function buildBurnOffGroup(result: PlannerResult, itemById: Map<string, ExecutionTimelineGroupItem>): ExecutionTimelineGroup | null {
  const poultryDirectPhases = result.phases.filter((phase) => {
    if (!ACTIVE_COOK_PHASES.has(phase.type)) return false;
    if (!DIRECT_ZONES.has(phase.zone)) return false;
    const item = itemById.get(phase.itemId);
    return item?.behavior.foodSafetyGroup === 'raw_poultry';
  });
  const produceDirectPhases = result.phases.filter((phase) => {
    if (!ACTIVE_COOK_PHASES.has(phase.type)) return false;
    if (!DIRECT_ZONES.has(phase.zone)) return false;
    const item = itemById.get(phase.itemId);
    return item?.behavior.foodSafetyGroup === 'vegetable' || item?.behavior.foodSafetyGroup === 'ready_to_eat';
  });

  if (poultryDirectPhases.length === 0 || produceDirectPhases.length === 0) return null;

  let latestPoultryEnd = Number.NEGATIVE_INFINITY;
  let earliestProduceStart = Number.POSITIVE_INFINITY;
  for (const producePhase of produceDirectPhases) {
    for (const poultryPhase of poultryDirectPhases) {
      if (poultryPhase.endMinute <= producePhase.startMinute) {
        latestPoultryEnd = Math.max(latestPoultryEnd, poultryPhase.endMinute);
        earliestProduceStart = Math.min(earliestProduceStart, producePhase.startMinute);
      }
    }
  }

  if (!Number.isFinite(latestPoultryEnd) || !Number.isFinite(earliestProduceStart)) return null;

  const burnOffStart = Math.max(latestPoultryEnd, earliestProduceStart - BURN_OFF_MINUTES);
  const burnOffEnd = burnOffStart + BURN_OFF_MINUTES;

  return {
    id: 'execution-clean-burn-off-zone',
    startMinute: burnOffStart,
    endMinute: burnOffEnd,
    startIso: addMinutesIso(result.request.serveAtIso, burnOffStart),
    endIso: addMinutesIso(result.request.serveAtIso, burnOffEnd),
    title: 'Clean/burn off zone · 2-3 min',
    groupType: 'clean_or_burn_off_zone',
    items: [],
    zone: 'direct_high',
    heat: 'high',
    instruction: 'High heat before vegetables or ready-to-eat food.',
    safetyNotes: ['Raw poultry touched this zone earlier. Burn off before produce/ready food.'],
    details: ['Keep grates on high heat and brush before zone reuse.'],
    phaseIds: [...poultryDirectPhases.map((phase) => phase.id), ...produceDirectPhases.map((phase) => phase.id)],
  };
}

function groupPhaseDrivenActions(result: PlannerResult, itemById: Map<string, ExecutionTimelineGroupItem>): ExecutionTimelineGroup[] {
  const drafts: GroupDraft[] = [];
  const relevant = result.phases.filter((phase) => phase.type === 'preheat' || phase.type === 'cook' || phase.type === 'hold' || phase.type === 'serve');
  const ordered = [...relevant].sort((a, b) => {
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    return a.endMinute - b.endMinute;
  });

  for (const phase of ordered) {
    const fallbackItem: ExecutionTimelineGroupItem = {
      itemId: phase.itemId,
      cutId: phase.cutId,
      displayName: phase.displayName,
      quantity: 1,
      unit: 'pieces',
      behavior: {
        holdBehavior: 'do_not_hold',
        finishPriority: 'middle',
        heatFragility: 'medium',
        foodSafetyGroup: 'raw_beef',
      },
    };
    const executionItem = itemById.get(phase.itemId) ?? fallbackItem;
    const groupType = resolveGroupType(phase, executionItem);
    const heat = zoneHeat(phase.zone);

    let placed = false;
    for (const draft of drafts) {
      if (draft.groupType !== groupType) continue;
      if (Math.abs(draft.startMinute - phase.startMinute) > TIMING_CLOSE_WINDOW_MINUTES) continue;
      const sameZoneGroup =
        draft.zone === 'mixed' || zoneGroup(draft.zone) === zoneGroup(phase.zone);
      if (!sameZoneGroup) continue;
      if (!itemsAreCompatible({ existing: draft.items, candidate: executionItem, groupType, zone: phase.zone })) continue;

      draft.startMinute = Math.min(draft.startMinute, phase.startMinute);
      draft.endMinute = Math.max(draft.endMinute, phase.endMinute);
      draft.zone = draft.zone === phase.zone ? draft.zone : zoneGroup(draft.zone as PlanningZone) === zoneGroup(phase.zone) ? draft.zone : 'mixed';
      draft.heat = draft.heat === heat ? draft.heat : 'mixed';
      draft.phaseIds.push(phase.id);
      if (!draft.items.some((item) => item.itemId === executionItem.itemId)) {
        draft.items.push(executionItem);
      }
      placed = true;
      break;
    }

    if (!placed) {
      drafts.push({
        id: `execution-${groupType}-${phase.startMinute}-${drafts.length}`,
        groupType,
        startMinute: phase.startMinute,
        endMinute: phase.endMinute,
        zone: phase.zone,
        heat,
        items: phase.itemId === 'global' ? [] : [executionItem],
        phaseIds: [phase.id],
        safetyNotes: [],
        details: phase.notes ? [...phase.notes] : [],
      });
    }
  }

  return drafts.map((draft) => toGroup(draft, result.request.serveAtIso));
}

function injectSafetyWarningsIntoGroups(groups: ExecutionTimelineGroup[], warnings: PlannerWarning[]): ExecutionTimelineGroup[] {
  if (warnings.length === 0) return groups;
  const warningByPhase = new Map<string, PlannerWarning[]>();
  for (const warning of warnings) {
    for (const phaseId of warning.phaseIds ?? []) {
      warningByPhase.set(phaseId, [...(warningByPhase.get(phaseId) ?? []), warning]);
    }
  }
  return groups.map((group) => {
    const linkedWarnings = group.phaseIds.flatMap((phaseId) => warningByPhase.get(phaseId) ?? []);
    if (linkedWarnings.length === 0) return group;
    const notes = [
      ...group.safetyNotes,
      ...linkedWarnings.map((warning) => `${warning.title}: ${warning.message}`),
    ];
    return {
      ...group,
      safetyNotes: Array.from(new Set(notes)),
    };
  });
}

export function buildExecutionTimelineGroups(result: PlannerResult): ExecutionTimelineGroup[] {
  const itemById = new Map(result.items.map((item) => [item.id, itemToExecutionItem(item)]));
  const grouped = groupPhaseDrivenActions(result, itemById);
  const burnOffGroup = buildBurnOffGroup(result, itemById);
  const withBurnOff = burnOffGroup ? [...grouped, burnOffGroup] : grouped;
  const withWarnings = injectSafetyWarningsIntoGroups(withBurnOff, result.warnings);
  const withServe = ensureFinalServeGroup(withWarnings, result);
  return withServe.sort((a, b) => {
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    if (a.endMinute !== b.endMinute) return a.endMinute - b.endMinute;
    return a.title.localeCompare(b.title);
  });
}

