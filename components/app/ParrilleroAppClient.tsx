"use client";

import {
  saveGeneratedMenu,
} from "@/app/actions/savedMenus";
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
  getSafeBlocksForSave,
  hasSavableBlocks,
  parseMenuReply,
  parseResponse,
} from "@/components/app/utils/blocks";
import {
  animalLabelsById,
  getAnimalPreview,
  getCutDescription,
  getCutItems,
  getCutName,
  getDonenessSelectOptions,
  getInitialDoneness,
  parseSavedCookConfig,
  toLiveDoneness,
  type CutItem,
} from "@/components/app/utils/cookingDomain";
import {
  LANG_STORAGE_KEY,
  engineLang,
  localeForLang,
  parseLangParam,
} from "@/components/app/utils/i18n";
import {
  MOCK_LIVE_STEPS,
  persistSavedCook,
} from "@/components/app/utils/liveSession";
import { asRecord, parsePositiveInt } from "@/components/app/utils/text";
import { type Mode } from "@/components/navigation/AppHeader";
import {
  buildText,
  copySavedMenu,
  type SavedMenu,
  type SavedMenuType,
} from "@/components/results/CookingResultScreen";
import { isPro } from "@/lib/proStatus";
import { useOnboardingGate } from "@/components/app/hooks/useOnboardingGate";
import { useProModalController } from "@/components/app/hooks/useProModalController";
import { useSavedMenusController } from "@/components/app/hooks/useSavedMenusController";
import { useSwipeNavigation } from "@/components/app/hooks/useSwipeNavigation";
import {
  OnboardingSlides,
} from "@/components/onboarding/OnboardingSlides";
import { useMenuComposerState } from "@/components/app/hooks/useMenuComposerState";
import { track } from "@/lib/analytics";
import {
  generateCookingPlan as generateLocalCookingPlan,
  generateCookingSteps as generateLocalCookingSteps,
  getCutById,
  getDonenessOptions,
  shouldShowThickness,
} from "@/lib/cookingRules";
import type { DonenessId } from "@/lib/cookingCatalog";
import { cutImages } from "@/lib/media/cutImages";
import {
  mapBeefLargeWeightPresetToKg,
  mapSizePresetToThickness,
  mapThicknessToSizePreset,
  mapWeightRangeToKg,
} from "@/lib/cooking/inputMapping";
import { texts, type Lang } from "@/lib/i18n/texts";
import {
  createLiveCookingPayload,
  readLiveCookingPayload,
  saveLiveCookingPayload,
} from "@/lib/liveCookingPlan";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";
import {
  buildCookingDetailsUrl,
  buildHomeUrl,
} from "@/lib/navigation/cookingNavigation";
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
import { parseLiveParams } from "@/lib/navigation/parseLiveParams";
import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import { animalIdsByLabel, type AnimalLabel } from "@/lib/media/animalMedia";
import {
  REQUIRED_COOKING_BLOCKS,
  REQUIRED_COOKING_BLOCKS_EN,
  REQUIRED_PARRILLADA_BLOCKS,
  normalizeBlocks,
} from "@/lib/parser/normalizeBlocks";
import { generateParrilladaPlan } from "@/lib/parrilladaEngine";
import { useLiveCookingSession } from "@/hooks/useLiveCookingSession";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

type SavedMenuActionMenu = {
  id: string;
  name: string;
  created_at: string;
  data?: Record<string, unknown>;
  is_public?: boolean;
  share_slug?: string | null;
};

type SaveGeneratedMenuResponse =
  | { ok: true; menu: SavedMenuActionMenu }
  | { ok: false; error?: string }
  | SavedMenuActionMenu;

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
    const currentNav =
      typeof window === "undefined"
        ? { mode: "inicio" as Mode, cookingStep: "animal" as CookingWizardStep, cookingContext: {} as CookingNavContext }
        : parseNavFromSearch(window.location.search);
    const modeChanged = nextMode !== currentNav.mode;
    const stepChanged = nextCookingStep !== currentNav.cookingStep;
    const contextChanged = !isSameCookingContext(nextCookingContext, currentNav.cookingContext);
    const navChanged = modeChanged || stepChanged || contextChanged;
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

    if (typeof window === "undefined") return;
    const search = buildSearchFromNav(nextMode, nextCookingStep, nextCookingContext, lang);
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
    const resolvedThickness = contextParams.thickness ?? fallbackThickness ?? (shouldShowThickness(sourceCutId) ? "2" : undefined);
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
        commitNav(nav.mode, nav.cookingStep, "replace", nav.cookingContext);
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
  // though sessionStorage still holds them. Re-hydrate from the live payload here,
  // gated on a canonical-cut match so we never surface stale plans under a different cut.
  useEffect(() => {
    if (mode !== "coccion" || cookingStep !== "result") return;
    if (Object.keys(blocks).length > 0) return;
    if (typeof window === "undefined") return;

    const payload = readLiveCookingPayload();
    if (!payload?.blocks || Object.keys(payload.blocks).length === 0) return;
    if (cut && payload.input.cut !== cut) return;

    // Pulling result blocks from sessionStorage (external store) on a user-driven
    // mode/step transition; not a prop sync, so the rule's anti-pattern does not apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlocks(payload.blocks);
  }, [mode, cookingStep, blocks, cut]);

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

  async function saveCurrentMenu(): Promise<SavedMenu | null> {
    if (typeof window === "undefined") return null;
    if (!hasSavableBlocks(blocks)) {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
      return null;
    }

    const now = new Date();
    const dateLabel = now.toLocaleDateString(localeForLang(lang));
    const savedType: SavedMenuType =
      mode === "coccion"
        ? "cooking_plan"
        : mode === "parrillada" || (mode === "plan" && planMode === "evento")
          ? "parrillada_plan"
          : "generated_menu";
    const cutName = selectedCut?.name ?? cut;
    const menuName =
      savedType === "cooking_plan"
        ? `Cocción - ${animal} ${cutName} - ${dateLabel}`
        : savedType === "parrillada_plan"
          ? `Parrillada - ${parrilladaPeople} personas - ${dateLabel}`
          : `Menú BBQ - ${people} personas - ${dateLabel}`;
    const peopleValue =
      savedType === "cooking_plan"
        ? null
        : parsePositiveInt(savedType === "parrillada_plan" ? parrilladaPeople : people);
    const planProducts = planMode === "rapido" ? planProduct : menuMeats;

    setSaveMenuStatus("saving");
    setSaveMenuMessage("");

    try {
      const safeBlocks = getSafeBlocksForSave(blocks, savedType);
      if (Object.keys(safeBlocks).length === 0) {
        setSaveMenuStatus("error");
        setSaveMenuMessage(t.menuSaveError);
        return null;
      }

      const inputs =
        savedType === "cooking_plan"
          ? {
              animal,
              cut,
              cutName,
              weight,
              thickness,
              doneness,
              equipment,
            }
          : savedType === "parrillada_plan"
            ? {
                parrilladaPeople,
                serveTime,
                parrilladaProducts,
                parrilladaSides,
                equipment,
              }
            : {
                people,
                eventType,
                planMode,
                products: planProducts,
                menuMeats: planProducts,
                sides: planMode === "rapido" ? "guarnición simple" : sides,
                budget,
                difficulty: planMode === "rapido" ? "fácil" : difficulty,
                equipment,
              };

      const savedMenuResult = (await saveGeneratedMenu({
        name: menuName,
        lang,
        people: peopleValue,
        data: {
          type: savedType,
          generatedAt: now.toISOString(),
          inputs,
          blocks: safeBlocks,
        },
      })) as SaveGeneratedMenuResponse;

      if ("ok" in savedMenuResult && !savedMenuResult.ok) {
        setSaveMenuStatus("error");
        setSaveMenuMessage(savedMenuResult.error || t.menuSaveError);
        return null;
      }

      const savedMenu = "ok" in savedMenuResult ? savedMenuResult.menu : savedMenuResult;

      const newMenu: SavedMenu = {
        id: savedMenu.id,
        title: savedMenu.name,
        date: new Date(savedMenu.created_at).toLocaleDateString(localeForLang(lang)),
        blocks: safeBlocks,
        data: asRecord(savedMenu.data) ?? {
          type: savedType,
          lang,
          inputs,
          blocks: safeBlocks,
        },
        type: savedType,
        is_public: savedMenu.is_public ?? false,
        share_slug: savedMenu.share_slug ?? null,
      };

      updateSavedMenus([newMenu, ...savedMenus.filter((menu) => menu.id !== newMenu.id)]);
      setSaveMenuStatus("success");
      setSaveMenuMessage(t.menuSaved);
      return newMenu;
    } catch {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
      return null;
    }
  }

  function loadMenu(menu: SavedMenu) {
    setSelectedSavedMenu(menu);
    resetSaveMenuState();
    navigateMode("guardados");
  }

  function buildCookingPlanFromSavedConfig(menu: SavedMenu) {
    const config = parseSavedCookConfig(menu, {
      animal,
      equipment,
      doneness,
      weight,
      thickness,
      lang,
    });
    if (!config) return null;

    const thicknessForPlan = shouldShowThickness(config.cut) ? config.thickness : "2";
    const localPlan = generateLocalCookingPlan({
      animal: config.animal,
      cut: config.cut,
      weightKg: config.weight,
      thicknessCm: thicknessForPlan,
      doneness: config.doneness,
      equipment: config.equipment,
      language: engineLang(config.lang),
    });
    const localPlanRepeat = generateLocalCookingPlan({
      animal: config.animal,
      cut: config.cut,
      weightKg: config.weight,
      thicknessCm: thicknessForPlan,
      doneness: config.doneness,
      equipment: config.equipment,
      language: engineLang(config.lang),
    });
    if (
      localPlan &&
      localPlanRepeat &&
      JSON.stringify(localPlan) !== JSON.stringify(localPlanRepeat)
    ) {
      console.warn("[cook-again] Non-deterministic local cooking plan detected", config);
    }

    const requiredBlocks = config.lang === "en" ? REQUIRED_COOKING_BLOCKS_EN : REQUIRED_COOKING_BLOCKS;
    const normalizedPlan = normalizeBlocks(
      localPlan ?? menu.blocks,
      requiredBlocks,
      "cooking_plan",
    );

    return { config, blocks: normalizedPlan };
  }

  function reviewSavedCook(menu: SavedMenu) {
    if (menu.type !== "cooking_plan") {
      loadMenu(menu);
      return;
    }

    const rebuilt = buildCookingPlanFromSavedConfig(menu);
    if (!rebuilt) {
      loadMenu(menu);
      return;
    }

    setLang(rebuilt.config.lang);
    setAnimal(rebuilt.config.animal);
    setCut(rebuilt.config.cut);
    setWeight(rebuilt.config.weight);
    resetAdaptiveDetailInputs(rebuilt.config.cut, rebuilt.config.animal);
    setThickness(rebuilt.config.thickness);
    setSizePreset(mapThicknessToSizePreset(rebuilt.config.thickness));
    setDoneness(rebuilt.config.doneness);
    setEquipment(rebuilt.config.equipment);
    setBlocks(rebuilt.blocks);
    setCheckedItems({});
    resetSaveMenuState();
    setSelectedSavedMenu(null);
    commitNav("coccion", "result", "push", {
      animal: rebuilt.config.animal,
      cut: rebuilt.config.cut,
      doneness: rebuilt.config.doneness,
      thickness: rebuilt.config.thickness,
    });
  }

  function startSavedCookLive(menu: SavedMenu) {
    const rebuilt = buildCookingPlanFromSavedConfig(menu);
    if (!rebuilt) {
      loadMenu(menu);
      return;
    }

    const payload = createLiveCookingPayload({
      input: {
        animal: rebuilt.config.animal,
        cut: rebuilt.config.cut,
        equipment: rebuilt.config.equipment,
        doneness: rebuilt.config.doneness,
        thickness: shouldShowThickness(rebuilt.config.cut) ? rebuilt.config.thickness : "2",
        lang: rebuilt.config.lang,
      },
      blocks: rebuilt.blocks,
    });

    if (!saveLiveCookingPayload(payload)) {
      return;
    }
    const showThickness = shouldShowThickness(rebuilt.config.cut);
    const liveThicknessRaw = Number(rebuilt.config.thickness);
    const liveThickness =
      showThickness && Number.isFinite(liveThicknessRaw) && liveThicknessRaw > 0
        ? liveThicknessRaw
        : undefined;
    router.push(
      buildLiveUrl({
        animal: animalIdsByLabel[rebuilt.config.animal],
        cutId: rebuilt.config.cut,
        doneness: toLiveDoneness(rebuilt.config.doneness),
        thickness: liveThickness,
        lang: rebuilt.config.lang,
      }),
    );
  }

  function handleAnimalChange(selectedAnimal: AnimalLabel) {
    setAnimal(selectedAnimal);
    setCut("");
    resetAdaptiveDetailInputs(undefined, selectedAnimal);
    setDoneness(getInitialDoneness(selectedAnimal));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    const navMethod: "push" | "replace" =
      mode === "coccion" && cookingStep === "cut" ? "replace" : "push";
    commitNav("coccion", "cut", navMethod, { animal: selectedAnimal });
    track({ name: "animal_selected", animal: selectedAnimal, lang });
  }

  function replaceCutSelectionAnimal(nextAnimal: AnimalLabel) {
    commitNav("coccion", "cut", "replace", { animal: nextAnimal });
  }

  function handleCutSelectionAnimalChange(selectedAnimalId: GeneratedAnimalId) {
    const selectedAnimal = animalLabelsById[selectedAnimalId] ?? animal;
    if (selectedAnimal === animal) return;

    setAnimal(selectedAnimal);
    setCut("");
    resetAdaptiveDetailInputs(undefined, selectedAnimal);
    setDoneness(getInitialDoneness(selectedAnimal));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    replaceCutSelectionAnimal(selectedAnimal);
    track({ name: "animal_selected", animal: selectedAnimal, lang });
  }

  function handleCutChange(selectedCutId: string) {
    const defaults = getAdaptiveDetailDefaults(selectedCutId, animal);
    const defaultThickness = mapSizePresetToThickness(defaults.sizePreset);
    const defaultDoneness = getInitialDoneness(animal, selectedCutId);

    setCut(selectedCutId);
    resetAdaptiveDetailInputs(selectedCutId, animal);
    setDoneness(defaultDoneness);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    commitNav("coccion", "details", "push", {
      animal,
      cut: selectedCutId,
      ...(defaultDoneness ? { doneness: defaultDoneness } : {}),
      thickness: defaultThickness,
    });
    track({ name: "cut_selected", animal, cutId: selectedCutId, lang });
  }

  function handleCutSelectionPreviewChange(nextCutId: string | null) {
    if (nextCutId) {
      setCut(nextCutId);
      commitNav("coccion", "cut", "push", {
        animal,
        cut: nextCutId,
      });
      return;
    }

    setCut("");
    commitNav("coccion", "cut", "replace", {});
  }

  function handleCutSelectionStartCooking(profile: GeneratedCutProfile) {
    const selectedAnimal = animalLabelsById[profile.animalId] ?? animal;
    const selectedDoneness = getInitialDoneness(selectedAnimal, profile.id);
    const selectedThickness =
      profile.showThickness && Number.isFinite(profile.defaultThicknessCm)
        ? `${profile.defaultThicknessCm}`
        : "2";

    setAnimal(selectedAnimal);
    setCut(profile.id);
    resetAdaptiveDetailInputs(profile.id, selectedAnimal);
    setDoneness(selectedDoneness);
    setThickness(selectedThickness);
    setSizePreset(mapThicknessToSizePreset(selectedThickness));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    commitNav("coccion", "details", "push", {
      animal: selectedAnimal,
      cut: profile.id,
      doneness: selectedDoneness,
      ...(profile.showThickness ? { thickness: selectedThickness } : {}),
    });
    track({ name: "cut_selected", animal: selectedAnimal, cutId: profile.id, lang });
  }

  async function callAI(
    message: string,
    createCookSteps = false,
    parseAsMenu = false,
  ): Promise<boolean> {
    setLoading(true);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        if (createCookSteps) {
          track({ name: "cooking_failure", where: "ai_http", status: res.status });
        }
        setLoading(false);
        return false;
      }

      const data = await res.json();
      const reply = typeof data.reply === "string" ? data.reply : "";
      const parsed = parseAsMenu ? parseMenuReply(reply) : parseResponse(reply);
      const normalized = parseAsMenu
        ? parsed
        : normalizeBlocks(parsed, REQUIRED_COOKING_BLOCKS, "cooking_plan");

      setBlocks(normalized);
    } catch (e) {
      if (createCookSteps) {
        const msg = e instanceof Error ? e.message : String(e);
        if (e instanceof TypeError) {
          track({ name: "cooking_failure", where: "ai_network", message: msg });
        } else {
          track({ name: "cooking_failure", where: "ai_exception", message: msg });
        }
      }
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  }

  async function generateCookingPlan() {
    const cutMeta = getCutById(cut);
    const inputProfile = cutMeta
      ? getInputProfileForCut({
          cutId: cutMeta.id,
          animalId: cutMeta.animalId,
          style: cutMeta.style,
          inputProfileId: cutMeta.inputProfileId,
        })
      : getInputProfileForCut({
          cutId: cut,
          animalId: animalIdsByLabel[animal],
          style: "fast",
        });
    const isVegetableCut = inputProfile.showVegetableFormat;
    const isWholeChicken = cut === "pollo_entero";

    const resolvedWeightKg =
      inputProfile.showWeightRange
        ? mapWeightRangeToKg(weightRange, isWholeChicken)
        : inputProfile.showWeightPreset
          ? mapBeefLargeWeightPresetToKg(weightRange)
          : weight;

    let resolvedThicknessCm = "2";
    if (inputProfile.showSizePreset) {
      resolvedThicknessCm = mapSizePresetToThickness(sizePreset);
      if (inputProfile.allowAdvancedExactThickness && advancedThicknessEnabled && thickness.trim()) {
        resolvedThicknessCm = thickness;
      }
    }

    const input = {
      animal,
      cut,
      weightKg: resolvedWeightKg,
      thicknessCm: resolvedThicknessCm,
      format: isVegetableCut ? vegetableFormat : undefined,
      doneness,
      equipment,
      language: engineLang(lang),
    };

    const localPlan = generateLocalCookingPlan(input);
    const localSteps = generateLocalCookingSteps(input);

    if (localPlan && localSteps) {
      track({ name: "cooking_plan_result", path: "local" });
      const normalizedPlan = normalizeBlocks(localPlan, REQUIRED_COOKING_BLOCKS, "cooking_plan");
      setBlocks(normalizedPlan);
      setCheckedItems({});
      resetSaveMenuState();
      pushCookingResultHistoryWithContext({
        doneness: input.doneness,
        thickness: resolvedThicknessCm,
      });
      return;
    }

    track({ name: "cooking_ai_fallback" });
    const ok = await callAI(
      `
Language: ${engineLang(lang) === "es" ? "Spanish" : "English"}.
Animal: ${animal}
Cut: ${selectedCut?.name ?? cut}
Weight: ${resolvedWeightKg} kg
Thickness: ${resolvedThicknessCm} cm
Format: ${isVegetableCut ? vegetableFormat : "not relevant"}
Doneness: ${doneness}
Equipment: ${equipment}

Return exact block titles:
SETUP
TIEMPOS
TEMPERATURA
PASOS
ERROR
`,
      true,
    );
    if (ok) {
      track({ name: "cooking_plan_result", path: "ai" });
    }
    pushCookingResultHistoryWithContext({
      doneness: input.doneness,
      thickness: resolvedThicknessCm,
    });
  }

  async function generateMenuPlan() {
    await callAI(`
Language: ${engineLang(lang) === "es" ? "Spanish" : "English"}.

Personas / People: ${people}
Tipo de evento / Event type: ${eventType}
Carnes/productos / Products: ${menuMeats}
Acompañamientos / Sides: ${sides}
Presupuesto / Budget: ${budget} €
Nivel / Difficulty: ${difficulty}
Equipo / Equipment: ${equipment}

If Spanish:
MENU
CANTIDADES
TIMING
ORDEN
COMPRA
ERROR

If English:
MENU
QUANTITIES
TIMING
ORDER
SHOPPING
ERROR
`, false, true);
  }

  async function generatePlanExperience() {
    setPlanGenerated(false);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();

    if (planMode === "evento") {
      generateParrillada();
      setPlanGenerated(true);
      return;
    }

    const productInput = planMode === "rapido" ? planProduct : menuMeats;
    const sidesInput = planMode === "rapido" ? "guarnición simple" : sides;
    const difficultyInput = planMode === "rapido" ? "fácil" : difficulty;

    const ok = await callAI(`
Language: ${engineLang(lang) === "es" ? "Spanish" : "English"}.

Plan mode: ${planMode}
Personas / People: ${people}
Tipo de evento / Event type: ${planMode === "rapido" ? "plan rápido" : eventType}
Carnes/productos / Products: ${productInput}
Acompañamientos / Sides: ${sidesInput}
Presupuesto / Budget: ${budget} €
Nivel / Difficulty: ${difficultyInput}
Equipo / Equipment: ${equipment}

If Spanish:
MENU
CANTIDADES
TIMING
ORDEN
COMPRA
ERROR

If English:
MENU
QUANTITIES
TIMING
ORDER
SHOPPING
ERROR
`, false, true);

    if (ok) setPlanGenerated(true);
  }

  function editPlanExperience() {
    setPlanGenerated(false);
    resetSaveMenuState();
  }

  function copyCurrentPlan() {
    if (typeof window === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(buildText(blocks));
  }

  async function shareCurrentPlan() {
    const savedMenu = await saveCurrentMenu();
    if (!savedMenu) return;

    await publishMenu(savedMenu);
  }

  function generateParrillada() {
    const plan = generateParrilladaPlan({
      people: parrilladaPeople,
      serveTime,
      products: parrilladaProducts,
      sides: parrilladaSides,
      equipment,
      language: engineLang(lang),
    });

    setBlocks(normalizeBlocks(plan, REQUIRED_PARRILLADA_BLOCKS, "parrillada_plan"));
    setCheckedItems({});
    resetSaveMenuState();
  }

  function handleLanguageChange(nextLang: Lang) {
    setLang(nextLang);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("lang", nextLang);
      const query = params.toString();
      router.replace(`${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }
    setBlocks({});
    setCheckedItems({});
    setPlanGenerated(false);
    resetSaveMenuState();
  }

  function navigateMode(nextMode: Mode) {
    if (nextMode === mode) return;
    const nextStep: CookingWizardStep = nextMode === "coccion" ? "cut" : cookingStep;
    if (nextMode !== "guardados") setSelectedSavedMenu(null);
    // Soft Pro prompt for multi-item planning (non-blocking — navigation still proceeds)
    if ((nextMode === "plan" || nextMode === "parrillada") && !isPro()) {
      openPlanningProModal();
    }
    commitNav(nextMode, nextStep, "push");
  }

  function handleHomePrimaryCtaClick() {
    commitNav("coccion", "cut", "push");
  }

  function handleModeChange(nextMode: Mode) {
    navigateMode(nextMode);
  }

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


  function handleLivePlanNavigation() {
    if (typeof window === "undefined") return;
    // Result-block re-hydration after reload-in-Live happens in the Result-step
    // fallback effect above (it survives applyCookingNavContext's blocks wipe).
    const { animal, cutId, doneness, thickness } = parseLiveParams(window.location.search);
    const targetUrl =
      animal && cutId
        ? buildCookingDetailsUrl({
            animal,
            cutId,
            doneness,
            thickness: thickness !== undefined ? String(thickness) : undefined,
            lang,
          })
        : buildHomeUrl(lang);
    router.push(targetUrl);
  }

  // TODO: remove legacy planning state/actions after scheduler demo fully replaces PlanHub flows.
  void [
    setPlanMode,
    setPlanProduct,
    planGenerated,
    setParrilladaPeople,
    setServeTime,
    setParrilladaProducts,
    setParrilladaSides,
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

  return (
    <AppShellChrome
      lang={lang}
      mode={mode}
      t={t}
      showProModal={showProModal}
      onCloseProModal={closeProModal}
      isCutSelectionShell={isCutSelectionShell}
      isCutSelectionSheetOpen={isCutSelectionSheetOpen}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onModeChange={handleModeChange}
    >

        <ActiveModeRenderer
          mode={mode}
          home={{
            lang,
            onLangChange: handleLanguageChange,
            savedMenusCount: savedMenus.length,
            t,
            onModeChange: handleModeChange,
            onPrimaryCtaClick: handleHomePrimaryCtaClick,
          }}
          coccion={{
            cookingStep,
            lang,
            t,
            cutSelection: {
              selectedAnimalId: animalIdsByLabel[animal] as GeneratedAnimalId,
              selectedCutId: cut || null,
              isAnimalPreselected: Boolean(parseCookingAnimal(searchParams.get("animal"))),
              onAnimalChange: handleCutSelectionAnimalChange,
              onPreviewCutChange: handleCutSelectionPreviewChange,
              onStartCooking: handleCutSelectionStartCooking,
            },
            wizard: {
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
              onAdvancedThicknessEnabledChange: (value) => {
                setAdvancedThicknessEnabled(value);
                resetSaveMenuState();
              },
              onDonenessChange: (value) => {
                setDoneness(value);
                resetSaveMenuState();
              },
              onEquipmentChange: (value) => {
                setEquipment(value);
                resetSaveMenuState();
              },
              onSizePresetChange: (value) => {
                setSizePreset(value);
                setThickness(mapSizePresetToThickness(value));
                resetSaveMenuState();
              },
              onThicknessChange: (value) => {
                setThickness(value);
                setSizePreset(mapThicknessToSizePreset(value));
                resetSaveMenuState();
              },
              onVegetableFormatChange: (value) => {
                setVegetableFormat(value);
                resetSaveMenuState();
              },
              onWeightRangeChange: (value) => {
                setWeightRange(value);
                resetSaveMenuState();
              },
              onCheckedItemsChange: setCheckedItems,
              onGenerateCookingPlan: generateCookingPlan,
              onSaveMenu: async () => {
                await saveCurrentMenu();
              },
            },
          }}
          menu={{
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
          }}
          guardados={{
            lang,
            t,
            guardadosTab,
            onGuardadosTabChange: setGuardadosTab,
            plans: {
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
            },
            cooks: {
              onStartCooking: () => navigateMode("coccion"),
            },
          }}
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

