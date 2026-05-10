import type { ExecutionTimelineGroup } from '@/lib/planning';

function joinNames(group: ExecutionTimelineGroup): string {
  return group.items.map((item) => item.displayName).join(' + ');
}

export function getShortGroupLabel(group: ExecutionTimelineGroup): string {
  const names = joinNames(group);
  switch (group.groupType) {
    case 'setup':
      return 'Setup zones';
    case 'start_holdable_items':
      return names ? `Start ${names}` : 'Start';
    case 'move_to_indirect':
      return names ? `Move ${names} to indirect` : 'Move to indirect';
    case 'finish_sensitive_items':
      return names ? `Finish ${names}` : 'Finish';
    case 'clean_or_burn_off_zone':
      return 'Clean zone';
    case 'serve':
      return 'Serve';
    case 'other':
    default:
      return names || 'Action';
  }
}

export function getGroupMeta(group: ExecutionTimelineGroup): string | null {
  if (group.zone === 'mixed') return 'mixed zones';
  return group.zone.replaceAll('_', ' ');
}
