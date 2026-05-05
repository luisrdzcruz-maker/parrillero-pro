"use client";

import Image from "next/image";
import { useState, type HTMLAttributes, type ReactNode } from "react";

import { getIconPath } from "@/lib/assets/getIconPath";
import type { IconCategory } from "@/lib/assets/iconTypes";

type AppIconSize = "sm" | "md" | "lg";

type AppIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  category: IconCategory;
  iconKey?: string;
  alt?: string;
  size?: AppIconSize;
  priority?: boolean;
  fallback?: ReactNode;
};

const sizeClasses: Record<AppIconSize, string> = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

const pixelSizes: Record<AppIconSize, number> = {
  sm: 20,
  md: 28,
  lg: 40,
};

export function AppIcon({
  category,
  iconKey,
  alt = "",
  size = "md",
  priority = false,
  fallback = null,
  className,
  ...props
}: AppIconProps) {
  const src = getIconPath({ category, key: iconKey });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const pixels = pixelSizes[size];
  const showFallback = !src || failedSrc === src;
  const accessibilityProps = alt ? { "aria-hidden": undefined } : { "aria-hidden": true };

  if (showFallback && !fallback) {
    return null;
  }

  return (
    <span
      className={["relative inline-flex shrink-0 items-center justify-center overflow-hidden", sizeClasses[size], className]
        .filter(Boolean)
        .join(" ")}
      {...accessibilityProps}
      {...props}
    >
      {showFallback ? (
        fallback
      ) : (
        <Image
          src={src}
          alt={alt}
          width={pixels}
          height={pixels}
          sizes={`${pixels}px`}
          priority={priority}
          className="h-full w-full object-contain"
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  );
}

export type { AppIconSize };
