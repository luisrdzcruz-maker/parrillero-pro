"use client";

import { useRouter } from "next/navigation";
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
  type Blocks,
  type CookingWizardStep,
  type SaveMenuStatus,
  type SelectOption,
} from "@/components/cooking/CookingWizard";
import { HomeScreen } from "@/components/home/HomeScreen";
import {
  DesktopModeTabs,
  type Mode,
} from "@/components/navigation/AppHeader";
import { AppBottomNav } from "@/components/navigation/AppBottomNav";
import {
  CookingResultScreen,
  copySavedMenu,
  isLocalSavedMenu,
  type SavedMenu,
  type SavedMenuType,
  type ShareStatus,
} from "@/components/results/CookingResultScreen";
import { PlanHub, type PlanMode } from "@/components/planning/PlanHub";
import { Button, Card, Grid, Section } from "@/components/ui";
import { track } from "@/lib/analytics";
import type { AnimalId, CookingMethod, CookingStep, ProductCut } from "@/lib/cookingCatalog";
import { getCookingStepImage } from "@/lib/cookingVisuals";
import {
  generateCookingPlan as generateLocalCookingPlan,
  generateCookingSteps as generateLocalCookingSteps,
  getCutById,
  getCutsByAnimal,
  getDonenessOptions,
  shouldShowThickness,
} from "@/lib/cookingRules";
import { ds } from "@/lib/design-system";
import { texts, type AppText, type Lang } from "@/lib/i18n/texts";
import { animalIdsByLabel, type Animal } from "@/lib/media/animalMedia";
import { cutImages } from "@/lib/media/cutImages";
import {
  REQUIRED_COOKING_BLOCKS,
  REQUIRED_MENU_BLOCKS,
  REQUIRED_PARRILLADA_BLOCKS,
  normalizeBlocks,
} from "@/lib/parser/normalizeBlocks";
import { parseBlocks } from "@/lib/parser/parseBlocks";
import { generateParrilladaPlan } from "@/lib/parrilladaEngine";
import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";

type EngineLang = "es" | "en";
type CookingVisualContext = {
  animalId?: AnimalId;
  cutId?: string;
  method?: CookingMethod;
};

type SwipeDirection = "back" | "forward";
type TouchPoint = {
  x: number;
  y: number;
};

type SavedMenuActionMenu = {
  id: string;
  name: string;
  created_at: string;
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

const defaultCookSteps: CookingStep[] = [
  {
    title: "Precalentar",
    duration: 600,
    description: "Precalienta la parrilla con tapa cerrada.",
    image: getCookingStepImage({ stepTitle: "Precalentar" }),
    tips: ["Parrilla caliente", "Tapa cerrada", "Rejillas limpias"],
  },
  {
    title: "Sellar lado 1",
    duration: 180,
    description: "Carne en zona directa. No mover.",
    image: getCookingStepImage({ stepTitle: "Sellar lado 1" }),
    tips: ["No tocar", "Buscar costra", "No aplastar"],
  },
  {
    title: "Reposo",
    duration: 300,
    description: "Reposar antes de cortar.",
    image: getCookingStepImage({ stepTitle: "Reposo" }),
    tips: ["No cortar al momento", "Estabilizar jugos", "Cortar después del reposo"],
  },
];

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

function getCookingVisualContext(animal: Animal, cutId?: string): CookingVisualContext {
  const cut = cutId ? getCutById(cutId) : undefined;

  return {
    animalId: animalIdsByLabel[animal],
    cutId,
    method: cut?.defaultMethod,
  };
}

function withCookingStepImages(steps: CookingStep[], context: CookingVisualContext): CookingStep[] {
  return steps.map((step) => ({
    ...step,
    image: getCookingStepImage({
      animalId: context.animalId,
      cutId: context.cutId,
      method: context.method,
      stepTitle: `${step.title} ${step.description}`,
    }),
  }));
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

function buildCookStepsFromPlan(blocks: Blocks): CookingStep[] {
  const text = blocks.PASOS || blocks.STEPS || blocks.ORDEN || blocks.ORDER || "";
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length === 0) return defaultCookSteps;

  return lines.map((line) => {
    const lower = line.toLowerCase();
    let duration = 300;
    const image = getCookingStepImage({ stepTitle: line });

    if (lower.includes("precal") || lower.includes("preheat")) {
      duration = 600;
    }

    if (lower.includes("indirect")) {
      duration = 300;
    }

    if (lower.includes("repos") || lower.includes("rest")) {
      duration = 300;
    }

    return {
      title: line.length > 32 ? line.slice(0, 32) + "..." : line,
      duration,
      description: line,
      image,
      tips: [],
    };
  });
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

export default function Home() {
  const [lang, setLang] = useState<Lang>("es");
  const t = texts[lang];

  const [mode, setMode] = useState<Mode>("inicio");
  const [cookingStep, setCookingStep] = useState<CookingWizardStep>("animal");

  const [animal, setAnimal] = useState<Animal>("Vacuno");
  const [cut, setCut] = useState("");
  const [weight, setWeight] = useState("1");
  const [thickness, setThickness] = useState("5");
  const [doneness, setDoneness] = useState("rare");
  const [equipment, setEquipment] = useState("parrilla gas");

  const [people, setPeople] = useState("4");
  const [eventType, setEventType] = useState("cena con amigos");
  const [menuMeats, setMenuMeats] = useState("chuletón, secreto ibérico");
  const [sides, setSides] = useState("patatas, ensalada, chimichurri");
  const [budget, setBudget] = useState("200");
  const [difficulty, setDifficulty] = useState("medio");
  const [planMode, setPlanMode] = useState<PlanMode>("rapido");
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

  const [cookSteps, setCookSteps] = useState<CookingStep[]>(defaultCookSteps);
  const touchStartRef = useRef<TouchPoint | null>(null);
  const modeHistoryRef = useRef<Mode[]>([]);

  const cuts = useMemo(() => getCutItems(animal, lang), [animal, lang]);
  const selectedCut = cuts.find((item) => item.id === cut);

  const currentDonenessOptions = getDonenessSelectOptions(animal, lang);
  const showThickness = cut ? shouldShowThickness(cut) : true;

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
    setDoneness(getInitialDoneness(selectedAnimal));
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    setCookingStep("cut");
    track({ name: "animal_selected", animal: selectedAnimal, lang });
  }

  function handleCutChange(selectedCutId: string) {
    setCut(selectedCutId);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
    setCookingStep("details");
    track({ name: "cut_selected", animal, cutId: selectedCutId, lang });
  }

  async function callAI(
    message: string,
    createCookSteps = false,
    visualContext?: CookingVisualContext,
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

      if (createCookSteps) {
        const baseSteps = buildCookStepsFromPlan(normalized);
        const steps = visualContext ? withCookingStepImages(baseSteps, visualContext) : baseSteps;
        setCookSteps(steps);
      }
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
    const visualContext = getCookingVisualContext(animal, cut);
    const input = {
      animal,
      cut,
      weightKg: weight,
      thicknessCm: showThickness ? thickness : "2",
      doneness,
      equipment,
      language: engineLang(lang),
    };

    const localPlan = generateLocalCookingPlan(input);
    const localSteps = generateLocalCookingSteps(input);

    if (localPlan && localSteps) {
      track({ name: "cooking_plan_result", path: "local" });
      const normalizedPlan = normalizeBlocks(localPlan, REQUIRED_COOKING_BLOCKS, "cooking_plan");
      const visualSteps = withCookingStepImages(localSteps, visualContext);
      setBlocks(normalizedPlan);
      setCheckedItems({});
      resetSaveMenuState();
      setCookSteps(visualSteps);
      setCookingStep("result");
      return;
    }

    track({ name: "cooking_ai_fallback" });
    const ok = await callAI(
      `
Language: ${engineLang(lang) === "es" ? "Spanish" : "English"}.
Animal: ${animal}
Cut: ${selectedCut?.name ?? cut}
Weight: ${weight} kg
Thickness: ${showThickness ? thickness : "not relevant"} cm
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
      visualContext,
    );
    if (ok) {
      track({ name: "cooking_plan_result", path: "ai" });
    }
    setCookingStep("result");
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
`, false, undefined, true);
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
`, false, undefined, true);

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

  function exitLiveCooking() {
    setMode("coccion");
    setCookingStep("result");
  }

  function handleLanguageChange(nextLang: Lang) {
    setLang(nextLang);
    setBlocks({});
    setCheckedItems({});
    setPlanGenerated(false);
    resetSaveMenuState();
  }

  function navigateMode(nextMode: Mode, trackHistory = true) {
    if (nextMode === mode) return;
    if (trackHistory) modeHistoryRef.current = [...modeHistoryRef.current.slice(-8), mode];
    if (nextMode === "coccion") setCookingStep("animal");
    if (nextMode !== "guardados") setSelectedSavedMenu(null);
    setMode(nextMode);
  }

  function handleModeChange(nextMode: Mode) {
    navigateMode(nextMode);
  }

  function handleSwipeNavigation(direction: SwipeDirection) {
    if (direction === "back") {
      if (mode === "coccion") {
        if (cookingStep === "result") {
          setCookingStep("details");
          return;
        }

        if (cookingStep === "details") {
          setCookingStep("cut");
          return;
        }

        if (cookingStep === "cut") {
          setCookingStep("animal");
          return;
        }

        if (cookingStep === "animal") {
          return;
        }

        return;
      }

      if (modeHistoryRef.current.length > 0) {
        const previousMode = modeHistoryRef.current[modeHistoryRef.current.length - 1];
        modeHistoryRef.current = modeHistoryRef.current.slice(0, -1);
        navigateMode(previousMode, false);
      }

      return;
    }

    if (mode !== "coccion") return;

    if (cookingStep === "animal" && animal) {
      setCookingStep("cut");
      return;
    }

    if (cookingStep === "cut" && selectedCut) {
      setCookingStep("details");
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

  return (
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
          <CookingWizard
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
            setDoneness={(value) => {
              setDoneness(value);
              resetSaveMenuState();
            }}
            setEquipment={(value) => {
              setEquipment(value);
              resetSaveMenuState();
            }}
            setMode={setMode}
            setThickness={(value) => {
              setThickness(value);
              resetSaveMenuState();
            }}
            setWeight={(value) => {
              setWeight(value);
              resetSaveMenuState();
            }}
            showThickness={showThickness}
            onSaveMenu={async () => {
              await saveCurrentMenu();
            }}
            t={t}
            weight={weight}
            thickness={thickness}
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
            onPublish={publishMenu}
            onUnpublish={unpublishMenu}
            setCheckedItems={setCheckedItems}
            t={t}
          />
        )}
      </div>

      {mode !== "cocina" && <AppBottomNav mode={mode} onModeChange={handleModeChange} t={t} />}
    </main>
  );
}

function copySavedMenu(menu: SavedMenu) {
  if (typeof window === "undefined" || !navigator.clipboard) return;

  navigator.clipboard.writeText(buildText(menu.blocks));
}

function SavedMenusSection({
  lang,
  menus,
  onCopyLink,
  onCopy,
  onDelete,
  onOpen,
  onPublish,
  onUnpublish,
  shareMessage,
  shareMessageMenuId,
  shareStatus,
  sharingMenuId,
  t,
}: {
  lang: Lang;
  menus: SavedMenu[];
  onCopyLink: (menu: SavedMenu) => void;
  onCopy: (menu: SavedMenu) => void;
  onDelete: (id: string) => void;
  onOpen: (menu: SavedMenu) => void;
  onPublish: (menu: SavedMenu) => void;
  onUnpublish: (menu: SavedMenu) => void;
  shareMessage: string;
  shareMessageMenuId: string | null;
  shareStatus: ShareStatus;
  sharingMenuId: string | null;
  t: AppText;
}) {
  return (
    <Section eyebrow={`${menus.length} ${t.saved}`} title={t.savedMenus}>
      {menus.length === 0 && <Card tone="empty">{t.noSaved}</Card>}

      <Grid>
        {menus.map((menu) => (
          <Card key={menu.id}>
            <p className="text-sm font-medium text-orange-300">
              {getSavedMenuTypeLabel(getSavedMenuType(menu), lang)}
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">{menu.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{menu.date}</p>
            {menu.is_public && menu.share_slug ? (
              <p className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
                /share/{menu.share_slug}
              </p>
            ) : isLocalSavedMenu(menu) ? (
              <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">
                Este plan solo está guardado en este dispositivo. Guárdalo en la nube para compartir.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => onOpen(menu)}>{lang === "es" ? "Abrir" : "Open"}</Button>
              <Button onClick={() => onCopy(menu)} variant="secondary">
                {t.copy}
              </Button>
              {menu.is_public && menu.share_slug ? (
                <>
                  <Button onClick={() => onCopyLink(menu)} variant="outlineAccent">
                    Copiar link
                  </Button>
                  <Button
                    onClick={() => onUnpublish(menu)}
                    variant="secondary"
                    disabled={sharingMenuId === menu.id}
                  >
                    {sharingMenuId === menu.id ? "Actualizando..." : "Despublicar"}
                  </Button>
                </>
              ) : isLocalSavedMenu(menu) ? null : (
                <Button
                  onClick={() => onPublish(menu)}
                  variant="outlineAccent"
                  disabled={sharingMenuId === menu.id}
                >
                  {getShareButtonLabel({
                    isPublic: false,
                    isSharing: sharingMenuId === menu.id,
                    shareStatus: shareMessageMenuId === menu.id ? shareStatus : "idle",
                  })}
                </Button>
              )}
              <Button onClick={() => onDelete(menu.id)} variant="danger">
                {lang === "es" ? "Borrar" : "Delete"}
              </Button>
            </div>
            {shareMessage && shareMessageMenuId === menu.id && (
              <p className="mt-3 text-xs font-bold text-emerald-300">{shareMessage}</p>
            )}
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

function SavedMenuDetail({
  checkedItems,
  lang,
  menu,
  onBack,
  onCopyLink,
  onCopy,
  onPublish,
  onUnpublish,
  shareMessage,
  shareMessageMenuId,
  shareStatus,
  sharingMenuId,
  setCheckedItems,
  t,
}: {
  checkedItems: Record<string, boolean>;
  lang: Lang;
  menu: SavedMenu;
  onBack: () => void;
  onCopyLink: (menu: SavedMenu) => void;
  onCopy: (menu: SavedMenu) => void;
  onPublish: (menu: SavedMenu) => void;
  onUnpublish: (menu: SavedMenu) => void;
  shareMessage: string;
  shareMessageMenuId: string | null;
  shareStatus: ShareStatus;
  sharingMenuId: string | null;
  setCheckedItems: (value: Record<string, boolean>) => void;
  t: AppText;
}) {
  const type = getSavedMenuType(menu);
  const isLocal = isLocalSavedMenu(menu);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-orange-300">{getSavedMenuTypeLabel(type, lang)}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{menu.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{menu.date}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onBack} variant="secondary">
              {lang === "es" ? "Volver" : "Back"}
            </Button>
            <Button onClick={() => onCopy(menu)} variant="outlineAccent">
              {t.copy}
            </Button>
            {menu.is_public && menu.share_slug ? (
              <>
                <Button onClick={() => onCopyLink(menu)} variant="outlineAccent">
                  Copiar link
                </Button>
                <Button
                  onClick={() => onUnpublish(menu)}
                  variant="secondary"
                  disabled={sharingMenuId === menu.id}
                >
                  {sharingMenuId === menu.id ? "Actualizando..." : "Despublicar"}
                </Button>
              </>
            ) : isLocal ? null : (
              <Button
                onClick={() => onPublish(menu)}
                variant="outlineAccent"
                disabled={sharingMenuId === menu.id}
              >
                {getShareButtonLabel({
                  isPublic: false,
                  isSharing: sharingMenuId === menu.id,
                  shareStatus: shareMessageMenuId === menu.id ? shareStatus : "idle",
                })}
              </Button>
            )}
          </div>
        </div>
        {menu.is_public && menu.share_slug ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
            /share/{menu.share_slug}
          </div>
        ) : isLocal ? (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300">
            Este plan solo está guardado en este dispositivo. Guárdalo en la nube para compartir.
          </p>
        ) : null}
        {shareMessage && shareMessageMenuId === menu.id && (
          <p className="mt-3 text-sm font-bold text-emerald-300">{shareMessage}</p>
        )}
      </Card>

      <ResultCards
        blocks={menu.blocks}
        checkedItems={checkedItems}
        loading={false}
        saveMenuMessage=""
        saveMenuStatus="idle"
        setCheckedItems={setCheckedItems}
        t={t}
      />
    </div>
  );
}
