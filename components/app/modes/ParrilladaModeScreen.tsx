"use client";

import {
  ParrilladaSchedulerScreen,
  type ParrilladaFlowStep,
} from "@/components/parrillada";

export type ParrilladaModeScreenProps = {
  step: ParrilladaFlowStep;
  onStepChange: (next: ParrilladaFlowStep) => void;
};

export function ParrilladaModeScreen({ step, onStepChange }: ParrilladaModeScreenProps) {
  // TODO: Replace demo screen with production parrillada flow once catalog integration is ready.
  return <ParrilladaSchedulerScreen step={step} onStepChange={onStepChange} />;
}
