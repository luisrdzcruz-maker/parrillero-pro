import type { CookingPlan, CookingStyle, Language, ProductCut } from "@/lib/cookingCatalog";
import {
  getPrepGuidanceFromCatalogV2,
  type CatalogV2TimeRange,
} from "@/lib/cutCatalogV2Adapter";

export type PrepGuidanceSource = "catalog-v2" | "fallback";

export type PrepGuidance = {
  source: PrepGuidanceSource;
  prepProfileId: string;
  prepLeadTimeMinutes?: CatalogV2TimeRange;
  saltStrategy: string;
  saltTimingMinutes?: CatalogV2TimeRange;
  saltAmountGuidance?: string;
  saltSurfaceGuidance?: string;
  prepWarningCodes: readonly string[];
};

export type PrepGuidanceCutInput = {
  id?: string;
  cutId?: string;
  variantId?: string;
  animalId?: string;
  style?: CookingStyle;
  inputProfileId?: string;
  names?: Partial<Record<Language, string>>;
};

export type CookingPlanWithPrepGuidance = CookingPlan & {
  readonly prepGuidance?: PrepGuidance;
};

function normalize(value: string | undefined) {
  return (
    value
      ?.trim()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase() ?? ""
  );
}

function resolveCutId(cut: ProductCut | PrepGuidanceCutInput | string | undefined) {
  if (typeof cut === "string") return cut;
  if (!cut) return "";
  if ("cutId" in cut && cut.cutId) return cut.cutId;
  return cut.id ?? "";
}

function isWholeChicken(cut: ProductCut | PrepGuidanceCutInput) {
  const id = normalize(resolveCutId(cut));
  const nameText = normalize(Object.values(cut.names ?? {}).join(" "));
  return id.includes("whole_chicken") || id.includes("pollo_entero") || nameText.includes("whole chicken");
}

function isChickenBreast(cut: ProductCut | PrepGuidanceCutInput) {
  const id = normalize(resolveCutId(cut));
  const nameText = normalize(Object.values(cut.names ?? {}).join(" "));
  return id.includes("chicken_breast") || id.includes("pechuga") || nameText.includes("breast");
}

function isPicanhaWhole(cut: ProductCut | PrepGuidanceCutInput) {
  const id = normalize(resolveCutId(cut));
  return id === "picanha" || id === "whole_picanha" || (id.includes("picanha") && !id.includes("steak"));
}

function isThickSteak(cut: ProductCut | PrepGuidanceCutInput) {
  const id = normalize(resolveCutId(cut));
  return (
    cut.style === "thick" ||
    cut.style === "reverse" ||
    id.includes("chuleton") ||
    id.includes("tomahawk") ||
    id.includes("bone_in") ||
    id.includes("t_bone")
  );
}

function guidance(
  source: PrepGuidanceSource,
  prepProfileId: string,
  minutes: CatalogV2TimeRange,
  saltStrategy: string,
  saltAmountGuidance: string,
  saltSurfaceGuidance: string,
  prepWarningCodes: readonly string[] = [],
): PrepGuidance {
  return {
    source,
    prepProfileId,
    prepLeadTimeMinutes: minutes,
    saltStrategy,
    saltTimingMinutes: minutes,
    saltAmountGuidance,
    saltSurfaceGuidance,
    prepWarningCodes,
  };
}

export function getFallbackPrepGuidance(cut: ProductCut | PrepGuidanceCutInput): PrepGuidance {
  const animalId = normalize(cut.animalId);
  const id = normalize(resolveCutId(cut));

  if (animalId === "vegetables" || animalId === "vegetable" || cut.style === "vegetable" || id.includes("asparagus")) {
    return guidance("fallback", "vegetable_salt_just_before", { min: 0, max: 5 }, "salt_just_before", "light", "all_sides", [
      "avoid_early_salting_vegetables",
    ]);
  }

  if (animalId === "fish" || cut.style === "fish") {
    return guidance("fallback", "fish_short_salt", { min: 10, max: 30 }, "salt_just_before", "light", "flesh_side", [
      "avoid_long_salting_fish",
      "pat_dry_before_grill",
    ]);
  }

  if (animalId === "chicken") {
    if (isWholeChicken(cut)) {
      return guidance("fallback", "poultry_whole_dry_brine", { min: 240, max: 1440 }, "dry_brine", "moderate", "skin_and_cavity", [
        "air_dry_skin_for_crispness",
        "separate_raw_chicken_tools",
      ]);
    }

    return guidance(
      "fallback",
      isChickenBreast(cut) ? "poultry_short_dry_brine" : "poultry_piece_dry_brine",
      { min: 30, max: 240 },
      "dry_brine",
      "moderate",
      "all_sides",
      ["separate_raw_chicken_tools", "avoid_over_salting_lean_poultry"],
    );
  }

  if (isPicanhaWhole(cut)) {
    return guidance(
      "fallback",
      "beef_thick_dry_brine_fat_cap",
      { min: 120, max: 1440 },
      "dry_brine",
      "moderate",
      "meat_side_generous_fat_cap_light",
      ["avoid_heavy_salt_on_fat_cap", "pat_dry_before_sear"],
    );
  }

  if (animalId === "beef" && cut.style === "lowSlow") {
    return guidance("fallback", "low_slow_dry_brine", { min: 720, max: 1440 }, "dry_brine", "generous", "all_sides", [
      "low_slow_salt_ahead_recommended",
    ]);
  }

  if (animalId === "beef" && isThickSteak(cut)) {
    return guidance("fallback", "beef_thick_dry_brine", { min: 120, max: 1440 }, "dry_brine", "generous", "all_sides", [
      "pat_dry_before_sear",
    ]);
  }

  if (animalId === "beef") {
    return guidance("fallback", "beef_steak_dry_brine", { min: 45, max: 1440 }, "dry_brine", "generous", "all_sides", [
      "pat_dry_before_sear",
    ]);
  }

  return guidance("fallback", "general_salt_just_before", { min: 0, max: 5 }, "salt_just_before", "moderate", "all_sides");
}

export function getPrepGuidanceForCut(
  cut: ProductCut | PrepGuidanceCutInput | string | undefined,
): PrepGuidance | undefined {
  if (!cut) return undefined;

  const cutId = resolveCutId(cut);
  const variantId = typeof cut === "string" || !("variantId" in cut) ? undefined : cut.variantId;
  const catalogGuidance = cutId ? getPrepGuidanceFromCatalogV2(cutId, variantId) : undefined;
  if (catalogGuidance) {
    return {
      source: "catalog-v2",
      prepProfileId: catalogGuidance.prepProfileId,
      prepLeadTimeMinutes: catalogGuidance.prepLeadTimeMinutes,
      saltStrategy: catalogGuidance.saltStrategy ?? "salt_just_before",
      saltTimingMinutes: catalogGuidance.saltTimingMinutes,
      saltAmountGuidance: catalogGuidance.saltAmountGuidance,
      saltSurfaceGuidance: catalogGuidance.saltSurfaceGuidance,
      prepWarningCodes: catalogGuidance.prepWarningCodes,
    };
  }

  return typeof cut === "string" ? getFallbackPrepGuidance({ id: cut }) : getFallbackPrepGuidance(cut);
}

function formatMinutes(value: number, lang: Language) {
  if (value === 0) return "0 min";
  if (value < 60) return `${value} min`;
  const hours = value / 60;
  const rounded = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, "");
  return lang === "fi" ? `${rounded} h` : `${rounded} h`;
}

function formatRange(range: CatalogV2TimeRange | undefined, lang: Language) {
  if (!range) return "";
  if (range.min <= 0 && range.max <= 5) {
    return lang === "es" ? "justo antes" : lang === "fi" ? "juuri ennen" : "just before";
  }
  if (range.min === range.max) return formatMinutes(range.min, lang);
  return `${formatMinutes(range.min, lang)}-${formatMinutes(range.max, lang)}`;
}

function isFishGuidance(guidance: PrepGuidance) {
  return guidance.prepProfileId.includes("fish") || guidance.prepWarningCodes.includes("avoid_long_salting_fish");
}

function isVegetableGuidance(guidance: PrepGuidance) {
  return guidance.prepProfileId.includes("vegetable") || guidance.prepWarningCodes.includes("avoid_early_salting_vegetables");
}

function hasFatCapSurfaceGuidance(guidance: PrepGuidance) {
  return guidance.saltSurfaceGuidance === "meat_side_generous_fat_cap_light";
}

export function formatPrepGuidance(guidance: PrepGuidance | undefined, lang: Language = "en") {
  if (!guidance) return "";

  const range = formatRange(guidance.saltTimingMinutes ?? guidance.prepLeadTimeMinutes, lang);

  if (lang === "es") {
    if (isVegetableGuidance(guidance)) return "Preparacion recomendada: Sala justo antes de cocinar.";
    if (isFishGuidance(guidance)) return `Preparacion recomendada: Sala ${range} antes solamente.`;
    if (hasFatCapSurfaceGuidance(guidance)) {
      return `Preparacion recomendada: Sala ${range} antes; ligero sobre la capa de grasa. Si cocinas ahora, sala justo antes y seca la superficie.`;
    }
    if (guidance.saltStrategy === "rub_salt_aware") {
      return `Preparacion recomendada: Aplica el rub ${range} antes y revisa si ya contiene sal.`;
    }
    return `Preparacion recomendada: Sala ${range} antes. Si cocinas ahora, sala justo antes y seca la superficie.`;
  }

  if (isVegetableGuidance(guidance)) return "Recommended prep: Salt just before cooking.";
  if (isFishGuidance(guidance)) return `Recommended prep: Salt ${range} before only.`;
  if (hasFatCapSurfaceGuidance(guidance)) {
    return `Recommended prep: Salt ${range} before; go light on the fat cap. If cooking now, salt just before and pat dry.`;
  }
  if (guidance.saltStrategy === "rub_salt_aware") {
    return `Recommended prep: Apply rub ${range} before and check whether the rub already contains salt.`;
  }

  return `Recommended prep: Salt ${range} before. If cooking now, salt just before and pat dry.`;
}

export function attachPrepGuidance<T extends Record<string, string>>(plan: T, prepGuidance: PrepGuidance | undefined): T {
  if (!prepGuidance) return plan;

  Object.defineProperty(plan, "prepGuidance", {
    value: prepGuidance,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return plan;
}

export function getPlanPrepGuidance(plan: unknown): PrepGuidance | undefined {
  if (!plan || typeof plan !== "object") return undefined;
  const value = (plan as { readonly prepGuidance?: unknown }).prepGuidance;
  if (!value || typeof value !== "object") return undefined;
  return value as PrepGuidance;
}
