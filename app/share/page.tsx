"use client";

import { useSearchParams } from "next/navigation";

function decodeMenu(data: string | null) {
  if (!data) return null;

  try {
    const decoded = decodeURIComponent(data);
    return JSON.parse(decoded) as Record<string, string>;
  } catch {
    return null;
  }
}

function formatTitle(title: string) {
  const map: Record<string, string> = {
    SETUP: "🔥 Setup",
    TIEMPOS: "⏱️ Tiempos",
    TEMPERATURA: "🌡️ Temperatura",
    PASOS: "🧠 Pasos",
    ERROR: "⚠️ Error clave",
    MENU: "🍽️ Menú",
    CANTIDADES: "📊 Cantidades",
    TIMING: "⏰ Timing",
    ORDEN: "🔥 Orden de cocción",
    COMPRA: "🛒 Lista de compra",
  };

  return map[title] || title;
}

export default function SharePage() {
  const searchParams = useSearchParams();
  const blocks = decodeMenu(searchParams.get("data"));

  if (!blocks) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-3xl font-bold">Menú no disponible</h1>
        <p className="mt-4 text-slate-400">
          El enlace no contiene un menú válido.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-orange-400">IA Parrillero Pro</p>
        <h1 className="mt-2 text-4xl font-bold">Menú compartido 🔥</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Object.entries(blocks).map(([key, value]) => (
            <div
              key={key}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <h2 className="mb-3 text-lg font-bold">{formatTitle(key)}</h2>
              <p className="whitespace-pre-wrap text-slate-300">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}