type SearchParams = Promise<{
  animal?: string;
  cut?: string;
  method?: string;
  doneness?: string;
  thickness?: string;
}>;

export default async function SharePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="mb-4 text-3xl font-black">
          🔥 Parrillero Pro - Share
        </h1>

        <div className="space-y-3 text-slate-300">
          <p><strong className="text-orange-400">Animal:</strong> {params.animal || "—"}</p>
          <p><strong className="text-orange-400">Corte:</strong> {params.cut || "—"}</p>
          <p><strong className="text-orange-400">Método:</strong> {params.method || "—"}</p>
          <p><strong className="text-orange-400">Punto:</strong> {params.doneness || "—"}</p>
          <p><strong className="text-orange-400">Grosor:</strong> {params.thickness ? `${params.thickness} cm` : "—"}</p>
        </div>
      </div>
    </main>
  );
}