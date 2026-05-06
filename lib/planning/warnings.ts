import type { NormalizedPlannerItem, PlannerRequest, PlannerWarning, PlannerPhase, ZoneConflict } from './types';

export function buildPlannerWarnings(args: {
  request: PlannerRequest;
  items: NormalizedPlannerItem[];
  phases: PlannerPhase[];
  conflicts: ZoneConflict[];
}): PlannerWarning[] {
  const { request, items, phases, conflicts } = args;
  const warnings: PlannerWarning[] = [];

  if (request.items.length > 6) {
    warnings.push({
      id: 'too-many-items',
      severity: 'warning',
      code: 'TOO_MANY_ITEMS',
      title: 'Many items for a lite scheduler',
      message: 'This plan includes many items. Consider splitting into starters, mains, and sides.',
    });
  }

  const firstStart = Math.min(...phases.map((phase) => phase.startMinute));
  const maxLookback = request.maxPlanLookbackMinutes ?? 480;
  if (Math.abs(firstStart) > maxLookback) {
    warnings.push({
      id: 'plan-too-long',
      severity: 'warning',
      code: 'PLAN_TOO_LONG',
      title: 'Long cooking window',
      message: `The plan starts more than ${maxLookback} minutes before serving. Use extra buffer and validate temperatures manually.`,
    });
  }

  for (const conflict of conflicts.slice(0, 6)) {
    warnings.push({
      id: `zone-conflict-${conflict.zone}-${conflict.minute}`,
      severity: 'critical',
      code: 'ZONE_CONFLICT',
      title: 'Grill zone conflict',
      message: `${conflict.zone} needs ${conflict.demand} slots but only has ${conflict.capacity}. Move one item earlier/later or use another zone.`,
      phaseIds: conflict.phaseIds,
    });
  }

  for (const item of items) {
    const hold = phases.find((phase) => phase.itemId === item.id && phase.type === 'hold');
    if (hold && hold.durationMinutes > item.profile.maxHoldMinutes) {
      warnings.push({
        id: `hold-too-long-${item.id}`,
        severity: item.profile.holdQuality === 'poor' ? 'critical' : 'warning',
        code: 'HOLD_TOO_LONG',
        title: `${item.displayName} holds too long`,
        message: `Holding ${item.displayName} for ${hold.durationMinutes} minutes may reduce quality. Aim for ${item.profile.maxHoldMinutes} minutes or less.`,
        itemIds: [item.id],
        phaseIds: [hold.id],
      });
    }

    if (item.profile.safetyCritical) {
      warnings.push({
        id: `safety-${item.id}`,
        severity: 'info',
        code: 'SAFETY_RISK',
        title: `${item.displayName}: verify safe internal temperature`,
        message: 'Use a probe/thermometer for safety-critical items. Time alone is not enough.',
        itemIds: [item.id],
      });
    }

    if (item.profile.holdQuality === 'poor') {
      warnings.push({
        id: `quality-risk-${item.id}`,
        severity: 'warning',
        code: 'QUALITY_RISK',
        title: `${item.displayName}: serve immediately`,
        message: 'This item loses quality quickly. The scheduler should place it near the end.',
        itemIds: [item.id],
      });
    }
  }

  const nowIso = request.nowIso;
  if (nowIso) {
    const now = new Date(nowIso).getTime();
    for (const phase of phases) {
      if (new Date(phase.startIso).getTime() < now && phase.type !== 'serve') {
        warnings.push({
          id: `starts-in-past-${phase.id}`,
          severity: 'critical',
          code: 'STARTS_IN_PAST',
          title: 'Plan starts in the past',
          message: `${phase.displayName} should have started already. Regenerate with a later serve time or simplify the menu.`,
          itemIds: [phase.itemId],
          phaseIds: [phase.id],
        });
        break;
      }
    }
  }

  return warnings;
}
