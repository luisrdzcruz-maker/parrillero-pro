import type { GrillCapacity, PlannerPhase, PlanningZone, ZoneConflict } from './types';

export function getZoneCapacity(grill: GrillCapacity, zone: PlanningZone): number {
  return grill.zones.find((entry) => entry.zone === zone)?.slots ?? 0;
}

export function isZoneSupported(grill: GrillCapacity, zone: PlanningZone): boolean {
  return getZoneCapacity(grill, zone) > 0;
}

export function pickSupportedZone(grill: GrillCapacity, preferred: PlanningZone[], fallback: PlanningZone[] = []): PlanningZone {
  const candidates = [...preferred, ...fallback];
  return candidates.find((zone) => isZoneSupported(grill, zone)) ?? candidates[0] ?? 'direct_medium';
}

export function detectZoneConflicts(phases: PlannerPhase[], grill: GrillCapacity): ZoneConflict[] {
  const conflicts: ZoneConflict[] = [];
  const cookLike = phases.filter((phase) => !['rest', 'hold', 'serve', 'buffer'].includes(phase.type));
  if (cookLike.length === 0) return conflicts;

  const min = Math.min(...cookLike.map((phase) => phase.startMinute));
  const max = Math.max(...cookLike.map((phase) => phase.endMinute));

  for (let minute = min; minute < max; minute += 1) {
    for (const zoneEntry of grill.zones) {
      const active = cookLike.filter((phase) => phase.zone === zoneEntry.zone && phase.startMinute <= minute && phase.endMinute > minute);
      if (active.length > zoneEntry.slots) {
        conflicts.push({
          zone: zoneEntry.zone,
          minute,
          demand: active.length,
          capacity: zoneEntry.slots,
          phaseIds: active.map((phase) => phase.id),
        });
      }
    }
  }

  return conflicts;
}

export function hasConflict(candidate: PlannerPhase, existing: PlannerPhase[], grill: GrillCapacity): boolean {
  const capacity = getZoneCapacity(grill, candidate.zone);
  if (capacity <= 0) return true;

  for (let minute = candidate.startMinute; minute < candidate.endMinute; minute += 1) {
    const active = existing.filter(
      (phase) =>
        phase.zone === candidate.zone &&
        !['rest', 'hold', 'serve', 'buffer'].includes(phase.type) &&
        phase.startMinute <= minute &&
        phase.endMinute > minute,
    );
    if (active.length + 1 > capacity) return true;
  }

  return false;
}
