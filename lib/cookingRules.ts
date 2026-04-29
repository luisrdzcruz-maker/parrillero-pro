import {
  animalCatalog,
  animalDoneness,
  beefTemps,
  chickenTemps,
  donenessCatalog,
  fishTemps,
  porkTemps,
  productCatalog,
  type AnimalId,
  type CookingInput,
  type CookingMethod,
  type CookingPlan,
  type CookingStep,
  type CookingStyle,
  type DonenessId,
  type Language,
  type ProductCut,
  type TargetTemp,
} from "./cookingCatalog";

const legacyDonenessAliases: Record<string, DonenessId> = {
  blue: "blue",
  rare: "rare",
  "poco hecho": "rare",
  "medium rare": "medium_rare",
  medium_rare: "medium_rare",
  medium: "medium",
  hecho: "medium_well",
  medium_well: "medium_well",
  "medium well": "medium_well",
  well_done: "well_done",
  "well done": "well_done",
  "muy hecho": "well_done",
  "jugoso seguro": "juicy_safe",
  juicy_safe: "juicy_safe",
  "medio seguro": "medium_safe",
  medium_safe: "medium_safe",
  safe: "safe",
  seguro: "safe",
  juicy: "juicy",
  jugoso: "juicy",
};

const animalNameToId = new Map<string, AnimalId>(
  animalCatalog.flatMap((animal) =>
    Object.values(animal.names).map((name) => [normalizeKey(name), animal.id] as const),
  ),
);

const cutAliasToId = new Map<string, string>();

for (const cut of productCatalog) {
  cutAliasToId.set(normalizeKey(cut.id), cut.id);
  Object.values(cut.names).forEach((name) => cutAliasToId.set(normalizeKey(name), cut.id));
  cut.aliases?.forEach((alias) => cutAliasToId.set(normalizeKey(alias), cut.id));
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function parseNumber(value: string, fallback: number) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isIndoor(equipment: string) {
  const normalized = normalizeKey(equipment);
  return (
    normalized.includes("cocina interior") ||
    normalized.includes("indoor") ||
    normalized.includes("oven")
  );
}

function getAnimalId(value: string): AnimalId | undefined {
  return (
    animalNameToId.get(normalizeKey(value)) ??
    (animalCatalog.some((animal) => animal.id === value) ? (value as AnimalId) : undefined)
  );
}

function getDonenessId(value: string, animalId: AnimalId): DonenessId {
  const normalized = normalizeKey(value);
  const candidate = legacyDonenessAliases[normalized] ?? (normalized as DonenessId);
  const allowed = animalDoneness[animalId];
  return allowed.includes(candidate) ? candidate : (allowed[0] ?? "medium");
}

function getLocalized(value: Partial<Record<Language, string>> | undefined, language: "es" | "en") {
  return value?.[language] ?? value?.es ?? value?.en ?? "";
}

function getLocalizedList(
  value: Partial<Record<Language, string[]>> | undefined,
  language: "es" | "en",
) {
  return value?.[language] ?? value?.es ?? value?.en ?? [];
}

function getTargetTemp(cut: ProductCut, doneness: DonenessId): TargetTemp | undefined {
  if (cut.targetTempsC?.[doneness]) return cut.targetTempsC[doneness];
  if (cut.animalId === "beef") return beefTemps[doneness] ?? beefTemps.medium_rare;
  if (cut.animalId === "pork") return porkTemps[doneness] ?? porkTemps.juicy_safe;
  if (cut.animalId === "chicken") return chickenTemps[doneness] ?? chickenTemps.safe;
  if (cut.animalId === "fish") return fishTemps[doneness] ?? fishTemps.medium;
  return undefined;
}

function getMethod(cut: ProductCut, equipment: string): CookingMethod {
  if (isIndoor(equipment) && cut.allowedMethods.includes("oven_pan")) return "oven_pan";
  return cut.defaultMethod;
}

function getMethodText(method: CookingMethod, language: "es" | "en") {
  const labels: Record<CookingMethod, Record<"es" | "en", string>> = {
    grill_direct: { es: "fuego directo controlado", en: "controlled direct heat" },
    grill_indirect: {
      es: "sellado fuerte + cocción indirecta",
      en: "hard sear + indirect cooking",
    },
    reverse_sear: { es: "reverse sear + sellado final", en: "reverse sear + final sear" },
    oven_pan: {
      es: "sartén fuerte + horno suave si hace falta",
      en: "hot pan + gentle oven if needed",
    },
    vegetables_grill: {
      es: "parrilla directa con aceite y vueltas controladas",
      en: "direct grill with oil and controlled turning",
    },
  };

  return labels[method][language];
}

type EquipmentProfile = "indoor" | "gas" | "charcoal" | "kamado" | "generic";

function getEquipmentProfile(equipment: string): EquipmentProfile {
  if (isIndoor(equipment)) return "indoor";

  const normalized = normalizeKey(equipment);
  if (normalized.includes("kamado")) return "kamado";
  if (normalized.includes("charcoal") || normalized.includes("carb")) return "charcoal";
  if (normalized.includes("gas")) return "gas";
  return "generic";
}

function getDonenessBias(doneness: DonenessId) {
  if (doneness === "blue" || doneness === "rare" || doneness === "medium_rare" || doneness === "juicy") return -1;
  if (doneness === "medium_well" || doneness === "well_done" || doneness === "safe") return 1;
  return 0;
}

function getSearSeconds(thickness: number, style: CookingStyle) {
  if (style === "fish") return clamp(Math.round(thickness * 35), 60, 150);
  if (style === "poultry") return clamp(Math.round(thickness * 45), 120, 240);
  if (style === "fast") return clamp(Math.round(thickness * 45), 90, 180);
  if (style === "fatcap") return clamp(Math.round(thickness * 50), 120, 210);
  if (style === "crispy") return clamp(Math.round(thickness * 60), 180, 360);
  return clamp(Math.round(thickness * 55), 150, 270);
}

function getIndirectSeconds(thickness: number, style: CookingStyle, doneness: DonenessId) {
  const extraByPoint: Partial<Record<DonenessId, number>> = {
    blue: -120,
    rare: -60,
    medium_rare: 0,
    medium: 120,
    medium_well: 240,
    well_done: 300,
    juicy_safe: 0,
    medium_safe: 120,
    safe: 180,
    juicy: -60,
  };

  const extra = extraByPoint[doneness] ?? 0;

  if (style === "fish")
    return thickness <= 3 ? 0 : clamp(Math.round(thickness * 70 + extra), 120, 360);
  if (style === "poultry") return clamp(Math.round(thickness * 260 + extra), 900, 3600);
  if (style === "fast")
    return thickness <= 3 ? 0 : clamp(Math.round(thickness * 70 + extra), 120, 420);
  if (style === "reverse") return clamp(Math.round(thickness * 260 + extra), 900, 2100);
  if (style === "fatcap") return clamp(Math.round(thickness * 120 + extra), 300, 900);
  if (style === "crispy") return clamp(Math.round(thickness * 180), 600, 1800);
  if (style === "lowSlow") return clamp(Math.round(thickness * 900), 5400, 12600);

  return clamp(Math.round(thickness * 110 + extra), 240, 900);
}

function getVegetableSeconds(cut: ProductCut) {
  return (cut.cookingMinutes ?? 15) * 60;
}

function getRestSeconds(cut: ProductCut) {
  return cut.restingMinutes * 60;
}

function secondsToText(seconds: number) {
  const minutes = Math.round(seconds / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return restMinutes === 0 ? `${hours} h` : `${hours} h ${restMinutes} min`;
}

function formatStepDuration(seconds: number, language: "es" | "en") {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return language === "en" ? `${minutes} min` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (restMinutes === 0) {
    return language === "en" ? `${hours} h` : `${hours} h`;
  }

  return language === "en"
    ? `${hours} h ${restMinutes} min`
    : `${hours} h ${restMinutes} min`;
}

function buildPlanStepsText(steps: CookingStep[], language: "es" | "en") {
  if (steps.length === 0) {
    return language === "en"
      ? "1. Cook with controlled heat and verify doneness with a thermometer."
      : "1. Cocina con calor controlado y verifica el punto con termómetro.";
  }

  return steps
    .map((step, index) => {
      const title = step.title.trim();
      const description = step.description.trim();
      const duration = formatStepDuration(step.duration, language);
      return `${index + 1}. ${title}: ${description} (${duration})`;
    })
    .join("\n");
}

function sanitizeSteps(steps: CookingStep[], language: "es" | "en"): CookingStep[] {
  const safeTitle = language === "en" ? "Cooking step" : "Paso de cocción";
  const safeDescription =
    language === "en"
      ? "Keep stable heat and verify doneness before moving to the next stage."
      : "Mantén el calor estable y verifica el punto antes de pasar al siguiente paso.";

  const seen = new Set<string>();
  const cleaned: CookingStep[] = [];

  for (const step of steps) {
    const title = step.title.trim() || safeTitle;
    const description = step.description.trim() || safeDescription;
    const duration = Number.isFinite(step.duration) && step.duration > 0 ? Math.round(step.duration) : 60;
    const dedupeKey = normalizeKey(`${title}|${description}`);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    cleaned.push({
      ...step,
      title,
      description,
      duration,
    });
  }

  if (cleaned.length > 0) return cleaned;

  return [
    {
      title: safeTitle,
      duration: 120,
      description: safeDescription,
      image: "/visuals/rest.jpg",
      tips: [],
    },
  ];
}

function estimateTimes(input: CookingInput, cut: ProductCut, doneness: DonenessId) {
  const thickness = cut.showThickness
    ? parseNumber(input.thicknessCm, cut.defaultThicknessCm)
    : cut.defaultThicknessCm;
  const sear = getSearSeconds(thickness, cut.style);
  const indirect =
    cut.style === "vegetable"
      ? getVegetableSeconds(cut)
      : getIndirectSeconds(thickness, cut.style, doneness);
  const rest = getRestSeconds(cut);

  if (input.language === "en") {
    if (cut.style === "vegetable") return `${secondsToText(indirect)} direct grill`;
    if (cut.style === "lowSlow")
      return `${secondsToText(indirect)} indirect + glaze finish + ${secondsToText(rest)} rest`;
    if (cut.style === "crispy")
      return `${secondsToText(indirect)} indirect + ${secondsToText(sear)} crisping + ${secondsToText(rest)} rest`;
    if (cut.style === "poultry")
      return `${secondsToText(indirect)} indirect + ${secondsToText(sear)} browning + ${secondsToText(rest)} rest`;
    if (indirect <= 0) return `${secondsToText(sear)} per side + ${secondsToText(rest)} rest`;
    return `${secondsToText(sear)} per side + ${secondsToText(indirect)} indirect + ${secondsToText(rest)} rest`;
  }

  if (cut.style === "vegetable") return `${secondsToText(indirect)} parrilla directa`;
  if (cut.style === "lowSlow")
    return `${secondsToText(indirect)} indirecto + glaseado final + ${secondsToText(rest)} reposo`;
  if (cut.style === "crispy")
    return `${secondsToText(indirect)} indirecto + ${secondsToText(sear)} crujiente final + ${secondsToText(rest)} reposo`;
  if (cut.style === "poultry")
    return `${secondsToText(indirect)} indirecto + ${secondsToText(sear)} dorado final + ${secondsToText(rest)} reposo`;
  if (indirect <= 0) return `${secondsToText(sear)} por lado + ${secondsToText(rest)} reposo`;

  return `${secondsToText(sear)} por lado + ${secondsToText(indirect)} indirecto + ${secondsToText(rest)} reposo`;
}

function makeVegetableSteps(input: CookingInput, cut: ProductCut): CookingStep[] {
  const isEnglish = input.language === "en";
  const cook = getVegetableSeconds(cut);
  const tips = getLocalizedList(cut.tips, input.language);

  return sanitizeSteps(
    isEnglish
      ? [
        {
          title: "Prep vegetables",
          duration: 300,
          description: "Cut evenly, oil lightly and season before grilling.",
          image: "/visuals/preheat.jpg",
          tips,
        },
        {
          title: "Grill direct",
          duration: cook,
          description: "Cook over controlled direct heat, turning for even color.",
          image: "/visuals/sear.jpg",
          tips: ["Move away from flare-ups", "Aim for tender and browned"],
        },
        {
          title: "Finish",
          duration: 60,
          description: "Season again if needed and serve hot.",
          image: "/visuals/rest.jpg",
          tips: ["Add salt at the end", "Serve immediately"],
        },
      ]
      : [
        {
          title: "Preparar verduras",
          duration: 300,
          description: "Corta uniforme, añade aceite ligero y sazona antes de la parrilla.",
          image: "/visuals/preheat.jpg",
          tips,
        },
        {
          title: "Parrilla directa",
          duration: cook,
          description: "Cocina con calor directo controlado, girando para dorar uniforme.",
          image: "/visuals/sear.jpg",
          tips: ["Alejar de llamaradas", "Buscar textura tierna y dorada"],
        },
        {
          title: "Terminar",
          duration: 60,
          description: "Rectifica sal si hace falta y sirve caliente.",
          image: "/visuals/rest.jpg",
          tips: ["Sal al final", "Servir al momento"],
        },
      ],
    input.language,
  );
}

function makeStandardSteps(input: CookingInput, cut: ProductCut, temp?: TargetTemp): CookingStep[] {
  if (cut.style === "vegetable") return makeVegetableSteps(input, cut);

  const isEnglish = input.language === "en";
  const thickness = cut.showThickness
    ? parseNumber(input.thicknessCm, cut.defaultThicknessCm)
    : cut.defaultThicknessCm;
  const doneness = getDonenessId(input.doneness, cut.animalId);
  const sear = getSearSeconds(thickness, cut.style);
  const indirect = getIndirectSeconds(thickness, cut.style, doneness);
  const rest = getRestSeconds(cut);
  const equipmentProfile = getEquipmentProfile(input.equipment);
  const indoor = equipmentProfile === "indoor";
  const thicknessBand = thickness >= 6 ? "thick" : thickness <= 3 ? "thin" : "medium";
  const donenessBias = getDonenessBias(doneness);
  const phraseSeed = Math.round(thickness * 10) + doneness.length + normalizeKey(input.equipment).length;
  const phraseVariant = phraseSeed % 3;
  const pull = temp?.pull ?? 0;
  const final = temp?.final ?? 0;

  if (cut.style === "lowSlow") {
    return sanitizeSteps(
      isEnglish
        ? [
          {
            title: indoor ? "Preheat oven low" : "Preheat indirect",
            duration: 600,
            description: indoor
              ? "Set oven to low temperature."
              : "Set the grill for low indirect heat.",
            image: "/visuals/preheat.jpg",
            tips: ["Low heat", "Stable temperature", "Do not rush"],
          },
          {
            title: "Slow cook",
            duration: indirect,
            description: `Cook gently until tender, around ${pull}°C if checking.`,
            image: "/visuals/indirect.jpg",
            tips: ["Keep heat stable", "Check tenderness", "Avoid direct flames"],
          },
          {
            title: "Glaze finish",
            duration: 600,
            description: "Brush sauce and finish gently to set the glaze.",
            image: "/visuals/sear.jpg",
            tips: ["Do not burn sugar", "Thin layers", "Watch closely"],
          },
          {
            title: "Rest",
            duration: rest,
            description: "Rest before cutting.",
            image: "/visuals/rest.jpg",
            tips: ["Rest before slicing", "Serve hot"],
          },
        ]
        : [
          {
            title: indoor ? "Precalentar horno bajo" : "Precalentar indirecto",
            duration: 600,
            description: indoor
              ? "Prepara el horno a temperatura baja."
              : "Prepara la parrilla para calor indirecto bajo.",
            image: "/visuals/preheat.jpg",
            tips: ["Fuego bajo", "Temperatura estable", "No tener prisa"],
          },
          {
            title: "Cocción lenta",
            duration: indirect,
            description: `Cocina suave hasta que esté tierno, cerca de ${pull}°C si mides.`,
            image: "/visuals/indirect.jpg",
            tips: ["Mantén calor estable", "Busca ternura", "Evita llama directa"],
          },
          {
            title: "Glaseado final",
            duration: 600,
            description: "Pinta con salsa y termina suave para fijar el glaseado.",
            image: "/visuals/sear.jpg",
            tips: ["No quemes el azúcar", "Capas finas", "Vigila de cerca"],
          },
          {
            title: "Reposo",
            duration: rest,
            description: "Reposa antes de cortar.",
            image: "/visuals/rest.jpg",
            tips: ["Reposar antes de cortar", "Servir caliente"],
          },
        ],
      input.language,
    );
  }

  if (cut.style === "crispy") {
    return sanitizeSteps(
      isEnglish
        ? [
          {
            title: indoor ? "Preheat oven" : "Preheat indirect",
            duration: 600,
            description: indoor ? "Use oven to render fat slowly." : "Create indirect medium heat.",
            image: "/visuals/preheat.jpg",
            tips: ["Avoid strong flames", "Use lid", "Control fat"],
          },
          {
            title: "Render fat slowly",
            duration: indirect,
            description: "Cook gently until fat softens and meat is tender.",
            image: "/visuals/fatcap.jpg",
            tips: ["Render slowly", "Avoid flare-ups", "Move if needed"],
          },
          {
            title: indoor ? "Crisp in pan" : "Crisp finish",
            duration: sear,
            description: indoor
              ? "Finish in a hot pan for crisp texture."
              : "Finish over stronger heat to crisp the outside.",
            image: "/visuals/sear.jpg",
            tips: ["Watch closely", "Crisp not burn", "Turn if needed"],
          },
          {
            title: "Rest",
            duration: rest,
            description: `Rest until final temperature approaches ${final}°C.`,
            image: "/visuals/rest.jpg",
            tips: ["Rest before slicing", "Serve crispy"],
          },
        ]
        : [
          {
            title: indoor ? "Precalentar horno" : "Precalentar indirecto",
            duration: 600,
            description: indoor
              ? "Usa horno para fundir la grasa despacio."
              : "Crea calor medio indirecto.",
            image: "/visuals/preheat.jpg",
            tips: ["Evita llama fuerte", "Usa tapa", "Controla la grasa"],
          },
          {
            title: "Fundir grasa lento",
            duration: indirect,
            description: "Cocina suave hasta que la grasa funda y la carne esté tierna.",
            image: "/visuals/fatcap.jpg",
            tips: ["Fundir despacio", "Evitar llamaradas", "Mover si hace falta"],
          },
          {
            title: indoor ? "Crujiente en sartén" : "Final crujiente",
            duration: sear,
            description: indoor
              ? "Termina en sartén fuerte para dejar exterior crujiente."
              : "Termina con calor más fuerte para dejar el exterior crujiente.",
            image: "/visuals/sear.jpg",
            tips: ["Vigilar de cerca", "Crujiente, no quemado", "Girar si hace falta"],
          },
          {
            title: "Reposo",
            duration: rest,
            description: `Reposa hasta acercarte a ${final}°C finales.`,
            image: "/visuals/rest.jpg",
            tips: ["Reposar antes de cortar", "Servir crujiente"],
          },
        ],
      input.language,
    );
  }

  if (cut.style === "poultry") {
    return sanitizeSteps(
      isEnglish
        ? [
          {
            title: indoor ? "Preheat oven or pan" : "Preheat indirect",
            duration: 600,
            description: indoor
              ? "Use a moderate oven or pan with space between pieces."
              : "Set up indirect heat with a direct zone for browning.",
            image: "/visuals/preheat.jpg",
            tips: ["Moderate heat", "Avoid raw centers", "Use thermometer"],
          },
          {
            title: "Cook through",
            duration: indirect,
            description: `Cook gently until close to ${pull}°C in the thickest part.`,
            image: "/visuals/indirect.jpg",
            tips: ["Indirect first", "Lid closed", "Check thickest part"],
          },
          {
            title: "Brown skin",
            duration: sear,
            description: "Finish over stronger heat until browned.",
            image: "/visuals/sear.jpg",
            tips: ["Do not burn skin", "Turn often", "Watch flare-ups"],
          },
          {
            title: "Rest",
            duration: rest,
            description: `Rest until final temperature approaches ${final}°C.`,
            image: "/visuals/rest.jpg",
            tips: ["Short rest", "Juices settle"],
          },
        ]
        : [
          {
            title: indoor ? "Precalentar horno o sartén" : "Precalentar indirecto",
            duration: 600,
            description: indoor
              ? "Usa horno moderado o sartén con espacio entre piezas."
              : "Prepara calor indirecto con zona directa para dorar.",
            image: "/visuals/preheat.jpg",
            tips: ["Calor moderado", "Evitar interior crudo", "Usa termómetro"],
          },
          {
            title: "Cocinar interior",
            duration: indirect,
            description: `Cocina suave hasta acercarte a ${pull}°C en la parte más gruesa.`,
            image: "/visuals/indirect.jpg",
            tips: ["Indirecto primero", "Tapa cerrada", "Medir parte gruesa"],
          },
          {
            title: "Dorar piel",
            duration: sear,
            description: "Termina con calor más fuerte hasta dorar.",
            image: "/visuals/sear.jpg",
            tips: ["No quemar piel", "Girar a menudo", "Vigilar llamaradas"],
          },
          {
            title: "Reposo",
            duration: rest,
            description: `Reposa hasta acercarte a ${final}°C finales.`,
            image: "/visuals/rest.jpg",
            tips: ["Reposo corto", "Asentar jugos"],
          },
        ],
      input.language,
    );
  }

  const preheatTitle = isEnglish
    ? indoor
      ? phraseVariant === 0
        ? "Preheat pan"
        : phraseVariant === 1
          ? "Heat pan to medium-high"
          : "Preheat pan and oven"
      : equipmentProfile === "kamado"
        ? "Stabilize kamado"
        : equipmentProfile === "charcoal"
          ? "Prepare charcoal zones"
          : "Preheat grill"
    : indoor
      ? phraseVariant === 0
        ? "Precalentar sartén"
        : phraseVariant === 1
          ? "Calentar sartén medio-alto"
          : "Precalentar sartén y horno"
      : equipmentProfile === "kamado"
        ? "Estabilizar kamado"
        : equipmentProfile === "charcoal"
          ? "Preparar zonas de carbón"
          : "Precalentar parrilla";

  const preheatDescription = isEnglish
    ? indoor
      ? "Use a hot pan and keep space between pieces."
      : equipmentProfile === "kamado"
        ? "Stabilize dome temperature and define direct/indirect zones."
        : equipmentProfile === "charcoal"
          ? "Build a strong direct zone and a cooler safety side."
          : "Create direct heat and a cooler safety zone."
    : indoor
      ? "Usa sartén caliente y deja espacio entre piezas."
      : equipmentProfile === "kamado"
        ? "Estabiliza temperatura de cúpula y define zonas directa/indirecta."
        : equipmentProfile === "charcoal"
          ? "Prepara zona fuerte de calor y una zona más suave."
          : "Prepara fuego directo y una zona suave de seguridad.";

  const firstSearTitle = isEnglish
    ? phraseVariant === 2
      ? "First sear pass"
      : "Sear side 1"
    : phraseVariant === 2
      ? "Primer sellado"
      : "Sellar lado 1";

  const secondSearTitle = isEnglish
    ? phraseVariant === 1
      ? "Second sear pass"
      : "Sear side 2"
    : phraseVariant === 1
      ? "Segundo sellado"
      : "Sellar lado 2";

  const deepCookNeedsCoreFirst = !indoor && thicknessBand === "thick" && donenessBias > 0;
  const finalSearSeconds = deepCookNeedsCoreFirst ? clamp(Math.round(sear * 0.6), 60, 180) : sear;

  const baseSteps: CookingStep[] = isEnglish
    ? [
        {
          title: preheatTitle,
          duration: 600,
          description: preheatDescription,
          image: "/visuals/preheat.jpg",
          tips: ["Hot surface", "Do not overcrowd", "Dry surface"],
        },
      ]
    : [
        {
          title: preheatTitle,
          duration: 600,
          description: preheatDescription,
          image: "/visuals/preheat.jpg",
          tips: ["Superficie caliente", "No llenar la sartén", "Superficie seca"],
        },
      ];

  if (deepCookNeedsCoreFirst && indirect > 0) {
    baseSteps.push(
      isEnglish
        ? {
            title: "Warm core indirect",
            duration: clamp(Math.round(indirect * 0.75), 180, 1800),
            description: `Cook on indirect heat until close to ${Math.max(35, pull - 8)}°C.`,
            image: "/visuals/indirect.jpg",
            tips: ["Lid closed", "Stable heat", "Check center temperature"],
          }
        : {
            title: "Templar centro en indirecto",
            duration: clamp(Math.round(indirect * 0.75), 180, 1800),
            description: `Cocina en indirecto hasta acercarte a ${Math.max(35, pull - 8)}°C.`,
            image: "/visuals/indirect.jpg",
            tips: ["Tapa cerrada", "Calor estable", "Medir centro"],
          },
    );
  }

  baseSteps.push(
    isEnglish
      ? {
          title: firstSearTitle,
          duration: finalSearSeconds,
          description: indoor
            ? "Sear in the pan without moving."
            : "Sear over direct heat without pressing.",
          image: "/visuals/sear.jpg",
          tips: ["Do not press", "Build color", "Do not move"],
        }
      : {
          title: firstSearTitle,
          duration: finalSearSeconds,
          description: indoor
            ? "Sella en sartén sin mover."
            : "Sella en fuego directo sin aplastar.",
          image: "/visuals/sear.jpg",
          tips: ["No aplastar", "Buscar color", "No mover"],
        },
  );

  baseSteps.push(
    isEnglish
      ? {
          title: secondSearTitle,
          duration: finalSearSeconds,
          description:
            thicknessBand === "thin"
              ? "Flip once and finish quickly to keep juices."
              : "Flip once and sear the second side.",
          image: "/visuals/sear.jpg",
          tips: ["Flip once", "Keep juicy", "Do not overcook"],
        }
      : {
          title: secondSearTitle,
          duration: finalSearSeconds,
          description:
            thicknessBand === "thin"
              ? "Da la vuelta una vez y termina rápido para mantener jugos."
              : "Da la vuelta una vez y sella el segundo lado.",
          image: "/visuals/sear.jpg",
          tips: ["Voltear una vez", "Mantener jugoso", "No pasarse"],
        },
  );

  if (indirect > 0) {
    baseSteps.push(
      isEnglish
        ? {
            title: indoor ? "Oven finish if needed" : "Indirect finish",
            duration: deepCookNeedsCoreFirst ? clamp(Math.round(indirect * 0.25), 60, 900) : indirect,
            description: indoor
              ? `Use oven only if the piece is thick. Pull close to ${pull}°C.`
              : `Move indirect until close to ${pull}°C.`,
            image: "/visuals/indirect.jpg",
            tips: ["Use thermometer", "Do not dry it", "Pull before final target"],
          }
        : {
            title: indoor ? "Terminar en horno si hace falta" : "Terminar indirecto",
            duration: indirect,
            description: indoor
              ? `Usa horno solo si la pieza es gruesa. Saca cerca de ${pull}°C.`
              : `Pasa a indirecto hasta acercarte a ${pull}°C.`,
            image: "/visuals/indirect.jpg",
            tips: ["Usa termómetro", "No secar", "Saca antes del objetivo final"],
          },
    );
  }

  baseSteps.push(
    isEnglish
      ? {
          title: "Rest",
          duration: rest,
          description: `Rest until final temperature approaches ${final}°C.`,
          image: "/visuals/rest.jpg",
          tips: ["Rest before slicing", "Keep juices", "Slice cleanly"],
        }
      : {
          title: "Reposo",
          duration: rest,
          description: `Reposa hasta acercarte a ${final}°C finales.`,
          image: "/visuals/rest.jpg",
          tips: ["Reposar antes de cortar", "Mantener jugos", "Cortar limpio"],
        },
  );

  return sanitizeSteps(baseSteps, input.language);
}

export function getCutsByAnimal(animalId: AnimalId) {
  return productCatalog.filter((cut) => cut.animalId === animalId);
}

export function getCutById(cutId: string) {
  const id = cutAliasToId.get(normalizeKey(cutId)) ?? cutId;
  return productCatalog.find((cut) => cut.id === id);
}

export function getDonenessOptions(animalId: AnimalId) {
  return animalDoneness[animalId].map((id) => donenessCatalog[id]);
}

export function shouldShowThickness(cutId: string) {
  return getCutById(cutId)?.showThickness ?? true;
}

export function getAnimalByName(value: string) {
  const animalId = getAnimalId(value);
  return animalId ? animalCatalog.find((animal) => animal.id === animalId) : undefined;
}

export function getCutForInput(input: CookingInput) {
  const animalId = getAnimalId(input.animal);
  const cut = getCutById(input.cut);

  if (!animalId || !cut || cut.animalId !== animalId) return undefined;
  return cut;
}

export function generateCookingSteps(input: CookingInput): CookingStep[] | null {
  const cut = getCutForInput(input);
  if (!cut) return null;

  const doneness = getDonenessId(input.doneness, cut.animalId);
  return makeStandardSteps(input, cut, getTargetTemp(cut, doneness));
}

export function generateCookingPlan(input: CookingInput): CookingPlan | null {
  const cut = getCutForInput(input);
  if (!cut) return null;

  const doneness = getDonenessId(input.doneness, cut.animalId);
  const temp = getTargetTemp(cut, doneness);
  const times = estimateTimes(input, cut, doneness);
  const method = getMethodText(getMethod(cut, input.equipment), input.language);
  const note = getLocalized(cut.notes, input.language);
  const planSteps = buildPlanStepsText(makeStandardSteps(input, cut, temp), input.language);

  if (input.language === "en") {
    return {
      SETUP: `${method}. Use ${input.equipment}.`,
      TIMES: times,
      TEMPERATURE: temp
        ? `Pull target: ${temp.pull}°C. Expected final temperature after rest: ${temp.final}°C.`
        : "Cook to tender texture and browned edges.",
      STEPS: planSteps,
      ...(note ? { TIPS: note } : {}),
      ERROR: cut.error.en,
    };
  }

  return {
    SETUP: `${method}. Equipo: ${input.equipment}.`,
    TIEMPOS: times,
    TEMPERATURA: temp
      ? `Temperatura de salida: ${temp.pull}°C. Temperatura final esperada tras reposo: ${temp.final}°C.`
      : "Cocina hasta textura tierna y bordes dorados.",
    PASOS: planSteps,
    ...(note ? { CONSEJOS: note } : {}),
    ERROR: cut.error.es,
  };
}
