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
import {
  applyCookingSafetyRules,
  resolveLegacyAnimalId,
  resolveLegacyDonenessId,
} from "./legacyCookingInputAdapter";
import {
  attachCookingTimeSemantics,
  deriveCookingTimeSemanticsFromSteps,
} from "./cookingTimeSemantics";
import { resolveCookingProfile, resolveProductCut } from "./resolveCookingProfile";
import {
  getTemperatureDeltaFromRecommended,
  getTargetTempsForProfile,
  resolveDonenessProfileId,
} from "./donenessProfiles";
import {
  getDefaultDonenessForCut,
  getDonenessProfileIdForTemperatureMode,
  getTemperatureTargetForCut,
  type TemperatureTargetForCut,
} from "./temperatureModeProfiles";

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
  return resolveLegacyAnimalId(value);
}

function getDonenessId(
  value: string,
  animalId: AnimalId,
  allowedDoneness: readonly DonenessId[] = animalDoneness[animalId],
  cut?: ProductCut,
): DonenessId {
  const resolved = applyCookingSafetyRules(animalId, resolveLegacyDonenessId(value), allowedDoneness);
  return allowedDoneness.includes(resolved) ? resolved : (cut ? getDefaultDonenessForCut(cut) : resolved);
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

function getCutDonenessProfileId(cut: ProductCut) {
  return (
    cut.donenessProfileId ??
    getDonenessProfileIdForTemperatureMode(cut) ??
    resolveDonenessProfileId({
      animalId: cut.animalId,
      inputProfileId: cut.inputProfileId,
      style: cut.style,
    })
  );
}

function getTargetTemp(cut: ProductCut, doneness: DonenessId): TargetTemp | undefined {
  const temperatureTarget = getTemperatureTargetForCut(cut, doneness);
  if (temperatureTarget.target) return temperatureTarget.target;

  const profileTemps = getTargetTempsForProfile(getCutDonenessProfileId(cut));
  if (profileTemps?.[doneness]) return profileTemps[doneness];
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

type OvenPhase = "after_sear" | "before_sear" | "finish" | "low_slow";

type OvenMode = "convection" | "top-bottom heat" | "grill";

type OvenGuidance = {
  mode: Record<"es" | "en", string>;
  temperatureC: number;
  phase: Record<"es" | "en", string>;
  rack: Record<"es" | "en", string>;
  transition: Record<"es" | "en", string>;
};

const ovenGuidanceByStyle: Record<CookingStyle, { temperatureC: number; phase: OvenPhase; mode: "convection" | "top_bottom" | "grill" }> = {
  fast: { temperatureC: 160, phase: "after_sear", mode: "convection" },
  thick: { temperatureC: 160, phase: "after_sear", mode: "convection" },
  reverse: { temperatureC: 120, phase: "before_sear", mode: "convection" },
  fatcap: { temperatureC: 160, phase: "after_sear", mode: "top_bottom" },
  lowSlow: { temperatureC: 120, phase: "low_slow", mode: "top_bottom" },
  crispy: { temperatureC: 200, phase: "finish", mode: "grill" },
  poultry: { temperatureC: 180, phase: "before_sear", mode: "top_bottom" },
  fish: { temperatureC: 160, phase: "after_sear", mode: "convection" },
  vegetable: { temperatureC: 200, phase: "finish", mode: "convection" },
};

function getOvenModeLabel(mode: OvenMode, language: "es" | "en") {
  const labels: Record<OvenMode, Record<"es" | "en", string>> = {
    convection: { es: "conveccion", en: "convection" },
    "top-bottom heat": { es: "calor arriba y abajo", en: "top-bottom heat" },
    grill: { es: "grill", en: "grill" },
  };

  return labels[mode][language];
}

function getOvenPhaseLabel(phase: OvenPhase, language: "es" | "en") {
  const labels: Record<OvenPhase, Record<"es" | "en", string>> = {
    after_sear: { es: "despues del sellado", en: "after sear" },
    before_sear: { es: "antes del sellado", en: "before sear" },
    finish: { es: "acabado final", en: "finish" },
    low_slow: { es: "coccion principal lenta", en: "main low cook" },
  };

  return labels[phase][language];
}

function getOvenTransition(phase: OvenPhase, language: "es" | "en") {
  const labels: Record<OvenPhase, Record<"es" | "en", string>> = {
    after_sear: {
      es: "sella primero, pasa al horno si hace falta y reposa despues del horno",
      en: "sear first, move to oven if needed, then rest after oven",
    },
    before_sear: {
      es: "horno primero, sellado final y reposo",
      en: "oven first, then final sear and rest",
    },
    finish: {
      es: "termina bajo grill y reposa despues",
      en: "finish under grill, then rest",
    },
    low_slow: {
      es: "horno suave primero, acabado final si hace falta y reposo",
      en: "gentle oven first, finish if needed, then rest",
    },
  };

  return labels[phase][language];
}

function getIndoorOvenGuidance(cut: ProductCut, method: CookingMethod): OvenGuidance | null {
  if (method !== "oven_pan") return null;

  const config = ovenGuidanceByStyle[cut.style];
  const mode = config.mode === "top_bottom" ? "top-bottom heat" : config.mode;

  return {
    mode: {
      es: getOvenModeLabel(mode, "es"),
      en: getOvenModeLabel(mode, "en"),
    },
    temperatureC: config.temperatureC,
    phase: {
      es: getOvenPhaseLabel(config.phase, "es"),
      en: getOvenPhaseLabel(config.phase, "en"),
    },
    rack: {
      es: config.mode === "grill" ? "rejilla alta" : "rejilla central",
      en: config.mode === "grill" ? "upper rack" : "middle rack",
    },
    transition: {
      es: getOvenTransition(config.phase, "es"),
      en: getOvenTransition(config.phase, "en"),
    },
  };
}

function formatOvenGuidance(guidance: OvenGuidance, language: "es" | "en") {
  return language === "en"
    ? `Oven mode: ${guidance.mode.en}. Oven temp: ${guidance.temperatureC}°C. Phase: ${guidance.phase.en}. Rack: ${guidance.rack.en}. Transition: ${guidance.transition.en}.`
    : `Modo horno: ${guidance.mode.es}. Temperatura horno: ${guidance.temperatureC}°C. Fase: ${guidance.phase.es}. Posicion: ${guidance.rack.es}. Transicion: ${guidance.transition.es}.`;
}

function appendOvenGuidance(text: string, guidance: OvenGuidance | null, language: "es" | "en") {
  if (!guidance) return text;
  return `${text} ${formatOvenGuidance(guidance, language)}`;
}

function formatTemperatureGuidance(
  target: TemperatureTargetForCut,
  language: "es" | "en",
  ovenText: string,
) {
  const temp = target.target;

  if (target.mode === "visual_only") {
    return language === "en"
      ? `Cook by visible browning and tender texture; no internal meat temperature target.${ovenText}`
      : `Cocina por dorado visible y textura tierna; no hay objetivo interno de carne.${ovenText}`;
  }

  if (target.mode === "texture_breakdown") {
    const secondaryTemp = temp?.final ? ` ${language === "en" ? "Temperature is only a guide, around" : "La temperatura es solo una guia, cerca de"} ${temp.final}°C.` : "";
    return language === "en"
      ? `Target texture: probe tender, sliceable or shreddable depending on the cut; do not use steak doneness.${secondaryTemp}${ovenText}`
      : `Objetivo de textura: tierno al pinchar, cortable o desmechable segun el corte; no uses punto de steak.${secondaryTemp}${ovenText}`;
  }

  if (!temp) {
    return language === "en"
      ? `Cook to tender texture and browned edges.${ovenText}`
      : `Cocina hasta textura tierna y bordes dorados.${ovenText}`;
  }

  if (target.mode === "safe_temp") {
    return language === "en"
      ? `Safe juicy target: pull near ${temp.pull}°C. Expected final safe temperature after rest: ${temp.final}°C.${ovenText}`
      : `Objetivo seguro y jugoso: saca cerca de ${temp.pull}°C. Temperatura final segura tras reposo: ${temp.final}°C.${ovenText}`;
  }

  if (target.mode === "delicate_target") {
    return language === "en"
      ? `Delicate target: pull near ${temp.pull}°C. Expected final temperature after rest: ${temp.final}°C; avoid drying it out.${ovenText}`
      : `Objetivo delicado: saca cerca de ${temp.pull}°C. Temperatura final tras reposo: ${temp.final}°C; evita secarlo.${ovenText}`;
  }

  return language === "en"
    ? `Pull target: ${temp.pull}°C. Expected final temperature after rest: ${temp.final}°C.${ovenText}`
    : `Temperatura de salida: ${temp.pull}°C. Temperatura final esperada tras reposo: ${temp.final}°C.${ovenText}`;
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

function getDonenessTempDeltaC(cut: ProductCut, doneness: DonenessId) {
  return getTemperatureDeltaFromRecommended(getCutDonenessProfileId(cut), doneness);
}

function getDonenessTimeAdjustmentSeconds(style: CookingStyle, tempDeltaC: number) {
  const secondsPerDegree: Record<CookingStyle, number> = {
    fast: 10,
    thick: 18,
    reverse: 28,
    fatcap: 16,
    lowSlow: 0,
    crispy: 0,
    poultry: 20,
    fish: 8,
    vegetable: 0,
  };

  return Math.round(tempDeltaC * secondsPerDegree[style]);
}

function getSearSeconds(thickness: number, style: CookingStyle, tempDeltaC = 0) {
  const donenessAdjustment =
    style === "fast" || style === "fish" ? getDonenessTimeAdjustmentSeconds(style, tempDeltaC) : 0;

  if (style === "fish") return clamp(Math.round(thickness * 35 + donenessAdjustment), 60, 180);
  if (style === "poultry") return clamp(Math.round(thickness * 45), 120, 240);
  if (style === "fast") return clamp(Math.round(thickness * 45 + donenessAdjustment), 75, 240);
  if (style === "fatcap") return clamp(Math.round(thickness * 50), 120, 210);
  if (style === "crispy") return clamp(Math.round(thickness * 60), 180, 360);
  return clamp(Math.round(thickness * 55), 150, 270);
}

function getIndirectSeconds(
  thickness: number,
  style: CookingStyle,
  doneness: DonenessId,
  tempDeltaC = 0,
) {
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

  const extra = (extraByPoint[doneness] ?? 0) + getDonenessTimeAdjustmentSeconds(style, tempDeltaC);

  if (style === "fish")
    return thickness <= 3 ? 0 : clamp(Math.round(thickness * 70 + extra), 120, 360);
  if (style === "poultry") return clamp(Math.round(thickness * 260 + extra), 900, 3600);
  if (style === "fast")
    return thickness <= 3 ? 0 : clamp(Math.round(thickness * 70 + extra), 120, 900);
  if (style === "reverse") return clamp(Math.round(thickness * 260 + extra), 900, 2100);
  if (style === "fatcap") return clamp(Math.round(thickness * 120 + extra), 300, 900);
  if (style === "crispy") return clamp(Math.round(thickness * 180), 600, 1800);
  if (style === "lowSlow") return clamp(Math.round(thickness * 900), 5400, 12600);

  return clamp(Math.round(thickness * 110 + extra), 240, 900);
}

function getVegetableSeconds(cut: ProductCut) {
  return (cut.cookingMinutes ?? 15) * 60;
}

function getGeneratedCookSeconds(cut: ProductCut) {
  return cut.cookingMinutes ? cut.cookingMinutes * 60 : undefined;
}

function getMainCookSeconds(cut: ProductCut, thickness: number, doneness: DonenessId) {
  if (cut.style === "vegetable") return getVegetableSeconds(cut);

  const generatedCookSeconds = getGeneratedCookSeconds(cut);
  if (generatedCookSeconds && !cut.showThickness) return generatedCookSeconds;

  return getIndirectSeconds(thickness, cut.style, doneness, getDonenessTempDeltaC(cut, doneness));
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
  const sear = getSearSeconds(thickness, cut.style, getDonenessTempDeltaC(cut, doneness));
  const indirect = getMainCookSeconds(cut, thickness, doneness);
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
  const doneness = getDonenessId(input.doneness, cut.animalId, cut.allowedDoneness, cut);
  const sear = getSearSeconds(thickness, cut.style, getDonenessTempDeltaC(cut, doneness));
  const indirect = getMainCookSeconds(cut, thickness, doneness);
  const rest = getRestSeconds(cut);
  const equipmentProfile = getEquipmentProfile(input.equipment);
  const indoor = equipmentProfile === "indoor";
  const selectedMethod = getMethod(cut, input.equipment);
  const ovenGuidance = indoor ? getIndoorOvenGuidance(cut, selectedMethod) : null;
  const thicknessBand = thickness >= 6 ? "thick" : thickness <= 3 ? "thin" : "medium";
  const donenessBias = getDonenessBias(doneness);
  const phraseSeed = Math.round(thickness * 10) + doneness.length + normalizeKey(input.equipment).length;
  const phraseVariant = phraseSeed % 3;
  const pull = temp?.pull ?? 0;
  const final = temp?.final ?? 0;
  const temperatureTarget = getTemperatureTargetForCut(cut, doneness);
  const textureGuide = temperatureTarget.target?.final;

  if (cut.style === "lowSlow") {
    return sanitizeSteps(
      isEnglish
        ? [
          {
            title: indoor ? "Preheat oven low" : "Preheat indirect",
            duration: 600,
            description: indoor
              ? appendOvenGuidance("Set oven to low temperature.", ovenGuidance, input.language)
              : "Set the grill for low indirect heat.",
            image: "/visuals/preheat.jpg",
            tips: ["Low heat", "Stable temperature", "Do not rush"],
          },
          {
            title: "Slow cook",
            duration: indirect,
            description: textureGuide
              ? `Cook gently until probe tender; ${textureGuide}°C is only a guide, not steak doneness.`
              : "Cook gently until probe tender; use texture, not steak doneness.",
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
              ? appendOvenGuidance("Prepara el horno a temperatura baja.", ovenGuidance, input.language)
              : "Prepara la parrilla para calor indirecto bajo.",
            image: "/visuals/preheat.jpg",
            tips: ["Fuego bajo", "Temperatura estable", "No tener prisa"],
          },
          {
            title: "Cocción lenta",
            duration: indirect,
            description: textureGuide
              ? `Cocina suave hasta que esté tierno al pinchar; ${textureGuide}°C es solo una guia, no punto de steak.`
              : "Cocina suave hasta que esté tierno al pinchar; usa textura, no punto de steak.",
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
            description: indoor
              ? appendOvenGuidance("Use oven to render fat slowly.", ovenGuidance, input.language)
              : "Create indirect medium heat.",
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
              ? appendOvenGuidance("Usa horno para fundir la grasa despacio.", ovenGuidance, input.language)
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
              ? appendOvenGuidance("Use a moderate oven or pan with space between pieces.", ovenGuidance, input.language)
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
              ? appendOvenGuidance("Usa horno moderado o sartén con espacio entre piezas.", ovenGuidance, input.language)
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
      ? appendOvenGuidance("Use a hot pan and keep space between pieces.", ovenGuidance, input.language)
      : equipmentProfile === "kamado"
        ? "Stabilize dome temperature and define direct/indirect zones."
        : equipmentProfile === "charcoal"
          ? "Build a strong direct zone and a cooler safety side."
          : "Create direct heat and a cooler safety zone."
    : indoor
      ? appendOvenGuidance("Usa sartén caliente y deja espacio entre piezas.", ovenGuidance, input.language)
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
              ? appendOvenGuidance(`Use oven only if the piece is thick. Pull close to ${pull}°C.`, ovenGuidance, input.language)
              : `Move indirect until close to ${pull}°C.`,
            image: "/visuals/indirect.jpg",
            tips: ["Use thermometer", "Do not dry it", "Pull before final target"],
          }
        : {
            title: indoor ? "Terminar en horno si hace falta" : "Terminar indirecto",
            duration: indirect,
            description: indoor
              ? appendOvenGuidance(`Usa horno solo si la pieza es gruesa. Saca cerca de ${pull}°C.`, ovenGuidance, input.language)
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
  return resolveProductCut(cutId);
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
  return resolveCookingProfile(input)?.cut;
}

export function generateCookingSteps(input: CookingInput): CookingStep[] | null {
  const profile = resolveCookingProfile(input);
  if (!profile) return null;

  const doneness = getDonenessId(profile.input.doneness, profile.cut.animalId, profile.cut.allowedDoneness, profile.cut);
  return makeStandardSteps(profile.input, profile.cut, getTargetTemp(profile.cut, doneness));
}

export function generateCookingPlan(input: CookingInput): CookingPlan | null {
  const profile = resolveCookingProfile(input);
  if (!profile) return null;

  const { cut } = profile;
  const engineInput = profile.input;
  const doneness = getDonenessId(engineInput.doneness, cut.animalId, cut.allowedDoneness, cut);
  const temperatureTarget = getTemperatureTargetForCut(cut, doneness);
  const temp = temperatureTarget.target ?? getTargetTemp(cut, doneness);
  const times = estimateTimes(engineInput, cut, doneness);
  const selectedMethod = getMethod(cut, engineInput.equipment);
  const method = getMethodText(selectedMethod, engineInput.language);
  const ovenGuidance = isIndoor(engineInput.equipment) ? getIndoorOvenGuidance(cut, selectedMethod) : null;
  const ovenText = ovenGuidance ? ` ${formatOvenGuidance(ovenGuidance, engineInput.language)}` : "";
  const note = getLocalized(cut.notes, engineInput.language);
  const steps = makeStandardSteps(engineInput, cut, temp);
  const planSteps = buildPlanStepsText(steps, engineInput.language);
  const timeSemantics = deriveCookingTimeSemanticsFromSteps(steps);

  if (engineInput.language === "en") {
    return attachCookingTimeSemantics({
      SETUP: `${method}. Use ${engineInput.equipment}.${ovenText}`,
      TIMES: times,
      TEMPERATURE: formatTemperatureGuidance({ ...temperatureTarget, target: temp }, engineInput.language, ovenText),
      STEPS: planSteps,
      ...(note ? { TIPS: note } : {}),
      ERROR: cut.error.en,
    }, timeSemantics);
  }

  return attachCookingTimeSemantics({
    SETUP: `${method}. Equipo: ${engineInput.equipment}.${ovenText}`,
    TIEMPOS: times,
    TEMPERATURA: formatTemperatureGuidance({ ...temperatureTarget, target: temp }, engineInput.language, ovenText),
    PASOS: planSteps,
    ...(note ? { CONSEJOS: note } : {}),
    ERROR: cut.error.es,
  }, timeSemantics);
}
