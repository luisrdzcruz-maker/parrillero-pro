'use client';

import { useMemo, useState } from 'react';
import { ParrilladaEntryScreen } from '@/components/parrillada/ParrilladaEntryScreen';
import { ParrilladaLiveScreen } from '@/components/parrillada/ParrilladaLiveScreen';
import { ParrilladaReviewScreen } from '@/components/parrillada/ParrilladaReviewScreen';
import { ParrilladaSetupScreen } from '@/components/parrillada/ParrilladaSetupScreen';
import {
  parrilladaPlanCopy,
  recentParrilladaPlans,
} from '@/components/parrillada/mock/parrilladaMockData';
import {
  buildCatalogBackedParrilladaLiteItems,
  buildParrilladaLivePlanFromResult,
  getParrilladaModeProfile,
  getParrilladaItemPresentation,
  NAPOLEON_ROGUE_525_LITE,
  scheduleParrillada,
  type GrillZoneType,
  type ParrilladaItem,
  type ParrilladaMode,
  type ParrilladaPlan,
  type ParrilladaWarning,
  type PlannerCutInput,
  type PlannerPhase,
  type PlannerResult,
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

function formatClock(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function mapPlannerZone(zone: PlannerPhase['zone']): GrillZoneType {
  if (zone === 'resting' || zone === 'holding') return 'resting';
  if (zone === 'direct_high' || zone === 'direct_medium') return 'direct';
  return 'indirect';
}

function mapPlannerItemToParrilladaItem(item: PlannerCutInput): ParrilladaItem {
  const presentation = getParrilladaItemPresentation(item);
  return {
    id: item.id,
    cutId: item.cutId,
    displayName: item.displayName,
    category: presentation.categoryLabel,
    role:
      presentation.role === 'fastFinish'
        ? 'finish_last'
        : presentation.role === 'starter'
          ? 'secondary'
          : presentation.role === 'side'
            ? 'side'
            : presentation.role === 'longCook'
              ? 'hold_warm'
              : 'main',
    estimatedMinutes: item.planningMetadata?.activeCookMinutes ?? 20,
    canHoldWarm: item.planningMetadata?.canHoldWarm,
    maxHoldMinutes: item.planningMetadata?.maxHoldMinutes,
    timingSensitivity: item.planningMetadata?.timingSensitivity,
    riskFlags: item.planningMetadata?.riskTags,
  };
}

function plannerResultToParrilladaPlan(result: PlannerResult, mode: ParrilladaMode): ParrilladaPlan {
  const timeline = result.executionTimelineGroups.length > 0
    ? result.executionTimelineGroups.map((group) => {
        const groupZone: GrillZoneType =
          group.zone === 'mixed'
            ? 'indirect'
            : group.zone === 'resting' || group.zone === 'holding'
              ? 'resting'
              : group.zone === 'direct_high' || group.zone === 'direct_medium'
                ? 'direct'
                : 'indirect';
        return {
          id: group.id,
          timeLabel: formatClock(group.startIso),
          itemId: group.items[0]?.itemId,
          title: group.title,
          subtitle: group.instruction,
          zone: groupZone,
          durationMinutes: Math.max(1, group.endMinute - group.startMinute),
          isServeTarget: group.groupType === 'serve',
        };
      })
    : result.phases.map((phase) => ({
        id: phase.id,
        timeLabel: formatClock(phase.startIso),
        itemId: phase.itemId !== 'global' ? phase.itemId : undefined,
        title: `${phase.displayName} - ${phase.type}`,
        subtitle: phase.notes?.[0],
        zone: mapPlannerZone(phase.zone),
        durationMinutes: Math.max(1, phase.endMinute - phase.startMinute),
        isServeTarget: phase.type === 'serve',
      }));
  const warnings: ParrilladaWarning[] = result.warnings.map((warning) => ({
    id: warning.id,
    severity: warning.severity,
    title: warning.title,
    description: warning.message,
  }));
  return {
    id: `planner-${result.request.serveAtIso}`,
    mode,
    title: mode === 'pro' ? 'Parrillada Pro' : 'Parrillada Lite',
    items: result.request.items.map(mapPlannerItemToParrilladaItem),
    serveTargetLabel: formatClock(result.request.serveAtIso),
    complexity: result.summary.confidence === 'low' ? 'high' : result.summary.confidence === 'medium' ? 'medium' : 'low',
    warnings,
    timeline,
  };
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
  const setupItems = useMemo(() => selectedItems.map(mapPlannerItemToParrilladaItem), [selectedItems]);
  const reviewPlan = useMemo(
    () => (plannerResult ? plannerResultToParrilladaPlan(plannerResult, mode) : null),
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
    const sourceActions = plannerResult?.executionTimelineGroups.length
      ? plannerResult.executionTimelineGroups.map((group) => group.id)
      : plannerResult?.phases.map((phase) => phase.id) ?? [];
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
            subtitle={`${parrilladaPlanCopy.setup.subtitle} ${modeProfile.mode.toUpperCase()} supports up to ${modeProfile.maxItems} items.`}
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
