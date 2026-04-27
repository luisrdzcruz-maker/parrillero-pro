import { Suspense } from "react";
import ShareClient from "./ShareClient";

export const metadata = {
  title: "Plan de parrilla compartido | Parrillero Pro",
  description: "Abre este plan de cocción creado con Parrillero Pro.",
};

function ShareLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-md animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
        <div className="h-4 w-40 rounded-full bg-orange-400/20" />
        <div className="mt-5 h-10 w-64 rounded-2xl bg-white/10" />
        <div className="mt-3 h-4 w-full rounded-full bg-white/10" />
      </div>
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<ShareLoading />}>
      <ShareClient />
    </Suspense>
  );
}
