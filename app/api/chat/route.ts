import { NextResponse } from "next/server";

type JsonRecord = Record<string, unknown>;

type ChatRequestBody = {
  message?: unknown;
};

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

const OPENAI_MODEL = "gpt-4.1-mini";

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function asOpenAiResponseBody(value: unknown): OpenAiResponseBody {
  return isRecord(value) ? value : {};
}

function getRequestMessage(body: unknown) {
  const requestBody = (isRecord(body) ? body : {}) as ChatRequestBody;
  return typeof requestBody.message === "string" ? requestBody.message.trim() : "";
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

function looksLikeMenuRequest(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("menú") ||
    normalized.includes("menu") ||
    normalized.includes("cantidades") ||
    normalized.includes("compra") ||
    normalized.includes("shopping")
  );
}

function createFallbackReply(message: string) {
  if (looksLikeMenuRequest(message)) {
    return `MENU
Principal: 1 corte parrillero por persona o una bandeja mixta de carne, pollo y chorizo.
Acompañamientos: verduras a la parrilla, ensalada fresca, pan y una salsa simple.
Final: servir todo al centro para compartir, manteniendo carnes reposadas y jugosas.

CANTIDADES
Por persona: 350-450 g de proteína total, 180-220 g de verduras, 80-120 g de pan o papas y 40-60 g de salsa.
Para 4 personas: 1.6 kg de proteína, 800 g de verduras, 400 g de pan o papas y 200 g de salsa.
Para 8 personas: 3.2 kg de proteína, 1.6 kg de verduras, 800 g de pan o papas y 400 g de salsa.
Ajuste: sube 15% si el grupo come fuerte o si no habrá muchas guarniciones.

TIMING
T - 60 min: compra lista, carnes fuera de frío controlado, verduras lavadas y mesa preparada.
T - 45 min: enciende carbón o precalienta gas/kamado; busca zona fuerte y zona media.
T - 30 min: sazona carnes, corta verduras y prepara salsa.
T - 20 min: empieza cortes gruesos o piezas con hueso.
T - 10 min: agrega chorizos, pollo fino o verduras firmes.
T - 5 min: calienta pan, termina guarniciones y prepara fuente de reposo.
T: sirve primero lo que ya reposó y deja tandas pequeñas calientes.

ORDEN
1. Enciende y estabiliza la parrilla con una zona directa y otra indirecta.
2. Cocina primero lo más grueso: vacío, costilla, pollo con hueso o vegetales densos.
3. Sella cortes medianos a fuego fuerte y muévelos a zona media para terminar.
4. Cocina chorizos, brochetas y verduras mientras reposan los cortes principales.
5. Calienta pan y monta ensaladas al final para que no se marchiten.
6. Reposa carnes 5-10 minutos, corta contra la fibra y sirve por tandas.

COMPRA
Proteínas: carne principal, pollo o chorizo según preferencia, calculando 350-450 g por persona.
Verduras: pimientos, cebolla, calabacín, champiñones o mazorca.
Guarniciones: pan, papas, ensalada verde o arroz simple.
Salsas y básicos: chimichurri o salsa BBQ, sal gruesa, pimienta, aceite, limón y servilletas.
Equipo: carbón o gas suficiente, pinzas, tabla, cuchillo, bandeja de reposo y termómetro si hay.

ERROR
Respuesta fallback: la IA no está disponible ahora, pero este menú base mantiene cantidades, timing, orden y compra listos para usar.`;
  }

  return `SETUP
Precalienta la parrilla a fuego medio-alto, limpia la rejilla y prepara una zona directa y una zona indirecta.

TIEMPOS
Cocina primero con calor directo para sellar y termina en calor indirecto si la pieza es gruesa. Deja reposar antes de cortar.

TEMPERATURA
Usa temperatura interna segura según el producto y evita fuego excesivo que queme por fuera antes de cocinar el centro.

PASOS
1. Seca y sazona el producto.
2. Precalienta y engrasa ligeramente la rejilla.
3. Sella por ambos lados.
4. Termina con calor controlado hasta el punto deseado.
5. Reposa y sirve.

ERROR
Respuesta fallback: la IA no está disponible ahora, pero la generación puede continuar con una guía base.`;
}

async function safeReadJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    console.error("[api/chat] Invalid JSON request body", error);
    return {};
  }
}

async function safeReadOpenAiJson(response: Response): Promise<OpenAiResponseBody> {
  try {
    return asOpenAiResponseBody(await response.json());
  } catch (error) {
    console.error("[api/chat] Invalid OpenAI JSON response", error);
    return {};
  }
}

function jsonReply(reply: string, details?: JsonRecord, status = 200) {
  return NextResponse.json(
    {
      reply,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const body = await safeReadJson(request);
    const message = getRequestMessage(body);

    if (!message) {
      console.error("[api/chat] Missing required message field");
      return jsonReply(createFallbackReply(""), { reason: "missing_message" });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.error("[api/chat] Missing OPENAI_API_KEY; returning fallback reply");
      return jsonReply(createFallbackReply(message), { reason: "missing_openai_api_key" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
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

    const data = await safeReadOpenAiJson(response);

    if (!response.ok) {
      const errorMessage =
        typeof data.error?.message === "string" ? data.error.message : "OpenAI request failed";
      console.error("[api/chat] OpenAI request failed", {
        status: response.status,
        error: errorMessage,
      });
      return jsonReply(createFallbackReply(message), {
        reason: "openai_error",
        status: response.status,
        error: errorMessage,
      });
    }

    const reply = extractText(data);

    if (!reply) {
      console.error("[api/chat] OpenAI returned an empty reply");
      return jsonReply(createFallbackReply(message), { reason: "empty_openai_reply" });
    }

    return jsonReply(reply);
  } catch (error) {
    console.error("[api/chat] Unexpected route error", error);
    return NextResponse.json(
      {
        reply: createFallbackReply(""),
        details: {
          reason: "unexpected_error",
          error: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 200 },
    );
  }
}
