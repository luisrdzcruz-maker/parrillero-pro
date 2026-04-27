"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Doneness = "rare" | "medium_rare" | "medium" | "well_done";

type Cut = {
  id: string;
  emoji: string;
  name: string;
  subtitle: string;
  temp: Record<Doneness, number | null>;
  time: string;
  rest: string;
  tip: string;
  mistake: string;
  shareHook: string;
};

const cuts: Cut[] = [
  {
    id: "chuleton",
    emoji: "🥩",
    name: "Chuletón",
    subtitle: "Corte premium grueso",
    temp: { rare: 50, medium_rare: 54, medium: 58, well_done: 70 },
    time: "4-5 min/lado + indirecto",
    rest: "8-10 min",
    tip: "Sella fuerte, termina en indirecto y corta después del reposo.",
    mistake: "No lo cortes nada más sacarlo.",
    shareHook: "Chuletón clavado al punto perfecto",
  },
  {
    id: "entrecot",
    emoji: "🔥",
    name: "Entrecot / Ribeye",
    subtitle: "Rápido, jugoso y marmoleado",
    temp: { rare: 50, medium_rare: 54, medium: 58, well_done: 70 },
    time: "3-4 min/lado",
    rest: "5-7 min",
    tip: "Una vuelta buena vale más que moverlo diez veces.",
    mistake: "No aplastes la carne con la espátula.",
    shareHook: "Ribeye jugoso sin complicarse",
  },
  {
    id: "secreto",
    emoji: "🐖",
    name: "Secreto ibérico",
    subtitle: "Graso, rápido y muy sabroso",
    temp: { rare: null, medium_rare: null, medium: 63, well_done: 70 },
    time: "3-5 min/lado",
    rest: "4-5 min",
    tip: "Fuego medio-alto, buscando dorado sin quemar la grasa.",
    mistake: "No lo cocines como si fuera carne magra.",
    shareHook: "Secreto ibérico dorado y jugoso",
  },
  {
    id: "salmon",
    emoji: "🐟",
    name: "Salmón",
    subtitle: "Ideal con piel y fuego controlado",
    temp: { rare: null, medium_rare: 50, medium: 54, well_done: 63 },
    time: "3 min/lado",
    rest: "2-3 min",
    tip: "Empieza por la piel y evita pasarlo de cocción.",
    mistake: "No lo muevas antes de que la piel esté marcada.",
    shareHook: "Salmón perfecto sin pasarlo",
  },
];

const donenessOptions: { id: Doneness; label: string; short: string }[] = [
  { id: "rare", label: "Poco hecho", short: "Rare" },
  { id: "medium_rare", label: "Punto menos", short: "M. rare" },
  { id: "medium", label: "Al punto", short: "Medium" },
  { id: "well_done", label: "Hecho", short: "Done" },
];

function V4UI() {
  const [cutId, setCutId] = useState("chuleton");
  const [doneness, setDoneness] = useState<Doneness>("medium_rare");
  const [copied, setCopied] = useState(false);

  const selectedCut = useMemo(() => cuts.find((cut) => cut.id === cutId) ?? cuts[0], [cutId]);

  const selectedDoneness = donenessOptions.find((item) => item.id === doneness);
  const temp = selectedCut.temp[doneness];

  const shareText = `🔥 Parrillero-Pro

${selectedCut.shareHook}
${selectedCut.name} · ${selectedDoneness?.label}

🌡️ Temperatura: ${temp ? `${temp}ºC` : "Visual"}
⏱️ Tiempo: ${selectedCut.time}
⏸️ Reposo: ${selectedCut.rest}

✅ Tip: ${selectedCut.tip}
⚠️ Evita: ${selectedCut.mistake}`;

  async function copyShareCard() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030303] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-orange-500/25 blur-[130px]" />
        <div className="absolute right-[-160px] top-[160px] h-[440px] w-[440px] rounded-full bg-red-600/20 blur-[120px]" />
        <div className="absolute bottom-[-200px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-5 py-7">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-zinc-300 backdrop-blur hover:bg-white/10"
          >
            ← V1
          </Link>

          <div className="rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200">
            Parrillero-Pro V4 · Share Engine
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[430px_1fr_430px]">
          <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-5">
              <p className="text-sm font-black text-orange-300">Paso 1</p>
              <h1 className="mt-1 text-4xl font-black leading-none tracking-tight">
                Elige tu corte.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                V4 está pensada para convertir: elegir rápido, obtener resultado claro y compartir
                una tarjeta visual.
              </p>
            </div>

            <div className="grid gap-3">
              {cuts.map((cut) => (
                <button
                  key={cut.id}
                  onClick={() => setCutId(cut.id)}
                  className={`rounded-[1.5rem] border p-4 text-left transition ${
                    cutId === cut.id
                      ? "border-orange-400 bg-orange-500/20 shadow-[0_0_45px_rgba(249,115,22,0.20)]"
                      : "border-white/10 bg-black/20 hover:border-orange-400/60 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{cut.emoji}</div>
                    <div>
                      <div className="text-lg font-black">{cut.name}</div>
                      <div className="mt-1 text-sm text-zinc-400">{cut.subtitle}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-black text-orange-300">Paso 2</p>
              <div className="flex flex-wrap gap-2">
                {donenessOptions.map((option) => {
                  const disabled = selectedCut.temp[option.id] === null;

                  return (
                    <button
                      key={option.id}
                      disabled={disabled}
                      onClick={() => setDoneness(option.id)}
                      className={`rounded-full border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-25 ${
                        doneness === option.id
                          ? "border-orange-400 bg-orange-500 text-black"
                          : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {option.short}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center">
            <div className="mb-6">
              <p className="mb-4 inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200">
                Resultado viral
              </p>

              <h2 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                Una tarjeta que dan ganas de compartir.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
                El resultado no debe parecer texto generado. Debe parecer una tarjeta premium:
                clara, útil y enseñable.
              </p>
            </div>

            <div className="rounded-[3rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/20 via-white/[0.08] to-red-600/20 p-4 shadow-[0_35px_140px_rgba(249,115,22,0.25)]">
              <div className="rounded-[2.5rem] border border-white/10 bg-[#090909]/90 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-8xl">{selectedCut.emoji}</div>
                    <h3 className="mt-5 text-5xl font-black tracking-tight">{selectedCut.name}</h3>
                    <p className="mt-2 text-zinc-400">{selectedDoneness?.label}</p>
                  </div>

                  <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-right">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">
                      Plan
                    </div>
                    <div className="mt-1 text-2xl font-black text-orange-300">Pro</div>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <CardMetric label="Temp" value={temp ? `${temp}ºC` : "Visual"} />
                  <CardMetric label="Tiempo" value={selectedCut.time} />
                  <CardMetric label="Reposo" value={selectedCut.rest} />
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-orange-400/20 bg-orange-500/10 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">
                    Consejo Pro
                  </div>
                  <p className="mt-3 text-lg leading-relaxed">{selectedCut.tip}</p>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-red-200">
                    No hagas esto
                  </div>
                  <p className="mt-3 text-lg leading-relaxed">{selectedCut.mistake}</p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <div>
                    <div className="text-sm font-black">Parrillero-Pro</div>
                    <div className="text-xs text-zinc-500">AI Cooking Card</div>
                  </div>

                  <div className="rounded-full bg-white px-4 py-2 text-xs font-black text-black">
                    parrillero.pro
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
            <p className="text-sm font-black text-orange-300">Paso 3</p>
            <h2 className="mt-1 text-4xl font-black leading-none tracking-tight">
              Copia y comparte.
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Esta versión prioriza viralidad: resultado claro, formato compartible y copy listo
              para WhatsApp o redes.
            </p>

            <button
              onClick={copyShareCard}
              className="mt-6 w-full rounded-[1.5rem] bg-gradient-to-r from-orange-400 to-red-500 px-5 py-5 text-lg font-black text-black shadow-[0_25px_90px_rgba(249,115,22,0.28)] transition hover:scale-[1.01]"
            >
              {copied ? "Copiado ✅" : "Copiar tarjeta"}
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              className="mt-3 block w-full rounded-[1.5rem] border border-green-400/30 bg-green-500/10 px-5 py-5 text-center text-lg font-black text-green-300 hover:bg-green-500/15"
            >
              Compartir por WhatsApp
            </a>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                Texto generado
              </div>
              <pre className="mt-4 max-h-[360px] whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {shareText}
              </pre>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function CardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-orange-300">{value}</div>
    </div>
  );
}

export default function Page() {
  return <V4UI />;
}
