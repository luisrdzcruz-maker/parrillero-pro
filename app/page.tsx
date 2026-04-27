"use client";

import { saveGeneratedMenu } from "@/app/actions/savedMenus";
import ResultGrid from "@/components/ResultGrid";
import ResultHero from "@/components/ResultHero";
import { Badge, Button, Card, Grid, Panel, Section } from "@/components/ui";
import {
  generateCookingPlan as generateLocalCookingPlan,
  generateCookingSteps as generateLocalCookingSteps,
  getCutById,
  getCutsByAnimal,
  getDonenessOptions,
  shouldShowThickness,
  type AnimalId,
  type CookingMethod,
  type CookingStep,
  type ProductCut,
} from "../lib/cookingEngine";
import { DEFAULT_COOKING_STEP_IMAGE, getCookingStepImage } from "@/lib/cookingVisuals";
import { ds } from "@/lib/design-system";
import { generateParrilladaPlan } from "@/lib/parrilladaEngine";
import { type SyntheticEvent, type TouchEvent, useEffect, useMemo, useRef, useState } from "react";

type Animal = "Vacuno" | "Cerdo" | "Pollo" | "Pescado" | "Verduras";
type Mode = "inicio" | "coccion" | "menu" | "parrillada" | "cocina" | "guardados";
type Lang = "es" | "en" | "fi";
type EngineLang = "es" | "en";
type Blocks = Record<string, string>;
type SaveMenuStatus = "idle" | "saving" | "success" | "error";
type CookingWizardStep = "animal" | "cut" | "details" | "result";
type SelectOption = string | { label: string; value: string };
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

type AnimalMedia = {
  image: string;
};

const animalIdsByLabel: Record<Animal, AnimalId> = {
  Vacuno: "beef",
  Cerdo: "pork",
  Pollo: "chicken",
  Pescado: "fish",
  Verduras: "vegetables",
};

const animalOptions: Animal[] = ["Vacuno", "Cerdo", "Pollo", "Pescado", "Verduras"];

const texts = {
  es: {
    app: "IA Parrillero Pro",
    title: "Cocina mejor a la parrilla 🔥",
    subtitle: "Motor BBQ con cocción, parrilladas, timeline live y modo cocina.",
    start: "Inicio",
    cooking: "Cocción",
    menu: "Menú",
    parrillada: "Parrillada",
    live: "Cocina",
    saved: "Guardados",
    planCooking: "Planificar cocción",
    createMenu: "Crear menú BBQ",
    parrilladaPro: "Parrillada Pro",
    liveMode: "Modo cocina",
    savedMenus: "Menús guardados",
    chooseAnimal: "Elige animal",
    chooseCut: "Elige corte",
    configurePlan: "Configura el plan",
    result: "Resultado",
    generatePlan: "Generar plan",
    createParrillada: "Crear plan parrillada",
    creating: "Creando...",
    generating: "Generando...",
    saveMenu: "⭐ Guardar menú",
    savingMenu: "Guardando menú...",
    menuSaved: "Menú guardado.",
    menuSaveError: "No se pudo guardar el menú.",
    startCooking: "Cocinar",
    copy: "Copiar",
    whatsapp: "WhatsApp",
    next: "Siguiente",
    reset: "Reset",
    pause: "Pausar",
    startTimer: "Iniciar",
    noResult: "El resultado aparecerá aquí.",
    noSaved: "Todavía no tienes menús guardados.",
    people: "Número de personas",
    eventType: "Tipo de evento",
    meats: "Carnes / productos",
    products: "Productos",
    sides: "Acompañamientos",
    budget: "Presupuesto (€)",
    difficulty: "Dificultad",
    equipment: "Equipo",
    weight: "Peso (kg)",
    thickness: "Grosor (cm)",
    doneness: "Punto",
    keyTips: "Consejos clave",
    planSequence: "Secuencia del plan",
    serveTime: "Hora objetivo de servir",
    localEngine: "Motor local",
    aiFallback: "IA",
    selected: "Seleccionado",
    active: "Activo",
    supabaseReady: "Preparado para Supabase",
  },
  en: {
    app: "AI Grill Master Pro",
    title: "Cook better on the grill 🔥",
    subtitle: "BBQ engine with cooking, grill planning, live timeline and cooking mode.",
    start: "Home",
    cooking: "Cooking",
    menu: "Menu",
    parrillada: "BBQ Pro",
    live: "Cook",
    saved: "Saved",
    planCooking: "Plan cooking",
    createMenu: "Create BBQ menu",
    parrilladaPro: "BBQ Planner Pro",
    liveMode: "Live cooking",
    savedMenus: "Saved menus",
    chooseAnimal: "Choose animal",
    chooseCut: "Choose cut",
    configurePlan: "Configure plan",
    result: "Result",
    generatePlan: "Generate plan",
    createParrillada: "Create BBQ plan",
    creating: "Creating...",
    generating: "Generating...",
    saveMenu: "⭐ Save menu",
    savingMenu: "Saving menu...",
    menuSaved: "Menu saved.",
    menuSaveError: "Could not save menu.",
    startCooking: "Cook",
    copy: "Copy",
    whatsapp: "WhatsApp",
    next: "Next",
    reset: "Reset",
    pause: "Pause",
    startTimer: "Start",
    noResult: "The result will appear here.",
    noSaved: "You do not have saved menus yet.",
    people: "Number of people",
    eventType: "Event type",
    meats: "Meats / products",
    products: "Products",
    sides: "Sides",
    budget: "Budget (€)",
    difficulty: "Difficulty",
    equipment: "Equipment",
    weight: "Weight (kg)",
    thickness: "Thickness (cm)",
    doneness: "Doneness",
    keyTips: "Key tips",
    planSequence: "Plan sequence",
    serveTime: "Target serving time",
    localEngine: "Local engine",
    aiFallback: "AI",
    selected: "Selected",
    active: "Active",
    supabaseReady: "Supabase ready",
  },
  fi: {
    app: "Parrillero Pro",
    title: "Grillaa paremmin 🔥",
    subtitle: "BBQ-moottori: kypsennys, grillijuhlat, live-aikajana ja kokkaustila.",
    start: "Alku",
    cooking: "Kypsennys",
    menu: "Menu",
    parrillada: "BBQ Pro",
    live: "Kokkaus",
    saved: "Tallennetut",
    planCooking: "Suunnittele kypsennys",
    createMenu: "Luo BBQ-menu",
    parrilladaPro: "BBQ Planner Pro",
    liveMode: "Live-kokkaus",
    savedMenus: "Tallennetut menut",
    chooseAnimal: "Valitse ryhmä",
    chooseCut: "Valitse leikkaus",
    configurePlan: "Asetukset",
    result: "Tulos",
    generatePlan: "Luo suunnitelma",
    createParrillada: "Luo BBQ-suunnitelma",
    creating: "Luodaan...",
    generating: "Luodaan...",
    saveMenu: "⭐ Tallenna menu",
    savingMenu: "Tallennetaan menua...",
    menuSaved: "Menu tallennettu.",
    menuSaveError: "Menua ei voitu tallentaa.",
    startCooking: "Kokkaa",
    copy: "Kopioi",
    whatsapp: "WhatsApp",
    next: "Seuraava",
    reset: "Reset",
    pause: "Tauko",
    startTimer: "Aloita",
    noResult: "Tulos näkyy tässä.",
    noSaved: "Ei tallennettuja menuja vielä.",
    people: "Henkilömäärä",
    eventType: "Tapahtuma",
    meats: "Lihat / tuotteet",
    products: "Tuotteet",
    sides: "Lisukkeet",
    budget: "Budjetti (€)",
    difficulty: "Vaikeus",
    equipment: "Väline",
    weight: "Paino (kg)",
    thickness: "Paksuus (cm)",
    doneness: "Kypsyys",
    keyTips: "Tärkeät vinkit",
    planSequence: "Suunnitelman vaiheet",
    serveTime: "Tarjoiluaika",
    localEngine: "Paikallinen moottori",
    aiFallback: "AI",
    selected: "Valittu",
    active: "Aktiivinen",
    supabaseReady: "Supabase-valmis",
  },
};

const animalMedia: Record<Animal, AnimalMedia> = {
  Vacuno: { image: "/animals/vacuno.jpg" },
  Cerdo: { image: "/animals/cerdo.jpg" },
  Pollo: { image: "/animals/pollo.jpg" },
  Pescado: { image: "/animals/pescado.jpg" },
  Verduras: { image: "/animals/vegetales.jpg" },
};

const cutImages: Record<string, string> = {
  aguja: "/cuts/aguja-chuck.jpg",
  lomo_alto: "/cuts/lomo-alto.jpg",
  tomahawk: "/cuts/tomahawk.jpg",
  entrecote: "/cuts/ribeye.jpg",
  picanha: "/cuts/picanha.jpg",
  maminha: "/cuts/maminha.jpg",
  bavette: "/cuts/babette.jpg",
  entrana: "/cuts/skirt-steak.jpg",
  secreto_iberico: "/cuts/secreto.jpg",
  presa_iberica: "/cuts/presa.jpg",
  costillas: "/cuts/costillas.jpg",
  panceta: "/cuts/panceta.jpg",
  solomillo: "/cuts/solomillo-cerdo.jpg",
  pork_chop: "/cuts/chuleta-cerdo.jpg",
  muslos: "/cuts/muslos-pollo.jpg",
  alitas: "/cuts/alitas.jpg",
  pechuga: "/cuts/pechuga.jpg",
  pollo_entero: "/cuts/pollo-entero.jpg",
  rodaballo: "/cuts/rodaballo.jpg",
  salmon: "/cuts/salmon.jpg",
  lubina: "/cuts/lubina.jpg",
  dorada: "/cuts/dorada.jpg",
  maiz: "/cuts/maiz.jpg",
  berenjena: "/cuts/berenjena.jpg",
  patata: "/cuts/patata.jpg",
  esparragos: "/cuts/esparragos.jpg",
  pimientos: "/cuts/pimientos.jpg",
  calabacin: "/cuts/calabacin.jpg",
  setas: "/cuts/setas.jpg",
};

const equipmentOptions = [
  "parrilla gas",
  "parrilla carbón",
  "kamado",
  "cocina interior",
  "Napoleon Rogue 525-2",
];

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
    target.closest("button, input, select, textarea, a, label, [role='button']")
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

function getStepLabel(title: string) {
  const value = title.toLowerCase();

  if (value.includes("precal") || value.includes("preheat")) return "Preheat";
  if (value.includes("sell") || value.includes("sear")) return "Direct heat";
  if (value.includes("indirect")) return "Indirect";
  if (value.includes("repos") || value.includes("rest")) return "Rest";
  if (value.includes("grasa") || value.includes("fat")) return "Fat cap";

  return "Cooking";
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

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
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
    localStorage.setItem("parrillero_saved_menus", JSON.stringify(nextMenus));
  }

  async function saveCurrentMenu() {
    if (!blocks.MENU && !blocks.COMPRA && !blocks.SHOPPING) return;

    const now = new Date();
    const menuName = `Menú Parrillero - ${now.toLocaleDateString(localeForLang(lang))}`;

    setSaveMenuStatus("saving");
    setSaveMenuMessage("");

    try {
      const savedMenu = await saveGeneratedMenu({
        name: menuName,
        lang,
        people: parsePositiveInt(people),
        data: {
          type: "generated_menu",
          generatedAt: now.toISOString(),
          inputs: {
            people,
            eventType,
            products: menuMeats,
            sides,
            budget,
            difficulty,
            equipment,
          },
          blocks,
        },
      });

      const newMenu: SavedMenu = {
        id: savedMenu.id,
        title: savedMenu.name,
        date: new Date(savedMenu.created_at).toLocaleDateString(localeForLang(lang)),
        blocks,
      };

      updateSavedMenus([newMenu, ...savedMenus.filter((menu) => menu.id !== newMenu.id)]);
      setSaveMenuStatus("success");
      setSaveMenuMessage(t.menuSaved);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.menuSaveError;

      setSaveMenuStatus("error");
      setSaveMenuMessage(`${t.menuSaveError} ${errorMessage}`);
    }
  }

  function deleteMenu(id: string) {
    updateSavedMenus(savedMenus.filter((menu) => menu.id !== id));
  }

  function loadMenu(menu: SavedMenu) {
    setBlocks(menu.blocks);
    navigateMode("menu");
  }

  function handleAnimalChange(selectedAnimal: Animal) {
    setAnimal(selectedAnimal);
    setCut("");
    setDoneness(getInitialDoneness(selectedAnimal));
    setBlocks({});
    setCheckedItems({});
    setCookingStep("cut");
  }

  function handleCutChange(selectedCutId: string) {
    setCut(selectedCutId);
    setBlocks({});
    setCheckedItems({});
    setCookingStep("details");
  }

  async function callAI(message: string, createCookSteps = false, visualContext?: CookingVisualContext) {
    setLoading(true);
    setBlocks({});
    setCheckedItems({});
    setSaveMenuStatus("idle");
    setSaveMenuMessage("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    const parsed = parseResponse(data.reply);

    setBlocks(parsed);

    if (createCookSteps) {
      const baseSteps = buildCookStepsFromPlan(parsed);
      const steps = visualContext ? withCookingStepImages(baseSteps, visualContext) : baseSteps;
      setCookSteps(steps);
      setCurrentStep(0);
      setTimeLeft(steps[0].duration);
      setTimerRunning(false);
    }

    setLoading(false);
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
      const visualSteps = withCookingStepImages(localSteps, visualContext);
      setBlocks(localPlan);
      setCheckedItems({});
      setCookSteps(visualSteps);
      setCurrentStep(0);
      setTimeLeft(visualSteps[0].duration);
      setTimerRunning(false);
      setCookingStep("result");
      return;
    }

    await callAI(
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
`);
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

    setBlocks(plan);
    setCheckedItems({});
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
      className={`${ds.shell.page} pb-36 md:pb-28`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <VersionSwitcher />

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
            handleAnimalChange={handleAnimalChange}
            handleCutChange={handleCutChange}
            lang={lang}
            loading={loading}
            selectedCut={selectedCut}
            setCookingStep={setCookingStep}
            setDoneness={setDoneness}
            setEquipment={setEquipment}
            setMode={setMode}
            setTimerRunning={setTimerRunning}
            setThickness={setThickness}
            setWeight={setWeight}
            showThickness={showThickness}
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
              onSaveMenu={blocks.MENU || blocks.COMPRA || blocks.SHOPPING ? saveCurrentMenu : undefined}
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
          <CookingMode
            lang={lang}
            t={t}
            cookSteps={cookSteps}
            currentStep={currentStep}
            cookingAlertsEnabled={cookingAlertsEnabled}
            cookingAlertMessage={cookingAlertMessage}
            hasCookingPlan={Boolean(blocks.PASOS || blocks.STEPS)}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            notificationPermission={notificationPermission}
            onCreatePlan={() => navigateMode("coccion")}
            onEnableAlerts={enableCookingAlerts}
            previousCookStep={previousCookStep}
            setTimerRunning={setTimerRunning}
            goToCookStep={goToCookStep}
            nextCookStep={nextCookStep}
            resetCookMode={resetCookMode}
          />
        )}

        {mode === "guardados" && (
          <SavedMenusSection
            lang={lang}
            menus={savedMenus}
            onCopy={(menu) => navigator.clipboard.writeText(buildText(menu.blocks))}
            onDelete={deleteMenu}
            onOpen={loadMenu}
            t={t}
          />
        )}
      </div>

      <BottomNavigation mode={mode} onModeChange={handleModeChange} t={t} />
    </main>
  );
}

/* COMPONENTS */

function VersionSwitcher() {
  return (
    <div className="hidden">
      {["/", "/v3", "/v4"].map((href, index) => (
        <a
          key={href}
          href={href}
          className={ds.nav.switcherLink}
        >
          V{index === 0 ? 1 : index + 2}
        </a>
      ))}
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
    <header className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2.5 shadow-lg shadow-black/10 backdrop-blur sm:mb-4 sm:rounded-3xl sm:px-4 sm:py-3">
      <div className="min-w-0">
        <Badge className="text-[10px] uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.2em]">{t.app}</Badge>
        <p className="mt-2 hidden text-sm text-slate-400 sm:block">{t.subtitle}</p>
      </div>

      <div className="shrink-0">
        <select
          value={lang}
          onChange={(event) => onLangChange(event.target.value as Lang)}
          className={`${ds.input.compactSelect} max-w-[132px] py-1.5 text-xs sm:max-w-none sm:py-2 sm:text-sm`}
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
          ? "rounded-2xl bg-orange-500 px-3 py-3 text-sm font-bold text-black shadow-lg shadow-orange-500/20 transition active:scale-[0.98]"
          : "rounded-2xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-100 active:scale-[0.98]"
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
  selectedCut,
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
  selectedCut?: CutItem;
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
  return (
    <div className="space-y-3 sm:space-y-6">
      {cookingStep !== "result" && (
        <CookingWizardHeader
          animal={animal}
          cookingStep={cookingStep}
          selectedCut={selectedCut}
          t={t}
        />
      )}

      {cookingStep !== "animal" && cookingStep !== "result" && (
        <p className="px-1 text-center text-[11px] font-medium text-slate-500 md:hidden">
          Desliza para volver
        </p>
      )}

      {cookingStep === "animal" && (
        <CookingAnimalStep
          animal={animal}
          lang={lang}
          onSelectAnimal={handleAnimalChange}
          t={t}
        />
      )}

      {cookingStep === "cut" && (
        <CookingCutStep
          animal={animal}
          cut={cut}
          cuts={cuts}
          onBack={() => setCookingStep("animal")}
          onSelectCut={handleCutChange}
          t={t}
        />
      )}

      {cookingStep === "details" && selectedCut && (
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
      )}

      {cookingStep === "result" && (
        <CookingResultStep
          blocks={blocks}
          checkedItems={checkedItems}
          onEdit={() => setCookingStep("details")}
          setCheckedItems={setCheckedItems}
          setMode={setMode}
          setTimerRunning={setTimerRunning}
          t={t}
        />
      )}
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
      <div className="sticky top-2 z-30 mb-2 rounded-2xl border border-white/10 bg-slate-950/90 p-3 shadow-xl shadow-black/30 backdrop-blur sm:hidden">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">Cocción</h1>
              <Badge className="px-2 py-0.5 text-[10px]">Paso guiado</Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">Animal → Corte → Detalles</p>
          </div>
          {cookingStep !== "animal" && <Badge className="shrink-0" tone="glass">{animal}</Badge>}
        </div>
        <CookingStepIndicator currentStep={cookingStep} />
      </div>

      <Panel className="relative hidden overflow-hidden p-6 sm:block" tone="hero">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="text-xs uppercase tracking-[0.2em]">Paso guiado</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {subtitle}
            </p>
            {cookingStep !== "animal" && (
              <div className="mt-4 flex flex-wrap gap-2">
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
    <div className="grid min-w-full grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/30 p-1 shadow-inner shadow-black/20 sm:min-w-[360px] sm:rounded-2xl sm:gap-2 sm:p-2">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;

        return (
          <div
            key={step.id}
            className={
              isActive
                ? "rounded-lg bg-orange-500 px-2 py-1 text-center text-black shadow-lg shadow-orange-500/20 transition-all duration-200 active:scale-[0.98] sm:rounded-xl sm:px-3 sm:py-2"
                : isComplete
                  ? "rounded-lg border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-center text-orange-200 transition-all duration-200 sm:rounded-xl sm:px-3 sm:py-2"
                  : "rounded-lg px-2 py-1 text-center text-slate-500 transition-all duration-200 sm:rounded-xl sm:px-3 sm:py-2"
            }
          >
            <p className="hidden text-[10px] font-black sm:block sm:text-xs">{step.number}</p>
            <p className="text-[11px] font-semibold leading-4 sm:mt-0.5 sm:text-xs">{step.label}</p>
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
    <Section className="space-y-3 sm:space-y-5" eyebrow="Paso 1" title={t.chooseAnimal}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
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
    <Section className="space-y-3 sm:space-y-5" eyebrow="Paso 2" title={t.chooseCut}>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className={`${ds.panel.highlight} px-3 py-2 sm:p-4`}>
          <p className="text-sm text-orange-300">{t.selected}</p>
          <h2 className="font-bold text-white">{animal}</h2>
        </div>
        <Button className="rounded-full px-3 py-2 text-xs" onClick={onBack} variant="secondary">← {t.reset}</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
      <Panel className="space-y-3 sm:space-y-4 md:col-span-2" tone="form">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div>
            <p className={ds.text.eyebrow}>Paso 3</p>
            <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">{t.configurePlan}</h2>
          </div>
          <Button className="rounded-full px-3 py-2 text-xs" onClick={onBack} variant="secondary">← {t.chooseCut}</Button>
        </div>

        <div className={`${ds.panel.highlight} p-3 sm:p-4`}>
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
  blocks,
  checkedItems,
  onEdit,
  setCheckedItems,
  setMode,
  setTimerRunning,
  t,
}: {
  blocks: Blocks;
  checkedItems: Record<string, boolean>;
  onEdit: () => void;
  setCheckedItems: (value: Record<string, boolean>) => void;
  setMode: (mode: Mode) => void;
  setTimerRunning: (value: boolean) => void;
  t: typeof texts.es;
}) {
  return (
    <div className="space-y-4">
      <ResultCards
        blocks={blocks}
        loading={false}
        checkedItems={checkedItems}
        onEdit={onEdit}
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
      active: true,
      description: "Calcula punto, temperatura, equipo y pasos de cocción para cada corte.",
      emoji: "🥩",
      mode: "coccion" as const,
      stat: "Motor local",
      title: t.planCooking,
    },
    {
      description: "Crea cantidades, compra y orden de servicio para cenas y eventos BBQ.",
      emoji: "🍽️",
      mode: "menu" as const,
      stat: "Menú completo",
      title: t.createMenu,
    },
    {
      description: "Coordina productos, zonas, acompañamientos y timeline de parrillada.",
      emoji: "🔥",
      mode: "parrillada" as const,
      stat: "Timeline + zonas",
      title: t.parrilladaPro,
    },
    {
      description: "Sigue el plan paso a paso con temporizador y guía de ejecución.",
      emoji: "⏱️",
      mode: "cocina" as const,
      stat: "Live cooking",
      title: t.liveMode,
    },
    {
      description: "Recupera planes anteriores y vuelve a abrir tus mejores menús.",
      emoji: "⭐",
      mode: "guardados" as const,
      stat: `${savedMenusCount} ${t.saved}`,
      title: t.savedMenus,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <Panel className="relative p-4 sm:p-8 lg:min-h-[420px]" tone="hero">
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-10 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-5 sm:gap-10">
            <div>
              <Badge className="uppercase tracking-[0.16em] sm:tracking-[0.2em]">BBQ app</Badge>
              <h1 className="mt-3 max-w-3xl text-2xl font-black tracking-[-0.035em] text-white sm:mt-5 sm:text-5xl lg:text-6xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-5 sm:text-lg sm:leading-7">
                <span className="sm:hidden">Elige un modo y empieza a cocinar mejor.</span>
                <span className="hidden sm:inline">{t.subtitle} Diseña el plan, coordina el fuego y cocina con una guía clara de principio a fin.</span>
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
                <Button className="px-5 py-3 text-sm sm:px-6 sm:py-4 sm:text-base" onClick={() => onModeChange("coccion")}>
                  {t.planCooking}
                </Button>
                <Button className="px-5 py-3 text-sm sm:px-6 sm:py-4 sm:text-base" onClick={() => onModeChange("parrillada")} variant="secondary">
                  {t.parrilladaPro}
                </Button>
              </div>
            </div>

            <div className="hidden gap-3 text-sm text-slate-300 sm:grid sm:grid-cols-3">
              <TrustItem label={t.localEngine} value="Cortes premium" />
              <TrustItem label="Timeline live" value={t.liveMode} />
              <TrustItem label={t.savedMenus} value={`${savedMenusCount} ${t.saved}`} />
            </div>
          </div>
        </Panel>

        <div className="hidden lg:block">
          <HomePreviewPanel
            onOpenSaved={() => onModeChange("guardados")}
            savedMenusCount={savedMenusCount}
            t={t}
          />
        </div>
      </section>

      <section className="space-y-3 sm:space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className={ds.text.eyebrow}>Workflows</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:mt-2 sm:text-2xl">Elige cómo quieres cocinar hoy</h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-6 text-slate-400 sm:block">
            Cada modo comparte el mismo motor de planificación, pero está optimizado para un momento distinto de la parrillada.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
          {featureCards.map((card) => (
            <HomeCard
              key={card.mode}
              active={card.active}
              description={card.description}
              emoji={card.emoji}
              onClick={() => onModeChange(card.mode)}
              stat={card.stat}
              title={card.title}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function TrustItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-300">{label}</p>
      <p className="mt-1 font-medium text-white">{value}</p>
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
            <p className="text-sm font-medium text-orange-300">{t.savedMenus}</p>
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
    <nav className={`${ds.nav.bottom} md:hidden`}>
      <div className={`${ds.layout.navGrid} rounded-3xl bg-slate-950/70 p-1`}>
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

function getCookingZone(step: CookingStep) {
  const value = `${step.title} ${step.description}`.toLowerCase();

  if (value.includes("repos") || value.includes("rest")) return "Reposo";
  if (value.includes("serv") || value.includes("serve")) return "Servir";
  if (value.includes("indirect") || value.includes("indirecto") || value.includes("horno")) return "Indirecto";

  return "Directo";
}

function CookingMode({
  lang,
  t,
  cookSteps,
  currentStep,
  cookingAlertsEnabled,
  cookingAlertMessage,
  hasCookingPlan,
  timeLeft,
  timerRunning,
  notificationPermission,
  onCreatePlan,
  onEnableAlerts,
  previousCookStep,
  setTimerRunning,
  goToCookStep,
  nextCookStep,
  resetCookMode,
}: {
  lang: Lang;
  t: typeof texts.es;
  cookSteps: CookingStep[];
  currentStep: number;
  cookingAlertsEnabled: boolean;
  cookingAlertMessage: string;
  hasCookingPlan: boolean;
  timeLeft: number;
  timerRunning: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  onCreatePlan: () => void;
  onEnableAlerts: () => Promise<void>;
  previousCookStep: () => void;
  setTimerRunning: (value: boolean) => void;
  goToCookStep: (stepIndex: number) => void;
  nextCookStep: () => void;
  resetCookMode: () => void;
}) {
  if (!hasCookingPlan || cookSteps.length === 0) {
    return (
      <section className="pb-28">
        <Panel className="overflow-hidden p-0" tone="hero">
          <div className="relative min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.25),transparent_36%),linear-gradient(to_top,rgba(2,6,23,0.98),rgba(15,23,42,0.72),rgba(255,255,255,0.05))]" />
            <div className="relative flex min-h-[520px] flex-col justify-end p-6 sm:p-8">
              <Badge className="w-fit text-xs uppercase tracking-[0.2em]">Modo Cocina</Badge>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Tu sesión live empieza con un plan.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Genera primero un plan de cocción para activar la guía paso a paso, temporizador y progreso live.
              </p>
              <Button className="mt-6 px-5 py-4 font-black" onClick={onCreatePlan}>
                Crear plan de cocción
              </Button>
            </div>
          </div>
        </Panel>
      </section>
    );
  }

  const step = cookSteps[currentStep];
  const nextStep = cookSteps[currentStep + 1];
  const completedSteps = currentStep;
  const totalSteps = cookSteps.length;
  const progress = Math.min(
    100,
    Math.max(0, ((step.duration - timeLeft) / step.duration) * 100)
  );
  const sessionProgress = Math.round(((completedSteps + progress / 100) / totalSteps) * 100);
  const stepLabel = lang === "es" ? "Paso" : "Step";
  const completeLabel = lang === "es" ? "Completar paso" : "Complete step";
  const previousLabel = lang === "es" ? "Anterior" : "Previous";
  const nextLabel = lang === "es" ? "Siguiente" : "Next";
  const pauseLabel = timerRunning ? t.pause : t.startTimer;
  const zone = getCookingZone(step);
  const alertsLabel = lang === "es" ? "Activar avisos" : "Enable alerts";
  const alertsActiveLabel = lang === "es" ? "Avisos activados" : "Alerts enabled";
  const alertsFallbackLabel =
    notificationPermission === "denied"
      ? lang === "es"
        ? "Avisos en app activos"
        : "In-app alerts active"
      : notificationPermission === "unsupported"
        ? lang === "es"
          ? "Sonido y vibración activos"
          : "Sound and vibration active"
        : alertsActiveLabel;

  return (
    <section className="space-y-5 pb-32">
      <Panel className="overflow-hidden p-0" tone="hero">
        <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <StepImage image={step.image} title={step.title} />

          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="text-xs uppercase tracking-[0.2em]">Live cooking</Badge>
              <Badge tone="solidAccent">{zone}</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {cookingAlertsEnabled ? (
                <Badge tone="success">{alertsFallbackLabel}</Badge>
              ) : (
                <Button className="rounded-full px-3 py-2 text-xs" onClick={onEnableAlerts} variant="outlineAccent">
                  {alertsLabel}
                </Button>
              )}

              {cookingAlertMessage && (
                <Badge className="animate-pulse" tone="accent">
                  {cookingAlertMessage}
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-orange-300">
                {stepLabel} {currentStep + 1} of {totalSteps} · {sessionProgress}%
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
                {step.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                {step.description}
              </p>
            </div>

            <div className="rounded-[2rem] border border-orange-400/20 bg-black/35 p-5 text-center shadow-2xl shadow-black/20">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">Countdown</p>
              <p className="mt-2 font-mono text-7xl font-black tracking-tighter text-orange-300 sm:text-8xl">
                {formatTime(timeLeft)}
              </p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-300 via-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    {lang === "es" ? "Siguiente" : "Next"}
                  </p>
                  <p className="mt-1 font-bold text-white">{nextStep?.title ?? (lang === "es" ? "Servir" : "Serve")}</p>
                </div>
                <span className="shrink-0 rounded-2xl bg-orange-500/15 px-3 py-2 text-sm font-bold text-orange-200">
                  {nextStep ? formatTime(nextStep.duration) : "0:00"}
                </span>
              </div>
            </div>

            {step.tips && step.tips.length > 0 && (
              <Card className="border-orange-500/30 bg-orange-500/10" tone="glass">
                <h3 className="font-bold text-orange-300">{t.keyTips}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {step.tips.map((tip) => (
                    <li key={tip}>• {tip}</li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="grid gap-3">
              <Button className="py-4 text-base font-black" fullWidth onClick={nextCookStep}>
                {completeLabel}
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <Button onClick={previousCookStep} disabled={currentStep === 0} variant="secondary">
                  {previousLabel}
                </Button>
                <Button onClick={() => setTimerRunning(!timerRunning)} variant="secondary">
                  {pauseLabel}
                </Button>
                <Button onClick={nextCookStep} disabled={currentStep === totalSteps - 1} variant="secondary">
                  {nextLabel}
                </Button>
              </div>

              <Button fullWidth onClick={resetCookMode} variant="ghost">
                {t.reset}
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Timeline</p>
            <h2 className="mt-1 text-xl font-bold">{t.planSequence}</h2>
          </div>
          <Badge tone="glass">{completedSteps}/{totalSteps} done</Badge>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-300 via-orange-500 to-red-500 transition-all duration-500"
            style={{ width: `${sessionProgress}%` }}
          />
        </div>

        <div className="mt-5 space-y-3">
          {cookSteps.map((item, index) => (
            <CookingStepPreview
              key={`${item.title}-${index}`}
              active={index === currentStep}
              completed={index < currentStep}
              index={index}
              onClick={() => goToCookStep(index)}
              step={item}
            />
          ))}
        </div>
      </Card>
    </section>
  );
}

function handleCookingImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = image.src.endsWith(DEFAULT_COOKING_STEP_IMAGE) ? "/visuals/preheat.jpg" : DEFAULT_COOKING_STEP_IMAGE;
}

function StepImage({ image, title }: { image?: string; title: string }) {
  return (
    <div className="relative h-56 overflow-hidden sm:h-64">
      <img
        src={image ?? DEFAULT_COOKING_STEP_IMAGE}
        alt={title}
        loading="lazy"
        sizes="(min-width: 768px) 420px, 100vw"
        onError={handleCookingImageError}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,146,60,0.28),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.84)_0%,rgba(2,6,23,0.34)_48%,rgba(255,255,255,0.08)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300" />
    </div>
  );
}

function CookingStepPreview({
  active,
  completed,
  index,
  onClick,
  step,
}: {
  active: boolean;
  completed: boolean;
  index: number;
  onClick: () => void;
  step: CookingStep;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "w-full scale-[1.01] overflow-hidden rounded-2xl border border-orange-500 bg-orange-500/20 text-left shadow-lg shadow-orange-500/10 transition active:scale-[0.99]"
          : completed
            ? "w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-950/45 text-left opacity-60 transition hover:opacity-80 active:scale-[0.99]"
            : "w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 text-left transition hover:border-orange-400/30 active:scale-[0.99]"
      }
    >
      <div className="grid grid-cols-[86px_1fr]">
        <div className="relative min-h-full overflow-hidden">
          <img
            src={step.image ?? DEFAULT_COOKING_STEP_IMAGE}
            alt={step.title}
            loading="lazy"
            sizes="86px"
            onError={handleCookingImageError}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
          <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs font-black text-white">
            {completed ? "✓" : index + 1}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
                {getCookingZone(step)}
              </p>
              <h3 className="truncate font-bold text-white">{step.title}</h3>
            </div>
            <span className="shrink-0 text-sm text-slate-400">{formatTime(step.duration)}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{step.description}</p>
        </div>
      </div>
    </button>
  );
}
function ResultCards({
  blocks,
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
    navigator.clipboard.writeText(buildText(blocks));
    alert("Copiado");
  }

  function shareWhatsApp() {
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
        hasResult={hasResult}
        onEdit={onEdit}
        saveMenuStatus={saveMenuStatus}
        t={{
          copy: t.copy,
          result: t.result,
          save: t.saveMenu,
          saving: t.savingMenu,
          share: t.whatsapp,
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
      onClick={onClick}
      className={
        active
          ? "group relative overflow-hidden rounded-[2rem] border border-orange-400/80 bg-slate-950 text-left shadow-[0_24px_70px_rgba(249,115,22,0.24)] ring-1 ring-orange-200/25 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.98]"
          : "group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-left shadow-[0_18px_50px_rgba(2,6,23,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/60 hover:shadow-[0_24px_70px_rgba(249,115,22,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/60 active:scale-[0.98]"
      }
    >
      <div className="relative min-h-32 overflow-hidden sm:min-h-60">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
          style={{
            backgroundImage: `url(${image})`,
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.36),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.68)_36%,rgba(2,6,23,0.14)_72%,rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent opacity-70" />
        <div className={active ? "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300" : "absolute inset-x-0 bottom-0 h-px bg-white/10"} />

        {badge && <Badge className="absolute right-2 top-2 text-[9px] shadow-lg shadow-black/20 backdrop-blur-md sm:right-3 sm:top-3 sm:text-[11px]" tone="glass">{badge}</Badge>}

        {active && <Badge className="absolute bottom-2 right-2 text-[10px] font-black shadow-lg shadow-black/20 sm:bottom-4 sm:right-4 sm:text-xs" tone="selected">{selectedLabel}</Badge>}

        <div className="absolute inset-x-0 bottom-0 p-3 pr-12 sm:p-5 sm:pr-28">
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
      onClick={onClick}
      className={
        active
          ? "group relative overflow-hidden rounded-[2rem] border border-orange-400/80 bg-slate-950 text-left shadow-[0_24px_70px_rgba(249,115,22,0.24)] ring-1 ring-orange-200/25 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.98]"
          : "group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-left shadow-[0_18px_50px_rgba(2,6,23,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/60 hover:shadow-[0_24px_70px_rgba(249,115,22,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/60 active:scale-[0.98]"
      }
    >
      <div className="relative min-h-40 overflow-hidden sm:min-h-72">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
          style={{
            backgroundImage: `url(${cut.image})`,
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,146,60,0.32),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.99)_0%,rgba(2,6,23,0.72)_40%,rgba(2,6,23,0.18)_74%,rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent opacity-70" />
        <div className={active ? "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300" : "absolute inset-x-0 bottom-0 h-px bg-white/10"} />

        {badge && <Badge className="absolute left-2 top-2 text-[9px] shadow-lg shadow-black/20 backdrop-blur-md sm:left-3 sm:top-3 sm:text-[11px]" tone="glass">{badge}</Badge>}
        {active && <Badge className="absolute right-2 top-2 text-[9px] font-black shadow-lg shadow-black/20 sm:right-3 sm:top-3 sm:text-[11px]" tone="solidAccent">{activeLabel}</Badge>}

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
  stat,
  title,
}: {
  active?: boolean;
  description: string;
  emoji: string;
  onClick: () => void;
  stat: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? `${ds.panel.homeCard} border-orange-500/50 bg-gradient-to-br from-orange-500/15 to-slate-900/80 p-4 shadow-orange-500/10 ring-1 ring-orange-300/15 active:scale-[0.98] sm:p-6`
          : `${ds.panel.homeCard} p-4 active:scale-[0.98] sm:p-6`
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className={ds.media.iconTile}>{emoji}</div>
        <Badge className="shrink-0" tone={active ? "accent" : "glass"}>
          {stat}
        </Badge>
      </div>
      <h2 className="mt-4 text-lg font-bold tracking-tight text-white sm:mt-6 sm:text-xl">{title}</h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400 sm:mt-3 sm:line-clamp-none">{description}</p>
      <div className="mt-4 flex items-center text-sm font-semibold text-orange-300 sm:mt-6">
        Abrir modo
        <span className="ml-2 transition group-hover:translate-x-1">→</span>
      </div>
    </button>
  );
}

function Tab({ active, label, emoji, onClick }: { active: boolean; label: string; emoji: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? `${ds.button.tabActive} ring-1 ring-orange-200/30`
          : `${ds.button.tabIdle} opacity-70 hover:opacity-100`
      }
    >
      <div>{emoji}</div>
      <div>{label}</div>
    </button>
  );
}

function PrimaryButton({ onClick, loading, text, loadingText }: { onClick: () => void; loading: boolean; text: string; loadingText: string }) {
  return (
    <Button fullWidth onClick={onClick} disabled={loading} className="px-5 py-4 font-bold">
      {loading ? loadingText : text}
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
