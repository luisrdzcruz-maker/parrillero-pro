"use client";

import {
  ParrilladaSchedulerScreen,
  type ParrilladaFlowStep,
} from "@/components/parrillada";
import type { AppText, Lang } from "@/lib/i18n/texts";

export type ParrilladaModeScreenProps = {
  lang: Lang;
  t: AppText;
  step: ParrilladaFlowStep;
  onStepChange: (next: ParrilladaFlowStep) => void;
};

export function ParrilladaModeScreen({ lang, t, step, onStepChange }: ParrilladaModeScreenProps) {
  // TODO: Replace demo screen with production parrillada flow once catalog integration is ready.
  return <ParrilladaSchedulerScreen lang={lang} t={t} step={step} onStepChange={onStepChange} />;
}
