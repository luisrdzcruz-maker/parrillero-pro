import type { PlannerCutInput, PlanningAnimal } from "./types";

export type ParrilladaItemVisibility = "recommended" | "standard" | "advanced";
export type ParrilladaItemRole = "main" | "side" | "starter" | "fastFinish" | "longCook";
export type ParrilladaItemComplexity = "easy" | "medium" | "advanced";
export type ParrilladaItemCategory = "beef" | "pork" | "chicken" | "fish" | "vegetables" | "sausages";

export type ParrilladaItemPresentation = {
  category: ParrilladaItemCategory;
  categoryLabel: string;
  role: ParrilladaItemRole;
  roleLabel: string;
  visibility: ParrilladaItemVisibility;
  complexity: ParrilladaItemComplexity;
  goodForGroups: boolean;
  requiresEarlyStart: boolean;
  planningHint: string;
};

type CatalogUiOverride = Partial<Omit<ParrilladaItemPresentation, "categoryLabel" | "roleLabel">>;

const PARRILLADA_UI_OVERRIDES: Partial<Record<string, CatalogUiOverride>> = {
  ribeye: {
    role: "main",
    visibility: "recommended",
    complexity: "easy",
    goodForGroups: true,
    planningHint: "Main cut",
  },
  bone_in_ribeye: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  picanha: {
    role: "main",
    visibility: "recommended",
    complexity: "medium",
    goodForGroups: true,
    planningHint: "Good for groups",
  },
  striploin: {
    role: "main",
    visibility: "recommended",
    complexity: "easy",
    goodForGroups: true,
    planningHint: "Main cut",
  },
  tenderloin: {
    role: "main",
    visibility: "recommended",
    complexity: "medium",
    planningHint: "Serve immediately",
  },
  skirt_steak: {
    role: "fastFinish",
    visibility: "standard",
    complexity: "medium",
    planningHint: "Fast finish",
  },
  flank_steak: {
    role: "main",
    visibility: "standard",
    complexity: "medium",
    planningHint: "Slice before serving",
  },
  t_bone: {
    role: "main",
    visibility: "recommended",
    complexity: "medium",
    goodForGroups: true,
    planningHint: "Main cut",
  },
  tomahawk: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  iberian_secreto: {
    role: "fastFinish",
    visibility: "recommended",
    complexity: "medium",
    planningHint: "Fast finish",
  },
  pork_loin: {
    role: "main",
    visibility: "recommended",
    complexity: "medium",
    goodForGroups: true,
    planningHint: "Main cut",
  },
  iberian_presa: {
    role: "fastFinish",
    visibility: "recommended",
    complexity: "medium",
    planningHint: "Fast finish",
  },
  pork_collar: {
    role: "main",
    visibility: "standard",
    complexity: "medium",
    goodForGroups: true,
    planningHint: "Main cut",
  },
  chicken_breast: {
    role: "main",
    visibility: "standard",
    complexity: "easy",
    planningHint: "Main cut",
  },
  chicken_drumstick: {
    role: "starter",
    visibility: "standard",
    complexity: "easy",
    goodForGroups: true,
    planningHint: "Good for groups",
  },
  chicken_leg_quarter: {
    role: "main",
    visibility: "standard",
    complexity: "medium",
    goodForGroups: true,
    planningHint: "Main cut",
  },
  chicken_wing: {
    role: "starter",
    visibility: "recommended",
    complexity: "easy",
    goodForGroups: true,
    planningHint: "Starter",
  },
  whole_chicken: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  spatchcock_chicken: {
    role: "main",
    visibility: "recommended",
    complexity: "medium",
    goodForGroups: true,
    planningHint: "Good for groups",
  },
  salmon: {
    role: "fastFinish",
    visibility: "standard",
    complexity: "medium",
    planningHint: "Serve immediately",
  },
  asparagus: {
    role: "side",
    visibility: "standard",
    complexity: "easy",
    planningHint: "Fast finish",
  },
  corn_on_cob: {
    role: "side",
    visibility: "standard",
    complexity: "easy",
    goodForGroups: true,
    planningHint: "Good for groups",
  },
  potato_halves: {
    role: "side",
    visibility: "standard",
    complexity: "easy",
    goodForGroups: true,
    planningHint: "Good for groups",
  },
  mushrooms: {
    role: "side",
    visibility: "standard",
    complexity: "easy",
    planningHint: "Fast finish",
  },
  bell_peppers: {
    role: "side",
    visibility: "standard",
    complexity: "easy",
    planningHint: "Fast finish",
  },
  eggplant_slices: {
    role: "side",
    visibility: "standard",
    complexity: "easy",
    planningHint: "Fast finish",
  },
  brisket: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  short_ribs: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  baby_back_ribs: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  spare_ribs: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  pork_belly: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  pork_belly_slices: {
    role: "fastFinish",
    visibility: "standard",
    complexity: "medium",
  },
  chuck_roast: {
    role: "longCook",
    visibility: "advanced",
    complexity: "advanced",
    goodForGroups: true,
    requiresEarlyStart: true,
  },
  pork_tenderloin: {
    role: "main",
    visibility: "recommended",
    complexity: "medium",
    planningHint: "Main cut",
  },
  pork_chop: {
    role: "main",
    visibility: "standard",
    complexity: "easy",
    planningHint: "Main cut",
  },
  sausages: {
    category: "sausages",
    role: "starter",
    visibility: "standard",
    complexity: "easy",
    goodForGroups: true,
    planningHint: "Good for groups",
  },
  chorizo_criollo: {
    category: "sausages",
    role: "starter",
    visibility: "standard",
    complexity: "easy",
    goodForGroups: true,
    planningHint: "Starter",
  },
};

const CATEGORY_LABELS: Record<ParrilladaItemCategory, string> = {
  beef: "Beef",
  pork: "Pork",
  chicken: "Chicken",
  fish: "Fish",
  vegetables: "Vegetables",
  sausages: "Sausages",
};

const ROLE_LABELS: Record<ParrilladaItemRole, string> = {
  main: "Main",
  side: "Side",
  starter: "Starter",
  fastFinish: "Fast finish",
  longCook: "Long cook",
};

function categoryFromAnimal(animal: PlanningAnimal): ParrilladaItemCategory {
  if (animal === "beef") return "beef";
  if (animal === "pork") return "pork";
  if (animal === "chicken") return "chicken";
  if (animal === "fish" || animal === "seafood") return "fish";
  if (animal === "vegetable") return "vegetables";
  return "beef";
}

function inferRole(item: PlannerCutInput): ParrilladaItemRole {
  const metadata = item.planningMetadata;
  if (metadata && metadata.totalSessionMinutes >= 90) return "longCook";
  if (item.animal === "vegetable") return "side";
  if (metadata?.timingSensitivity === "high") return "fastFinish";
  return "main";
}

function isLowAndSlowMetadata(item: PlannerCutInput): boolean {
  const requiredZones = item.planningMetadata?.requiredZones ?? [];
  const preferredZones = item.planningMetadata?.preferredZones ?? [];
  return (
    requiredZones.includes("smoke_low") ||
    requiredZones.includes("indirect_low") ||
    preferredZones.includes("smoke_low") ||
    preferredZones.includes("indirect_low")
  );
}

function inferHint(item: PlannerCutInput, role: ParrilladaItemRole): string {
  const metadata = item.planningMetadata;
  if (role === "longCook") {
    if (metadata?.timingSensitivity === "medium" || metadata?.timingSensitivity === "high") {
      return "Higher timing risk";
    }
    if (isLowAndSlowMetadata(item)) return "Needs low and slow";
    if ((metadata?.totalSessionMinutes ?? 0) >= 120) return "Start early";
    return "Long cook";
  }
  if (role === "side" || role === "fastFinish") return "Fast finish";
  if (metadata?.timingSensitivity === "high") return "Serve immediately";
  if (metadata?.canHoldWarm) return "Good for groups";
  return "Main cut";
}

export function getParrilladaItemPresentation(item: PlannerCutInput): ParrilladaItemPresentation {
  const override = PARRILLADA_UI_OVERRIDES[item.cutId] ?? {};
  const inferredRole = override.role ?? inferRole(item);
  const totalMinutes = item.planningMetadata?.totalSessionMinutes ?? 0;
  const requiresEarlyStart = override.requiresEarlyStart ?? totalMinutes >= 90;
  const category = override.category ?? categoryFromAnimal(item.animal);
  const visibility =
    override.visibility ?? (requiresEarlyStart ? "advanced" : item.priority && item.priority >= 4 ? "recommended" : "standard");

  return {
    category,
    categoryLabel: CATEGORY_LABELS[category],
    role: inferredRole,
    roleLabel: ROLE_LABELS[inferredRole],
    visibility,
    complexity: override.complexity ?? (requiresEarlyStart ? "advanced" : "easy"),
    goodForGroups: override.goodForGroups ?? Boolean(item.planningMetadata?.canHoldWarm),
    requiresEarlyStart,
    planningHint: override.planningHint ?? inferHint(item, inferredRole),
  };
}
