export const REQUIRED_MENU_BLOCKS = ["MENU", "CANTIDADES", "TIMING", "ORDEN", "COMPRA", "ERROR"];
export const REQUIRED_MENU_BLOCKS_EN = ["MENU", "QUANTITIES", "TIMING", "ORDER", "SHOPPING", "ERROR"];

export const REQUIRED_COOKING_BLOCKS = ["SETUP", "TIEMPOS", "TEMPERATURA", "PASOS", "ERROR"];
export const REQUIRED_COOKING_BLOCKS_EN = ["SETUP", "TIMES", "TEMPERATURE", "STEPS", "ERROR"];

export const REQUIRED_PARRILLADA_BLOCKS = ["TIMELINE", "GRILL_MANAGER", "COMPRA", "ERROR"];
export const REQUIRED_PARRILLADA_BLOCKS_EN = ["TIMELINE", "GRILL_MANAGER", "SHOPPING", "ERROR"];

export type NormalizedBlockType = "cooking_plan" | "generated_menu" | "parrillada_plan";

const aliases: Record<string, string[]> = {
  CANTIDADES: ["QUANTITIES"],
  COMPRA: ["SHOPPING", "LISTA_COMPRA", "SHOPPING_LIST"],
  GRILL_MANAGER: ["PARRILLA", "GESTOR_PARRILLA", "GRILL", "ESTRATEGIA"],
  ORDEN: ["ORDER"],
  PASOS: ["STEPS"],
  TEMPERATURA: ["TEMPERATURE"],
  TIEMPOS: ["TIMES"],
  TIMELINE: ["TIMING", "CRONOGRAMA"],
  TIMING: ["TIMELINE", "CRONOGRAMA"],
};

export function normalizeBlocks(
  blocks: Record<string, string>,
  requiredBlocks: string[],
  type: NormalizedBlockType,
) {
  const normalized: Record<string, string> = {};
  const source = normalizeInputBlocks(blocks);
  const required = resolveRequiredBlocksForSource(source, requiredBlocks, type);

  for (const key of required) {
    normalized[key] = getBlockValue(source, key) || getFallbackText(key, type);
  }

  return normalized;
}

function resolveRequiredBlocksForSource(
  source: Record<string, string>,
  requiredBlocks: string[],
  type: NormalizedBlockType,
) {
  if (type === "generated_menu") {
    const hasSpanishKeys =
      Boolean(source.CANTIDADES) || Boolean(source.ORDEN) || Boolean(source.COMPRA);
    const hasEnglishKeys =
      Boolean(source.QUANTITIES) || Boolean(source.ORDER) || Boolean(source.SHOPPING);
    return hasEnglishKeys && !hasSpanishKeys ? REQUIRED_MENU_BLOCKS_EN : requiredBlocks;
  }

  if (type === "parrillada_plan") {
    const hasSpanishKeys = Boolean(source.COMPRA);
    const hasEnglishKeys = Boolean(source.SHOPPING);
    return hasEnglishKeys && !hasSpanishKeys ? REQUIRED_PARRILLADA_BLOCKS_EN : requiredBlocks;
  }

  if (type !== "cooking_plan") return requiredBlocks;

  const hasSpanishKeys =
    Boolean(source.TIEMPOS) || Boolean(source.TEMPERATURA) || Boolean(source.PASOS);
  const hasEnglishKeys = Boolean(source.TIMES) || Boolean(source.TEMPERATURE) || Boolean(source.STEPS);

  if (hasEnglishKeys && !hasSpanishKeys) {
    return REQUIRED_COOKING_BLOCKS_EN;
  }

  return requiredBlocks;
}

function normalizeInputBlocks(blocks: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(blocks)
      .filter(([key, value]) => key.trim().toUpperCase() !== "ERR" && isValidBlockValue(value))
      .map(([key, value]) => [key.trim().toUpperCase(), value.trim()]),
  );
}

function getBlockValue(blocks: Record<string, string>, key: string) {
  const value = blocks[key];
  if (isValidBlockValue(value)) return value.trim();

  for (const alias of aliases[key] ?? []) {
    const aliasValue = blocks[alias];
    if (isValidBlockValue(aliasValue)) return aliasValue.trim();
  }

  return "";
}

function isValidBlockValue(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  return Boolean(trimmed) && trimmed.toUpperCase() !== "ERR";
}

function getFallbackText(key: string, type: NormalizedBlockType) {
  switch (key) {
    case "MENU":
      return "Menú no disponible. Revisa los datos de entrada.";
    case "CANTIDADES":
      return "Ajusta cantidades según número de personas y apetito del grupo.";
    case "QUANTITIES":
      return "Adjust quantities based on people count and appetite.";
    case "TIMING":
      return "Prepara ingredientes primero y cocina en orden de mayor a menor tiempo.";
    case "TIMELINE":
      return "Prepara ingredientes primero y cocina en orden de mayor a menor tiempo.";
    case "ORDEN":
      return "Organiza la cocción por tiempos: primero piezas gruesas, después piezas finas y guarniciones.";
    case "ORDER":
      return "Organize cooking by timing: thick cuts first, thinner cuts and sides later.";
    case "COMPRA":
      return "Lista de compra pendiente de completar.";
    case "SHOPPING":
      return "Shopping list pending completion.";
    case "SETUP":
      return "Prepara el equipo, limpia la superficie de cocción y organiza zona directa e indirecta.";
    case "TIEMPOS":
      return "Tiempos orientativos pendientes de ajustar según grosor y equipo.";
    case "TIMES":
      return "Estimated times pending adjustment for thickness and equipment.";
    case "TEMPERATURA":
      return "Usa temperatura interna segura según producto y punto deseado.";
    case "TEMPERATURE":
      return "Use safe internal temperatures based on product and doneness.";
    case "PASOS":
      return "1. Prepara el producto.\n2. Cocina con calor controlado.\n3. Reposa antes de servir.";
    case "STEPS":
      return "1. Prep the product.\n2. Cook with controlled heat.\n3. Rest before serving.";
    case "GRILL_MANAGER":
      return "Organiza la parrilla con una zona directa, una zona indirecta y un área de reposo.";
    case "ERROR":
      return "Evita cocinar con fuego excesivo y comprueba el punto antes de servir.";
    default:
      return type === "parrillada_plan"
        ? "Información de parrillada no disponible."
        : "Información no disponible.";
  }
}
