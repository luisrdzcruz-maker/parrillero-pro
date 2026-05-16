import type { Lang } from "@/lib/i18n/texts";

export type SurfaceLang = Lang;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isLikelyEnglish(value: string) {
  const normalized = normalizeText(value);
  return /\b(use|preheat|grill|direct|indirect|heat|rest|flip|sear|step|setup|error|critical)\b/.test(
    normalized,
  );
}

function isLikelyInternalDescriptor(value: string) {
  const normalized = normalizeText(value);
  return (
    /\bfailing to render the cap fat side first\b/.test(normalized) ||
    /\busing aggressive heat too long on lean meat\b/.test(normalized) ||
    /\b(overcook(?:ing)?|lean eye|fat renders|pink core|fat rim|thin crust|low chew|firm beef bite|buttery soft bite)\b/.test(
      normalized,
    )
  );
}

const ANIMAL_LABELS: Record<string, Record<SurfaceLang, string>> = {
  beef: { es: "Vacuno", en: "Beef" },
  vacuno: { es: "Vacuno", en: "Beef" },
  nauta: { es: "Vacuno", en: "Beef" },
  pork: { es: "Cerdo", en: "Pork" },
  cerdo: { es: "Cerdo", en: "Pork" },
  sika: { es: "Cerdo", en: "Pork" },
  chicken: { es: "Pollo", en: "Chicken" },
  pollo: { es: "Pollo", en: "Chicken" },
  kana: { es: "Pollo", en: "Chicken" },
  fish: { es: "Pescado", en: "Fish" },
  pescado: { es: "Pescado", en: "Fish" },
  kala: { es: "Pescado", en: "Fish" },
  vegetables: { es: "Verduras", en: "Vegetables" },
  verduras: { es: "Verduras", en: "Vegetables" },
  kasvikset: { es: "Verduras", en: "Vegetables" },
};

const DONENESS_LABELS: Record<string, Record<SurfaceLang, string>> = {
  rare: { es: "Poco hecho", en: "Rare" },
  medium_rare: { es: "Al punto menos", en: "Medium rare" },
  medium: { es: "Al punto", en: "Medium" },
  medium_well: { es: "Tres cuartos", en: "Medium well" },
  well_done: { es: "Bien hecho", en: "Well done" },
  juicy_safe: { es: "Jugoso seguro", en: "Juicy safe" },
  medium_safe: { es: "Al punto seguro", en: "Medium safe" },
  safe: { es: "Seguro", en: "Safe" },
  juicy: { es: "Jugoso", en: "Juicy" },
};

const EQUIPMENT_LABELS: Record<string, Record<SurfaceLang, string>> = {
  "parrilla gas": { es: "Parrilla de gas", en: "Gas grill" },
  "parrilla carbon": { es: "Parrilla de carbon", en: "Charcoal grill" },
  kamado: { es: "Kamado", en: "Kamado" },
  "cocina interior": { es: "Cocina interior", en: "Indoor kitchen" },
};

const METHOD_LABELS: Record<string, Record<SurfaceLang, string>> = {
  grill_direct: { es: "Parrilla directa", en: "Direct grill" },
  grill_indirect: { es: "Parrilla indirecta", en: "Indirect grill" },
  reverse_sear: { es: "Sellado inverso", en: "Reverse sear" },
  oven_pan: { es: "Sarten u horno", en: "Pan or oven" },
  vegetables_grill: { es: "Verduras a la parrilla", en: "Grilled vegetables" },
};

function resolveLookupKey(value: string) {
  return normalizeText(value).replace(/\s+/g, " ").trim();
}

export function getAnimalSurfaceLabel(value: string, lang: SurfaceLang) {
  const label = ANIMAL_LABELS[resolveLookupKey(value)];
  return label?.[lang] ?? value;
}

export function getDonenessSurfaceLabel(value: string, lang: SurfaceLang) {
  const label = DONENESS_LABELS[resolveLookupKey(value)];
  return label?.[lang] ?? value;
}

export function getEquipmentSurfaceLabel(value: string, lang: SurfaceLang) {
  const key = resolveLookupKey(value);
  const label = EQUIPMENT_LABELS[key];
  if (label) return label[lang];
  return value;
}

export function getMethodSurfaceLabel(value: string, lang: SurfaceLang) {
  const label = METHOD_LABELS[resolveLookupKey(value)];
  return label?.[lang] ?? value;
}

export function getDetailsSetupLabels(lang: SurfaceLang) {
  if (lang === "es") {
    return {
      section: "Configuracion",
      title: "Ajusta los detalles",
    };
  }
  return {
    section: "Cooking setup",
    title: "Adjust details",
  };
}

export function sanitizeCriticalErrorCopy(value: string, lang: SurfaceLang) {
  if (lang === "en") return value;
  if (!isLikelyInternalDescriptor(value)) return value;
  if (lang === "es") return "Evita sobrecocinar el centro antes de terminar el dorado exterior.";
  return "Valta ylikypsentamasta keskiosaa ennen kuin pinta on valmis.";
}

function extractEquipmentNameFromSetup(value: string) {
  const match = value.match(/\buse\s+(.+?)(?:\.|$)/i);
  return match?.[1]?.trim() || null;
}

export function sanitizeSetupSummaryCopy(value: string, lang: SurfaceLang, equipment?: string) {
  if (lang === "en") return value;
  if (!isLikelyEnglish(value)) return value;

  const resolvedEquipment = equipment?.trim() || extractEquipmentNameFromSetup(value);
  return resolvedEquipment
    ? `Calor directo controlado. Usa ${resolvedEquipment}.`
    : "Calor controlado con zonas directa e indirecta.";
}

export function localizeLiveStepEntry(entry: string, lang: SurfaceLang) {
  if (lang === "en") return entry;

  const normalized = normalizeText(entry);
  if (!isLikelyEnglish(entry)) return entry;

  if (normalized.includes("preheat grill") || normalized.includes("precalienta parrilla")) {
    return "Precalentar parrilla: prepara zona directa y zona de seguridad.";
  }

  if (/\bsear\s+side\s*1\b/.test(normalized) || /\bsellar?\s+lado\s*1\b/.test(normalized)) {
    return "Sellar lado 1: marca costra sin mover la pieza.";
  }

  if (/\bsear\s+side\s*2\b/.test(normalized) || /\bsellar?\s+lado\s*2\b/.test(normalized)) {
    return "Sellar lado 2: iguala color y termina la costra.";
  }

  if (normalized.includes("mark step done")) {
    return "Marca el paso como completado.";
  }

  return "Sigue este paso con calor controlado y verifica el punto antes de avanzar.";
}

export function localizeLiveStepName(name: string, lang: SurfaceLang) {
  if (lang === "en") return name;
  const normalized = normalizeText(name);

  if (normalized.includes("preheat grill") || normalized.includes("precalienta parrilla")) {
    return "Precalentar parrilla";
  }
  if (/\bsear\s+side\s*1\b/.test(normalized) || /\bsellar?\s+lado\s*1\b/.test(normalized)) {
    return "Sellar lado 1";
  }
  if (/\bsear\s+side\s*2\b/.test(normalized) || /\bsellar?\s+lado\s*2\b/.test(normalized)) {
    return "Sellar lado 2";
  }
  if (normalized.includes("rest") || normalized.includes("repos")) {
    return "Reposar";
  }
  if (!isLikelyEnglish(name)) return name;
  return "Paso de coccion";
}

export function sanitizeLiveInstructionCopy(value: string, lang: SurfaceLang) {
  if (lang === "en") return value;
  const normalized = normalizeText(value);
  if (!isLikelyEnglish(value) && !isLikelyInternalDescriptor(value)) {
    return value;
  }

  if (normalized.includes("do not press the meat") || normalized.includes("no presiones la carne")) {
    return lang === "es"
      ? "No presiones la carne para mantener los jugos."
      : "Ala paina lihaa, jotta nesteet eivat karkaa.";
  }
  if (normalized.includes("preheat grill") || normalized.includes("precalienta parrilla")) {
    return lang === "es"
      ? "Precalienta la parrilla y prepara una zona directa con zona de seguridad."
      : "Esilamita grilli ja valmistele suora alue seka viileampi varavyohyke.";
  }
  if (/\bsear\s+side\s*1\b/.test(normalized) || /\bsellar?\s+lado\s*1\b/.test(normalized)) {
    return lang === "es"
      ? "Sella el lado 1 sin mover la pieza hasta formar costra."
      : "Ruskista puoli 1 liikuttamatta lihaa, kunnes paistopinta muodostuu.";
  }
  if (/\bsear\s+side\s*2\b/.test(normalized) || /\bsellar?\s+lado\s*2\b/.test(normalized)) {
    return lang === "es"
      ? "Sella el lado 2 y equilibra el color exterior."
      : "Ruskista puoli 2 ja tasaa ulkopinnan vari.";
  }
  if (isLikelyInternalDescriptor(value)) {
    return lang === "es"
      ? "Evita sobrecocinar el centro antes de terminar el dorado."
      : "Valta ylikypsentamasta keskiosaa ennen paistopinnan viimeistelya.";
  }
  return lang === "es"
    ? "Sigue este paso con fuego controlado y verifica el punto antes de avanzar."
    : "Jatka hallitulla lammolla ja varmista kypsyys ennen seuraavaa vaihetta.";
}

export function localizeLiveZoneLabel(value: string, lang: SurfaceLang) {
  const normalized = normalizeText(value);
  const text = getLiveText(lang);
  if (normalized.includes("rest") || normalized.includes("repos") || normalized.includes("serv")) {
    return text.zoneRest;
  }
  if (normalized.includes("indirect") || normalized.includes("epasuor")) {
    return text.zoneIndirect;
  }
  return text.zoneDirect;
}

function replaceInsensitive(value: string, pattern: RegExp, replacement: string) {
  return value.replace(pattern, replacement);
}

function localizeResultInlineTerms(value: string, lang: SurfaceLang) {
  if (lang === "en") return value;

  const text = getLiveText(lang);
  const setupLabel = lang === "es" ? "configuracion" : "asetus";
  const timeLabel = lang === "es" ? "tiempo" : "aika";
  const tempLabel = lang === "es" ? "temperatura" : "lampotila";
  const pullTargetLabel = lang === "es" ? "objetivo al retirar" : "nostolampotila";
  const perSideLabel = lang === "es" ? "por lado" : "per puoli";

  let localized = value;
  localized = replaceInsensitive(localized, /\bpull\s+target\b/gi, pullTargetLabel);
  localized = replaceInsensitive(localized, /\bper\s+side\b/gi, perSideLabel);
  localized = replaceInsensitive(localized, /\bpor\s+lado\b/gi, perSideLabel);
  localized = replaceInsensitive(localized, /\bobjetivo\s+al\s+retirar\b/gi, pullTargetLabel);
  localized = replaceInsensitive(localized, /\bobjetivo\s+de\s+retiro\b/gi, pullTargetLabel);
  localized = replaceInsensitive(localized, /\btime\s+remaining\b/gi, getLiveText(lang).timeRemaining);
  localized = replaceInsensitive(localized, /\btiempo\s+restante\b/gi, getLiveText(lang).timeRemaining);
  localized = replaceInsensitive(localized, /\bnext\s+action\b/gi, getLiveText(lang).nextStep);
  localized = replaceInsensitive(localized, /\bsiguiente\s+accion\b/gi, getLiveText(lang).nextStep);
  localized = replaceInsensitive(localized, /\bmanual\s+step\b/gi, getLiveText(lang).manualStep);
  localized = replaceInsensitive(localized, /\bpaso\s+manual\b/gi, getLiveText(lang).manualStep);
  localized = replaceInsensitive(localized, /\bsetup\b/gi, setupLabel);
  localized = replaceInsensitive(localized, /\bconfiguracion\b/gi, setupLabel);
  localized = replaceInsensitive(localized, /\btemp\b/gi, tempLabel);
  localized = replaceInsensitive(localized, /\btime\b/gi, timeLabel);
  localized = replaceInsensitive(localized, /\bindirect\b/gi, text.zoneIndirect);
  localized = replaceInsensitive(localized, /\bindirecto\b/gi, text.zoneIndirect);
  localized = replaceInsensitive(localized, /\bdirect\b/gi, text.zoneDirect);
  localized = replaceInsensitive(localized, /\bdirecto\b/gi, text.zoneDirect);
  localized = replaceInsensitive(localized, /\brest\b/gi, text.zoneRest);
  localized = replaceInsensitive(localized, /\breposo\b/gi, text.zoneRest);
  localized = replaceInsensitive(localized, /\bgrill[_\s-]?direct\b/gi, getMethodSurfaceLabel("grill_direct", lang));
  localized = replaceInsensitive(localized, /\bgrill[_\s-]?indirect\b/gi, getMethodSurfaceLabel("grill_indirect", lang));
  localized = replaceInsensitive(localized, /\breverse[_\s-]?sear\b/gi, getMethodSurfaceLabel("reverse_sear", lang));
  localized = replaceInsensitive(localized, /\boven[_\s-]?pan\b/gi, getMethodSurfaceLabel("oven_pan", lang));
  localized = replaceInsensitive(localized, /\bcritical\s+error\b/gi, lang === "es" ? "Error critico" : "Kriittinen virhe");
  localized = replaceInsensitive(localized, /\berror\s+que\s+arruina\s+este\s+corte\b/gi, lang === "es" ? "Error que arruina este corte" : "Virhe joka pilaa taman leikkauksen");
  return localized;
}

function localizeLinePreservingPrefix(value: string, lang: SurfaceLang) {
  const match = value.match(/^(\s*(?:[-*]|\d+[.)])\s+)?(.*)$/);
  const prefix = match?.[1] ?? "";
  const rawCore = match?.[2] ?? value;
  let core = localizeLiveStepEntry(rawCore, lang);
  core = sanitizeLiveInstructionCopy(core, lang);
  core = localizeResultInlineTerms(core, lang);
  if (isLikelyInternalDescriptor(core)) {
    core =
      lang === "es"
        ? "Evita sobrecocinar el centro antes de terminar el dorado."
        : "Valta ylikypsentamasta keskiosaa ennen paistopinnan viimeistelya.";
  }
  return `${prefix}${core}`.trim();
}

export function localizeResultSurfaceCopy(value: string, lang: SurfaceLang) {
  if (lang === "en") return value;
  if (!value.trim()) return value;
  return value
    .split("\n")
    .map((line) => (line.trim() ? localizeLinePreservingPrefix(line, lang) : line))
    .join("\n");
}

export function getLiveText(lang: SurfaceLang) {
  if (lang === "es") {
    return {
      plan: "Plan",
      noStepsTitle: "No hay plan activo",
      noStepsBody: "No encontramos un plan activo para cocinar en vivo. Crea un plan nuevo antes de empezar.",
      backToPlan: "Crear plan",
      upNext: "Sigue",
      done: "Listo",
      timeRemaining: "Tiempo restante",
      stepDuration: "Duracion del paso",
      manualStep: "Paso manual",
      followAction: "Sigue la accion",
      advanceWhenDone: "Avanza cuando este paso termine.",
      cookingComplete: "Coccion completada",
      cookingCompleteBody: "Corta, sirve y disfruta.",
      saveCook: "Guardar esta coccion",
      savedCook: "Guardado",
      reset: "Reiniciar",
      leaveConfirm: "Hay una coccion en curso. Salir ahora?",
      currentStep: "Paso actual",
      step: "Paso",
      of: "de",
      alerts: "Avisos",
      live: "En vivo",
      progressAria: "Progreso de pasos",
      goToStep: "Ir al paso",
      nextAction: "Siguiente accion",
      checkBeforeNext: "Antes de avanzar",
      targetTemp: "Objetivo",
      pauseTimer: "Pausar",
      resumeTimer: "Reanudar",
      startCooking: "Empezar coccion",
      cookingCompleteCta: "Coccion completada",
      nextStep: "Siguiente paso",
      flipNow: "Dar vuelta ahora",
      restNow: "Pasar a reposo",
      markDone: "Marcar paso completado",
      moveIndirect: "Mover a indirecto",
      moveDirect: "Mover a directo",
      feedbackRestStarted: "Comienza el reposo.",
      feedbackGoodTiming: "Buen ritmo.",
      feedbackPerfectSear: "Sellado perfecto.",
      feedbackKeepHeat: "Ahora manten el calor estable.",
      zoneDirect: "Directo",
      zoneIndirect: "Indirecto",
      zoneRest: "Reposo",
      actionGuide: "Guia de accion",
      actionPreheat: "Preparar calor",
      actionSear: "Sellar sin mover",
      actionFlip: "Dar vuelta",
      actionMove: "Mover de zona",
      actionRest: "Reposar fuera del fuego",
      actionServe: "Cortar y servir",
      actionManual: "Accion manual",
      actionHintPreheat: "Deja la parrilla lista antes de poner la pieza.",
      actionHintSear: "Mantén contacto con la zona caliente hasta formar costra.",
      actionHintFlip: "Gira una vez, sin presionar, y vuelve a dejar trabajar el calor.",
      actionHintMove: "Cambia a la zona indicada para controlar el punto.",
      actionHintRest: "Espera antes de cortar para conservar jugos.",
      actionHintServe: "Corta con calma y sirve cuando el reposo termine.",
      actionHintManual: "Completa esta accion y avanza cuando este lista.",
      zoneLabel: "Zona",
      remainingShort: "Queda",
      durationShort: "Total",
      targetShort: "Objetivo",
      noTimer: "Manual",
      // NOTE: hero/upcoming eyebrow language ("AHORA", "A SEGUIR", "Y DESPUÉS")
      // and the inline fire-setup phrasing ("Fuego directo · Objetivo 54°C")
      // deserve a Spanish-polish review during the texts.ts polish slice.
      // Selected per canvas-voice-rule (1–3 word eyebrows, imperative tone).
      nowEyebrow: "Ahora",
      upNextEyebrow: "A seguir",
      upNextAfterEyebrow: "Y después",
      verifyBefore: "Verifica antes",
      fireDirectLabel: "Fuego directo",
      fireIndirectLabel: "Fuego indirecto",
      fireRestLabel: "En reposo",
      targetTempTemplate: "Objetivo {value}°C",
      noTargetTempLabel: "Sin objetivo",
    };
  }
  return {
    plan: "Plan",
    noStepsTitle: "No active cooking plan found",
    noStepsBody: "Live Cooking needs a prepared plan before it can guide the cook. Create a new plan to continue.",
    backToPlan: "Create plan",
    upNext: "Up next",
    done: "Done",
    timeRemaining: "Time remaining",
    stepDuration: "Step duration",
    manualStep: "Manual step",
    followAction: "Follow the action",
    advanceWhenDone: "Advance when this step is done.",
    cookingComplete: "Cooking complete",
    cookingCompleteBody: "Slice, serve, enjoy.",
    saveCook: "Save this cook",
    savedCook: "Saved",
    reset: "Reset",
    leaveConfirm: "Cooking in progress - leave?",
    currentStep: "Current step",
    step: "Step",
    of: "of",
    alerts: "Alerts",
    live: "Live",
    progressAria: "Step progress",
    goToStep: "Go to step",
    nextAction: "Next action",
    checkBeforeNext: "Check before moving on",
    targetTemp: "Target",
    pauseTimer: "Pause",
    resumeTimer: "Resume",
    startCooking: "Start cooking",
    cookingCompleteCta: "Cooking complete",
    nextStep: "Next step",
    flipNow: "Flip now",
    restNow: "Rest now",
    markDone: "Mark step done",
    moveIndirect: "Move to indirect",
    moveDirect: "Move to direct",
    feedbackRestStarted: "Rest phase started.",
    feedbackGoodTiming: "Good timing.",
    feedbackPerfectSear: "Perfect sear.",
    feedbackKeepHeat: "Now keep the heat steady.",
    zoneDirect: "Direct",
    zoneIndirect: "Indirect",
    zoneRest: "Rest",
    actionGuide: "Action guide",
    actionPreheat: "Prepare heat",
    actionSear: "Sear without moving",
    actionFlip: "Flip",
    actionMove: "Move zone",
    actionRest: "Rest off heat",
    actionServe: "Slice and serve",
    actionManual: "Manual action",
    actionHintPreheat: "Get the grill ready before the food goes on.",
    actionHintSear: "Hold contact with the hot zone until a crust forms.",
    actionHintFlip: "Turn once, do not press, then let the heat work.",
    actionHintMove: "Shift to the indicated zone to control doneness.",
    actionHintRest: "Wait before cutting so juices can settle.",
    actionHintServe: "Slice calmly and serve after the rest is done.",
    actionHintManual: "Complete this action and advance when ready.",
    zoneLabel: "Zone",
    remainingShort: "Left",
    durationShort: "Total",
    targetShort: "Target",
    noTimer: "Manual",
    nowEyebrow: "Now",
    upNextEyebrow: "Up next",
    upNextAfterEyebrow: "Then",
    verifyBefore: "Check before",
    fireDirectLabel: "Direct fire",
    fireIndirectLabel: "Indirect fire",
    fireRestLabel: "Resting",
    targetTempTemplate: "Target {value}°C",
    noTargetTempLabel: "No target",
  };
}
