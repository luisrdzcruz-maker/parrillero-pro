import { getCutSelectionIconPath } from '@/components/cuts/cutSelectionIconResolver';
import { iconRegistry } from '@/lib/assets/iconRegistry';
import type { GrillZoneType, ParrilladaMode, ParrilladaWarningSeverity } from '@/lib/planning';

type ActionType = 'move' | 'flip' | 'rest' | 'serve' | 'check';

function getRegistryIconPath<
  TCategory extends keyof typeof iconRegistry,
  TKey extends keyof (typeof iconRegistry)[TCategory],
>(category: TCategory, key: TKey): string | undefined {
  const categoryEntries = iconRegistry[category] as Record<string, { path?: string }>;
  const entry = categoryEntries[String(key)];
  return entry?.path;
}

export function getParrilladaItemIcon(cutId?: string): string | undefined {
  if (!cutId) return undefined;
  return getCutSelectionIconPath({ id: cutId });
}

export function getZoneIcon(zone: GrillZoneType): string | undefined {
  if (zone === 'direct') return getRegistryIconPath('methods', 'direct-heat');
  if (zone === 'indirect') return getRegistryIconPath('methods', 'indirect-charcoal');
  if (zone === 'resting') return getRegistryIconPath('live', 'rest-now');
  return getRegistryIconPath('methods', 'two-zone-gas');
}

export function getWarningIcon(severity: ParrilladaWarningSeverity): string | undefined {
  if (severity === 'critical' || severity === 'warning') {
    return getRegistryIconPath('warnings', 'flare-up-risk');
  }
  return getRegistryIconPath('warnings', 'long-cook-warning');
}

export function getModeIcon(mode: ParrilladaMode): string | undefined {
  if (mode === 'pro') return getRegistryIconPath('ui', 'premium');
  return getRegistryIconPath('ui', 'meat-selection');
}

export function getLiveActionIcon(actionType: ActionType): string | undefined {
  if (actionType === 'flip') return getRegistryIconPath('live', 'flip-now');
  if (actionType === 'rest') return getRegistryIconPath('live', 'rest-now');
  if (actionType === 'serve') return getRegistryIconPath('live', 'place-food');
  if (actionType === 'check') return getRegistryIconPath('live', 'check-temperature');
  return getRegistryIconPath('live', 'turn-food');
}
