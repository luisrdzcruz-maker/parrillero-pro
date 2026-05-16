import Image from "next/image";
import { ds } from "@/lib/design-system";
import type { LiveVisualGuide } from "./liveVisualGuide";

type Props = {
  guide: LiveVisualGuide;
};

export default function LiveVisualGuideCard({ guide }: Props) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/35">
      <div className="relative aspect-[16/9] min-h-32 overflow-hidden bg-zinc-950">
        <Image
          src={guide.imageSrc}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/5" />

        {guide.type === "serve_cut" && (
          /* allow-arbitrary: shadow-[0_0_18px_...] serve-cut indicator glow — no canonical ds.shadow.* tier */
          <div className="absolute inset-x-8 top-1/2 h-px -rotate-12 bg-emerald-300/80 shadow-[0_0_18px_rgba(110,231,183,0.55)]">
            <span className="absolute -right-1 -top-1.5 h-3 w-3 rotate-45 border-r-2 border-t-2 border-emerald-300" />
          </div>
        )}

        <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
          {guide.chips.map((chip) => (
            <span
              key={chip}
              className={`rounded-full border border-white/12 bg-black/55 px-2 py-1 ${ds.text.body9} font-black uppercase tracking-[0.14em] ${ds.color.mutedClass.body} backdrop-blur`}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="px-3.5 py-3">
        <p className={`${ds.text.body10} font-black uppercase tracking-[0.22em] ${ds.color.mutedClass.disabled}`}>
          Guía visual
        </p>
        <p className={`mt-1 ${ds.text.body14} font-black leading-tight ${ds.color.mutedClass.strong}`}>
          {guide.title}
        </p>
        <p className={`mt-1.5 ${ds.text.body12} font-semibold leading-relaxed ${ds.color.mutedClass.secondary}`}>
          {guide.action}
        </p>
        {guide.tip && (
          /* allow-arbitrary: bg-white/[0.035] — non-subpanel tip surface (text-[11.5px] float not lint-flagged), no canonical token */
          <p className={`mt-2 rounded-xl border border-white/[0.06] bg-white/[0.035] px-3 py-2 text-[11.5px] font-semibold leading-relaxed ${ds.color.mutedClass.helper}`}>
            {guide.tip}
          </p>
        )}
      </div>
    </div>
  );
}
