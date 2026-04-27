import { ImageResponse } from "next/og";
import { getPublicSavedMenuBySlug, type Json } from "@/lib/db/savedMenus";

type ImageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
      badge: "Parrillero Pro",
      title: "Plan de parrilla listo",
      subtitle: "Parrillero Pro",
    });
  }

  return renderImage({
    badge: getBadgeLabel(getMenuType(menu.data)),
    title: menu.name,
    subtitle: menu.people ? `${menu.people} personas` : "Plan de parrilla paso a paso",
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
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 20% 5%, rgba(251, 146, 60, 0.45), transparent 32%), radial-gradient(circle at 88% 18%, rgba(249, 115, 22, 0.28), transparent 26%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #020617 100%)",
          color: "white",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 58,
            height: 520,
            width: 1056,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 54,
            background:
              "linear-gradient(145deg, rgba(15,23,42,0.86), rgba(2,6,23,0.72)), radial-gradient(circle at 35% 0%, rgba(251,146,60,0.24), transparent 34%)",
            boxShadow: "0 42px 140px rgba(0,0,0,0.42)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -90,
            bottom: -120,
            height: 360,
            width: 360,
            borderRadius: 999,
            background: "rgba(249, 115, 22, 0.32)",
            filter: "blur(18px)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            width: "100%",
            padding: "82px 96px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  display: "flex",
                  height: 70,
                  width: 70,
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(251, 146, 60, 0.32)",
                  borderRadius: 24,
                  background: "rgba(249, 115, 22, 0.16)",
                  color: "#fed7aa",
                  fontSize: 38,
                  fontWeight: 900,
                }}
              >
                P
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>
                  Parrillero Pro
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 18, fontWeight: 700 }}>
                  Plan inteligente de parrilla
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                border: "1px solid rgba(251, 146, 60, 0.36)",
                borderRadius: 999,
                background: "rgba(249, 115, 22, 0.14)",
                color: "#fdba74",
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 3.6,
                padding: "13px 22px",
                textTransform: "uppercase",
              }}
            >
              {badge}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
            <div
              style={{
                color: "#fed7aa",
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: -0.8,
                marginBottom: 20,
              }}
            >
              {subtitle}
            </div>
            <div
              style={{
                display: "flex",
                color: "#ffffff",
                fontSize: 78,
                fontWeight: 900,
                letterSpacing: -4.8,
                lineHeight: 0.94,
                maxHeight: 220,
                overflow: "hidden",
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 26,
            }}
          >
            <div style={{ color: "#e2e8f0", fontSize: 27, fontWeight: 800 }}>
              Crea tu propio plan en segundos
            </div>
            <div
              style={{
                display: "flex",
                borderRadius: 999,
                background: "linear-gradient(90deg, #fb923c, #f97316)",
                color: "#111827",
                fontSize: 24,
                fontWeight: 900,
                padding: "16px 26px",
              }}
            >
              Abrir plan
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
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
