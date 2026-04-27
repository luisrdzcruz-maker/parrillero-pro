import { cx, ds } from "@/lib/design-system";
import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "accent" | "solidAccent" | "glass" | "selected" | "success" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  accent: ds.badge.accent,
  solidAccent: ds.badge.solidAccent,
  glass: ds.badge.glass,
  selected: ds.badge.selected,
  success: ds.badge.success,
  danger: ds.badge.danger,
};

export function Badge({ children, className = "", tone = "accent", ...props }: BadgeProps) {
  return (
    <span className={cx(ds.badge.base, toneClasses[tone], className)} {...props}>
      {children}
    </span>
  );
}
