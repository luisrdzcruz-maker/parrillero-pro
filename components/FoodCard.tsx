"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  selectedLabel?: string;
  selected?: boolean;
  onClick?: () => void;
};

export default function FoodCard({
  title,
  subtitle,
  image,
  badge,
  selected,
  selectedLabel = "Seleccionado",
  onClick,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(image) && !imageFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? "group relative min-h-52 w-full touch-manipulation select-none overflow-hidden rounded-[2rem] border-2 border-orange-400/90 bg-zinc-950 text-left shadow-[0_24px_70px_rgba(255,106,0,0.36)] ring-2 ring-orange-400/35 transition-all duration-300 ease-out hover:scale-[1.025] hover:shadow-[0_30px_90px_rgba(255,106,0,0.46)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 active:scale-[0.98] sm:min-h-64 lg:min-h-[320px] xl:min-h-[360px]"
          : "group relative min-h-52 w-full touch-manipulation select-none overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 text-left shadow-[0_14px_45px_rgba(0,0,0,0.38)] transition-all duration-300 ease-out hover:scale-[1.025] hover:border-[#FF6A00]/70 hover:shadow-[0_26px_80px_rgba(255,106,0,0.34)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/60 active:scale-[0.98] sm:min-h-64 lg:min-h-[320px] xl:min-h-[360px]"
      }
    >
      {!showImage && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,106,0,0.35),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.16),transparent_28%),linear-gradient(145deg,#18181b_0%,#09090b_46%,#000000_100%)]" />
      )}

      {showImage && (
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
          onError={() => setImageFailed(true)}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/62 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,106,0,0.26),transparent_34%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/12 to-transparent opacity-70" />
      <div className="absolute -bottom-24 -right-20 h-48 w-48 rounded-full bg-[#FF6A00]/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
      <div
        className={
          selected
            ? "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-300 via-[#FF6A00] to-amber-300"
            : "absolute inset-x-0 bottom-0 h-px bg-white/10"
        }
      />

      {badge && (
        <span className="absolute right-2 top-2 z-10 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-orange-100 shadow-lg shadow-black/20 backdrop-blur-md sm:right-3 sm:top-3 sm:text-[11px]">
          {badge}
        </span>
      )}

      {selected && (
        <span
          className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6A00] text-xs font-black leading-none text-black shadow-lg shadow-orange-500/50 ring-2 ring-white/25"
          title={selectedLabel}
          aria-label={selectedLabel}
        >
          ✓
        </span>
      )}

      <div className={`absolute inset-x-0 bottom-0 p-5 lg:p-6 ${selected ? "pr-16" : "pr-5"}`}>
        <h3 className="line-clamp-2 text-2xl font-black leading-none tracking-[-0.04em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.72)] sm:text-3xl lg:text-[2rem]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 max-w-[18rem] text-sm font-semibold leading-5 text-zinc-200/90">
          {subtitle}
        </p>
      </div>
    </button>
  );
}