export const REQUIRED_MENU_BLOCKS = ["MENU", "CANTIDADES", "TIMING", "ORDEN", "COMPRA", "ERROR"];

export const REQUIRED_COOKING_BLOCKS = ["SETUP", "TIEMPOS", "TEMPERATURA", "PASOS", "ERROR"];

export const REQUIRED_PARRILLADA_BLOCKS = ["TIMELINE", "GRILL_MANAGER", "COMPRA", "ERROR"];

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

  for (const key of requiredBlocks) {
    normalized[key] = getBlockValue(source, key) || getFallbackText(key, type);
  }

  return normalized;
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
    case "TIMING":
      return "Prepara ingredientes primero y cocina en orden de mayor a menor tiempo.";
    case "TIMELINE":
      return "Prepara ingredientes primero y cocina en orden de mayor a menor tiempo.";
    case "ORDEN":
      return "Organiza la cocción por tiempos: primero piezas gruesas, después piezas finas y guarniciones.";
    case "COMPRA":
      return "Lista de compra pendiente de completar.";
    case "SETUP":
      return "Prepara el equipo, limpia la superficie de cocción y organiza zona directa e indirecta.";
    case "TIEMPOS":
      return "Tiempos orientativos pendientes de ajustar según grosor y equipo.";
    case "TEMPERATURA":
      return "Usa temperatura interna segura según producto y punto deseado.";
    case "PASOS":
      return "1. Prepara el producto.\n2. Cocina con calor controlado.\n3. Reposa antes de servir.";
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
