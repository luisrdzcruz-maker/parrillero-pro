import type { PlannerCutInput, PlannerResult, SchedulerStrategy } from '../../lib/planning';

export interface ParrilladaLiteState {
  selectedItems: PlannerCutInput[];
  serveAtLocal: string;
  strategy: SchedulerStrategy;
  result?: PlannerResult;
}
