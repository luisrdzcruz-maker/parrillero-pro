"use client";

import {
  publishGeneratedMenu,
  saveGeneratedMenu,
  unpublishGeneratedMenu,
} from "@/app/actions/savedMenus";
import {
  CookingWizard,
  Input,
  PrimaryButton,
  ResultCards,
  Select,
  equipmentOptions,
  type CookingSizePreset,
  type CookingWeightRange,
  type Blocks,
  type CookingWizardStep,
  type SaveMenuStatus,
  type SelectOption,
  type VegetableFormat,
} from "@/components/cooking/CookingWizard";
import { getInputProfileForCut } from "@/lib/cooking/inputProfiles";
import { HomeScreen } from "@/components/home/HomeScreen";
import {
  DesktopModeTabs,
  type Mode,
} from "@/components/navigation/AppHeader";
import { AppBottomNav } from "@/components/navigation/AppBottomNav";
import {
  CookingResultScreen,
  buildText,
  copySavedMenu,
  isLocalSavedMenu,
  type SavedMenu,
  type SavedMenuType,
  type ShareStatus,
} from "@/components/results/CookingResultScreen";
import { SavedCooksScreen } from "@/components/cooks/SavedCooksScreen";
import LiveCookingScreen, { type LiveStep } from "@/components/live/LiveCookingScreen";
import { ProModal } from "@/components/pro/ProModal";
import { isPro } from "@/lib/proStatus";
import {
  OnboardingSlides,
} from "@/components/onboarding/OnboardingSlides";
import { ONBOARDING_STORAGE_KEY } from "@/lib/storageKeys";
import { PlanHub, type PlanMode } from "@/components/planning/PlanHub";
import { Button, Grid } from "@/components/ui";
import { track } from "@/lib/analytics";
import type { ProductCut } from "@/lib/cookingCatalog";
import {
  generateCookingPlan as generateLocalCookingPlan,
  generateCookingSteps as generateLocalCookingSteps,
  getCutById,
  getCutsByAnimal,
  getDonenessOptions,
  shouldShowThickness,
} from "@/lib/cookingRules";
import { ds } from "@/lib/design-system";
import { texts, type Lang } from "@/lib/i18n/texts";
import {
  buildLiveStepsFromPayload,
  buildLiveStepsSignature,
  createLiveCookingPayload,
  hasDistinctLiveSteps,
  LIVE_COOKING_STORAGE_KEY,
  readLiveCookingPayload,
  saveLiveCookingPayload,
  type LiveCookingPlanPayload,
} from "@/lib/liveCookingPlan";
import { toAnimalId } from "@/lib/navigation/animalParam";
import { buildLiveUrl } from "@/lib/navigation/buildLiveUrl";
import {
  buildCookingDetailsUrl,
  buildCookingResultUrl,
  buildHomeUrl,
} from "@/lib/navigation/cookingNavigation";
import { canonicalizeCutId } from "@/lib/navigation/canonicalCutId";
import { parseLiveParams } from "@/lib/navigation/parseLiveParams";
import { CutSelectionScreen } from "@/components/cuts/CutSelectionScreen";
import type { GeneratedAnimalId, GeneratedCutProfile } from "@/lib/generated/cutProfiles";
import type { Doneness } from "@/lib/types/domain";
import { animalIdsByLabel, type AnimalLabel } from "@/lib/media/animalMedia";
import { cutImages } from "@/lib/media/cutImages";
import {
  REQUIRED_COOKING_BLOCKS,
  REQUIRED_COOKING_BLOCKS_EN,
  REQUIRED_MENU_BLOCKS,
  REQUIRED_PARRILLADA_BLOCKS,
  normalizeBlocks,
} from "@/lib/parser/normalizeBlocks";
import { parseBlocks } from "@/lib/parser/parseBlocks";
import { generateParrilladaPlan } from "@/lib/parrilladaEngine";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type EngineLang = "es" | "en";

type SwipeDirection = "back" | "forward";
type TouchPoint = {
  x: number;
  y: number;
};

type SavedMenuActionMenu = {
  id: string;
  name: string;
  created_at: string;
  data?: Record<string, unknown>;
  is_public?: boolean;
  share_slug?: string | null;
};

const LIVE_DONENESS_VALUES: Doneness[] = ["rare", "medium_rare", "medium", "medium_well", "well_done", "safe"];

type SaveGeneratedMenuResponse =
  | { ok: true; menu: SavedMenuActionMenu }
  | { ok: false; error?: string }
  | SavedMenuActionMenu;

type PublishSavedMenuResponse =
  | {
      ok: true;
      menu: {
        id: string;
        is_public: boolean;
        share_slug: string | null;
      };
    }
  | { ok: false; error?: string };

type CutItem = {
  id: string;
  name: string;
  image: string;
  description: string;
};

type SavedCookConfig = {
  animal: AnimalLabel;
  cut: string;
  weight: string;
  thickness: string;
  doneness: string;
  equipment: string;
  lang: Lang;
};

type CookingNavContext = {
  animal?: AnimalLabel;
  cut?: string;
  doneness?: string;
  thickness?: string;
};

type ParsedNav = {
  mode: Mode;
  cookingStep: CookingWizardStep;
  cookingContext: CookingNavContext;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return `${value}`;
  return "";
}

function parseSavedLang(value: unknown): Lang {
  const text = asText(value);
  if (text === "en" || text === "fi" || text === "es") return text;
  return "es";
}

function parseSavedAnimal(value: unknown, fallback: AnimalLabel): AnimalLabel {
  const text = asText(value);
  if (text && text in animalIdsByLabel) return text as AnimalLabel;
  return fallback;
}

function toLiveDoneness(value: string): Doneness | undefined {
  return LIVE_DONENESS_VALUES.includes(value as Doneness) ? (value as Doneness) : undefined;
}

function parseSavedCookConfig(
  menu: SavedMenu,
  fallback: {
    animal: AnimalLabel;
    equipment: string;
    doneness: string;
    weight: string;
    thickness: string;
    lang: Lang;
  },
): SavedCookConfig | null {
  const data = asRecord(menu.data);
  if (!data) return null;
  const inputs = asRecord(data.inputs) ?? data;
  const cut = asText(inputs.cut);
  if (!cut) return null;

  return {
    animal: parseSavedAnimal(inputs.animal, fallback.animal),
    cut,
    weight: asText(inputs.weight) || fallback.weight,
    thickness: asText(inputs.thickness) || fallback.thickness,
    doneness: asText(inputs.doneness) || fallback.doneness,
    equipment: asText(inputs.equipment) || fallback.equipment,
    lang: parseSavedLang(data.lang ?? inputs.lang ?? fallback.lang),
  };
}

function engineLang(lang: Lang): EngineLang {
  return lang === "es" ? "es" : "en";
}

function getInitialDoneness(animal: AnimalLabel) {
  return getDonenessOptions(animalIdsByLabel[animal])[0]?.id ?? "";
}

function getDonenessSelectOptions(animal: AnimalLabel, lang: Lang): SelectOption[] {
  const labelLang = lang === "fi" ? "en" : lang;

  return getDonenessOptions(animalIdsByLabel[animal]).map((option) => ({
    value: option.id,
    label: option.names[labelLang],
  }));
}

function catalogLang(lang: Lang) {
  return lang;
}

function getCutName(cut: ProductCut, lang: Lang) {
  return cut.names[catalogLang(lang)] ?? cut.names.es;
}

function getCutDescription(cut: ProductCut, lang: Lang) {
  return cut.notes?.[catalogLang(lang)] ?? cut.error[engineLang(lang)] ?? "";
}

function getCutItems(animal: AnimalLabel, lang: Lang): CutItem[] {
  return getCutsByAnimal(animalIdsByLabel[animal]).map((cut) => ({
    id: cut.id,
    name: getCutName(cut, lang),
    image: cutImages[cut.id] ?? "/images/vacuno/ribeye-cooked.webp",
    description: getCutDescription(cut, lang),
  }));
}

function getAnimalPreview(animal: AnimalLabel, lang: Lang) {
  return getCutItems(animal, lang)
    .slice(0, 2)
    .map((cut) => cut.name)
    .join(", ");
}

function isInteractiveSwipeTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(target.closest("input, select, textarea, a, label"));
}

function isMobileSwipeViewport() {
  if (typeof window === "undefined") return false;

  return window.innerWidth < 768;
}

function parseResponse(text: string): Blocks {
  const blocks: Blocks = {};
  const sections = text.split(/\n(?=[A-ZÁÉÍÓÚ]+)/);

  sections.forEach((section) => {
    const [title, ...rest] = section.trim().split("\n");
    const content = rest.join("\n").trim();
    if (title && content) blocks[title.trim()] = content;
  });

  return blocks;
}

function parseMenuReply(reply: string): Blocks {
  const parsed = parseBlocks(reply);
  const normalized = normalizeBlocks(parsed, REQUIRED_MENU_BLOCKS, "generated_menu");

  if (process.env.NODE_ENV === "development") {
    console.log("[blocks] parsed", parsed);
    console.log("[blocks] normalized", normalized);
  }

  return normalized;
}

function hasSavableBlocks(currentBlocks: unknown): currentBlocks is Blocks {
  if (!currentBlocks || typeof currentBlocks !== "object" || Array.isArray(currentBlocks)) return false;

  return Object.entries(currentBlocks).some(
    ([key, value]) =>
      key.trim().toUpperCase() !== "ERR" &&
      typeof value === "string" &&
      Boolean(value.trim()) &&
      value.trim().toUpperCase() !== "ERR",
  );
}

function getSafeBlocksForSave(currentBlocks: Blocks, savedType: SavedMenuType): Blocks {
  const sanitized = Object.fromEntries(
    Object.entries(currentBlocks).filter(([key]) => key.trim().toUpperCase() !== "ERR"),
  ) as Blocks;

  const required =
    savedType === "cooking_plan"
      ? REQUIRED_COOKING_BLOCKS
      : savedType === "parrillada_plan"
        ? REQUIRED_PARRILLADA_BLOCKS
        : REQUIRED_MENU_BLOCKS;

  return normalizeBlocks(sanitized, required, savedType);
}

function localeForLang(lang: Lang) {
  if (lang === "en") return "en-US";
  if (lang === "fi") return "fi-FI";
  return "es-ES";
}

function parsePositiveInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const MOCK_LIVE_STEPS: LiveStep[] = [
  {
    id: "preheat",
    label: "Calienta la parrilla.\nMáxima potencia.",
    duration: 300,
    zone: "Directo",
    tempTarget: 230,
    notes: "Tapa cerrada. Espera a que alcance temperatura.",
  },
  {
    id: "sear1",
    label: "Sella.\nLado 1.",
    duration: 240,
    zone: "Directo",
    tempTarget: 230,
    notes: "No la muevas. Déjala hasta que se despegue sola.",
  },
  {
    id: "sear2",
    label: "Sella.\nLado 2.",
    duration: 240,
    zone: "Directo",
    tempTarget: 230,
    notes: "Busca costra dorada y uniforme en toda la superficie.",
  },
  {
    id: "indirect",
    label: "Cocción indirecta.\nFuego bajo.",
    duration: 420,
    zone: "Indirecto",
    tempTarget: 150,
    notes: "Tapa cerrada. Deja que el calor circule sin llama directa.",
  },
  {
    id: "rest",
    label: "Reposa.\nNo cortes aún.",
    duration: 360,
    zone: "Reposo",
    tempTarget: null,
    notes: "Los jugos se redistribuyen. Vale la pena esperar.",
  },
  {
    id: "serve",
    label: "Listo.\nSirve ahora.",
    duration: 0,
    zone: "Servir",
    tempTarget: null,
    notes: null,
  },
];

const SAVED_COOKS_KEY = "parrillero_saved_cooks_v1";
type SavedCookEntry = {
  id: string;
  savedAt: string;
  context: string;
  steps: LiveStep[];
};

function persistSavedCook(steps: LiveStep[], context: string | undefined) {
  if (typeof window === "undefined") return;
  try {
    const existing: SavedCookEntry[] = JSON.parse(localStorage.getItem(SAVED_COOKS_KEY) ?? "[]");
    const entry: SavedCookEntry = {
      id: `cook_${Date.now()}`,
      savedAt: new Date().toISOString(),
      context: context ?? "",
      steps,
    };
    localStorage.setItem(SAVED_COOKS_KEY, JSON.stringify([entry, ...existing].slice(0, 20)));
  } catch {
    // Ignore localStorage failures.
  }
}

const ALLOWED_MODES: readonly Mode[] = [
  "inicio",
  "coccion",
  "plan",
  "menu",
  "parrillada",
  "cocina",
  "guardados",
];

const ALLOWED_COOKING_STEPS: readonly CookingWizardStep[] = [
  "animal",
  "cut",
  "details",
  "result",
];

const animalLabelsById: Record<string, AnimalLabel> = Object.fromEntries(
  Object.entries(animalIdsByLabel).map(([label, id]) => [id, label]),
) as Record<string, AnimalLabel>;

function isAllowedMode(value: string | null): value is Mode {
  return value != null && ALLOWED_MODES.includes(value as Mode);
}

function isAllowedCookingStep(value: string | null): value is CookingWizardStep {
  return value != null && ALLOWED_COOKING_STEPS.includes(value as CookingWizardStep);
}

function parseCookingAnimal(value: string | null): AnimalLabel | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed in animalIdsByLabel) return trimmed as AnimalLabel;

  return animalLabelsById[trimmed.toLowerCase()];
}

function parsePositiveNumberParam(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? trimmed : undefined;
}

function normalizeCookingContextValue(value: string | undefined) {
  return value?.trim() ?? "";
}

function isVegetableContextAnimal(animal: AnimalLabel | undefined) {
  return animal === "Verduras";
}

function isSameCookingContext(a: CookingNavContext, b: CookingNavContext) {
  const animalA = normalizeCookingContextValue(a.animal);
  const animalB = normalizeCookingContextValue(b.animal);
  if (animalA !== animalB) return false;

  const cutA = normalizeCookingContextValue(a.cut);
  const cutB = normalizeCookingContextValue(b.cut);
  if (cutA !== cutB) return false;

  if (isVegetableContextAnimal(a.animal) || isVegetableContextAnimal(b.animal)) {
    return true;
  }

  const donenessA = normalizeCookingContextValue(a.doneness);
  const donenessB = normalizeCookingContextValue(b.doneness);
  if (donenessA !== donenessB) return false;

  const referenceCut = cutA || cutB;
  if (!referenceCut) {
    return normalizeCookingContextValue(a.thickness) === normalizeCookingContextValue(b.thickness);
  }
  if (!shouldShowThickness(referenceCut)) return true;

  return normalizeCookingContextValue(a.thickness) === normalizeCookingContextValue(b.thickness);
}

function parseCookingContext(params: URLSearchParams, mode: Mode): CookingNavContext {
  const liveParams = mode === "cocina" ? parseLiveParams(params.toString()) : null;
  const animalSource = mode === "cocina" ? liveParams?.animal ?? null : params.get("animal");
  const animalFromParam = parseCookingAnimal(animalSource);
  const canonicalCutParam = canonicalizeCutId(
    mode === "cocina" ? liveParams?.cutId : params.get("cut") ?? params.get("cutId"),
    animalFromParam ? animalIdsByLabel[animalFromParam] : undefined,
  );
  const cutMeta = canonicalCutParam ? getCutById(canonicalCutParam) : undefined;
  const animal = animalFromParam ?? (cutMeta ? animalLabelsById[cutMeta.animalId] : undefined);
  const cut =
    canonicalizeCutId(cutMeta?.id, animal ? animalIdsByLabel[animal] : undefined) ?? cutMeta?.id;
  const donenessParam = mode === "cocina" ? liveParams?.doneness?.trim() : params.get("doneness")?.trim();
  const shouldUseDoneness = animal ? !isVegetableContextAnimal(animal) : true;
  const doneness =
    shouldUseDoneness &&
    animal &&
    donenessParam &&
    getDonenessOptions(animalIdsByLabel[animal]).some((option) => option.id === donenessParam)
      ? donenessParam
      : undefined;
  const rawThickness = parsePositiveNumberParam(
    mode === "cocina" ? (liveParams?.thickness != null ? String(liveParams.thickness) : null) : params.get("thickness"),
  );
  const thickness = cut && shouldShowThickness(cut) ? rawThickness : undefined;

  return {
    ...(animal ? { animal } : {}),
    ...(cut ? { cut } : {}),
    ...(doneness ? { doneness } : {}),
    ...(thickness ? { thickness } : {}),
  };
}

function parseLiveUrlState(lang: Lang) {
  if (typeof window === "undefined") {
    return {
      animal: "Vacuno" as AnimalLabel,
      cutId: null as string | null,
      doneness: getInitialDoneness("Vacuno"),
      thickness: "2",
      donenessFromUrl: undefined as string | undefined,
      thicknessFromUrl: undefined as string | undefined,
      context: undefined as string | undefined,
    };
  }

  const { animal, cutId: rawCutId, doneness: rawDoneness, thickness: rawThickness } = parseLiveParams(
    window.location.search,
  );
  const liveAnimal = parseCookingAnimal(animal ?? null) ?? "Vacuno";
  const liveCutParam = rawCutId;
  const liveCutMeta = liveCutParam ? getCutById(liveCutParam) : undefined;
  const cutId = liveCutMeta?.id ?? null;
  const donenessParam = rawDoneness?.trim();
  const donenessFromUrl =
    donenessParam && getDonenessOptions(animalIdsByLabel[liveAnimal]).some((option) => option.id === donenessParam)
      ? donenessParam
      : undefined;
  const doneness = donenessFromUrl ?? getInitialDoneness(liveAnimal);
  const thicknessFromUrl = parsePositiveNumberParam(rawThickness != null ? String(rawThickness) : null);
  const thickness = thicknessFromUrl ?? "2";
  const context = liveCutMeta ? `${liveAnimal} · ${getCutName(liveCutMeta, lang)}` : liveAnimal;

  return { animal: liveAnimal, cutId, doneness, thickness, donenessFromUrl, thicknessFromUrl, context };
}

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

function doesPayloadMatchLiveUrlContext(
  payload: LiveCookingPlanPayload | null,
  liveFromUrl: ReturnType<typeof parseLiveUrlState>,
) {
  if (!payload) return false;
  if (!liveFromUrl.cutId) return false;

  const sameAnimal =
    normalizeLiveContextToken(payload.input.animal) === normalizeLiveContextToken(liveFromUrl.animal);
  const sameCut = normalizeLiveContextToken(payload.input.cut) === normalizeLiveContextToken(liveFromUrl.cutId);
  const payloadDoneness = normalizeLiveContextToken(payload.input.doneness);
  const sameDoneness =
    payloadDoneness.length === 0 ||
    normalizeLiveContextToken(liveFromUrl.donenessFromUrl) === payloadDoneness;
  const payloadRequiresThickness = shouldShowThickness(payload.input.cut);
  const payloadThickness = normalizeLiveContextToken(payload.input.thickness);
  const sameThickness =
    !payloadRequiresThickness ||
    payloadThickness.length === 0 ||
    (liveFromUrl.thicknessFromUrl
      ? isMatchingThickness(liveFromUrl.thicknessFromUrl, payload.input.thickness)
      : false);

  return sameAnimal && sameCut && sameDoneness && sameThickness;
}

function parseNavFromSearch(search: string): ParsedNav {
  const params = new URLSearchParams(search);
  const modeParam = params.get("mode");
  const stepParam = params.get("step");

  const mode: Mode = isAllowedMode(modeParam) ? modeParam : "inicio";
  const cookingContext = mode === "coccion" || mode === "cocina" ? parseCookingContext(params, mode) : {};
  const inferredStep: CookingWizardStep = cookingContext.cut ? "details" : cookingContext.animal ? "cut" : "animal";
  const invalidStepFallback: CookingWizardStep = cookingContext.cut ? "details" : "animal";
  const cookingStep: CookingWizardStep =
    mode === "coccion"
      ? stepParam == null
        ? inferredStep
        : isAllowedCookingStep(stepParam)
          ? stepParam
          : invalidStepFallback
      : inferredStep;

  return { mode, cookingStep, cookingContext };
}

function isCutSelectionFilterContextChangeOnly(
  currentContext: CookingNavContext,
  nextContext: CookingNavContext,
) {
  const currentAnimal = normalizeCookingContextValue(currentContext.animal);
  const nextAnimal = normalizeCookingContextValue(nextContext.animal);
  const currentCut = normalizeCookingContextValue(currentContext.cut);
  const nextCut = normalizeCookingContextValue(nextContext.cut);
  const currentDoneness = normalizeCookingContextValue(currentContext.doneness);
  const nextDoneness = normalizeCookingContextValue(nextContext.doneness);
  const currentThickness = normalizeCookingContextValue(currentContext.thickness);
  const nextThickness = normalizeCookingContextValue(nextContext.thickness);

  return (
    currentAnimal !== nextAnimal &&
    currentCut === nextCut &&
    currentDoneness === nextDoneness &&
    currentThickness === nextThickness
  );
}

function buildSearchFromNav(
  mode: Mode,
  cookingStep: CookingWizardStep,
  cookingContext: CookingNavContext = {},
): string {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (mode === "coccion") {
    params.set("step", cookingStep);
    if (cookingContext.animal) params.set("animal", animalIdsByLabel[cookingContext.animal]);
    if (cookingContext.cut) {
      const canonicalCut = canonicalizeCutId(
        cookingContext.cut,
        cookingContext.animal ? animalIdsByLabel[cookingContext.animal] : undefined,
      );
      if (canonicalCut) params.set("cutId", canonicalCut);
    }
    if (cookingContext.doneness && !isVegetableContextAnimal(cookingContext.animal)) {
      params.set("doneness", cookingContext.doneness);
    }
    if (cookingContext.cut && cookingContext.thickness && shouldShowThickness(cookingContext.cut)) {
      params.set("thickness", cookingContext.thickness);
    }
  } else if (mode === "cocina") {
    const animalId = toAnimalId(cookingContext.animal);
    if (animalId) params.set("animal", animalId);
    if (cookingContext.cut) {
      const canonicalCut = canonicalizeCutId(cookingContext.cut, animalId);
      if (canonicalCut) params.set("cutId", canonicalCut);
    }
    if (cookingContext.doneness && !isVegetableContextAnimal(cookingContext.animal)) {
      params.set("doneness", cookingContext.doneness);
    }
    if (cookingContext.cut && cookingContext.thickness && shouldShowThickness(cookingContext.cut)) {
      params.set("thickness", cookingContext.thickness);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function mapSizePresetToThickness(sizePreset: CookingSizePreset): string {
  if (sizePreset === "small") return "2.5";
  if (sizePreset === "large") return "5";
  return "3.5";
}

function mapWeightRangeToKg(weightRange: CookingWeightRange, wholeChicken: boolean): string {
  if (wholeChicken) {
    if (weightRange === "light") return "1.2";
    if (weightRange === "large") return "2";
    return "1.6";
  }

  if (weightRange === "light") return "0.8";
  if (weightRange === "large") return "1.8";
  return "1.2";
}

function mapThicknessToSizePreset(thicknessValue: string): CookingSizePreset {
  const parsed = Number(thicknessValue.replace(",", "."));
  if (!Number.isFinite(parsed)) return "medium";
  const preset = thicknessCmToPreset(parsed);
  if (preset === "thin") return "small";
  if (preset === "thick") return "large";
  return "medium";
}

function thicknessCmToPreset(thicknessCm: number): "thin" | "normal" | "thick" {
  if (thicknessCm < 2) return "thin";
  if (thicknessCm <= 3.5) return "normal";
  return "thick";
}

function mapBeefLargeWeightPresetToKg(weightRange: CookingWeightRange): string {
  if (weightRange === "light") return "0.9";
  if (weightRange === "large") return "1.6";
  return "1.2";
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Onboarding gate ─────────────────────────────────────────────────────────
  // null  = not yet resolved (server render + first paint — avoids hydration mismatch)
  // true  = show onboarding
  // false = go straight to the app
  //
  // IMPORTANT: localStorage must only be read inside useEffect (after hydration).
  // Reading it during render (even via lazy initializer) causes a server/client
  // mismatch because the server has no localStorage → useState returns false →
  // client may return true → React throws a hydration error.
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [showProModal, setShowProModal] = useState<false | "planning">(false);
  const [showCookCompleteProModal, setShowCookCompleteProModal] = useState(false);
  const cookCompleteModalFiredRef = useRef(false);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const done = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
      setShowOnboarding(!done);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const [lang, setLang] = useState<Lang>("es");
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

  const [people, setPeople] = useState("4");
  const [eventType, setEventType] = useState("cena con amigos");
  const [menuMeats, setMenuMeats] = useState("chuletón, secreto ibérico");
  const [sides, setSides] = useState("patatas, ensalada, chimichurri");
  const [budget, setBudget] = useState("200");
  const [difficulty, setDifficulty] = useState("medio");
  const [planMode, setPlanMode] = useState<PlanMode>("rapido");
  const [guardadosTab, setGuardadosTab] = useState<"plans" | "cooks">("plans");
  const [planProduct, setPlanProduct] = useState("chuletón");
  const [planGenerated, setPlanGenerated] = useState(false);

  const [parrilladaPeople, setParrilladaPeople] = useState("6");
  const [serveTime, setServeTime] = useState("18:00");
  const [parrilladaProducts, setParrilladaProducts] = useState(
    "costillas, chuletón, secreto ibérico, maíz",
  );
  const [parrilladaSides, setParrilladaSides] = useState("patatas, ensalada, chimichurri");

  const [blocks, setBlocks] = useState<Blocks>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [selectedSavedMenu, setSelectedSavedMenu] = useState<SavedMenu | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveMenuStatus, setSaveMenuStatus] = useState<SaveMenuStatus>("idle");
  const [saveMenuMessage, setSaveMenuMessage] = useState("");
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [shareMessage, setShareMessage] = useState("");
  const [shareMessageMenuId, setShareMessageMenuId] = useState<string | null>(null);
  const [sharingMenuId, setSharingMenuId] = useState<string | null>(null);

  const touchStartRef = useRef<TouchPoint | null>(null);
  const isApplyingPopRef = useRef(false);
  const liveAdvanceRef = useRef(false);
  const navInitializedRef = useRef(false);
  const cookingContextRef = useRef({
    animal,
    cut,
    doneness,
    thickness,
  });

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

  const currentDonenessOptions = getDonenessSelectOptions(animal, lang);
  const showThickness = cut ? shouldShowThickness(cut) : true;
  const [liveClientReady, setLiveClientReady] = useState(false);
  const [liveSteps, setLiveSteps] = useState<LiveStep[]>(MOCK_LIVE_STEPS);
  const [liveContext, setLiveContext] = useState<string | undefined>(undefined);
  const [liveCurrentIndex, setLiveCurrentIndex] = useState(0);
  const [liveRemaining, setLiveRemaining] = useState(0);
  const [livePaused, setLivePaused] = useState(true);

  function resetAdaptiveDetailInputs() {
    setAdvancedThicknessEnabled(false);
    setSizePreset("medium");
    setWeightRange("medium");
    setVegetableFormat("halved");
  }

  const applyCookingNavContext = useCallback((cookingContext: CookingNavContext) => {
    const hasContext =
      cookingContext.animal || cookingContext.cut || cookingContext.doneness || cookingContext.thickness;
    if (!hasContext) return;

    const currentContext = cookingContextRef.current;
    const contextChanged = !isSameCookingContext(cookingContext, currentContext);

    if (cookingContext.animal) setAnimal(cookingContext.animal);
    if (cookingContext.cut) setCut(cookingContext.cut);
    if (cookingContext.doneness) {
      setDoneness(cookingContext.doneness);
    } else if (cookingContext.animal) {
      setDoneness(getInitialDoneness(cookingContext.animal));
    }
    if (cookingContext.thickness) {
      setThickness(cookingContext.thickness);
      setSizePreset(mapThicknessToSizePreset(cookingContext.thickness));
    }
    setAdvancedThicknessEnabled(false);
    setWeightRange("medium");
    setVegetableFormat("halved");
    if (contextChanged) {
      setBlocks({});
      setCheckedItems({});
      setSaveMenuStatus("idle");
      setSaveMenuMessage("");
      setShareStatus("idle");
      setShareMessage("");
      setShareMessageMenuId(null);
    }
  }, []);

  function commitNav(
    requestedMode: Mode,
    requestedCookingStep: CookingWizardStep,
    requestedMethod: "push" | "replace",
    cookingContext: CookingNavContext = {},
  ) {
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
        ? { mode, cookingStep, cookingContext: {} as CookingNavContext }
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
    const shouldPush =
      requestedMethod === "push" &&
      navChanged &&
      !isApplyingPopRef.current &&
      !isCutSelectionContextOnlyChange &&
      !isAnimalOnlyCutSelectionFilterChange;
    const method: "push" | "replace" = shouldPush ? "push" : "replace";

    setMode(nextMode);
    setCookingStep(nextCookingStep);

    if (typeof window === "undefined") return;
    const search = buildSearchFromNav(nextMode, nextCookingStep, nextCookingContext);
    const url = `${window.location.pathname}${search}${window.location.hash}`;
    const state = { mode: nextMode, cookingStep: nextCookingStep, cookingContext: nextCookingContext };
    if (
      process.env.NODE_ENV !== "production" &&
      nextMode === "coccion" &&
      nextCookingStep === "cut" &&
      contextChanged
    ) {
      console.debug("[cut-selection-animal] commitNav", {
        requestedMethod,
        resolvedMethod: method,
        from: window.location.search,
        to: search,
      });
    }

    if (method === "replace") {
      window.history.replaceState(state, "", url);
    } else {
      window.history.pushState(state, "", url);
    }
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
    if (normalizedSource && validDonenessIds.includes(normalizedSource as Doneness)) {
      return { value: normalizedSource, source: "state" as const };
    }
    const normalizedFallback = fallbackDoneness?.trim();
    if (normalizedFallback && validDonenessIds.includes(normalizedFallback as Doneness)) {
      return { value: normalizedFallback, source: "generated_context" as const };
    }
    return { value: getInitialDoneness(sourceAnimal), source: "animal_default" as const };
  }

  function pushCookingResultHistoryWithContext(fallbackContext?: { doneness?: string; thickness?: string }) {
    if (typeof window === "undefined") return;

    const currentUrlBeforePush = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const contextParams = getCurrentCookingNavigationParams();
    const sourceAnimal = contextParams.animal;
    const sourceCutId = contextParams.cutId;
    if (!sourceAnimal || !sourceCutId) {
      const homeUrl = buildHomeUrl();
      window.history.replaceState({ mode: "inicio", cookingStep: "animal", cookingContext: {} }, "", homeUrl);
      setMode("inicio");
      setCookingStep("animal");
      if (process.env.NODE_ENV !== "production") {
        console.debug("[nav] details->result missing context", { homeUrl });
      }
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
    const resultParams = {
      animal: sourceAnimal,
      cutId: sourceCutId,
      ...(resolvedDoneness.value ? { doneness: resolvedDoneness.value } : {}),
      ...(resolvedThickness ? { thickness: resolvedThickness } : {}),
    };
    const detailsUrl = buildCookingDetailsUrl(resultParams);
    const resultUrl = buildCookingResultUrl(resultParams);
    const currentNav = parseNavFromSearch(window.location.search);
    const isResultWithSameContext =
      currentNav.mode === "coccion" &&
      currentNav.cookingStep === "result" &&
      isSameCookingContext(currentNav.cookingContext, navContext);

    if (isResultWithSameContext) {
      setMode("coccion");
      setCookingStep("result");
      if (process.env.NODE_ENV !== "production") {
        console.debug("[nav] details->result skip duplicate push", {
          currentUrlBeforePush,
          resultUrl,
          donenessSource: resolvedDoneness.source,
        });
      }
      return;
    }

    commitNav("coccion", "details", "replace", navContext);
    commitNav("coccion", "result", "push", navContext);
    if (process.env.NODE_ENV !== "production") {
      console.debug("[nav] details->result push", {
        currentUrlBeforePush,
        detailsUrl,
        resultUrl,
        urlAfterPush: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        donenessSource: resolvedDoneness.source,
      });
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("parrillero_saved_menus");
    if (!stored) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;

      try {
        setSavedMenus(JSON.parse(stored) as SavedMenu[]);
      } catch {
        // Ignore malformed legacy localStorage data.
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Browser history + URL nav init ─────────────────────────────────────────
  // Parse mode/step from query params, initialize local nav state, then
  // canonicalize URL with replaceState so the first entry is always normalized.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = parseNavFromSearch(window.location.search);
    const raf = window.requestAnimationFrame(() => {
      applyCookingNavContext(nav.cookingContext);
      commitNav(nav.mode, nav.cookingStep, "replace", nav.cookingContext);
      navInitializedRef.current = true;
    });

    return () => window.cancelAnimationFrame(raf);
  }, [applyCookingNavContext]);

  // ── Browser history: restore state on popstate (back button / swipe) ───────
  // Registered once. URL query params are the source of truth for mode/step.
  // We still keep history.state shape compatibility, but restoration reads from
  // window.location.search only.
  useEffect(() => {
    function onPopState() {
      const nav = parseNavFromSearch(window.location.search);
      if (process.env.NODE_ENV !== "production") {
        console.debug("[nav] popstate apply", { search: window.location.search, mode: nav.mode, step: nav.cookingStep });
      }
      isApplyingPopRef.current = true;
      applyCookingNavContext(nav.cookingContext);
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
  }, [applyCookingNavContext]);

  useEffect(() => {
    if (isApplyingPopRef.current) return;
    const query = searchParams.toString();
    const nav = parseNavFromSearch(query ? `?${query}` : "");
    const currentCookingContext: CookingNavContext = {
      animal,
      ...(cut ? { cut } : {}),
      ...(doneness ? { doneness } : {}),
      ...(thickness ? { thickness } : {}),
    };
    const shouldCompareCookingContext =
      nav.mode === "coccion" || nav.mode === "cocina" || mode === "coccion" || mode === "cocina";
    const matchesCurrentCookingContext =
      !shouldCompareCookingContext || isSameCookingContext(nav.cookingContext, currentCookingContext);
    if (nav.mode === mode && nav.cookingStep === cookingStep && matchesCurrentCookingContext) return;

    isApplyingPopRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      applyCookingNavContext(nav.cookingContext);
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
  }, [searchParams, mode, cookingStep, animal, cut, doneness, thickness, applyCookingNavContext]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const query = searchParams.toString();
    const nav = parseNavFromSearch(query ? `?${query}` : "");
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
  }, [searchParams, cut]);

  const liveStep = liveSteps[liveCurrentIndex] ?? liveSteps[0];
  const liveIsLast = liveCurrentIndex === liveSteps.length - 1;
  const liveHasTimer = liveStep ? liveStep.duration > 0 : false;
  const liveCookComplete = mode === "cocina" && liveClientReady && liveIsLast && liveRemaining === 0;

  useEffect(() => {
    cookingContextRef.current = {
      animal,
      cut,
      doneness,
      thickness,
    };
  }, [animal, cut, doneness, thickness]);

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
      const built = buildLiveStepsFromPayload(safePayload, MOCK_LIVE_STEPS);

      if (!built.usedFallback && !hasDistinctLiveSteps(built.steps, MOCK_LIVE_STEPS)) {
        console.warn("[live-cooking] Live steps match mock signature unexpectedly", {
          payloadSignature: safePayload?.signature ?? "",
          liveSignature: built.signature,
          mockSignature: buildLiveStepsSignature(MOCK_LIVE_STEPS),
        });
      }

      setLiveSteps(built.steps);
      setLiveContext(safePayload ? built.context ?? liveFromUrl.context : liveFromUrl.context);
      setLiveCurrentIndex(0);
      setLiveRemaining((built.steps[0] ?? MOCK_LIVE_STEPS[0]).duration);
      setLivePaused(true);
      setLiveClientReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mode, lang, searchParams]);

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

  useEffect(() => {
    if (!liveCookComplete || cookCompleteModalFiredRef.current || isPro()) return;
    cookCompleteModalFiredRef.current = true;
    const id = window.setTimeout(() => setShowCookCompleteProModal(true), 2000);
    return () => window.clearTimeout(id);
  }, [liveCookComplete]);

  function updateSavedMenus(nextMenus: SavedMenu[]) {
    setSavedMenus(nextMenus);
    if (typeof window === "undefined") return;

    localStorage.setItem("parrillero_saved_menus", JSON.stringify(nextMenus));
  }

  function resetSaveMenuState() {
    setSaveMenuStatus("idle");
    setSaveMenuMessage("");
    setShareStatus("idle");
    setShareMessage("");
    setShareMessageMenuId(null);
  }

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

  function deleteMenu(id: string) {
    updateSavedMenus(savedMenus.filter((menu) => menu.id !== id));
    if (selectedSavedMenu?.id === id) setSelectedSavedMenu(null);
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
    setThickness(rebuilt.config.thickness);
    resetAdaptiveDetailInputs();
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

    saveLiveCookingPayload(payload);
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
      }),
    );
  }

  function updateSharedMenu(updatedMenu: SavedMenu) {
    const nextMenus = savedMenus.map((menu) => (menu.id === updatedMenu.id ? updatedMenu : menu));
    updateSavedMenus(nextMenus);
    if (selectedSavedMenu?.id === updatedMenu.id) setSelectedSavedMenu(updatedMenu);
  }

  async function publishMenu(menu: SavedMenu) {
    if (process.env.NODE_ENV === "development") {
      console.log("[share] selected item", menu);
    }

    if (isLocalSavedMenu(menu)) {
      setShareStatus("error");
      setShareMessage("Este plan solo está guardado en este dispositivo. Guárdalo en la nube para compartir.");
      setShareMessageMenuId(menu.id);
      return;
    }

    setSharingMenuId(menu.id);
    setShareStatus("publishing");
    setShareMessage("");
    setShareMessageMenuId(menu.id);

    try {
      const result = (await publishGeneratedMenu(menu.id)) as PublishSavedMenuResponse;
      if (process.env.NODE_ENV === "development") {
        console.log("[share] publish result", result);
      }

      if (!result.ok) {
        setShareStatus("error");
        setShareMessage(result.error || "No se pudo publicar el plan");
        return;
      }

      const published = result.menu;
      const updatedMenu = {
        ...menu,
        is_public: published.is_public,
        share_slug: published.share_slug,
      };
      updateSharedMenu(updatedMenu);
      setShareStatus("idle");
      setShareMessage("Plan publicado. Link listo para compartir.");

      if (published.share_slug && typeof window !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/share/${published.share_slug}`);
          setShareStatus("copied");
          setShareMessage("Link copiado");
        } catch {
          setShareStatus("idle");
          setShareMessage("Plan publicado. Link listo para compartir.");
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.log("[share] publish result", error);
      }
      setShareStatus("error");
      setShareMessage("No se pudo publicar el plan");
    } finally {
      setSharingMenuId(null);
    }
  }

  async function unpublishMenu(menu: SavedMenu) {
    if (isLocalSavedMenu(menu)) return;

    setSharingMenuId(menu.id);
    setShareStatus("publishing");
    setShareMessage("");
    setShareMessageMenuId(menu.id);

    try {
      const unpublished = await unpublishGeneratedMenu(menu.id);
      const updatedMenu = {
        ...menu,
        is_public: unpublished.is_public,
        share_slug: unpublished.share_slug,
      };
      updateSharedMenu(updatedMenu);
      setShareStatus("idle");
      setShareMessage("Plan privado");
    } catch {
      setShareStatus("error");
      setShareMessage("No se pudo cambiar la privacidad");
    } finally {
      setSharingMenuId(null);
    }
  }

  async function copyShareLink(menu: SavedMenu) {
    if (typeof window === "undefined" || !navigator.clipboard || !menu.share_slug) return;

    await navigator.clipboard.writeText(`${window.location.origin}/share/${menu.share_slug}`);
    setShareStatus("copied");
    setShareMessage("Link copiado");
    setShareMessageMenuId(menu.id);
  }

  function handleAnimalChange(selectedAnimal: AnimalLabel) {
    setAnimal(selectedAnimal);
    setCut("");
    resetAdaptiveDetailInputs();
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
    if (process.env.NODE_ENV !== "production") {
      const canonicalAnimal = animalIdsByLabel[nextAnimal];
      console.debug("[cut-selection-animal] replace", canonicalAnimal);
    }
  }

  function handleCutSelectionAnimalChange(selectedAnimalId: GeneratedAnimalId) {
    const selectedAnimal = animalLabelsById[selectedAnimalId] ?? animal;
    if (selectedAnimal === animal) return;

    setAnimal(selectedAnimal);
    setCut("");
    resetAdaptiveDetailInputs();
    setDoneness(getInitialDoneness(selectedAnimal));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    replaceCutSelectionAnimal(selectedAnimal);
    track({ name: "animal_selected", animal: selectedAnimal, lang });
  }

  function handleCutChange(selectedCutId: string) {
    setCut(selectedCutId);
    resetAdaptiveDetailInputs();
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    commitNav("coccion", "details", "push", {
      animal,
      cut: selectedCutId,
      doneness,
      thickness,
    });
    track({ name: "cut_selected", animal, cutId: selectedCutId, lang });
  }

  function handleCutSelectionStartCooking(profile: GeneratedCutProfile) {
    const selectedAnimal = animalLabelsById[profile.animalId] ?? animal;
    const selectedDoneness = profile.defaultDoneness ?? getInitialDoneness(selectedAnimal);
    const selectedThickness =
      profile.showThickness && Number.isFinite(profile.defaultThicknessCm)
        ? `${profile.defaultThicknessCm}`
        : "2";

    setAnimal(selectedAnimal);
    setCut(profile.id);
    resetAdaptiveDetailInputs();
    setDoneness(selectedDoneness);
    setThickness(selectedThickness);
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

      if (!parseAsMenu && process.env.NODE_ENV === "development") {
        console.log("[blocks] parsed", parsed);
        console.log("[blocks] normalized", normalized);
      }

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
      setShowProModal("planning");
    }
    commitNav(nextMode, nextStep, "push");
  }

  function handleModeChange(nextMode: Mode) {
    navigateMode(nextMode);
  }

  function handleSwipeNavigation(direction: SwipeDirection) {
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
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    if (!isMobileSwipeViewport() || isInteractiveSwipeTarget(event.target)) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || !isMobileSwipeViewport() || isInteractiveSwipeTarget(event.target)) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    if (horizontalDistance < 60 || horizontalDistance <= verticalDistance) return;

    handleSwipeNavigation(deltaX > 0 ? "back" : "forward");
  }

  function handleCompleteLiveStep() {
    if (liveIsLast) {
      setLiveRemaining(0);
      return;
    }

    const next = liveCurrentIndex + 1;
    setLiveCurrentIndex(next);
    setLiveRemaining((liveSteps[next] ?? liveSteps[liveSteps.length - 1]).duration);
    setLivePaused(false);
  }

  function handleGoToLiveStep(index: number) {
    setLiveCurrentIndex(index);
    setLiveRemaining((liveSteps[index] ?? liveSteps[liveSteps.length - 1]).duration);
    setLivePaused(false);
  }

  function handleLivePlanNavigation() {
    if (typeof window === "undefined") return;
    const { animal, cutId, doneness, thickness } = parseLiveParams(window.location.search);
    const targetUrl =
      animal && cutId
        ? buildCookingDetailsUrl({
            animal,
            cutId,
            doneness,
            thickness: thickness !== undefined ? String(thickness) : undefined,
          })
        : buildHomeUrl();
    if (process.env.NODE_ENV !== "production") {
      console.debug("[live-plan] navigating to", targetUrl);
    }
    router.push(targetUrl);
  }

  // ── Onboarding gate ─────────────────────────────────────────────────────────
  // Render a dark placeholder while localStorage hasn't been checked yet.
  // Body background matches so there is zero visible flash.
  if (showOnboarding === null) {
    return <div className="fixed inset-0 bg-[#020617]" aria-hidden />;
  }

  if (showOnboarding) {
    return (
      <OnboardingSlides
        onDone={() => setShowOnboarding(false)}
      />
    );
  }

  if (mode === "cocina") {
    return (
      <>
        {showCookCompleteProModal && (
          <ProModal
            trigger="cook_complete"
            onUpgrade={() => setShowCookCompleteProModal(false)}
            onDismiss={() => setShowCookCompleteProModal(false)}
          />
        )}
        <div className="bg-[#0a0a0a] md:flex md:min-h-screen md:items-start md:justify-center md:py-8">
          <div className="flex h-screen w-full flex-col overflow-hidden md:h-[844px] md:w-[390px] md:rounded-[3rem] md:border md:border-white/10 md:shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
            {!liveClientReady ? (
              <div className="flex flex-1 flex-col items-center justify-center bg-[#020202]">
                <div className="h-[3px] w-14 rounded-full bg-orange-500/35" />
              </div>
            ) : (
              <LiveCookingScreen
                steps={liveSteps}
                currentIndex={liveCurrentIndex}
                remaining={liveRemaining}
                paused={livePaused}
                context={liveContext}
                lang={lang}
                onBack={handleLivePlanNavigation}
                onPause={() => setLivePaused((value) => !value)}
                onCompleteStep={handleCompleteLiveStep}
                onGoToStep={handleGoToLiveStep}
                onSaveCook={() => persistSavedCook(liveSteps, liveContext)}
              />
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    {showProModal && (
      <ProModal
        trigger={showProModal}
        onUpgrade={() => setShowProModal(false)}
        onDismiss={() => setShowProModal(false)}
      />
    )}
    <main
      className={`${ds.shell.page} overflow-x-hidden px-3 pt-2 !pb-[max(120px,env(safe-area-inset-bottom))] sm:px-4 sm:pt-5 lg:px-8 lg:pt-6 lg:!pb-12 xl:px-10`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`${ds.shell.container} w-full lg:max-w-[1180px] xl:max-w-[1360px] 2xl:max-w-[1520px]`}>
        <DesktopModeTabs mode={mode} onModeChange={handleModeChange} t={t} />

        {mode === "inicio" && (
          <HomeScreen
            lang={lang}
            onLangChange={handleLanguageChange}
            savedMenusCount={savedMenus.length}
            t={t}
            onModeChange={handleModeChange}
          />
        )}

        {mode === "plan" && (
          <PlanHub
            blocks={blocks}
            difficulty={difficulty}
            equipment={equipment}
            loading={loading}
            menuMeats={menuMeats}
            onCopy={copyCurrentPlan}
            onEdit={editPlanExperience}
            onGenerate={generatePlanExperience}
            onSave={async () => {
              await saveCurrentMenu();
            }}
            onShare={shareCurrentPlan}
            people={people}
            parrilladaPeople={parrilladaPeople}
            parrilladaProducts={parrilladaProducts}
            parrilladaSides={parrilladaSides}
            planGenerated={planGenerated}
            planMode={planMode}
            planProduct={planProduct}
            saveMenuMessage={saveMenuMessage}
            saveMenuStatus={saveMenuStatus}
            serveTime={serveTime}
            setDifficulty={setDifficulty}
            setEquipment={setEquipment}
            setMenuMeats={setMenuMeats}
            setPeople={setPeople}
            setParrilladaPeople={setParrilladaPeople}
            setParrilladaProducts={setParrilladaProducts}
            setParrilladaSides={setParrilladaSides}
            setPlanMode={setPlanMode}
            setPlanProduct={setPlanProduct}
            setServeTime={setServeTime}
            setSides={setSides}
            sides={sides}
          />
        )}

        {mode === "coccion" && (
          cookingStep === "cut" ? (
            <CutSelectionScreen
              selectedAnimal={animalIdsByLabel[animal] as GeneratedAnimalId}
              isAnimalPreselected={Boolean(parseCookingAnimal(searchParams.get("animal")))}
              onAnimalChange={handleCutSelectionAnimalChange}
              onStartCooking={handleCutSelectionStartCooking}
            />
          ) : (
            <CookingWizard
              advancedThicknessEnabled={advancedThicknessEnabled}
              animal={animal}
              cookingStep={cookingStep}
              currentDonenessOptions={currentDonenessOptions}
              cut={cut}
              cuts={cuts}
              equipment={equipment}
              generateCookingPlan={generateCookingPlan}
              getAnimalPreview={getAnimalPreview}
              handleAnimalChange={handleAnimalChange}
              handleCutChange={handleCutChange}
              lang={lang}
              loading={loading}
              selectedCut={selectedCut}
              saveMenuMessage={saveMenuMessage}
              saveMenuStatus={saveMenuStatus}
              setCookingStep={navigateCookingStep}
              setAdvancedThicknessEnabled={(value) => {
                setAdvancedThicknessEnabled(value);
                resetSaveMenuState();
              }}
              setDoneness={(value) => {
                setDoneness(value);
                resetSaveMenuState();
              }}
              setEquipment={(value) => {
                setEquipment(value);
                resetSaveMenuState();
              }}
              setSizePreset={(value) => {
                setSizePreset(value);
                resetSaveMenuState();
              }}
              setThickness={(value) => {
                setThickness(value);
                resetSaveMenuState();
              }}
              setVegetableFormat={(value) => {
                setVegetableFormat(value);
                resetSaveMenuState();
              }}
              setWeightRange={(value) => {
                setWeightRange(value);
                resetSaveMenuState();
              }}
              sizePreset={sizePreset}
              showThickness={showThickness}
              onSaveMenu={async () => {
                await saveCurrentMenu();
              }}
              t={t}
              thickness={thickness}
              vegetableFormat={vegetableFormat}
              weightRange={weightRange}
              doneness={doneness}
              blocks={blocks}
              checkedItems={checkedItems}
              setCheckedItems={setCheckedItems}
            />
          )
        )}

        {mode === "menu" && (
          <Grid variant="split">
            <div className={ds.panel.form}>
              <h2 className="text-xl font-bold">{t.createMenu}</h2>

              <Input label={t.people} value={people} onChange={setPeople} placeholder="Ej: 6" />
              <Select
                label={t.eventType}
                value={eventType}
                onChange={setEventType}
                options={[
                  "cena con amigos",
                  "comida familiar",
                  "barbacoa informal",
                  "celebración especial",
                  "menú premium",
                ]}
              />
              <Input
                label={t.meats}
                value={menuMeats}
                onChange={setMenuMeats}
                placeholder="Ej: chuletón, secreto, maíz"
              />
              <Input
                label={t.sides}
                value={sides}
                onChange={setSides}
                placeholder="Ej: patatas, ensalada, chimichurri"
              />
              <Input label={t.budget} value={budget} onChange={setBudget} placeholder="Ej: 200" />
              <Select
                label={t.difficulty}
                value={difficulty}
                onChange={setDifficulty}
                options={["fácil", "medio", "avanzado"]}
              />
              <Select
                label={t.equipment}
                value={equipment}
                onChange={setEquipment}
                options={equipmentOptions}
              />

              <PrimaryButton
                onClick={generateMenuPlan}
                loading={loading}
                text={t.createMenu}
                loadingText={t.creating}
              />

              {(blocks.MENU || blocks.COMPRA || blocks.SHOPPING) && (
                <Button
                  className="px-5 py-4 font-bold"
                  fullWidth
                  onClick={saveCurrentMenu}
                  disabled={saveMenuStatus === "saving"}
                  variant="outlineAccent"
                >
                  {saveMenuStatus === "saving" ? t.savingMenu : t.saveMenu}
                </Button>
              )}

              {saveMenuMessage && (
                <p
                  className={
                    saveMenuStatus === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"
                  }
                >
                  {saveMenuMessage}
                </p>
              )}
            </div>

            <ResultCards
              blocks={blocks}
              loading={loading}
              checkedItems={checkedItems}
              setCheckedItems={setCheckedItems}
              onSaveMenu={
                blocks.MENU || blocks.COMPRA || blocks.SHOPPING
                  ? async () => {
                      await saveCurrentMenu();
                    }
                  : undefined
              }
              saveMenuStatus={saveMenuStatus}
              saveMenuMessage={saveMenuMessage}
              t={t}
            />
          </Grid>
        )}

        {mode === "parrillada" && (
          <Grid variant="split">
            <div className={ds.panel.form}>
              <h2 className="text-xl font-bold">{t.parrilladaPro}</h2>

              <Input
                label={t.people}
                value={parrilladaPeople}
                onChange={setParrilladaPeople}
                placeholder="Ej: 6"
              />
              <Input
                label={t.serveTime}
                value={serveTime}
                onChange={setServeTime}
                placeholder="Ej: 18:00"
              />
              <Input
                label={t.products}
                value={parrilladaProducts}
                onChange={setParrilladaProducts}
                placeholder="Ej: costillas, chuletón, secreto"
              />
              <Input
                label={t.sides}
                value={parrilladaSides}
                onChange={setParrilladaSides}
                placeholder="Ej: patatas, ensalada, chimichurri"
              />
              <Select
                label={t.equipment}
                value={equipment}
                onChange={setEquipment}
                options={equipmentOptions}
              />

              <Button className="px-5 py-4 font-bold" fullWidth onClick={generateParrillada}>
                {t.createParrillada}
              </Button>
            </div>

            <ResultCards
              blocks={blocks}
              loading={loading}
              checkedItems={checkedItems}
              onSaveMenu={
                Object.keys(blocks).length > 0
                  ? async () => {
                      await saveCurrentMenu();
                    }
                  : undefined
              }
              saveMenuMessage={saveMenuMessage}
              saveMenuStatus={saveMenuStatus}
              setCheckedItems={setCheckedItems}
              t={t}
            />
          </Grid>
        )}

        {mode === "guardados" && (
          <div>
            {/* ── Tab toggle: Planes | Cocciones ─────────────────────────── */}
            <div className="mb-5 flex gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1.5">
              <button
                type="button"
                onClick={() => setGuardadosTab("plans")}
                className={`flex-1 rounded-xl py-2 text-[12px] font-black transition-all duration-200 ${
                  guardadosTab === "plans"
                    ? "bg-orange-500 text-black shadow-[0_2px_12px_rgba(249,115,22,0.35)]"
                    : "text-white/45 hover:text-white/65"
                }`}
              >
                📋 Planes
              </button>
              <button
                type="button"
                onClick={() => setGuardadosTab("cooks")}
                className={`flex-1 rounded-xl py-2 text-[12px] font-black transition-all duration-200 ${
                  guardadosTab === "cooks"
                    ? "bg-orange-500 text-black shadow-[0_2px_12px_rgba(249,115,22,0.35)]"
                    : "text-white/45 hover:text-white/65"
                }`}
              >
                🔥 Cocciones
              </button>
            </div>

            {guardadosTab === "plans" && (
              <CookingResultScreen
                checkedItems={checkedItems}
                lang={lang}
                menus={savedMenus}
                selectedMenu={selectedSavedMenu}
                shareMessage={shareMessage}
                shareMessageMenuId={shareMessageMenuId}
                shareStatus={shareStatus}
                sharingMenuId={sharingMenuId}
                onBack={() => setSelectedSavedMenu(null)}
                onCopyLink={copyShareLink}
                onCopy={copySavedMenu}
                onDelete={deleteMenu}
                onOpen={loadMenu}
            onCookAgainLive={startSavedCookLive}
            onCookAgainReview={reviewSavedCook}
                onPublish={publishMenu}
                onUnpublish={unpublishMenu}
                setCheckedItems={setCheckedItems}
                t={t}
              />
            )}

            {guardadosTab === "cooks" && (
              <SavedCooksScreen
                onStartCooking={() => navigateMode("coccion")}
              />
            )}
          </div>
        )}
      </div>

      <AppBottomNav mode={mode} onModeChange={handleModeChange} t={t} />
    </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#020617]" aria-hidden />}>
      <HomeContent />
    </Suspense>
  );
}

