"use client";

import { useSearchParams } from "next/navigation";

export default function ShareClient() {
  const searchParams = useSearchParams();

  const animal = searchParams.get("animal");
  const cut = searchParams.get("cut");
  const method = searchParams.get("method");
  const doneness = searchParams.get("doneness");
  const thickness = searchParams.get("thickness");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="mb-4 text-3xl font-black">
          🔥 Parrillero Pro - Share
        </h1>

        <div className="space-y-3 text-slate-300">
          <p><strong className="text-orange-400">Animal:</strong> {animal || "—"}</p>
          <p><strong className="text-orange-400">Corte:</strong> {cut || "—"}</p>
          <p><strong className="text-orange-400">Método:</strong> {method || "—"}</p>
          <p><strong className="text-orange-400">Punto:</strong> {doneness || "—"}</p>
          <p><strong className="text-orange-400">Grosor:</strong> {thickness ? `${thickness} cm` : "—"}</p>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Esta página está preparada para compartir configuraciones de cocción.
        </p>
      </div>
    </main>
  );
}