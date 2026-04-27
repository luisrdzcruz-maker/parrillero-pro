export type DesignVariant = {
  slug: string;
  name: string;
  tagline: string;
  mood: string;
  colors: {
    bg: string;
    panel: string;
    panelStrong: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
    border: string;
    glow: string;
  };
  image: string;
};

export const designVariants: DesignVariant[] = [
  {
    slug: "fuego-clasico",
    name: "Fuego Clásico",
    tagline: "Brasa, tradición y calor visual.",
    mood: "Rústico premium",
    colors: {
      bg: "#170b05",
      panel: "rgba(55, 24, 10, 0.78)",
      panelStrong: "rgba(91, 37, 12, 0.88)",
      text: "#fff7ed",
      muted: "#fed7aa",
      accent: "#f97316",
      accentSoft: "rgba(249, 115, 22, 0.18)",
      border: "rgba(251, 146, 60, 0.28)",
      glow: "rgba(249, 115, 22, 0.38)",
    },
    image: "/animals/vacuno.jpg",
  },
  {
    slug: "carbon-moderno",
    name: "Carbón Moderno",
    tagline: "Oscuro, sobrio y afilado.",
    mood: "Modern grill",
    colors: {
      bg: "#050505",
      panel: "rgba(23, 23, 23, 0.84)",
      panelStrong: "rgba(38, 38, 38, 0.92)",
      text: "#fafafa",
      muted: "#a3a3a3",
      accent: "#f59e0b",
      accentSoft: "rgba(245, 158, 11, 0.16)",
      border: "rgba(245, 158, 11, 0.24)",
      glow: "rgba(245, 158, 11, 0.26)",
    },
    image: "/cuts/tomahawk.jpg",
  },
  {
    slug: "fuego-minimalista",
    name: "Fuego Minimalista",
    tagline: "Menos ruido, más dirección.",
    mood: "Clean premium",
    colors: {
      bg: "#0f1115",
      panel: "rgba(24, 27, 34, 0.8)",
      panelStrong: "rgba(33, 37, 46, 0.92)",
      text: "#f8fafc",
      muted: "#cbd5e1",
      accent: "#fb923c",
      accentSoft: "rgba(251, 146, 60, 0.14)",
      border: "rgba(255, 255, 255, 0.12)",
      glow: "rgba(251, 146, 60, 0.2)",
    },
    image: "/cuts/ribeye.jpg",
  },
  {
    slug: "ahumado-madera",
    name: "Ahumado Madera",
    tagline: "Textura cálida y humo lento.",
    mood: "Smokehouse",
    colors: {
      bg: "#1b1009",
      panel: "rgba(68, 42, 24, 0.78)",
      panelStrong: "rgba(92, 57, 32, 0.9)",
      text: "#fff8eb",
      muted: "#e8caa8",
      accent: "#d97706",
      accentSoft: "rgba(217, 119, 6, 0.18)",
      border: "rgba(180, 83, 9, 0.3)",
      glow: "rgba(180, 83, 9, 0.3)",
    },
    image: "/cuts/costillas.jpg",
  },
  {
    slug: "noche-parrilla",
    name: "Noche Parrilla",
    tagline: "Elegancia nocturna con fuego puntual.",
    mood: "Night premium",
    colors: {
      bg: "#020617",
      panel: "rgba(15, 23, 42, 0.82)",
      panelStrong: "rgba(30, 41, 59, 0.92)",
      text: "#f8fafc",
      muted: "#94a3b8",
      accent: "#f97316",
      accentSoft: "rgba(249, 115, 22, 0.16)",
      border: "rgba(148, 163, 184, 0.18)",
      glow: "rgba(249, 115, 22, 0.28)",
    },
    image: "/cuts/picanha.jpg",
  },
  {
    slug: "verde-parrillero",
    name: "Verde Parrillero",
    tagline: "Fresco, vegetal y de exterior.",
    mood: "Garden grill",
    colors: {
      bg: "#06150f",
      panel: "rgba(10, 40, 29, 0.78)",
      panelStrong: "rgba(16, 67, 48, 0.9)",
      text: "#f0fdf4",
      muted: "#bbf7d0",
      accent: "#22c55e",
      accentSoft: "rgba(34, 197, 94, 0.16)",
      border: "rgba(74, 222, 128, 0.26)",
      glow: "rgba(34, 197, 94, 0.26)",
    },
    image: "/cuts/pimientos.jpg",
  },
  {
    slug: "tecnologico-pro",
    name: "Tecnológico Pro",
    tagline: "Precisión, datos y control.",
    mood: "Smart cooking",
    colors: {
      bg: "#050816",
      panel: "rgba(15, 23, 42, 0.82)",
      panelStrong: "rgba(30, 41, 59, 0.94)",
      text: "#eff6ff",
      muted: "#bfdbfe",
      accent: "#38bdf8",
      accentSoft: "rgba(56, 189, 248, 0.16)",
      border: "rgba(125, 211, 252, 0.24)",
      glow: "rgba(56, 189, 248, 0.3)",
    },
    image: "/visuals/preheat.jpg",
  },
  {
    slug: "argentino-100",
    name: "Argentino 100",
    tagline: "Asado social, carne y ceremonia.",
    mood: "Asado clásico",
    colors: {
      bg: "#130b08",
      panel: "rgba(48, 28, 21, 0.8)",
      panelStrong: "rgba(79, 45, 32, 0.92)",
      text: "#fff7ed",
      muted: "#fdba74",
      accent: "#ef4444",
      accentSoft: "rgba(239, 68, 68, 0.16)",
      border: "rgba(248, 113, 113, 0.24)",
      glow: "rgba(239, 68, 68, 0.28)",
    },
    image: "/cuts/skirt-steak.jpg",
  },
  {
    slug: "familia-parrillera",
    name: "Familia Parrillera",
    tagline: "Cercano, claro y para todos.",
    mood: "Warm family",
    colors: {
      bg: "#20130a",
      panel: "rgba(82, 52, 28, 0.78)",
      panelStrong: "rgba(120, 75, 38, 0.9)",
      text: "#fffbeb",
      muted: "#fde68a",
      accent: "#facc15",
      accentSoft: "rgba(250, 204, 21, 0.16)",
      border: "rgba(253, 224, 71, 0.24)",
      glow: "rgba(250, 204, 21, 0.25)",
    },
    image: "/cuts/maiz.jpg",
  },
  {
    slug: "black-premium",
    name: "Black Premium",
    tagline: "Lujo oscuro, contraste alto.",
    mood: "Flagship",
    colors: {
      bg: "#000000",
      panel: "rgba(9, 9, 11, 0.88)",
      panelStrong: "rgba(24, 24, 27, 0.94)",
      text: "#fafafa",
      muted: "#d4d4d8",
      accent: "#f5f5f4",
      accentSoft: "rgba(245, 245, 244, 0.12)",
      border: "rgba(245, 245, 244, 0.16)",
      glow: "rgba(255, 255, 255, 0.18)",
    },
    image: "/cuts/tomahawk.jpg",
  },
];

export function getDesignVariant(slug: string) {
  return designVariants.find((variant) => variant.slug === slug);
}
