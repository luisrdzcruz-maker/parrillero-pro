"use client";

import type { LiveStep } from "@/components/live/LiveCookingScreen";
import type { Mode } from "@/components/navigation/AppHeader";
import { getCutById, getDonenessOptions, shouldShowThickness } from "@/lib/cookingRules";
import { getAnimalSurfaceLabel } from "@/lib/i18n/surfaceFallbacks";
import type { Lang } from "@/lib/i18n/texts";
import {
  buildLiveStepsFromPayload,
  buildLiveStepsSignature,
  hasDistinctLiveSteps,
  LIVE_COOKING_STORAGE_KEY,
  readLiveCookingPayload,
  type LiveCookingPlanPayload,
} from "@/lib/liveCookingPlan";
import {
  parseCookingAnimal,
  parsePositiveNumberParam,
} from "@/lib/navigation/appNavState";
import { parseLiveParams } from "@/lib/navigation/parseLiveParams";
import { animalIdsByLabel, type AnimalLabel } from "@/lib/media/animalMedia";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseLiveCookingSessionParams = {
  mode: Mode;
  lang: Lang;
  searchParamsKey: string;
  mockSteps: LiveStep[];
};

type LiveUrlState = {
  animal: AnimalLabel;
  cutId: string | null;
  doneness: string;
  thickness: string;
  donenessFromUrl: string | undefined;
  thicknessFromUrl: string | undefined;
  context: string;
  lang: Lang;
};

type UseLiveCookingSessionResult = {
  liveClientReady: boolean;
  liveSteps: LiveStep[];
  liveContext: string | undefined;
  liveCurrentIndex: number;
  liveRemaining: number;
  livePaused: boolean;
  activeStep: LiveStep | undefined;
  liveIsLast: boolean;
  liveHasTimer: boolean;
  liveCookComplete: boolean;
  hasValidPlan: boolean;
  isUsingFallbackPlan: boolean;
  isStarted: boolean;
  isCompleted: boolean;
  startCooking: () => void;
  togglePause: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  jumpToStep: (index: number) => void;
  resetSession: () => void;
};

function normalizeLiveContextToken(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isMatchingThickness(liveThickness: string, payloadThickness: string) {
  const liveNumber = Number(liveThickness.replace(",", "."));
  const payloadNumber = Number(payloadThickness.replace(",", "."));
  if (Number.isFinite(liveNumber) && Number.isFinite(payloadNumber)) {
    return Math.abs(liveNumber - payloadNumber) < 0.001;
  }
  return normalizeLiveContextToken(liveThickness) === normalizeLiveContextToken(payloadThickness);
}

function getCutNameFromMeta(cutId: string, lang: Lang) {
  const cut = getCutById(cutId);
  if (!cut) return cutId;
  return cut.names[lang] ?? cut.names.es;
}

function parseLiveUrlState(lang: Lang): LiveUrlState {
  if (typeof window === "undefined") {
    const defaultAnimal = "Vacuno" as AnimalLabel;
    return {
      animal: defaultAnimal,
      cutId: null,
      doneness: getDonenessOptions(animalIdsByLabel[defaultAnimal])[0]?.id ?? "",
      thickness: "2",
      donenessFromUrl: undefined,
      thicknessFromUrl: undefined,
      context: getAnimalSurfaceLabel(defaultAnimal, lang),
      lang,
    };
  }

  const {
    animal,
    cutId: rawCutId,
    doneness: rawDoneness,
    thickness: rawThickness,
    lang: rawLang,
  } = parseLiveParams(window.location.search);
  const liveAnimal = parseCookingAnimal(animal ?? null) ?? "Vacuno";
  const cutId = rawCutId && getCutById(rawCutId) ? rawCutId : null;
  const donenessParam = rawDoneness?.trim();
  const donenessFromUrl =
    donenessParam && getDonenessOptions(animalIdsByLabel[liveAnimal]).some((option) => option.id === donenessParam)
      ? donenessParam
      : undefined;
  const doneness = donenessFromUrl ?? getDonenessOptions(animalIdsByLabel[liveAnimal])[0]?.id ?? "";
  const thicknessFromUrl = parsePositiveNumberParam(rawThickness != null ? String(rawThickness) : null);
  const thickness = thicknessFromUrl ?? "2";
  const localizedAnimal = getAnimalSurfaceLabel(liveAnimal, lang);
  const context = cutId ? `${localizedAnimal} · ${getCutNameFromMeta(cutId, lang)}` : localizedAnimal;
  const resolvedLang = rawLang === "es" || rawLang === "en" || rawLang === "fi" ? rawLang : lang;

  return {
    animal: liveAnimal,
    cutId,
    doneness,
    thickness,
    donenessFromUrl,
    thicknessFromUrl,
    context,
    lang: resolvedLang,
  };
}

function doesPayloadMatchLiveUrlContext(payload: LiveCookingPlanPayload | null, liveFromUrl: LiveUrlState) {
  if (!payload) return false;
  if (!liveFromUrl.cutId) return false;

  const sameAnimal =
    normalizeLiveContextToken(payload.input.animal) === normalizeLiveContextToken(liveFromUrl.animal);
  const sameCut = normalizeLiveContextToken(payload.input.cut) === normalizeLiveContextToken(liveFromUrl.cutId);
  const payloadDoneness = normalizeLiveContextToken(payload.input.doneness);
  const sameDoneness =
    payloadDoneness.length === 0 ||
    normalizeLiveContextToken(liveFromUrl.donenessFromUrl) === payloadDoneness;
  const sameLang = payload.input.lang === liveFromUrl.lang;
  const payloadRequiresThickness = shouldShowThickness(payload.input.cut);
  const payloadThickness = normalizeLiveContextToken(payload.input.thickness);
  const sameThickness =
    !payloadRequiresThickness ||
    payloadThickness.length === 0 ||
    (liveFromUrl.thicknessFromUrl
      ? isMatchingThickness(liveFromUrl.thicknessFromUrl, payload.input.thickness)
      : false);

  return sameAnimal && sameCut && sameDoneness && sameThickness && sameLang;
}

export function useLiveCookingSession({
  mode,
  lang,
  searchParamsKey,
  mockSteps,
}: UseLiveCookingSessionParams): UseLiveCookingSessionResult {
  const [liveClientReady, setLiveClientReady] = useState(false);
  const [liveSteps, setLiveSteps] = useState<LiveStep[]>(mockSteps);
  const [liveContext, setLiveContext] = useState<string | undefined>(undefined);
  const [liveCurrentIndex, setLiveCurrentIndex] = useState(0);
  const [liveRemaining, setLiveRemaining] = useState(0);
  const [livePaused, setLivePaused] = useState(true);
  const [hasValidPlan, setHasValidPlan] = useState(false);
  const [isUsingFallbackPlan, setIsUsingFallbackPlan] = useState(true);
  const liveAdvanceRef = useRef(false);

  const activeStep = liveSteps[liveCurrentIndex] ?? liveSteps[0];
  const liveIsLast = liveCurrentIndex === liveSteps.length - 1;
  const liveHasTimer = activeStep ? activeStep.duration > 0 : false;
  const liveCookComplete = mode === "cocina" && liveClientReady && liveIsLast && liveRemaining === 0;
  const isStarted = liveClientReady && !livePaused;
  const isCompleted = liveCookComplete;

  useEffect(() => {
    if (mode !== "cocina") {
      const frame = window.requestAnimationFrame(() => {
        setLiveClientReady(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const frame = window.requestAnimationFrame(() => {
      const liveFromUrl = parseLiveUrlState(lang);
      const payload = readLiveCookingPayload();
      const payloadMatchesUrl = doesPayloadMatchLiveUrlContext(payload, liveFromUrl);
      const safePayload = payloadMatchesUrl ? payload : null;
      if (payload && !payloadMatchesUrl) {
        window.sessionStorage.removeItem(LIVE_COOKING_STORAGE_KEY);
      }
      const built = buildLiveStepsFromPayload(safePayload, [], lang);

      if (!built.usedFallback && !hasDistinctLiveSteps(built.steps, mockSteps)) {
        console.warn("[live-cooking] Live steps match mock signature unexpectedly", {
          payloadSignature: safePayload?.signature ?? "",
          liveSignature: built.signature,
          mockSignature: buildLiveStepsSignature(mockSteps),
        });
      }

      setLiveSteps(built.steps);
      setLiveContext(safePayload ? built.context ?? liveFromUrl.context : liveFromUrl.cutId ? liveFromUrl.context : undefined);
      setLiveCurrentIndex(0);
      setLiveRemaining(built.steps[0]?.duration ?? 0);
      setLivePaused(true);
      setHasValidPlan(!built.usedFallback && built.steps.length > 0);
      setIsUsingFallbackPlan(built.usedFallback);
      setLiveClientReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mode, lang, searchParamsKey, mockSteps]);

  useEffect(() => {
    if (mode !== "cocina" || !liveClientReady || livePaused || !liveHasTimer) return;
    const id = window.setInterval(() => {
      setLiveRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, liveClientReady, livePaused, liveHasTimer]);

  useEffect(() => {
    if (
      mode !== "cocina" ||
      !liveClientReady ||
      liveRemaining > 0 ||
      !liveHasTimer ||
      liveIsLast ||
      liveAdvanceRef.current
    ) {
      return;
    }

    liveAdvanceRef.current = true;
    const id = window.setTimeout(() => {
      const next = liveCurrentIndex + 1;
      setLiveCurrentIndex(next);
      setLiveRemaining((liveSteps[next] ?? liveSteps[liveSteps.length - 1]).duration);
      setLivePaused(false);
      liveAdvanceRef.current = false;
    }, 1200);

    return () => {
      window.clearTimeout(id);
      liveAdvanceRef.current = false;
    };
  }, [mode, liveClientReady, liveRemaining, liveHasTimer, liveIsLast, liveCurrentIndex, liveSteps]);

  const startCooking = useCallback(() => {
    setLivePaused(false);
  }, []);

  const togglePause = useCallback(() => {
    setLivePaused((value) => !value);
  }, []);

  const goToNextStep = useCallback(() => {
    if (liveSteps.length === 0) return;
    if (liveIsLast) {
      setLiveRemaining(0);
      return;
    }

    const next = liveCurrentIndex + 1;
    setLiveCurrentIndex(next);
    setLiveRemaining((liveSteps[next] ?? liveSteps[liveSteps.length - 1]).duration);
    setLivePaused(false);
  }, [liveCurrentIndex, liveIsLast, liveSteps]);

  const goToPreviousStep = useCallback(() => {
    if (liveSteps.length === 0) return;
    const previous = Math.max(0, liveCurrentIndex - 1);
    setLiveCurrentIndex(previous);
    setLiveRemaining(liveSteps[previous]?.duration ?? 0);
    setLivePaused(false);
  }, [liveCurrentIndex, liveSteps]);

  const jumpToStep = useCallback((index: number) => {
    if (liveSteps.length === 0) return;
    const nextIndex = Math.max(0, Math.min(liveSteps.length - 1, index));
    setLiveCurrentIndex(nextIndex);
    setLiveRemaining(liveSteps[nextIndex]?.duration ?? 0);
    setLivePaused(false);
  }, [liveSteps]);

  const resetSession = useCallback(() => {
    setLiveCurrentIndex(0);
    setLiveRemaining(liveSteps[0]?.duration ?? 0);
    setLivePaused(true);
  }, [liveSteps]);

  return useMemo(
    () => ({
      liveClientReady,
      liveSteps,
      liveContext,
      liveCurrentIndex,
      liveRemaining,
      livePaused,
      activeStep,
      liveIsLast,
      liveHasTimer,
      liveCookComplete,
      hasValidPlan,
      isUsingFallbackPlan,
      isStarted,
      isCompleted,
      startCooking,
      togglePause,
      goToNextStep,
      goToPreviousStep,
      jumpToStep,
      resetSession,
    }),
    [
      liveClientReady,
      liveSteps,
      liveContext,
      liveCurrentIndex,
      liveRemaining,
      livePaused,
      activeStep,
      liveIsLast,
      liveHasTimer,
      liveCookComplete,
      hasValidPlan,
      isUsingFallbackPlan,
      isStarted,
      isCompleted,
      startCooking,
      togglePause,
      goToNextStep,
      goToPreviousStep,
      jumpToStep,
      resetSession,
    ],
  );
}
