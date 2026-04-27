export function validateMenuBlocks(blocks: Record<string, string>) {
  const required = ["MENU", "CANTIDADES", "TIMING", "ORDEN", "COMPRA"];

  for (const key of required) {
    if (!blocks[key] || blocks[key].length < 5) {
      return false;
    }
  }

  return true;
}
