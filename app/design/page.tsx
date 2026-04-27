import Link from "next/link";
import { designVariants } from "./designVariants";

export const metadata = {
  title: "Internal Design Previews | Parrillero Pro",
};

export default function DesignGalleryPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-orange-500/20 bg-orange-500/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-orange-300">
            Internal Design Preview
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Parrillero Pro visual variants
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Founder-only preview routes for comparing visual directions. These are not exposed as production theme choices.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designVariants.map((variant) => (
            <Link
              key={variant.slug}
              href={`/design/${variant.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-orange-400/50 hover:shadow-[0_24px_70px_rgba(249,115,22,0.14)]"
            >
              <div className="relative h-44">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${variant.image})` }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      `radial-gradient(circle at 18% 0%, ${variant.colors.glow}, transparent 34%), linear-gradient(to top, ${variant.colors.bg}, rgba(2,6,23,0.2))`,
                  }}
                />
              </div>

              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: variant.colors.accent }}>
                  {variant.mood}
                </p>
                <h2 className="mt-2 text-xl font-black">{variant.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{variant.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
