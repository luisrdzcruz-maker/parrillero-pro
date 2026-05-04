import { normalizeCookingOutput } from "../normalization/normalizeCookingOutput";

export function parseBlocks(text: string) {
  const sections = [
    "MENU",
    "CANTIDADES",
    "QUANTITIES",
    "TIMING",
    "TIMELINE",
    "GRILL_MANAGER",
    "ORDEN",
    "ORDER",
    "COMPRA",
    "SHOPPING",
    "SETUP",
    "TIEMPOS",
    "TIMES",
    "TEMPERATURA",
    "TEMPERATURE",
    "PASOS",
    "STEPS",
    "CONSEJOS",
    "TIPS",
    "ERROR",
    "KEY ERROR",
  ];

  const result: Record<string, string> = {};
  let current = "";
  let buffer: string[] = [];

  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim().replace(/:$/, "").toUpperCase();

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

  return normalizeCookingOutput(result);
}
