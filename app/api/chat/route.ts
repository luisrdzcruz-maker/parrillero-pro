import { NextResponse } from "next/server";

type JsonRecord = Record<string, unknown>;

type OpenAiOutputContent = {
  type?: unknown;
  text?: unknown;
};

type OpenAiOutputItem = {
  content?: unknown;
};

type OpenAiResponseBody = {
  output_text?: unknown;
  output?: unknown;
  error?: {
    message?: unknown;
  };
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function asOpenAiResponseBody(value: unknown): OpenAiResponseBody {
  return isRecord(value) ? value : {};
}

function extractText(data: OpenAiResponseBody): string {
  if (typeof data.output_text === "string" && data.output_text.length > 0) {
    return data.output_text;
  }

  const parts: string[] = [];
  const output = Array.isArray(data.output) ? data.output : [];

  for (const item of output) {
    const outputItem = (isRecord(item) ? item : {}) as OpenAiOutputItem;
    const contents = Array.isArray(outputItem.content) ? outputItem.content : [];

    for (const contentItem of contents) {
      const content = (isRecord(contentItem) ? contentItem : {}) as OpenAiOutputContent;
      if (content.type === "output_text" && content.text) {
        parts.push(String(content.text));
      }
    }
  }

  return parts.join("\n").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bodyRecord = isRecord(body) ? body : {};
    const message = typeof bodyRecord.message === "string" ? bodyRecord.message : "";

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

    const data = asOpenAiResponseBody(await response.json());

    if (!response.ok) {
      const message = typeof data.error?.message === "string" ? data.error.message : "Error con IA";
      return NextResponse.json({ reply: message }, { status: 500 });
    }

    return NextResponse.json({
      reply: extractText(data) || "Sin respuesta",
    });
  } catch {
    return NextResponse.json({ reply: "Error conectando con IA" });
  }
}
