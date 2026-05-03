export type SurfaceLang = "es" | "en" | "fi";

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
    /\b(overcook(?:ing)?|lean eye|fat renders|pink core|fat rim|thin crust|low chew|firm beef bite|buttery soft bite)\b/.test(
      normalized,
    )
  );
}

export function getDetailsSetupLabels(lang: SurfaceLang) {
  if (lang === "es") {
    return {
      section: "Configuracion",
      title: "Ajusta los detalles",
    };
  }

  if (lang === "fi") {
    return {
      section: "Asetukset",
      title: "Tarkenna tiedot",
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
  if (lang === "es") {
    return resolvedEquipment
      ? `Calor directo controlado. Usa ${resolvedEquipment}.`
      : "Calor controlado con zonas directa e indirecta.";
  }

  return resolvedEquipment
    ? `Hallittu suora lampo. Kayta valinetta: ${resolvedEquipment}.`
    : "Hallittu lampo suoralla ja epasuoralla alueella.";
}

export function localizeLiveStepEntry(entry: string, lang: SurfaceLang) {
  if (lang === "en") return entry;

  const normalized = normalizeText(entry);
  if (!isLikelyEnglish(entry)) return entry;

  if (normalized.includes("preheat grill")) {
    return lang === "es"
      ? "Precalentar parrilla: prepara zona directa y zona de seguridad."
      : "Esilamita grilli: rakenna suora alue ja viileampi varavyohyke.";
  }

  if (/\bsear\s+side\s*1\b/.test(normalized)) {
    return lang === "es" ? "Sellar lado 1: marca costra sin mover la pieza." : "Ruskista puoli 1: tee paistopinta liikuttamatta lihaa.";
  }

  if (/\bsear\s+side\s*2\b/.test(normalized)) {
    return lang === "es" ? "Sellar lado 2: iguala color y termina la costra." : "Ruskista puoli 2: tasaa vari ja viimeistele paistopinta.";
  }

  if (normalized.includes("mark step done")) {
    return lang === "es" ? "Marca el paso como completado." : "Merkitse vaihe valmiiksi.";
  }

  if (lang === "es") return "Sigue este paso con calor controlado y verifica el punto antes de avanzar.";
  return "Jatka hallitulla lampotilalla ja varmista kypsyys ennen seuraavaa vaihetta.";
}

export function localizeLiveStepName(name: string, lang: SurfaceLang) {
  if (lang === "en") return name;
  const normalized = normalizeText(name);

  if (normalized.includes("preheat grill")) {
    return lang === "es" ? "Precalentar parrilla" : "Esilamita grilli";
  }
  if (/\bsear\s+side\s*1\b/.test(normalized)) {
    return lang === "es" ? "Sellar lado 1" : "Ruskista puoli 1";
  }
  if (/\bsear\s+side\s*2\b/.test(normalized)) {
    return lang === "es" ? "Sellar lado 2" : "Ruskista puoli 2";
  }
  if (normalized.includes("rest")) {
    return lang === "es" ? "Reposar" : "Lepuuta";
  }
  if (!isLikelyEnglish(name)) return name;
  return lang === "es" ? "Paso de coccion" : "Kypsennysvaihe";
}

export function sanitizeLiveInstructionCopy(value: string, lang: SurfaceLang) {
  if (lang === "en") return value;
  const normalized = normalizeText(value);
  if (!isLikelyEnglish(value) && !isLikelyInternalDescriptor(value)) return value;

  if (normalized.includes("do not press the meat")) {
    return lang === "es"
      ? "No presiones la carne para mantener los jugos."
      : "Ala paina lihaa, jotta nesteet eivat karkaa.";
  }
  if (normalized.includes("preheat grill")) {
    return lang === "es"
      ? "Precalienta la parrilla y prepara una zona directa con zona de seguridad."
      : "Esilamita grilli ja valmistele suora alue seka viileampi varavyohyke.";
  }
  if (/\bsear\s+side\s*1\b/.test(normalized)) {
    return lang === "es"
      ? "Sella el lado 1 sin mover la pieza hasta formar costra."
      : "Ruskista puoli 1 liikuttamatta lihaa, kunnes paistopinta muodostuu.";
  }
  if (/\bsear\s+side\s*2\b/.test(normalized)) {
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
  localized = replaceInsensitive(localized, /\btime\s+remaining\b/gi, getLiveText(lang).timeRemaining);
  localized = replaceInsensitive(localized, /\bnext\s+action\b/gi, getLiveText(lang).nextStep);
  localized = replaceInsensitive(localized, /\bmanual\s+step\b/gi, getLiveText(lang).manualStep);
  localized = replaceInsensitive(localized, /\bsetup\b/gi, setupLabel);
  localized = replaceInsensitive(localized, /\btemp\b/gi, tempLabel);
  localized = replaceInsensitive(localized, /\btime\b/gi, timeLabel);
  localized = replaceInsensitive(localized, /\bindirect\b/gi, text.zoneIndirect);
  localized = replaceInsensitive(localized, /\bdirect\b/gi, text.zoneDirect);
  localized = replaceInsensitive(localized, /\brest\b/gi, text.zoneRest);
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
      noStepsTitle: "No hay pasos de cocina disponibles",
      noStepsBody: "Vuelve al plan y genera una coccion nueva.",
      backToPlan: "Volver al plan",
      upNext: "Sigue",
      done: "Listo",
      timeRemaining: "Tiempo restante",
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
    };
  }

  if (lang === "fi") {
    return {
      plan: "Suunnitelma",
      noStepsTitle: "Live-vaiheita ei ole saatavilla",
      noStepsBody: "Palaa suunnitelmaan ja luo uusi kypsennys.",
      backToPlan: "Takaisin suunnitelmaan",
      upNext: "Seuraavaksi",
      done: "Valmis",
      timeRemaining: "Aikaa jaljella",
      manualStep: "Manuaalinen vaihe",
      followAction: "Seuraa toimintoa",
      advanceWhenDone: "Jatka, kun tama vaihe on valmis.",
      cookingComplete: "Kypsennys valmis",
      cookingCompleteBody: "Leikkaa, tarjoile ja nauti.",
      saveCook: "Tallenna tama kypsennys",
      savedCook: "Tallennettu",
      reset: "Nollaa",
      leaveConfirm: "Kypsennys on kaynnissa. Poistutaanko?",
      currentStep: "Nykyinen vaihe",
      step: "Vaihe",
      of: "/",
      alerts: "Halytykset",
      live: "Live",
      progressAria: "Vaiheiden eteneminen",
      goToStep: "Siirry vaiheeseen",
      startCooking: "Aloita kypsennys",
      cookingCompleteCta: "Kypsennys valmis",
      nextStep: "Seuraava vaihe",
      flipNow: "Kaanna nyt",
      restNow: "Siirry lepuutukseen",
      markDone: "Merkitse vaihe valmiiksi",
      moveIndirect: "Siirra epasuoralle",
      moveDirect: "Siirra suoralle",
      feedbackRestStarted: "Lepuutus alkaa.",
      feedbackGoodTiming: "Hyva ajoitus.",
      feedbackPerfectSear: "Paistopinta onnistui.",
      feedbackKeepHeat: "Pidetaan lampo tasaisena.",
      zoneDirect: "Suora",
      zoneIndirect: "Epasuora",
      zoneRest: "Lepuutus",
    };
  }

  return {
    plan: "Plan",
    noStepsTitle: "No live steps available",
    noStepsBody: "Return to the plan and start again.",
    backToPlan: "Back to plan",
    upNext: "Up next",
    done: "Done",
    timeRemaining: "Time remaining",
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
  };
}
