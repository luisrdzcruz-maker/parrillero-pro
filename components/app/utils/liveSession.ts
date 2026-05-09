import type { LiveStep } from "@/components/live/LiveCookingScreen";

export const MOCK_LIVE_STEPS: LiveStep[] = [
  {
    id: "preheat",
    label: "Calienta la parrilla.\nMáxima potencia.",
    duration: 300,
    zone: "Directo",
    tempTarget: 230,
    notes: "Tapa cerrada. Espera a que alcance temperatura.",
  },
  {
    id: "sear1",
    label: "Sella.\nLado 1.",
    duration: 240,
    zone: "Directo",
    tempTarget: 230,
    notes: "No la muevas. Déjala hasta que se despegue sola.",
  },
  {
    id: "sear2",
    label: "Sella.\nLado 2.",
    duration: 240,
    zone: "Directo",
    tempTarget: 230,
    notes: "Busca costra dorada y uniforme en toda la superficie.",
  },
  {
    id: "indirect",
    label: "Cocción indirecta.\nFuego bajo.",
    duration: 420,
    zone: "Indirecto",
    tempTarget: 150,
    notes: "Tapa cerrada. Deja que el calor circule sin llama directa.",
  },
  {
    id: "rest",
    label: "Reposa.\nNo cortes aún.",
    duration: 360,
    zone: "Reposo",
    tempTarget: null,
    notes: "Los jugos se redistribuyen. Vale la pena esperar.",
  },
  {
    id: "serve",
    label: "Listo.\nSirve ahora.",
    duration: 0,
    zone: "Servir",
    tempTarget: null,
    notes: null,
  },
];

const SAVED_COOKS_KEY = "parrillero_saved_cooks_v1";

export type SavedCookEntry = {
  id: string;
  savedAt: string;
  context: string;
  steps: LiveStep[];
};

export function persistSavedCook(steps: LiveStep[], context: string | undefined) {
  if (typeof window === "undefined") return;
  try {
    const existing: SavedCookEntry[] = JSON.parse(localStorage.getItem(SAVED_COOKS_KEY) ?? "[]");
    const entry: SavedCookEntry = {
      id: `cook_${Date.now()}`,
      savedAt: new Date().toISOString(),
      context: context ?? "",
      steps,
    };
    localStorage.setItem(SAVED_COOKS_KEY, JSON.stringify([entry, ...existing].slice(0, 20)));
  } catch {
    // Ignore localStorage failures.
  }
}
