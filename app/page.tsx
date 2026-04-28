"use client";

import {
  publishGeneratedMenu,
  saveGeneratedMenu,
  unpublishGeneratedMenu,
} from "@/app/actions/savedMenus";
import CookingLiveMode from "@/components/CookingLiveMode";
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
  AppHeader,
  BottomNavigation,
  DesktopModeTabs,
  type Mode,
} from "@/components/navigation/AppHeader";
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

type SavedMenu = {
  id: string;
  title: string;
  date: string;
  blocks: Blocks;
  type?: SavedMenuType;
  is_public?: boolean;
  share_slug?: string | null;
};

type SavedMenuType = "cooking_plan" | "generated_menu" | "parrillada_plan";
type ShareStatus = "idle" | "publishing" | "copied" | "error";

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

function hasLocalEngine(animal: Animal) {
  return Boolean(animalIdsByLabel[animal]);
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
    image: cutImages[cut.id] ?? "/cuts/placeholder.jpg",
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

function getSavedMenuTypeLabel(type: SavedMenuType, lang: Lang) {
  if (type === "cooking_plan") return lang === "es" ? "Cocción" : "Cooking";
  if (type === "parrillada_plan") return "Parrillada";
  return lang === "es" ? "Menú" : "Menu";
}

function getSavedMenuType(menu: SavedMenu): SavedMenuType {
  return menu.type ?? "generated_menu";
}

function isLocalSavedMenu(menu: Pick<SavedMenu, "id">) {
  return !menu.id || menu.id.startsWith("local_");
}

function getShareButtonLabel({
  isPublic,
  isSharing,
  shareStatus,
}: {
  isPublic: boolean;
  isSharing: boolean;
  shareStatus: ShareStatus;
}) {
  if (isSharing || shareStatus === "publishing") return "Publicando...";
  if (isPublic || shareStatus === "copied") return "Copiar link";
  return "Publicar";
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

function buildText(blocks: Blocks) {
  return Object.keys(blocks)
    .map((key) => `${key}\n${blocks[key]}`)
    .join("\n\n");
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

  const [people, setPeople] = useState("6");
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
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultCookSteps[0].duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [cookingAlertsEnabled, setCookingAlertsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [cookingAlertMessage, setCookingAlertMessage] = useState("");
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

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          notifyStepFinished();

          setTimeout(() => {
            setCurrentStep((previous) => {
              const next = Math.min(previous + 1, cookSteps.length - 1);
              setTimeLeft(cookSteps[next]?.duration ?? 0);
              return next;
            });
          }, 800);

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, currentStep, cookSteps.length]);

  function notifyStepFinished() {
    if (typeof window === "undefined") return;

    const nextStep = cookSteps[Math.min(currentStep + 1, cookSteps.length - 1)];
    const message = nextStep ? `Siguiente paso: ${nextStep.title}` : "Plan de cocción completado.";

    try {
      const audio = new Audio("/sounds/beep.mp3");
      audio.play().catch(() => {});
    } catch {}

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    setCookingAlertMessage(message);
    window.setTimeout(() => setCookingAlertMessage(""), 5000);

    if (cookingAlertsEnabled && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Parrillero Pro", { body: message });
      } catch {}
    }
  }

  async function enableCookingAlerts() {
    setCookingAlertsEnabled(true);

    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return;
    }

    setNotificationPermission(Notification.permission);
  }

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
        setCurrentStep(0);
        setTimeLeft(steps[0].duration);
        setTimerRunning(false);
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
      setCurrentStep(0);
      setTimeLeft(visualSteps[0].duration);
      setTimerRunning(false);
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

  function nextCookStep() {
    const next = Math.min(currentStep + 1, cookSteps.length - 1);
    setCurrentStep(next);
    setTimeLeft(cookSteps[next].duration);
    setTimerRunning(false);
  }

  function previousCookStep() {
    const previous = Math.max(currentStep - 1, 0);
    setCurrentStep(previous);
    setTimeLeft(cookSteps[previous].duration);
    setTimerRunning(false);
  }

  function goToCookStep(stepIndex: number) {
    const next = Math.max(0, Math.min(stepIndex, cookSteps.length - 1));
    setCurrentStep(next);
    setTimeLeft(cookSteps[next].duration);
    setTimerRunning(false);
  }

  function resetCookMode() {
    setCurrentStep(0);
    setTimeLeft(cookSteps[0].duration);
    setTimerRunning(false);
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
      className={`${ds.shell.page} overflow-x-hidden px-3 pt-2 !pb-[max(120px,env(safe-area-inset-bottom))] sm:px-4 sm:pt-5 md:!pb-28`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={ds.shell.container}>
        <AppHeader lang={lang} onLangChange={handleLanguageChange} t={t} />
        <DesktopModeTabs mode={mode} onModeChange={handleModeChange} t={t} />

        {mode === "inicio" && (
          <HomeScreen savedMenusCount={savedMenus.length} t={t} onModeChange={handleModeChange} />
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
            hasLocalEngine={hasLocalEngine}
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
            setTimerRunning={setTimerRunning}
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

        {mode === "cocina" && (
          <CookingLiveMode
            context={[animal, selectedCut?.name, equipment].filter(Boolean).join(" · ")}
            lang={lang}
            cookSteps={cookSteps}
            currentStep={currentStep}
            cookingAlertsEnabled={cookingAlertsEnabled}
            cookingAlertMessage={cookingAlertMessage}
            hasCookingPlan={Boolean(blocks.PASOS || blocks.STEPS)}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            notificationPermission={notificationPermission}
            onBackToPlan={() => navigateMode("coccion")}
            onEnableAlerts={enableCookingAlerts}
            onNextStep={nextCookStep}
            onPreviousStep={previousCookStep}
            setTimerRunning={setTimerRunning}
            onGoToStep={goToCookStep}
            onCompleteStep={nextCookStep}
            onReset={resetCookMode}
          />
        )}

        {mode === "guardados" && (
          selectedSavedMenu ? (
            <SavedMenuDetail
              checkedItems={checkedItems}
              lang={lang}
              menu={selectedSavedMenu}
              onBack={() => setSelectedSavedMenu(null)}
              onCopyLink={copyShareLink}
              onCopy={copySavedMenu}
              onPublish={publishMenu}
              onUnpublish={unpublishMenu}
              shareMessage={shareMessage}
              shareMessageMenuId={shareMessageMenuId}
              shareStatus={shareStatus}
              sharingMenuId={sharingMenuId}
              setCheckedItems={setCheckedItems}
              t={t}
            />
          ) : (
            <SavedMenusSection
              lang={lang}
              menus={savedMenus}
              onCopyLink={copyShareLink}
              onCopy={copySavedMenu}
              onDelete={deleteMenu}
              onOpen={loadMenu}
              onPublish={publishMenu}
              onUnpublish={unpublishMenu}
              shareMessage={shareMessage}
              shareMessageMenuId={shareMessageMenuId}
              shareStatus={shareStatus}
              sharingMenuId={sharingMenuId}
              t={t}
            />
          )
        )}
      </div>

      {mode !== "cocina" && <BottomNavigation mode={mode} onModeChange={handleModeChange} t={t} />}
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
/*
import CookingLiveMode from "@/components/CookingLiveMode";
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
  AppHeader,
  BottomNavigation,
  DesktopModeTabs,
  type Mode,
} from "@/components/navigation/AppHeader";
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

type SavedMenu = {
  id: string;
  title: string;
  date: string;
  blocks: Blocks;
};

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

function hasLocalEngine(animal: Animal) {
  return Boolean(animalIdsByLabel[animal]);
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
    image: cutImages[cut.id] ?? "/cuts/placeholder.jpg",
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

function buildText(blocks: Blocks) {
  return Object.keys(blocks)
    .map((key) => `${key}\n${blocks[key]}`)
    .join("\n\n");
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

  const [people, setPeople] = useState("6");
  const [eventType, setEventType] = useState("cena con amigos");
  const [menuMeats, setMenuMeats] = useState("chuletón, secreto ibérico");
  const [sides, setSides] = useState("patatas, ensalada, chimichurri");
  const [budget, setBudget] = useState("200");
  const [difficulty, setDifficulty] = useState("medio");

  const [parrilladaPeople, setParrilladaPeople] = useState("6");
  const [serveTime, setServeTime] = useState("18:00");
  const [parrilladaProducts, setParrilladaProducts] = useState(
    "costillas, chuletón, secreto ibérico, maíz",
  );
  const [parrilladaSides, setParrilladaSides] = useState("patatas, ensalada, chimichurri");

  const [blocks, setBlocks] = useState<Blocks>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveMenuStatus, setSaveMenuStatus] = useState<SaveMenuStatus>("idle");
  const [saveMenuMessage, setSaveMenuMessage] = useState("");

  const [cookSteps, setCookSteps] = useState<CookingStep[]>(defaultCookSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultCookSteps[0].duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [cookingAlertsEnabled, setCookingAlertsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [cookingAlertMessage, setCookingAlertMessage] = useState("");
  const touchStartRef = useRef<TouchPoint | null>(null);
  const modeHistoryRef = useRef<Mode[]>([]);

  const cuts = useMemo(() => getCutItems(animal, lang), [animal, lang]);
  const selectedCut = cuts.find((item) => item.id === cut);

  const currentDonenessOptions = getDonenessSelectOptions(animal, lang);
  const showThickness = cut ? shouldShowThickness(cut) : true;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("parrillero_saved_menus");
    if (stored) setSavedMenus(JSON.parse(stored) as SavedMenu[]);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          notifyStepFinished();

          setTimeout(() => {
            setCurrentStep((previous) => {
              const next = Math.min(previous + 1, cookSteps.length - 1);
              setTimeLeft(cookSteps[next]?.duration ?? 0);
              return next;
            });
          }, 800);

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, currentStep, cookSteps.length]);

  useEffect(() => {
    if (mode === "coccion") setCookingStep("animal");
  }, [mode]);

  function notifyStepFinished() {
    if (typeof window === "undefined") return;

    const nextStep = cookSteps[Math.min(currentStep + 1, cookSteps.length - 1)];
    const message = nextStep ? `Siguiente paso: ${nextStep.title}` : "Plan de cocción completado.";

    try {
      const audio = new Audio("/sounds/beep.mp3");
      audio.play().catch(() => {});
    } catch {}

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    setCookingAlertMessage(message);
    window.setTimeout(() => setCookingAlertMessage(""), 5000);

    if (
      cookingAlertsEnabled &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Parrillero Pro", { body: message });
      } catch {}
    }
  }

  async function enableCookingAlerts() {
    setCookingAlertsEnabled(true);

    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return;
    }

    setNotificationPermission(Notification.permission);
  }

  function updateSavedMenus(nextMenus: SavedMenu[]) {
    setSavedMenus(nextMenus);
    if (typeof window === "undefined") return;

    localStorage.setItem("parrillero_saved_menus", JSON.stringify(nextMenus));
  }

  function resetSaveMenuState() {
    setSaveMenuStatus("idle");
    setSaveMenuMessage("");
  }

  async function saveCurrentMenu() {
    if (typeof window === "undefined") return;
    if (!hasSavableBlocks(blocks)) {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
      return;
    }

    const now = new Date();
    const dateLabel = now.toLocaleDateString(localeForLang(lang));
    const savedType: SavedMenuType =
      mode === "coccion" ? "cooking_plan" : mode === "parrillada" ? "parrillada_plan" : "generated_menu";
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

    setSaveMenuStatus("saving");
    setSaveMenuMessage("");

    try {
      const safeBlocks = getSafeBlocksForSave(blocks, savedType);
      if (Object.keys(safeBlocks).length === 0) {
        setSaveMenuStatus("error");
        setSaveMenuMessage(t.menuSaveError);
        return;
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
                products: menuMeats,
                menuMeats,
                sides,
                budget,
                difficulty,
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
        return;
      }

      const savedMenu = "ok" in savedMenuResult ? savedMenuResult.menu : savedMenuResult;

      const newMenu: SavedMenu = {
        id: savedMenu.id,
        title: savedMenu.name,
        date: new Date(savedMenu.created_at).toLocaleDateString(localeForLang(lang)),
        blocks: safeBlocks,
        type: savedType,
      };

      updateSavedMenus([newMenu, ...savedMenus.filter((menu) => menu.id !== newMenu.id)]);
      setSaveMenuStatus("success");
      setSaveMenuMessage(t.menuSaved);
    } catch {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
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
        setCurrentStep(0);
        setTimeLeft(steps[0].duration);
        setTimerRunning(false);
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
      setCurrentStep(0);
      setTimeLeft(visualSteps[0].duration);
      setTimerRunning(false);
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

  function nextCookStep() {
    const next = Math.min(currentStep + 1, cookSteps.length - 1);
    setCurrentStep(next);
    setTimeLeft(cookSteps[next].duration);
    setTimerRunning(false);
  }

  function previousCookStep() {
    const previous = Math.max(currentStep - 1, 0);
    setCurrentStep(previous);
    setTimeLeft(cookSteps[previous].duration);
    setTimerRunning(false);
  }

  function goToCookStep(stepIndex: number) {
    const next = Math.max(0, Math.min(stepIndex, cookSteps.length - 1));
    setCurrentStep(next);
    setTimeLeft(cookSteps[next].duration);
    setTimerRunning(false);
  }

  function resetCookMode() {
    setCurrentStep(0);
    setTimeLeft(cookSteps[0].duration);
    setTimerRunning(false);
  }

  function handleLanguageChange(nextLang: Lang) {
    setLang(nextLang);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
  }

  function navigateMode(nextMode: Mode, trackHistory = true) {
    if (nextMode === mode) return;
    if (trackHistory) modeHistoryRef.current = [...modeHistoryRef.current.slice(-8), mode];
    if (nextMode === "coccion") setCookingStep("animal");
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
      className={`${ds.shell.page} overflow-x-hidden px-3 pt-2 !pb-[max(120px,env(safe-area-inset-bottom))] sm:px-4 sm:pt-5 md:!pb-28`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={ds.shell.container}>
        <AppHeader lang={lang} onLangChange={handleLanguageChange} t={t} />
        <DesktopModeTabs mode={mode} onModeChange={handleModeChange} t={t} />

        {mode === "inicio" && (
          <HomeScreen savedMenusCount={savedMenus.length} t={t} onModeChange={handleModeChange} />
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
            hasLocalEngine={hasLocalEngine}
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
            setTimerRunning={setTimerRunning}
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
                    saveMenuStatus === "error"
                      ? "text-sm text-red-300"
                      : "text-sm text-emerald-300"
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
              setCheckedItems={setCheckedItems}
              t={t}
            />
          </Grid>
        )}

        {mode === "cocina" && (
          <CookingLiveMode
            context={[animal, selectedCut?.name, equipment].filter(Boolean).join(" · ")}
            lang={lang}
            cookSteps={cookSteps}
            currentStep={currentStep}
            cookingAlertsEnabled={cookingAlertsEnabled}
            cookingAlertMessage={cookingAlertMessage}
            hasCookingPlan={Boolean(blocks.PASOS || blocks.STEPS)}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            notificationPermission={notificationPermission}
            onBackToPlan={() => navigateMode("coccion")}
            onEnableAlerts={enableCookingAlerts}
            onNextStep={nextCookStep}
            onPreviousStep={previousCookStep}
            setTimerRunning={setTimerRunning}
            onGoToStep={goToCookStep}
            onCompleteStep={nextCookStep}
            onReset={resetCookMode}
          />
        )}

        {mode === "guardados" && (
          <SavedMenusSection
            lang={lang}
            menus={savedMenus}
            onCopy={copySavedMenu}
            onDelete={deleteMenu}
            onOpen={loadMenu}
            t={t}
          />
        )}
      </div>

      {mode !== "cocina" && <BottomNavigation mode={mode} onModeChange={handleModeChange} t={t} />}
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
  onCopy,
  onDelete,
  onOpen,
  t,
}: {
  lang: Lang;
  menus: SavedMenu[];
  onCopy: (menu: SavedMenu) => void;
  onDelete: (id: string) => void;
  onOpen: (menu: SavedMenu) => void;
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

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => onOpen(menu)}>{lang === "es" ? "Abrir" : "Open"}</Button>
              <Button onClick={() => onCopy(menu)} variant="secondary">
                {t.copy}
              </Button>
              <Button onClick={() => onDelete(menu.id)} variant="danger">
                {lang === "es" ? "Borrar" : "Delete"}
              </Button>
            </div>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}
import CookingLiveMode from "@/components/CookingLiveMode";
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
  AppHeader,
  BottomNavigation,
  DesktopModeTabs,
  type Mode,
} from "@/components/navigation/AppHeader";
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

type SavedMenu = {
  id: string;
  title: string;
  date: string;
  blocks: Blocks;
};

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

function hasLocalEngine(animal: Animal) {
  return Boolean(animalIdsByLabel[animal]);
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
    image: cutImages[cut.id] ?? "/cuts/placeholder.jpg",
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

function buildText(blocks: Blocks) {
  return Object.keys(blocks)
    .map((key) => `${key}\n${blocks[key]}`)
    .join("\n\n");
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

  const [people, setPeople] = useState("6");
  const [eventType, setEventType] = useState("cena con amigos");
  const [menuMeats, setMenuMeats] = useState("chuletón, secreto ibérico");
  const [sides, setSides] = useState("patatas, ensalada, chimichurri");
  const [budget, setBudget] = useState("200");
  const [difficulty, setDifficulty] = useState("medio");

  const [parrilladaPeople, setParrilladaPeople] = useState("6");
  const [serveTime, setServeTime] = useState("18:00");
  const [parrilladaProducts, setParrilladaProducts] = useState(
    "costillas, chuletón, secreto ibérico, maíz",
  );
  const [parrilladaSides, setParrilladaSides] = useState("patatas, ensalada, chimichurri");

  const [blocks, setBlocks] = useState<Blocks>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveMenuStatus, setSaveMenuStatus] = useState<SaveMenuStatus>("idle");
  const [saveMenuMessage, setSaveMenuMessage] = useState("");

  const [cookSteps, setCookSteps] = useState<CookingStep[]>(defaultCookSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultCookSteps[0].duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [cookingAlertsEnabled, setCookingAlertsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [cookingAlertMessage, setCookingAlertMessage] = useState("");
  const touchStartRef = useRef<TouchPoint | null>(null);
  const modeHistoryRef = useRef<Mode[]>([]);

  const cuts = useMemo(() => getCutItems(animal, lang), [animal, lang]);
  const selectedCut = cuts.find((item) => item.id === cut);

  const currentDonenessOptions = getDonenessSelectOptions(animal, lang);
  const showThickness = cut ? shouldShowThickness(cut) : true;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("parrillero_saved_menus");
    if (stored) setSavedMenus(JSON.parse(stored) as SavedMenu[]);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          notifyStepFinished();

          setTimeout(() => {
            setCurrentStep((previous) => {
              const next = Math.min(previous + 1, cookSteps.length - 1);
              setTimeLeft(cookSteps[next]?.duration ?? 0);
              return next;
            });
          }, 800);

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, currentStep, cookSteps.length]);

  useEffect(() => {
    if (mode === "coccion") setCookingStep("animal");
  }, [mode]);

  function notifyStepFinished() {
    if (typeof window === "undefined") return;

    const nextStep = cookSteps[Math.min(currentStep + 1, cookSteps.length - 1)];
    const message = nextStep ? `Siguiente paso: ${nextStep.title}` : "Plan de cocción completado.";

    try {
      const audio = new Audio("/sounds/beep.mp3");
      audio.play().catch(() => {});
    } catch {}

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    setCookingAlertMessage(message);
    window.setTimeout(() => setCookingAlertMessage(""), 5000);

    if (
      cookingAlertsEnabled &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Parrillero Pro", { body: message });
      } catch {}
    }
  }

  async function enableCookingAlerts() {
    setCookingAlertsEnabled(true);

    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return;
    }

    setNotificationPermission(Notification.permission);
  }

  function updateSavedMenus(nextMenus: SavedMenu[]) {
    setSavedMenus(nextMenus);
    if (typeof window === "undefined") return;

    localStorage.setItem("parrillero_saved_menus", JSON.stringify(nextMenus));
  }

  function resetSaveMenuState() {
    setSaveMenuStatus("idle");
    setSaveMenuMessage("");
  }

  async function saveCurrentMenu() {
    if (typeof window === "undefined") return;
    if (!hasSavableBlocks(blocks)) {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
      return;
    }

    const now = new Date();
    const dateLabel = now.toLocaleDateString(localeForLang(lang));
    const savedType: SavedMenuType =
      mode === "coccion" ? "cooking_plan" : mode === "parrillada" ? "parrillada_plan" : "generated_menu";
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

    setSaveMenuStatus("saving");
    setSaveMenuMessage("");

    try {
      const safeBlocks = getSafeBlocksForSave(blocks, savedType);
      if (Object.keys(safeBlocks).length === 0) {
        setSaveMenuStatus("error");
        setSaveMenuMessage(t.menuSaveError);
        return;
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
                products: menuMeats,
                menuMeats,
                sides,
                budget,
                difficulty,
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
        return;
      }

      const savedMenu = "ok" in savedMenuResult ? savedMenuResult.menu : savedMenuResult;

      const newMenu: SavedMenu = {
        id: savedMenu.id,
        title: savedMenu.name,
        date: new Date(savedMenu.created_at).toLocaleDateString(localeForLang(lang)),
        blocks: safeBlocks,
        type: savedType,
      };

      updateSavedMenus([newMenu, ...savedMenus.filter((menu) => menu.id !== newMenu.id)]);
      setSaveMenuStatus("success");
      setSaveMenuMessage(t.menuSaved);
    } catch {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
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
        setCurrentStep(0);
        setTimeLeft(steps[0].duration);
        setTimerRunning(false);
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
      setCurrentStep(0);
      setTimeLeft(visualSteps[0].duration);
      setTimerRunning(false);
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

  function nextCookStep() {
    const next = Math.min(currentStep + 1, cookSteps.length - 1);
    setCurrentStep(next);
    setTimeLeft(cookSteps[next].duration);
    setTimerRunning(false);
  }

  function previousCookStep() {
    const previous = Math.max(currentStep - 1, 0);
    setCurrentStep(previous);
    setTimeLeft(cookSteps[previous].duration);
    setTimerRunning(false);
  }

  function goToCookStep(stepIndex: number) {
    const next = Math.max(0, Math.min(stepIndex, cookSteps.length - 1));
    setCurrentStep(next);
    setTimeLeft(cookSteps[next].duration);
    setTimerRunning(false);
  }

  function resetCookMode() {
    setCurrentStep(0);
    setTimeLeft(cookSteps[0].duration);
    setTimerRunning(false);
  }

  function handleLanguageChange(nextLang: Lang) {
    setLang(nextLang);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
  }

  function navigateMode(nextMode: Mode, trackHistory = true) {
    if (nextMode === mode) return;
    if (trackHistory) modeHistoryRef.current = [...modeHistoryRef.current.slice(-8), mode];
    if (nextMode === "coccion") setCookingStep("animal");
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
      className={`${ds.shell.page} overflow-x-hidden px-3 pt-2 !pb-[max(120px,env(safe-area-inset-bottom))] sm:px-4 sm:pt-5 md:!pb-28`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={ds.shell.container}>
        <AppHeader lang={lang} onLangChange={handleLanguageChange} t={t} />
        <DesktopModeTabs mode={mode} onModeChange={handleModeChange} t={t} />

        {mode === "inicio" && (
          <HomeScreen savedMenusCount={savedMenus.length} t={t} onModeChange={handleModeChange} />
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
            hasLocalEngine={hasLocalEngine}
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
            setTimerRunning={setTimerRunning}
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
                    saveMenuStatus === "error"
                      ? "text-sm text-red-300"
                      : "text-sm text-emerald-300"
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
              setCheckedItems={setCheckedItems}
              t={t}
            />
          </Grid>
        )}

        {mode === "cocina" && (
          <CookingLiveMode
            context={[animal, selectedCut?.name, equipment].filter(Boolean).join(" · ")}
            lang={lang}
            cookSteps={cookSteps}
            currentStep={currentStep}
            cookingAlertsEnabled={cookingAlertsEnabled}
            cookingAlertMessage={cookingAlertMessage}
            hasCookingPlan={Boolean(blocks.PASOS || blocks.STEPS)}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            notificationPermission={notificationPermission}
            onBackToPlan={() => navigateMode("coccion")}
            onEnableAlerts={enableCookingAlerts}
            onNextStep={nextCookStep}
            onPreviousStep={previousCookStep}
            setTimerRunning={setTimerRunning}
            onGoToStep={goToCookStep}
            onCompleteStep={nextCookStep}
            onReset={resetCookMode}
          />
        )}

        {mode === "guardados" && (
          <SavedMenusSection
            lang={lang}
            menus={savedMenus}
            onCopy={copySavedMenu}
            onDelete={deleteMenu}
            onOpen={loadMenu}
            t={t}
          />
        )}
      </div>

      {mode !== "cocina" && <BottomNavigation mode={mode} onModeChange={handleModeChange} t={t} />}
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
  onCopy,
  onDelete,
  onOpen,
  t,
}: {
  lang: Lang;
  menus: SavedMenu[];
  onCopy: (menu: SavedMenu) => void;
  onDelete: (id: string) => void;
  onOpen: (menu: SavedMenu) => void;
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

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => onOpen(menu)}>{lang === "es" ? "Abrir" : "Open"}</Button>
              <Button onClick={() => onCopy(menu)} variant="secondary">
                {t.copy}
              </Button>
              <Button onClick={() => onDelete(menu.id)} variant="danger">
                {lang === "es" ? "Borrar" : "Delete"}
              </Button>
            </div>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

import { track } from "@/lib/analytics";
import { saveGeneratedMenu } from "@/app/actions/savedMenus";
import CookingLiveMode from "@/components/CookingLiveMode";
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
  AppHeader,
  BottomNavigation,
  DesktopModeTabs,
  type Mode,
} from "@/components/navigation/AppHeader";
import { Button, Card, Grid, Section } from "@/components/ui";
import {
  generateCookingPlan as generateLocalCookingPlan,
  generateCookingSteps as generateLocalCookingSteps,
  getCutById,
  getCutsByAnimal,
  getDonenessOptions,
  shouldShowThickness,
} from "@/lib/cookingRules";
import type {
  AnimalId,
  CookingMethod,
  CookingStep,
  ProductCut,
} from "@/lib/cookingCatalog";
import { getCookingStepImage } from "@/lib/cookingVisuals";
import { ds } from "@/lib/design-system";
import { texts, type Lang } from "@/lib/i18n/texts";
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

type SavedMenu = {
  id: string;
  title: string;
  date: string;
  blocks: Blocks;
};

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

function hasLocalEngine(animal: Animal) {
  return Boolean(animalIdsByLabel[animal]);
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
    image: cutImages[cut.id] ?? "/cuts/placeholder.jpg",
    description: getCutDescription(cut, lang),
  }));
}

function getAnimalPreview(animal: Animal, lang: Lang) {
  return getCutItems(animal, lang).slice(0, 2).map((cut) => cut.name).join(", ");
}

function isInteractiveSwipeTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest("input, select, textarea, a, label")
  );
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

function buildCookStepsFromPlan(blocks: Blocks): CookingStep[] {
  const text = blocks.PASOS || blocks.STEPS || blocks.ORDEN || blocks.ORDER || "";
  const lines = text.split("\n").map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim()).filter(Boolean);

  if (lines.length === 0) return defaultCookSteps;

  return lines.map((line) => {
    const lower = line.toLowerCase();
    let duration = 300;
    let image = getCookingStepImage({ stepTitle: line });

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

function buildText(blocks: Blocks) {
  return Object.keys(blocks).map((key) => `${key}\n${blocks[key]}`).join("\n\n");
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

  const [people, setPeople] = useState("6");
  const [eventType, setEventType] = useState("cena con amigos");
  const [menuMeats, setMenuMeats] = useState("chuletón, secreto ibérico");
  const [sides, setSides] = useState("patatas, ensalada, chimichurri");
  const [budget, setBudget] = useState("200");
  const [difficulty, setDifficulty] = useState("medio");

  const [parrilladaPeople, setParrilladaPeople] = useState("6");
  const [serveTime, setServeTime] = useState("18:00");
  const [parrilladaProducts, setParrilladaProducts] = useState("costillas, chuletón, secreto ibérico, maíz");
  const [parrilladaSides, setParrilladaSides] = useState("patatas, ensalada, chimichurri");

  const [blocks, setBlocks] = useState<Blocks>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveMenuStatus, setSaveMenuStatus] = useState<SaveMenuStatus>("idle");
  const [saveMenuMessage, setSaveMenuMessage] = useState("");

  const [cookSteps, setCookSteps] = useState<CookingStep[]>(defaultCookSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultCookSteps[0].duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [cookingAlertsEnabled, setCookingAlertsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [cookingAlertMessage, setCookingAlertMessage] = useState("");
  const touchStartRef = useRef<TouchPoint | null>(null);
  const modeHistoryRef = useRef<Mode[]>([]);

  const cuts = useMemo(() => getCutItems(animal, lang), [animal, lang]);
  const selectedCut = cuts.find((item) => item.id === cut);

  const currentDonenessOptions = getDonenessSelectOptions(animal, lang);
  const showThickness = cut ? shouldShowThickness(cut) : true;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("parrillero_saved_menus");
    if (stored) setSavedMenus(JSON.parse(stored) as SavedMenu[]);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          notifyStepFinished();

          setTimeout(() => {
            setCurrentStep((previous) => {
              const next = Math.min(previous + 1, cookSteps.length - 1);
              setTimeLeft(cookSteps[next]?.duration ?? 0);
              return next;
            });
          }, 800);

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, currentStep, cookSteps.length]);

  useEffect(() => {
    if (mode === "coccion") setCookingStep("animal");
  }, [mode]);

  function notifyStepFinished() {
    if (typeof window === "undefined") return;

    const nextStep = cookSteps[Math.min(currentStep + 1, cookSteps.length - 1)];
    const message = nextStep
      ? `Siguiente paso: ${nextStep.title}`
      : "Plan de cocción completado.";

    try {
      const audio = new Audio("/sounds/beep.mp3");
      audio.play().catch(() => {});
    } catch {}

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    setCookingAlertMessage(message);
    window.setTimeout(() => setCookingAlertMessage(""), 5000);

    if (
      cookingAlertsEnabled &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Parrillero Pro", { body: message });
      } catch {}
    }
  }

  async function enableCookingAlerts() {
    setCookingAlertsEnabled(true);

    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return;
    }

    setNotificationPermission(Notification.permission);
  }

  function updateSavedMenus(nextMenus: SavedMenu[]) {
    setSavedMenus(nextMenus);
    if (typeof window === "undefined") return;

    localStorage.setItem("parrillero_saved_menus", JSON.stringify(nextMenus));
  }

  function resetSaveMenuState() {
    setSaveMenuStatus("idle");
    setSaveMenuMessage("");
  }

  async function saveCurrentMenu() {
    if (typeof window === "undefined") return;
    if (!hasSavableBlocks(blocks)) {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
      return;
    }

    const now = new Date();
    const dateLabel = now.toLocaleDateString(localeForLang(lang));
    const savedType: SavedMenuType =
      mode === "coccion" ? "cooking_plan" : mode === "parrillada" ? "parrillada_plan" : "generated_menu";
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

    setSaveMenuStatus("saving");
    setSaveMenuMessage("");

    try {
      const safeBlocks = getSafeBlocksForSave(blocks, savedType);
      if (Object.keys(safeBlocks).length === 0) {
        setSaveMenuStatus("error");
        setSaveMenuMessage(t.menuSaveError);
        return;
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
                products: menuMeats,
                menuMeats,
                sides,
                budget,
                difficulty,
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
        return;
      }

      const savedMenu = "ok" in savedMenuResult ? savedMenuResult.menu : savedMenuResult;

      const newMenu: SavedMenu = {
        id: savedMenu.id,
        title: savedMenu.name,
        date: new Date(savedMenu.created_at).toLocaleDateString(localeForLang(lang)),
        blocks: safeBlocks,
        type: savedType,
      };

      updateSavedMenus([newMenu, ...savedMenus.filter((menu) => menu.id !== newMenu.id)]);
      setSaveMenuStatus("success");
      setSaveMenuMessage(t.menuSaved);
    } catch {
      setSaveMenuStatus("error");
      setSaveMenuMessage(t.menuSaveError);
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
        setCurrentStep(0);
        setTimeLeft(steps[0].duration);
        setTimerRunning(false);
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
      setCurrentStep(0);
      setTimeLeft(visualSteps[0].duration);
      setTimerRunning(false);
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
      visualContext
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

  function nextCookStep() {
    const next = Math.min(currentStep + 1, cookSteps.length - 1);
    setCurrentStep(next);
    setTimeLeft(cookSteps[next].duration);
    setTimerRunning(false);
  }

  function previousCookStep() {
    const previous = Math.max(currentStep - 1, 0);
    setCurrentStep(previous);
    setTimeLeft(cookSteps[previous].duration);
    setTimerRunning(false);
  }

  function goToCookStep(stepIndex: number) {
    const next = Math.max(0, Math.min(stepIndex, cookSteps.length - 1));
    setCurrentStep(next);
    setTimeLeft(cookSteps[next].duration);
    setTimerRunning(false);
  }

  function resetCookMode() {
    setCurrentStep(0);
    setTimeLeft(cookSteps[0].duration);
    setTimerRunning(false);
  }

  function handleLanguageChange(nextLang: Lang) {
    setLang(nextLang);
    setBlocks({});
    setCheckedItems({});
    resetSaveMenuState();
  }

  function navigateMode(nextMode: Mode, trackHistory = true) {
    if (nextMode === mode) return;
    if (trackHistory) modeHistoryRef.current = [...modeHistoryRef.current.slice(-8), mode];
    if (nextMode === "coccion") setCookingStep("animal");
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
      className={`${ds.shell.page} overflow-x-hidden px-3 pt-2 !pb-[max(120px,env(safe-area-inset-bottom))] sm:px-4 sm:pt-5 md:!pb-28`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={ds.shell.container}>
        <AppHeader lang={lang} onLangChange={handleLanguageChange} t={t} />
        <DesktopModeTabs mode={mode} onModeChange={handleModeChange} t={t} />

        {mode === "inicio" && (
          <HomeScreen
            savedMenusCount={savedMenus.length}
            t={t}
            onModeChange={handleModeChange}
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
            hasLocalEngine={hasLocalEngine}
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
            setTimerRunning={setTimerRunning}
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
              <Select label={t.eventType} value={eventType} onChange={setEventType} options={["cena con amigos", "comida familiar", "barbacoa informal", "celebración especial", "menú premium"]} />
              <Input label={t.meats} value={menuMeats} onChange={setMenuMeats} placeholder="Ej: chuletón, secreto, maíz" />
              <Input label={t.sides} value={sides} onChange={setSides} placeholder="Ej: patatas, ensalada, chimichurri" />
              <Input label={t.budget} value={budget} onChange={setBudget} placeholder="Ej: 200" />
              <Select label={t.difficulty} value={difficulty} onChange={setDifficulty} options={["fácil", "medio", "avanzado"]} />
              <Select label={t.equipment} value={equipment} onChange={setEquipment} options={equipmentOptions} />

              <PrimaryButton onClick={generateMenuPlan} loading={loading} text={t.createMenu} loadingText={t.creating} />

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
                <p className={saveMenuStatus === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"}>
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

              <Input label={t.people} value={parrilladaPeople} onChange={setParrilladaPeople} placeholder="Ej: 6" />
              <Input label={t.serveTime} value={serveTime} onChange={setServeTime} placeholder="Ej: 18:00" />
              <Input label={t.products} value={parrilladaProducts} onChange={setParrilladaProducts} placeholder="Ej: costillas, chuletón, secreto" />
              <Input label={t.sides} value={parrilladaSides} onChange={setParrilladaSides} placeholder="Ej: patatas, ensalada, chimichurri" />
              <Select label={t.equipment} value={equipment} onChange={setEquipment} options={equipmentOptions} />

              <Button className="px-5 py-4 font-bold" fullWidth onClick={generateParrillada}>
                {t.createParrillada}
              </Button>

            </div>

            <ResultCards blocks={blocks} loading={loading} checkedItems={checkedItems} setCheckedItems={setCheckedItems} t={t} />
          </Grid>
        )}

        {mode === "cocina" && (
          <CookingLiveMode
            context={[animal, selectedCut?.name, equipment].filter(Boolean).join(" · ")}
            lang={lang}
            cookSteps={cookSteps}
            currentStep={currentStep}
            cookingAlertsEnabled={cookingAlertsEnabled}
            cookingAlertMessage={cookingAlertMessage}
            hasCookingPlan={Boolean(blocks.PASOS || blocks.STEPS)}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            notificationPermission={notificationPermission}
            onBackToPlan={() => navigateMode("coccion")}
            onEnableAlerts={enableCookingAlerts}
            onNextStep={nextCookStep}
            onPreviousStep={previousCookStep}
            setTimerRunning={setTimerRunning}
            onGoToStep={goToCookStep}
            onCompleteStep={nextCookStep}
            onReset={resetCookMode}
          />
        )}

        {mode === "guardados" && (
          <SavedMenusSection
            lang={lang}
            menus={savedMenus}
            onCopy={copySavedMenu}
            onDelete={deleteMenu}
            onOpen={loadMenu}
            t={t}
          />
        )}
      </div>

      {mode !== "cocina" && <BottomNavigation mode={mode} onModeChange={handleModeChange} t={t} />}
    </main>
  );
}

function copySavedMenu(menu: SavedMenu) {
  if (typeof window === "undefined" || !navigator.clipboard) return;

  navigator.clipboard.writeText(buildText(menu.blocks));
}

COMPONENTS

function CookingStepTransition({ stepKey, children }: { stepKey: CookingWizardStep; children: ReactNode }) {
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    setEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [stepKey]);

  return (
    <div
      className={`motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        entered ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
      } transition-[opacity,transform] duration-300 ease-out`}
    >
      {children}
    </div>
  );
}

function FadeInSection({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        entered ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
      } transition-[opacity,transform] duration-300 ease-out`}
    >
      {children}
    </div>
  );
}

function AppHeader({
  lang,
  onLangChange,
  t,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  t: typeof texts.es;
}) {
  return (
    <header className="mb-1.5 flex items-center justify-between gap-2 border-b border-white/10 pb-2 pt-0.5 sm:mb-3 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-slate-950/50 sm:px-3 sm:py-2 sm:shadow-lg sm:shadow-black/10 sm:backdrop-blur md:rounded-3xl md:px-4 md:py-2.5">
      <div className="min-w-0">
        <Badge className="px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] sm:px-2.5 sm:py-0.5 sm:text-[10px] sm:tracking-[0.16em] md:text-xs md:tracking-[0.2em]">{t.app}</Badge>
        <p className="mt-1 hidden text-xs leading-snug text-slate-400 sm:block md:text-sm">{t.subtitle}</p>
      </div>

      <div className="shrink-0">
        <select
          value={lang}
          onChange={(event) => onLangChange(event.target.value as Lang)}
          className={`${ds.input.compactSelect} max-w-[100px] rounded-lg px-1.5 py-1 text-[10px] sm:max-w-none sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs md:rounded-2xl md:px-3 md:py-2 md:text-sm`}
        >
          <option value="es">🇪🇸 Español</option>
          <option value="en">🇬🇧 English</option>
          <option value="fi">🇫🇮 Suomi</option>
        </select>
      </div>
    </header>
  );
}

function DesktopModeTabs({
  mode,
  onModeChange,
  t,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  t: typeof texts.es;
}) {
  return (
    <nav className="mb-6 hidden rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-lg shadow-black/10 backdrop-blur md:block">
      <div className="grid grid-cols-6 gap-2">
        <DesktopTab active={mode === "inicio"} label={t.start} emoji="🏠" onClick={() => onModeChange("inicio")} />
        <DesktopTab active={mode === "coccion"} label={t.cooking} emoji="🥩" onClick={() => onModeChange("coccion")} />
        <DesktopTab active={mode === "menu"} label={t.menu} emoji="🍽️" onClick={() => onModeChange("menu")} />
        <DesktopTab active={mode === "parrillada"} label={t.parrillada} emoji="🔥" onClick={() => onModeChange("parrillada")} />
        <DesktopTab active={mode === "cocina"} label={t.live} emoji="⏱️" onClick={() => onModeChange("cocina")} />
        <DesktopTab active={mode === "guardados"} label={t.saved} emoji="⭐" onClick={() => onModeChange("guardados")} />
      </div>
    </nav>
  );
}

function DesktopTab({
  active,
  emoji,
  label,
  onClick,
}: {
  active: boolean;
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-2xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-black shadow-lg shadow-orange-500/25 transition-all duration-200 active:scale-[0.98]"
          : "rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-slate-100 active:scale-[0.98]"
      }
    >
      <span className="mr-2">{emoji}</span>
      {label}
    </button>
  );
}

function CookingWizard({
  animal,
  blocks,
  checkedItems,
  cookingStep,
  currentDonenessOptions,
  cut,
  cuts,
  doneness,
  equipment,
  generateCookingPlan,
  handleAnimalChange,
  handleCutChange,
  lang,
  loading,
  onSaveMenu,
  selectedCut,
  saveMenuMessage,
  saveMenuStatus,
  setCheckedItems,
  setCookingStep,
  setDoneness,
  setEquipment,
  setMode,
  setThickness,
  setTimerRunning,
  setWeight,
  showThickness,
  t,
  thickness,
  weight,
}: {
  animal: Animal;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  cookingStep: CookingWizardStep;
  currentDonenessOptions: SelectOption[];
  cut: string;
  cuts: CutItem[];
  doneness: string;
  equipment: string;
  generateCookingPlan: () => Promise<void>;
  handleAnimalChange: (animal: Animal) => void;
  handleCutChange: (cut: string) => void;
  lang: Lang;
  loading: boolean;
  onSaveMenu: () => Promise<void>;
  selectedCut?: CutItem;
  saveMenuMessage: string;
  saveMenuStatus: SaveMenuStatus;
  setCheckedItems: (value: Record<string, boolean>) => void;
  setCookingStep: (step: CookingWizardStep) => void;
  setDoneness: (value: string) => void;
  setEquipment: (value: string) => void;
  setMode: (mode: Mode) => void;
  setThickness: (value: string) => void;
  setTimerRunning: (value: boolean) => void;
  setWeight: (value: string) => void;
  showThickness: boolean;
  t: typeof texts.es;
  thickness: string;
  weight: string;
}) {
  const hasCookingResult = Object.keys(blocks).length > 0;
  const visibleCookingStep =
    cookingStep === "result" && !hasCookingResult
      ? selectedCut
        ? "details"
        : cut
          ? "cut"
          : "animal"
      : cookingStep;

  return (
    <div className="space-y-2 sm:space-y-6">
      {visibleCookingStep !== "result" && (
        <CookingWizardHeader
          animal={animal}
          cookingStep={visibleCookingStep}
          selectedCut={selectedCut}
          t={t}
        />
      )}

      {visibleCookingStep !== "animal" && visibleCookingStep !== "result" && (
        <p className="px-1 text-center text-[11px] font-medium text-slate-500 md:hidden">
          Desliza para volver
        </p>
      )}

      <CookingStepTransition stepKey={visibleCookingStep}>
        {visibleCookingStep === "animal" ? (
          <CookingAnimalStep
            animal={animal}
            lang={lang}
            onSelectAnimal={handleAnimalChange}
            t={t}
          />
        ) : visibleCookingStep === "cut" ? (
          <CookingCutStep
            animal={animal}
            cut={cut}
            cuts={cuts}
            onBack={() => setCookingStep("animal")}
            onSelectCut={handleCutChange}
            t={t}
          />
        ) : visibleCookingStep === "details" && selectedCut ? (
          <CookingDetailsStep
            animal={animal}
            currentDonenessOptions={currentDonenessOptions}
            doneness={doneness}
            equipment={equipment}
            generateCookingPlan={generateCookingPlan}
            loading={loading}
            onBack={() => setCookingStep("cut")}
            selectedCut={selectedCut}
            setDoneness={setDoneness}
            setEquipment={setEquipment}
            setThickness={setThickness}
            setWeight={setWeight}
            showThickness={showThickness}
            t={t}
            thickness={thickness}
            weight={weight}
          />
        ) : visibleCookingStep === "result" ? (
          <CookingResultStep
            animal={animal}
            blocks={blocks}
            checkedItems={checkedItems}
            equipment={equipment}
            onEdit={() => setCookingStep("details")}
            onSaveMenu={onSaveMenu}
            saveMenuMessage={saveMenuMessage}
            saveMenuStatus={saveMenuStatus}
            setCheckedItems={setCheckedItems}
            setMode={setMode}
            setTimerRunning={setTimerRunning}
            t={t}
          />
        ) : null}
      </CookingStepTransition>
    </div>
  );
}

function CookingWizardHeader({
  animal,
  cookingStep,
  selectedCut,
  t,
}: {
  animal: Animal;
  cookingStep: CookingWizardStep;
  selectedCut?: CutItem;
  t: typeof texts.es;
}) {
  const title =
    cookingStep === "animal"
      ? t.chooseAnimal
      : cookingStep === "cut"
        ? t.chooseCut
        : t.configurePlan;
  const subtitle =
    cookingStep === "animal"
      ? "Empieza eligiendo la proteína principal."
      : cookingStep === "cut"
        ? "Ahora selecciona el corte exacto."
        : "Ajusta peso, punto y equipo.";

  return (
    <>
      <div className="sticky top-2 z-30 mb-2 rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 shadow-lg shadow-black/30 backdrop-blur sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white">{t.cooking}</h1>
            <p className="truncate text-[10px] text-slate-400">{title}</p>
          </div>
          {cookingStep !== "animal" && (
            <Badge className="max-w-[130px] shrink-0 truncate px-2 py-1 text-[10px]" tone="glass">
              {selectedCut?.name ?? animal}
            </Badge>
          )}
        </div>
        <div className="mt-2">
          <CookingStepIndicator currentStep={cookingStep} />
        </div>
      </div>

      <Panel className="relative hidden overflow-hidden p-4 sm:block md:p-5" tone="hero">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300/90">{t.cooking}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {subtitle}
            </p>
            {cookingStep !== "animal" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{animal}</Badge>
                {selectedCut && <Badge tone="glass">{selectedCut.name}</Badge>}
              </div>
            )}
          </div>

          <CookingStepIndicator currentStep={cookingStep} />
        </div>
      </Panel>
    </>
  );
}

function CookingStepIndicator({ currentStep }: { currentStep: CookingWizardStep }) {
  const steps: Array<{ id: CookingWizardStep; label: string; number: string }> = [
    { id: "animal", label: "Animal", number: "1" },
    { id: "cut", label: "Corte", number: "2" },
    { id: "details", label: "Detalles", number: "3" },
  ];
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="flex min-w-0 gap-0.5 rounded-lg border border-white/10 bg-black/40 p-0.5 shadow-inner shadow-black/25 sm:min-w-[320px] sm:gap-1 sm:rounded-xl sm:p-1 md:min-w-[360px]">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;

        return (
          <div
            key={step.id}
            className={
              isActive
                ? "flex min-w-0 flex-1 flex-col items-center justify-center rounded-md bg-orange-500 px-1 py-1 text-center shadow-md shadow-orange-500/30 transition-all duration-200 sm:rounded-lg sm:px-2 sm:py-1.5"
                : isComplete
                  ? "flex min-w-0 flex-1 flex-col items-center justify-center rounded-md border border-orange-500/25 bg-orange-500/10 px-1 py-1 text-center transition-all duration-200 sm:rounded-lg sm:px-2 sm:py-1.5"
                  : "flex min-w-0 flex-1 flex-col items-center justify-center rounded-md bg-white/[0.04] px-1 py-1 text-center transition-all duration-200 sm:rounded-lg sm:px-2 sm:py-1.5"
            }
          >
            <span
              className={
                isActive
                  ? "text-[9px] font-black leading-none text-black/80 sm:text-[10px]"
                  : isComplete
                    ? "text-[9px] font-black leading-none text-orange-200/90 sm:text-[10px]"
                    : "text-[9px] font-black leading-none text-slate-500 sm:text-[10px]"
              }
            >
              {step.number}
            </span>
            <span
              className={
                isActive
                  ? "mt-0.5 text-[10px] font-bold leading-tight text-black sm:text-xs"
                  : isComplete
                    ? "mt-0.5 text-[10px] font-bold leading-tight text-orange-100 sm:text-xs"
                    : "mt-0.5 text-[10px] font-semibold leading-tight text-slate-500 sm:text-xs"
              }
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CookingAnimalStep({
  animal,
  lang,
  onSelectAnimal,
  t,
}: {
  animal: Animal;
  lang: Lang;
  onSelectAnimal: (animal: Animal) => void;
  t: typeof texts.es;
}) {
  return (
    <Section className="space-y-2 sm:space-y-5" eyebrow="Paso 1" title={t.chooseAnimal}>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-5">
        {animalOptions.map((item) => (
          <ImageCard
            key={item}
            active={animal === item}
            title={item}
            subtitle={getAnimalPreview(item, lang)}
            image={animalMedia[item].image}
            badge={hasLocalEngine(item) ? t.localEngine : t.aiFallback}
            selectedLabel={t.selected}
            onClick={() => onSelectAnimal(item)}
          />
        ))}
      </div>
    </Section>
  );
}

function CookingCutStep({
  animal,
  cut,
  cuts,
  onBack,
  onSelectCut,
  t,
}: {
  animal: Animal;
  cut: string;
  cuts: CutItem[];
  onBack: () => void;
  onSelectCut: (cut: string) => void;
  t: typeof texts.es;
}) {
  return (
    <Section className="space-y-2 sm:space-y-5" eyebrow="Paso 2" title={t.chooseCut}>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className={`${ds.panel.highlight} px-2.5 py-1.5 sm:p-4`}>
          <p className="text-xs text-orange-300 sm:text-sm">{t.selected}</p>
          <h2 className="text-sm font-bold text-white sm:text-base">{animal}</h2>
        </div>
        <Button className="rounded-full px-3 py-2 text-xs transition-all duration-200 active:scale-[0.98]" onClick={onBack} variant="secondary">← {t.reset}</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {cuts.map((item) => (
          <CutCard
            key={item.id}
            active={cut === item.id}
            cut={item}
            badge={hasLocalEngine(animal) ? t.localEngine : t.aiFallback}
            activeLabel={t.active}
            onClick={() => onSelectCut(item.id)}
          />
        ))}
      </div>
    </Section>
  );
}

function CookingDetailsStep({
  animal,
  currentDonenessOptions,
  doneness,
  equipment,
  generateCookingPlan,
  loading,
  onBack,
  selectedCut,
  setDoneness,
  setEquipment,
  setThickness,
  setWeight,
  showThickness,
  t,
  thickness,
  weight,
}: {
  animal: Animal;
  currentDonenessOptions: SelectOption[];
  doneness: string;
  equipment: string;
  generateCookingPlan: () => Promise<void>;
  loading: boolean;
  onBack: () => void;
  selectedCut: CutItem;
  setDoneness: (value: string) => void;
  setEquipment: (value: string) => void;
  setThickness: (value: string) => void;
  setWeight: (value: string) => void;
  showThickness: boolean;
  t: typeof texts.es;
  thickness: string;
  weight: string;
}) {
  return (
    <Grid variant="split">
      <Panel className="space-y-2.5 sm:space-y-4 md:col-span-2" tone="form">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div>
            <p className={ds.text.eyebrow}>Paso 3</p>
            <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">{t.configurePlan}</h2>
          </div>
          <Button className="rounded-full px-3 py-2 text-xs transition-all duration-200 active:scale-[0.98]" onClick={onBack} variant="secondary">← {t.chooseCut}</Button>
        </div>

        <div className={`${ds.panel.highlight} p-2.5 sm:p-4`}>
          <p className="text-sm text-orange-300">{animal}</p>
          <h3 className="font-bold text-white">{selectedCut.name}</h3>
          <p className="mt-1 text-sm text-slate-300">{selectedCut.description}</p>
        </div>

        <Input label={t.weight} value={weight} onChange={setWeight} placeholder="Ej: 1.2" />

        {showThickness && (
          <Input label={t.thickness} value={thickness} onChange={setThickness} placeholder="Ej: 5" />
        )}

        {currentDonenessOptions.length > 0 && (
          <Select label={t.doneness} value={doneness} onChange={setDoneness} options={currentDonenessOptions} />
        )}
        <Select label={t.equipment} value={equipment} onChange={setEquipment} options={equipmentOptions} />

        <PrimaryButton onClick={generateCookingPlan} loading={loading} text={t.generatePlan} loadingText={t.generating} />

      </Panel>
    </Grid>
  );
}

function CookingResultStep({
  animal,
  blocks,
  checkedItems,
  equipment,
  onEdit,
  onSaveMenu,
  saveMenuMessage,
  saveMenuStatus,
  setCheckedItems,
  setMode,
  setTimerRunning,
  t,
}: {
  animal: Animal;
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  equipment: string;
  onEdit: () => void;
  onSaveMenu: () => Promise<void>;
  saveMenuMessage: string;
  saveMenuStatus: SaveMenuStatus;
  setCheckedItems: (value: Record<string, boolean>) => void;
  setMode: (mode: Mode) => void;
  setTimerRunning: (value: boolean) => void;
  t: typeof texts.es;
}) {
  return (
    <div className="space-y-4">
      <ResultCards
        blocks={blocks}
        context={`${animal} · ${equipment}`}
        loading={false}
        checkedItems={checkedItems}
        onEdit={onEdit}
        onSaveMenu={onSaveMenu}
        saveMenuMessage={saveMenuMessage}
        saveMenuStatus={saveMenuStatus}
        setCheckedItems={setCheckedItems}
        onStartCooking={() => {
          setMode("cocina");
          setTimerRunning(false);
        }}
        t={t}
      />
    </div>
  );
}

function HomeScreen({
  savedMenusCount,
  onModeChange,
  t,
}: {
  savedMenusCount: number;
  onModeChange: (mode: Mode) => void;
  t: typeof texts.es;
}) {
  const featureCards = [
    {
      description: "Cantidades y compra para eventos.",
      emoji: "🍽️",
      mode: "menu" as const,
      priority: "Menú",
      stat: "Menú completo",
      title: t.createMenu,
    },
    {
      description: "Zonas y tiempos para grupos.",
      emoji: "🔥",
      mode: "parrillada" as const,
      priority: "Parrillada",
      stat: "Timeline + zonas",
      title: t.parrilladaPro,
    },
    {
      description: "Temporizador del plan activo.",
      emoji: "⏱️",
      mode: "cocina" as const,
      priority: "En vivo",
      stat: "Live cooking",
      title: t.liveMode,
    },
    {
      description: "Repite tus planes favoritos.",
      emoji: "⭐",
      mode: "guardados" as const,
      priority: "Biblioteca",
      stat: `${savedMenusCount} ${t.saved}`,
      title: t.savedMenus,
    },
  ];

  return (
    <div className="space-y-2 sm:space-y-7">
      <section className="grid gap-2 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <Panel className="relative p-2 sm:p-7 lg:min-h-[360px]" tone="hero">
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-8 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />

          <FadeInSection>
            <div className="relative z-10 flex h-full flex-col justify-between gap-2 sm:gap-7">
              <div>
                <div className="hidden flex-wrap items-center gap-2 sm:flex">
                  <Badge className="uppercase tracking-[0.16em] sm:tracking-[0.2em]">Parrillero Pro</Badge>
                  <Badge className="border-orange-400/20 bg-black/25 text-[11px] text-orange-200" tone="glass">
                    Corte → Fuego → Pasos
                  </Badge>
                </div>

                <h1 className="mt-0 max-w-2xl text-[1.45rem] font-black leading-[1.05] tracking-[-0.045em] text-white sm:mt-5 sm:text-5xl lg:text-6xl">
                  {t.title}
                </h1>
                <p className="mt-1 max-w-xl text-[12px] leading-snug text-slate-300 sm:mt-4 sm:text-lg sm:leading-7">
                  {t.subtitle}
                </p>

                <div className="mt-2 grid gap-2 sm:mt-7 sm:flex sm:gap-3">
                  <Button className="touch-manipulation px-5 py-2.5 text-sm font-black shadow-orange-500/30 transition-all duration-200 active:scale-[0.97] active:brightness-95 sm:px-7 sm:py-4 sm:text-base" fullWidth onClick={() => onModeChange("coccion")}>
                    {t.planCooking} <span aria-hidden="true">→</span>
                  </Button>
                </div>
              </div>

              <HomeFlowPreview />

              <div className="hidden grid-cols-3 gap-2 text-sm text-slate-300 sm:grid sm:gap-3">
                <TrustItem label={t.localEngine} value="Cortes premium" />
                <TrustItem label="Timeline live" value={t.liveMode} />
                <TrustItem label={t.savedMenus} value={`${savedMenusCount} ${t.saved}`} />
              </div>
            </div>
          </FadeInSection>
        </Panel>

        <div className="hidden lg:block">
          <HomePreviewPanel
            onOpenSaved={() => onModeChange("guardados")}
            savedMenusCount={savedMenusCount}
            t={t}
          />
        </div>
      </section>

      <section className="space-y-2 sm:space-y-4">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
          <div>
            <p className={`${ds.text.eyebrow} hidden sm:block`}>Modos secundarios</p>
            <h2 className="text-[13px] font-black tracking-tight text-slate-300 sm:mt-2 sm:text-2xl sm:text-white">Más herramientas</h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-6 text-slate-400 sm:block">
            Herramientas extra para menús, grupos, cocina en vivo y planes guardados.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {featureCards.map((card) => (
            <HomeCard
              key={card.mode}
              active={false}
              description={card.description}
              emoji={card.emoji}
              onClick={() => onModeChange(card.mode)}
              priority={card.priority}
              stat={card.stat}
              title={card.title}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function HomeFlowPreview() {
  const steps = [
    { label: "Corte", n: 1 },
    { label: "Punto", n: 2 },
    { label: "Fuego", n: 3 },
    { label: "Pasos", n: 4 },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-1 ring-1 ring-inset ring-white/[0.04] sm:rounded-xl sm:p-1.5">
      <p className="mb-0.5 px-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[9px]">
        Tu flujo
      </p>
      <div className="grid grid-cols-4 gap-px rounded-md bg-white/10 p-px sm:gap-0.5 sm:rounded-lg sm:p-px">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={
              index === 0
                ? "rounded-[5px] bg-orange-500 px-1 py-1.5 text-center sm:rounded-md sm:py-2"
                : "rounded-[5px] bg-slate-950/90 px-1 py-1.5 text-center sm:rounded-md sm:py-2"
            }
          >
            <span
              className={
                index === 0
                  ? "block text-[8px] font-black text-black/70"
                  : "block text-[8px] font-black text-slate-500"
              }
            >
              {step.n}
            </span>
            <span
              className={
                index === 0
                  ? "mt-0.5 block text-[9px] font-bold leading-tight text-black sm:text-[10px]"
                  : "mt-0.5 block text-[9px] font-semibold leading-tight text-slate-400 sm:text-[10px]"
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.03] sm:p-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-300 sm:text-xs sm:tracking-[0.16em]">{label}</p>
      <p className="mt-1 truncate text-xs font-medium text-white sm:text-sm">{value}</p>
    </div>
  );
}

function HomePreviewPanel({
  onOpenSaved,
  savedMenusCount,
  t,
}: {
  onOpenSaved: () => void;
  savedMenusCount: number;
  t: typeof texts.es;
}) {
  const timeline = [
    { time: "17:10", title: "Sellado fuerte", zone: "Directo" },
    { time: "17:22", title: "Indirecto controlado", zone: "Zona media" },
    { time: "17:45", title: "Reposo y servicio", zone: "Mesa" },
  ];

  return (
    <Panel className="relative overflow-hidden p-5 sm:p-6" tone="result">
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge>Plan inteligente</Badge>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">Vista previa del servicio</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Un plan accionable con tiempos, zonas y próximos pasos antes de encender la parrilla.
            </p>
          </div>
          <div className={ds.media.iconBox}>🔥</div>
        </div>

        <div className="mt-6 space-y-3">
          {timeline.map((item, index) => (
            <div key={item.time} className="relative flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-sm font-bold text-orange-200">
                {item.time}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.zone}</p>
              </div>
              {index === 0 && <Badge className="ml-auto h-fit" tone="success">Ahora</Badge>}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-3xl font-black text-white">{savedMenusCount}</p>
            <p className="mt-1 text-sm text-slate-400">{t.savedMenus}</p>
          </div>
          <button
            onClick={onOpenSaved}
            className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-left transition hover:bg-orange-500/15 active:scale-[0.99]"
          >
            <p className="font-semibold text-orange-200">{t.savedMenus}</p>
            <p className="mt-1 text-sm text-slate-400">Abrir biblioteca</p>
          </button>
        </div>
      </div>
    </Panel>
  );
}

function SavedMenusSection({
  lang,
  menus,
  onCopy,
  onDelete,
  onOpen,
  t,
}: {
  lang: Lang;
  menus: SavedMenu[];
  onCopy: (menu: SavedMenu) => void;
  onDelete: (id: string) => void;
  onOpen: (menu: SavedMenu) => void;
  t: typeof texts.es;
}) {
  return (
    <Section eyebrow={`${menus.length} ${t.saved}`} title={t.savedMenus}>

      {menus.length === 0 && (
        <Card tone="empty">
          {t.noSaved}
        </Card>
      )}

      <Grid>
        {menus.map((menu) => (
          <Card key={menu.id}>
            <p className="text-sm font-medium text-orange-300">
              {getSavedMenuTypeLabel(getSavedMenuType(menu), lang)}
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">{menu.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{menu.date}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => onOpen(menu)}>
                {lang === "es" ? "Abrir" : "Open"}
              </Button>
              <Button onClick={() => onCopy(menu)} variant="secondary">
                {t.copy}
              </Button>
              <Button onClick={() => onDelete(menu.id)} variant="danger">
                {lang === "es" ? "Borrar" : "Delete"}
              </Button>
            </div>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

function BottomNavigation({
  mode,
  onModeChange,
  t,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  t: typeof texts.es;
}) {
  return (
    <nav className={`${ds.nav.bottom} px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1.5 md:hidden`}>
      <div className={`${ds.layout.navGrid} rounded-2xl bg-slate-950/70 p-1`}>
        <Tab active={mode === "inicio"} label={t.start} emoji="🏠" onClick={() => onModeChange("inicio")} />
        <Tab active={mode === "coccion"} label={t.cooking} emoji="🥩" onClick={() => onModeChange("coccion")} />
        <Tab active={mode === "menu"} label={t.menu} emoji="🍽️" onClick={() => onModeChange("menu")} />
        <Tab active={mode === "parrillada"} label={t.parrillada} emoji="🔥" onClick={() => onModeChange("parrillada")} />
        <Tab active={mode === "cocina"} label={t.live} emoji="⏱️" onClick={() => onModeChange("cocina")} />
        <Tab active={mode === "guardados"} label={t.saved} emoji="⭐" onClick={() => onModeChange("guardados")} />
      </div>
    </nav>
  );
}

function SelectionSections({
  lang,
  t,
  animal,
  cut,
  cuts,
  handleAnimalChange,
  handleCutChange,
}: {
  lang: Lang;
  t: typeof texts.es;
  animal: Animal;
  cut: string;
  cuts: CutItem[];
  handleAnimalChange: (animal: Animal) => void;
  handleCutChange: (cut: string) => void;
}) {
  return (
    <>
      <Section className="mb-8" eyebrow={lang === "es" ? "Paso 1" : "Step 1"} title={t.chooseAnimal}>

        <Grid variant="home">
          {animalOptions.map((item) => (
            <ImageCard
              key={item}
              active={animal === item}
              title={item}
              subtitle={getAnimalPreview(item, lang)}
              image={animalMedia[item].image}
              badge={hasLocalEngine(item) ? t.localEngine : t.aiFallback}
              selectedLabel={t.selected}
              onClick={() => handleAnimalChange(item)}
            />
          ))}
        </Grid>
      </Section>

      <Section className="mb-8" eyebrow={lang === "es" ? "Paso 2" : "Step 2"} title={t.chooseCut}>

        <Grid className="sm:grid-cols-2 lg:grid-cols-4">
          {cuts.map((item) => (
            <CutCard
              key={item.id}
              active={cut === item.id}
              cut={item}
              badge={hasLocalEngine(animal) ? t.localEngine : t.aiFallback}
              activeLabel={t.active}
              onClick={() => handleCutChange(item.id)}
            />
          ))}
        </Grid>
      </Section>
    </>
  );
}

function ResultCards({
  blocks,
  context,
  loading,
  checkedItems,
  setCheckedItems,
  onStartCooking,
  onSaveMenu,
  onEdit,
  saveMenuStatus = "idle",
  saveMenuMessage = "",
  t,
}: {
  blocks: Blocks;
  context?: string;
  loading: boolean;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
  onStartCooking?: () => void;
  onSaveMenu?: () => Promise<void>;
  onEdit?: () => void;
  saveMenuStatus?: SaveMenuStatus;
  saveMenuMessage?: string;
  t: typeof texts.es;
}) {
  const keys = Object.keys(blocks);
  const hasResult = keys.length > 0;
  const canStartCooking = Boolean(blocks.PASOS || blocks.STEPS);

  function copyText() {
    if (typeof window === "undefined" || !navigator.clipboard) return;

    navigator.clipboard.writeText(buildText(blocks));
    alert("Copiado");
  }

  function shareWhatsApp() {
    if (typeof window === "undefined") return;

    const url = `https://wa.me/?text=${encodeURIComponent(buildText(blocks))}`;
    window.open(url, "_blank");
  }

  return (
    <div className={ds.layout.resultContainer}>
      <ResultHero
        actions={{
          onCopy: copyText,
          onSave: onSaveMenu,
          onShare: shareWhatsApp,
          onStartCooking: canStartCooking ? onStartCooking : undefined,
        }}
        context={context}
        hasResult={hasResult}
        onEdit={onEdit}
        saveMenuStatus={saveMenuStatus}
        t={{
          copy: t.copy,
          result: t.result,
          save: "Guardar",
          saving: "Guardando...",
          share: "Compartir",
          startCooking: t.startCooking,
        }}
      />

      {saveMenuMessage && (
        <div
          className={
            saveMenuStatus === "error"
              ? "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 shadow-lg shadow-black/10"
              : "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 shadow-lg shadow-black/10"
          }
        >
          <div className="flex items-start gap-3">
            <span className={saveMenuStatus === "error" ? "mt-1 h-2 w-2 rounded-full bg-red-300" : "mt-1 h-2 w-2 rounded-full bg-emerald-300"} />
            <span>{saveMenuMessage}</span>
          </div>
        </div>
      )}

      <ResultGrid
        blocks={blocks}
        checkedItems={checkedItems}
        keys={keys}
        loading={loading}
        setCheckedItems={setCheckedItems}
        t={t}
      />
    </div>
  );
}

function ImageCard({
  active,
  title,
  subtitle,
  image,
  badge,
  selectedLabel,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  selectedLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "group relative touch-manipulation select-none overflow-hidden rounded-[2rem] border-2 border-orange-400/90 bg-slate-950 text-left shadow-[0_20px_55px_rgba(249,115,22,0.35)] shadow-orange-500/15 ring-2 ring-orange-400/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.97] active:brightness-[0.98]"
          : "group relative touch-manipulation select-none overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-left shadow-[0_14px_40px_rgba(2,6,23,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400/45 hover:shadow-[0_18px_48px_rgba(249,115,22,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 active:scale-[0.97] active:brightness-[0.98]"
      }
    >
      <div className="relative min-h-32 overflow-hidden sm:min-h-60">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-200 group-hover:scale-105"
          style={{
            backgroundImage: `url(${image})`,
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.36),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.68)_36%,rgba(2,6,23,0.14)_72%,rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent opacity-70" />
        <div className={active ? "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300" : "absolute inset-x-0 bottom-0 h-px bg-white/10"} />

        {badge && <Badge className="absolute right-2 top-2 z-10 text-[9px] shadow-lg shadow-black/20 backdrop-blur-md sm:right-3 sm:top-3 sm:text-[11px]" tone="glass">{badge}</Badge>}

        {active && (
          <span
            className="absolute bottom-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[11px] font-black leading-none text-black shadow-lg shadow-orange-500/50 ring-2 ring-white/25 sm:bottom-3 sm:right-3 sm:h-7 sm:w-7 sm:text-xs"
            title={selectedLabel}
            aria-label={selectedLabel}
          >
            ✓
          </span>
        )}

        <div className={`absolute inset-x-0 bottom-0 p-3 sm:p-5 ${active ? "pr-14 sm:pr-16" : "pr-12 sm:pr-28"}`}>
          <h3 className="line-clamp-2 text-base font-black leading-5 tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-2xl sm:leading-tight">{title}</h3>
          <p className="mt-1 line-clamp-1 max-w-[18rem] text-[10px] font-medium leading-4 text-slate-200/90 sm:mt-2 sm:line-clamp-2 sm:text-sm sm:leading-5">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function CutCard({
  active,
  cut,
  badge,
  activeLabel,
  onClick,
}: {
  active: boolean;
  cut: CutItem;
  badge?: string;
  activeLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "group relative touch-manipulation select-none overflow-hidden rounded-[2rem] border-2 border-orange-400/90 bg-slate-950 text-left shadow-[0_20px_55px_rgba(249,115,22,0.35)] shadow-orange-500/15 ring-2 ring-orange-400/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.97] active:brightness-[0.98]"
          : "group relative touch-manipulation select-none overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-left shadow-[0_14px_40px_rgba(2,6,23,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400/45 hover:shadow-[0_18px_48px_rgba(249,115,22,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 active:scale-[0.97] active:brightness-[0.98]"
      }
    >
      <div className="relative min-h-40 overflow-hidden sm:min-h-72">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-200 group-hover:scale-105"
          style={{
            backgroundImage: `url(${cut.image})`,
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,146,60,0.32),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.99)_0%,rgba(2,6,23,0.72)_40%,rgba(2,6,23,0.18)_74%,rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent opacity-70" />
        <div className={active ? "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300" : "absolute inset-x-0 bottom-0 h-px bg-white/10"} />

        {badge && <Badge className="absolute left-2 top-2 z-10 text-[9px] shadow-lg shadow-black/20 backdrop-blur-md sm:left-3 sm:top-3 sm:text-[11px]" tone="glass">{badge}</Badge>}
        {active && (
          <span
            className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[11px] font-black leading-none text-black shadow-lg shadow-orange-500/50 ring-2 ring-white/25 sm:right-3 sm:top-3 sm:h-7 sm:w-7 sm:text-xs"
            title={activeLabel}
            aria-label={activeLabel}
          >
            ✓
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
          <h3 className="line-clamp-2 text-base font-black leading-5 tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-2xl sm:leading-tight">{cut.name}</h3>
          <p className="mt-1 line-clamp-2 max-w-[24rem] text-[10px] leading-4 text-slate-200/90 sm:mt-2 sm:line-clamp-3 sm:text-sm sm:leading-5">{cut.description}</p>
        </div>
      </div>
    </button>
  );
}

function HomeCard({
  active = false,
  description,
  emoji,
  onClick,
  priority,
  stat,
  title,
}: {
  active?: boolean;
  description: string;
  emoji: string;
  onClick: () => void;
  priority: string;
  stat: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? `group ${ds.panel.homeCard} relative touch-manipulation overflow-hidden border-orange-500/55 bg-gradient-to-br from-orange-500/15 via-slate-900/90 to-slate-950 p-3 shadow-orange-500/20 ring-2 ring-orange-400/25 transition-all duration-200 active:scale-[0.97] active:brightness-[0.98] sm:p-6`
          : `group ${ds.panel.homeCard} relative touch-manipulation overflow-hidden rounded-2xl border-white/5 bg-white/[0.025] p-2.5 opacity-90 transition-all duration-200 hover:border-white/12 active:scale-[0.97] active:brightness-[0.98] sm:rounded-3xl sm:p-5`
      }
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-orange-500/0 blur-2xl transition-all duration-200 group-hover:bg-orange-500/10 sm:h-28 sm:w-28" />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className={active ? `${ds.media.iconTile} h-10 w-10 rounded-xl border-orange-400/40 bg-orange-500/15 text-2xl sm:h-12 sm:w-12 sm:rounded-2xl sm:text-3xl` : `${ds.media.iconTile} h-8 w-8 rounded-lg bg-white/[0.04] text-lg opacity-80 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-2xl`}>{emoji}</div>
        <Badge className="hidden max-w-[132px] shrink-0 truncate sm:inline-flex" tone={active ? "accent" : "glass"}>
          {stat}
        </Badge>
      </div>

      <div className="relative z-10 mt-2 sm:mt-6">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300/90 sm:text-[11px] sm:tracking-[0.18em]">{priority}</p>
        <h2 className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-tight tracking-tight text-white sm:mt-2 sm:text-xl">{title}</h2>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-400 sm:mt-3 sm:line-clamp-none sm:text-sm sm:leading-6">{description}</p>
      </div>

      <div className={`relative z-10 mt-2 flex items-center justify-between text-[11px] font-semibold sm:mt-5 sm:text-sm ${active ? "text-orange-300" : "text-slate-400"}`}>
        <span>Abrir</span>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 group-hover:translate-x-1 sm:h-8 sm:w-8 ${active ? "border-orange-400/20 bg-orange-500/10 group-hover:bg-orange-500/15" : "border-white/10 bg-white/[0.03] group-hover:bg-white/[0.06]"}`}>→</span>
      </div>
    </button>
  );
}

function Tab({ active, label, emoji, onClick }: { active: boolean; label: string; emoji: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "touch-manipulation rounded-xl bg-orange-500 px-1 py-1 text-[9px] font-black leading-tight text-black shadow-lg shadow-orange-500/40 ring-2 ring-orange-200/45 transition-all duration-200 motion-reduce:transition-none active:scale-[0.96] motion-reduce:active:scale-100 active:brightness-95"
          : "touch-manipulation rounded-xl px-1 py-1 text-[9px] leading-tight text-slate-500 opacity-50 transition-all duration-200 motion-reduce:transition-none hover:bg-white/5 hover:text-slate-300 hover:opacity-80 active:scale-[0.96] motion-reduce:active:scale-100 active:bg-white/10"
      }
    >
      <div>{emoji}</div>
      <div>{label}</div>
    </button>
  );
}

function PrimaryButton({ onClick, loading, text, loadingText }: { onClick: () => void; loading: boolean; text: string; loadingText: string }) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      disabled={loading}
      className="inline-flex min-h-[3.25rem] touch-manipulation items-center justify-center gap-2 px-5 py-4 font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-85 disabled:active:scale-100"
    >
      {loading ? (
        <>
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-black/25 border-t-black"
            aria-hidden
          />
          <span className="tabular-nums">{loadingText}</span>
        </>
      ) : (
        text
      )}
    </Button>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className={ds.input.label}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={ds.input.field}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: SelectOption[] }) {
  return (
    <div>
      <label className={ds.input.label}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={ds.input.field}
      >
        {options.map((item) => (
          <option key={typeof item === "string" ? item : item.value} value={typeof item === "string" ? item : item.value}>
            {typeof item === "string" ? item : item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
*/
