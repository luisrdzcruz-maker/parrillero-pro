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
import { createLiveCookingPayload, saveLiveCookingPayload } from "@/lib/liveCookingPlan";
import { animalIdsByLabel, type Animal } from "@/lib/media/animalMedia";
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
import { useRouter } from "next/navigation";
import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";

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
  animal: Animal;
  cut: string;
  weight: string;
  thickness: string;
  doneness: string;
  equipment: string;
  lang: Lang;
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

function parseSavedAnimal(value: unknown, fallback: Animal): Animal {
  const text = asText(value);
  if (text && text in animalIdsByLabel) return text as Animal;
  return fallback;
}

function parseSavedCookConfig(
  menu: SavedMenu,
  fallback: {
    animal: Animal;
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

function getInitialDoneness(animal: Animal) {
  return getDonenessOptions(animalIdsByLabel[animal])[0]?.id ?? "";
}

function getDonenessSelectOptions(animal: Animal, lang: Lang): SelectOption[] {
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

function getCutItems(animal: Animal, lang: Lang): CutItem[] {
  return getCutsByAnimal(animalIdsByLabel[animal]).map((cut) => ({
    id: cut.id,
    name: getCutName(cut, lang),
    image: cutImages[cut.id] ?? "/images/vacuno/ribeye-cooked.webp",
    description: getCutDescription(cut, lang),
  }));
}

function getAnimalPreview(animal: Animal, lang: Lang) {
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

function isAllowedMode(value: string | null): value is Mode {
  return value != null && ALLOWED_MODES.includes(value as Mode);
}

function isAllowedCookingStep(value: string | null): value is CookingWizardStep {
  return value != null && ALLOWED_COOKING_STEPS.includes(value as CookingWizardStep);
}

function parseNavFromSearch(search: string): { mode: Mode; cookingStep: CookingWizardStep } {
  const params = new URLSearchParams(search);
  const modeParam = params.get("mode");
  const stepParam = params.get("step");

  const mode: Mode = isAllowedMode(modeParam) ? modeParam : "inicio";
  const cookingStep: CookingWizardStep =
    mode === "coccion" && isAllowedCookingStep(stepParam) ? stepParam : "animal";

  return { mode, cookingStep };
}

function buildSearchFromNav(mode: Mode, cookingStep: CookingWizardStep): string {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (mode === "coccion") {
    params.set("step", cookingStep);
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

function mapBeefLargeWeightPresetToKg(weightRange: CookingWeightRange): string {
  if (weightRange === "light") return "0.9";
  if (weightRange === "large") return "1.6";
  return "1.2";
}

export default function Home() {
  const router = useRouter();

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

  const [animal, setAnimal] = useState<Animal>("Vacuno");
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

  const cuts = useMemo(() => getCutItems(animal, lang), [animal, lang]);
  const selectedCut = cuts.find((item) => item.id === cut);

  const currentDonenessOptions = getDonenessSelectOptions(animal, lang);
  const showThickness = cut ? shouldShowThickness(cut) : true;

  function resetAdaptiveDetailInputs() {
    setAdvancedThicknessEnabled(false);
    setSizePreset("medium");
    setWeightRange("medium");
    setVegetableFormat("halved");
  }

  function commitNav(
    nextMode: Mode,
    nextCookingStep: CookingWizardStep,
    method: "push" | "replace",
  ) {
    if (isApplyingPopRef.current && method === "push") return;

    const mode = isAllowedMode(nextMode) ? nextMode : "inicio";
    const cookingStep =
      mode === "coccion" && isAllowedCookingStep(nextCookingStep) ? nextCookingStep : "animal";

    setMode(mode);
    setCookingStep(cookingStep);

    if (typeof window === "undefined") return;
    const search = buildSearchFromNav(mode, cookingStep);
    const url = `${window.location.pathname}${search}${window.location.hash}`;
    const state = { mode, cookingStep };

    if (method === "replace") {
      window.history.replaceState(state, "", url);
    } else {
      window.history.pushState(state, "", url);
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
      commitNav(nav.mode, nav.cookingStep, "replace");
    });

    return () => window.cancelAnimationFrame(raf);
  }, []);

  // ── Browser history: restore state on popstate (back button / swipe) ───────
  // Registered once. URL query params are the source of truth for mode/step.
  // We still keep history.state shape compatibility, but restoration reads from
  // window.location.search only.
  useEffect(() => {
    function onPopState() {
      const nav = parseNavFromSearch(window.location.search);
      isApplyingPopRef.current = true;
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
  }, []);

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
    commitNav("coccion", "result", "push");
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
    router.push("/coccion-live");
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

  function handleAnimalChange(selectedAnimal: Animal) {
    setAnimal(selectedAnimal);
    setCut("");
    resetAdaptiveDetailInputs();
    setDoneness(getInitialDoneness(selectedAnimal));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    commitNav("coccion", "cut", "push");
    track({ name: "animal_selected", animal: selectedAnimal, lang });
  }

  function handleCutChange(selectedCutId: string) {
    setCut(selectedCutId);
    resetAdaptiveDetailInputs();
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    commitNav("coccion", "details", "push");
    track({ name: "cut_selected", animal, cutId: selectedCutId, lang });
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
      commitNav("coccion", "result", "push");
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
    commitNav("coccion", "result", "push");
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
    const nextStep: CookingWizardStep = nextMode === "coccion" ? "animal" : cookingStep;
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

  // Tap a protein card on Home → pre-select animal, jump to cut step
  function handleQuickAnimal(selectedAnimal: Animal) {
    handleAnimalChange(selectedAnimal); // sets animal, clears cut, cookingStep → "cut"
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
      commitNav("coccion", "cut", "push");
      return;
    }

    if (cookingStep === "cut" && selectedCut) {
      commitNav("coccion", "details", "push");
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
            onStartCookingWith={handleQuickAnimal}
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
            setCookingStep={setCookingStep}
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

        {/* Live cooking → /coccion-live (AppHeader.tsx intercepts mode "cocina" and navigates there) */}

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

      {mode !== "cocina" && <AppBottomNav mode={mode} onModeChange={handleModeChange} t={t} />}
    </main>
    </>
  );
}

