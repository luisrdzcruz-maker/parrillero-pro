import { NextResponse } from "next/server";

function extractText(data: any): string {
  if (typeof data.output_text === "string" && data.output_text.length > 0) {
    return data.output_text;
  }

  const parts: string[] = [];

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message ?? "";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: `
Eres IA Parrillero Pro.

Si el caso es "crear menú BBQ", DEBES responder SIEMPRE con TODOS estos bloques, aunque alguno sea simple:

MENU
(lista de platos)

CANTIDADES
(cantidades por persona y total)

TIMING
(timeline simple de preparación)

ORDEN
(orden de cocción paso a paso)

COMPRA
(lista de compra clara)

ERROR
(error más importante)

Reglas:
- NO omitas ningún bloque
- SIEMPRE escribe todos
- Respuestas cortas
- Nada de texto fuera de los bloques

Si es cocción normal usa:

SETUP
TIEMPOS
TEMPERATURA
PASOS
ERROR
`,
        input: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { reply: data.error?.message ?? "Error con IA" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reply: extractText(data) || "Sin respuesta",
    });
  } catch {
    return NextResponse.json({ reply: "Error conectando con IA" });
  }
}