"use client";

import Image from "next/image";
import type { HTMLAttributes } from "react";

const BRAND_LOGO_SRC = "/brand/parrillero-logo-original.png";

type BrandLogoVariant = "icon" | "wordmark" | "compact";
type BrandLogoSize = "sm" | "eyebrow" | "md" | "lg";

type BrandLogoProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  alt?: string;
};

const markSizes: Record<BrandLogoSize, string> = {
  sm: "h-5 w-5",
  eyebrow: "h-6 w-6",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

const textSizes: Record<BrandLogoSize, string> = {
  sm: "text-[11px]",
  eyebrow: "text-[11px]",
  md: "text-sm",
  lg: "text-base",
};

export function BrandLogo({
  variant = "compact",
  size = "md",
  alt = "Parrillero Pro",
  className,
  ...props
}: BrandLogoProps) {
  const mark = (
    <span className={`relative block shrink-0 overflow-hidden rounded-full ${markSizes[size]}`}>
      <Image
        src={BRAND_LOGO_SRC}
        alt={alt}
        fill
        sizes={size === "lg" ? "40px" : size === "md" ? "28px" : size === "eyebrow" ? "24px" : "20px"}
        className="object-contain"
      />
    </span>
  );

  if (variant === "icon") {
    return (
      <span className={className} {...props}>
        {mark}
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex items-center gap-2 font-black tracking-[-0.03em] text-white",
        textSizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {mark}
      <span className="leading-none">
        {variant === "wordmark" ? "Parrillero Pro" : "Parrillero"}
      </span>
    </span>
  );
}

export { BRAND_LOGO_SRC };
