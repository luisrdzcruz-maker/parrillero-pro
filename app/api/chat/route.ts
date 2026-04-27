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
Plan parrillero simple con proteína principal, acompañamiento vegetal y pan o ensalada.

CANTIDADES
Calcula 350-450 g de proteína por persona y ajusta guarniciones según el grupo.

TIMING
Prepara mise en place primero, enciende el fuego con margen y cocina lo más grueso antes que lo fino.

ORDEN
1. Precalienta la parrilla.
2. Sazona y organiza los productos.
3. Cocina por tandas según grosor.
4. Reposa carnes antes de servir.

COMPRA
Proteína principal, verduras, sal, pimienta, aceite, pan o ensalada y bebidas.

ERROR
Respuesta fallback: la IA no está disponible ahora, pero puedes continuar con este plan base.`;
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
