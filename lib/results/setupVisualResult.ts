import { sanitizeSetupSummaryCopy } from "@/lib/i18n/surfaceFallbacks";
import {
  detectSetupFromText,
  getSetupVisual,
  type SetupEquipment,
  type SetupType,
} from "@/lib/setupVisualMap";
import { compactSummaryValue, type ResultLang } from "@/lib/results/resultSummary";

export type SetupOverlayChip = {
  label: string;
  tone: "direct" | "indirect" | "neutral";
};

export function normalizeSetupText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function resolveSetupEquipment(value = ""): SetupEquipment | undefined {
  const normalized = normalizeSetupText(value);

  if (normalized.includes("kamado")) return "kamado";
  if (
    normalized.includes("interior") ||
    normalized.includes("indoor") ||
    normalized.includes("cocina") ||
    normalized.includes("sarten") ||
    normalized.includes("horno") ||
    normalized.includes("oven")
  ) {
    return "indoor";
  }
  if (normalized.includes("carbon") || normalized.includes("charcoal")) return "charcoal";
  if (normalized.includes("gas") || normalized.includes("napoleon") || normalized.includes("rogue")) {
    return "gas";
  }

  return undefined;
}

export function getSetupOverlayChips(
  setup: SetupType | undefined,
  lang: ResultLang,
): SetupOverlayChip[] {
  const normalizedSetup = normalizeSetupText(setup).replace(/[_\s]+/g, "-");
  const labels = {
    indirect: lang === "es" ? "❄️ Indirecto" : lang === "fi" ? "❄️ Epasuora" : "❄️ Indirect",
    finalSear: lang === "es" ? "Sellado final" : lang === "fi" ? "Lopullinen ruskistus" : "Final sear",
    lowHeat: lang === "es" ? "Baja temperatura" : lang === "fi" ? "Matala lampo" : "Low heat",
    twoZones: lang === "es" ? "2 zonas" : lang === "fi" ? "2 vyohyketta" : "2 zones",
    mixZone:
      lang === "es" ? "🔥 Directo + ❄️ Indirecto" : lang === "fi" ? "🔥 Suora + ❄️ Epasuora" : "🔥 Direct + ❄️ Indirect",
    direct: lang === "es" ? "🔥 Directo" : lang === "fi" ? "🔥 Suora" : "🔥 Direct",
  };

  if (normalizedSetup === "reverse-sear") {
    return [
      { label: labels.indirect, tone: "indirect" },
      { label: labels.finalSear, tone: "direct" },
    ];
  }

  if (normalizedSetup === "low-slow" || normalizedSetup === "low-and-slow") {
    return [
      { label: labels.indirect, tone: "indirect" },
      { label: labels.lowHeat, tone: "neutral" },
    ];
  }

  if (normalizedSetup === "two-zone") {
    return [
      { label: labels.mixZone, tone: "neutral" },
      { label: labels.twoZones, tone: "neutral" },
    ];
  }

  if (normalizedSetup === "indirect" || normalizedSetup === "indirecto") {
    return [{ label: labels.indirect, tone: "indirect" }];
  }

  if (normalizedSetup === "direct" || normalizedSetup === "direct-heat" || normalizedSetup === "directo") {
    return [{ label: labels.direct, tone: "direct" }];
  }

  return [
    { label: labels.mixZone, tone: "neutral" },
    { label: labels.twoZones, tone: "neutral" },
  ];
}

export function getSetupOverlayChipClass(tone: SetupOverlayChip["tone"]) {
  const base =
    "rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-black uppercase leading-none tracking-[0.08em] shadow-lg backdrop-blur-md ring-1 ring-inset ring-white/10";

  if (tone === "direct") {
    return `${base} text-orange-200 shadow-orange-950/40`;
  }

  if (tone === "indirect") {
    return `${base} text-sky-200 shadow-sky-950/40`;
  }

  return `${base} text-white shadow-black/30`;
}

export function buildSetupVisualResult({
  content,
  equipment,
  lang,
  setup,
}: {
  content?: string;
  equipment?: string;
  lang: ResultLang;
  setup?: SetupType;
}) {
  if (!content?.trim()) return null;

  const setupEquipment = resolveSetupEquipment(equipment) ?? resolveSetupEquipment(content);
  const detectedSetup = setup ?? detectSetupFromText(content);
  const setupImage = getSetupVisual(setupEquipment, detectedSetup);
  const overlayChips = getSetupOverlayChips(detectedSetup, lang);
  const setupLine = sanitizeSetupSummaryCopy(compactSummaryValue(content), lang, equipment);
  const setupVisualLabel = lang === "es" ? "Visual de configuración" : lang === "fi" ? "Asetuskuva" : "Setup visual";

  return {
    setupImage,
    overlayChips,
    setupLine,
    setupVisualLabel,
  };
}
