"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type ResultBlock = {
  title: string;
  content: string;
};

const resultParamMap: Array<[param: string, title: string]> = [
  ["setup", "Setup"],
  ["times", "Tiempos"],
  ["tiempos", "Tiempos"],
  ["temperature", "Temperatura"],
  ["temperatura", "Temperatura"],
  ["steps", "Pasos"],
  ["pasos", "Pasos"],
  ["error", "Consejo clave"],
  ["menu", "Menú"],
  ["quantities", "Cantidades"],
  ["cantidades", "Cantidades"],
  ["order", "Orden"],
  ["orden", "Orden"],
  ["shopping", "Compra"],
  ["compra", "Compra"],
];

function cleanValue(value: string | null) {
  if (!value) return "";

  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function getFirstParam(searchParams: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = cleanValue(searchParams.get(key));
    if (value) return value;
  }

  return "";
}

function parseEncodedBlocks(value: string | null): ResultBlock[] {
  const clean = cleanValue(value);
  if (!clean) return [];

  try {
    const decoded = JSON.parse(clean) as unknown;
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return [];

    return Object.entries(decoded)
      .filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].trim().length > 0,
      )
      .map(([title, content]) => ({ title, content }));
  } catch {
    try {
      const decoded = JSON.parse(window.atob(clean)) as unknown;
      if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return [];

      return Object.entries(decoded)
        .filter(
          (entry): entry is [string, string] =>
            typeof entry[1] === "string" && entry[1].trim().length > 0,
        )
        .map(([title, content]) => ({ title, content }));
    } catch {
      return [];
    }
  }
}

function getResultBlocks(searchParams: URLSearchParams) {
  const encodedBlocks = parseEncodedBlocks(searchParams.get("blocks") || searchParams.get("data"));
  if (encodedBlocks.length > 0) return encodedBlocks;

  return resultParamMap
    .map(([param, title]) => ({ title, content: cleanValue(searchParams.get(param)) }))
    .filter((block) => block.content.length > 0);
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/10">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value || "No especificado"}</p>
    </div>
  );
}

function ResultBlockCard({ block }: { block: ResultBlock }) {
  const lines = block.content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20">
      <div className="border-b border-white/5 bg-white/[0.03] px-4 py-3">
        <h2 className="text-sm font-black tracking-wide text-white">{block.title}</h2>
      </div>
      <div className="space-y-2 p-4 text-sm leading-6 text-slate-300">
        {lines.length > 0 ? lines.map((line) => <p key={line}>{line}</p>) : <p>{block.content}</p>}
      </div>
    </article>
  );
}

export default function ShareClient() {
  const searchParams = useSearchParams();
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "shared" | "copied">("idle");

  const animal = getFirstParam(searchParams, ["animal", "animalId"]);
  const cut = getFirstParam(searchParams, ["cut", "cutId"]);
  const method = getFirstParam(searchParams, ["method", "setup"]);
  const people = getFirstParam(searchParams, ["people", "personas"]);
  const language = getFirstParam(searchParams, ["lang", "language"]);
  const doneness = getFirstParam(searchParams, ["doneness", "point", "punto"]);
  const thickness = getFirstParam(searchParams, ["thickness", "grosor"]);
  const blocks = useMemo(() => getResultBlocks(searchParams), [searchParams]);
  const hasAnyContent = Boolean(
    animal || cut || method || people || language || doneness || thickness || blocks.length,
  );

  const shareText = [
    "Parrillero Pro",
    "Plan de parrilla compartido",
    animal || cut ? `${animal || "Producto"}${cut ? ` · ${cut}` : ""}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  async function copyCurrentUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2200);
    } catch {
      // Clipboard failures should not block reading the shared plan.
    }
  }

  async function nativeShare() {
    setShareStatus("sharing");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Parrillero Pro",
          text: shareText,
          url: window.location.href,
        });
        setShareStatus("shared");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareStatus("copied");
      }

      window.setTimeout(() => setShareStatus("idle"), 2200);
    } catch {
      setShareStatus("idle");
    }
  }

  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${typeof window !== "undefined" ? window.location.href : ""}`)}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_32%),#020617] px-4 py-6 text-slate-100 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-[2rem] border border-orange-400/20 bg-slate-950/80 shadow-[0_30px_100px_rgba(249,115,22,0.12)]">
          <div className="relative min-h-72 p-5 sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.28),transparent_34%),linear-gradient(to_top,rgba(2,6,23,0.98),rgba(15,23,42,0.72),rgba(255,255,255,0.06))]" />
            <div className="relative">
              <p className="inline-flex rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
                Plan compartido
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Parrillero Pro
              </h1>
              <p className="mt-3 text-lg font-semibold text-orange-100">
                Plan de parrilla compartido
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Abre este plan, revisa el setup y crea tu propia versión para la próxima parrilla.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-center text-sm font-black text-black shadow-lg shadow-orange-500/20 transition active:scale-[0.98]"
                >
                  Crear mi propio plan
                </Link>
                <button
                  onClick={nativeShare}
                  disabled={shareStatus === "sharing"}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-60"
                >
                  {shareStatus === "sharing" ? "Compartiendo..." : "Compartir"}
                </button>
              </div>

              {shareStatus !== "idle" && shareStatus !== "sharing" && (
                <p className="mt-3 text-sm font-semibold text-emerald-300">
                  {shareStatus === "shared" ? "Compartido correctamente." : "Enlace copiado."}
                </p>
              )}
            </div>
          </div>
        </section>

        {!hasAnyContent ? (
          <section className="mt-5 rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
            <h2 className="text-xl font-black text-white">No encontramos datos del plan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              El enlace puede estar incompleto o haber sido modificado. Puedes crear un plan nuevo
              en segundos.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-black"
            >
              Crear mi propio plan
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-5 grid gap-3 sm:grid-cols-2">
              <SummaryItem
                label="Animal / corte"
                value={[animal, cut].filter(Boolean).join(" · ")}
              />
              <SummaryItem label="Personas" value={people} />
              <SummaryItem label="Método" value={method} />
              <SummaryItem label="Idioma" value={language} />
              <SummaryItem label="Punto" value={doneness} />
              <SummaryItem label="Grosor" value={thickness ? `${thickness} cm` : ""} />
            </section>

            <section className="mt-5 grid gap-4">
              {blocks.length > 0 ? (
                blocks.map((block) => (
                  <ResultBlockCard
                    key={`${block.title}-${block.content.slice(0, 12)}`}
                    block={block}
                  />
                ))
              ) : (
                <ResultBlockCard
                  block={{
                    title: "Resumen",
                    content:
                      "Este enlace contiene la configuración básica del plan. Crea tu propia versión para ver tiempos, setup y pasos completos.",
                  }}
                />
              )}
            </section>
          </>
        )}

        <section className="mt-5 grid gap-3 rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 sm:grid-cols-3">
          <button
            onClick={nativeShare}
            className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-black transition active:scale-[0.98]"
          >
            Compartir
          </button>
          <button
            onClick={copyCurrentUrl}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08] active:scale-[0.98]"
          >
            Copiar enlace
          </button>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/15 active:scale-[0.98]"
          >
            WhatsApp
          </a>
        </section>
      </div>
    </main>
  );
}
