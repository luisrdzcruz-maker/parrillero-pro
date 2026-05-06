import type { PlannerPhase } from './types';

export function addMinutesIso(baseIso: string, minutes: number): string {
  const d = new Date(baseIso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

export function diffMinutes(aIso: string, bIso: string): number {
  return Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / 60000);
}

export function minutesToHuman(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h <= 0) return `${sign}${m} min`;
  if (m === 0) return `${sign}${h} h`;
  return `${sign}${h} h ${m} min`;
}

export function sortPhases(phases: PlannerPhase[]): PlannerPhase[] {
  return [...phases].sort((a, b) => {
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    if (a.endMinute !== b.endMinute) return a.endMinute - b.endMinute;
    return a.displayName.localeCompare(b.displayName);
  });
}

export function phaseOverlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
