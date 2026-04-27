export function parseBlocks(text: string) {
  const sections = [
    "MENU",
    "CANTIDADES",
    "TIMING",
    "TIMELINE",
    "GRILL_MANAGER",
    "ORDEN",
    "COMPRA",
    "SETUP",
    "TIEMPOS",
    "TEMPERATURA",
    "PASOS",
    "ERROR",
  ];

  const result: Record<string, string> = {};
  let current = "";
  let buffer: string[] = [];

  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim().toUpperCase();

    if (sections.includes(trimmed)) {
      if (current) {
        result[current] = buffer.join("\n").trim();
      }
      current = trimmed;
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  if (current) {
    result[current] = buffer.join("\n").trim();
  }

  return result;
}
