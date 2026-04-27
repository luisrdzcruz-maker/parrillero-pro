import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicSavedMenuBySlug, type Json, type SavedMenu } from "@/lib/db/savedMenus";

type ShareSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Blocks = Record<string, string>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ShareSlugPageProps) {
  const { slug } = await params;
  const menu = await getPublicSavedMenuBySlug(slug);

  return {
    title: menu ? `${menu.name} | Parrillero Pro` : "Plan compartido | Parrillero Pro",
    description: "Abre este plan de parrilla compartido con Parrillero Pro.",
  };
}

export default async function ShareSlugPage({ params }: ShareSlugPageProps) {
  const { slug } = await params;
  const menu = await getPublicSavedMenuBySlug(slug);

  if (!menu) notFound();

  const meta = getMenuMeta(menu);

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
                {menu.name}
              </h1>
              <p className="mt-3 text-lg font-semibold text-orange-100">
                Parrillero Pro
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Revisa este plan guardado y crea tu propia versión para la próxima parrilla.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-center text-sm font-black text-black shadow-lg shadow-orange-500/20 transition active:scale-[0.98]"
                >
                  Crear mi propio plan
                </Link>
                <Link
                  href="/saved"
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/15 active:scale-[0.98]"
                >
                  Ver biblioteca
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Animal / corte" value={meta.cut} />
          <SummaryItem label="Personas" value={menu.people ? menu.people.toString() : ""} />
          <SummaryItem label="Productos" value={meta.products} />
          <SummaryItem label="Idioma" value={menu.lang.toUpperCase()} />
        </section>

        <section className="mt-5 grid gap-4">
          {Object.entries(meta.blocks).length > 0 ? (
            Object.entries(meta.blocks).map(([title, content]) => (
              <ResultBlockCard key={title} title={title} content={content} />
            ))
          ) : (
            <ResultBlockCard
              title="Resumen"
              content="Este plan compartido contiene la configuración guardada. Crea tu propia versión para ajustar tiempos, setup y pasos."
            />
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/10">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value || "No especificado"}</p>
    </div>
  );
}

function ResultBlockCard({ title, content }: { title: string; content: string }) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20">
      <div className="border-b border-white/5 bg-white/[0.03] px-4 py-3">
        <h2 className="text-sm font-black tracking-wide text-white">{title}</h2>
      </div>
      <div className="space-y-2 p-4 text-sm leading-6 text-slate-300">
        {lines.length > 0 ? lines.map((line) => <p key={line}>{line}</p>) : <p>{content}</p>}
      </div>
    </article>
  );
}

function getMenuMeta(menu: SavedMenu) {
  const blocks = getBlocks(menu.data);
  const cut = getInputValue(menu.data, ["cut", "cutId", "selectedCut"]);
  const products = getInputValue(menu.data, [
    "products",
    "meats",
    "menuMeats",
    "parrilladaProducts",
  ]);

  return {
    blocks,
    cut,
    products,
  };
}

function getBlocks(data: Json): Blocks {
  if (!isRecord(data)) return {};

  const blocks = data.blocks;
  if (isRecord(blocks)) {
    return toStringRecord(blocks);
  }

  return toStringRecord(data);
}

function getInputValue(data: Json, keys: string[]) {
  if (!isRecord(data)) return "";

  const inputs = isRecord(data.inputs) ? data.inputs : data;

  for (const key of keys) {
    const value = inputs[key] ?? data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return value.toString();
  }

  return "";
}

function toStringRecord(value: Record<string, Json | undefined>): Blocks {
  return Object.entries(value).reduce<Blocks>((acc, [key, item]) => {
    if (typeof item === "string" && item.trim()) {
      acc[key] = item;
    }
    return acc;
  }, {});
}

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
