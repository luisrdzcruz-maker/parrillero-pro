export type LiveVisualType =
  | "direct_heat"
  | "indirect_two_zone"
  | "reverse_sear"
  | "rest"
  | "slice_against_grain";

export type LiveVisualGuideStep = {
  label: string;
  zone: string;
  notes?: string | null;
};

export type LiveVisualGuideContext =
  | string
  | {
      label?: string | null;
      zone?: string | null;
      notes?: string | null;
      keywords?: string[] | null;
    };

export type LiveVisualGuide = {
  type: LiveVisualType | (string & {});
  imageSrc: string;
  title: string;
  action: string;
  chips: string[];
  tip?: string;
  needsAsset?: true;
};

type VisualGuidePreset = LiveVisualGuide & {
  type: LiveVisualType;
  keywords: string[];
};

const LIVE_VISUAL_GUIDES: Record<LiveVisualType, VisualGuidePreset> = {
  direct_heat: {
    type: "direct_heat",
    imageSrc: "/setup/setup_fire_direct_heat.webp",
    title: "Calor directo",
    action: "Pon la comida sobre el fuego fuerte y deja que marque sin moverla.",
    chips: ["Fuego fuerte", "Encima del calor", "No mover"],
    keywords: ["directo", "direct", "sear", "sellar", "sella", "sellado", "dorar", "marcar"],
  },
  indirect_two_zone: {
    type: "indirect_two_zone",
    imageSrc: "/setup/setup_two_zone.webp",
    title: "Zona indirecta",
    action: "Mueve la comida al lado sin llama directa y cocina con la tapa cerrada.",
    chips: ["Dos zonas", "Fuera del fuego", "Tapa cerrada"],
    keywords: ["indirecto", "indirect", "dos zonas", "two zone", "two-zone"],
  },
  reverse_sear: {
    type: "reverse_sear",
    imageSrc: "/setup/setup_reverse_sear.webp",
    title: "Sellado inverso",
    action: "Cocina primero suave en indirecto; el sellado fuerte llega al final.",
    chips: ["Indirecto primero", "Fuego final", "Control"],
    keywords: ["reverse", "inverso", "reverse sear", "reverse-sear", "sellado inverso"],
  },
  rest: {
    type: "rest",
    imageSrc: "/setup/setup_two_zone.webp",
    title: "Reposo",
    action: "Saca la carne del fuego y espera antes de cortar.",
    chips: ["Fuera del fuego", "Tabla lista", "No cortar"],
    tip: "El reposo ayuda a que los jugos se asienten.",
    needsAsset: true,
    keywords: ["reposo", "reposar", "reposa", "rest"],
  },
  slice_against_grain: {
    type: "slice_against_grain",
    imageSrc: "/setup/setup_fire_two_zone.webp",
    title: "Corte contra la fibra",
    action: "Después del reposo, corta en láminas contra la fibra.",
    chips: ["Contra la fibra", "Cuchillo afilado", "Servir"],
    tip: "Busca la dirección de la fibra y corta cruzándola, no siguiéndola.",
    needsAsset: true,
    keywords: ["servir", "serve", "cortar", "corta", "slice", "cut", "fibra", "grain"],
  },
};

const RESOLUTION_ORDER: LiveVisualType[] = [
  "slice_against_grain",
  "rest",
  "reverse_sear",
  "indirect_two_zone",
  "direct_heat",
];

function normalize(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function getContextText(context?: LiveVisualGuideContext) {
  if (!context) return "";

  if (typeof context === "string") return context;

  return [
    context.zone,
    context.label,
    context.notes,
    ...(context.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function getStepText(step: LiveVisualGuideStep, context?: LiveVisualGuideContext) {
  return normalize(`${step.zone} ${step.label} ${step.notes ?? ""} ${getContextText(context)}`);
}

function resolveLiveVisualType(
  step: LiveVisualGuideStep,
  context?: LiveVisualGuideContext,
): LiveVisualType {
  const text = getStepText(step, context);

  return (
    RESOLUTION_ORDER.find((type) =>
      includesAny(text, LIVE_VISUAL_GUIDES[type].keywords),
    ) ?? "direct_heat"
  );
}

export function getLiveVisualGuide(
  step: LiveVisualGuideStep,
  context?: LiveVisualGuideContext,
): LiveVisualGuide {
  const guide = LIVE_VISUAL_GUIDES[resolveLiveVisualType(step, context)];

  return {
    type: guide.type,
    imageSrc: guide.imageSrc,
    title: guide.title,
    action: guide.action,
    chips: guide.chips,
    tip: guide.tip,
    needsAsset: guide.needsAsset,
  };
}
