export function validateMenuBlocks(blocks: Record<string, string>) {
  const requiredGroups = [
    ["MENU"],
    ["CANTIDADES", "QUANTITIES"],
    ["TIMING", "TIMELINE"],
    ["ORDEN", "ORDER"],
    ["COMPRA", "SHOPPING"],
  ];

  for (const group of requiredGroups) {
    const hasGroup = group.some((key) => typeof blocks[key] === "string" && blocks[key].trim().length >= 5);
    if (!hasGroup) return false;
  }

  return true;
}
