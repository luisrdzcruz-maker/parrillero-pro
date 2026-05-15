/**
 * Parrillero Pro — Multi-Cut Scheduler Types
 *
 * Goal:
 * Create a deterministic, data-driven planning layer for parrilladas.
 * Keep UI, catalog data, and scheduling logic decoupled.
 */

import type { Lang } from "@/lib/i18n/texts";

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
export type PlanningMetadataSource = 'single-cut-engine' | 'fallback';
export type PlanningMetadataConfidence = 'high' | 'medium' | 'low';
export type PlanningZoneDemand = 'low' | 'medium' | 'high';
export type PlanningMetadataTimingSensitivity = 'low' | 'medium' | 'high';
export type ParrilladaMenuLineUnit = 'pieces' | 'kg' | 'servings' | 'tray';
export type ParrilladaHoldBehavior = 'can_hold_indirect' | 'short_hold_only' | 'serve_immediately' | 'do_not_hold';
export type ParrilladaFinishPriority = 'early' | 'middle' | 'finish_last';
export type ParrilladaHeatFragility = 'low' | 'medium' | 'high';
export type ParrilladaFoodSafetyGroup =
  | 'raw_beef'
  | 'raw_pork'
  | 'raw_poultry'
  | 'raw_fish'
  | 'vegetable'
  | 'ready_to_eat';
export type ExecutionTimelineGroupType =
  | 'setup'
  | 'start_holdable_items'
  | 'move_to_indirect'
  | 'clean_or_burn_off_zone'
  | 'finish_sensitive_items'
  | 'serve'
  | 'other';

export interface PlanningMetadata {
  version: 1;
  source: PlanningMetadataSource;
  confidence: PlanningMetadataConfidence;
  setupMinutes: number;
  activeCookMinutes: number;
  restMinutes: number;
  totalSessionMinutes: number;
  requiredZones: PlanningZone[];
  preferredZones: PlanningZone[];
  zoneDemand: PlanningZoneDemand;
  timingSensitivity: PlanningMetadataTimingSensitivity;
  canHoldWarm: boolean;
  maxHoldMinutes: number;
  serveWindowMinutes: number;
  riskTags: string[];
  notes?: string[];
}

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
  unit?: ParrilladaMenuLineUnit;
  physicalPortionCount?: number;
  servings?: number;
  doneness?: DonenessLevel;
  weightGrams?: number;
  thicknessCm?: number;
  preferredServeOffsetMinutes?: number;
  fixedStartTime?: string;
  fixedZone?: PlanningZone;
  profileId?: string;
  planningMetadata?: PlanningMetadata;
  priority?: number;
  notes?: string[];
}

export interface ParrilladaMenuLine {
  id: string;
  item: PlannerCutInput;
  quantity: number;
  unit: ParrilladaMenuLineUnit;
  physicalPortionCount?: number;
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
  menuLines?: ParrilladaMenuLine[];
  serveAtIso: string;
  grillCapacity: GrillCapacity;
  strategy?: SchedulerStrategy;
  language?: Lang;
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

export interface ParrilladaItemBehavior {
  holdBehavior: ParrilladaHoldBehavior;
  finishPriority: ParrilladaFinishPriority;
  heatFragility: ParrilladaHeatFragility;
  foodSafetyGroup: ParrilladaFoodSafetyGroup;
}

export interface ExecutionTimelineGroupItem {
  itemId: string;
  cutId: string;
  displayName: string;
  quantity: number;
  unit: ParrilladaMenuLineUnit;
  physicalPortionCount?: number;
  behavior: ParrilladaItemBehavior;
}

export interface ExecutionTimelineGroup {
  id: string;
  startMinute: number;
  endMinute: number;
  startIso: string;
  endIso: string;
  title: string;
  groupType: ExecutionTimelineGroupType;
  items: ExecutionTimelineGroupItem[];
  zone: PlanningZone | 'mixed';
  heat: 'low' | 'medium' | 'high' | 'mixed';
  instruction: string;
  safetyNotes: string[];
  details?: string[];
  phaseIds: string[];
}

export interface PlannerResult {
  ok: boolean;
  request: PlannerRequest;
  items: NormalizedPlannerItem[];
  phases: PlannerPhase[];
  executionTimelineGroups: ExecutionTimelineGroup[];
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

export type ParrilladaMode = 'lite' | 'pro';

export type ParrilladaItemRole = 'main' | 'secondary' | 'side' | 'finish_last' | 'hold_warm';

export type GrillZoneType = 'direct' | 'indirect' | 'resting' | 'holding';

export type ParrilladaWarningSeverity = 'info' | 'watch' | 'warning' | 'critical';

export interface ParrilladaItem {
  id: string;
  cutId?: string;
  displayName: string;
  category?: string;
  role: ParrilladaItemRole;
  estimatedMinutes: number;
  zonePreference?: GrillZoneType[];
  canHoldWarm?: boolean;
  maxHoldMinutes?: number;
  timingSensitivity?: 'low' | 'medium' | 'high';
  riskFlags?: string[];
}

export interface ParrilladaTimelineStep {
  id: string;
  timeLabel: string;
  itemId?: string;
  title: string;
  subtitle?: string;
  zone?: GrillZoneType;
  durationMinutes?: number;
  isServeTarget?: boolean;
}

export interface ParrilladaWarning {
  id: string;
  severity: ParrilladaWarningSeverity;
  title: string;
  description: string;
  suggestedAction?: string;
}

export interface ParrilladaPlan {
  id: string;
  mode: ParrilladaMode;
  title: string;
  items: ParrilladaItem[];
  serveTargetLabel: string;
  complexity: 'low' | 'medium' | 'high';
  warnings: ParrilladaWarning[];
  timeline: ParrilladaTimelineStep[];
}

export interface ParrilladaLiveAction {
  id: string;
  statusLabel: string;
  instruction: string;
  zone?: GrillZoneType;
  durationLabel?: string;
  actionType?: 'move' | 'flip' | 'rest' | 'serve' | 'check';
}

export interface ParrilladaLivePlan {
  planId: string;
  currentAction: ParrilladaLiveAction;
  upNextAction?: ParrilladaLiveAction;
  zoneStatus: Array<{
    zone: GrillZoneType;
    activeCount: number;
    label: string;
  }>;
  activeItems: Array<{
    itemId: string;
    displayName: string;
    cutId?: string;
    phase: string;
    timeRemainingLabel: string;
  }>;
}
