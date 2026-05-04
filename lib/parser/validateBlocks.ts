export function validateMenuBlocks(blocks: Record<string, string>) {
  const requiredGroups = [
    ["MENU"],
    ["CANTIDADES", "QUANTITIES", "quantities"],
    ["TIMING", "TIMELINE"],
    ["ORDEN", "ORDER", "order"],
    ["COMPRA", "SHOPPING", "shopping"],
  ];

  for (const group of requiredGroups) {
    const hasGroup = group.some((key) => typeof blocks[key] === "string" && blocks[key].trim().length >= 5);
    if (!hasGroup) return false;
  }

  return true;
}
