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

  const normalized = normalizeText(value);
  const looksInternal =
    /\bfailing to render the cap fat side first\b/.test(normalized) ||
    /\b(overcook(?:ing)?|lean eye|fat renders|pink core|fat rim|thin crust|low chew|firm beef bite|buttery soft bite)\b/.test(
      normalized,
    );

  if (!looksInternal) return value;
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

  if (normalized.includes("mark step done")) {
    return lang === "es" ? "Marca el paso como completado." : "Merkitse vaihe valmiiksi.";
  }

  if (lang === "es") return "Sigue este paso con calor controlado y verifica el punto antes de avanzar.";
  return "Jatka hallitulla lampotilalla ja varmista kypsyys ennen seuraavaa vaihetta.";
}

export function getLiveText(lang: SurfaceLang) {
  if (lang === "es") {
    return {
      noStepsTitle: "No hay pasos de cocina disponibles",
      noStepsBody: "Vuelve al plan y genera una coccion nueva.",
      backToPlan: "Volver al plan",
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
      noStepsTitle: "Live-vaiheita ei ole saatavilla",
      noStepsBody: "Palaa suunnitelmaan ja luo uusi kypsennys.",
      backToPlan: "Takaisin suunnitelmaan",
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
    noStepsTitle: "No live steps available",
    noStepsBody: "Return to the plan and start again.",
    backToPlan: "Back to plan",
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
