"use client";

import {
  ParrilladaSchedulerScreen,
  type ParrilladaFlowStep,
} from "@/components/parrillada";

export type PlanModeScreenProps = {
  step: ParrilladaFlowStep;
  onStepChange: (next: ParrilladaFlowStep) => void;
};

export function PlanModeScreen({ step, onStepChange }: PlanModeScreenProps) {
  // TODO: Replace demo screen with production parrillada flow once catalog integration is ready.
  return <ParrilladaSchedulerScreen step={step} onStepChange={onStepChange} />;
}
