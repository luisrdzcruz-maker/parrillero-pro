import { scheduleParrillada } from '../lib/planning';
import { DEMO_PARRILLADA_ITEMS } from '../lib/planning/fixtures/demoItems';
import { NAPOLEON_ROGUE_525_LITE } from '../lib/planning/fixtures/demoGrills';

const serveAtIso = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

const result = scheduleParrillada({
  items: DEMO_PARRILLADA_ITEMS,
  serveAtIso,
  grillCapacity: NAPOLEON_ROGUE_525_LITE,
  strategy: 'balanced',
  allowHolding: true,
  nowIso: new Date().toISOString(),
});

console.log(JSON.stringify(result, null, 2));
