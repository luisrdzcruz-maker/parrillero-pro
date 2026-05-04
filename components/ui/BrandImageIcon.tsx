"use client";

import Image from "next/image";
import type { HTMLAttributes } from "react";

type BrandImageIconSize = "sm" | "md" | "lg" | "xl";
type BrandImageIconShape = "plain" | "tile" | "soft";

type BrandImageIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  src: string;
  alt: string;
  size?: BrandImageIconSize;
  shape?: BrandImageIconShape;
  priority?: boolean;
};

const sizeClasses: Record<BrandImageIconSize, string> = {
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

const pixelSizes: Record<BrandImageIconSize, number> = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
};

const shapeClasses: Record<BrandImageIconShape, string> = {
  plain: "bg-transparent",
  tile: "rounded-[1.2rem] border border-orange-300/18 bg-black/35 shadow-[0_10px_28px_rgba(249,115,22,0.16)] ring-1 ring-inset ring-white/[0.045]",
  soft: "rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_22px_rgba(0,0,0,0.22)]",
};

export function BrandImageIcon({
  src,
  alt,
  size = "md",
  shape = "plain",
  priority = false,
  className,
  ...props
}: BrandImageIconProps) {
  const pixels = pixelSizes[size];

  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        sizeClasses[size],
        shapeClasses[shape],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <Image
        src={src}
        alt={alt}
        width={pixels}
        height={pixels}
        sizes={`${pixels}px`}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export type { BrandImageIconShape, BrandImageIconSize };
