"use client";

import {
  type CookingSizePreset,
  type CookingWeightRange,
  type Blocks,
  type CookingWizardStep,
  type VegetableFormat,
} from "@/components/cooking/CookingWizard";
import { getInputProfileForCut } from "@/lib/cooking/inputProfiles";
import { ActiveModeRenderer } from "@/components/app/ActiveModeRenderer";
import { AppShellChrome } from "@/components/app/AppShellChrome";
import { CocinaModeScreen } from "@/components/app/modes/CocinaModeScreen";
import {
  getAnimalPreview,
  getCutDescription,
  getCutItems,
  getCutName,
  getDonenessSelectOptions,
  getInitialDoneness,
  type CutItem,
} from "@/components/app/utils/cookingDomain";
import {
  LANG_STORAGE_KEY,
  parseLangParam,
} from "@/components/app/utils/i18n";
import {
  MOCK_LIVE_STEPS,
  persistSavedCook,
} from "@/components/app/utils/liveSession";
import {
  buildCoccionModeProps,
  buildGuardadosModeProps,
  buildHomeModeProps,
  buildMenuModeProps,
  buildParrilladaModeProps,
  buildPlanModeProps,
} from "@/components/app/utils/modeProps";
import { type Mode } from "@/components/navigation/AppHeader";
import { copySavedMenu } from "@/components/results/CookingResultScreen";
import { useCookAgainController } from "@/components/app/hooks/useCookAgainController";
import { useCookingInputHandlers } from "@/components/app/hooks/useCookingInputHandlers";
import { useMenuSaveController } from "@/components/app/hooks/useMenuSaveController";
import { useNavigationActions } from "@/components/app/hooks/useNavigationActions";
import { useOnboardingGate } from "@/components/app/hooks/useOnboardingGate";
import { usePlanGenerationController } from "@/components/app/hooks/usePlanGenerationController";
import { useProModalController } from "@/components/app/hooks/useProModalController";
import { useSavedMenusController } from "@/components/app/hooks/useSavedMenusController";
import { useSwipeNavigation } from "@/components/app/hooks/useSwipeNavigation";
import {
  OnboardingSlides,
} from "@/components/onboarding/OnboardingSlides";
import { useMenuComposerState } from "@/components/app/hooks/useMenuComposerState";
import {
  getCutById,
  getDonenessOptions,
  shouldShowThickness,
} from "@/lib/cookingRules";
import type { DonenessId } from "@/lib/cookingCatalog";
import { cutImages } from "@/lib/media/cutImages";
import {
  mapSizePresetToThickness,
  mapThicknessToSizePreset,
} from "@/lib/cooking/inputMapping";
import { texts, type Lang } from "@/lib/i18n/texts";
import { readLiveCookingPayload } from "@/lib/liveCookingPlan";
import { buildHomeUrl } from "@/lib/navigation/cookingNavigation";
import {
  buildSearchFromNav,
  isAllowedCookingStep,
  isAllowedMode,
  isCutSelectionFilterContextChangeOnly,
  isSameCookingContext,
  isVegetableContextAnimal,
  parseCookingAnimal,
  parseNavFromSearch,
  parsePositiveNumberParam,
  type CookingNavContext,
  type ParsedNav,
} from "@/lib/navigation/appNavState";
import type { ParrilladaFlowStep } from "@/components/parrillada";
import type { GeneratedAnimalId } from "@/lib/generated/cutProfiles";
import { animalIdsByLabel, type AnimalLabel } from "@/lib/media/animalMedia";
import { useLiveCookingSession } from "@/hooks/useLiveCookingSession";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

function ParrilleroAppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLang = parseLangParam(searchParams.get("lang"));
  const searchParamsKey = searchParams.toString();

  const { showOnboarding, dismissOnboarding } = useOnboardingGate();

  const [lang, setLang] = useState<Lang>(() => {
    if (urlLang) return urlLang;
    if (typeof window !== "undefined") {
      const storedLang = parseLangParam(window.localStorage.getItem(LANG_STORAGE_KEY));
      if (storedLang) return storedLang;
    }
    return "es";
  });
  const t = texts[lang];

  const [mode, setMode] = useState<Mode>("inicio");
  const [cookingStep, setCookingStep] = useState<CookingWizardStep>("animal");
  const [parrilladaStep, setParrilladaStep] = useState<ParrilladaFlowStep>("entry");
  const [planStep, setPlanStep] = useState<ParrilladaFlowStep>("entry");

  const [animal, setAnimal] = useState<AnimalLabel>("Vacuno");
  const [cut, setCut] = useState("");
  const [weight, setWeight] = useState("1");
  const [thickness, setThickness] = useState("5");
  const [advancedThicknessEnabled, setAdvancedThicknessEnabled] = useState(false);
  const [sizePreset, setSizePreset] = useState<CookingSizePreset>("medium");
  const [weightRange, setWeightRange] = useState<CookingWeightRange>("medium");
  const [vegetableFormat, setVegetableFormat] = useState<VegetableFormat>("halved");
  const [doneness, setDoneness] = useState("rare");
  const [equipment, setEquipment] = useState("parrilla gas");

  const [guardadosTab, setGuardadosTab] = useState<"plans" | "cooks">("plans");

  const {
    people,
    setPeople,
    eventType,
    setEventType,
    menuMeats,
    setMenuMeats,
    sides,
    setSides,
    budget,
    setBudget,
    difficulty,
    setDifficulty,
    planMode,
    setPlanMode,
    planProduct,
    setPlanProduct,
    planGenerated,
    setPlanGenerated,
    parrilladaPeople,
    setParrilladaPeople,
    serveTime,
    setServeTime,
    parrilladaProducts,
    setParrilladaProducts,
    parrilladaSides,
    setParrilladaSides,
  } = useMenuComposerState(lang);

  const [blocks, setBlocks] = useState<Blocks>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const {
    savedMenus,
    selectedSavedMenu,
    saveMenuStatus,
    saveMenuMessage,
    shareStatus,
    shareMessage,
    shareMessageMenuId,
    sharingMenuId,
    setSelectedSavedMenu,
    setSaveMenuStatus,
    setSaveMenuMessage,
    updateSavedMenus,
    resetSaveMenuState,
    deleteMenu,
    publishMenu,
    unpublishMenu,
    copyShareLink,
  } = useSavedMenusController();

  const isApplyingPopRef = useRef(false);
  const navInitializedRef = useRef(false);
  const hasCutSelectionPreviewHistoryRef = useRef(false);
  const cookingContextRef = useRef({
    animal,
    cut,
    doneness,
    thickness,
  });
  const navStateRef = useRef({
    mode,
    cookingStep,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, [lang]);

  const baseCuts = useMemo(() => getCutItems(animal, lang), [animal, lang]);
  const selectedCutMeta = useMemo(() => (cut ? getCutById(cut) : undefined), [cut]);
  const selectedCutFallback = useMemo<CutItem | undefined>(() => {
    if (!selectedCutMeta || selectedCutMeta.animalId !== animalIdsByLabel[animal]) return undefined;

    return {
      id: selectedCutMeta.id,
      name: getCutName(selectedCutMeta, lang),
      image: cutImages[selectedCutMeta.id] ?? "/images/vacuno/ribeye-cooked.webp",
      description: getCutDescription(selectedCutMeta, lang),
    };
  }, [animal, lang, selectedCutMeta]);
  const cuts = useMemo(() => {
    if (!selectedCutFallback || baseCuts.some((item) => item.id === selectedCutFallback.id)) {
      return baseCuts;
    }

    return [selectedCutFallback, ...baseCuts];
  }, [baseCuts, selectedCutFallback]);
  const selectedCut = cuts.find((item) => item.id === cut);

  const currentDonenessOptions = getDonenessSelectOptions(animal, lang, cut);
  const showThickness = cut ? shouldShowThickness(cut) : true;
  const isCutSelectionSheetOpen = mode === "coccion" && cookingStep === "cut" && Boolean(cut);
  const liveSession = useLiveCookingSession({
    mode,
    lang,
    searchParamsKey,
    mockSteps: MOCK_LIVE_STEPS,
  });
  const {
    liveClientReady,
    liveSteps,
    liveContext,
    liveCurrentIndex,
    liveRemaining,
    livePaused,
    liveStarted,
    liveCookComplete,
    togglePause,
    goToNextStep,
    jumpToStep,
  } = liveSession;

  const {
    showProModal,
    showCookCompleteProModal,
    openPlanningProModal,
    closeProModal,
    closeCookCompleteProModal,
  } = useProModalController({ liveCookComplete });

  const getAdaptiveDetailDefaults = useCallback((selectedCutId: string | undefined, selectedAnimal: AnimalLabel) => {
    const cutMeta = selectedCutId ? getCutById(selectedCutId) : undefined;
    const inputProfile = cutMeta
      ? getInputProfileForCut({
          cutId: cutMeta.id,
          animalId: cutMeta.animalId,
          style: cutMeta.style,
          inputProfileId: cutMeta.inputProfileId,
        })
      : getInputProfileForCut({
          cutId: selectedCutId ?? "",
          animalId: animalIdsByLabel[selectedAnimal],
          style: "fast",
        });

    return inputProfile.defaults;
  }, []);

  const resetAdaptiveDetailInputs = useCallback((selectedCutId: string | undefined, selectedAnimal: AnimalLabel) => {
    const defaults = getAdaptiveDetailDefaults(selectedCutId, selectedAnimal);

    setAdvancedThicknessEnabled(false);
    setSizePreset(defaults.sizePreset);
    setThickness(mapSizePresetToThickness(defaults.sizePreset));
    setWeightRange(defaults.weightRange);
    setVegetableFormat(defaults.vegetableFormat);
  }, [getAdaptiveDetailDefaults]);

  const applyCookingNavContext = useCallback((cookingContext: CookingNavContext) => {
    const hasContext =
      cookingContext.animal || cookingContext.cut || cookingContext.doneness || cookingContext.thickness;
    if (!hasContext) return;

    const currentContext = cookingContextRef.current;
    const contextChanged = !isSameCookingContext(cookingContext, currentContext);
    const nextAnimal = cookingContext.animal ?? currentContext.animal;
    const cutChanged = Boolean(cookingContext.cut && cookingContext.cut !== currentContext.cut);

    if (cookingContext.animal) setAnimal(cookingContext.animal);
    if (cookingContext.cut) setCut(cookingContext.cut);
    if (cutChanged) {
      resetAdaptiveDetailInputs(cookingContext.cut, nextAnimal);
    }
    if (cookingContext.doneness) {
      setDoneness(cookingContext.doneness);
    } else if (cookingContext.animal) {
      setDoneness(getInitialDoneness(cookingContext.animal));
    }
    if (cookingContext.thickness) {
      setThickness(cookingContext.thickness);
      setSizePreset(mapThicknessToSizePreset(cookingContext.thickness));
    }
    if (contextChanged) {
      setBlocks({});
      setCheckedItems({});
      resetSaveMenuState();
    }
  }, [resetAdaptiveDetailInputs, resetSaveMenuState]);

  const commitNav = useCallback((
    requestedMode: Mode,
    requestedCookingStep: CookingWizardStep,
    requestedMethod: "push" | "replace",
    cookingContext: CookingNavContext = {},
    subStep?: ParrilladaFlowStep,
  ) => {
    const nextMode = isAllowedMode(requestedMode) ? requestedMode : "inicio";
    const requestedStep =
      nextMode === "coccion" && isAllowedCookingStep(requestedCookingStep) ? requestedCookingStep : "animal";
    let nextCookingStep = requestedStep;
    const nextCookingContext = nextMode === "coccion" || nextMode === "cocina" ? cookingContext : {};
    if (nextMode === "coccion" && (requestedStep === "details" || requestedStep === "result")) {
      const hasBaseContext = Boolean(nextCookingContext.animal && nextCookingContext.cut);
      const requiresDoneness = nextCookingContext.animal !== "Verduras";
      const requiresThickness = nextCookingContext.cut ? shouldShowThickness(nextCookingContext.cut) : false;
      const hasFullResultContext = Boolean(
        nextCookingContext.animal &&
          nextCookingContext.cut &&
          (!requiresDoneness || nextCookingContext.doneness) &&
          (!requiresThickness || nextCookingContext.thickness),
      );
      if (!hasBaseContext) {
        nextCookingStep = nextCookingContext.animal ? "cut" : "animal";
      } else if (requestedStep === "result" && !hasFullResultContext) {
        nextCookingStep = "details";
      }
    }
    const nextSubStep: ParrilladaFlowStep | undefined =
      nextMode === "parrillada" || nextMode === "plan"
        ? (subStep ?? "entry")
        : undefined;
    const currentNav =
      typeof window === "undefined"
        ? { mode: "inicio" as Mode, cookingStep: "animal" as CookingWizardStep, cookingContext: {} as CookingNavContext }
        : parseNavFromSearch(window.location.search);
    const currentSubStep =
      currentNav.mode === "parrillada"
        ? currentNav.parrilladaStep
        : currentNav.mode === "plan"
          ? currentNav.planStep
          : undefined;
    const modeChanged = nextMode !== currentNav.mode;
    const stepChanged = nextCookingStep !== currentNav.cookingStep;
    const contextChanged = !isSameCookingContext(nextCookingContext, currentNav.cookingContext);
    const subStepChanged = nextSubStep !== currentSubStep;
    const navChanged = modeChanged || stepChanged || contextChanged || subStepChanged;
    const isCutSelectionContextOnlyChange =
      currentNav.mode === "coccion" &&
      nextMode === "coccion" &&
      currentNav.cookingStep === "cut" &&
      nextCookingStep === "cut" &&
      !modeChanged &&
      !stepChanged &&
      contextChanged;
    const isAnimalOnlyCutSelectionFilterChange =
      isCutSelectionContextOnlyChange &&
      isCutSelectionFilterContextChangeOnly(currentNav.cookingContext, nextCookingContext);
    const isCutSelectionPreviewOpenFromBase =
      isCutSelectionContextOnlyChange &&
      !currentNav.cookingContext.cut &&
      Boolean(nextCookingContext.cut);
    const isCutSelectionPreviewOpenFromHistoryBase =
      isCutSelectionContextOnlyChange &&
      Boolean(nextCookingContext.cut) &&
      !hasCutSelectionPreviewHistoryRef.current;
    const allowCutSelectionPreviewPushWhileApplyingPop =
      isCutSelectionPreviewOpenFromBase || isCutSelectionPreviewOpenFromHistoryBase;
    const shouldPush =
      requestedMethod === "push" &&
      navChanged &&
      (!isApplyingPopRef.current || allowCutSelectionPreviewPushWhileApplyingPop) &&
      (!isCutSelectionContextOnlyChange ||
        isCutSelectionPreviewOpenFromBase ||
        isCutSelectionPreviewOpenFromHistoryBase) &&
      !isAnimalOnlyCutSelectionFilterChange;
    const method: "push" | "replace" = shouldPush ? "push" : "replace";

    setMode(nextMode);
    setCookingStep(nextCookingStep);
    if (nextMode === "parrillada" && nextSubStep) setParrilladaStep(nextSubStep);
    if (nextMode === "plan" && nextSubStep) setPlanStep(nextSubStep);

    if (typeof window === "undefined") return;
    const search = buildSearchFromNav(nextMode, nextCookingStep, nextCookingContext, lang, nextSubStep);
    const url = `${window.location.pathname}${search}${window.location.hash}`;
    const beforeSnapshot = {
      historyLength: window.history.length,
    };
    if (method === "replace") {
      router.replace(url);
    } else {
      router.push(url);
      const targetHref = new URL(url, window.location.origin).href;
      const fallbackHistoryLength = beforeSnapshot.historyLength;
      window.setTimeout(() => {
        const onTargetUrl = window.location.href === targetHref;
        const historyDidNotGrow = window.history.length === fallbackHistoryLength;
        if (onTargetUrl && historyDidNotGrow) {
          window.history.pushState(window.history.state, "", url);
        }
      }, 1200);
    }

    if (nextMode === "coccion" && nextCookingStep === "cut") {
      if (nextCookingContext.cut) {
        hasCutSelectionPreviewHistoryRef.current =
          method === "push" || hasCutSelectionPreviewHistoryRef.current;
      } else {
        hasCutSelectionPreviewHistoryRef.current = false;
      }
    } else {
      hasCutSelectionPreviewHistoryRef.current = false;
    }
  }, [router, lang]);

  function syncCutSelectionPreviewFromNav(nav: ParsedNav) {
    if (nav.mode !== "coccion" || nav.cookingStep !== "cut") return;
    if (nav.cookingContext.cut) {
      setCut(nav.cookingContext.cut);
      hasCutSelectionPreviewHistoryRef.current = true;
      return;
    }
    setCut("");
    hasCutSelectionPreviewHistoryRef.current = false;
  }

  function getCurrentCookingNavContext(): CookingNavContext {
    const includeDoneness = !isVegetableContextAnimal(animal);
    const includeThickness = cut ? shouldShowThickness(cut) : false;
    return {
      animal,
      ...(cut ? { cut } : {}),
      ...(includeDoneness && doneness ? { doneness } : {}),
      ...(includeThickness && thickness ? { thickness } : {}),
    };
  }

  function navigateCookingStep(nextStep: CookingWizardStep, method: "push" | "replace" = "push") {
    const normalizedStep = isAllowedCookingStep(nextStep) ? nextStep : cut ? "details" : "animal";
    commitNav("coccion", normalizedStep, method, getCurrentCookingNavContext());
  }

  function getCurrentCookingNavigationParams() {
    const cutId = cut.trim() || undefined;
    const includeDoneness = !isVegetableContextAnimal(animal);
    const includeThickness = cutId ? shouldShowThickness(cutId) : false;
    return {
      animal,
      cutId,
      doneness: includeDoneness ? doneness.trim() || undefined : undefined,
      thickness: includeThickness ? parsePositiveNumberParam(thickness) : undefined,
    };
  }

  function resolveDonenessForResultNavigation(
    sourceAnimal: AnimalLabel,
    sourceDoneness: string | undefined,
    fallbackDoneness: string | undefined,
  ) {
    if (isVegetableContextAnimal(sourceAnimal)) {
      return { value: "", source: "not_required" as const };
    }
    const validDonenessIds = getDonenessOptions(animalIdsByLabel[sourceAnimal]).map((option) => option.id);
    const normalizedSource = sourceDoneness?.trim();
    if (normalizedSource && validDonenessIds.includes(normalizedSource as DonenessId)) {
      return { value: normalizedSource, source: "state" as const };
    }
    const normalizedFallback = fallbackDoneness?.trim();
    if (normalizedFallback && validDonenessIds.includes(normalizedFallback as DonenessId)) {
      return { value: normalizedFallback, source: "generated_context" as const };
    }
    return { value: getInitialDoneness(sourceAnimal), source: "animal_default" as const };
  }

  function pushCookingResultHistoryWithContext(fallbackContext?: { doneness?: string; thickness?: string }) {
    if (typeof window === "undefined") return;

    const contextParams = getCurrentCookingNavigationParams();
    const sourceAnimal = contextParams.animal;
    const sourceCutId = contextParams.cutId;
    if (!sourceAnimal || !sourceCutId) {
      const homeUrl = buildHomeUrl(lang);
      window.history.replaceState({ mode: "inicio", cookingStep: "animal", cookingContext: {} }, "", homeUrl);
      setMode("inicio");
      setCookingStep("animal");
      return;
    }

    const resolvedDoneness = resolveDonenessForResultNavigation(
      sourceAnimal,
      contextParams.doneness,
      fallbackContext?.doneness,
    );
    const fallbackThickness = fallbackContext?.thickness
      ? parsePositiveNumberParam(fallbackContext.thickness)
      : undefined;
    // The explicit fallback (the EFFECTIVE input fed to the engine) wins over
    // contextParams.thickness (derived from React state). State may not match
    // what the engine actually used — e.g., when inputProfile.showSizePreset
    // is true the engine derives the resolved thickness from `sizePreset`,
    // and the raw `thickness` state can be stale or non-canonical.
    // The Result URL must reflect the input that produced the displayed plan.
    const resolvedThickness = fallbackThickness ?? contextParams.thickness ?? (shouldShowThickness(sourceCutId) ? "2" : undefined);
    const navContext: CookingNavContext = {
      animal: sourceAnimal,
      cut: sourceCutId,
      ...(resolvedDoneness.value ? { doneness: resolvedDoneness.value } : {}),
      ...(resolvedThickness ? { thickness: resolvedThickness } : {}),
    };
    const currentNav = parseNavFromSearch(window.location.search);
    const isResultWithSameContext =
      currentNav.mode === "coccion" &&
      currentNav.cookingStep === "result" &&
      isSameCookingContext(currentNav.cookingContext, navContext);

    if (isResultWithSameContext) {
      setMode("coccion");
      setCookingStep("result");
      return;
    }

    commitNav("coccion", "details", "replace", navContext);
    commitNav("coccion", "result", "push", navContext);
  }

  // ── Browser history + URL nav init ─────────────────────────────────────────
  // Parse mode/step from query params, initialize local nav state, then
  // canonicalize URL with replaceState so the first entry is always normalized.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = parseNavFromSearch(window.location.search);
    const raf = window.requestAnimationFrame(() => {
      applyCookingNavContext(nav.cookingContext);
      const shouldBootstrapCutSelectionBaseEntry =
        nav.mode === "coccion" &&
        nav.cookingStep === "cut" &&
        Boolean(nav.cookingContext.cut);

      if (shouldBootstrapCutSelectionBaseEntry) {
        const baseContext: CookingNavContext = nav.cookingContext.animal
          ? { animal: nav.cookingContext.animal }
          : {};
        const baseSearch = buildSearchFromNav("coccion", "cut", baseContext, lang);
        const detailSearch = buildSearchFromNav(
          "coccion",
          "cut",
          {
            ...baseContext,
            cut: nav.cookingContext.cut,
          },
          lang,
        );
        const baseUrl = `${window.location.pathname}${baseSearch}${window.location.hash}`;
        const detailUrl = `${window.location.pathname}${detailSearch}${window.location.hash}`;

        setMode("coccion");
        setCookingStep("cut");
        window.history.replaceState(window.history.state, "", baseUrl);
        router.push(detailUrl);
        hasCutSelectionPreviewHistoryRef.current = true;
      } else {
        const navSubStep =
          nav.mode === "parrillada"
            ? nav.parrilladaStep
            : nav.mode === "plan"
              ? nav.planStep
              : undefined;
        commitNav(nav.mode, nav.cookingStep, "replace", nav.cookingContext, navSubStep);
      }
      navInitializedRef.current = true;
    });

    return () => window.cancelAnimationFrame(raf);
  }, [applyCookingNavContext, commitNav, lang]);

  // ── Browser history: restore state on popstate (back button / swipe) ───────
  // Registered once. URL query params are the source of truth for mode/step.
  // We still keep history.state shape compatibility, but restoration reads from
  // window.location.search only.
  useEffect(() => {
    function onPopState() {
      const nav = parseNavFromSearch(window.location.search);
      isApplyingPopRef.current = true;
      applyCookingNavContext(nav.cookingContext);
      syncCutSelectionPreviewFromNav(nav);
      setMode(nav.mode);
      setCookingStep(nav.cookingStep);
      if (nav.parrilladaStep) setParrilladaStep(nav.parrilladaStep);
      if (nav.planStep) setPlanStep(nav.planStep);
      if (nav.cookingStep !== "result") setLoading(false);
      if (nav.mode !== "guardados") setSelectedSavedMenu(null);
      window.requestAnimationFrame(() => {
        isApplyingPopRef.current = false;
      });
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyCookingNavContext, setSelectedSavedMenu]);

  useEffect(() => {
    if (isApplyingPopRef.current) return;
    if (typeof window === "undefined") return;
    const nav = parseNavFromSearch(window.location.search);
    const currentNavState = navStateRef.current;
    const currentCookingContext = cookingContextRef.current;
    const shouldCompareCookingContext =
      nav.mode === "coccion" ||
      nav.mode === "cocina" ||
      currentNavState.mode === "coccion" ||
      currentNavState.mode === "cocina";
    const matchesCurrentCookingContext =
      !shouldCompareCookingContext || isSameCookingContext(nav.cookingContext, currentCookingContext);
    if (
      nav.mode === currentNavState.mode &&
      nav.cookingStep === currentNavState.cookingStep &&
      matchesCurrentCookingContext
    ) {
      return;
    }

    isApplyingPopRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      applyCookingNavContext(nav.cookingContext);
      syncCutSelectionPreviewFromNav(nav);
      setMode(nav.mode);
      setCookingStep(nav.cookingStep);
      if (nav.parrilladaStep) setParrilladaStep(nav.parrilladaStep);
      if (nav.planStep) setPlanStep(nav.planStep);
      if (nav.cookingStep !== "result") setLoading(false);
      if (nav.mode !== "guardados") setSelectedSavedMenu(null);
      isApplyingPopRef.current = false;
    });
    return () => {
      window.cancelAnimationFrame(frame);
      isApplyingPopRef.current = false;
    };
  }, [searchParamsKey, applyCookingNavContext, setSelectedSavedMenu]);

  // Result-step fallback hydration: applyCookingNavContext clears `blocks` whenever
  // the cooking context changes (animal/cut/doneness/thickness). After a hard reload
  // mid-Live and a navigation back to Result, that wipes the result blocks even
  // though sessionStorage still holds them. Also covers refresh-on-Result after a
  // single-cut plan is generated (usePlanGenerationController writes the same payload).
  // Re-hydrate from the live payload here, gated on cut + doneness + thickness so we
  // never surface stale plans for the same cut under different params.
  useEffect(() => {
    if (mode !== "coccion" || cookingStep !== "result") return;
    if (Object.keys(blocks).length > 0) return;
    if (typeof window === "undefined") return;

    const payload = readLiveCookingPayload();
    if (!payload?.blocks || Object.keys(payload.blocks).length === 0) return;
    if (cut && payload.input.cut !== cut) return;

    const checkDoneness = !isVegetableContextAnimal(animal);
    if (checkDoneness && doneness && payload.input.doneness !== doneness) return;
    const checkThickness = Boolean(cut && shouldShowThickness(cut));
    if (checkThickness && thickness && payload.input.thickness !== thickness) return;

    // Pulling result blocks from sessionStorage (external store) on a user-driven
    // mode/step transition; not a prop sync, so the rule's anti-pattern does not apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlocks(payload.blocks);
  }, [mode, cookingStep, blocks, cut, doneness, thickness, animal]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const nav = parseNavFromSearch(searchParamsKey ? `?${searchParamsKey}` : "");
    if (nav.mode !== "coccion" && nav.mode !== "cocina") return;
    const urlCutId = nav.cookingContext.cut;
    if (!urlCutId) return;
    if (cut && cut !== urlCutId) {
      console.warn("[navigation-context-mismatch] active cut differs from URL cut", {
        mode: nav.mode,
        urlCutId,
        activeCutId: cut,
      });
    }
  }, [searchParamsKey, cut]);

  useEffect(() => {
    cookingContextRef.current = {
      animal,
      cut,
      doneness,
      thickness,
    };
    navStateRef.current = {
      mode,
      cookingStep,
    };
  }, [animal, cut, doneness, thickness, mode, cookingStep]);

  const { saveCurrentMenu } = useMenuSaveController({
    lang,
    t,
    mode,
    planMode,
    animal,
    cut,
    selectedCut,
    weight,
    thickness,
    doneness,
    equipment,
    parrilladaPeople,
    serveTime,
    parrilladaProducts,
    parrilladaSides,
    people,
    eventType,
    menuMeats,
    sides,
    budget,
    difficulty,
    planProduct,
    blocks,
    savedMenus,
    setSaveMenuStatus,
    setSaveMenuMessage,
    updateSavedMenus,
  });


  const {
    handleAnimalChange,
    handleCutSelectionAnimalChange,
    handleCutChange,
    handleCutSelectionPreviewChange,
    handleCutSelectionStartCooking,
  } = useCookingInputHandlers({
    animal,
    lang,
    mode,
    cookingStep,
    setAnimal,
    setCut,
    setDoneness,
    setThickness,
    setSizePreset,
    setBlocks,
    setCheckedItems,
    resetSaveMenuState,
    resetAdaptiveDetailInputs,
    getAdaptiveDetailDefaults,
    commitNav,
  });

  const {
    callAI,
    generateCookingPlan,
    generateMenuPlan,
    generateParrillada,
    generatePlanExperience,
    editPlanExperience,
    copyCurrentPlan,
    shareCurrentPlan,
  } = usePlanGenerationController({
    animal,
    cut,
    selectedCut,
    weight,
    thickness,
    advancedThicknessEnabled,
    sizePreset,
    weightRange,
    vegetableFormat,
    doneness,
    equipment,
    blocks,
    planMode,
    people,
    eventType,
    menuMeats,
    sides,
    budget,
    difficulty,
    planProduct,
    parrilladaPeople,
    serveTime,
    parrilladaProducts,
    parrilladaSides,
    lang,
    setLoading,
    setBlocks,
    setCheckedItems,
    setPlanGenerated,
    setThickness,
    resetSaveMenuState,
    pushCookingResultHistoryWithContext,
    saveCurrentMenu,
    publishMenu,
  });

  const {
    handleLanguageChange,
    navigateMode,
    handleHomePrimaryCtaClick,
    handleModeChange,
    handleLivePlanNavigation,
  } = useNavigationActions({
    mode,
    cookingStep,
    lang,
    setLang,
    setBlocks,
    setCheckedItems,
    setPlanGenerated,
    resetSaveMenuState,
    setSelectedSavedMenu,
    openPlanningProModal,
    commitNav,
    router,
  });

  const { loadMenu, reviewSavedCook, startSavedCookLive } = useCookAgainController({
    animal,
    equipment,
    doneness,
    weight,
    thickness,
    lang,
    setLang,
    setAnimal,
    setCut,
    setWeight,
    setThickness,
    setSizePreset,
    setDoneness,
    setEquipment,
    setBlocks,
    setCheckedItems,
    setSelectedSavedMenu,
    resetSaveMenuState,
    resetAdaptiveDetailInputs,
    commitNav,
    navigateMode,
    router,
  });

  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation({
    onSwipe: (direction) => {
      if (direction === "back") {
        if (typeof window !== "undefined") {
          window.history.back();
        }
        return;
      }

      if (mode !== "coccion") return;

      if (cookingStep === "animal" && animal) {
        commitNav("coccion", "cut", "push", { animal });
        return;
      }

      if (cookingStep === "cut" && selectedCut) {
        commitNav("coccion", "details", "push", getCurrentCookingNavContext());
      }
    },
  });

  // TODO: remove legacy planning state/actions after scheduler demo fully replaces PlanHub flows.
  void [
    setPlanMode,
    setPlanProduct,
    planGenerated,
    setParrilladaPeople,
    setServeTime,
    setParrilladaProducts,
    setParrilladaSides,
    callAI,
    generateParrillada,
    generatePlanExperience,
    editPlanExperience,
    copyCurrentPlan,
    shareCurrentPlan,
  ];

  // ── Onboarding gate ─────────────────────────────────────────────────────────
  // Render a dark placeholder while localStorage hasn't been checked yet.
  // Body background matches so there is zero visible flash.
  if (showOnboarding === null) {
    return <div className="fixed inset-0 bg-[#020617]" aria-hidden />;
  }

  if (showOnboarding) {
    return (
      <OnboardingSlides
        onDone={dismissOnboarding}
      />
    );
  }

  if (mode === "cocina") {
    return (
      <CocinaModeScreen
        lang={lang}
        liveClientReady={liveClientReady}
        liveSteps={liveSteps}
        liveCurrentIndex={liveCurrentIndex}
        liveRemaining={liveRemaining}
        livePaused={livePaused}
        liveStarted={liveStarted}
        liveContext={liveContext}
        showCookCompleteProModal={showCookCompleteProModal}
        onCloseCookCompleteProModal={closeCookCompleteProModal}
        onBack={handleLivePlanNavigation}
        onPause={togglePause}
        onCompleteStep={goToNextStep}
        onGoToStep={jumpToStep}
        onSaveCook={() => persistSavedCook(liveSteps, liveContext)}
      />
    );
  }

  const isCutSelectionShell = mode === "coccion" && cookingStep === "cut";
  const animalParamPreselected = Boolean(parseCookingAnimal(searchParams.get("animal")));

  return (
    <AppShellChrome
      lang={lang}
      mode={mode}
      t={t}
      showProModal={showProModal}
      onCloseProModal={closeProModal}
      isCutSelectionShell={isCutSelectionShell}
      isCutSelectionSheetOpen={isCutSelectionSheetOpen}
      flattenBg={mode !== "inicio"}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onModeChange={handleModeChange}
    >

        <ActiveModeRenderer
          mode={mode}
          home={buildHomeModeProps({
            lang,
            t,
            savedMenusCount: savedMenus.length,
            onLangChange: handleLanguageChange,
            onModeChange: handleModeChange,
            onPrimaryCtaClick: handleHomePrimaryCtaClick,
          })}
          // ESLint react-hooks/refs falsely flags this pure builder call because the
          // hook-returned handlers it receives close over refs internally; passing them as
          // values is safe — they are only invoked from event handlers, never during render.
          // eslint-disable-next-line react-hooks/refs
          coccion={buildCoccionModeProps({
            cookingStep,
            lang,
            t,
            selectedAnimalId: animalIdsByLabel[animal] as GeneratedAnimalId,
            selectedCutId: cut || null,
            isAnimalPreselected: animalParamPreselected,
            onCutSelectionAnimalChange: handleCutSelectionAnimalChange,
            onCutSelectionPreviewChange: handleCutSelectionPreviewChange,
            onCutSelectionStartCooking: handleCutSelectionStartCooking,
            animal,
            cut,
            cuts,
            selectedCut,
            currentDonenessOptions,
            doneness,
            equipment,
            thickness,
            showThickness,
            advancedThicknessEnabled,
            sizePreset,
            weightRange,
            vegetableFormat,
            loading,
            blocks,
            checkedItems,
            saveMenuStatus,
            saveMenuMessage,
            getAnimalPreview,
            onAnimalChange: handleAnimalChange,
            onCutChange: handleCutChange,
            onCookingStepChange: navigateCookingStep,
            setAdvancedThicknessEnabled,
            setDoneness,
            setEquipment,
            setSizePreset,
            setThickness,
            setVegetableFormat,
            setWeightRange,
            resetSaveMenuState,
            setCheckedItems,
            onGenerateCookingPlan: generateCookingPlan,
            onSaveMenu: async () => {
              await saveCurrentMenu();
            },
          })}
          menu={buildMenuModeProps({
            t,
            people,
            setPeople,
            eventType,
            setEventType,
            menuMeats,
            setMenuMeats,
            sides,
            setSides,
            budget,
            setBudget,
            difficulty,
            setDifficulty,
            equipment,
            setEquipment,
            loading,
            blocks,
            checkedItems,
            setCheckedItems,
            saveMenuStatus,
            saveMenuMessage,
            onGenerateMenuPlan: generateMenuPlan,
            onSaveCurrentMenu: async () => {
              await saveCurrentMenu();
            },
          })}
          guardados={buildGuardadosModeProps({
            lang,
            t,
            guardadosTab,
            onGuardadosTabChange: setGuardadosTab,
            checkedItems,
            setCheckedItems,
            savedMenus,
            selectedSavedMenu,
            shareMessage,
            shareMessageMenuId,
            shareStatus,
            sharingMenuId,
            onClearSelectedSavedMenu: () => setSelectedSavedMenu(null),
            onCopyShareLink: copyShareLink,
            onCopySavedMenu: copySavedMenu,
            onDeleteMenu: deleteMenu,
            onLoadMenu: loadMenu,
            onCookAgainLive: startSavedCookLive,
            onCookAgainReview: reviewSavedCook,
            onPublishMenu: publishMenu,
            onUnpublishMenu: unpublishMenu,
            onStartCookingFromSavedCooks: () => navigateMode("coccion"),
          })}
          // eslint-disable-next-line react-hooks/refs
          parrillada={buildParrilladaModeProps({
            lang,
            t,
            step: parrilladaStep,
            onStepChange: (next) => commitNav("parrillada", "animal", "push", {}, next),
          })}
          // eslint-disable-next-line react-hooks/refs
          plan={buildPlanModeProps({
            step: planStep,
            onStepChange: (next) => commitNav("plan", "animal", "push", {}, next),
          })}
        />
    </AppShellChrome>
  );
}

export function ParrilleroAppClient() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#020617]" aria-hidden />}>
      <ParrilleroAppContent />
    </Suspense>
  );
}

