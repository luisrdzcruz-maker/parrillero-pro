import Link from "next/link";
import type { Metadata } from "next";
import ResultCard from "@/components/ResultCard";
import { getPublicSavedMenuBySlug, type Json, type SavedMenu } from "@/lib/db/savedMenus";
import ShareActions from "./ShareActions";

type ShareSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Blocks = Record<string, string>;
type SavedMenuType = "cooking_plan" | "generated_menu" | "parrillada_plan";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ShareSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicSavedMenuBySlug(slug);

  if (!menu) {
    return {
      title: "Plan no disponible | Parrillero Pro",
      description: "Crea tu propio plan de parrilla en segundos.",
    };
  }

  const title = `${menu.name} | Parrillero Pro`;
  const description = getMetadataDescription(getMenuType(menu.data));
  const shareUrl = getAbsoluteUrl(`/share/${slug}`);
  const openGraphImageUrl = getAbsoluteUrl(`/share/${slug}/opengraph-image`);
  const twitterImageUrl = getAbsoluteUrl(`/share/${slug}/twitter-image`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: shareUrl,
      images: [
        {
          url: openGraphImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImageUrl],
    },
  };
}

export default async function ShareSlugPage({ params }: ShareSlugPageProps) {
  const { slug } = await params;
  const menu = await getPublicSavedMenuBySlug(slug);

  if (!menu) return <UnavailablePlan />;

  const meta = getMenuMeta(menu);
  const type = getMenuType(menu.data);
  const formattedPlan = buildText(meta.blocks);

  return (
    <main className="min-h-screen scroll-smooth overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.22),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)] px-4 py-5 text-slate-100 sm:py-8">
      <div className="mx-auto max-w-[640px]">
        <BrandHeader />
        <HeroSection menu={menu} meta={meta} type={type} />

        <section className="mt-5">
          <ShareActions text={formattedPlan} />
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Fecha" value={formatDate(menu.created_at)} />
          <SummaryItem label="Personas" value={menu.people ? menu.people.toString() : ""} />
          <SummaryItem label="Productos" value={meta.products || meta.cut} />
          <SummaryItem label="Idioma" value={menu.lang.toUpperCase()} />
        </section>

        <ResultContent blocks={meta.blocks} />
        <CtaSection />
        <Footer />
      </div>
    </main>
  );
}

function UnavailablePlan() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_32%),#020617] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-[640px]">
        <BrandHeader />
      </div>
      <section className="mx-auto mt-8 max-w-[640px] rounded-[2rem] border border-white/10 bg-slate-950/85 p-7 text-center shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <h1 className="mt-5 text-3xl font-black tracking-tight text-white">
          Este plan no está disponible
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Puede que el enlace sea privado, haya sido despublicado o ya no exista.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-[52px] items-center rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-6 text-sm font-black text-black shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
        >
          Crear tu propio plan
        </Link>
      </section>
    </main>
  );
}

function BrandHeader() {
  return (
    <header className="sticky top-3 z-10 mb-5 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-orange-950/30 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/12 text-xl shadow-lg shadow-orange-500/10">
            🔥
          </div>
          <div>
            <p className="text-sm font-black text-white">Parrillero Pro</p>
            <p className="text-[11px] font-semibold text-slate-400">Plan inteligente de parrilla</p>
          </div>
        </div>
        <Link
          href="/"
          className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-200 transition hover:bg-orange-500/15 active:scale-[0.98]"
        >
          Abrir app
        </Link>
      </div>
    </header>
  );
}

function HeroSection({
  menu,
  meta,
  type,
}: {
  menu: SavedMenu;
  meta: ReturnType<typeof getMenuMeta>;
  type: SavedMenuType;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-orange-400/20 bg-slate-950/80 shadow-[0_30px_100px_rgba(249,115,22,0.13)]">
      <div className="relative p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.30),transparent_36%),linear-gradient(to_top,rgba(2,6,23,0.98),rgba(15,23,42,0.74),rgba(255,255,255,0.07))]" />
        <div className="relative">
          <p className="inline-flex rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
            {getBadgeLabel(type)}
          </p>
          <h1 className="mt-5 text-[clamp(2.35rem,11vw,4.7rem)] font-black leading-[0.94] tracking-[-0.07em] text-white">
            Plan de parrilla listo 🔥
          </h1>
          <p className="mt-4 max-w-lg text-lg font-bold leading-7 text-orange-100">
            {getHeroSubtitle(type, menu.people)}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{menu.name}</p>
          {(meta.products || meta.cut) && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-slate-200">
              {meta.products || meta.cut}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultContent({ blocks }: { blocks: Blocks }) {
  const entries = Object.entries(blocks);

  return (
    <section className="mt-5 grid gap-4">
      {entries.length > 0 ? (
        entries.map(([title, content]) => <ResultBlockCard key={title} title={title} content={content} />)
      ) : (
        <ResultBlockCard
          title="Resumen"
          content="Este plan compartido contiene la configuración guardada. Crea tu propia versión para ajustar tiempos, setup y pasos."
        />
      )}
    </section>
  );
}

function CtaSection() {
  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-orange-400/20 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.25),transparent_38%),linear-gradient(145deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] p-6 text-center shadow-2xl shadow-orange-950/20 sm:p-8">
      <h2 className="text-3xl font-black tracking-tight text-white">
        🔥 Crea tu propio plan en segundos
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-300">
        Sin recetas, sin dudas. Solo cocina perfecto.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 px-6 text-base font-black text-black shadow-xl shadow-orange-500/30 transition hover:brightness-110 active:scale-[0.98] sm:w-auto"
      >
        Probar Parrillero Pro
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 text-center text-xs font-semibold text-slate-500">
      Parrillero Pro · Planes de parrilla listos para compartir
    </footer>
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
  return <ResultCard content={content} title={title} />;
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

function getMenuType(data: Json): SavedMenuType {
  if (!isRecord(data)) return "generated_menu";

  const value = data.type;
  if (value === "cooking_plan" || value === "parrillada_plan" || value === "generated_menu") {
    return value;
  }

  return "generated_menu";
}

function getBadgeLabel(type: SavedMenuType) {
  if (type === "cooking_plan") return "Cocción";
  if (type === "parrillada_plan") return "Parrillada";
  return "Menú BBQ";
}

function getMetadataDescription(type: SavedMenuType) {
  if (type === "cooking_plan") return "Plan de cocción paso a paso creado con Parrillero Pro.";
  if (type === "parrillada_plan") return "Parrillada organizada con tiempos, zonas y lista de compra.";
  return "Menú BBQ completo con cantidades, timing y compra.";
}

function getHeroSubtitle(type: SavedMenuType, people: number | null) {
  if (type === "cooking_plan") return "Cocina perfecta paso a paso";
  if (type === "parrillada_plan") return "Organiza tu parrillada sin errores";
  return `Plan completo para ${people ?? "tu grupo"} personas`;
}

function buildText(blocks: Blocks) {
  return Object.entries(blocks)
    .map(([key, value]) => `${key}\n${value}`)
    .join("\n\n");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

function getAbsoluteUrl(path: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://parrillero-pro.vercel.app").replace(
    /\/$/,
    "",
  );

  return `${siteUrl}${path}`;
}
