export type ParrilladaInput = {
  people: string;
  serveTime: string;
  products: string;
  sides: string;
  equipment: string;
  language: "es" | "en";
};

export type ParrilladaPlan = Record<string, string>;

type ItemPlan = {
  name: string;
  startOffset: number;
  duration: number;
  quantity: string;
  notes: string;
  zone: "directa" | "indirecta" | "reposo" | "acompañamiento";
  priority: "alta" | "media" | "baja";
};

function parsePeople(value: string) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 6;
}

function parseProducts(text: string) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);

  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return 18 * 60;
  }

  return h * 60 + m;
}

function minutesToTime(total: number) {
  const normalized = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function classifyProduct(name: string, people: number): ItemPlan {
  const n = name.toLowerCase();

  if (n.includes("costilla")) {
    return {
      name,
      startOffset: 180,
      duration: 165,
      quantity: `${Math.ceil(people * 0.45)} kg`,
      notes: "Cocción lenta indirecta + glaseado final.",
      zone: "indirecta",
      priority: "alta",
    };
  }

  if (n.includes("tomahawk") || n.includes("chuletón") || n.includes("chuleton")) {
    return {
      name,
      startOffset: 65,
      duration: 50,
      quantity: `${Math.ceil(people * 0.45)} kg`,
      notes: "Sellado fuerte + indirecto + reposo.",
      zone: "directa",
      priority: "alta",
    };
  }

  if (n.includes("picanha")) {
    return {
      name,
      startOffset: 55,
      duration: 40,
      quantity: `${Math.ceil(people * 0.35)} kg`,
      notes: "Fundir grasa primero y terminar con sellado.",
      zone: "directa",
      priority: "media",
    };
  }

  if (n.includes("secreto")) {
    return {
      name,
      startOffset: 25,
      duration: 15,
      quantity: `${Math.ceil(people * 0.25)} kg`,
      notes: "Fuego medio-alto, rápido, reposo corto.",
      zone: "directa",
      priority: "media",
    };
  }

  if (n.includes("presa")) {
    return {
      name,
      startOffset: 40,
      duration: 30,
      quantity: `${Math.ceil(people * 0.3)} kg`,
      notes: "Sellado + indirecto suave si es gruesa.",
      zone: "directa",
      priority: "media",
    };
  }

  if (n.includes("pollo") || n.includes("muslo") || n.includes("alita")) {
    return {
      name,
      startOffset: 70,
      duration: 55,
      quantity: `${Math.ceil(people * 0.35)} kg`,
      notes: "Indirecto primero, dorado final.",
      zone: "indirecta",
      priority: "media",
    };
  }

  if (n.includes("maíz") || n.includes("maiz") || n.includes("patata")) {
    return {
      name,
      startOffset: 50,
      duration: 40,
      quantity: people <= 6 ? "6-8 unidades" : `${people} unidades aprox.`,
      notes: "Acompañamiento: empezar antes que cortes rápidos.",
      zone: "acompañamiento",
      priority: "baja",
    };
  }

  return {
    name,
    startOffset: 35,
    duration: 25,
    quantity: `${Math.ceil(people * 0.25)} kg`,
    notes: "Cocción media; ajustar según grosor.",
    zone: "directa",
    priority: "media",
  };
}

function buildTimeline(items: ItemPlan[], serveMinutes: number) {
  const sorted = [...items].sort((a, b) => b.startOffset - a.startOffset);

  const rows = sorted.map((item) => {
    const start = minutesToTime(serveMinutes - item.startOffset);
    const end = minutesToTime(serveMinutes - item.startOffset + item.duration);

    return `${start}|${end}|${item.name}|${item.zone}|${item.duration} min|${item.notes}`;
  });

  rows.push(
    `${minutesToTime(serveMinutes)}|--|SERVIR|reposo|0 min|Todo debe estar reposado y listo.`,
  );

  return rows.join("\n");
}

function buildGrillManager(items: ItemPlan[], language: "es" | "en") {
  const sorted = [...items].sort((a, b) => b.startOffset - a.startOffset);

  const hasLongIndirect = sorted.some((item) => item.zone === "indirecta" && item.duration >= 90);

  const indirectItems = sorted.filter((item) => item.zone === "indirecta");
  const directItems = sorted.filter((item) => item.zone === "directa");
  const fastDirectItems = sorted.filter((item) => item.zone === "directa" && item.duration <= 30);
  const highPriorityItems = sorted.filter((item) => item.priority === "alta");

  if (language === "en") {
    return [
      hasLongIndirect
        ? `⚠️ Indirect zone reserved: ${indirectItems.map((item) => item.name).join(", ")}. Do not overload it with fast cuts.`
        : "✅ Indirect zone is not overloaded.",
      fastDirectItems.length > 0
        ? `🔥 Fast direct-heat cuts: ${fastDirectItems.map((item) => item.name).join(", ")}. Cook them close to serving time.`
        : "✅ No risky fast direct cuts detected.",
      highPriorityItems.length > 0
        ? `⭐ High priority first: ${highPriorityItems.map((item) => item.name).join(", ")}.`
        : "✅ No high-priority conflicts.",
      directItems.length >= 3
        ? "⚠️ Several direct-heat items detected. Keep one hot zone and cook in waves."
        : "✅ Direct zone load looks manageable.",
      "🧠 Strategy: keep one hot direct zone, one cooler indirect zone and one resting area.",
    ].join("\n");
  }

  return [
    hasLongIndirect
      ? `⚠️ Zona indirecta reservada: ${indirectItems.map((item) => item.name).join(", ")}. No la sobrecargues con cortes rápidos.`
      : "✅ La zona indirecta no está sobrecargada.",
    fastDirectItems.length > 0
      ? `🔥 Cortes rápidos directos: ${fastDirectItems.map((item) => item.name).join(", ")}. Cocínalos cerca de la hora de servir.`
      : "✅ No hay cortes rápidos directos conflictivos.",
    highPriorityItems.length > 0
      ? `⭐ Prioridad alta primero: ${highPriorityItems.map((item) => item.name).join(", ")}.`
      : "✅ No hay conflictos de prioridad alta.",
    directItems.length >= 3
      ? "⚠️ Hay varios productos de fuego directo. Mantén una zona fuerte y cocina por tandas."
      : "✅ La carga de la zona directa parece manejable.",
    "🧠 Estrategia: mantén una zona directa fuerte, una zona indirecta suave y una zona de reposo.",
  ].join("\n");
}

export function generateParrilladaPlan(input: ParrilladaInput): ParrilladaPlan {
  const people = parsePeople(input.people);
  const products = parseProducts(input.products);
  const serveMinutes = timeToMinutes(input.serveTime || "18:00");

  const items = products.map((product) => classifyProduct(product, people));
  const sorted = [...items].sort((a, b) => b.startOffset - a.startOffset);

  if (input.language === "en") {
    return {
      MENU: `BBQ for ${people} people.\nMain products: ${products.join(
        ", ",
      )}.\nSides: ${input.sides || "simple sides"}.\nEquipment: ${input.equipment}.`,
      TIMELINE: buildTimeline(sorted, serveMinutes),
      GRILL_MANAGER: buildGrillManager(sorted, "en"),
      QUANTITIES: sorted.map((item) => `- ${item.name}: ${item.quantity}`).join("\n"),
      ORDER: sorted.map((item, index) => `${index + 1}. ${item.name}: ${item.notes}`).join("\n"),
      SHOPPING: [
        ...sorted.map((item) => `- ${item.name}: ${item.quantity}`),
        input.sides ? `- Sides: ${input.sides}` : "- Sides: potatoes, salad, bread, sauces",
        "- Salt",
        "- Charcoal/gas check",
      ].join("\n"),
      ERROR:
        "Do not cook everything at the same time. Start long cooks first and fast cuts near serving time.",
    };
  }

  return {
    MENU: `Parrillada para ${people} personas.\nProductos principales: ${products.join(
      ", ",
    )}.\nAcompañamientos: ${
      input.sides || "acompañamientos sencillos"
    }.\nEquipo: ${input.equipment}.`,
    TIMELINE: buildTimeline(sorted, serveMinutes),
    GRILL_MANAGER: buildGrillManager(sorted, "es"),
    CANTIDADES: sorted.map((item) => `- ${item.name}: ${item.quantity}`).join("\n"),
    ORDEN: sorted.map((item, index) => `${index + 1}. ${item.name}: ${item.notes}`).join("\n"),
    COMPRA: [
      ...sorted.map((item) => `- ${item.name}: ${item.quantity}`),
      input.sides
        ? `- Acompañamientos: ${input.sides}`
        : "- Acompañamientos: patatas, ensalada, pan, salsas",
      "- Sal",
      "- Revisar carbón/gas",
    ].join("\n"),
    ERROR:
      "No cocinar todo a la vez. Empieza por lo lento y deja los cortes rápidos para el final.",
  };
}
