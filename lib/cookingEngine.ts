export type CookingInput = {
  animal: string;
  cut: string;
  weightKg: string;
  thicknessCm: string;
  doneness: string;
  equipment: string;
  language: "es" | "en";
};

export type CookingPlan = Record<string, string>;

export type CookingStep = {
  title: string;
  duration: number;
  description: string;
  image?: string;
  tips?: string[];
  assistantCue?: string;
  warningCue?: string;
};

type Style = "fast" | "thick" | "reverse" | "fatcap" | "lowSlow" | "crispy";

type CutData = {
  method: string;
  error: string;
  style: Style;
  pullTemp: number;
  finalTemp: number;
  indoorMethod?: string;
};

const beefTemps: Record<string, { pull: number; final: number }> = {
  blue: { pull: 44, final: 46 },
  "poco hecho": { pull: 48, final: 50 },
  "medium rare": { pull: 52, final: 54 },
  medium: { pull: 56, final: 58 },
  hecho: { pull: 62, final: 64 },
};

const porkTemps: Record<string, { pull: number; final: number }> = {
  "jugoso seguro": { pull: 60, final: 63 },
  "medio seguro": { pull: 63, final: 66 },
  "muy hecho": { pull: 68, final: 72 },
};

const beefCuts: Record<string, CutData> = {
  "Aguja / Chuck": {
    method: "sellado fuerte + cocción indirecta",
    error: "Tratarlo como un steak fino: necesita control y algo más de tiempo.",
    style: "thick",
    pullTemp: 52,
    finalTemp: 54,
    indoorMethod: "sartén fuerte + horno suave si la pieza es gruesa",
  },
  "Lomo alto": {
    method: "directo fuerte + indirecto suave",
    error: "Pasarse de temperatura: sube rápido al final.",
    style: "thick",
    pullTemp: 52,
    finalTemp: 54,
    indoorMethod: "sartén fuerte + horno suave si supera 4 cm",
  },
  Tomahawk: {
    method: "reverse sear + sellado final",
    error: "Cocinarlo solo directo: se quema fuera antes de llegar dentro.",
    style: "reverse",
    pullTemp: 50,
    finalTemp: 54,
    indoorMethod: "horno suave + sellado fuerte en sartén",
  },
  "Entrecote / Ribeye": {
    method: "directo fuerte + reposo corto",
    error: "Moverlo demasiado y perder costra.",
    style: "fast",
    pullTemp: 52,
    finalTemp: 54,
    indoorMethod: "sartén fuerte, sin horno si no es muy grueso",
  },
  Picanha: {
    method: "grasa a fuego medio + sellado final",
    error: "Quemar la grasa antes de fundirla.",
    style: "fatcap",
    pullTemp: 52,
    finalTemp: 54,
    indoorMethod: "sartén por la grasa + horno suave si la pieza es entera",
  },
  Maminha: {
    method: "directo medio-alto + reposo",
    error: "Cortarla en dirección incorrecta.",
    style: "thick",
    pullTemp: 52,
    finalTemp: 54,
    indoorMethod: "sartén + horno suave si es gruesa",
  },
  Babette: {
    method: "fuego muy fuerte y cocción rápida",
    error: "Pasarla de punto: se endurece rápido.",
    style: "fast",
    pullTemp: 52,
    finalTemp: 54,
    indoorMethod: "sartén muy fuerte, sin horno",
  },
  "Skirt steak / Entraña": {
    method: "fuego muy fuerte, muy poco tiempo y corte contra fibra",
    error: "No cortar contra la fibra.",
    style: "fast",
    pullTemp: 52,
    finalTemp: 54,
    indoorMethod: "sartén muy fuerte, sin horno",
  },
};

const porkCuts: Record<string, CutData> = {
  "Secreto ibérico": {
    method: "fuego medio-alto + sellado rápido",
    error: "Pasarlo demasiado: pierde jugos y se vuelve grasiento/seco.",
    style: "fast",
    pullTemp: 60,
    finalTemp: 63,
    indoorMethod: "sartén medio-alta, sin horno",
  },
  "Presa ibérica": {
    method: "sellado fuerte + indirecto suave",
    error: "Cortarla nada más salir: necesita reposo para quedar jugosa.",
    style: "thick",
    pullTemp: 60,
    finalTemp: 63,
    indoorMethod: "sartén fuerte + horno suave si es gruesa",
  },
  Costillas: {
    method: "cocción lenta indirecta + glaseado final",
    error: "Hacerlas rápido a fuego directo: quedan duras y quemadas.",
    style: "lowSlow",
    pullTemp: 88,
    finalTemp: 92,
    indoorMethod: "horno bajo + glaseado final",
  },
  Panceta: {
    method: "indirecto para fundir grasa + final crujiente",
    error: "Ponerla al fuego máximo desde el principio: se quema antes de quedar tierna.",
    style: "crispy",
    pullTemp: 75,
    finalTemp: 80,
    indoorMethod: "horno para fundir grasa + sartén fuerte al final",
  },
  Solomillo: {
    method: "sellado medio-alto + reposo corto",
    error: "Pasarlo de temperatura: es magro y se seca muy rápido.",
    style: "fast",
    pullTemp: 60,
    finalTemp: 63,
    indoorMethod: "sartén medio-alta; horno solo si es muy grueso",
  },
};

function parseNumber(value: string, fallback: number) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isIndoor(equipment: string) {
  return equipment.toLowerCase().includes("cocina interior");
}

function getMethod(cutData: CutData, equipment: string) {
  if (isIndoor(equipment) && cutData.indoorMethod) {
    return cutData.indoorMethod;
  }

  return cutData.method;
}

function getBeefTemp(input: CookingInput, cutData: CutData) {
  return beefTemps[input.doneness] ?? {
    pull: cutData.pullTemp,
    final: cutData.finalTemp,
  };
}

function getPorkTemp(input: CookingInput, cutData: CutData) {
  return porkTemps[input.doneness] ?? {
    pull: cutData.pullTemp,
    final: cutData.finalTemp,
  };
}

function getSearSeconds(thickness: number, style: Style) {
  if (style === "fast") return clamp(Math.round(thickness * 45), 90, 180);
  if (style === "fatcap") return clamp(Math.round(thickness * 50), 120, 210);
  if (style === "crispy") return clamp(Math.round(thickness * 60), 180, 360);
  return clamp(Math.round(thickness * 55), 150, 270);
}

function getIndirectSeconds(thickness: number, style: Style, doneness: string) {
  const extraByPoint: Record<string, number> = {
    blue: -120,
    "poco hecho": -60,
    "medium rare": 0,
    medium: 120,
    hecho: 240,
    "jugoso seguro": 0,
    "medio seguro": 120,
    "muy hecho": 240,
  };

  const extra = extraByPoint[doneness] ?? 0;

  if (style === "fast") return thickness <= 3 ? 0 : clamp(Math.round(thickness * 70 + extra), 120, 420);
  if (style === "reverse") return clamp(Math.round(thickness * 260 + extra), 900, 2100);
  if (style === "fatcap") return clamp(Math.round(thickness * 120 + extra), 300, 900);
  if (style === "crispy") return clamp(Math.round(thickness * 180), 600, 1800);
  if (style === "lowSlow") return clamp(Math.round(thickness * 900), 5400, 12600);

  return clamp(Math.round(thickness * 110 + extra), 240, 900);
}

function getRestSeconds(thickness: number, style?: Style) {
  if (style === "lowSlow") return 900;
  if (style === "crispy") return 480;
  if (thickness <= 3) return 300;
  if (thickness <= 5) return 420;
  return 600;
}

function secondsToText(seconds: number) {
  const minutes = Math.round(seconds / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return restMinutes === 0 ? `${hours} h` : `${hours} h ${restMinutes} min`;
}

function estimateTimes(input: CookingInput, cutData: CutData) {
  const thickness = parseNumber(input.thicknessCm, 5);
  const sear = getSearSeconds(thickness, cutData.style);
  const indirect = getIndirectSeconds(thickness, cutData.style, input.doneness);
  const rest = getRestSeconds(thickness, cutData.style);

  if (input.language === "en") {
    if (cutData.style === "lowSlow") return `${secondsToText(indirect)} indirect + glaze finish + ${secondsToText(rest)} rest`;
    if (cutData.style === "crispy") return `${secondsToText(indirect)} indirect + ${secondsToText(sear)} crisping + ${secondsToText(rest)} rest`;
    if (indirect <= 0) return `${secondsToText(sear)} per side + ${secondsToText(rest)} rest`;
    return `${secondsToText(sear)} per side + ${secondsToText(indirect)} indirect + ${secondsToText(rest)} rest`;
  }

  if (cutData.style === "lowSlow") return `${secondsToText(indirect)} indirecto + glaseado final + ${secondsToText(rest)} reposo`;
  if (cutData.style === "crispy") return `${secondsToText(indirect)} indirecto + ${secondsToText(sear)} crujiente final + ${secondsToText(rest)} reposo`;
  if (indirect <= 0) return `${secondsToText(sear)} por lado + ${secondsToText(rest)} reposo`;

  return `${secondsToText(sear)} por lado + ${secondsToText(indirect)} indirecto + ${secondsToText(rest)} reposo`;
}

function makeStandardSteps(input: CookingInput, cutData: CutData, temp: { pull: number; final: number }): CookingStep[] {
  const isEnglish = input.language === "en";
  const thickness = parseNumber(input.thicknessCm, 5);
  const sear = getSearSeconds(thickness, cutData.style);
  const indirect = getIndirectSeconds(thickness, cutData.style, input.doneness);
  const rest = getRestSeconds(thickness, cutData.style);
  const indoor = isIndoor(input.equipment);

  if (cutData.style === "lowSlow") {
    return isEnglish
      ? [
          { title: indoor ? "Preheat oven low" : "Preheat indirect", duration: 600, description: indoor ? "Set oven to low temperature." : "Set the grill for low indirect heat.", image: "/visuals/preheat.jpg", tips: ["Low heat", "Stable temperature", "Do not rush"] },
          { title: "Slow cook", duration: indirect, description: `Cook gently until tender, around ${temp.pull}°C if checking.`, image: "/visuals/indirect.jpg", tips: ["Keep heat stable", "Check tenderness", "Avoid direct flames"] },
          { title: "Glaze finish", duration: 600, description: "Brush sauce and finish gently to set the glaze.", image: "/visuals/sear.jpg", tips: ["Do not burn sugar", "Thin layers", "Watch closely"] },
          { title: "Rest", duration: rest, description: "Rest before cutting.", image: "/visuals/rest.jpg", tips: ["Rest before slicing", "Serve hot"] },
        ]
      : [
          { title: indoor ? "Precalentar horno bajo" : "Precalentar indirecto", duration: 600, description: indoor ? "Prepara el horno a temperatura baja." : "Prepara la parrilla para calor indirecto bajo.", image: "/visuals/preheat.jpg", tips: ["Fuego bajo", "Temperatura estable", "No tener prisa"] },
          { title: "Cocción lenta", duration: indirect, description: `Cocina suave hasta que esté tierno, cerca de ${temp.pull}°C si mides.`, image: "/visuals/indirect.jpg", tips: ["Mantén calor estable", "Busca ternura", "Evita llama directa"] },
          { title: "Glaseado final", duration: 600, description: "Pinta con salsa y termina suave para fijar el glaseado.", image: "/visuals/sear.jpg", tips: ["No quemes el azúcar", "Capas finas", "Vigila de cerca"] },
          { title: "Reposo", duration: rest, description: "Reposa antes de cortar.", image: "/visuals/rest.jpg", tips: ["Reposar antes de cortar", "Servir caliente"] },
        ];
  }

  if (cutData.style === "crispy") {
    return isEnglish
      ? [
          { title: indoor ? "Preheat oven" : "Preheat indirect", duration: 600, description: indoor ? "Use oven to render fat slowly." : "Create indirect medium heat.", image: "/visuals/preheat.jpg", tips: ["Avoid strong flames", "Use lid", "Control fat"] },
          { title: "Render fat slowly", duration: indirect, description: "Cook gently until fat softens and meat is tender.", image: "/visuals/fatcap.jpg", tips: ["Render slowly", "Avoid flare-ups", "Move if needed"] },
          { title: indoor ? "Crisp in pan" : "Crisp finish", duration: sear, description: indoor ? "Finish in a hot pan for crisp texture." : "Finish over stronger heat to crisp the outside.", image: "/visuals/sear.jpg", tips: ["Watch closely", "Crisp not burn", "Turn if needed"] },
          { title: "Rest", duration: rest, description: `Rest until final temperature approaches ${temp.final}°C.`, image: "/visuals/rest.jpg", tips: ["Rest before slicing", "Serve crispy"] },
        ]
      : [
          { title: indoor ? "Precalentar horno" : "Precalentar indirecto", duration: 600, description: indoor ? "Usa horno para fundir la grasa despacio." : "Crea calor medio indirecto.", image: "/visuals/preheat.jpg", tips: ["Evita llama fuerte", "Usa tapa", "Controla la grasa"] },
          { title: "Fundir grasa lento", duration: indirect, description: "Cocina suave hasta que la grasa funda y la carne esté tierna.", image: "/visuals/fatcap.jpg", tips: ["Fundir despacio", "Evitar llamaradas", "Mover si hace falta"] },
          { title: indoor ? "Crujiente en sartén" : "Final crujiente", duration: sear, description: indoor ? "Termina en sartén fuerte para dejar exterior crujiente." : "Termina con calor más fuerte para dejar el exterior crujiente.", image: "/visuals/sear.jpg", tips: ["Vigilar de cerca", "Crujiente, no quemado", "Girar si hace falta"] },
          { title: "Reposo", duration: rest, description: `Reposa hasta acercarte a ${temp.final}°C finales.`, image: "/visuals/rest.jpg", tips: ["Reposar antes de cortar", "Servir crujiente"] },
        ];
  }

  const baseSteps: CookingStep[] = isEnglish
    ? [
        { title: indoor ? "Preheat pan" : "Preheat grill", duration: 600, description: indoor ? "Use a hot pan and keep space between pieces." : "Create direct heat and a cooler safety zone.", image: "/visuals/preheat.jpg", tips: ["Hot surface", "Do not overcrowd", "Dry surface"] },
        { title: "Sear side 1", duration: sear, description: indoor ? "Sear in the pan without moving." : "Sear over direct heat without pressing.", image: "/visuals/sear.jpg", tips: ["Do not press", "Build color", "Do not move"] },
        { title: "Sear side 2", duration: sear, description: "Flip once and sear the second side.", image: "/visuals/sear.jpg", tips: ["Flip once", "Keep juicy", "Do not overcook"] },
      ]
    : [
        { title: indoor ? "Precalentar sartén" : "Precalentar parrilla", duration: 600, description: indoor ? "Usa sartén caliente y deja espacio entre piezas." : "Prepara fuego directo y una zona suave de seguridad.", image: "/visuals/preheat.jpg", tips: ["Superficie caliente", "No llenar la sartén", "Superficie seca"] },
        { title: "Sellar lado 1", duration: sear, description: indoor ? "Sella en sartén sin mover." : "Sella en fuego directo sin aplastar.", image: "/visuals/sear.jpg", tips: ["No aplastar", "Buscar color", "No mover"] },
        { title: "Sellar lado 2", duration: sear, description: "Da la vuelta una vez y sella el segundo lado.", image: "/visuals/sear.jpg", tips: ["Voltear una vez", "Mantener jugoso", "No pasarse"] },
      ];

  if (indirect > 0) {
    baseSteps.push(
      isEnglish
        ? { title: indoor ? "Oven finish if needed" : "Indirect finish", duration: indirect, description: indoor ? `Use oven only if the piece is thick. Pull close to ${temp.pull}°C.` : `Move indirect until close to ${temp.pull}°C.`, image: "/visuals/indirect.jpg", tips: ["Use thermometer", "Do not dry it", "Pull before final target"] }
        : { title: indoor ? "Terminar en horno si hace falta" : "Terminar indirecto", duration: indirect, description: indoor ? `Usa horno solo si la pieza es gruesa. Saca cerca de ${temp.pull}°C.` : `Pasa a indirecto hasta acercarte a ${temp.pull}°C.`, image: "/visuals/indirect.jpg", tips: ["Usa termómetro", "No secar", "Saca antes del objetivo final"] }
    );
  }

  baseSteps.push(
    isEnglish
      ? { title: "Rest", duration: rest, description: `Rest until final temperature approaches ${temp.final}°C.`, image: "/visuals/rest.jpg", tips: ["Rest before slicing", "Keep juices", "Slice cleanly"] }
      : { title: "Reposo", duration: rest, description: `Reposa hasta acercarte a ${temp.final}°C finales.`, image: "/visuals/rest.jpg", tips: ["Reposar antes de cortar", "Mantener jugos", "Cortar limpio"] }
  );

  return baseSteps;
}

export function generateCookingSteps(input: CookingInput): CookingStep[] | null {
  if (input.animal === "Vacuno") {
    const cutData = beefCuts[input.cut];
    if (!cutData) return null;

    return makeStandardSteps(input, cutData, getBeefTemp(input, cutData));
  }

  if (input.animal === "Cerdo") {
    const cutData = porkCuts[input.cut];
    if (!cutData) return null;

    return makeStandardSteps(input, cutData, getPorkTemp(input, cutData));
  }

  return null;
}

export function generateCookingPlan(input: CookingInput): CookingPlan | null {
  const cutData =
    input.animal === "Vacuno"
      ? beefCuts[input.cut]
      : input.animal === "Cerdo"
        ? porkCuts[input.cut]
        : null;

  if (!cutData) return null;

  const temp = input.animal === "Vacuno" ? getBeefTemp(input, cutData) : getPorkTemp(input, cutData);
  const times = estimateTimes(input, cutData);
  const method = getMethod(cutData, input.equipment);

  if (input.language === "en") {
    return {
      SETUP: `${method}. Use ${input.equipment}.`,
      TIMES: times,
      TEMPERATURE: `Pull target: ${temp.pull}°C. Expected final temperature after rest: ${temp.final}°C.`,
      STEPS: `1. Preheat.\n2. Cook according to the cut.\n3. Use oven/indirect heat only if needed.\n4. Rest before slicing.`,
      ERROR: cutData.error,
    };
  }

  return {
    SETUP: `${method}. Equipo: ${input.equipment}.`,
    TIEMPOS: times,
    TEMPERATURA: `Temperatura de salida: ${temp.pull}°C. Temperatura final esperada tras reposo: ${temp.final}°C.`,
    PASOS: `1. Precalienta.\n2. Cocina según el corte.\n3. Usa horno/indirecto solo si hace falta.\n4. Reposa antes de cortar.`,
    ERROR: cutData.error,
  };
}