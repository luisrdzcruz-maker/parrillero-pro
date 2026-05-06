import type { GrillCapacity } from '../types';

export const NAPOLEON_ROGUE_525_LITE: GrillCapacity = {
  grillId: 'napoleon-rogue-525-lite',
  label: 'Napoleon Rogue 525 / 2-zone lite model',
  defaultPreheatMinutes: 15,
  maxParallelItems: 4,
  zones: [
    { zone: 'direct_high', slots: 2, label: 'Direct high' },
    { zone: 'direct_medium', slots: 2, label: 'Direct medium' },
    { zone: 'indirect_medium', slots: 2, label: 'Indirect medium' },
    { zone: 'indirect_low', slots: 1, label: 'Indirect low' },
    { zone: 'smoke_low', slots: 1, label: 'Low & slow / smoker box' },
    { zone: 'plancha', slots: 1, label: 'Plancha' },
    { zone: 'resting', slots: 99, label: 'Resting board' },
    { zone: 'holding', slots: 99, label: 'Holding / serving' },
  ],
};
