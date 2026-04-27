"use client";

import { saveGeneratedMenu } from "@/app/actions/savedMenus";
import ResultGrid from "@/components/ResultGrid";
import ResultHero from "@/components/ResultHero";
import { Badge, Button, Card, Grid, Panel, Section } from "@/components/ui";
import {
  generateCookingPlan as generateLocalCookingPlan,
  generateCookingSteps as generateLocalCookingSteps,
  type CookingStep,
} from "@/lib/cookingEngine";
import { ds } from "@/lib/design-system";
import { generateParrilladaPlan } from "@/lib/parrilladaEngine";
import { useEffect, useMemo, useState } from "react";

type Animal = "Vacuno" | "Cerdo" | "Pollo" | "Pescado" | "Vegetales";
type Mode = "inicio" | "coccion" | "menu" | "parrillada" | "cocina" | "guardados";
type Lang = "es" | "en" | "fi";
type EngineLang = "es" | "en";
type Blocks = Record<string, string>;
type SaveMenuStatus = "idle" | "saving" | "success" | "error";
type CookingWizardStep = "animal" | "cut" | "details";

type SavedMenu = {
  id: string;
  title: string;
  date: string;
  blocks: Blocks;
};

type CutItem = {
  name: string;
  image: string;
  description: string;
};

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

const animalData: Record<Animal, { icon: string; image: string; cuts: CutItem[] }> = {
  Vacuno: {
    icon: "🥩",
    image: "/animals/vacuno.jpg",
    cuts: [
      { name: "Aguja / Chuck", image: "/cuts/aguja-chuck.jpg", description: "Sabor intenso, ideal para baja temperatura o piezas jugosas." },
      { name: "Lomo alto", image: "/cuts/lomo-alto.jpg", description: "Muy bueno para chuletón, ribeye y cortes premium." },
      { name: "Tomahawk", image: "/cuts/tomahawk.jpg", description: "Corte grueso con hueso, perfecto para sellado + indirecto." },
      { name: "Entrecote / Ribeye", image: "/cuts/ribeye.jpg", description: "Jugoso, marmoleado y muy rápido de cocinar." },
      { name: "Picanha", image: "/cuts/picanha.jpg", description: "Capa de grasa, excelente entera o en steaks." },
      { name: "Maminha", image: "/cuts/maminha.jpg", description: "Tierna y sabrosa, buena para cocción controlada." },
      { name: "Babette", image: "/cuts/babette.jpg", description: "Fina, intensa y perfecta para fuego fuerte." },
      { name: "Skirt steak / Entraña", image: "/cuts/skirt-steak.jpg", description: "Muy sabrosa, cocción rápida y corte contra fibra." },
    ],
  },
  Cerdo: {
    icon: "🐖",
    image: "/animals/cerdo.jpg",
    cuts: [
      { name: "Secreto ibérico", image: "/cuts/secreto.jpg", description: "Graso, rápido y muy jugoso." },
      { name: "Presa ibérica", image: "/cuts/presa.jpg", description: "Premium, buena para punto rosado seguro." },
      { name: "Costillas", image: "/cuts/costillas.jpg", description: "Ideal para lento, humo y glaseado." },
      { name: "Panceta", image: "/cuts/panceta.jpg", description: "Crujiente, grasa y perfecta para fuego controlado." },
      { name: "Solomillo", image: "/cuts/solomillo-cerdo.jpg", description: "Magro, rápido y delicado." },
    ],
  },
  Pollo: {
    icon: "🍗",
    image: "/animals/pollo.jpg",
    cuts: [
      { name: "Muslos", image: "/cuts/muslos-pollo.jpg", description: "Jugosos y fáciles." },
      { name: "Alitas", image: "/cuts/alitas.jpg", description: "Perfectas para dorar y glasear." },
      { name: "Pechuga", image: "/cuts/pechuga.jpg", description: "Magro, requiere control para no secar." },
      { name: "Pollo entero", image: "/cuts/pollo-entero.jpg", description: "Ideal para indirecto." },
    ],
  },
  Pescado: {
    icon: "🐟",
    image: "/animals/pescado.jpg",
    cuts: [
      { name: "Rodaballo", image: "/cuts/rodaballo.jpg", description: "Top para parrilla suave." },
      { name: "Salmón", image: "/cuts/salmon.jpg", description: "Graso y resistente." },
      { name: "Lubina", image: "/cuts/lubina.jpg", description: "Fina y delicada." },
      { name: "Dorada", image: "/cuts/dorada.jpg", description: "Muy buena entera." },
    ],
  },
  Vegetales: {
    icon: "🌽",
    image: "/animals/vegetales.jpg",
    cuts: [
      { name: "Maíz", image: "/cuts/maiz.jpg", description: "Dulce, fácil y perfecto para BBQ." },
      { name: "Berenjena", image: "/cuts/berenjena.jpg", description: "Muy buena para fuego medio." },
      { name: "Patata", image: "/cuts/patata.jpg", description: "Mejor precocida o indirecta." },
      { name: "Espárragos", image: "/cuts/esparragos.jpg", description: "Rápidos y elegantes." },
      { name: "Pimientos", image: "/cuts/pimientos.jpg", description: "Perfectos para asar y pelar." },
    ],
  },
};

const beefDonenessOptions = ["blue", "poco hecho", "medium rare", "medium", "hecho"];
const porkDonenessOptions = ["jugoso seguro", "medio seguro", "muy hecho"];

const thinCutsWithoutThickness = [
  "Secreto ibérico",
  "Babette",
  "Skirt steak / Entraña",
];

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
    image: "/visuals/preheat.jpg",
    tips: ["Parrilla caliente", "Tapa cerrada", "Rejillas limpias"],
  },
  {
    title: "Sellar lado 1",
    duration: 180,
    description: "Carne en zona directa. No mover.",
    image: "/visuals/sear.jpg",
    tips: ["No tocar", "Buscar costra", "No aplastar"],
  },
  {
    title: "Reposo",
    duration: 300,
    description: "Reposar antes de cortar.",
    image: "/visuals/rest.jpg",
    tips: ["No cortar al momento", "Estabilizar jugos", "Cortar después del reposo"],
  },
];

function engineLang(lang: Lang): EngineLang {
  return lang === "es" ? "es" : "en";
}

function hasLocalEngine(animal: Animal) {
  return animal === "Vacuno" || animal === "Cerdo";
}

function getStepLabel(title: string) {
  const value = title.toLowerCase();

  if (value.includes("precal") || value.includes("preheat")) return "🔥 Preheat";
  if (value.includes("sell") || value.includes("sear")) return "🔥 Direct heat";
  if (value.includes("indirect")) return "♨️ Indirect";
  if (value.includes("repos") || value.includes("rest")) return "⏸️ Rest";
  if (value.includes("grasa") || value.includes("fat")) return "🥩 Fat cap";

  return "🔥 Cooking";
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
    let image = "/visuals/sear.jpg";

    if (lower.includes("precal") || lower.includes("preheat")) {
      duration = 600;
      image = "/visuals/preheat.jpg";
    }

    if (lower.includes("indirect")) {
      duration = 300;
      image = "/visuals/indirect.jpg";
    }

    if (lower.includes("repos") || lower.includes("rest")) {
      duration = 300;
      image = "/visuals/rest.jpg";
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
  const [doneness, setDoneness] = useState("poco hecho");
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

  const cuts = useMemo(() => animalData[animal].cuts, [animal]);
  const selectedCut = cuts.find((item) => item.name === cut);

  const currentDonenessOptions = animal === "Cerdo" ? porkDonenessOptions : beefDonenessOptions;
  const showThickness = !thinCutsWithoutThickness.includes(cut);

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

    try {
      const audio = new Audio("/sounds/beep.mp3");
      audio.play().catch(() => {});
    } catch {}

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
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
    setMode("menu");
  }

  function handleAnimalChange(selectedAnimal: Animal) {
    setAnimal(selectedAnimal);
    setCut("");
    setDoneness(selectedAnimal === "Cerdo" ? "jugoso seguro" : "poco hecho");
    setBlocks({});
    setCheckedItems({});
    setCookingStep("cut");
  }

  function handleCutChange(selectedCutName: string) {
    setCut(selectedCutName);
    setBlocks({});
    setCheckedItems({});
    setCookingStep("details");
  }

  async function callAI(message: string, createCookSteps = false) {
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
      const steps = buildCookStepsFromPlan(parsed);
      setCookSteps(steps);
      setCurrentStep(0);
      setTimeLeft(steps[0].duration);
      setTimerRunning(false);
    }

    setLoading(false);
  }

  async function generateCookingPlan() {
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
      setBlocks(localPlan);
      setCheckedItems({});
      setCookSteps(localSteps);
      setCurrentStep(0);
      setTimeLeft(localSteps[0].duration);
      setTimerRunning(false);
      return;
    }

    await callAI(
      `
Language: ${engineLang(lang) === "es" ? "Spanish" : "English"}.
Animal: ${animal}
Cut: ${cut}
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
      true
    );
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

  function handleModeChange(nextMode: Mode) {
    if (nextMode === "coccion") setCookingStep("animal");
    setMode(nextMode);
  }

  return (
    <main className={ds.shell.page}>
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

              <div className={ds.notice.info}>
                {t.supabaseReady}: bbq_events, bbq_timeline_items, grill_zones
              </div>
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
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            setTimerRunning={setTimerRunning}
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
  currentDonenessOptions: string[];
  cut: string;
  cuts: CutItem[];
  doneness: string;
  equipment: string;
  generateCookingPlan: () => Promise<void>;
  handleAnimalChange: (animal: Animal) => void;
  handleCutChange: (cut: string) => void;
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
      <CookingWizardHeader
        animal={animal}
        cookingStep={cookingStep}
        selectedCut={selectedCut}
        t={t}
      />

      {cookingStep === "animal" && (
        <CookingAnimalStep
          animal={animal}
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
          blocks={blocks}
          checkedItems={checkedItems}
          currentDonenessOptions={currentDonenessOptions}
          doneness={doneness}
          equipment={equipment}
          generateCookingPlan={generateCookingPlan}
          loading={loading}
          onBack={() => setCookingStep("cut")}
          selectedCut={selectedCut}
          setCheckedItems={setCheckedItems}
          setDoneness={setDoneness}
          setEquipment={setEquipment}
          setMode={setMode}
          setThickness={setThickness}
          setTimerRunning={setTimerRunning}
          setWeight={setWeight}
          showThickness={showThickness}
          t={t}
          thickness={thickness}
          weight={weight}
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
    <Panel className="relative overflow-hidden p-3 sm:p-6" tone="hero">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-2.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="text-[10px] uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.2em]">Paso guiado</Badge>
          <h1 className="mt-2 text-xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300 sm:mt-3 sm:text-sm sm:leading-6">
            {subtitle}
          </p>
          {cookingStep !== "animal" && (
            <div className="mt-2 flex flex-wrap gap-2 sm:mt-4">
              <Badge>{animal}</Badge>
              {selectedCut && <Badge tone="glass">{selectedCut.name}</Badge>}
            </div>
          )}
        </div>

        <CookingStepIndicator currentStep={cookingStep} />
      </div>
    </Panel>
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
    <div className="grid min-w-full grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/20 p-1 sm:min-w-[360px] sm:gap-2 sm:p-2">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;

        return (
          <div
            key={step.id}
            className={
              isActive
                ? "rounded-xl bg-orange-500 px-2 py-1 text-center text-black shadow-lg shadow-orange-500/20 sm:px-3 sm:py-2"
                : isComplete
                  ? "rounded-xl border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-center text-orange-200 sm:px-3 sm:py-2"
                  : "rounded-xl px-2 py-1 text-center text-slate-500 sm:px-3 sm:py-2"
            }
          >
            <p className="text-[10px] font-black sm:text-xs">{step.number}</p>
            <p className="mt-0.5 text-[10px] font-semibold sm:text-xs">{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function CookingAnimalStep({
  animal,
  onSelectAnimal,
  t,
}: {
  animal: Animal;
  onSelectAnimal: (animal: Animal) => void;
  t: typeof texts.es;
}) {
  return (
    <Section className="space-y-3 sm:space-y-5" eyebrow="Paso 1" title={t.chooseAnimal}>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
        {(Object.keys(animalData) as Animal[]).map((item) => (
          <ImageCard
            key={item}
            active={animal === item}
            title={item}
            subtitle={animalData[item].cuts.slice(0, 2).map((cutItem) => cutItem.name).join(", ")}
            emoji={animalData[item].icon}
            image={animalData[item].image}
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
        <Button onClick={onBack} variant="secondary">← {t.reset}</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {cuts.map((item) => (
          <CutCard
            key={item.name}
            active={cut === item.name}
            cut={item}
            badge={hasLocalEngine(animal) ? t.localEngine : t.aiFallback}
            activeLabel={t.active}
            onClick={() => onSelectCut(item.name)}
          />
        ))}
      </div>
    </Section>
  );
}

function CookingDetailsStep({
  animal,
  blocks,
  checkedItems,
  currentDonenessOptions,
  doneness,
  equipment,
  generateCookingPlan,
  loading,
  onBack,
  selectedCut,
  setCheckedItems,
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
  currentDonenessOptions: string[];
  doneness: string;
  equipment: string;
  generateCookingPlan: () => Promise<void>;
  loading: boolean;
  onBack: () => void;
  selectedCut: CutItem;
  setCheckedItems: (value: Record<string, boolean>) => void;
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
    <Grid variant="split">
      <Panel className="space-y-3 sm:space-y-4" tone="form">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div>
            <p className={ds.text.eyebrow}>Paso 3</p>
            <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">{t.configurePlan}</h2>
          </div>
          <Button onClick={onBack} variant="secondary">← {t.chooseCut}</Button>
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

        <Select label={t.doneness} value={doneness} onChange={setDoneness} options={currentDonenessOptions} />
        <Select label={t.equipment} value={equipment} onChange={setEquipment} options={equipmentOptions} />

        <PrimaryButton onClick={generateCookingPlan} loading={loading} text={t.generatePlan} loadingText={t.generating} />

        <div className={ds.notice.info}>
          {t.supabaseReady}: cooking_plans, cook_steps, user_profiles
        </div>
      </Panel>

      <ResultCards
        blocks={blocks}
        loading={loading}
        checkedItems={checkedItems}
        setCheckedItems={setCheckedItems}
        onStartCooking={() => {
          setMode("cocina");
          setTimerRunning(false);
        }}
        t={t}
      />
    </Grid>
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
      <div className={ds.layout.navGrid}>
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
          {(Object.keys(animalData) as Animal[]).map((item) => (
            <ImageCard
              key={item}
              active={animal === item}
              title={item}
              subtitle={animalData[item].cuts.slice(0, 2).map((cutItem) => cutItem.name).join(", ")}
              emoji={animalData[item].icon}
              image={animalData[item].image}
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
              key={item.name}
              active={cut === item.name}
              cut={item}
              badge={hasLocalEngine(animal) ? t.localEngine : t.aiFallback}
              activeLabel={t.active}
              onClick={() => handleCutChange(item.name)}
            />
          ))}
        </Grid>
      </Section>
    </>
  );
}

function CookingMode({
  lang,
  t,
  cookSteps,
  currentStep,
  timeLeft,
  timerRunning,
  setTimerRunning,
  nextCookStep,
  resetCookMode,
}: {
  lang: Lang;
  t: typeof texts.es;
  cookSteps: CookingStep[];
  currentStep: number;
  timeLeft: number;
  timerRunning: boolean;
  setTimerRunning: (value: boolean) => void;
  nextCookStep: () => void;
  resetCookMode: () => void;
}) {
  const step = cookSteps[currentStep];
  const progress = Math.min(
    100,
    Math.max(0, ((step.duration - timeLeft) / step.duration) * 100)
  );

  return (
    <section className="grid gap-5 md:grid-cols-[420px_1fr]">
      <Card className="overflow-hidden p-0">
        <StepImage image={step.image} title={step.title} />
        <div className="p-5">
          <p className="text-sm text-orange-400">
            {lang === "es" ? "Paso" : "Step"} {currentStep + 1} / {cookSteps.length}
          </p>

          <h2 className="mt-2 text-3xl font-bold">{step.title}</h2>
          <p className="mt-3 text-slate-300">{step.description}</p>

          <div className={ds.panel.timer}>
            <p className="text-7xl font-bold text-orange-400">{formatTime(timeLeft)}</p>

            <div className={ds.media.progressTrack}>
              <div
                className={ds.media.progressBar}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {step.tips && step.tips.length > 0 && (
            <Card className="mt-5 border-orange-500/30 bg-orange-500/10" tone="glass">
              <h3 className="font-bold text-orange-300">{t.keyTips}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {step.tips.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button onClick={() => setTimerRunning(!timerRunning)} fullWidth>
              {timerRunning ? t.pause : t.startTimer}
            </Button>

            <Button onClick={nextCookStep} fullWidth variant="secondary">
              {t.next}
            </Button>
          </div>

          <Button className="mt-3" fullWidth onClick={resetCookMode} variant="ghost">
            {t.reset}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-bold">{t.planSequence}</h2>

        <div className="space-y-3">
          {cookSteps.map((item, index) => (
            <CookingStepPreview
              key={`${item.title}-${index}`}
              active={index === currentStep}
              step={item}
            />
          ))}
        </div>
      </Card>
    </section>
  );
}

function StepImage({ image, title }: { image?: string; title: string }) {
  if (!image) return null;

  return (
    <div className="relative h-52 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.95), rgba(2,6,23,0.25)), url(${image})`,
        }}
      />
      <div className="absolute bottom-3 left-3 rounded bg-black/60 px-3 py-1 text-xs font-semibold text-white">
        {getStepLabel(title)}
      </div>
    </div>
  );
}

function CookingStepPreview({
  active,
  step,
}: {
  active: boolean;
  step: CookingStep;
}) {
  return (
    <div
      className={
        active
          ? "scale-[1.02] overflow-hidden rounded-2xl border border-orange-500 bg-orange-500/20 shadow-lg"
          : "overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80"
      }
    >
      {step.image && (
        <div className="relative h-24 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.9), rgba(2,6,23,0.25)), url(${step.image})`,
            }}
          />
          <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
            {getStepLabel(step.title)}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold">{step.title}</h3>
          <span className="text-sm text-slate-400">{formatTime(step.duration)}</span>
        </div>
        <p className="mt-2 text-sm text-slate-400">{step.description}</p>
      </div>
    </div>
  );
}

function ResultCards({
  blocks,
  loading,
  checkedItems,
  setCheckedItems,
  onStartCooking,
  onSaveMenu,
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
  emoji,
  image,
  badge,
  selectedLabel,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  emoji: string;
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
          ? "group relative overflow-hidden rounded-3xl border border-orange-500 bg-orange-500/20 text-left shadow-[0_0_35px_rgba(249,115,22,0.25)]"
          : "group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-left transition hover:-translate-y-1 hover:border-orange-500/70 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]"
      }
    >
      <div className="relative h-28 overflow-hidden sm:h-40">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.95), rgba(2,6,23,0.2)), url(${image})`,
          }}
        />

        <div className="absolute left-3 top-3 rounded-2xl bg-black/55 px-3 py-2 text-2xl backdrop-blur sm:left-4 sm:top-4 sm:text-3xl">{emoji}</div>

        {badge && <Badge className="absolute right-3 top-3 text-[11px]" tone="solidAccent">{badge}</Badge>}

        {active && <Badge className="absolute bottom-3 right-3 font-black" tone="selected">✓ {selectedLabel}</Badge>}
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="text-base font-black sm:text-lg">{title}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-slate-400 sm:line-clamp-2">{subtitle}</p>
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
          ? "group relative overflow-hidden rounded-3xl border border-orange-500 bg-orange-500/20 text-left shadow-[0_0_35px_rgba(249,115,22,0.25)]"
          : "group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-left transition hover:-translate-y-1 hover:border-orange-500/70 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]"
      }
    >
      <div className="relative h-32 overflow-hidden sm:h-44">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.96), rgba(2,6,23,0.1)), url(${cut.image})`,
          }}
        />

        {badge && <Badge className="absolute left-3 top-3 text-[11px]" tone="glass">{badge}</Badge>}
        {active && <Badge className="absolute right-3 top-3 text-[11px] font-black" tone="solidAccent">✓ {activeLabel}</Badge>}

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3 className="text-lg font-black text-white sm:text-xl">{cut.name}</h3>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <p className="line-clamp-2 text-xs leading-5 text-slate-400 sm:line-clamp-3 sm:text-sm">{cut.description}</p>
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
          ? `${ds.panel.homeCard} border-orange-500/50 bg-gradient-to-br from-orange-500/15 to-slate-900/80 p-4 shadow-orange-500/10 sm:p-6`
          : `${ds.panel.homeCard} p-4 sm:p-6`
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
      className={active ? ds.button.tabActive : ds.button.tabIdle}
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

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div>
      <label className={ds.input.label}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={ds.input.field}
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}
