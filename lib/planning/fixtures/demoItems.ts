import type { PlannerCutInput } from '../types';

export const DEMO_PARRILLADA_ITEMS: PlannerCutInput[] = [
  {
    id: 'picanha-1',
    cutId: 'picanha',
    displayName: 'Picanha',
    animal: 'beef',
    weightGrams: 1100,
    doneness: 'medium_rare',
    priority: 5,
  },
  {
    id: 'secreto-1',
    cutId: 'iberian_secreto',
    displayName: 'Secreto ibérico',
    animal: 'pork',
    weightGrams: 450,
    priority: 4,
  },
  {
    id: 'chicken-wings-1',
    cutId: 'chicken_wing',
    displayName: 'Chicken wings',
    animal: 'chicken',
    weightGrams: 900,
    doneness: 'safe',
    priority: 2,
  },
  {
    id: 'asparagus-1',
    cutId: 'asparagus',
    displayName: 'Asparagus',
    animal: 'vegetable',
    weightGrams: 300,
    priority: 1,
  },
];

function pick(ids: string[]): PlannerCutInput[] {
  return DEMO_PARRILLADA_ITEMS.filter((item) => ids.includes(item.id));
}

export const DEMO_PARRILLADA_SCENARIOS = {
  picanhaAsparagus: pick(['picanha-1', 'asparagus-1']),
  picanhaSecretoAsparagus: pick(['picanha-1', 'secreto-1', 'asparagus-1']),
  wingsSecretoAsparagus: pick(['chicken-wings-1', 'secreto-1', 'asparagus-1']),
  defaultLite4: pick(['picanha-1', 'secreto-1', 'chicken-wings-1', 'asparagus-1']),
} as const;
