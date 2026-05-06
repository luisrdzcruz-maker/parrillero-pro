import type { NormalizedPlannerItem, PlannerRequest, PlannerWarning, PlannerPhase, ZoneConflict } from './types';

function formatSuggestedServeTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

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
    const itemPhases = phases.filter((phase) => phase.itemId === item.id);
    const prep = itemPhases.find((phase) => phase.type === 'prep');
    const cook = itemPhases.find((phase) => phase.type === 'cook');
    const rest = itemPhases.find((phase) => phase.type === 'rest');

    if (prep && cook && prep.endMinute > cook.startMinute) {
      warnings.push({
        id: `prep-after-cook-${item.id}`,
        severity: 'critical',
        code: 'UNKNOWN',
        title: `${item.displayName}: prep order issue`,
        message: 'Prep/setup must finish before cook starts.',
        itemIds: [item.id],
        phaseIds: [prep.id, cook.id],
      });
    }

    if (cook && rest && rest.startMinute < cook.endMinute) {
      warnings.push({
        id: `rest-before-cook-finish-${item.id}`,
        severity: 'critical',
        code: 'UNKNOWN',
        title: `${item.displayName}: rest order issue`,
        message: 'Rest must start after cooking finishes.',
        itemIds: [item.id],
        phaseIds: [cook.id, rest.id],
      });
    }

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

    const globalPreheat = phases.find((phase) => phase.type === 'preheat' && phase.itemId === 'global');
    const firstCook = phases
      .filter((phase) => phase.type === 'cook')
      .sort((a, b) => a.startMinute - b.startMinute)[0];

    if (globalPreheat && firstCook && globalPreheat.endMinute > firstCook.startMinute) {
      warnings.push({
        id: 'preheat-after-cook-start',
        severity: 'critical',
        code: 'UNKNOWN',
        title: 'Preheat scheduling issue',
        message: 'Global preheat should finish before the first cook phase starts.',
        phaseIds: [globalPreheat.id, firstCook.id],
      });
    }

    for (const phase of phases) {
      if (new Date(phase.startIso).getTime() < now && phase.type !== 'serve') {
        const delayMinutes = Math.max(1, Math.ceil((now - new Date(phase.startIso).getTime()) / 60000));
        const suggestedServeIso = new Date(new Date(request.serveAtIso).getTime() + (delayMinutes + 10) * 60000).toISOString();
        warnings.push({
          id: `starts-in-past-${phase.id}`,
          severity: 'critical',
          code: 'STARTS_IN_PAST',
          title: 'Plan starts in the past',
          message: `${phase.displayName} should have started already. Suggested minimum serve time: ${formatSuggestedServeTime(suggestedServeIso)}.`,
          itemIds: [phase.itemId],
          phaseIds: [phase.id],
        });
        break;
      }
    }
  }

  return warnings;
}
