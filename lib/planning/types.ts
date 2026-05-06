/**
 * Parrillero Pro — Multi-Cut Scheduler Types
 *
 * Goal:
 * Create a deterministic, data-driven planning layer for parrilladas.
 * Keep UI, catalog data, and scheduling logic decoupled.
 */

export type PlanningAnimal =
  | 'beef'
  | 'pork'
  | 'chicken'
  | 'lamb'
  | 'fish'
  | 'seafood'
  | 'vegetable'
  | 'other';

export type PlanningRole =
  | 'main'
  | 'secondary'
  | 'starter'
  | 'side'
  | 'finish'
  | 'rest_only';

export type PlanningZone =
  | 'direct_high'
  | 'direct_medium'
  | 'indirect_medium'
  | 'indirect_low'
  | 'smoke_low'
  | 'plancha'
  | 'resting'
  | 'holding';

export type ZoneGroup = 'direct' | 'indirect' | 'low_slow' | 'plancha' | 'resting' | 'holding';

export type TimingSensitivity = 'low' | 'medium' | 'high' | 'critical';
export type HoldQuality = 'excellent' | 'good' | 'limited' | 'poor' | 'unsafe';
export type DonenessLevel = 'rare' | 'medium_rare' | 'medium' | 'medium_well' | 'well_done' | 'safe' | 'custom';
export type PlannerSeverity = 'info' | 'warning' | 'critical';
export type PlannerPhaseType = 'prep' | 'preheat' | 'cook' | 'sear' | 'flip' | 'rest' | 'hold' | 'serve' | 'check' | 'buffer';
export type SchedulerStrategy = 'balanced' | 'serve_together' | 'quality_first' | 'low_stress';

export interface ZoneCapacity {
  zone: PlanningZone;
  slots: number;
  label?: string;
}

export interface GrillCapacity {
  grillId?: string;
  label?: string;
  zones: ZoneCapacity[];
  defaultPreheatMinutes?: number;
  maxParallelItems?: number;
}

export interface PlanningProfile {
  id: string;
  label: string;
  animal: PlanningAnimal;
  role: PlanningRole;
  preferredZones: PlanningZone[];
  fallbackZones?: PlanningZone[];
  requiredZones?: PlanningZone[];
  zoneDemand: number;
  timingSensitivity: TimingSensitivity;
  holdQuality: HoldQuality;
  canHoldWarm: boolean;
  maxHoldMinutes: number;
  preferredServeWindowMinutes: number;
  minRestMinutes: number;
  defaultRestMinutes: number;
  maxRestMinutes: number;
  defaultCookMinutes: number;
  minCookMinutes: number;
  maxCookMinutes: number;
  setupMinutes?: number;
  flipCadenceMinutes?: number;
  safetyCritical?: boolean;
  canBeSplitIntoPhases?: boolean;
  conflictWeight: number;
  notes?: string[];
  warnings?: string[];
}

export interface PlannerCutInput {
  id: string;
  cutId: string;
  displayName: string;
  animal: PlanningAnimal;
  quantity?: number;
  servings?: number;
  doneness?: DonenessLevel;
  weightGrams?: number;
  thicknessCm?: number;
  preferredServeOffsetMinutes?: number;
  fixedStartTime?: string;
  fixedZone?: PlanningZone;
  profileId?: string;
  priority?: number;
  notes?: string[];
}

export interface NormalizedPlannerItem extends PlannerCutInput {
  profile: PlanningProfile;
  estimatedCookMinutes: number;
  restMinutes: number;
  setupMinutes: number;
  latestServeMinute: number;
  earliestServeMinute: number;
}

export interface PlannerRequest {
  items: PlannerCutInput[];
  serveAtIso: string;
  grillCapacity: GrillCapacity;
  strategy?: SchedulerStrategy;
  language?: 'es' | 'en' | 'fi';
  allowHolding?: boolean;
  maxPlanLookbackMinutes?: number;
  preheatMinutes?: number;
  nowIso?: string;
}

export interface PlannerPhase {
  id: string;
  itemId: string;
  cutId: string;
  displayName: string;
  type: PlannerPhaseType;
  zone: PlanningZone;
  startMinute: number;
  endMinute: number;
  startIso: string;
  endIso: string;
  durationMinutes: number;
  isFlexible: boolean;
  notes?: string[];
}

export interface PlannerWarning {
  id: string;
  severity: PlannerSeverity;
  title: string;
  message: string;
  itemIds?: string[];
  phaseIds?: string[];
  code:
    | 'TOO_MANY_ITEMS'
    | 'ZONE_CONFLICT'
    | 'HOLD_TOO_LONG'
    | 'SERVE_WINDOW_RISK'
    | 'SAFETY_RISK'
    | 'MISSING_PROFILE'
    | 'STARTS_IN_PAST'
    | 'UNSUPPORTED_ZONE'
    | 'QUALITY_RISK'
    | 'PLAN_TOO_LONG'
    | 'UNKNOWN';
}

export interface ZoneConflict {
  zone: PlanningZone;
  minute: number;
  demand: number;
  capacity: number;
  phaseIds: string[];
}

export interface PlannerResult {
  ok: boolean;
  request: PlannerRequest;
  items: NormalizedPlannerItem[];
  phases: PlannerPhase[];
  warnings: PlannerWarning[];
  conflicts: ZoneConflict[];
  summary: {
    totalItems: number;
    planStartIso: string;
    planEndIso: string;
    totalDurationMinutes: number;
    peakParallelDemand: number;
    strategy: SchedulerStrategy;
    confidence: 'low' | 'medium' | 'high';
  };
}

export interface MinuteReservation {
  minute: number;
  zone: PlanningZone;
  phaseId: string;
  demand: number;
}
