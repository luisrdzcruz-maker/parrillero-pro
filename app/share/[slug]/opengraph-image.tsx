import { ImageResponse } from "next/og";
import { getPublicSavedMenuBySlug, type Json } from "@/lib/db/savedMenus";

type ImageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Blocks = Record<string, string>;
type SavedMenuType = "cooking_plan" | "generated_menu" | "parrillada_plan";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "Parrillero Pro";

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const menu = await getShareMenu(slug);

  if (!menu) {
    return renderImage({
      badge: "Chef Card",
      cut: "Plan de parrilla",
      method: "Listo en minutos",
      time: "A tu ritmo",
      temperature: "Según corte",
      setupHint: "🔥 Directo",
    });
  }

  const card = getShareCard(menu.data);

  return renderImage({
    badge: getBadgeLabel(getMenuType(menu.data)),
    cut: card.cut || menu.name,
    method: card.method || "Reverse sear",
    time: card.time || (menu.people ? `${menu.people} personas` : "Paso a paso"),
    temperature: card.temperature || "Según corte",
    setupHint: card.setupHint,
  });
}

async function getShareMenu(slug: string) {
  try {
    return await getPublicSavedMenuBySlug(slug);
  } catch (error) {
    console.error("[share-og-image] Failed to load public saved menu", error);
    return null;
  }
}

function renderImage({
  badge,
  cut,
  method,
  time,
  temperature,
  setupHint,
}: {
  badge: string;
  cut: string;
  method: string;
  time: string;
  temperature: string;
  setupHint: string;
}) {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 22% 0%, rgba(251, 146, 60, 0.42), transparent 30%), radial-gradient(circle at 88% 18%, rgba(245, 158, 11, 0.22), transparent 24%), radial-gradient(circle at 56% 112%, rgba(127, 29, 29, 0.46), transparent 38%), linear-gradient(135deg, #020617 0%, #0b1120 44%, #190b07 100%)",
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -80,
          top: 120,
          height: 420,
          width: 420,
          borderRadius: 999,
          background: "rgba(251, 146, 60, 0.13)",
          filter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 66,
          top: 54,
          height: 522,
          width: 1068,
          border: "1px solid rgba(251, 191, 36, 0.18)",
          borderRadius: 56,
          background:
            "linear-gradient(150deg, rgba(15,23,42,0.92), rgba(2,6,23,0.86) 54%, rgba(67,20,7,0.80)), radial-gradient(circle at 28% 0%, rgba(251,146,60,0.28), transparent 33%)",
          boxShadow: "0 44px 150px rgba(0,0,0,0.52)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 104,
          top: 164,
          display: "flex",
          height: 250,
          width: 250,
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(251, 146, 60, 0.22)",
          borderRadius: 999,
          background:
            "radial-gradient(circle at 50% 42%, rgba(251, 146, 60, 0.28), rgba(127, 29, 29, 0.08) 58%, transparent 72%)",
          color: "rgba(254, 215, 170, 0.88)",
          fontSize: 112,
          fontWeight: 900,
          transform: "rotate(-8deg)",
        }}
      >
        🔥
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          width: "100%",
          padding: "74px 94px 66px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                display: "flex",
                height: 68,
                width: 68,
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(251, 191, 36, 0.34)",
                borderRadius: 22,
                background:
                  "linear-gradient(145deg, rgba(249, 115, 22, 0.30), rgba(127, 29, 29, 0.24))",
                color: "#fed7aa",
                fontSize: 36,
                fontWeight: 900,
                boxShadow: "0 18px 50px rgba(249, 115, 22, 0.18)",
              }}
            >
              🔥
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  color: "#ffffff",
                  fontSize: 33,
                  fontWeight: 900,
                  letterSpacing: -1,
                }}
              >
                Parrillero Pro 🔥
              </div>
              <div
                style={{
                  color: "#fcd9b6",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 2.4,
                  textTransform: "uppercase",
                }}
              >
                Chef-level cooking card
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              border: "1px solid rgba(251, 191, 36, 0.35)",
              borderRadius: 999,
              background: "rgba(249, 115, 22, 0.13)",
              color: "#fed7aa",
              fontSize: 19,
              fontWeight: 900,
              letterSpacing: 3.4,
              padding: "13px 22px",
              textTransform: "uppercase",
            }}
          >
            {badge}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 780 }}>
          <div
            style={{
              display: "flex",
              color: "#fb923c",
              fontSize: 39,
              fontWeight: 900,
              letterSpacing: -1.4,
              lineHeight: 1,
              marginBottom: 22,
            }}
          >
            {method}
          </div>
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: -6,
              lineHeight: 0.88,
              maxHeight: 186,
              overflow: "hidden",
              textShadow: "0 22px 80px rgba(0,0,0,0.42)",
            }}
          >
            {cut}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <Stat label="Tiempo" value={time} />
            <Stat label="Temperatura" value={temperature} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                border: "1px solid rgba(255,255,255,0.11)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.055)",
                color: "#ffedd5",
                fontSize: 24,
                fontWeight: 900,
                padding: "16px 24px",
              }}
            >
              {setupHint}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid rgba(251, 191, 36, 0.28)",
                borderRadius: 999,
                background: "linear-gradient(90deg, #fbbf24, #fb923c, #f97316)",
                color: "#111827",
                fontSize: 25,
                fontWeight: 900,
                padding: "17px 28px",
                boxShadow: "0 18px 54px rgba(249, 115, 22, 0.26)",
              }}
            >
              Listo para parrilla
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 218,
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 28,
        background: "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
        padding: "18px 22px",
        boxShadow: "0 18px 52px rgba(0,0,0,0.20)",
      }}
    >
      <div
        style={{
          color: "#fdba74",
          fontSize: 16,
          fontWeight: 900,
          letterSpacing: 3,
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#ffffff",
          fontSize: 29,
          fontWeight: 900,
          letterSpacing: -1.1,
          lineHeight: 1.05,
          maxHeight: 62,
          overflow: "hidden",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function getShareCard(data: Json) {
  const blocks = getBlocks(data);
  const cut = compactText(
    getInputValue(data, ["cut", "cutId", "selectedCut", "product", "mainProduct"]) ||
      getInputValue(data, ["products", "meats", "menuMeats", "parrilladaProducts"]) ||
      getBlockMetric(blocks, ["corte", "cut", "producto", "products"], 74),
    42,
  );
  const method = compactText(
    getInputValue(data, ["method", "setup", "technique", "cookingMethod"]) ||
      getBlockMetric(blocks, ["setup", "configuracion", "configuración"], 64),
    34,
  );
  const time = compactText(
    getInputValue(data, ["time", "cookTime", "totalTime", "duration"]) ||
      getBlockMetric(blocks, ["tiempos", "times", "tiempo"], 54),
    30,
  );
  const temperature = compactText(
    getInputValue(data, ["targetTemp", "temp", "temperature", "temperatura"]) ||
      getBlockMetric(blocks, ["temperatura", "temperature"], 54),
    30,
  );
  const setupHint = getSetupHint(
    [method, getBlockMetric(blocks, ["setup", "configuracion", "configuración"], 120)].join(" "),
  );

  return {
    cut,
    method: method || getTypeMethod(getMenuType(data)),
    time,
    temperature,
    setupHint,
  };
}

function getBlocks(data: Json): Blocks {
  if (!isRecord(data)) return {};

  const blocks = data.blocks;
  if (isRecord(blocks)) {
    return toStringRecord(blocks);
  }

  return toStringRecord(data);
}

function getInputValue(data: Json, keys: string[]) {
  if (!isRecord(data)) return "";

  const inputs = isRecord(data.inputs) ? data.inputs : data;

  for (const key of keys) {
    const value = inputs[key] ?? data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return value.toString();
  }

  return "";
}

function getBlockMetric(blocks: Blocks, titles: string[], maxLength = 64) {
  const entry = Object.entries(blocks).find(([title]) => {
    const normalizedTitle = normalizeText(title);
    return titles.some((candidate) => normalizedTitle.includes(normalizeText(candidate)));
  });

  return entry ? compactText(entry[1], maxLength) : "";
}

function compactText(value: string, maxLength = 72) {
  const clean = value
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .join(" · ");

  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
}

function getSetupHint(value: string) {
  const normalized = normalizeText(value);

  if (
    /(indirect|indirecto|reverse sear|sellado inverso|two zone|dos zonas|low and slow|ahumado)/.test(
      normalized,
    )
  ) {
    return "❄️ Indirecto";
  }

  return "🔥 Directo";
}

function getTypeMethod(type: SavedMenuType) {
  if (type === "cooking_plan") return "Cocción guiada";
  if (type === "parrillada_plan") return "Timing de parrilla";
  return "Menú BBQ";
}

function toStringRecord(value: Record<string, Json | undefined>): Blocks {
  return Object.entries(value).reduce<Blocks>((acc, [key, item]) => {
    if (typeof item === "string" && item.trim()) {
      acc[key] = item;
    }

    return acc;
  }, {});
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getMenuType(data: Json): SavedMenuType {
  if (!isRecord(data)) return "generated_menu";

  const value = data.type;
  if (value === "cooking_plan" || value === "parrillada_plan" || value === "generated_menu") {
    return value;
  }

  return "generated_menu";
}

function getBadgeLabel(type: SavedMenuType) {
  if (type === "cooking_plan") return "Cocción";
  if (type === "parrillada_plan") return "Parrillada";
  return "Menú BBQ";
}

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
