import type { ParrilladaMode, ParrilladaPlan } from '@/lib/planning';

export const parrilladaPlanCopy = {
  entry: {
    quickTitle: 'Quick BBQ Plan',
    quickDescription: 'Plan 2-4 items with a simple serve timeline.',
    proTitle: 'Pro BBQ Plan',
    proDescription: 'Coordinate more cuts, zones, serve windows, and warnings.',
    recentTitle: 'Recent plans',
  },
  setup: {
    title: 'Build your Parrillada',
    subtitle: 'Stack simple cards now. Unlock advanced controls only when needed.',
    cta: 'Generate Parrillada Plan',
  },
  review: {
    title: 'Your Parrillada Plan',
    cta: 'Start Live Parrillada',
  },
  live: {
    title: 'Live Parrillada',
    markDone: 'Mark Done',
    adjustPlaceholder: 'Adjust plan (Pro)',
  },
} as const;

export const recentParrilladaPlans = [
  { id: 'recent_friday', title: 'Friday Friends BBQ', mode: 'lite' as const, updatedLabel: 'Updated 2d ago' },
  { id: 'recent_family', title: 'Family Sunday Grill', mode: 'pro' as const, updatedLabel: 'Updated 6d ago' },
];

const basePlan: ParrilladaPlan = {
  id: 'parrillada-lite-demo',
  mode: 'lite',
  title: 'Parrillada Lite Demo',
  serveTargetLabel: '7:30 PM',
  complexity: 'medium',
  items: [
    {
      id: 'item_picanha',
      cutId: 'picanha',
      displayName: 'Picanha',
      role: 'main',
      estimatedMinutes: 32,
      zonePreference: ['direct', 'indirect'],
      timingSensitivity: 'high',
      riskFlags: ['flare_up'],
    },
    {
      id: 'item_wings',
      cutId: 'chicken_wing',
      displayName: 'Chicken Wings',
      role: 'secondary',
      estimatedMinutes: 25,
      zonePreference: ['indirect'],
      canHoldWarm: true,
      maxHoldMinutes: 12,
      timingSensitivity: 'medium',
    },
    {
      id: 'item_asparagus',
      cutId: 'asparagus',
      displayName: 'Asparagus',
      role: 'finish_last',
      estimatedMinutes: 8,
      zonePreference: ['direct'],
      timingSensitivity: 'high',
    },
    {
      id: 'item_sausages',
      cutId: 'chorizo',
      displayName: 'Sausages',
      role: 'hold_warm',
      estimatedMinutes: 20,
      zonePreference: ['indirect'],
      canHoldWarm: true,
      maxHoldMinutes: 20,
      timingSensitivity: 'low',
    },
  ],
  timeline: [
    {
      id: 'step_picanha_start',
      timeLabel: '5:30 PM',
      itemId: 'item_picanha',
      title: 'Picanha - Direct heat',
      subtitle: 'Start first for crust and control',
      zone: 'direct',
      durationMinutes: 12,
    },
    {
      id: 'step_wings_start',
      timeLabel: '5:42 PM',
      itemId: 'item_wings',
      title: 'Chicken Wings - Indirect',
      zone: 'indirect',
      durationMinutes: 25,
    },
    {
      id: 'step_sausages_start',
      timeLabel: '6:07 PM',
      itemId: 'item_sausages',
      title: 'Sausages - Indirect',
      zone: 'indirect',
      durationMinutes: 20,
    },
    {
      id: 'step_asparagus_finish',
      timeLabel: '6:25 PM',
      itemId: 'item_asparagus',
      title: 'Asparagus - Direct finish',
      zone: 'direct',
      durationMinutes: 8,
    },
    {
      id: 'step_serve_target',
      timeLabel: '7:30 PM',
      title: 'Target Serve Time',
      subtitle: 'Plate and serve all items',
      isServeTarget: true,
      zone: 'resting',
    },
  ],
  warnings: [
    {
      id: 'warning_flare',
      severity: 'warning',
      title: 'Flare-up risk',
      description: 'Keep picanha away from direct flame spikes after searing.',
      suggestedAction: 'Move to indirect zone early if flames rise.',
    },
    {
      id: 'warning_window',
      severity: 'watch',
      title: 'Tight finish window',
      description: 'Asparagus and final picanha phase are close together.',
      suggestedAction: 'Prepare tongs and rest tray before 6:20 PM.',
    },
  ],
};

// Preview-only fallback factory. The production Parrillada flow is wired to
// catalog-backed scheduler output in ParrilladaSchedulerScreen.
export function getMockParrilladaPlan(mode: ParrilladaMode): ParrilladaPlan {
  if (mode === 'pro') {
    return {
      ...basePlan,
      id: 'parrillada-pro-demo',
      mode: 'pro',
      title: 'Parrillada Pro Demo',
      complexity: 'high',
      warnings: [
        ...basePlan.warnings,
        {
          id: 'warning_zone_load',
          severity: 'info',
          title: 'Indirect zone load',
          description: 'Two items overlap in the indirect zone for part of the timeline.',
          suggestedAction: 'Use top rack as fallback holding space.',
        },
      ],
    };
  }

  return { ...basePlan };
}
