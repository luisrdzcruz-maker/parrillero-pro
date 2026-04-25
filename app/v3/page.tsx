"use client";

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
  },
];

const donenessOptions: { id: Doneness; label: string; short: string }[] = [
  { id: "rare", label: "Poco hecho", short: "Rare" },
  { id: "medium_rare", label: "Punto menos", short: "M. rare" },
  { id: "medium", label: "Al punto", short: "Medium" },
  { id: "well_done", label: "Hecho", short: "Done" },
];

function V3UI() {
  const [cutId, setCutId] = useState("chuleton");
  const [doneness, setDoneness] = useState<Doneness>("medium_rare");
  const [showResult, setShowResult] = useState(false);

  const selectedCut = useMemo(
    () => cuts.find((cut) => cut.id === cutId) ?? cuts[0],
    [cutId]
  );

  const selectedDoneness = donenessOptions.find((item) => item.id === doneness);
  const temp = selectedCut.temp[doneness];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-orange-500/25 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-120px] h-[520px] w-[520px] rounded-full bg-red-700/20 blur-[130px]" />
      </div>

      <section className="relative mx-auto grid min-h-screen max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200">
            Parrillero-Pro V3
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Clava el punto perfecto en segundos.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Elige corte, punto y recibe un plan claro con temperatura, tiempo,
            reposo y errores que debes evitar.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <MiniProof value="10s" label="para decidir" />
            <MiniProof value="ºC" label="temperatura exacta" />
            <MiniProof value="Pro" label="tips accionables" />
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">
                1. Elige corte
              </h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                MVP Premium
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {cuts.map((cut) => (
                <button
                  key={cut.id}
                  onClick={() => {
                    setCutId(cut.id);
                    setShowResult(false);
                  }}
                  className={`rounded-[1.5rem] border p-4 text-left transition ${
                    cutId === cut.id
                      ? "border-orange-400 bg-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.18)]"
                      : "border-white/10 bg-black/20 hover:border-orange-400/60 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{cut.emoji}</div>
                    <div>
                      <div className="text-lg font-black">{cut.name}</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {cut.subtitle}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-zinc-400">
              2. Elige punto
            </h2>

            <div className="flex flex-wrap gap-2">
              {donenessOptions.map((option) => {
                const disabled = selectedCut.temp[option.id] === null;

                return (
                  <button
                    key={option.id}
                    disabled={disabled}
                    onClick={() => {
                      setDoneness(option.id);
                      setShowResult(false);
                    }}
                    className={`rounded-full border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-25 ${
                      doneness === option.id
                        ? "border-orange-400 bg-orange-500 text-black"
                        : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowResult(true)}
            className="mt-6 w-full rounded-[1.5rem] bg-gradient-to-r from-orange-400 to-red-500 px-6 py-5 text-lg font-black text-black shadow-[0_25px_90px_rgba(249,115,22,0.30)] transition hover:scale-[1.01]"
          >
            Generar mi plan perfecto
          </button>
        </div>

        <aside className="rounded-[2.5rem] border border-orange-400/20 bg-gradient-to-b from-white/[0.12] to-white/[0.04] p-5 shadow-[0_30px_120px_rgba(249,115,22,0.20)] backdrop-blur-xl">
          {!showResult ? (
            <div className="flex min-h-[560px] flex-col justify-between rounded-[2rem] border border-white/10 bg-black/35 p-6">
              <div>
                <div className="mb-5 text-7xl">{selectedCut.emoji}</div>

                <p className="mb-3 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-black text-orange-200 w-fit">
                  Preview del resultado
                </p>

                <h2 className="text-4xl font-black tracking-tight">
                  {selectedCut.name}
                </h2>

                <p className="mt-3 text-zinc-400">{selectedCut.subtitle}</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
                <div className="text-sm font-bold text-zinc-400">
                  Resultado que verás
                </div>
                <div className="mt-3 grid gap-3">
                  <GhostMetric label="Temperatura" />
                  <GhostMetric label="Tiempo" />
                  <GhostMetric label="Consejo Pro" />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="text-7xl">{selectedCut.emoji}</div>
                  <h2 className="mt-5 text-4xl font-black tracking-tight">
                    {selectedCut.name}
                  </h2>
                  <p className="mt-2 text-zinc-400">
                    {selectedDoneness?.label}
                  </p>
                </div>

                <a
                  href="/"
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10"
                >
                  V1
                </a>
              </div>

              <div className="grid gap-3">
                <Metric
                  label="Temperatura objetivo"
                  value={temp ? `${temp}ºC` : "Visual"}
                />

                <Metric label="Tiempo estimado" value={selectedCut.time} />

                <Metric label="Reposo" value={selectedCut.rest} />
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-orange-400/20 bg-orange-500/10 p-5">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-orange-200">
                  Consejo Pro
                </div>
                <p className="mt-3 text-lg leading-relaxed">
                  {selectedCut.tip}
                </p>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-5">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-red-200">
                  Error a evitar
                </div>
                <p className="mt-3 text-lg leading-relaxed">
                  {selectedCut.mistake}
                </p>
              </div>

              <button
                onClick={() => {
                  const text = `🔥 Parrillero-Pro\n${selectedCut.name} · ${selectedDoneness?.label}\nTemperatura: ${
                    temp ? `${temp}ºC` : "Visual"
                  }\nTiempo: ${selectedCut.time}\nReposo: ${
                    selectedCut.rest
                  }\nTip: ${selectedCut.tip}`;

                  navigator.clipboard.writeText(text);
                }}
                className="mt-5 w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-black hover:bg-white/15"
              >
                Copiar plan
              </button>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function MiniProof({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="text-2xl font-black text-orange-300">{value}</div>
      <div className="mt-1 text-sm text-zinc-400">{label}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-orange-300">{value}</div>
    </div>
  );
}

function GhostMetric({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 h-7 w-32 rounded-full bg-white/10" />
    </div>
  );
}

export default function Page() {
  return <V3UI />;
}