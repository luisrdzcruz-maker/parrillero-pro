"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { detectSetupFromText, getSetupVisual } from "@/lib/setupVisualMap";

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

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compactText(value: string, maxLength = 72) {
  const clean = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" · ");

  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
}

function findBlock(blocks: ResultBlock[], titles: string[]) {
  return blocks.find((block) => {
    const title = normalizeTitle(block.title);
    return titles.some((candidate) => title.includes(candidate));
  });
}

function getBlockMetric(blocks: ResultBlock[], titles: string[], maxLength = 64) {
  const block = findBlock(blocks, titles);
  return block ? compactText(block.content, maxLength) : "";
}

function getShareHighlights(blocks: ResultBlock[]) {
  const priority = [
    "setup",
    "configuracion",
    "tiempos",
    "times",
    "temperatura",
    "temperature",
    "pasos",
    "steps",
    "consejo",
    "error",
  ];

  return blocks
    .filter((block) => {
      const title = normalizeTitle(block.title);
      return priority.some((candidate) => title.includes(candidate));
    })
    .slice(0, 3);
}

function hasSetupSignal(value: string) {
  return /(reverse sear|reverse-sear|sellado inverso|two zone|two-zone|dos zonas|directo|direct heat|indirecto|indirect|low and slow|ahumado|sarten|horno|oven|pan)/i.test(
    value,
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 shadow-lg shadow-black/15 ring-1 ring-inset ring-white/[0.03]">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-orange-300/90">{label}</p>
      <p className="mt-1.5 line-clamp-2 text-sm font-black leading-snug text-white">{value}</p>
    </div>
  );
}

function HighlightCard({ block }: { block: ResultBlock }) {
  const text = compactText(block.content, 150);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-lg shadow-black/15">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
        {block.title}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-200">{text}</p>
    </article>
  );
}

export default function ShareClient() {
  const searchParams = useSearchParams();

  const animal = getFirstParam(searchParams, ["animal", "animalId"]);
  const cut = getFirstParam(searchParams, ["cut", "cutId"]);
  const method = getFirstParam(searchParams, ["method", "setup"]);
  const people = getFirstParam(searchParams, ["people", "personas"]);
  const doneness = getFirstParam(searchParams, ["doneness", "point", "punto"]);
  const thickness = getFirstParam(searchParams, ["thickness", "grosor"]);
  const equipment = getFirstParam(searchParams, ["equipment", "grill", "parrilla"]);
  const blocks = useMemo(() => getResultBlocks(searchParams), [searchParams]);
  const hasAnyContent = Boolean(
    animal || cut || method || people || doneness || thickness || equipment || blocks.length,
  );
  const setupBlock = findBlock(blocks, ["setup", "configuracion"]);
  const setupText = [method, setupBlock?.content].filter(Boolean).join("\n");
  const shouldShowSetupVisual = hasSetupSignal(setupText);
  const setupVisual = shouldShowSetupVisual
    ? getSetupVisual(equipment || undefined, detectSetupFromText(setupText))
    : "";
  const heroTitle = [animal, cut].filter(Boolean).join(" · ") || "Plan de parrilla";
  const heroSubtitle = method || getBlockMetric(blocks, ["setup", "configuracion"], 82);
  const time = getFirstParam(searchParams, ["time", "cookTime", "totalTime"]) || getBlockMetric(blocks, ["tiempos", "times"]);
  const temperature =
    getFirstParam(searchParams, ["targetTemp", "temp", "temperature", "temperatura"]) ||
    getBlockMetric(blocks, ["temperatura", "temperature"]);
  const highlights = getShareHighlights(blocks);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareText = [
    "Parrillero Pro",
    heroTitle,
    heroSubtitle,
    time ? `Tiempo: ${time}` : "",
    temperature ? `Temperatura: ${temperature}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}${currentUrl ? `\n\n${currentUrl}` : ""}`)}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.22),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)] px-4 py-5 text-slate-100 sm:py-8">
      <div className="mx-auto max-w-[560px]">
        {!hasAnyContent ? (
          <section className="rounded-[2rem] border border-dashed border-white/15 bg-slate-950/85 p-7 text-center shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-orange-400/20 bg-orange-500/12 text-2xl shadow-lg shadow-orange-500/10">
              P
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white">Plan no disponible</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              El enlace puede estar incompleto. Puedes abrir Parrillero Pro y crear uno nuevo en segundos.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-[52px] items-center rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-6 text-sm font-black text-black shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
            >
              Open Parrillero Pro
            </Link>
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-[2.25rem] border border-orange-300/25 bg-[radial-gradient(circle_at_14%_0%,rgba(251,146,60,0.34),transparent_33%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98)_58%,rgba(67,20,7,0.78))] shadow-[0_34px_120px_rgba(249,115,22,0.16)] ring-1 ring-inset ring-white/[0.05]">
              <div className="relative p-5 sm:p-7">
                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-amber-300/10 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-500/15 text-xl font-black text-orange-100 shadow-lg shadow-orange-950/20">
                        P
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">Parrillero Pro</p>
                        <p className="text-[11px] font-semibold text-slate-400">
                          Premium cooking card
                        </p>
                      </div>
                    </div>
                    <p className="rounded-full border border-orange-300/25 bg-orange-500/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-orange-200">
                      Shared
                    </p>
                  </div>

                  <div className="mt-7">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-orange-300">
                      Resultado de cocción
                    </p>
                    <h1 className="mt-3 text-[clamp(2.4rem,12vw,4.4rem)] font-black leading-[0.92] tracking-[-0.07em] text-white">
                      {heroTitle}
                    </h1>
                    {heroSubtitle && (
                      <p className="mt-4 text-lg font-bold leading-7 text-orange-100">
                        {compactText(heroSubtitle, 96)}
                      </p>
                    )}
                  </div>

                  {setupVisual && (
                    <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-orange-200/20 bg-slate-950 shadow-2xl shadow-black/35 ring-1 ring-inset ring-white/[0.04]">
                      <div className="relative h-48 sm:h-56">
                        <Image
                          src={setupVisual}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 560px, 100vw"
                          className="h-full w-full object-cover"
                          priority
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(251,146,60,0.24),transparent_31%),linear-gradient(135deg,rgba(2,6,23,0.84)_0%,rgba(2,6,23,0.38)_42%,rgba(2,6,23,0.1)_100%)]" />
                        <p className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-100 backdrop-blur-md">
                          Setup visual
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <MetricPill label="Corte" value={compactText([animal, cut].filter(Boolean).join(" · ") || "Personalizado", 54)} />
                    <MetricPill label="Método" value={compactText(method || heroSubtitle || "Según plan", 54)} />
                    <MetricPill label="Tiempo" value={compactText(time || "Ver plan", 54)} />
                    <MetricPill label="Temp" value={compactText(temperature || "Según corte", 54)} />
                  </div>

                  {(people || doneness || thickness) && (
                    <p className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold leading-6 text-slate-200">
                      {[people ? `${people} personas` : "", doneness, thickness ? `${thickness} cm` : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/"
                className="min-h-[54px] rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 px-4 py-4 text-center text-sm font-black text-black shadow-xl shadow-orange-500/25 transition hover:brightness-110 active:scale-[0.98]"
              >
                Open Parrillero Pro
              </Link>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[54px] rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-4 text-center text-sm font-black text-emerald-200 shadow-xl shadow-emerald-950/20 transition hover:bg-emerald-500/15 active:scale-[0.98]"
              >
                Share via WhatsApp
              </a>
            </section>

            {highlights.length > 0 && (
              <section className="mt-5 grid gap-3">
                {highlights.map((block) => (
                  <HighlightCard key={`${block.title}-${block.content.slice(0, 12)}`} block={block} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
