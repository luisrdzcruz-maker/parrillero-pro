"use client";

import {
  generateCookingPlan as generateLocalCookingPlan,
  generateCookingSteps as generateLocalCookingSteps,
  type CookingStep,
} from "@/lib/cookingEngine";
import { useEffect, useMemo, useState } from "react";
import { generateParrilladaPlan } from "@/lib/parrilladaEngine";

type Animal = "Vacuno" | "Cerdo" | "Pollo" | "Pescado" | "Vegetales";
type Mode = "inicio" | "coccion" | "menu" | "parrillada" | "cocina" | "guardados";
type Lang = "es" | "en";
type Blocks = Record<string, string>;

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
    subtitle: "Planes cortos, menús BBQ, listas de compra y modo cocina en vivo.",
    start: "Inicio",
    cooking: "Cocción",
    menu: "Menú",
    live: "Cocina",
    saved: "Guardados",
    planCooking: "Planificar cocción",
    createMenu: "Crear menú BBQ",
    liveMode: "Modo cocina",
    savedMenus: "Menús guardados",
    chooseAnimal: "Elige animal",
    chooseCut: "Elige corte",
    configurePlan: "Configura el plan",
    result: "Resultado",
    generatePlan: "Generar plan",
    creating: "Creando menú...",
    generating: "Generando...",
    saveMenu: "⭐ Guardar menú",
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
    sides: "Acompañamientos",
    budget: "Presupuesto (€)",
    difficulty: "Dificultad",
    equipment: "Equipo",
    weight: "Peso (kg)",
    thickness: "Grosor (cm)",
    doneness: "Punto",
    keyTips: "Consejos clave",
    planSequence: "Secuencia del plan",
  },
  en: {
    app: "AI Grill Master Pro",
    title: "Cook better on the grill 🔥",
    subtitle: "Short plans, BBQ menus, shopping lists and live cooking mode.",
    start: "Home",
    cooking: "Cooking",
    menu: "Menu",
    live: "Cook",
    saved: "Saved",
    planCooking: "Plan cooking",
    createMenu: "Create BBQ menu",
    liveMode: "Live cooking",
    savedMenus: "Saved menus",
    chooseAnimal: "Choose animal",
    chooseCut: "Choose cut",
    configurePlan: "Configure plan",
    result: "Result",
    generatePlan: "Generate plan",
    creating: "Creating menu...",
    generating: "Generating...",
    saveMenu: "⭐ Save menu",
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
    sides: "Sides",
    budget: "Budget (€)",
    difficulty: "Difficulty",
    equipment: "Equipment",
    weight: "Weight (kg)",
    thickness: "Thickness (cm)",
    doneness: "Doneness",
    keyTips: "Key tips",
    planSequence: "Plan sequence",
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
      { name: "Presa ibérica", image: "/cuts/presa.jpg", description: "Premium, buena para punto rosado." },
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
    title: "Sellar lado 2",
    duration: 180,
    description: "Dar la vuelta una sola vez.",
    image: "/visuals/sear.jpg",
    tips: ["Voltear una vez", "Mantener fuego fuerte", "Comprobar costra"],
  },
  {
    title: "Reposo",
    duration: 300,
    description: "Reposar antes de cortar.",
    image: "/visuals/rest.jpg",
    tips: ["No cortar al momento", "Estabilizar jugos", "Cortar después del reposo"],
  },
];

function getStepStatus(timeLeft: number, duration: number) {
  const progress = (duration - timeLeft) / duration;

  if (timeLeft <= 0) return "Terminado";
  if (timeLeft <= 30) return "Últimos segundos";
  if (progress < 0.15) return "Preparar";
  return "Cocinando";
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

  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length === 0) return defaultCookSteps;

  return lines.map((line) => {
    const lower = line.toLowerCase();
    let duration = 300;
    let image = "/visuals/sear.jpg";

    if (lower.includes("precal") || lower.includes("preheat")) {
      duration = 600;
      image = "/visuals/preheat.jpg";
    }

    if (lower.includes("sell") || lower.includes("sear") || lower.includes("lado") || lower.includes("side")) {
      duration = 180;
      image = "/visuals/sear.jpg";
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

function getShoppingItems(text: string) {
  return text
    .split("\n")
    .map((item) => item.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function formatTitle(title: string) {
  const map: Record<string, string> = {
    SETUP: "🔥 Setup",
    TIEMPOS: "⏱️ Tiempos",
    TIMES: "⏱️ Times",
    TEMPERATURA: "🌡️ Temperatura",
    TEMPERATURE: "🌡️ Temperature",
    PASOS: "🧠 Pasos",
    STEPS: "🧠 Steps",
    ERROR: "⚠️ Error clave",
    MENU: "🍽️ Menú",
    CANTIDADES: "📊 Cantidades",
    QUANTITIES: "📊 Quantities",
    TIMING: "⏰ Timing",
    TIMELINE: "⏰ Timing",
    ORDEN: "🔥 Orden de cocción",
    ORDER: "🔥 Cooking order",
    COMPRA: "🛒 Lista de compra",
    SHOPPING: "🛒 Shopping list",
    GRILL_MANAGER: "🔥 Grill Manager Pro",    
  };

  return map[title] || title;
}

function getZoneLabel(zone: string) {
  if (zone === "directa") return "🔥 Directo";
  if (zone === "indirecta") return "♨️ Indirecto";
  if (zone === "acompañamiento") return "🥔 Acompañamiento";
  if (zone === "reposo") return "✅ Servir";
  return "🔥 BBQ";
}

function getZoneClass(zone: string) {
  if (zone === "directa") return "border-orange-500 bg-orange-500/15";
  if (zone === "indirecta") return "border-yellow-500 bg-yellow-500/10";
  if (zone === "acompañamiento") return "border-green-500 bg-green-500/10";
  if (zone === "reposo") return "border-blue-500 bg-blue-500/10";
  return "border-slate-700 bg-slate-900";
}

function parseTimeline(content: string) {
  return content
    .split("\n")
    .map((row) => {
      const [start, end, name, zone, duration, notes] = row.split("|");
      return { start, end, name, zone, duration, notes };
    })
    .filter((item) => item.start && item.name);
}
function minutesFromTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function secondsToClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildText(blocks: Blocks) {
  return Object.keys(blocks)
    .map((key) => `${key}\n${blocks[key]}`)
    .join("\n\n");
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function Home() {
  function generateParrillada() {
  const plan = generateParrilladaPlan({
    people: parrilladaPeople,
    serveTime,
    products: parrilladaProducts,
    sides: parrilladaSides,
    equipment,
    language: lang,
  });
  console.log("PLAN PARRILLADA:", plan);
  setBlocks(plan);
  setCheckedItems({});
  }
  const [lang, setLang] = useState<Lang>("es");
  const t = texts[lang];

  const [mode, setMode] = useState<Mode>("inicio");

  const [animal, setAnimal] = useState<Animal>("Vacuno");
  const [cut, setCut] = useState("Aguja / Chuck");
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

  const [blocks, setBlocks] = useState<Blocks>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [loading, setLoading] = useState(false);

  const [cookSteps, setCookSteps] = useState<CookingStep[]>(defaultCookSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultCookSteps[0].duration);
  const [timerRunning, setTimerRunning] = useState(false);

  const cuts = useMemo(() => animalData[animal].cuts, [animal]);
  const selectedCut = cuts.find((item) => item.name === cut);
  const currentDonenessOptions =
    animal === "Cerdo" ? porkDonenessOptions : beefDonenessOptions;

  const showThickness = !thinCutsWithoutThickness.includes(cut);
  const [parrilladaPeople, setParrilladaPeople] = useState("6");
  const [serveTime, setServeTime] = useState("18:00");
  const [parrilladaProducts, setParrilladaProducts] = useState("costillas, chuletón, secreto ibérico, maíz");
  const [parrilladaSides, setParrilladaSides] = useState("patatas, ensalada, chimichurri");
  useEffect(() => {
    const stored = localStorage.getItem("parrillero_saved_menus");

    if (stored) {
      setSavedMenus(JSON.parse(stored) as SavedMenu[]);
    }
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

    try {
      const audio = new Audio("/sounds/beep.mp3");
      audio.play().catch(() => {});
    } catch {}

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  function updateSavedMenus(nextMenus: SavedMenu[]) {
    setSavedMenus(nextMenus);
    localStorage.setItem("parrillero_saved_menus", JSON.stringify(nextMenus));
  }

  function saveCurrentMenu() {
    if (!blocks.MENU && !blocks.COMPRA && !blocks.SHOPPING) return;

    const newMenu: SavedMenu = {
      id: crypto.randomUUID(),
      title: `${eventType} · ${people} personas`,
      date: new Date().toLocaleDateString(),
      blocks,
    };

    updateSavedMenus([newMenu, ...savedMenus]);
    setMode("guardados");
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
    setCut(animalData[selectedAnimal].cuts[0].name);

    if (selectedAnimal === "Cerdo") {
      setDoneness("jugoso seguro");
    } else {
      setDoneness("poco hecho");
    }

    setBlocks({});
    setCheckedItems({});
  }

  function handleCutChange(selectedCutName: string) {
    setCut(selectedCutName);
    setBlocks({});
    setCheckedItems({});
  }

  async function callAI(message: string, createCookSteps = false) {
    setLoading(true);
    setBlocks({});
    setCheckedItems({});

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      thicknessCm: thickness,
      doneness,
      equipment,
      language: lang,
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
Language: ${lang === "es" ? "Spanish" : "English"}.

Caso práctico / Practical case: planificar cocción / plan cooking.

Animal: ${animal}
Corte/producto / Cut/product: ${cut}
Peso / Weight: ${weight} kg
Grosor / Thickness: ${thickness} cm
Punto deseado / Desired doneness: ${doneness}
Equipo / Equipment: ${equipment}

If language is Spanish, respond with these exact block titles:
SETUP
TIEMPOS
TEMPERATURA
PASOS
ERROR

If language is English, respond with these exact block titles:
SETUP
TIMES
TEMPERATURE
STEPS
ERROR

Short, practical and actionable.
`,
      true
    );
  }

  async function generateMenuPlan() {
    await callAI(`
Language: ${lang === "es" ? "Spanish" : "English"}.

Caso práctico / Practical case: crear menú BBQ / create BBQ menu.

Personas / People: ${people}
Tipo de evento / Event type: ${eventType}
Carnes/productos principales / Main meats/products: ${menuMeats}
Acompañamientos / Sides: ${sides}
Presupuesto / Budget: ${budget} €
Nivel / Difficulty: ${difficulty}
Equipo / Equipment: ${equipment}

If language is Spanish, respond with these exact block titles:
MENU
CANTIDADES
TIMING
ORDEN
COMPRA
ERROR

If language is English, respond with these exact block titles:
MENU
QUANTITIES
TIMING
ORDER
SHOPPING
ERROR

Short, practical and actionable.
`);
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

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-5 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <div className="mb-4 flex justify-end">
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value as Lang);
                setBlocks({});
                setCheckedItems({});
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          <p className="text-sm font-medium text-orange-400">{t.app}</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            {t.subtitle}
          </p>
        </header>

        {mode === "inicio" && (
          <section className="grid gap-4 md:grid-cols-5">
            <HomeCard title={t.planCooking} description={t.configurePlan} emoji="🥩" onClick={() => setMode("coccion")} />
            <HomeCard title={t.createMenu} description={`${t.people}, ${t.meats.toLowerCase()}`} emoji="🍽️" onClick={() => setMode("menu")} />
            <HomeCard title={t.liveMode} description="Timer + steps" emoji="⏱️" onClick={() => setMode("cocina")} />
            <HomeCard title={t.savedMenus} description={`${savedMenus.length}`} emoji="⭐" onClick={() => setMode("guardados")} />
            <HomeCard  title="Parrillada Pro"  description="Coordina cortes, tiempos y compra."  emoji="🔥"  onClick={() => setMode("parrillada")}/>
          </section>
        )}
        {mode === "parrillada" && (
          <section className="grid gap-5 md:grid-cols-[380px_1fr]">
            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-bold">Parrillada Pro</h2>

              <Input
                label="Personas"
                value={parrilladaPeople}
                onChange={setParrilladaPeople}
                placeholder="Ej: 6"
              />

              <Input
                label="Hora objetivo de servir"
                value={serveTime}
                onChange={setServeTime}
                placeholder="Ej: 18:00"
              />

              <Input
                label="Productos"
                value={parrilladaProducts}
                onChange={setParrilladaProducts}
                placeholder="Ej: costillas, chuletón, secreto"
              />

              <Input
                label="Acompañamientos"
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

              <button
                onClick={generateParrillada}
                className="w-full rounded-2xl bg-orange-500 px-5 py-4 font-bold"
              >
                Crear plan parrillada
              </button>
            </div>

            <ResultCards
              blocks={blocks}
              loading={loading}
              checkedItems={checkedItems}
              setCheckedItems={setCheckedItems}
              t={t}
            />
          </section>
        )}
        {mode === "coccion" && (
          <>
          <section className="mb-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-orange-400">
                  {lang === "es" ? "Paso 1" : "Step 1"}
                </p>
                <h2 className="text-2xl font-black">{t.chooseAnimal}</h2>
              </div>

              <p className="hidden text-sm text-slate-400 md:block">
                {lang === "es" ? "Elige la categoría principal" : "Choose the main category"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {(Object.keys(animalData) as Animal[]).map((item) => (
                <ImageCard
                  key={item}
                  active={animal === item}
                  title={item}
                  subtitle={animalData[item].cuts.slice(0, 2).map((cutItem) => cutItem.name).join(", ")}
                  emoji={animalData[item].icon}
                  image={animalData[item].image}
                  badge={hasLocalEngine(item) ? "Motor local" : "IA"}
                  onClick={() => handleAnimalChange(item)}
                />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-orange-400">
                  {lang === "es" ? "Paso 2" : "Step 2"}
                </p>
                <h2 className="text-2xl font-black">{t.chooseCut}</h2>
              </div>

              <p className="hidden text-sm text-slate-400 md:block">
                {lang === "es" ? "Selecciona el corte concreto" : "Select the exact cut"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cuts.map((item) => (
                <CutCard
                  key={item.name}
                  active={cut === item.name}
                  cut={item}
                  badge={hasLocalEngine(animal) ? "Motor local" : "IA"}
                  onClick={() => handleCutChange(item.name)}
                />
              ))}
            </div>
          </section>

            <section className="grid gap-5 md:grid-cols-[380px_1fr]">
              <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="text-xl font-bold">{t.configurePlan}</h2>

                {selectedCut && (
                  <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
                    <p className="text-sm text-orange-300">{animal}</p>
                    <h3 className="font-bold">{selectedCut.name}</h3>
                    <p className="mt-1 text-sm text-slate-300">{selectedCut.description}</p>
                  </div>
                )}

                <Input label={t.weight} value={weight} onChange={setWeight} placeholder="Ej: 1.2" />
                {showThickness && (
                <Input
                  label={t.thickness}
                  value={thickness}
                  onChange={setThickness}
                  placeholder="Ej: 5"
                />
              )}

              <Select
                label={t.doneness}
                value={doneness}
                onChange={setDoneness}
                options={currentDonenessOptions}
              />
                <Select label={t.equipment} value={equipment} onChange={setEquipment} options={equipmentOptions} />

                <PrimaryButton onClick={generateCookingPlan} loading={loading} text={t.generatePlan} loadingText={t.generating} />
              </div>

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
            </section>
          </>
        )}

        {mode === "menu" && (
          <section className="grid gap-5 md:grid-cols-[380px_1fr]">
            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
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
                <button onClick={saveCurrentMenu} className="w-full rounded-2xl border border-orange-500 px-5 py-4 font-bold text-orange-300">
                  {t.saveMenu}
                </button>
              )}
            </div>

            <ResultCards blocks={blocks} loading={loading} checkedItems={checkedItems} setCheckedItems={setCheckedItems} t={t} />
          </section>
        )}

        {mode === "cocina" && (
          <section className="grid gap-5 md:grid-cols-[420px_1fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              {cookSteps[currentStep].image && (
                <div className="relative h-52 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.95), rgba(2,6,23,0.25)), url(${cookSteps[currentStep].image})`,
                    }}
                  />

                  <div className="absolute bottom-3 left-3 rounded bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                    {getStepLabel(cookSteps[currentStep].title)}
                  </div>
                </div>
              )}

              <div className="p-5">
                <p className="text-sm text-orange-400">
                  {lang === "es" ? "Paso" : "Step"} {currentStep + 1} / {cookSteps.length}
                </p>

                <h2 className="mt-2 text-3xl font-bold">{cookSteps[currentStep].title}</h2>

                <p className="mt-3 text-slate-300">{cookSteps[currentStep].description}</p>
                <div className="mt-5 rounded-3xl border border-orange-500/40 bg-orange-500/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-300">
                    Chef asistente ·{" "}
                    {getStepStatus(timeLeft, cookSteps[currentStep].duration)}
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-white">
                    {timeLeft <= 30 && cookSteps[currentStep].warningCue
                      ? cookSteps[currentStep].warningCue
                      : cookSteps[currentStep].assistantCue || "Sigue el paso actual"}
                  </h3>
                </div>
                <div className="mt-6 rounded-3xl bg-slate-950 p-8 text-center">
                  <p className="text-7xl font-bold text-orange-400">
                    {formatTime(timeLeft)}
                  </p>

                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-[width] duration-1000 ease-linear"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((cookSteps[currentStep].duration - timeLeft) /
                              cookSteps[currentStep].duration) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {cookSteps[currentStep].tips && cookSteps[currentStep].tips.length > 0 && (
                  <div className="mt-5 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-5">
                    <h3 className="font-bold text-orange-300">{t.keyTips}</h3>

                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {cookSteps[currentStep].tips?.map((tip) => (
                        <li key={tip}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="rounded-2xl bg-orange-500 px-5 py-4 font-bold"
                  >
                    {timerRunning ? t.pause : t.startTimer}
                  </button>

                  <button
                    onClick={nextCookStep}
                    className="rounded-2xl border border-slate-700 px-5 py-4 font-bold"
                  >
                    {t.next}
                  </button>
                </div>

                <button
                  onClick={resetCookMode}
                  className="mt-3 w-full rounded-2xl border border-slate-700 px-5 py-4 text-slate-300"
                >
                  {t.reset}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-4 text-xl font-bold">{t.planSequence}</h2>

              <div className="space-y-3">
                {cookSteps.map((step, index) => (
                  <div
                    key={`${step.title}-${index}`}
                    className={
                      index === currentStep
                        ? "scale-[1.02] overflow-hidden rounded-2xl border border-orange-500 bg-orange-500/20 shadow-lg"
                        : "overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
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
                        <span className="text-sm text-slate-400">
                          {formatTime(step.duration)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-400">
                        {step.description}
                      </p>

                      {step.tips && step.tips.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {step.tips.slice(0, 2).map((tip) => (
                            <span
                              key={tip}
                              className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                            >
                              {tip}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {mode === "guardados" && (
          <section>
            <h2 className="mb-4 text-2xl font-bold">{t.savedMenus}</h2>

            {savedMenus.length === 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                {t.noSaved}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {savedMenus.map((menu) => (
                <div key={menu.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm text-orange-400">{t.savedMenus}</p>
                  <h3 className="mt-1 text-xl font-bold">{menu.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{menu.date}</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => loadMenu(menu)} className="rounded-xl bg-orange-500 px-4 py-2 font-bold">
                      {lang === "es" ? "Abrir" : "Open"}
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(buildText(menu.blocks))} className="rounded-xl border border-slate-700 px-4 py-2">
                      {t.copy}
                    </button>
                    <button onClick={() => deleteMenu(menu.id)} className="rounded-xl border border-red-500/60 px-4 py-2 text-red-300">
                      {lang === "es" ? "Borrar" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-6 gap-2">
          <Tab  active={mode === "parrillada"}  label="Parrillada"  emoji="🔥"  onClick={() => setMode("parrillada")}/>
          <Tab active={mode === "inicio"} label={t.start} emoji="🏠" onClick={() => setMode("inicio")} />
          <Tab active={mode === "coccion"} label={t.cooking} emoji="🥩" onClick={() => setMode("coccion")} />
          <Tab active={mode === "menu"} label={t.menu} emoji="🍽️" onClick={() => setMode("menu")} />
          <Tab active={mode === "cocina"} label={t.live} emoji="⏱️" onClick={() => setMode("cocina")} />
          <Tab active={mode === "guardados"} label={t.saved} emoji="⭐" onClick={() => setMode("guardados")} />
        </div>
      </nav>
    </main>
  );
}

function ImageCard({
  active,
  title,
  subtitle,
  emoji,
  image,
  badge,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  emoji: string;
  image: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "group relative overflow-hidden rounded-[28px] border border-orange-500 bg-orange-500/20 text-left shadow-[0_0_35px_rgba(249,115,22,0.25)]"
          : "group relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 text-left transition hover:-translate-y-1 hover:border-orange-500/70 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]"
      }
    >
      <div className="relative h-40 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.95), rgba(2,6,23,0.2)), url(${image})`,
          }}
        />

        <div className="absolute left-4 top-4 rounded-2xl bg-black/55 px-3 py-2 text-3xl backdrop-blur">
          {emoji}
        </div>

        {badge && (
          <div className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold text-white">
            {badge}
          </div>
        )}

        {active && (
          <div className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
            ✓ Seleccionado
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-black">{title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-slate-400">{subtitle}</p>
      </div>
    </button>
  );
}

function CutCard({
  active,
  cut,
  badge,
  onClick,
}: {
  active: boolean;
  cut: CutItem;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "group relative overflow-hidden rounded-[28px] border border-orange-500 bg-orange-500/20 text-left shadow-[0_0_35px_rgba(249,115,22,0.25)]"
          : "group relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 text-left transition hover:-translate-y-1 hover:border-orange-500/70 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]"
      }
    >
      <div className="relative h-44 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.96), rgba(2,6,23,0.1)), url(${cut.image})`,
          }}
        />

        {badge && (
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
            {badge}
          </div>
        )}

        {active && (
          <div className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-black text-white">
            ✓ Activo
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-black text-white">{cut.name}</h3>
        </div>
      </div>

      <div className="p-4">
        <p className="line-clamp-3 text-sm text-slate-400">{cut.description}</p>
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
  t,
}: {
  blocks: Blocks;
  loading: boolean;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
  onStartCooking?: () => void;
  t: typeof texts.es;
}) {
  const keys = Object.keys(blocks);

  function copyText() {
    navigator.clipboard.writeText(buildText(blocks));
    alert("Copiado");
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(buildText(blocks))}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t.result}</h2>

        {keys.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {onStartCooking && (blocks.PASOS || blocks.STEPS) && (
              <button onClick={onStartCooking} className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold">
                {t.startCooking}
              </button>
            )}

            <button onClick={copyText} className="rounded-xl border border-slate-700 px-3 py-2 text-sm">
              {t.copy}
            </button>

            <button onClick={shareWhatsApp} className="rounded-xl bg-green-600 px-3 py-2 text-sm font-bold">
              {t.whatsapp}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {keys.map((key) =>
          key === "TIMELINE" ? (
            <TimelineCard
              key={key}
              title="⏱️ Timeline Parrillada"
              content={blocks[key]}
            />
          ) : key === "GRILL_MANAGER" ? (
            <GrillManagerCard
              key={key}
              title="🔥 Grill Manager Pro"
              content={blocks[key]}
            />
          ) : key === "COMPRA" || key === "SHOPPING" ? (
            <ShoppingListCard
              key={key}
              title={formatTitle(key)}
              content={blocks[key]}
              checkedItems={checkedItems}
              setCheckedItems={setCheckedItems}
            />
          ) : (
            <Card key={key} title={formatTitle(key)} content={blocks[key]} />
          )
        )}

        {!loading && keys.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400 md:col-span-2">
            {t.noResult}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-orange-400 md:col-span-2">
            {t.generating}
          </div>
        )}
      </div>
    </div>
  );
}

function ShoppingListCard({
  title,
  content,
  checkedItems,
  setCheckedItems,
}: {
  title: string;
  content: string;
  checkedItems: Record<string, boolean>;
  setCheckedItems: (value: Record<string, boolean>) => void;
}) {
  const items = getShoppingItems(content);

  return (
    <div className="rounded-3xl border border-orange-500/40 bg-slate-900 p-5 md:col-span-2">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>

      <div className="space-y-3">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-950 p-3 text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(checkedItems[item])}
              onChange={() => setCheckedItems({ ...checkedItems, [item]: !checkedItems[item] })}
              className="h-5 w-5 accent-orange-500"
            />

            <span className={checkedItems[item] ? "text-slate-500 line-through" : ""}>
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function GrillManagerCard({ title, content }: { title: string; content: string }) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="rounded-3xl border border-red-500/40 bg-slate-900 p-5 md:col-span-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Control inteligente de zonas y prioridades
          </p>
        </div>

        <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
          PRO
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {lines.map((line) => {
          const isWarning = line.includes("⚠️");
          const isFire = line.includes("🔥");
          const isPriority = line.includes("⭐");

          return (
            <div
              key={line}
              className={
                isWarning
                  ? "rounded-2xl border border-red-500/50 bg-red-500/10 p-4"
                  : isFire
                    ? "rounded-2xl border border-orange-500/50 bg-orange-500/10 p-4"
                    : isPriority
                      ? "rounded-2xl border border-yellow-500/50 bg-yellow-500/10 p-4"
                      : "rounded-2xl border border-slate-700 bg-slate-950 p-4"
              }
            >
              <p className="text-sm font-semibold text-slate-100">{line}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineCard({ title, content }: { title: string; content: string }) {
  const items = parseTimeline(content);
  const [live, setLive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStart, setDemoStart] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!live) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [live]);

  function startLive() {
    setDemoMode(false);
    setDemoStart(null);
    setLive(true);
    setNow(new Date());
  }

  function startDemo() {
    setDemoMode(true);
    setDemoStart(new Date());
    setLive(true);
    setNow(new Date());
  }

  const realNowSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const firstStartMin = Math.min(
    ...items
      .map((item) => minutesFromTime(item.start))
      .filter((value): value is number => value !== null)
  );

  const demoElapsedSeconds =
    demoMode && demoStart
      ? Math.floor((now.getTime() - demoStart.getTime()) / 1000)
      : 0;

  const nowSecondsOfDay =
    demoMode && Number.isFinite(firstStartMin)
      ? firstStartMin * 60 + demoElapsedSeconds
      : realNowSeconds;

  const nowMinutes = Math.floor(nowSecondsOfDay / 60);

  const enriched = items.map((item) => {
    const startMin = minutesFromTime(item.start);
    const endMin = item.end === "--" ? startMin : minutesFromTime(item.end);

    const startSec = startMin === null ? null : startMin * 60;
    const endSec = endMin === null ? startSec : endMin * 60;

    const isActive =
      startSec !== null &&
      endSec !== null &&
      nowSecondsOfDay >= startSec &&
      nowSecondsOfDay <= endSec &&
      item.end !== "--";

    const isNext =
      startSec !== null &&
      startSec > nowSecondsOfDay;

    const secondsUntil =
      startSec !== null ? startSec - nowSecondsOfDay : 0;

    return {
      ...item,
      startMin,
      endMin,
      startSec,
      endSec,
      isActive,
      isNext,
      secondsUntil,
    };
  });

  const activeItem = enriched.find((item) => item.isActive);
  const nextItem = enriched
    .filter((item) => item.isNext)
    .sort((a, b) => a.secondsUntil - b.secondsUntil)[0];

  return (
    <div className="rounded-3xl border border-orange-500/40 bg-slate-900 p-5 md:col-span-2">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Director de tiempos de la parrillada
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => (live ? setLive(false) : startLive())}
            className={
              live && !demoMode
                ? "rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white"
                : "rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white"
            }
          >
            {live && !demoMode ? "Pausar live" : "Iniciar live"}
          </button>

          <button
            onClick={() => (live && demoMode ? setLive(false) : startDemo())}
            className={
              live && demoMode
                ? "rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white"
                : "rounded-2xl border border-orange-500 px-4 py-3 text-sm font-black text-orange-300"
            }
          >
            {live && demoMode ? "Pausar demo" : "Demo: empezar ahora"}
          </button>
        </div>
      </div>

      {live && (
        <div className="mb-5 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-300">
            {demoMode ? "Timeline Live · Demo" : "Timeline Live"}
          </p>

          {activeItem ? (
            <>
              <h4 className="mt-2 text-2xl font-black">
                Ahora: {activeItem.name}
              </h4>
              <p className="mt-1 text-sm text-slate-300">
                {activeItem.notes}
              </p>
            </>
          ) : nextItem ? (
            <>
              <h4 className="mt-2 text-2xl font-black">
                Próximo: {nextItem.name}
              </h4>
              <p className="mt-1 text-sm text-slate-300">
                Empieza en {secondsToClock(nextItem.secondsUntil)}
              </p>
            </>
          ) : (
            <>
              <h4 className="mt-2 text-2xl font-black">
                Parrillada lista
              </h4>
              <p className="mt-1 text-sm text-slate-300">
                Todos los eventos del timeline han pasado.
              </p>
            </>
          )}
        </div>
      )}

      <div className="relative space-y-4">
        <div className="absolute bottom-4 left-[31px] top-4 w-px bg-slate-700" />

        {enriched.map((item, index) => {
          const isNextVisual =
            live && nextItem?.start === item.start && nextItem?.name === item.name;

          const isActiveVisual = live && item.isActive;

          return (
            <div key={`${item.start}-${item.name}-${index}`} className="relative flex gap-4">
              <div
                className={
                  isActiveVisual
                    ? "z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-green-500 bg-green-500/20 text-sm font-black text-green-300"
                    : isNextVisual
                      ? "z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-orange-500 bg-orange-500/20 text-sm font-black text-orange-300"
                      : "z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-sm font-black text-slate-300"
                }
              >
                {item.start}
              </div>

              <div
                className={
                  isActiveVisual
                    ? "flex-1 scale-[1.01] rounded-2xl border border-green-500 bg-green-500/10 p-4 shadow-lg"
                    : isNextVisual
                      ? "flex-1 scale-[1.01] rounded-2xl border border-orange-500 bg-orange-500/15 p-4 shadow-lg"
                      : `flex-1 rounded-2xl border p-4 ${getZoneClass(item.zone)}`
                }
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-black">{item.name}</h4>

                  <div className="flex flex-wrap gap-2">
                    {isActiveVisual && (
                      <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-black text-white">
                        Ahora
                      </span>
                    )}

                    {isNextVisual && (
                      <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                        En {secondsToClock(item.secondsUntil)}
                      </span>
                    )}

                    <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
                      {getZoneLabel(item.zone)}
                    </span>

                    {item.end !== "--" && (
                      <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-slate-300">
                        {item.start} → {item.end}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-300">{item.notes}</p>

                {item.duration && item.duration !== "0 min" && (
                  <p className="mt-2 text-xs text-slate-400">
                    Duración aprox: {item.duration}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HomeCard({
  title,
  description,
  emoji,
  onClick,
}: {
  title: string;
  description: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-left transition hover:border-orange-500">
      <div className="text-4xl">{emoji}</div>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </button>
  );
}

function Tab({
  active,
  label,
  emoji,
  onClick,
}: {
  active: boolean;
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={active ? "rounded-2xl bg-orange-500 px-2 py-2 text-xs font-bold text-white" : "rounded-2xl px-2 py-2 text-xs text-slate-400"}>
      <div>{emoji}</div>
      <div>{label}</div>
    </button>
  );
}

function PrimaryButton({
  onClick,
  loading,
  text,
  loadingText,
}: {
  onClick: () => void;
  loading: boolean;
  text: string;
  loadingText: string;
}) {
  return (
    <button onClick={onClick} disabled={loading} className="w-full rounded-2xl bg-orange-500 px-5 py-4 font-bold disabled:opacity-60">
      {loading ? loadingText : text}
    </button>
  );
}

function Card({
  title,
  content,
}: {
  title: string;
  content?: string;
}) {
  if (!content) return null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      <p className="whitespace-pre-wrap text-slate-300">{content}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 p-3" />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 p-3">
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}