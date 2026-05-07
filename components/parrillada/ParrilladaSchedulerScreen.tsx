'use client';

import { useMemo, useState } from 'react';
import { ParrilladaEntryScreen } from '@/components/parrillada/ParrilladaEntryScreen';
import { ParrilladaLiveScreen } from '@/components/parrillada/ParrilladaLiveScreen';
import { ParrilladaReviewScreen } from '@/components/parrillada/ParrilladaReviewScreen';
import { ParrilladaSetupScreen } from '@/components/parrillada/ParrilladaSetupScreen';
import {
  plannerCutInputToParrilladaItem,
  plannerResultToLiveActionIds,
  plannerResultToParrilladaPlanCompatibility,
} from '@/components/parrillada/adapters/parrilladaPlannerViewAdapter';
import {
  parrilladaPlanCopy,
  recentParrilladaPlans,
} from '@/components/parrillada/mock/parrilladaMockData';
import {
  buildCatalogBackedParrilladaLiteItems,
  buildParrilladaLivePlanFromResult,
  getParrilladaModeProfile,
  NAPOLEON_ROGUE_525_LITE,
  scheduleParrillada,
  type ParrilladaMode,
  type PlannerCutInput,
  type SchedulerStrategy,
} from '@/lib/planning';

type ParrilladaFlowStep = 'entry' | 'setup' | 'review' | 'live';
const LITE_MIN_ITEMS = 2;

function toLocalInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function defaultServeAtLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 3, 0, 0, 0);
  return toLocalInputValue(d);
}

function tryLocalDateTimeToIso(value: string): string | null {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const localDate = new Date(
    Number(yearRaw),
    Number(monthRaw) - 1,
    Number(dayRaw),
    Number(hourRaw),
    Number(minuteRaw),
    0,
    0,
  );
  return Number.isNaN(localDate.getTime()) ? null : localDate.toISOString();
}

export function ParrilladaSchedulerScreen() {
  const [step, setStep] = useState<ParrilladaFlowStep>('entry');
  const [mode, setMode] = useState<ParrilladaMode>('lite');
  const [serveAtLocal, setServeAtLocal] = useState(defaultServeAtLocal());
  const [strategy, setStrategy] = useState<SchedulerStrategy>('balanced');
  const [currentLiveActionId, setCurrentLiveActionId] = useState<string | undefined>(undefined);
  const [sessionNowMs] = useState(() => Date.now());

  const catalogSource = useMemo(() => buildCatalogBackedParrilladaLiteItems(), []);
  const modeProfile = getParrilladaModeProfile(mode);
  const availableItems = catalogSource.items;
  const [selectedItems, setSelectedItems] = useState<PlannerCutInput[]>(() =>
    availableItems.slice(0, Math.min(modeProfile.maxItems, 4)),
  );
  const selectedItemIds = useMemo(() => new Set(selectedItems.map((item) => item.id)), [selectedItems]);

  const serveAtIso = useMemo(() => tryLocalDateTimeToIso(serveAtLocal), [serveAtLocal]);
  const hasValidServeTime = Boolean(serveAtIso);
  const canBuildPlan = selectedItems.length >= LITE_MIN_ITEMS && selectedItems.length <= modeProfile.maxItems && Boolean(serveAtIso);
  const plannerResult = useMemo(() => {
    if (!canBuildPlan || !serveAtIso) return null;
    return scheduleParrillada({
      items: selectedItems,
      serveAtIso,
      strategy,
      grillCapacity: NAPOLEON_ROGUE_525_LITE,
      allowHolding: true,
      nowIso: new Date().toISOString(),
      maxPlanLookbackMinutes: 480,
    });
  }, [canBuildPlan, serveAtIso, selectedItems, strategy]);
  const startsInPast = Boolean(
    plannerResult && new Date(plannerResult.summary.planStartIso).getTime() < sessionNowMs,
  );
  const livePlan = useMemo(
    () => (plannerResult ? buildParrilladaLivePlanFromResult(plannerResult, currentLiveActionId) : null),
    [plannerResult, currentLiveActionId],
  );
  const setupItems = useMemo(() => selectedItems.map(plannerCutInputToParrilladaItem), [selectedItems]);
  const reviewPlan = useMemo(
    () => (plannerResult ? plannerResultToParrilladaPlanCompatibility(plannerResult, mode) : null),
    [plannerResult, mode],
  );

  function handleSelectMode(nextMode: ParrilladaMode) {
    setMode(nextMode);
    setCurrentLiveActionId(undefined);
    setStep('setup');
  }

  function toggleCatalogItem(item: PlannerCutInput) {
    setSelectedItems((current) => {
      if (current.some((entry) => entry.id === item.id)) {
        return current.filter((entry) => entry.id !== item.id);
      }
      if (current.length >= modeProfile.maxItems) return current;
      return [...current, item];
    });
  }

  function applyEarliestServeTime() {
    if (!plannerResult) return;
    const planStartMs = new Date(plannerResult.summary.planStartIso).getTime();
    const currentServeMs = new Date(plannerResult.request.serveAtIso).getTime();
    const latenessMinutes = Math.max(0, Math.ceil((Date.now() - planStartMs) / 60000));
    const shiftedServeMs = currentServeMs + (latenessMinutes + 10) * 60000;
    setServeAtLocal(toLocalInputValue(new Date(shiftedServeMs)));
  }

  function handleMarkDone() {
    if (!livePlan) return;
    const sourceActions = plannerResult ? plannerResultToLiveActionIds(plannerResult) : [];
    const currentIndex = sourceActions.findIndex((actionId) => actionId === livePlan.currentAction.id);
    const nextStep = sourceActions[currentIndex + 1];
    if (!nextStep) return;
    setCurrentLiveActionId(nextStep);
  }

  return (
    <main className="min-h-screen bg-[#070707] px-3 py-3 text-white sm:px-4 sm:py-4">
      <section className="mx-auto max-w-3xl space-y-3">
        {step === 'entry' && (
          <ParrilladaEntryScreen
            quickTitle={parrilladaPlanCopy.entry.quickTitle}
            quickDescription={parrilladaPlanCopy.entry.quickDescription}
            proTitle={parrilladaPlanCopy.entry.proTitle}
            proDescription={parrilladaPlanCopy.entry.proDescription}
            recentTitle={parrilladaPlanCopy.entry.recentTitle}
            recentPlans={recentParrilladaPlans}
            onSelectMode={handleSelectMode}
          />
        )}

        {step === 'setup' && (
          <ParrilladaSetupScreen
            mode={mode}
            selectedItems={setupItems}
            availableItems={availableItems}
            selectedItemIds={selectedItemIds}
            liteMinItems={LITE_MIN_ITEMS}
            liteMaxItems={modeProfile.maxItems}
            serveAtLocal={serveAtLocal}
            hasValidServeTime={hasValidServeTime}
            strategy={strategy}
            title={parrilladaPlanCopy.setup.title}
            subtitle={`${modeProfile.mode.toUpperCase()} mode`}
            ctaLabel={parrilladaPlanCopy.setup.cta}
            onServeAtLocalChange={setServeAtLocal}
            onStrategyChange={setStrategy}
            onToggleCatalogItem={toggleCatalogItem}
            onSetEarliestServeTime={startsInPast ? applyEarliestServeTime : undefined}
            startsInPast={startsInPast}
            canGenerate={Boolean(plannerResult)}
            onBack={() => setStep('entry')}
            onGenerate={() => {
              if (plannerResult) setStep('review');
            }}
          />
        )}

        {step === 'review' && reviewPlan && plannerResult && (
          <ParrilladaReviewScreen
            plan={reviewPlan}
            plannerResult={plannerResult}
            ctaLabel={parrilladaPlanCopy.review.cta}
            onBack={() => setStep('setup')}
            onStartLive={() => setStep('live')}
          />
        )}

        {step === 'live' && livePlan && (
          <ParrilladaLiveScreen
            title={parrilladaPlanCopy.live.title}
            markDoneLabel={parrilladaPlanCopy.live.markDone}
            adjustPlanLabel={parrilladaPlanCopy.live.adjustPlaceholder}
            livePlan={livePlan}
            onMarkDone={handleMarkDone}
          />
        )}
      </section>
    </main>
  );
}
