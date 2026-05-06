import type { PlannerCutInput, PlanningAnimal } from '../types';

/**
 * Adapter boundary for the existing Parrillero Pro cooking catalog.
 *
 * Keep this file small and repo-specific. The scheduler should not import UI components
 * or the full catalog directly. Cursor should wire this to GeneratedCutProfile/getCutById
 * inside the repo.
 */
export interface CatalogCutLike {
  id: string;
  name?: string;
  nombre?: string;
  nombre_en?: string;
  nombre_es?: string;
  animal?: string;
  category?: string;
}

function normalizeAnimal(value?: string): PlanningAnimal {
  const normalized = (value ?? '').toLowerCase();
  if (['beef', 'vacuno', 'cow', 'bovine'].includes(normalized)) return 'beef';
  if (['pork', 'cerdo'].includes(normalized)) return 'pork';
  if (['chicken', 'pollo'].includes(normalized)) return 'chicken';
  if (['fish', 'pescado'].includes(normalized)) return 'fish';
  if (['vegetable', 'verdura', 'vegetables'].includes(normalized)) return 'vegetable';
  return 'other';
}

export function catalogCutToPlannerInput(cut: CatalogCutLike, overrides: Partial<PlannerCutInput> = {}): PlannerCutInput {
  return {
    id: overrides.id ?? cut.id,
    cutId: cut.id,
    displayName: overrides.displayName ?? cut.name ?? cut.nombre_en ?? cut.nombre_es ?? cut.nombre ?? cut.id,
    animal: overrides.animal ?? normalizeAnimal(cut.animal ?? cut.category),
    ...overrides,
  };
}
